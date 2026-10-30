import Dexie, { Table } from 'dexie';
import { format, addDays } from 'date-fns';
import {
  Task,
  Subtask,
  List,
  Notification,
  UserSettings,
  OutboxMutation,
  DEFAULT_LISTS,
  DEFAULT_USER_SETTINGS,
} from '@synctask/shared';
import { getActiveUserId, DEMO_USER_ID } from './activeUser';

export { DEMO_USER_ID };

export interface MetaRecord {
  key: string;
  value: unknown;
}

export interface OutboxRecord extends OutboxMutation {
  seq?: number;
}

export class SyncTaskDatabase extends Dexie {
  lists!: Table<List, string>;
  tasks!: Table<Task, string>;
  subtasks!: Table<Subtask, string>;
  notifications!: Table<Notification, string>;
  settings!: Table<UserSettings, string>;
  outbox!: Table<OutboxRecord, number>;
  meta!: Table<MetaRecord, string>;

  constructor(userId: string = DEMO_USER_ID) {
    super(`synctask_${userId}`);

    this.version(1).stores({
      lists: 'id, userId, position, rev, updatedAt, deletedAt',
      tasks: 'id, userId, listId, [completed+dueDate], priority, rev, updatedAt, deletedAt',
      subtasks: 'id, userId, taskId, position, rev, updatedAt, deletedAt',
      notifications: 'id, userId, taskId, type, fireAt, readAt, rev, updatedAt, deletedAt',
      settings: 'userId, rev, updatedAt',
      outbox: '++seq, mutationId, entity, entityId, op, createdAt',
      meta: 'key',
    });
  }
}

// Map of open database instances per user
const dbInstances = new Map<string, SyncTaskDatabase>();

export function getDb(userId?: string): SyncTaskDatabase {
  const effectiveUserId = userId || getActiveUserId();
  let db = dbInstances.get(effectiveUserId);
  if (!db) {
    db = new SyncTaskDatabase(effectiveUserId);
    dbInstances.set(effectiveUserId, db);
  }
  return db;
}

/**
 * Seeds default lists and settings if opening for the first time
 */
export async function seedDefaultsIfEmpty(
  db: SyncTaskDatabase,
  userId: string = DEMO_USER_ID,
  force: boolean = false
) {
  const listCount = await db.lists.count();
  if (force || listCount === 0) {
    const now = new Date().toISOString();
    const listsToInsert: List[] = DEFAULT_LISTS.map((def, idx) => ({
      id: crypto.randomUUID(),
      userId,
      name: def.name,
      color: def.color,
      position: idx,
      rev: 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    }));

    await db.transaction('rw', [db.lists, db.outbox], async () => {
      for (const list of listsToInsert) {
        await db.lists.put(list);
        await db.outbox.add({
          mutationId: crypto.randomUUID(),
          entity: 'list',
          entityId: list.id,
          op: 'create',
          patch: list,
          createdAt: now,
        });
      }
    });
  }

  // Seed starter tasks if tasks table is empty
  const taskCount = await db.tasks.count();
  if (force || taskCount === 0) {
    const now = new Date().toISOString();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    const starterTasks: Task[] = [
      {
        id: crypto.randomUUID(),
        userId,
        listId: null,
        title: 'Implement offline IndexedDB sync conflict resolution',
        description:
          'Field-level merge logic with outbox mutation queue and deterministic UUIDs for all offline operations.',
        dueDate: todayStr,
        dueTime: '18:00',
        priority: 2, // High
        tags: ['frontend', 'api'],
        completed: false,
        completedAt: null,
        remindBeforeMin: 30,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        listId: null,
        title: 'Encrypt sensitive tokens using Argon2 and enforce HTTPS strict transport',
        description:
          'Audit token signing, cookie storage parameters, and Helmet security middleware headers.',
        dueDate: tomorrowStr,
        dueTime: '11:00',
        priority: 2, // High
        tags: ['security', 'ops'],
        completed: false,
        completedAt: null,
        remindBeforeMin: 15,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        listId: null,
        title: 'Add OAuth social auth options (GitHub, Google) to login modal',
        description:
          'Implement client redirect flow and server token exchange endpoints with email verification.',
        dueDate: format(addDays(new Date(), 4), 'yyyy-MM-dd'),
        dueTime: null,
        priority: 1, // Medium
        tags: ['frontend', 'auth'],
        completed: false,
        completedAt: null,
        remindBeforeMin: null,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        listId: null,
        title: 'Calm theme palette contrast verification and WCAG AA pass',
        description:
          'Verify all background and text token pairs meet WCAG AA 4.5:1 ratio across both themes.',
        dueDate: format(addDays(new Date(), 8), 'yyyy-MM-dd'),
        dueTime: null,
        priority: 0, // Low
        tags: ['design', 'a11y'],
        completed: false,
        completedAt: null,
        remindBeforeMin: null,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];

    const starterSubtasks: Subtask[] = [
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[0].id,
        title: 'Configure client-side Dexie.js schemas',
        done: true,
        color: 'emerald',
        position: 0,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[0].id,
        title: 'Generate deterministic UUIDs for offline tasks',
        done: true,
        color: 'lavender',
        position: 1,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[0].id,
        title: 'Local mutation outbox queue in Dexie',
        done: true,
        color: 'sky',
        position: 2,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[0].id,
        title: 'Handle merge conflict patch resolution',
        done: false,
        color: 'coral',
        position: 3,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[0].id,
        title: 'Simulated latency reconnection test scenario',
        done: false,
        color: 'slate',
        position: 4,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      // Subtasks for task 2
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[1].id,
        title: 'Configure Argon2id hash parameters',
        done: true,
        color: 'emerald',
        position: 0,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        id: crypto.randomUUID(),
        userId,
        taskId: starterTasks[1].id,
        title: 'Add helmet security headers and cookie flags',
        done: false,
        color: 'sky',
        position: 1,
        rev: 0,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ];

    await db.transaction('rw', [db.tasks, db.subtasks, db.outbox], async () => {
      for (const t of starterTasks) {
        await db.tasks.put(t);
        await db.outbox.add({
          mutationId: crypto.randomUUID(),
          entity: 'task',
          entityId: t.id,
          op: 'create',
          patch: t,
          createdAt: now,
        });
      }
      for (const s of starterSubtasks) {
        await db.subtasks.put(s);
        await db.outbox.add({
          mutationId: crypto.randomUUID(),
          entity: 'subtask',
          entityId: s.id,
          op: 'create',
          patch: s,
          createdAt: now,
        });
      }
    });
  }

  const settingsCount = await db.settings.count();
  if (force || settingsCount === 0) {
    const now = new Date().toISOString();
    const userSettings: UserSettings = {
      userId,
      ...DEFAULT_USER_SETTINGS,
      rev: 0,
      updatedAt: now,
    };
    await db.settings.put(userSettings);
  }
}

/**
 * Resets the demo database back to its pristine starter state
 */
export async function resetDemoDatabase(): Promise<void> {
  const db = getDb(DEMO_USER_ID);
  await db.transaction(
    'rw',
    [db.lists, db.tasks, db.subtasks, db.notifications, db.settings, db.outbox, db.meta],
    async () => {
      await db.lists.clear();
      await db.tasks.clear();
      await db.subtasks.clear();
      await db.notifications.clear();
      await db.settings.clear();
      await db.outbox.clear();
      await db.meta.clear();
    }
  );
  await seedDefaultsIfEmpty(db, DEMO_USER_ID, true);
}
