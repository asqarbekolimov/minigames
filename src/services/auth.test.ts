import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  setCustomParameters: vi.fn(),
}));

vi.mock('firebase/auth', () => {
  class GoogleAuthProvider {
    setCustomParameters = mocks.setCustomParameters;
  }
  return {
    GoogleAuthProvider,
    onAuthStateChanged: mocks.onAuthStateChanged,
    signInWithPopup: mocks.signInWithPopup,
    signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
    createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
    updateProfile: mocks.updateProfile,
    signOut: mocks.signOut,
  };
});

vi.mock('@/services/firebase', () => ({ app: {}, auth: {} }));

const STORAGE_KEY = 'minigames.auth.session';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'u1',
    email: 'alex@example.com',
    displayName: 'Alex',
    photoURL: undefined,
    ...overrides,
  } as User;
}

function deferred<T>() {
  return Promise.withResolvers<T>();
}

async function loadAuth() {
  return import('@/services/auth');
}

function authCallback(): (user: User | null | undefined) => void {
  return mocks.onAuthStateChanged.mock.calls[0][1] as (user: User | null | undefined) => void;
}

function seedSession(uid: string): void {
  globalThis.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      uid,
      email: 'alex@example.com',
      createdAt: Date.now(),
      expiresAt: Date.now() + 10_000,
    }),
  );
}

describe('auth service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    globalThis.localStorage.clear();
  });

  it('returns no session before initialization', async () => {
    const auth = await loadAuth();

    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('initializes once and clears the session when signed out', async () => {
    const auth = await loadAuth();
    seedSession('u1');

    auth.initAuth();
    auth.initAuth();
    expect(mocks.onAuthStateChanged).toHaveBeenCalledTimes(1);

    authCallback()(undefined);
    expect(auth.getCurrentSession()).toBeUndefined();
    expect(globalThis.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('signs out a restored credential that has no valid app session', async () => {
    const auth = await loadAuth();
    auth.initAuth();
    seedSession('u1');

    authCallback()(makeUser({ uid: 'u2' }));

    expect(mocks.signOut).toHaveBeenCalledWith(expect.anything());
    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('restores the stored session for a matching restored user', async () => {
    const auth = await loadAuth();
    seedSession('u1');
    auth.initAuth();

    authCallback()(makeUser({ uid: 'u1' }));

    expect(auth.getCurrentSession()?.uid).toBe('u1');
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('creates a session on a successful google sign-in and emits the change', async () => {
    mocks.signInWithPopup.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();
    const listener = vi.fn();
    globalThis.addEventListener('auth-state-change', listener);

    const user = await auth.signInWithGoogle();

    expect(mocks.setCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
    expect(user.uid).toBe('u1');
    expect(auth.getCurrentSession()?.email).toBe('alex@example.com');
    expect(listener).toHaveBeenCalled();
    globalThis.removeEventListener('auth-state-change', listener);
  });

  it('signs in with email and password', async () => {
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();

    await auth.signInWithEmail('alex@example.com', 'secret1');

    expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'alex@example.com',
      'secret1',
    );
    expect(auth.getCurrentSession()?.uid).toBe('u1');
  });

  it('propagates email sign-in failures without creating a session', async () => {
    mocks.signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/wrong-password' });
    const auth = await loadAuth();

    await expect(auth.signInWithEmail('alex@example.com', 'nope')).rejects.toMatchObject({
      code: 'auth/wrong-password',
    });
    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('registers an account storing the username as displayName', async () => {
    mocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: makeUser({ displayName: undefined }),
    });
    const auth = await loadAuth();

    await auth.registerWithEmail('alex@example.com', 'Secret1!', 'CozyGamer99');

    expect(mocks.updateProfile).toHaveBeenCalledWith(expect.anything(), {
      displayName: 'CozyGamer99',
    });
    expect(auth.getCurrentSession()?.displayName).toBe('CozyGamer99');
  });

  it('creates the session when the auth event arrives while signing in', async () => {
    const pending = deferred<{ user: User }>();
    mocks.signInWithPopup.mockReturnValue(pending.promise);
    const auth = await loadAuth();
    auth.initAuth();

    const signingIn = auth.signInWithGoogle();
    authCallback()(makeUser());

    expect(auth.getCurrentSession()?.uid).toBe('u1');

    pending.resolve({ user: makeUser() });
    await signingIn;
  });

  it('signs out, clearing the session and Firebase state', async () => {
    const auth = await loadAuth();
    seedSession('u1');
    auth.initAuth();
    authCallback()(makeUser({ uid: 'u1' }));

    await auth.signOutUser();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('classifies canceled provider errors', async () => {
    const auth = await loadAuth();

    expect(auth.isCanceledAuthError({ code: 'auth/popup-closed-by-user' })).toBe(true);
    expect(auth.isCanceledAuthError({ code: 'auth/cancelled-popup-request' })).toBe(true);
    expect(auth.isCanceledAuthError({ code: 'auth/user-cancelled' })).toBe(true);
    expect(auth.isCanceledAuthError({ code: 'auth/other' })).toBe(false);
    expect(auth.isCanceledAuthError(undefined)).toBe(false);
  });

  it('maps Firebase error codes to user-facing messages', async () => {
    const auth = await loadAuth();

    expect(auth.getAuthErrorMessage({ code: 'auth/popup-blocked' })).toContain('popup');
    expect(auth.getAuthErrorMessage({ code: 'auth/network-request-failed' })).toContain('Network');
    expect(
      auth.getAuthErrorMessage({ code: 'auth/account-exists-with-different-credential' }),
    ).toContain('different sign-in method');
    expect(auth.getAuthErrorMessage({ code: 'auth/operation-not-allowed' })).toContain(
      'not enabled',
    );
    expect(auth.getAuthErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Incorrect email or password.',
    );
    expect(auth.getAuthErrorMessage({ code: 'auth/email-already-in-use' })).toContain(
      'already exists',
    );
    expect(auth.getAuthErrorMessage({ code: 'auth/weak-password' })).toContain('too weak');
    expect(auth.getAuthErrorMessage({ code: 'auth/invalid-email' })).toContain('valid email');
    expect(auth.getAuthErrorMessage({ code: 'auth/too-many-requests' })).toContain('Too many');
    expect(auth.getAuthErrorMessage(new Error('boom'))).toBe('boom');
    expect(auth.getAuthErrorMessage('strange')).toBe('Google sign-in failed. Please try again.');
  });
});
