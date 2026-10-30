import type { Task, Notification, UserSettings } from '@synctask/shared';
import { getDb } from '../../db/dexie';
import { DEMO_USER_ID } from '../../db/activeUser';
import { evaluateTaskNotification, isQuietNow, computeSnoozeTime } from './rules';
import {
  createNotification,
  dismissNotification,
  snoozeNotification,
  toggleTaskComplete,
} from '../../db/repositories';
import { useToast } from '../../components/ui/Toast';

export interface SchedulerCallbacks {
  onShowToast: (toast: {
    title: string;
    description?: string;
    durationMs?: number;
    action?: {
      label: string;
      onClick: () => void;
      variant?: 'primary' | 'secondary';
    };
  }) => void;
  onNavigateTask?: (taskId: string) => void;
}

class ReminderScheduler {
  private isLeader = false;
  private intervalId: number | null = null;
  private userId = DEMO_USER_ID;
  private callbacks: SchedulerCallbacks | null = null;
  private isFirstRun = true;
  private abortController: AbortController | null = null;

  public init(userId: string = DEMO_USER_ID, callbacks: SchedulerCallbacks) {
    this.userId = userId;
    this.callbacks = callbacks;

    // Acquire tab leader lock using Web Locks API (Section 4.1)
    if (typeof navigator !== 'undefined' && 'locks' in navigator) {
      this.abortController = new AbortController();
      navigator.locks
        .request('synctask-scheduler', { signal: this.abortController.signal }, async () => {
          this.isLeader = true;
          this.startLoop();

          // Keep lock alive until window unloads
          return new Promise<void>((resolve) => {
            window.addEventListener('beforeunload', () => resolve());
          });
        })
        .catch(() => {
          // Another tab is currently leader; this tab is backup
          this.isLeader = false;
        });
    } else {
      // Fallback for environments without Web Locks API
      this.isLeader = true;
      this.startLoop();
    }

    // Secondary triggers: visibilitychange, online
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkNow();
        }
      });
      window.addEventListener('online', () => {
        this.checkNow();
      });
    }
  }

  public triggerCheck() {
    if (this.isLeader) {
      this.checkNow();
    }
  }

  private startLoop() {
    this.checkNow();

    // 30 second polling interval as specified
    if (typeof window !== 'undefined') {
      this.intervalId = window.setInterval(() => {
        this.checkNow();
      }, 30000);
    }
  }

  public async checkNow() {
    if (!this.isLeader) return;

    try {
      const db = getDb(this.userId);
      const now = new Date();

      // Read tasks and settings
      const tasks = await db.tasks
        .filter((t) => t.deletedAt === null && !t.completed && t.dueDate !== null)
        .toArray();

      const settings = (await db.settings.get(this.userId)) || {
        defaultReminderMin: 30,
        quietEnabled: false,
        quietStart: '22:00',
        quietEnd: '07:00',
        browserNotifications: false,
      };

      const existingNotifs = await db.notifications.filter((n) => n.deletedAt === null).toArray();

      const existingIds = new Set(existingNotifs.map((n) => n.id));

      // 1. Process Snooze expirations
      for (const notif of existingNotifs) {
        if (notif.snoozedUntil && !notif.dismissedAt) {
          const snoozedDate = new Date(notif.snoozedUntil);
          if (now.getTime() >= snoozedDate.getTime()) {
            // Snooze ended: restore to unread and show toast
            await db.notifications.update(notif.id, {
              snoozedUntil: null,
              readAt: null,
              updatedAt: now.toISOString(),
            });

            const task = tasks.find((t) => t.id === notif.taskId);
            const quiet = isQuietNow(
              now,
              settings.quietEnabled,
              settings.quietStart,
              settings.quietEnd
            );

            if (!quiet && this.callbacks && task) {
              this.callbacks.onShowToast({
                title: notif.type === 'overdue' ? 'Task Overdue' : 'Task Reminder',
                description: `"${task.title}" snooze ended.`,
                durationMs: 6000,
                action: {
                  label: 'Snooze',
                  onClick: () => {
                    const nextSnooze = computeSnoozeTime('10m', new Date());
                    snoozeNotification(notif.id, nextSnooze.toISOString(), this.userId);
                  },
                },
              });
            }
          }
        }
      }

      // 2. Evaluate task reminders & overdue alerts
      const missedReminders: Array<{ task: Task; type: 'reminder' | 'overdue' }> = [];
      const freshReminders: Array<{ task: Task; type: 'reminder' | 'overdue'; notifId: string }> =
        [];

      for (const task of tasks) {
        const result = evaluateTaskNotification(
          task,
          existingIds,
          now,
          settings.defaultReminderMin ?? 30
        );

        if (result.createType && result.notificationId && result.fireAt) {
          const newNotif: Notification = {
            id: result.notificationId,
            userId: this.userId,
            taskId: task.id,
            type: result.createType,
            fireAt: result.fireAt.toISOString(),
            readAt: null,
            snoozedUntil: null,
            dismissedAt: null,
            rev: 0,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            deletedAt: null,
          };

          await createNotification(newNotif, this.userId);
          existingIds.add(result.notificationId);

          // Check if missed while app was closed (FR-NOT-8): fireAt older than 2 minutes on first run
          const fireAgeMs = now.getTime() - result.fireAt.getTime();
          if (this.isFirstRun && fireAgeMs > 2 * 60 * 1000) {
            missedReminders.push({ task, type: result.createType });
          } else {
            freshReminders.push({ task, type: result.createType, notifId: result.notificationId });
          }
        }
      }

      const quiet = isQuietNow(now, settings.quietEnabled, settings.quietStart, settings.quietEnd);

      // Handle grouped missed reminders on app start (FR-NOT-8)
      if (missedReminders.length > 0 && !quiet && this.callbacks) {
        this.callbacks.onShowToast({
          title: `You have ${missedReminders.length} missed ${
            missedReminders.length === 1 ? 'reminder' : 'reminders'
          }`,
          description: 'Check the notification bell in the header for details.',
          durationMs: 7000,
        });
      }

      // Handle fresh reminders with individual toast (FR-NOT-3)
      if (!quiet && this.callbacks) {
        for (const item of freshReminders) {
          this.callbacks.onShowToast({
            title: item.type === 'overdue' ? 'Task Overdue' : 'Due Soon',
            description: `"${item.task.title}"`,
            durationMs: 6000,
            action: {
              label: 'Snooze 10m',
              onClick: () => {
                const snoozeUntil = computeSnoozeTime('10m', new Date());
                snoozeNotification(item.notifId, snoozeUntil.toISOString(), this.userId);
              },
            },
          });

          // Browser notification if app not focused and permission granted (FR-NOT-7)
          if (
            settings.browserNotifications &&
            typeof document !== 'undefined' &&
            document.hidden &&
            typeof Notification !== 'undefined' &&
            Notification.permission === 'granted'
          ) {
            new Notification(item.type === 'overdue' ? 'Task Overdue' : 'Upcoming Task Deadline', {
              body: item.task.title,
              icon: '/favicon.svg',
            });
          }
        }
      }

      this.isFirstRun = false;
    } catch (err) {
      console.error('[ReminderScheduler Error]', err);
    }
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.abortController) {
      this.abortController.abort();
    }
    this.isLeader = false;
  }
}

export const scheduler = new ReminderScheduler();
