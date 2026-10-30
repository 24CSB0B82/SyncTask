import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  List,
  CreateListInput,
  Subtask,
  CreateSubtaskInput,
  UserSettings,
  Notification,
  PRIORITIES,
  DEFAULT_LISTS,
  SUBTASK_PALETTE_ORDER,
} from '@synctask/shared';
import { getDb, SyncTaskDatabase } from './dexie';
import { getActiveUserId } from './activeUser';

function getTargetUserId(userId?: string): string {
  return userId || getActiveUserId();
}

// ==========================================
// TASKS REPOSITORY
// ==========================================

export async function createTask(
  input: CreateTaskInput,
  userId?: string
): Promise<Task> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const task: Task = {
    id,
    userId: effectiveUserId,
    listId: input.listId ?? null,
    title: input.title.trim(),
    description: input.description?.trim() ?? '',
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    priority: input.priority ?? PRIORITIES.MEDIUM,
    tags: (input.tags ?? []).map((t) => t.toLowerCase().trim()),
    completed: false,
    completedAt: null,
    remindBeforeMin: input.remindBeforeMin ?? null,
    rev: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', [db.tasks, db.outbox], async () => {
    await db.tasks.put(task);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'task',
      entityId: id,
      op: 'create',
      patch: task,
      createdAt: now,
    });
  });

  return task;
}

export async function updateTask(
  id: string,
  patch: Partial<Task>,
  userId?: string
): Promise<Task> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.tasks.get(id);
  if (!existing) {
    throw new Error(`Task ${id} not found`);
  }

  const now = new Date().toISOString();
  const updated: Task = {
    ...existing,
    ...patch,
    updatedAt: now,
  };

  await db.transaction('rw', [db.tasks, db.outbox], async () => {
    await db.tasks.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'task',
      entityId: id,
      op: 'update',
      patch: { ...patch, updatedAt: now },
      createdAt: now,
    });
  });

  return updated;
}

export async function toggleTaskComplete(
  id: string,
  completed: boolean,
  userId?: string
): Promise<Task> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();
  const task = await updateTask(
    id,
    {
      completed,
      completedAt: completed ? now : null,
    },
    effectiveUserId
  );

  // FR-NOT-9: Completing task dismisses its notifications
  if (completed) {
    const notifs = await db.notifications.where('taskId').equals(id).toArray();
    for (const notif of notifs) {
      if (!notif.dismissedAt) {
        await dismissNotification(notif.id, effectiveUserId);
      }
    }
  }

  return task;
}

export async function deleteTask(id: string, userId?: string): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();

  await db.transaction('rw', [db.tasks, db.outbox], async () => {
    const existing = await db.tasks.get(id);
    if (existing) {
      const updated = { ...existing, deletedAt: now, updatedAt: now };
      await db.tasks.put(updated);
      await db.outbox.add({
        mutationId: crypto.randomUUID(),
        entity: 'task',
        entityId: id,
        op: 'delete',
        patch: { deletedAt: now, updatedAt: now },
        createdAt: now,
      });
    }
  });

  // FR-NOT-9: Deleting task dismisses its notifications
  const notifs = await db.notifications.where('taskId').equals(id).toArray();
  for (const notif of notifs) {
    if (!notif.dismissedAt) {
      await dismissNotification(notif.id, effectiveUserId);
    }
  }
}

export async function restoreTask(id: string, userId?: string): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();

  await db.transaction('rw', [db.tasks, db.outbox], async () => {
    const existing = await db.tasks.get(id);
    if (existing) {
      const updated = { ...existing, deletedAt: null, updatedAt: now };
      await db.tasks.put(updated);
      await db.outbox.add({
        mutationId: crypto.randomUUID(),
        entity: 'task',
        entityId: id,
        op: 'update',
        patch: { deletedAt: null, updatedAt: now },
        createdAt: now,
      });
    }
  });
}

// ==========================================
// LISTS REPOSITORY
// ==========================================

