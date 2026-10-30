import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('API Health', () => {
  it('GET /api/health returns ok: true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('GET /api/unknown returns 404 with structured error', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
