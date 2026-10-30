import { Router, Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
import { SyncPushInputSchema, SyncPushResponse, SyncPullResponse } from '@synctask/shared';
import {
  UserModel,
  TaskModel,
  SubtaskModel,
  ListModel,
  NotificationModel,
  UserSettingsModel,
  ProcessedMutationModel,
} from '../models';
import { requireAuth } from '../middleware/auth';

export const syncRouter = Router();
export const syncEvents = new EventEmitter();

// Protect all sync routes
syncRouter.use(requireAuth);

/**
 * POST /api/sync/push
 * Apply client outbox mutations atomically and increment revision cursor
 */
syncRouter.post('/push', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = SyncPushInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid sync push payload',
          details: parsed.error.format(),
        },
      });
      return;
    }

    const userId = req.user!.userId;
    const { mutations } = parsed.data;
    const applied: string[] = [];

    for (const mutation of mutations) {
      // Check idempotency: if already processed, skip
      const alreadyProcessed = await ProcessedMutationModel.findById(mutation.mutationId);
      if (alreadyProcessed) {
        applied.push(mutation.mutationId);
        continue;
      }

      // Atomically increment user's revision cursor
      const user = await UserModel.findOneAndUpdate(
        { _id: userId },
        { $inc: { cursor: 1 } },
        { returnDocument: 'after' }
      );
      const nextRev = user?.cursor ?? 1;

      // Apply entity mutation
      switch (mutation.entity) {
        case 'task': {
          if (mutation.op === 'delete') {
            await TaskModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              { $set: { deletedAt: new Date().toISOString(), rev: nextRev } }
            );
          } else {
            // create or update
            await TaskModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              {
                $set: {
                  ...mutation.patch,
                  _id: mutation.entityId,
                  userId,
                  rev: nextRev,
                },
              },
              { upsert: true, returnDocument: 'after' }
            );
          }
          break;
        }

        case 'subtask': {
          if (mutation.op === 'delete') {
            await SubtaskModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              { $set: { deletedAt: new Date().toISOString(), rev: nextRev } }
            );
          } else {
            await SubtaskModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              {
                $set: {
                  ...mutation.patch,
                  _id: mutation.entityId,
                  userId,
                  rev: nextRev,
                },
              },
              { upsert: true, returnDocument: 'after' }
            );
          }
          break;
        }

        case 'list': {
          if (mutation.op === 'delete') {
            await ListModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              { $set: { deletedAt: new Date().toISOString(), rev: nextRev } }
            );
          } else {
            await ListModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              {
                $set: {
                  ...mutation.patch,
                  _id: mutation.entityId,
                  userId,
                  rev: nextRev,
                },
              },
              { upsert: true, returnDocument: 'after' }
            );
          }
          break;
        }

        case 'notification': {
          if (mutation.op === 'delete') {
            await NotificationModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              { $set: { deletedAt: new Date().toISOString(), rev: nextRev } }
            );
          } else {
            await NotificationModel.findOneAndUpdate(
              { _id: mutation.entityId, userId },
              {
                $set: {
                  ...mutation.patch,
                  _id: mutation.entityId,
                  userId,
                  rev: nextRev,
                },
              },
              { upsert: true, returnDocument: 'after' }
            );
          }
          break;
        }

        case 'settings': {
          await UserSettingsModel.findOneAndUpdate(
            { userId },
            {
              $set: {
                ...mutation.patch,
                _id: userId,
                userId,
                rev: nextRev,
              },
            },
            { upsert: true, returnDocument: 'after' }
          );
          break;
        }
      }

      // Mark mutation as processed
      await ProcessedMutationModel.create({
        _id: mutation.mutationId,
        userId,
        appliedAt: new Date(),
      });

      applied.push(mutation.mutationId);
    }

    // Fetch current cursor
    const currentUser = await UserModel.findById(userId);
    const finalCursor = currentUser?.cursor ?? 0;

    // Broadcast sync event to live SSE listeners for this user
    syncEvents.emit(`user:${userId}`, { cursor: finalCursor });

    const response: SyncPushResponse = {
      applied,
      cursor: finalCursor,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/sync/pull
 * Fetch changes since client cursor
 */
syncRouter.get('/pull', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const since = parseInt(req.query.since as string, 10) || 0;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User session invalid',
        },
      });
      return;
    }

    const [lists, tasks, subtasks, notifications, settings] = await Promise.all([
      ListModel.find({ userId, rev: { $gt: since } }).lean(),
      TaskModel.find({ userId, rev: { $gt: since } }).lean(),
      SubtaskModel.find({ userId, rev: { $gt: since } }).lean(),
      NotificationModel.find({ userId, rev: { $gt: since } }).lean(),
      UserSettingsModel.findOne({ userId, rev: { $gt: since } }).lean(),
    ]);

    const mapDoc = (doc: any) => {
      const { _id, __v, ...rest } = doc;
      return { id: _id, ...rest };
    };

    const response: SyncPullResponse = {
      cursor: user.cursor,
      changes: {
        lists: lists.map(mapDoc),
        tasks: tasks.map(mapDoc),
        subtasks: subtasks.map(mapDoc),
        notifications: notifications.map(mapDoc),
        settings: settings ? mapDoc(settings) : null,
      },
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/sync/stream
 * Server-Sent Events real-time sync notification
 */
syncRouter.get('/stream', async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const user = await UserModel.findById(userId);

  if (!user) {
    res.status(401).end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Initial event
  res.write(`data: ${JSON.stringify({ type: 'connected', cursor: user.cursor })}\n\n`);

  const onUserSync = (data: { cursor: number }) => {
    res.write(`data: ${JSON.stringify({ type: 'sync-needed', cursor: data.cursor })}\n\n`);
  };

  const eventChannel = `user:${userId}`;
  syncEvents.on(eventChannel, onUserSync);

  // Heartbeat ping every 25s to keep connection alive
  const pingInterval = setInterval(() => {
    res.write(':ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(pingInterval);
    syncEvents.off(eventChannel, onUserSync);
  });
});
