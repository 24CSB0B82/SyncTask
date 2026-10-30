import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Bell, Clock, AlertCircle, CheckCircle2, X, MoreHorizontal, Check } from 'lucide-react';
import { Notification, Task } from '@synctask/shared';
import { Popover } from '../../components/ui/Popover';
import {
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  snoozeNotification,
  toggleTaskComplete,
} from '../../db/repositories';
import { computeSnoozeTime } from './rules';
import { useToast } from '../../components/ui/Toast';

interface BellDropdownProps {
  notifications: Notification[];
  tasks: Task[];
  onOpenTask?: (taskId: string) => void;
}

export const BellDropdown: React.FC<BellDropdownProps> = ({ notifications, tasks, onOpenTask }) => {
  const { show: showToast } = useToast();

  // Active notifications (not dismissed, not currently snoozed in the future)
  const now = new Date();
  const visibleNotifications = notifications
    .filter((n) => {
      if (n.dismissedAt !== null || n.deletedAt !== null) return false;
      if (n.snoozedUntil && new Date(n.snoozedUntil) > now) return false;
      return true;
    })
    .sort((a, b) => new Date(b.fireAt).getTime() - new Date(a.fireAt).getTime());

  const unreadCount = visibleNotifications.filter((n) => n.readAt === null).length;

  const handleSnooze = async (id: string, option: '10m' | '1h' | 'tomorrow') => {
    const snoozeDate = computeSnoozeTime(option, new Date());
    await snoozeNotification(id, snoozeDate.toISOString());
    showToast({
      title: 'Reminder snoozed',
      description: `Snoozed until ${snoozeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    });
  };

  const handleCompleteTask = async (taskId: string, notifId: string) => {
    await toggleTaskComplete(taskId, true);
    await dismissNotification(notifId);
    showToast({ title: 'Task completed', type: 'success' });
  };

  const trigger = (
    <button
      type="button"
      className="relative p-1.5 rounded-input text-text-muted hover:text-text hover:bg-surface-2 transition-colors select-none focus-visible:outline-2 focus-visible:outline-primary"
      aria-label="Open notifications"
    >
      <Bell size={16} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-prio-high ring-2 ring-surface animate-pulse" />
      )}
    </button>
  );

  return (
    <Popover trigger={trigger} align="end">
      <div className="w-80 sm:w-96 max-h-[70vh] flex flex-col -m-1">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-text">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllNotificationsRead()}
              className="text-[11px] text-text-muted hover:text-text font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List of items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {visibleNotifications.length > 0 ? (
            visibleNotifications.map((notif) => {
              const task = tasks.find((t) => t.id === notif.taskId);
              const isUnread = notif.readAt === null;

              return (
                <div
                  key={notif.id}
                  className={`p-3 transition-colors hover:bg-surface-2/70 ${
                    isUnread ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Icon */}
                    <div
                      className={`p-1.5 rounded-input shrink-0 mt-0.5 ${
                        notif.type === 'overdue'
                          ? 'bg-prio-high/15 text-prio-high'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      {notif.type === 'overdue' ? <AlertCircle size={14} /> : <Clock size={14} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-text leading-tight truncate">
                          {notif.type === 'overdue' ? 'Task Overdue' : 'Due Soon'}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted shrink-0">
                          {formatDistanceToNow(new Date(notif.fireAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-text-muted mt-0.5 font-medium truncate">
                        {task?.title || 'Task'}
                      </p>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-1">
                        {task && (
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(notif.id);
                              onOpenTask?.(task.id);
                            }}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            Open
                          </button>
                        )}

                        {/* Snooze dropdown/actions */}
                        <div className="flex items-center gap-1 text-[11px] text-text-muted">
                          <button
                            type="button"
                            onClick={() => handleSnooze(notif.id, '10m')}
                            className="hover:text-text px-1 py-0.5 rounded hover:bg-surface"
                          >
                            Snooze 10m
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => handleSnooze(notif.id, '1h')}
                            className="hover:text-text px-1 py-0.5 rounded hover:bg-surface"
                          >
                            1h
                          </button>
                        </div>

                        {task && (
                          <button
                            type="button"
                            onClick={() => handleCompleteTask(task.id, notif.id)}
                            className="text-[11px] font-medium text-accent hover:underline ml-auto"
                          >
                            Mark done
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => dismissNotification(notif.id)}
                          className="p-0.5 text-text-muted hover:text-text rounded ml-1"
                          aria-label="Dismiss"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-text-muted">
              <CheckCircle2 size={24} className="mx-auto mb-2 text-accent/80" />
              <span>You're all caught up.</span>
            </div>
          )}
        </div>
      </div>
    </Popover>
  );
};