export async function createList(
  input: CreateListInput,
  userId?: string
): Promise<List> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const count = await db.lists.count();

  const list: List = {
    id,
    userId: effectiveUserId,
    name: input.name.trim(),
    color: input.color ?? 'sky',
    position: count,
    rev: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', [db.lists, db.outbox], async () => {
    await db.lists.put(list);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'list',
      entityId: id,
      op: 'create',
      patch: list,
      createdAt: now,
    });
  });

  return list;
}

export async function updateList(
  id: string,
  patch: Partial<List>,
  userId?: string
): Promise<List> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.lists.get(id);
  if (!existing) {
    throw new Error(`List ${id} not found`);
  }

  const now = new Date().toISOString();
  const updated: List = {
    ...existing,
    ...patch,
    updatedAt: now,
  };

  await db.transaction('rw', [db.lists, db.outbox], async () => {
    await db.lists.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'list',
      entityId: id,
      op: 'update',
      patch: { ...patch, updatedAt: now },
      createdAt: now,
    });
  });

  return updated;
}

export async function deleteList(id: string, userId?: string): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();

  await db.transaction('rw', [db.lists, db.tasks, db.outbox], async () => {
    const list = await db.lists.get(id);
    if (list) {
      await db.lists.put({ ...list, deletedAt: now, updatedAt: now });
      await db.outbox.add({
        mutationId: crypto.randomUUID(),
        entity: 'list',
        entityId: id,
        op: 'delete',
        patch: { deletedAt: now, updatedAt: now },
        createdAt: now,
      });

      // Tasks in deleted list move to "No list" (listId: null)
      const tasksInList = await db.tasks.where('listId').equals(id).toArray();
      for (const task of tasksInList) {
        if (!task.deletedAt) {
          const updatedTask = { ...task, listId: null, updatedAt: now };
          await db.tasks.put(updatedTask);
          await db.outbox.add({
            mutationId: crypto.randomUUID(),
            entity: 'task',
            entityId: task.id,
            op: 'update',
            patch: { listId: null, updatedAt: now },
            createdAt: now,
          });
        }
      }
    }
  });
}

// ==========================================
// SUBTASKS REPOSITORY
// ==========================================

export async function createSubtask(
  input: CreateSubtaskInput,
  userId?: string
): Promise<Subtask> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Color rotation in order if not specified
  const existingSubtasks = await db.subtasks.where('taskId').equals(input.taskId).toArray();
  const nextColorIndex = existingSubtasks.length % SUBTASK_PALETTE_ORDER.length;
  const color = input.color ?? SUBTASK_PALETTE_ORDER[nextColorIndex];

  const subtask: Subtask = {
    id,
    userId: effectiveUserId,
    taskId: input.taskId,
    title: input.title.trim(),
    done: false,
    color,
    position: existingSubtasks.length,
    rev: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', [db.subtasks, db.outbox], async () => {
    await db.subtasks.put(subtask);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'subtask',
      entityId: id,
      op: 'create',
      patch: subtask,
      createdAt: now,
    });
  });

  return subtask;
}

export async function updateSubtask(
  id: string,
  patch: Partial<Subtask>,
  userId?: string
): Promise<Subtask> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.subtasks.get(id);
  if (!existing) {
    throw new Error(`Subtask ${id} not found`);
  }

  const now = new Date().toISOString();
  const updated: Subtask = {
    ...existing,
    ...patch,
    updatedAt: now,
  };

  await db.transaction('rw', [db.subtasks, db.outbox], async () => {
    await db.subtasks.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'subtask',
      entityId: id,
      op: 'update',
      patch: { ...patch, updatedAt: now },
      createdAt: now,
    });
  });

  return updated;
}

export async function deleteSubtask(id: string, userId?: string): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();

  await db.transaction('rw', [db.subtasks, db.outbox], async () => {
    const existing = await db.subtasks.get(id);
    if (existing) {
      await db.subtasks.put({ ...existing, deletedAt: now, updatedAt: now });
      await db.outbox.add({
        mutationId: crypto.randomUUID(),
        entity: 'subtask',
        entityId: id,
        op: 'delete',
        patch: { deletedAt: now, updatedAt: now },
        createdAt: now,
      });
    }
  });
}

