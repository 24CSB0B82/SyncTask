import { describe, it, expect } from 'vitest';
import { Task, PRIORITIES } from '@synctask/shared';
import {
  getNotificationId,
  computeDueAt,
  computeReminderAt,
  isQuietNow,
  evaluateTaskNotification,
  computeSnoozeTime,
} from '../src/features/notifications/rules';

describe('Notification Rules Engine (Section 4.1)', () => {
  it('generates deterministic notification IDs', () => {
    const idWithTime = getNotificationId('task-1', 'reminder', '2026-10-24', '18:00');
    expect(idWithTime).toBe('task-1:reminder:2026-10-24T18:00');

    const idWithoutTime = getNotificationId('task-1', 'overdue', '2026-10-24', null);
    expect(idWithoutTime).toBe('task-1:overdue:2026-10-24T--');
  });

  it('computes due date defaulting to 09:00 when no time specified (FR-NOT-1)', () => {
    const dueAt = computeDueAt('2026-10-24', null);
    expect(dueAt.getFullYear()).toBe(2026);
    expect(dueAt.getMonth()).toBe(9); // 0-indexed October
    expect(dueAt.getDate()).toBe(24);
    expect(dueAt.getHours()).toBe(9);
    expect(dueAt.getMinutes()).toBe(0);

    const dueAtWithTime = computeDueAt('2026-10-24', '14:30');
    expect(dueAtWithTime.getHours()).toBe(14);
    expect(dueAtWithTime.getMinutes()).toBe(30);
  });

  it('computes reminder fire time subtracting lead minutes', () => {
    const dueAt = new Date(2026, 9, 24, 18, 0, 0);

    // 30 min before
    const rem30 = computeReminderAt(dueAt, 30);
    expect(rem30?.getHours()).toBe(17);
    expect(rem30?.getMinutes()).toBe(30);

    // null uses default (e.g. 15 min)
    const remDefault = computeReminderAt(dueAt, null, 15);
    expect(remDefault?.getHours()).toBe(17);
    expect(remDefault?.getMinutes()).toBe(45);

    // -1 means no reminder
    const remNone = computeReminderAt(dueAt, -1);
    expect(remNone).toBeNull();
  });

  it('handles quiet hours crossing midnight correctly (FR-NOT-6)', () => {
    // Window: 22:00 to 07:00
    const at2330 = new Date(2026, 9, 24, 23, 30);
    expect(isQuietNow(at2330, true, '22:00', '07:00')).toBe(true);

    const at0300 = new Date(2026, 9, 25, 3, 0);
    expect(isQuietNow(at0300, true, '22:00', '07:00')).toBe(true);

    const at0800 = new Date(2026, 9, 25, 8, 0);
    expect(isQuietNow(at0800, true, '22:00', '07:00')).toBe(false);

    const at1500 = new Date(2026, 9, 25, 15, 0);
    expect(isQuietNow(at1500, true, '22:00', '07:00')).toBe(false);

    // Quiet hours disabled
    expect(isQuietNow(at2330, false, '22:00', '07:00')).toBe(false);
  });

  it('evaluates task notification triggers accurately', () => {
    const task: Task = {
      id: 'task-abc',
      userId: 'test',
      listId: null,
      title: 'Submit report',
      description: '',
      dueDate: '2026-10-13',
      dueTime: '15:00',
      priority: PRIORITIES.HIGH,
      tags: [],
      completed: false,
      completedAt: null,
      remindBeforeMin: 30, // fire at 14:30
      rev: 0,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      deletedAt: null,
    };

    const existingIds = new Set<string>();

    // Before reminder time (14:00)
    const resEarly = evaluateTaskNotification(task, existingIds, new Date(2026, 9, 13, 14, 0));
    expect(resEarly.createType).toBeNull();

    // At reminder time (14:35)
    const resReminder = evaluateTaskNotification(task, existingIds, new Date(2026, 9, 13, 14, 35));
    expect(resReminder.createType).toBe('reminder');
    expect(resReminder.notificationId).toBe('task-abc:reminder:2026-10-13T15:00');

    // Overdue time (15:05)
    const resOverdue = evaluateTaskNotification(task, existingIds, new Date(2026, 9, 13, 15, 5));
    expect(resOverdue.createType).toBe('overdue');
    expect(resOverdue.notificationId).toBe('task-abc:overdue:2026-10-13T15:00');

    // Already created
    existingIds.add('task-abc:overdue:2026-10-13T15:00');
    const resDuplicate = evaluateTaskNotification(task, existingIds, new Date(2026, 9, 13, 15, 5));
    expect(resDuplicate.createType).toBeNull();
  });

  it('computes snooze timestamps', () => {
    const now = new Date(2026, 9, 13, 10, 0, 0);

    const s10m = computeSnoozeTime('10m', now);
    expect(s10m.getTime() - now.getTime()).toBe(10 * 60 * 1000);

    const s1h = computeSnoozeTime('1h', now);
    expect(s1h.getTime() - now.getTime()).toBe(60 * 60 * 1000);

    const sTomorrow = computeSnoozeTime('tomorrow', now);
    expect(sTomorrow.getDate()).toBe(14);
    expect(sTomorrow.getHours()).toBe(9);
  });
});
