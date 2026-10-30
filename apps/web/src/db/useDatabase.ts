import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Task, Subtask, List, UserSettings, Notification } from '@synctask/shared';
import { getDb, seedDefaultsIfEmpty } from './dexie';
import { getActiveUserId, subscribeActiveUserId } from './activeUser';
import { formatDueChip, getLocalDateString } from '../lib/dates';
import { addDays } from 'date-fns';

export function useCurrentUserId(): string {
  const [userId, setUserId] = useState<string>(getActiveUserId());

  useEffect(() => {
    return subscribeActiveUserId((newId) => {
      setUserId(newId);
    });
  }, []);

  return userId;
}

export function useInitDb(userId?: string) {
  const currentUserId = useCurrentUserId();
  const effectiveUserId = userId || currentUserId;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const db = getDb(effectiveUserId);
    seedDefaultsIfEmpty(db, effectiveUserId).then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [effectiveUserId]);

  return ready;
}

export function useLiveTasks(userId?: string): Task[] {
  const currentUserId = useCurrentUserId();
  const effectiveUserId = userId || currentUserId;
  const db = getDb(effectiveUserId);
  return (
    useLiveQuery(
      () => db.tasks.filter((t) => t.deletedAt === null).toArray(),
      [effectiveUserId],
      []
    ) || []
  );
}

export function useLiveSubtasks(userId?: string): Subtask[] {
  const currentUserId = useCurrentUserId();
  const effectiveUserId = userId || currentUserId;
  const db = getDb(effectiveUserId);
  return (
    useLiveQuery(
      () => db.subtasks.filter((s) => s.deletedAt === null).toArray(),
      [effectiveUserId],
      []
    ) || []
  );
}

export function useLiveLists(userId?: string): List[] {
  const currentUserId = useCurrentUserId();
  const effectiveUserId = userId || currentUserId;
  const db = getDb(effectiveUserId);
  return (
    useLiveQuery(
      () => db.lists.filter((l) => l.deletedAt === null).sortBy('position'),
      [effectiveUserId],
      []
    ) || []
  );
}

export function useLiveNotifications(userId?: string): Notification[] {
  const currentUserId = useCurrentUserId();
  const effectiveUserId = userId || currentUserId;
  const db = getDb(effectiveUserId);
  return (
    useLiveQuery(
      () => db.notifications.filter((n) => n.deletedAt === null).toArray(),
      [effectiveUserId],
      []
    ) || []
  );
}

export function useLiveSettings(userId?: string): UserSettings | undefined {
  const currentUserId = useCurrentUserId();
  const effectiveUserId = userId || currentUserId;
  const db = getDb(effectiveUserId);
  return useLiveQuery(() => db.settings.get(effectiveUserId), [effectiveUserId]);
}

export interface TaskCounts {
  focusStream: number;
  today: number;
  upcoming: number;
  overdue: number;
  completed: number;
  lists: Record<string, number>;
}

export function useLiveTaskCounts(userId?: string): TaskCounts {
  const tasks = useLiveTasks(userId);
  const todayStr = getLocalDateString();
  const next7DaysStr = getLocalDateString(addDays(new Date(), 7));

  const counts: TaskCounts = {
    focusStream: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
    lists: {},
  };

  tasks.forEach((task) => {
    if (task.completed) {
      counts.completed++;
    } else {
      counts.focusStream++;

      if (task.dueDate === todayStr) {
        counts.today++;
      } else if (task.dueDate && task.dueDate > todayStr && task.dueDate <= next7DaysStr) {
        counts.upcoming++;
      }

      const chip = formatDueChip(task.dueDate, task.dueTime, false);
      if (chip?.isOverdue) {
        counts.overdue++;
      }

      if (task.listId) {
        counts.lists[task.listId] = (counts.lists[task.listId] || 0) + 1;
      }
    }
  });

  return counts;
}
