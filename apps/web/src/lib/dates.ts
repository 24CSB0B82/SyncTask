import { format, parseISO, startOfDay, isBefore, isSameDay, addDays, subDays } from 'date-fns';

export interface DueChipInfo {
  text: string;
  isOverdue: boolean;
}

/**
 * Format due date and optional due time into human-friendly due chip text.
 * Floating local dates are represented as 'YYYY-MM-DD' and times as 'HH:mm'.
 */
export function formatDueChip(
  dueDate: string | null,
  dueTime: string | null = null,
  completed: boolean = false,
  referenceDate: Date = new Date()
): DueChipInfo | null {
  if (!dueDate) return null;

  try {
    const [year, month, day] = dueDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);

    // Compute exact deadline for overdue calculation
    let deadline: Date;
    if (dueTime) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      deadline = new Date(year, month - 1, day, hours, minutes);
    } else {
      // Undated times default to end of day (23:59:59) for overdue check
      deadline = new Date(year, month - 1, day, 23, 59, 59);
    }

    const isOverdue = !completed && isBefore(deadline, referenceDate);
    const timeSuffix = dueTime ? ` ${dueTime}` : '';

    const isDateToday = isSameDay(dateObj, referenceDate);
    const isDateTomorrow = isSameDay(dateObj, addDays(referenceDate, 1));
    const isDateYesterday = isSameDay(dateObj, subDays(referenceDate, 1));

    if (isOverdue) {
      if (isDateToday) {
        return {
          text: `Overdue · Today${timeSuffix}`,
          isOverdue: true,
        };
      }
      return {
        text: `Overdue · ${format(dateObj, 'MMM d')}${timeSuffix}`,
        isOverdue: true,
      };
    }

    if (isDateToday) {
      return {
        text: `Today${timeSuffix}`,
        isOverdue: false,
      };
    }

    if (isDateTomorrow) {
      return {
        text: `Tomorrow${timeSuffix}`,
        isOverdue: false,
      };
    }

    if (isDateYesterday) {
      return {
        text: `Yesterday${timeSuffix}`,
        isOverdue: !completed,
      };
    }

    // Default formatting: e.g. "Oct 24"
    return {
      text: `${format(dateObj, 'MMM d')}${timeSuffix}`,
      isOverdue: false,
    };
  } catch (err) {
    return { text: dueDate, isOverdue: false };
  }
}

/**
 * Helper to get local date string YYYY-MM-DD
 */
export function getLocalDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}
