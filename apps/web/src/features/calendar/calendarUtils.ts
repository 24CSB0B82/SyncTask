import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import { Task, PRIORITIES, PriorityValue } from '@synctask/shared';

export interface CalendarDayInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
  circles: Array<{
    id: string;
    priority: PriorityValue;
    completed: boolean;
  }>;
  overflowCount: number;
}

/**
 * Returns a matrix of days covering the full month grid.
 * weekStartsOn: 1 (Monday) by default per FR-CAL-1.
 */
export function getCalendarGridDays(
  currentMonth: Date,
  tasks: Task[],
  weekStartsOn: 0 | 1 = 1
): CalendarDayInfo[] {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Map non-deleted tasks by date
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (t.deletedAt || !t.dueDate) return;
    const existing = tasksByDate.get(t.dueDate) || [];
    existing.push(t);
    tasksByDate.set(t.dueDate, existing);
  });

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const dayTasks = tasksByDate.get(dateStr) || [];

    // Sort tasks for display in preview: time-sorted, All day first
    dayTasks.sort((a, b) => {
      if (!a.dueTime && !b.dueTime) return 0;
      if (!a.dueTime) return -1; // All day listed first
      if (!b.dueTime) return 1;
      return a.dueTime.localeCompare(b.dueTime);
    });

    // Priority circles: show at most 4 circles, then +N (FR-CAL-2)
    const circles = dayTasks.slice(0, 4).map((t) => ({
      id: t.id,
      priority: t.priority,
      completed: t.completed,
    }));

    const overflowCount = Math.max(0, dayTasks.length - 4);

    return {
      date: day,
      dateStr,
      dayNumber: day.getDate(),
      isCurrentMonth: isSameMonth(day, currentMonth),
      isToday: isToday(day),
      tasks: dayTasks,
      circles,
      overflowCount,
    };
  });
}