// ==========================================
// NOTIFICATIONS REPOSITORY
// ==========================================

export async function createNotification(
  notification: Notification,
  userId?: string
): Promise<Notification> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const now = new Date().toISOString();

  await db.transaction('rw', [db.notifications, db.outbox], async () => {
    await db.notifications.put(notification);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'notification',
      entityId: notification.id,
      op: 'create',
      patch: notification,
      createdAt: now,
    });
  });

  return notification;
}

export async function markNotificationRead(
  id: string,
  userId?: string
): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.notifications.get(id);
  if (!existing) return;

  const now = new Date().toISOString();
  const updated: Notification = {
    ...existing,
    readAt: now,
    updatedAt: now,
  };

  await db.transaction('rw', [db.notifications, db.outbox], async () => {
    await db.notifications.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'notification',
      entityId: id,
      op: 'update',
      patch: { readAt: now, updatedAt: now },
      createdAt: now,
    });
  });
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const unread = await db.notifications
    .filter((n) => n.readAt === null && n.dismissedAt === null && n.deletedAt === null)
    .toArray();

  const now = new Date().toISOString();
  await db.transaction('rw', [db.notifications, db.outbox], async () => {
    for (const notif of unread) {
      const updated = { ...notif, readAt: now, updatedAt: now };
      await db.notifications.put(updated);
      await db.outbox.add({
        mutationId: crypto.randomUUID(),
        entity: 'notification',
        entityId: notif.id,
        op: 'update',
        patch: { readAt: now, updatedAt: now },
        createdAt: now,
      });
    }
  });
}

export async function snoozeNotification(
  id: string,
  snoozedUntil: string,
  userId?: string
): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.notifications.get(id);
  if (!existing) return;

  const now = new Date().toISOString();
  const updated: Notification = {
    ...existing,
    snoozedUntil,
    readAt: now, // Snoozing marks it temporarily read until snooze fires
    updatedAt: now,
  };

  await db.transaction('rw', [db.notifications, db.outbox], async () => {
    await db.notifications.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'notification',
      entityId: id,
      op: 'update',
      patch: { snoozedUntil, readAt: now, updatedAt: now },
      createdAt: now,
    });
  });
}

export async function dismissNotification(
  id: string,
  userId?: string
): Promise<void> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.notifications.get(id);
  if (!existing) return;

  const now = new Date().toISOString();
  const updated: Notification = {
    ...existing,
    dismissedAt: now,
    updatedAt: now,
  };

  await db.transaction('rw', [db.notifications, db.outbox], async () => {
    await db.notifications.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'notification',
      entityId: id,
      op: 'update',
      patch: { dismissedAt: now, updatedAt: now },
      createdAt: now,
    });
  });
}

// ==========================================
// USER SETTINGS REPOSITORY
// ==========================================

export async function updateUserSettings(
  patch: Partial<UserSettings>,
  userId?: string
): Promise<UserSettings> {
  const effectiveUserId = getTargetUserId(userId);
  const db = getDb(effectiveUserId);
  const existing = await db.settings.get(effectiveUserId);
  const now = new Date().toISOString();

  const updated: UserSettings = {
    ...(existing || {
      userId: effectiveUserId,
      theme: 'system',
      weekStart: 'mon',
      timeFormat: '24h',
      defaultReminderMin: 30,
      quietEnabled: false,
      quietStart: '22:00',
      quietEnd: '07:00',
      browserNotifications: false,
      rev: 0,
      updatedAt: now,
    }),
    ...patch,
    updatedAt: now,
  };

  await db.transaction('rw', [db.settings, db.outbox], async () => {
    await db.settings.put(updated);
    await db.outbox.add({
      mutationId: crypto.randomUUID(),
      entity: 'settings',
      entityId: effectiveUserId,
      op: 'update',
      patch: { ...patch, updatedAt: now },
      createdAt: now,
    });
  });

  return updated;
}
