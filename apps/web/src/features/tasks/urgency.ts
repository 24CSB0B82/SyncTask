import { Task, PRIORITIES } from '@synctask/shared';
import { formatDueChip } from '../../lib/dates';

/**
 * Implements the Urgency sort order defined in Section 3.4:
 * 1. Overdue active tasks (oldest due first)
 * 2. Due today (by time, ties by priority)
 * 3. Future dated tasks (soonest first, ties by priority)
 * 4. Undated tasks (by priority, then newest)
 * Completed tasks always sink to the bottom (sorted by completedAt descending).
 */
export function sortByUrgency(tasks: Task[], referenceDate: Date = new Date()): Task[] {
  const todayStr = referenceDate.toISOString().slice(0, 10);

  return [...tasks].sort((a, b) => {
    // Completed tasks sink to the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    if (a.completed && b.completed) {
      return (b.completedAt || b.updatedAt).localeCompare(a.completedAt || a.updatedAt);
    }

    const aChip = formatDueChip(a.dueDate, a.dueTime, false, referenceDate);
    const bChip = formatDueChip(b.dueDate, b.dueTime, false, referenceDate);

    const aOverdue = aChip?.isOverdue ?? false;
    const bOverdue = bChip?.isOverdue ?? false;

    // 1. Overdue active tasks first (oldest due date/time first)
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    if (aOverdue && bOverdue) {
      const aDue = `${a.dueDate} ${a.dueTime || '23:59'}`;
      const bDue = `${b.dueDate} ${b.dueTime || '23:59'}`;
      return aDue.localeCompare(bDue);
    }

    // 2. Due Today
    const aToday = a.dueDate === todayStr;
    const bToday = b.dueDate === todayStr;

    if (aToday && !bToday) return -1;
    if (!aToday && bToday) return 1;
    if (aToday && bToday) {
      const aTime = a.dueTime || '23:59';
      const bTime = b.dueTime || '23:59';
      if (aTime !== bTime) {
        return aTime.localeCompare(bTime);
      }
      // Ties by priority
      return b.priority - a.priority;
    }

    // 3. Future dated tasks vs Undated
    const aHasDate = Boolean(a.dueDate);
    const bHasDate = Boolean(b.dueDate);

    if (aHasDate && !bHasDate) return -1;
    if (!aHasDate && bHasDate) return 1;

    if (aHasDate && bHasDate) {
      const aDue = `${a.dueDate} ${a.dueTime || '00:00'}`;
      const bDue = `${b.dueDate} ${b.dueTime || '00:00'}`;
      if (aDue !== bDue) {
        return aDue.localeCompare(bDue);
      }
      return b.priority - a.priority;
    }

    // 4. Undated tasks: by priority (High -> Med -> Low), then newest created
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export type SortField = 'urgency' | 'dueDate' | 'createdAt' | 'priority';

export function sortTasks(
  tasks: Task[],
  field: SortField,
  ascending: boolean = false,
  referenceDate: Date = new Date()
): Task[] {
  if (field === 'urgency') {
    const sorted = sortByUrgency(tasks, referenceDate);
    return ascending ? sorted.reverse() : sorted;
  }

  const sorted = [...tasks].sort((a, b) => {
    if (field === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      const aDue = `${a.dueDate} ${a.dueTime || ''}`;
      const bDue = `${b.dueDate} ${b.dueTime || ''}`;
      return aDue.localeCompare(bDue);
    }

    if (field === 'priority') {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return b.createdAt.localeCompare(a.createdAt);
    }

    if (field === 'createdAt') {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return 0;
  });

  return ascending ? sorted.reverse() : sorted;
}
