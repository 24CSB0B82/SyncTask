import { getDb, SyncTaskDatabase } from '../../db/dexie';
import type { SyncPullResponse, SyncPushResponse } from '@synctask/shared';
import { compactOutboxMutations } from './compaction';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncEngineState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  pendingCount: number;
  cursor: number;
  error: string | null;
  isStreaming: boolean;
}

type SyncListener = (state: SyncEngineState) => void;

class SyncEngine {
  private state: SyncEngineState = {
    status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
    lastSyncedAt: null,
    pendingCount: 0,
    cursor: 0,
    error: null,
    isStreaming: false,
  };

  private listeners = new Set<SyncListener>();
  private eventSource: EventSource | null = null;
  private syncTimer: any = null;
  private sseReconnectTimeout: any = null;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.updateState({ status: 'synced', error: null });
        this.sync();
        this.connectStream();
      });

      window.addEventListener('offline', () => {
        this.closeStream();
        this.updateState({ status: 'offline' });
      });

      // Background periodic check every 60s
      this.syncTimer = setInterval(() => {
        if (navigator.onLine) {
          this.sync();
        }
      }, 60000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  public getState(): SyncEngineState {
    return this.state;
  }

  private updateState(partial: Partial<SyncEngineState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l(this.state));
  }

  /**
   * Main synchronization cycle: PUSH pending mutations, then PULL remote delta
   */
  public async sync(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateState({ status: 'offline' });
      return;
    }

    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('st-auth-token') : null;
    const db = getDb();

    // Update pending count from local outbox
    const pendingMutations = await db.outbox.orderBy('seq').toArray();
    this.updateState({ pendingCount: pendingMutations.length });

    if (!token) {
      // Local-only guest mode: no server sync needed
      this.updateState({
        status: 'synced',
        error: null,
      });
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: 'syncing', error: null });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // ------------------------------------
      // PHASE 1: COMPACT & PUSH OUTBOX MUTATIONS
      // ------------------------------------
      if (pendingMutations.length > 0) {
        // Outbox compaction: merge consecutive updates, drop canceled create+delete
        const { compacted, discardedSeqs } = compactOutboxMutations(pendingMutations);
        if (discardedSeqs.length > 0) {
          await db.outbox.bulkDelete(discardedSeqs);
        }

        if (compacted.length > 0) {
          const payload = {
            mutations: compacted.map(({ seq, ...m }) => m),
          };

          const pushRes = await fetch('/api/sync/push', {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(payload),
          });

          if (pushRes.status === 401) {
            // FR-GAP-5: Keep local outbox safe on 401 session expiry
            this.updateState({
              status: 'error',
              error: 'Session expired. Please log in again to sync changes.',
            });
            return;
          }

          if (pushRes.ok) {
            const pushData: SyncPushResponse = await pushRes.json();
            // Remove applied records from Dexie outbox
            const appliedIds = new Set(pushData.applied);
            const seqsToDelete = compacted
              .filter((m) => appliedIds.has(m.mutationId) && m.seq !== undefined)
              .map((m) => m.seq!);

            await db.outbox.bulkDelete(seqsToDelete);
            const remainingCount = await db.outbox.count();
            this.updateState({ pendingCount: remainingCount, cursor: pushData.cursor });
          } else {
            throw new Error(`Sync push failed with status ${pushRes.status}`);
          }
        }
      }

      // ------------------------------------
      // PHASE 2: PULL REMOTE DELTA
      // ------------------------------------
      const metaCursor = await db.meta.get('sync_cursor');
      const sinceCursor = (metaCursor?.value as number) || 0;

      const pullRes = await fetch(`/api/sync/pull?since=${sinceCursor}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (pullRes.status === 401) {
        this.updateState({
          status: 'error',
          error: 'Session expired. Please log in again to sync changes.',
        });
        return;
      }

      if (pullRes.ok) {
        const pullData: SyncPullResponse = await pullRes.json();
        await this.applyPullChanges(db, pullData);
        await db.meta.put({ key: 'sync_cursor', value: pullData.cursor });

        this.updateState({
          status: 'synced',
          cursor: pullData.cursor,
          lastSyncedAt: new Date(),
          error: null,
        });
      } else {
        throw new Error(`Sync pull failed with status ${pullRes.status}`);
      }

      // Ensure SSE connection is active
      this.connectStream();
    } catch (err: any) {
      console.warn('[SyncEngine Error]', err);
      this.updateState({
        status: 'error',
        error: err.message || 'Sync failed',
      });
    } finally {
      this.isSyncing = false;
      const count = await db.outbox.count();
      this.updateState({ pendingCount: count });
    }
  }

  /**
   * Applies downloaded delta changes to Dexie tables
   */
  private async applyPullChanges(db: SyncTaskDatabase, data: SyncPullResponse): Promise<void> {
    const { lists, tasks, subtasks, notifications, settings } = data.changes;

    await db.transaction(
      'rw',
      [db.lists, db.tasks, db.subtasks, db.notifications, db.settings],
      async () => {
        // Lists
        for (const list of lists) {
          if (list.deletedAt) {
            await db.lists.delete(list.id);
          } else {
            await db.lists.put(list);
          }
        }

        // Tasks
        for (const task of tasks) {
          if (task.deletedAt) {
            await db.tasks.delete(task.id);
          } else {
            await db.tasks.put(task);
          }
        }

        // Subtasks
        for (const subtask of subtasks) {
          if (subtask.deletedAt) {
            await db.subtasks.delete(subtask.id);
          } else {
            await db.subtasks.put(subtask);
          }
        }

        // Notifications
        for (const notif of notifications) {
          if (notif.deletedAt) {
            await db.notifications.delete(notif.id);
          } else {
            await db.notifications.put(notif);
          }
        }

        // Settings
        if (settings) {
          await db.settings.put(settings);
        }
      }
    );
  }

  /**
   * Connect to Server-Sent Events stream for real-time live sync push notifications
   */
  public connectStream(): void {
    if (typeof window === 'undefined' || this.eventSource) return;
    const token = localStorage.getItem('st-auth-token');
    if (!token || !navigator.onLine) return;

    try {
      // EventSource with cookie credentials
      this.eventSource = new EventSource('/api/sync/stream');

      this.eventSource.onopen = () => {
        this.updateState({ isStreaming: true });
      };

      this.eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'sync-needed') {
            this.sync();
          }
        } catch {
          // ignore keepalive pings
        }
      };

      this.eventSource.onerror = () => {
        this.closeStream();
        this.updateState({ isStreaming: false });
        // Retry in 10s
        clearTimeout(this.sseReconnectTimeout);
        this.sseReconnectTimeout = setTimeout(() => {
          if (navigator.onLine) {
            this.connectStream();
          }
        }, 10000);
      };
    } catch (err) {
      console.warn('[SSE Connection error]', err);
    }
  }

  public closeStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.updateState({ isStreaming: false });
  }

  public reset(): void {
    this.closeStream();
    this.updateState({
      status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
      lastSyncedAt: null,
      pendingCount: 0,
      cursor: 0,
      error: null,
      isStreaming: false,
    });
  }

  public destroy(): void {
    this.closeStream();
    clearInterval(this.syncTimer);
    clearTimeout(this.sseReconnectTimeout);
    this.listeners.clear();
  }
}

export const syncEngine = new SyncEngine();

/**
 * React hook to observe sync status and actions
 */
export function useSyncEngine(): SyncEngineState & { syncNow: () => Promise<void> } {
  const [state, setState] = React.useState<SyncEngineState>(syncEngine.getState());

  React.useEffect(() => {
    return syncEngine.subscribe(setState);
  }, []);

  return {
    ...state,
    syncNow: () => syncEngine.sync(),
  };
}

import React from 'react';
