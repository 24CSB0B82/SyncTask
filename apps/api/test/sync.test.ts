import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { PRIORITIES } from '@synctask/shared';
import { app } from '../src/app';
import { connectDB } from '../src/db/connection';
import {
  UserModel,
  TaskModel,
  SubtaskModel,
  ListModel,
  ProcessedMutationModel,
  UserSettingsModel,
} from '../src/models';

const TEST_DB_URI = 'mongodb://localhost:27017/synctask_test';

describe('Sync API', () => {
  let userToken: string;
  let userTokenB: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await TaskModel.deleteMany({});
    await SubtaskModel.deleteMany({});
    await ListModel.deleteMany({});
    await ProcessedMutationModel.deleteMany({});
    await UserSettingsModel.deleteMany({});
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await TaskModel.deleteMany({});
    await SubtaskModel.deleteMany({});
    await ListModel.deleteMany({});
    await ProcessedMutationModel.deleteMany({});
    await UserSettingsModel.deleteMany({});

    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      email: 'user.a@example.com',
      password: 'password123',
      username: 'UserA',
    });
    userToken = resA.body.token;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      email: 'user.b@example.com',
      password: 'password123',
      username: 'UserB',
    });
    userTokenB = resB.body.token;
  });

  it('POST /api/sync/push requires auth', async () => {
    const res = await request(app).post('/api/sync/push').send({ mutations: [] });
    expect(res.status).toBe(401);
  });

  it('POST /api/sync/push applies task, list, and subtask mutations with rev increment', async () => {
    const taskId = crypto.randomUUID();
    const listId = crypto.randomUUID();
    const subtaskId = crypto.randomUUID();
    const mutId1 = crypto.randomUUID();
    const mutId2 = crypto.randomUUID();
    const mutId3 = crypto.randomUUID();

    const pushRes = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mutations: [
          {
            mutationId: mutId1,
            entity: 'list',
            entityId: listId,
            op: 'create',
            patch: {
              name: 'Work Projects',
              color: 'sky',
              position: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
          {
            mutationId: mutId2,
            entity: 'task',
            entityId: taskId,
            op: 'create',
            patch: {
              title: 'Review MongoDB Architecture',
              priority: PRIORITIES.HIGH,
              listId: listId,
              tags: ['db', 'sync'],
              completed: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
          {
            mutationId: mutId3,
            entity: 'subtask',
            entityId: subtaskId,
            op: 'create',
            patch: {
              taskId: taskId,
              title: 'Index check',
              color: 'emerald',
              position: 0,
              done: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
        ],
      });

    expect(pushRes.status).toBe(200);
    expect(pushRes.body.applied).toEqual([mutId1, mutId2, mutId3]);
    expect(pushRes.body.cursor).toBe(3);

    // Verify task stored in MongoDB
    const taskInDb = await TaskModel.findById(taskId);
    expect(taskInDb).not.toBeNull();
    expect(taskInDb?.title).toBe('Review MongoDB Architecture');
    expect(taskInDb?.rev).toBe(2);

    // Verify pull
    const pullRes = await request(app)
      .get('/api/sync/pull?since=0')
      .set('Authorization', `Bearer ${userToken}`);

    expect(pullRes.status).toBe(200);
    expect(pullRes.body.cursor).toBe(3);
    expect(pullRes.body.changes.lists).toHaveLength(1);
    expect(pullRes.body.changes.tasks).toHaveLength(1);
    expect(pullRes.body.changes.subtasks).toHaveLength(1);
    expect(pullRes.body.changes.tasks[0].title).toBe('Review MongoDB Architecture');
  });

  it('POST /api/sync/push is idempotent on duplicate mutations', async () => {
    const taskId = crypto.randomUUID();
    const mutId = crypto.randomUUID();

    const payload = {
      mutations: [
        {
          mutationId: mutId,
          entity: 'task',
          entityId: taskId,
          op: 'create',
          patch: {
            title: 'Idempotent Task',
            priority: PRIORITIES.MEDIUM,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const firstPush = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(firstPush.status).toBe(200);
    expect(firstPush.body.cursor).toBe(1);

    // Resend same mutation
    const secondPush = await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);

    expect(secondPush.status).toBe(200);
    expect(secondPush.body.applied).toEqual([mutId]);
    // Cursor should NOT increment again for duplicate mutation
    expect(secondPush.body.cursor).toBe(1);
  });

  it('GET /api/sync/pull delta filters by cursor and isolates users', async () => {
    const taskIdA = crypto.randomUUID();
    const taskIdB = crypto.randomUUID();

    // User A creates task
    await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        mutations: [
          {
            mutationId: crypto.randomUUID(),
            entity: 'task',
            entityId: taskIdA,
            op: 'create',
            patch: {
              title: 'User A Private Task',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
        ],
      });

    // User B creates task
    await request(app)
      .post('/api/sync/push')
      .set('Authorization', `Bearer ${userTokenB}`)
      .send({
        mutations: [
          {
            mutationId: crypto.randomUUID(),
            entity: 'task',
            entityId: taskIdB,
            op: 'create',
            patch: {
              title: 'User B Private Task',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            createdAt: new Date().toISOString(),
          },
        ],
      });

    // Pull User A
    const pullA = await request(app)
      .get('/api/sync/pull?since=0')
      .set('Authorization', `Bearer ${userToken}`);

    expect(pullA.body.changes.tasks).toHaveLength(1);
    expect(pullA.body.changes.tasks[0].title).toBe('User A Private Task');

    // Pull User B
    const pullB = await request(app)
      .get('/api/sync/pull?since=0')
      .set('Authorization', `Bearer ${userTokenB}`);

    expect(pullB.body.changes.tasks).toHaveLength(1);
    expect(pullB.body.changes.tasks[0].title).toBe('User B Private Task');

    // Pull User A since cursor 1: should return empty tasks delta
    const pullAAfter = await request(app)
      .get('/api/sync/pull?since=1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(pullAAfter.body.changes.tasks).toHaveLength(0);
  });
});
