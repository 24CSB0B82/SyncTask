import { describe, it, expect } from 'vitest';
import { Task, PRIORITIES } from '@synctask/shared';
import { sortByUrgency } from '../src/features/tasks/urgency';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    userId: 'test-user',
    listId: null,
    title: 'Test',
    description: '',
    dueDate: null,
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

describe('sortByUrgency', () => {
  const reference = new Date(2026, 9, 13, 12, 0, 0); // Oct 13, 2026 12:00

  it('orders: overdue active -> due today -> future -> undated -> completed', () => {
    const overdueTask = makeTask({
      id: 'overdue-1',
      title: 'Overdue task',
      dueDate: '2026-10-10',
    });

    const dueTodayEarly = makeTask({
      id: 'today-early',
      title: 'Due today 14:00',
      dueDate: '2026-10-13',
      dueTime: '14:00',
    });

    const dueTodayLate = makeTask({
      id: 'today-late',
      title: 'Due today 20:00',
      dueDate: '2026-10-13',
      dueTime: '20:00',
    });

    const futureTask = makeTask({
      id: 'future-1',
      title: 'Future task',
      dueDate: '2026-10-20',
      priority: PRIORITIES.HIGH,
    });

    const undatedHigh = makeTask({
      id: 'undated-high',
      title: 'Undated high',
      dueDate: null,
      priority: PRIORITIES.HIGH,
    });

    const undatedLow = makeTask({
      id: 'undated-low',
      title: 'Undated low',
      dueDate: null,
      priority: PRIORITIES.LOW,
    });

    const completedTask = makeTask({
      id: 'completed-1',
      title: 'Completed task',
      dueDate: '2026-10-01',
      completed: true,
      completedAt: '2026-10-12T10:00:00.000Z',
    });

    const tasks = [
      completedTask,
      undatedLow,
      futureTask,
      dueTodayLate,
      overdueTask,
      undatedHigh,
      dueTodayEarly,
    ];

    const sorted = sortByUrgency(tasks, reference);

    expect(sorted.map((t) => t.id)).toEqual([
      'overdue-1',
      'today-early',
      'today-late',
      'future-1',
      'undated-high',
      'undated-low',
      'completed-1',
    ]);
  });
});
