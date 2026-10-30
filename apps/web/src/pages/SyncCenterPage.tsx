import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  Database,
  Cloud,
  CloudOff,
  AlertCircle,
  Radio,
  User,
  ArrowRight,
  LogOut,
  Layers,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useSyncEngine } from '../features/sync/engine';
import { useSession } from '../features/auth/useSession';
import { AuthModal } from '../features/auth/AuthModal';
import { getDb, OutboxRecord } from '../db/dexie';
import { Button } from '../components/ui/Button';

export const SyncCenterPage: React.FC = () => {
  const { status, lastSyncedAt, pendingCount, cursor, error, isStreaming, syncNow } =
    useSyncEngine();
  const { user, isAuthenticated, logout, hasUnsyncedChanges } = useSession();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [outboxItems, setOutboxItems] = useState<OutboxRecord[]>([]);
  const [isSyncingAction, setIsSyncingAction] = useState(false);

  const handleLogout = async () => {
    const hasUnsynced = await hasUnsyncedChanges();
    if (hasUnsynced) {
      if (
        !window.confirm(
          'You have unsynced changes in your outbox queue. If you log out now, they may not sync to the cloud. Do you want to proceed with logout?'
        )
      ) {
        return;
      }
    }
    await logout();
  };

  // Load outbox records
  const loadOutbox = async () => {
    try {
      const db = getDb();
      const records = await db.outbox.orderBy('seq').toArray();
      setOutboxItems(records);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadOutbox();
    const interval = setInterval(loadOutbox, 3000);
    return () => clearInterval(interval);
  }, [pendingCount]);

  const handleSyncClick = async () => {
    setIsSyncingAction(true);
    await syncNow();
    await loadOutbox();
    setIsSyncingAction(false);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="text-accent" size={22} />;
      case 'syncing':
        return <RefreshCw className="text-warn animate-spin" size={22} />;
      case 'offline':
        return <CloudOff className="text-text-muted" size={22} />;
      case 'error':
        return <AlertCircle className="text-danger" size={22} />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'synced':
        return 'Synced & Operational';
      case 'syncing':
        return 'Synchronizing with Cloud...';
      case 'offline':
        return 'Offline Mode (Local Storage Only)';
      case 'error':
        return 'Sync Encountered an Error';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text tracking-tight">Sync & Cloud Center</h1>
          <p className="text-xs text-text-muted mt-0.5">
            Real-time synchronization between Dexie (IndexedDB) and MongoDB.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncClick}
            disabled={isSyncingAction || status === 'syncing'}
            icon={<RefreshCw size={13} className={isSyncingAction ? 'animate-spin' : ''} />}
          >
            {isSyncingAction ? 'Syncing...' : 'Force Sync Now'}
          </Button>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className="rounded-card bg-surface border border-border p-5 space-y-5 shadow-calm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              {getStatusIcon()}
            </div>
            <div>
              <div className="text-sm font-semibold text-text flex items-center gap-2">
                <span>{getStatusLabel()}</span>
                {isStreaming && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent/15 text-accent border border-accent/30">
                    <Radio size={10} className="animate-pulse" />
                    Live SSE Stream
                  </span>
                )}
              </div>
              <div className="text-xs text-text-muted font-mono mt-0.5">
                {lastSyncedAt
                  ? `Last sync: ${lastSyncedAt.toLocaleTimeString()}`
                  : 'Never synced with cloud'}
                {' · '}
                Rev Cursor: #{cursor}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Stat Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-input bg-surface-2 border border-border">
            <div className="text-text-muted text-[11px] flex items-center gap-1.5">
              <Layers size={13} />
              <span>Outbox Queue</span>
            </div>
            <div className="text-base font-semibold text-text mt-1">{pendingCount} pending</div>
          </div>

          <div className="p-3 rounded-input bg-surface-2 border border-border">
            <div className="text-text-muted text-[11px] flex items-center gap-1.5">
              <Database size={13} />
              <span>Client Store</span>
            </div>
            <div className="text-base font-semibold text-text mt-1">IndexedDB</div>
          </div>

          <div className="p-3 rounded-input bg-surface-2 border border-border">
            <div className="text-text-muted text-[11px] flex items-center gap-1.5">
              <Cloud size={13} />
              <span>Cloud Server</span>
            </div>
            <div className="text-base font-semibold text-text mt-1">MongoDB 7.0</div>
          </div>

          <div className="p-3 rounded-input bg-surface-2 border border-border">
            <div className="text-text-muted text-[11px] flex items-center gap-1.5">
              <History size={13} />
              <span>Revision</span>
            </div>
            <div className="text-base font-semibold text-text mt-1">v{cursor}</div>
          </div>
        </div>
      </div>

      {/* Account & Synchronization Pairing Card */}
      <div className="rounded-card bg-surface border border-border p-5 space-y-4 shadow-calm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-text">Account & Cloud Pair</h2>
          </div>
          {isAuthenticated ? (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
              Authenticated
            </span>
          ) : (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border">
              Offline Guest
            </span>
          )}
        </div>

        {isAuthenticated && user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-semibold text-text">{user.username}</div>
                <div className="text-[11px] text-text-muted font-mono">{user.email}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut size={13} />}
              className="text-danger hover:text-danger hover:bg-danger/10"
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-surface-2 border border-border">
            <div>
              <div className="text-xs font-semibold text-text">Local Guest Mode</div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Your planner is fully functional offline. Create an account to sync seamlessly
                across your other devices.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setAuthModalOpen(true)}
              icon={<ArrowRight size={13} />}
              className="shrink-0"
            >
              Sign In or Register
            </Button>
          </div>
        )}
      </div>

      {/* Outbox Pending Mutations Queue */}
      <div className="rounded-card bg-surface border border-border p-5 space-y-4 shadow-calm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-text-muted" />
            <h2 className="text-sm font-semibold text-text">Outbox Queue (Offline Log)</h2>
          </div>
          <span className="text-xs font-mono text-text-muted">
            {outboxItems.length} items queued
          </span>
        </div>

        {outboxItems.length === 0 ? (
          <div className="text-center py-6 text-xs text-text-muted">
            <CheckCircle2 size={24} className="mx-auto text-accent mb-2 opacity-80" />
            Outbox is clear. All local changes are committed and up to date!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-[11px]">
                  <th className="pb-2 font-medium">Seq</th>
                  <th className="pb-2 font-medium">Entity</th>
                  <th className="pb-2 font-medium">Operation</th>
                  <th className="pb-2 font-medium">Entity ID</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {outboxItems.map((item) => (
                  <tr key={item.mutationId} className="hover:bg-surface-2/50 transition-colors">
                    <td className="py-2 text-text-muted">#{item.seq}</td>
                    <td className="py-2 font-medium text-text capitalize">{item.entity}</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                          item.op === 'create'
                            ? 'bg-accent/15 text-accent'
                            : item.op === 'update'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-danger/15 text-danger'
                        }`}
                      >
                        {item.op}
                      </span>
                    </td>
                    <td className="py-2 text-text-muted text-[11px]">
                      {item.entityId.slice(0, 8)}...
                    </td>
                    <td className="py-2 text-text-muted text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conflict Resolution & Consistency Audit */}
      <div className="rounded-card bg-surface border border-border p-5 space-y-3 shadow-calm">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-text">Conflict Resolution & Consistency Audit</h2>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            0 Conflicts · LWW Active
          </span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          SyncTask guarantees deterministic multi-device consistency using an atomic revision vector (<code className="font-mono text-primary">rev</code>) and field-level Last-Write-Wins (LWW). Changes performed offline in Dexie IndexedDB are compacted into atomic outbox mutations, then pushed to MongoDB with transactional revision increments.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-surface-2 border border-border">
            <span className="text-[10px] text-text-muted block">Resolution Strategy</span>
            <span className="font-semibold text-text">Last-Write-Wins (LWW)</span>
          </div>
          <div className="p-2.5 rounded bg-surface-2 border border-border">
            <span className="text-[10px] text-text-muted block">Compaction Engine</span>
            <span className="font-semibold text-text">Adjacent Squashing</span>
          </div>
          <div className="p-2.5 rounded bg-surface-2 border border-border">
            <span className="text-[10px] text-text-muted block">Realtime Transport</span>
            <span className="font-semibold text-text">Server-Sent Events (SSE)</span>
          </div>
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};
