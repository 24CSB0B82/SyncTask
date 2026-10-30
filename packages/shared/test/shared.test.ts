import { describe, it, expect } from 'vitest';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  SUBTASK_PALETTE_ORDER,
  SUBTASK_PALETTE,
  TaskSchema,
  SubtaskSchema,
} from '../src';

describe('@synctask/shared', () => {
  it('defines priorities correctly', () => {
    expect(PRIORITIES.LOW).toBe(0);
    expect(PRIORITIES.MEDIUM).toBe(1);
    expect(PRIORITIES.HIGH).toBe(2);
    expect(PRIORITY_LABELS[PRIORITIES.HIGH]).toBe('High');
  });

  it('defines exactly 8 distinct subtask colors in order', () => {
    expect(SUBTASK_PALETTE_ORDER).toHaveLength(8);
    SUBTASK_PALETTE_ORDER.forEach((key) => {
      expect(SUBTASK_PALETTE[key]).toBeDefined();
      expect(SUBTASK_PALETTE[key].light).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(SUBTASK_PALETTE[key].dark).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('validates a correct task schema', () => {
    const valid = TaskSchema.safeParse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      userId: 'user-123',
      title: 'Test task',
      description: 'Test description',
      priority: 1,
      completed: false,
      rev: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
    expect(valid.success).toBe(true);
  });

  it('validates subtask schema with color rotation', () => {
    const valid = SubtaskSchema.safeParse({
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      userId: 'user-123',
      taskId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Configure schemas',
      done: false,
      color: 'emerald',
      position: 0,
      rev: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    });
    expect(valid.success).toBe(true);
  });
});
