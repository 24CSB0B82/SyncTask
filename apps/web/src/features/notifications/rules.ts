import { Notification, Task, NotificationTypeSchema } from '@synctask/shared';

/**
 * Deterministic notification ID generator (prevents duplicates across tabs and devices)
 * id = "<taskId>:<type>:<dueDate>T<dueTime|-->"
 */
export function getNotificationId(
  taskId: string,
  type: 'reminder' | 'overdue',
  dueDate: string,
  dueTime: string | null = null
): string {
  const timePart = dueTime ? dueTime : '--';
  return `${taskId}:${type}:${dueDate}T${timePart}`;
}

/**
 * Computes exact deadline Date in local device time.
 * If no due time is provided, defaults to 09:00 on the due date (Section 4.1 & FR-NOT-1).
 */
export function computeDueAt(dueDate: string, dueTime: string | null = null): Date {
  const [year, month, day] = dueDate.split('-').map(Number);
  const timeString = dueTime || '09:00';
  const [hours, minutes] = timeString.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Computes the reminder fire Date.
 * leadMinutes:
 *  - null: use user default (e.g. 30 min)
 *  - -1: no reminder
 *  - >= 0: fire dueAt minus leadMinutes
 */
export function computeReminderAt(
  dueAt: Date,
  leadMinutes: number | null,
  defaultLeadMinutes: number = 30
): Date | null {
  if (leadMinutes === -1) return null; // No reminder

  const effectiveLead = leadMinutes !== null ? leadMinutes : defaultLeadMinutes;
  return new Date(dueAt.getTime() - effectiveLead * 60 * 1000);
}

/**
 * Checks if current time is within quiet hours window.
 * Supports windows that cross midnight (e.g. 22:00 to 07:00).
 */
export function isQuietNow(
  now: Date,
  quietEnabled: boolean,
  quietStart: string = '22:00',
  quietEnd: string = '07:00'
): boolean {
  if (!quietEnabled) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietStart.split(':').map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = quietEnd.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Window during the same day (e.g. 13:00 to 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Window crosses midnight (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export interface NotificationCheckResult {
  createType: 'reminder' | 'overdue' | null;
  notificationId: string | null;
  fireAt: Date | null;
}

/**
 * Evaluates whether a notification should be created for a task at the current time.
 * Implements Section 4.1 engine rules:
 * - If both reminder and due time have already passed, create only the 'overdue' notification.
 * - Reminder fires when now >= reminderAt and now < dueAt.
 * - Overdue fires when now >= dueAt and task is active.
 */
export function evaluateTaskNotification(
  task: Task,
  existingNotificationIds: Set<string>,
  now: Date = new Date(),
  defaultLeadMinutes: number = 30
): NotificationCheckResult {
  if (task.completed || task.deletedAt || !task.dueDate) {
    return { createType: null, notificationId: null, fireAt: null };
  }

  const dueAt = computeDueAt(task.dueDate, task.dueTime);
  const reminderId = getNotificationId(task.id, 'reminder', task.dueDate, task.dueTime);
  const overdueId = getNotificationId(task.id, 'overdue', task.dueDate, task.dueTime);

  // 1. Check if overdue
  if (now.getTime() >= dueAt.getTime()) {
    if (!existingNotificationIds.has(overdueId)) {
      return {
        createType: 'overdue',
        notificationId: overdueId,
        fireAt: dueAt,
      };
    }
    return { createType: null, notificationId: null, fireAt: null };
  }

  // 2. Check if reminder should fire (now < dueAt)
  const reminderAt = computeReminderAt(dueAt, task.remindBeforeMin, defaultLeadMinutes);
  if (reminderAt && now.getTime() >= reminderAt.getTime()) {
    if (!existingNotificationIds.has(reminderId)) {
      return {
        createType: 'reminder',
        notificationId: reminderId,
        fireAt: reminderAt,
      };
    }
  }

  return { createType: null, notificationId: null, fireAt: null };
}

/**
 * Computes snooze timestamp for snooze options (10m, 1h, tomorrow 09:00)
 */
export function computeSnoozeTime(option: '10m' | '1h' | 'tomorrow', now: Date = new Date()): Date {
  if (option === '10m') {
    return new Date(now.getTime() + 10 * 60 * 1000);
  }
  if (option === '1h') {
    return new Date(now.getTime() + 60 * 60 * 1000);
  }
  // Tomorrow 09:00
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
}
