import { describe, it, expect } from 'vitest';
import { Task, Subtask, PRIORITIES } from '@synctask/shared';
import { filterTasks } from '../src/features/tasks/filters';

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

describe('filterTasks', () => {
  const reference = new Date(2026, 9, 13, 12, 0, 0); // Oct 13, 2026

  const t1 = makeTask({
    id: '1',
    title: 'Fix auth bug',
    description: 'Resolve token refresh issue',
    tags: ['auth', 'backend'],
    priority: PRIORITIES.HIGH,
    dueDate: '2026-10-13',
  });

  const t2 = makeTask({
    id: '2',
    title: 'Update design system',
    description: 'Add coral token',
    tags: ['design'],
    priority: PRIORITIES.LOW,
    dueDate: '2026-10-18', // upcoming
  });

  const t3 = makeTask({
    id: '3',
    title: 'Old overdue task',
    tags: ['ops'],
    priority: PRIORITIES.MEDIUM,
    dueDate: '2026-10-05', // overdue
  });

  const t4 = makeTask({
    id: '4',
    title: 'Archived finished task',
    completed: true,
    completedAt: '2026-10-12T12:00:00.000Z',
  });

  const tDeleted = makeTask({
    id: 'del',
    title: 'Deleted task',
    deletedAt: '2026-10-12T12:00:00.000Z',
  });

  const tasks = [t1, t2, t3, t4, tDeleted];

  it('excludes soft-deleted tasks', () => {
    const res = filterTasks(tasks, [], {}, reference);
    expect(res.find((t) => t.id === 'del')).toBeUndefined();
  });

  it('filters by status: active vs completed', () => {
    const active = filterTasks(tasks, [], { statusTab: 'active' }, reference);
    expect(active.map((t) => t.id)).toEqual(['1', '2', '3']);

    const completed = filterTasks(tasks, [], { statusTab: 'completed' }, reference);
    expect(completed.map((t) => t.id)).toEqual(['4']);
  });

  it('filters by smart view: today', () => {
    const today = filterTasks(tasks, [], { smartView: 'today' }, reference);
    expect(today.map((t) => t.id)).toEqual(['1']);
  });

  it('filters by smart view: upcoming', () => {
    const upcoming = filterTasks(tasks, [], { smartView: 'upcoming' }, reference);
    expect(upcoming.map((t) => t.id)).toEqual(['2']);
  });

  it('filters by smart view: overdue', () => {
    const overdue = filterTasks(tasks, [], { smartView: 'overdue' }, reference);
    expect(overdue.map((t) => t.id)).toEqual(['3']);
  });

  it('filters by priority and tags', () => {
    const high = filterTasks(tasks, [], { priority: PRIORITIES.HIGH }, reference);
    expect(high.map((t) => t.id)).toEqual(['1']);

    const tagged = filterTasks(tasks, [], { tag: 'design' }, reference);
    expect(tagged.map((t) => t.id)).toEqual(['2']);
  });

  it('searches across title, description, tags, and subtasks', () => {
    const subtasks: Subtask[] = [
      {
        id: 's-1',
        userId: 'test-user',
        taskId: '2',
        title: 'Check color contrast in Figma',
        done: false,
        color: 'emerald',
        position: 0,
        rev: 0,
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-01T10:00:00.000Z',
        deletedAt: null,
      },
    ];

    const matchTitle = filterTasks(tasks, subtasks, { searchQuery: 'auth' }, reference);
    expect(matchTitle.map((t) => t.id)).toEqual(['1']);

    const matchDesc = filterTasks(tasks, subtasks, { searchQuery: 'coral' }, reference);
    expect(matchDesc.map((t) => t.id)).toEqual(['2']);

    const matchSubtask = filterTasks(tasks, subtasks, { searchQuery: 'figma' }, reference);
    expect(matchSubtask.map((t) => t.id)).toEqual(['2']);
  });
});
