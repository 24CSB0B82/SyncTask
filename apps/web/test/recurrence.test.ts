import { describe, it, expect } from 'vitest';
import { computeNextRecurringDate } from '../src/lib/dates';

describe('Recurring Tasks Engine', () => {
  it('computes daily next recurrence correctly', () => {
    const next = computeNextRecurringDate('2026-10-15', 'daily');
    expect(next).toBe('2026-10-16');
  });

  it('computes weekly next recurrence correctly', () => {
    const next = computeNextRecurringDate('2026-10-15', 'weekly');
    expect(next).toBe('2026-10-22');
  });

  it('computes monthly next recurrence correctly', () => {
    const next = computeNextRecurringDate('2026-10-15', 'monthly');
    expect(next).toBe('2026-11-15');
  });

  it('computes weekdays recurrence on Friday to Monday', () => {
    // 2026-10-16 is a Friday
    const next = computeNextRecurringDate('2026-10-16', 'weekdays');
    expect(next).toBe('2026-10-19'); // Monday
  });

  it('computes weekdays recurrence on mid-week days to next day', () => {
    // 2026-10-14 is a Wednesday
    const next = computeNextRecurringDate('2026-10-14', 'weekdays');
    expect(next).toBe('2026-10-15'); // Thursday
  });
});
