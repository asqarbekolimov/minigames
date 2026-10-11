import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { clearSession, createSession, readSession } from '@/services/session';

const STORAGE_KEY = 'minigames.auth.session';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'user-1',
    email: 'alex@example.com',
    displayName: 'Alex',
    photoURL: 'https://example.com/avatar.png',
    ...overrides,
  } as User;
}

function storedRaw(): string | undefined {
  return globalThis.localStorage.getItem(STORAGE_KEY) ?? undefined;
}

describe('session', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns no session when nothing is stored', () => {
    expect(readSession()).toBeUndefined();
  });

  it('creates and persists a session from a Firebase user', () => {
    const user = makeUser();
    const session = createSession(user);

    expect(session.uid).toBe('user-1');
    expect(session.email).toBe('alex@example.com');
    expect(session.displayName).toBe('Alex');
    expect(session.photoURL).toBe('https://example.com/avatar.png');
    expect(session.expiresAt).toBeGreaterThan(session.createdAt);
    expect(storedRaw()).toBeDefined();
    expect(readSession()).toEqual(session);
  });

  it('normalises missing optional user fields to undefined', () => {
    const session = createSession(
      makeUser({ email: undefined, displayName: undefined, photoURL: undefined }),
    );

    expect(session.email).toBeUndefined();
    expect(session.displayName).toBeUndefined();
    expect(session.photoURL).toBeUndefined();
  });

  it('uses an explicit displayName override (registration username)', () => {
    const session = createSession(makeUser({ displayName: undefined }), 'CozyGamer99');

    expect(session.displayName).toBe('CozyGamer99');
  });

  it('discards an expired session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    createSession(makeUser());

    vi.setSystemTime(new Date('2026-01-03T00:00:00Z'));
    expect(readSession()).toBeUndefined();
    expect(storedRaw()).toBeUndefined();
  });

  it('discards and removes malformed session data', () => {
    globalThis.localStorage.setItem(STORAGE_KEY, '{not-json');

    expect(readSession()).toBeUndefined();
    expect(storedRaw()).toBeUndefined();
  });

  it('clears the stored session', () => {
    createSession(makeUser());
    clearSession();

    expect(readSession()).toBeUndefined();
  });
});
