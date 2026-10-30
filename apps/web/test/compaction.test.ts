import { describe, it, expect } from 'vitest';
import { compactOutboxMutations } from '../src/features/sync/compaction';
import { OutboxRecord } from '../src/db/dexie';

describe('Outbox Compaction', () => {
  it('merges consecutive updates for the same entity', () => {
    const records: OutboxRecord[] = [
      {
        seq: 1,
        mutationId: 'm1',
        entity: 'task',
        entityId: 't1',
        op: 'update',
        patch: { title: 'First Title' },
        createdAt: new Date().toISOString(),
      },
      {
        seq: 2,
        mutationId: 'm2',
        entity: 'task',
        entityId: 't1',
        op: 'update',
        patch: { description: 'New description', title: 'Second Title' },
        createdAt: new Date().toISOString(),
      },
    ];

    const { compacted, discardedSeqs } = compactOutboxMutations(records);
    expect(compacted).toHaveLength(1);
    expect(compacted[0].op).toBe('update');
    expect(compacted[0].patch).toEqual({
      title: 'Second Title',
      description: 'New description',
    });
    expect(discardedSeqs).toContain(2);
  });

  it('cancels out create followed by delete completely', () => {
    const records: OutboxRecord[] = [
      {
        seq: 10,
        mutationId: 'm10',
        entity: 'task',
        entityId: 'temp-1',
        op: 'create',
        patch: { title: 'Temporary Task' },
        createdAt: new Date().toISOString(),
      },
      {
        seq: 11,
        mutationId: 'm11',
        entity: 'task',
        entityId: 'temp-1',
        op: 'update',
        patch: { description: 'Updated before delete' },
        createdAt: new Date().toISOString(),
      },
      {
        seq: 12,
        mutationId: 'm12',
        entity: 'task',
        entityId: 'temp-1',
        op: 'delete',
        patch: {},
        createdAt: new Date().toISOString(),
      },
    ];

    const { compacted, discardedSeqs } = compactOutboxMutations(records);
    expect(compacted).toHaveLength(0);
    expect(discardedSeqs).toEqual(expect.arrayContaining([10, 11, 12]));
  });

  it('preserves separate entities cleanly', () => {
    const records: OutboxRecord[] = [
      {
        seq: 1,
        mutationId: 'm1',
        entity: 'task',
        entityId: 't1',
        op: 'update',
        patch: { title: 'Task 1' },
        createdAt: new Date().toISOString(),
      },
      {
        seq: 2,
        mutationId: 'm2',
        entity: 'task',
        entityId: 't2',
        op: 'update',
        patch: { title: 'Task 2' },
        createdAt: new Date().toISOString(),
      },
    ];

    const { compacted, discardedSeqs } = compactOutboxMutations(records);
    expect(compacted).toHaveLength(2);
    expect(discardedSeqs).toHaveLength(0);
  });
});
