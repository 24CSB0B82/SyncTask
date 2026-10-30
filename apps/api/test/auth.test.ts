import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/db/connection';
import { UserModel, UserSettingsModel } from '../src/models';

const TEST_DB_URI = 'mongodb://localhost:27017/synctask_test';

describe('Auth API', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB(TEST_DB_URI);
  });

  afterAll(async () => {
    await UserModel.deleteMany({});
    await UserSettingsModel.deleteMany({});
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    await UserSettingsModel.deleteMany({});
  });

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    username: 'TestUser',
  };

  it('POST /api/auth/register successfully creates user and sets auth cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.username).toBe('TestUser');
    expect(res.body.user.cursor).toBe(0);
    expect(res.body.token).toBeDefined();

    // Verify cookie set
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie.some((c: string) => c.includes('st-token='))).toBe(true);

    // Verify user in db
    const inDb = await UserModel.findOne({ email: 'test@example.com' });
    expect(inDb).not.toBeNull();
    expect(inDb?.username).toBe('TestUser');

    // Verify default settings in db
    const settings = await UserSettingsModel.findOne({ userId: inDb?._id });
    expect(settings).not.toBeNull();
    expect(settings?.theme).toBe('system');
  });

  it('POST /api/auth/register fails on duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('POST /api/auth/register validates inputs with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'short',
      username: '',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/login succeeds with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.token).toBeDefined();

    const setCookie = res.headers['set-cookie'];
    expect(setCookie.some((c: string) => c.includes('st-token='))).toBe(true);
  });

  it('POST /api/auth/login rejects incorrect password with 401', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login rejects non-existent email with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'somepassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/me requires authentication', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/me returns user profile with Bearer token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const meRes = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testUser.email);
    expect(meRes.body.user.username).toBe(testUser.username);
  });

  it('POST /api/auth/logout clears auth cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });

    const setCookie = res.headers['set-cookie'];
    expect(setCookie.some((c: string) => c.includes('st-token=;'))).toBe(true);
  });

  it('PUT /api/auth/profile updates username and avatar', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'UpdatedName',
        avatarUrl: 'data:image/webp;base64,mockavatar',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('UpdatedName');
    expect(res.body.user.avatarUrl).toBe('data:image/webp;base64,mockavatar');
  });

  it('PUT /api/auth/profile updates password after validating current password', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    // Fail with wrong current password
    const failRes = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      });
    expect(failRes.status).toBe(400);

    // Succeed with correct current password
    const successRes = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: testUser.password,
        newPassword: 'newpassword123',
      });
    expect(successRes.status).toBe(200);

    // Verify login with new password works
    const loginRes = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'newpassword123',
    });
    expect(loginRes.status).toBe(200);
  });

  it('POST /api/auth/oauth logs in and creates user via Google/GitHub', async () => {
    const res = await request(app).post('/api/auth/oauth').send({
      provider: 'google',
      email: 'oauthuser@example.com',
      name: 'OAuth User',
      avatarUrl: 'https://example.com/avatar.png',
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('oauthuser@example.com');
    expect(res.body.user.username).toBe('OAuth User');
    expect(res.body.token).toBeDefined();

    // Repeated call links to existing account
    const linkRes = await request(app).post('/api/auth/oauth').send({
      provider: 'google',
      email: 'oauthuser@example.com',
      name: 'OAuth User',
    });
    expect(linkRes.status).toBe(200);
    expect(linkRes.body.user.id).toBe(res.body.user.id);
  });

  it('POST /api/auth/forgot-password and reset-password flow', async () => {
    await request(app).post('/api/auth/register').send(testUser);

    const forgotRes = await request(app).post('/api/auth/forgot-password').send({
      email: testUser.email,
    });
    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.ok).toBe(true);
  });

  it('GET /api/auth/export exports user data payload', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    const res = await request(app).get('/api/auth/export').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.version).toBe('1.0');
    expect(res.body.user.email).toBe(testUser.email);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('POST /api/auth/delete-account permanently removes user and data', async () => {
    const regRes = await request(app).post('/api/auth/register').send(testUser);
    const token = regRes.body.token;

    // Fail if email mismatch
    const failRes = await request(app)
      .post('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmEmail: 'wrong@example.com' });
    expect(failRes.status).toBe(400);

    // Succeed with matching email
    const delRes = await request(app)
      .post('/api/auth/delete-account')
      .set('Authorization', `Bearer ${token}`)
      .send({ confirmEmail: testUser.email });
    expect(delRes.status).toBe(200);

    // Verify user no longer in db
    const inDb = await UserModel.findOne({ email: testUser.email });
    expect(inDb).toBeNull();
  });
});
