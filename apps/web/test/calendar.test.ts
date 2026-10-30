import { describe, it, expect } from 'vitest';
import { Task, PRIORITIES } from '@synctask/shared';
import { getCalendarGridDays } from '../src/features/calendar/calendarUtils';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    userId: 'test-user',
    listId: null,
    title: 'Test',
    description: '',
    dueDate: '2026-10-15',
    dueTime: null,
    priority: PRIORITIES.MEDIUM,
    tags: [],
    completed: false,
    completedAt: null,
    remindBeforeMin: null,
    rev: 0,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('Calendar utilities (FR-CAL-1, FR-CAL-2)', () => {
  const month = new Date(2026, 9, 1); // October 2026

  it('generates grid days with Monday start (FR-CAL-1)', () => {
    const days = getCalendarGridDays(month, [], 1);
    expect(days.length).toBeGreaterThanOrEqual(28);
    // First day of Monday-started calendar grid for Oct 2026 should be Monday Sep 28
    expect(days[0].date.getDay()).toBe(1); // Monday
  });

  it('groups tasks onto corresponding day with max 4 circles and overflow (FR-CAL-2)', () => {
    const tasks: Task[] = [
      makeTask({ id: 't1', dueDate: '2026-10-15', dueTime: '10:00', priority: PRIORITIES.HIGH }),
      makeTask({ id: 't2', dueDate: '2026-10-15', dueTime: null, priority: PRIORITIES.MEDIUM }),
      makeTask({ id: 't3', dueDate: '2026-10-15', dueTime: '18:00', priority: PRIORITIES.LOW }),
      makeTask({
        id: 't4',
        dueDate: '2026-10-15',
        dueTime: '20:00',
        completed: true,
        priority: PRIORITIES.HIGH,
      }),
      makeTask({ id: 't5', dueDate: '2026-10-15', dueTime: '22:00', priority: PRIORITIES.LOW }),
    ];

    const days = getCalendarGridDays(month, tasks, 1);
    const day15 = days.find((d) => d.dateStr === '2026-10-15');

    expect(day15).toBeDefined();
    expect(day15?.tasks.length).toBe(5);
    // At most 4 circles
    expect(day15?.circles.length).toBe(4);
    // Overflow count is 1
    expect(day15?.overflowCount).toBe(1);
    // All day task is sorted first
    expect(day15?.tasks[0].id).toBe('t2');
    // Completed task has completed: true (renders as hollow ring)
    const completedCircle = day15?.circles.find((c) => c.id === 't4');
    expect(completedCircle?.completed).toBe(true);
  });
});
