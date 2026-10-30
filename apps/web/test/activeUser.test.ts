import { describe, it, expect, beforeEach } from 'vitest';
import {
  getActiveUserId,
  setActiveUserId,
  subscribeActiveUserId,
  DEMO_USER_ID,
} from '../src/db/activeUser';
import { getDb } from '../src/db/dexie';

describe('Active User and Database Isolation', () => {
  beforeEach(() => {
    setActiveUserId(null);
  });

  it('defaults to DEMO_USER_ID (demo)', () => {
    expect(getActiveUserId()).toBe(DEMO_USER_ID);
    expect(getActiveUserId()).toBe('demo');
  });

  it('updates active user ID and notifies subscribers', () => {
    const received: string[] = [];
    const unsubscribe = subscribeActiveUserId((id) => received.push(id));

    setActiveUserId('user_123');
    expect(getActiveUserId()).toBe('user_123');

    setActiveUserId('user_456');
    expect(getActiveUserId()).toBe('user_456');

    setActiveUserId(null);
    expect(getActiveUserId()).toBe(DEMO_USER_ID);

    unsubscribe();
    setActiveUserId('user_789');
    expect(received).toEqual(['user_123', 'user_456', 'demo']);
  });

  it('resolves distinct database instances for demo vs user session', () => {
    setActiveUserId(null);
    const demoDb = getDb();
    expect(demoDb.name).toBe('synctask_demo');

    setActiveUserId('user_presentation');
    const userDb = getDb();
    expect(userDb.name).toBe('synctask_user_presentation');
    expect(demoDb.name).not.toBe(userDb.name);

    setActiveUserId(null);
    const backToDemoDb = getDb();
    expect(backToDemoDb.name).toBe('synctask_demo');
  });
});

