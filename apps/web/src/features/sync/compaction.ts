import { OutboxRecord } from '../../db/dexie';

export interface CompactionResult {
  compacted: OutboxRecord[];
  discardedSeqs: number[];
}

/**
 * Compacts outbox mutations according to Section 8.3:
 * - Consecutive updates to the same entity are merged into one patch.
 * - Create followed by delete cancels out completely (neither needs to be sent to server).
 * - Updates followed by delete are superseded by the delete.
 */
export function compactOutboxMutations(mutations: OutboxRecord[]): CompactionResult {
  const discardedSeqs: number[] = [];
  const entityGroups = new Map<string, OutboxRecord[]>();

  for (const m of mutations) {
    const key = `${m.entity}:${m.entityId}`;
    const group = entityGroups.get(key) || [];
    group.push(m);
    entityGroups.set(key, group);
  }

  const compacted: OutboxRecord[] = [];

  for (const [, group] of entityGroups) {
    let currentOp: 'create' | 'update' | 'delete' | null = null;
    let accumulatedPatch: Record<string, unknown> = {};
    let representativeMutation: OutboxRecord | null = null;
    const groupSeqs: number[] = [];

    for (const m of group) {
      if (m.seq !== undefined) {
        groupSeqs.push(m.seq);
      }

      if (currentOp === null) {
        currentOp = m.op;
        accumulatedPatch = { ...m.patch };
        representativeMutation = { ...m };
      } else if (currentOp === 'create') {
        if (m.op === 'update') {
          // Merge update into create
          accumulatedPatch = { ...accumulatedPatch, ...m.patch };
        } else if (m.op === 'delete') {
          // Create + Delete cancels out completely
          currentOp = null;
          representativeMutation = null;
          accumulatedPatch = {};
        }
      } else if (currentOp === 'update') {
        if (m.op === 'update') {
          // Merge consecutive updates
          accumulatedPatch = { ...accumulatedPatch, ...m.patch };
        } else if (m.op === 'delete') {
          // Update followed by delete becomes just delete
          currentOp = 'delete';
          accumulatedPatch = {};
          representativeMutation = { ...m };
        }
      } else if (currentOp === 'delete') {
        // Delete wins over any subsequent operations
        continue;
      }
    }

    if (representativeMutation && currentOp !== null) {
      compacted.push({
        ...representativeMutation,
        op: currentOp,
        patch: accumulatedPatch,
      });
      // All earlier seqs in this group except the chosen representative can be marked discarded
      const keptSeq = representativeMutation.seq;
      for (const s of groupSeqs) {
        if (s !== keptSeq) {
          discardedSeqs.push(s);
        }
      }
    } else {
      // Entire group canceled out (e.g. create + delete)
      discardedSeqs.push(...groupSeqs);
    }
  }

  // Preserve stable ordering based on seq
  compacted.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  return { compacted, discardedSeqs };
}
