import { describe, it, expect } from 'vitest';
import { formatDueChip } from '../src/lib/dates';

describe('formatDueChip', () => {
  const reference = new Date(2026, 9, 13, 12, 0, 0); // Oct 13, 2026 12:00

  it('returns null when no due date', () => {
    expect(formatDueChip(null, null, false, reference)).toBeNull();
  });

  it('formats today with time', () => {
    const chip = formatDueChip('2026-10-13', '18:00', false, reference);
    expect(chip).toEqual({
      text: 'Today 18:00',
      isOverdue: false,
    });
  });

  it('formats tomorrow without time', () => {
    const chip = formatDueChip('2026-10-14', null, false, reference);
    expect(chip).toEqual({
      text: 'Tomorrow',
      isOverdue: false,
    });
  });

  it('formats future date', () => {
    const chip = formatDueChip('2026-10-24', null, false, reference);
    expect(chip).toEqual({
      text: 'Oct 24',
      isOverdue: false,
    });
  });

  it('formats overdue date in warning format (FR-TASK-5)', () => {
    const chip = formatDueChip('2026-10-10', null, false, reference);
    expect(chip).toEqual({
      text: 'Overdue · Oct 10',
      isOverdue: true,
    });
  });

  it('formats overdue today when time passed', () => {
    const chip = formatDueChip('2026-10-13', '09:00', false, reference);
    expect(chip).toEqual({
      text: 'Overdue · Today 09:00',
      isOverdue: true,
    });
  });

  it('does not mark completed task as overdue', () => {
    const chip = formatDueChip('2026-10-10', null, true, reference);
    expect(chip?.isOverdue).toBe(false);
  });
});
