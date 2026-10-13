import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import {
  APP_SESSION_STORAGE_KEY,
  SESSION_TTL_MS,
  clearSession,
  createSession,
  deriveDisplayName,
  isSessionExpired,
  isValidAppSession,
  readStoredSession,
} from '@/services/session';

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
  return globalThis.localStorage.getItem(APP_SESSION_STORAGE_KEY) ?? undefined;
}

function seed(value: unknown): void {
  globalThis.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(value));
}

describe('app session storage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses a namespaced project-specific key', () => {
    expect(APP_SESSION_STORAGE_KEY).toBe('minigames:minigames-22dbe:app-session');
  });

  it('reports no session when nothing is stored', () => {
    expect(readStoredSession()).toEqual({ wasInvalid: false });
  });

  it('creates and persists the minimum profile data', () => {
    const session = createSession(makeUser());

    expect(session).toEqual({
      displayName: 'Alex',
      email: 'alex@example.com',
      authenticatedAt: expect.any(Number),
      avatarUrl: 'https://example.com/avatar.png',
    });
    expect(readStoredSession().session).toEqual(session);
  });

  it('omits avatarUrl when the provider supplies no photo', () => {
    const session = createSession(makeUser({ photoURL: undefined }));

    expect(session.avatarUrl).toBeUndefined();
    expect(storedRaw()).not.toContain('avatarUrl');
  });

  it('falls back to a valid display name derived from the email local part', () => {
    const session = createSession(makeUser({ displayName: undefined, email: 'cozygamer99@x.com' }));

    expect(session.displayName).toBe('cozygamer99');
  });

  it('honours an explicit display name (registration username)', () => {
    const session = createSession(makeUser({ displayName: undefined }), 'CozyGamer99');

    expect(session.displayName).toBe('CozyGamer99');
  });

  it('restores a still-valid session', () => {
    const session = createSession(makeUser());

    expect(readStoredSession()).toEqual({ session, wasInvalid: false });
  });

  it('treats malformed JSON as invalid and removes only our key', () => {
    globalThis.localStorage.setItem(APP_SESSION_STORAGE_KEY, '{not-json');
    globalThis.localStorage.setItem('unrelated', 'keep');

    expect(readStoredSession()).toEqual({ wasInvalid: true });
    expect(storedRaw()).toBeUndefined();
    expect(globalThis.localStorage.getItem('unrelated')).toBe('keep');
  });

  it('treats missing required fields as invalid and removes the key', () => {
    seed({ email: 'alex@example.com' });

    expect(readStoredSession()).toEqual({ wasInvalid: true });
    expect(storedRaw()).toBeUndefined();
  });

  it('treats fields of the wrong type as invalid', () => {
    seed({ displayName: 'Alex', email: 42, authenticatedAt: 'now' });

    expect(readStoredSession().wasInvalid).toBe(true);
    expect(storedRaw()).toBeUndefined();
  });

  it('rejects a non-string avatarUrl', () => {
    expect(
      isValidAppSession({
        displayName: 'Alex',
        email: 'alex@example.com',
        authenticatedAt: 1,
        avatarUrl: 5,
      }),
    ).toBe(false);
  });

  it('validates the session shape', () => {
    expect(isValidAppSession(undefined)).toBe(false);
    expect(isValidAppSession('session')).toBe(false);
    expect(isValidAppSession({ displayName: '', email: 'a@b.com', authenticatedAt: 1 })).toBe(
      false,
    );
    expect(isValidAppSession({ displayName: 'A', email: 'a@b.com', authenticatedAt: 1 })).toBe(
      true,
    );
  });

  it('computes expiration from authenticatedAt without extending on reload', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const session = createSession(makeUser());

    vi.setSystemTime(1_000_000 + SESSION_TTL_MS - 1);
    expect(isSessionExpired(session)).toBe(false);

    vi.setSystemTime(1_000_000 + SESSION_TTL_MS);
    expect(isSessionExpired(session)).toBe(true);
  });

  it('derives a 2-30 character fallback name', () => {
    expect(deriveDisplayName('a@x.com')).toBe('Player');
    expect(deriveDisplayName('ab@x.com')).toBe('ab');
    expect(deriveDisplayName(`${'x'.repeat(40)}@x.com`)).toHaveLength(30);
  });

  it('clears the stored session', () => {
    createSession(makeUser());
    clearSession();

    expect(storedRaw()).toBeUndefined();
  });
});
