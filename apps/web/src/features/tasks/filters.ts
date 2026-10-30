import { Task, Subtask, PriorityValue } from '@synctask/shared';
import { formatDueChip, getLocalDateString } from '../../lib/dates';
import { addDays } from 'date-fns';

export type SmartViewType = 'focus' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'list';

export interface FilterOptions {
  statusTab?: 'all' | 'active' | 'completed';
  smartView?: SmartViewType;
  listId?: string | null;
  priority?: PriorityValue | null;
  tag?: string | null;
  searchQuery?: string;
}

export function filterTasks(
  tasks: Task[],
  subtasks: Subtask[] = [],
  options: FilterOptions = {},
  referenceDate: Date = new Date()
): Task[] {
  const todayStr = getLocalDateString(referenceDate);
  const next7DaysStr = getLocalDateString(addDays(referenceDate, 7));

  return tasks.filter((task) => {
    // 1. Never show soft-deleted tasks
    if (task.deletedAt !== null) return false;

    // 2. Status tab filter: All | Active | Completed
    if (options.statusTab === 'active' && task.completed) return false;
    if (options.statusTab === 'completed' && !task.completed) return false;

    // 3. Smart view filter
    if (options.smartView === 'focus') {
      if (task.completed) return false;
    } else if (options.smartView === 'today') {
      if (task.dueDate !== todayStr) return false;
    } else if (options.smartView === 'upcoming') {
      if (!task.dueDate) return false;
      if (task.dueDate <= todayStr || task.dueDate > next7DaysStr) return false;
      if (task.completed) return false;
    } else if (options.smartView === 'overdue') {
      if (task.completed) return false;
      const chip = formatDueChip(task.dueDate, task.dueTime, false, referenceDate);
      if (!chip?.isOverdue) return false;
    } else if (options.smartView === 'completed') {
      if (!task.completed) return false;
    } else if (options.smartView === 'list' && options.listId) {
      if (task.listId !== options.listId) return false;
    }

    // 4. Priority filter
    if (options.priority !== undefined && options.priority !== null) {
      if (task.priority !== options.priority) return false;
    }

    // 5. Tag filter
    if (options.tag) {
      const matchTag = options.tag.toLowerCase();
      if (!task.tags.some((t) => t.toLowerCase() === matchTag)) return false;
    }

    // 6. Search query across title, description, tags, and subtask titles (FR-ORG-5)
    if (options.searchQuery && options.searchQuery.trim().length > 0) {
      const query = options.searchQuery.trim().toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(query);
      const descMatch = task.description.toLowerCase().includes(query);
      const tagMatch = task.tags.some((t) => t.toLowerCase().includes(query));

      const taskSubtasks = subtasks.filter((s) => s.taskId === task.id && !s.deletedAt);
      const subtaskMatch = taskSubtasks.some((s) => s.title.toLowerCase().includes(query));

      if (!titleMatch && !descMatch && !tagMatch && !subtaskMatch) {
        return false;
      }
    }

    return true;
  });
}
