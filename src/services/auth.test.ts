import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { APP_SESSION_STORAGE_KEY, SESSION_TTL_MS, type AppSession } from '@/services/session';

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  setCustomParameters: vi.fn(),
  showSnackbar: vi.fn(),
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
vi.mock('@/components/common/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'u1',
    email: 'alex@example.com',
    displayName: 'Alex',
    photoURL: undefined,
    ...overrides,
  } as User;
}

function seedSession(overrides: Partial<AppSession> = {}): AppSession {
  const session: AppSession = {
    displayName: 'Alex',
    email: 'alex@example.com',
    authenticatedAt: Date.now(),
    ...overrides,
  };
  globalThis.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

async function loadAuth() {
  return import('@/services/auth');
}

function authCallback(): (user: User | null | undefined) => void {
  return mocks.onAuthStateChanged.mock.calls[0][1] as (user: User | null | undefined) => void;
}

describe('auth service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useRealTimers();
    globalThis.localStorage.clear();
  });

  it('returns no session before initialization', async () => {
    const auth = await loadAuth();

    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('initializes once and clears the session when signed out', async () => {
    const auth = await loadAuth();
    seedSession();

    auth.initAuth();
    auth.initAuth();
    expect(mocks.onAuthStateChanged).toHaveBeenCalledTimes(1);

    authCallback()(undefined);
    expect(auth.getCurrentSession()).toBeUndefined();
    expect(globalThis.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('restores a still-valid session at startup without changing authenticatedAt', async () => {
    const auth = await loadAuth();
    const authenticatedAt = Date.now() - 1000;
    const seeded = seedSession({ authenticatedAt });

    auth.initAuth();

    expect(auth.getCurrentSession()).toEqual(seeded);
    expect(auth.getCurrentSession()?.authenticatedAt).toBe(authenticatedAt);
  });

  it('expires a session that is already past its lifetime at startup', async () => {
    const auth = await loadAuth();
    seedSession({ authenticatedAt: Date.now() - SESSION_TTL_MS - 1 });

    auth.initAuth();

    expect(auth.getCurrentSession()).toBeUndefined();
    expect(globalThis.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.showSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'warning' }),
    );
  });

  it('drops invalid stored data and signs out at startup', async () => {
    const auth = await loadAuth();
    globalThis.localStorage.setItem(APP_SESSION_STORAGE_KEY, '{broken-json');

    auth.initAuth();

    expect(auth.getCurrentSession()).toBeUndefined();
    expect(globalThis.localStorage.getItem(APP_SESSION_STORAGE_KEY)).toBeNull();
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it('signs out a restored credential that has no valid app session', async () => {
    const auth = await loadAuth();
    auth.initAuth();

    authCallback()(makeUser());

    expect(mocks.signOut).toHaveBeenCalledWith(expect.anything());
    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('keeps a restored credential when a valid app session exists', async () => {
    const auth = await loadAuth();
    seedSession();
    auth.initAuth();

    authCallback()(makeUser());

    expect(auth.getCurrentSession()).toBeDefined();
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it('creates a session on a successful google sign-in and emits the change', async () => {
    mocks.signInWithPopup.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();
    const listener = vi.fn();
    globalThis.addEventListener('auth-state-change', listener);

    await auth.signInWithGoogle();

    expect(mocks.setCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
    expect(auth.getCurrentSession()?.email).toBe('alex@example.com');
    expect(listener).toHaveBeenCalled();
    globalThis.removeEventListener('auth-state-change', listener);
  });

  it('signs in with email and password and stores the session', async () => {
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();

    await auth.signInWithEmail('alex@example.com', 'secret1');

    expect(mocks.signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'alex@example.com',
      'secret1',
    );
    expect(auth.getCurrentSession()?.email).toBe('alex@example.com');
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
    const pending = Promise.withResolvers<{ user: User }>();
    mocks.signInWithPopup.mockReturnValue(pending.promise);
    const auth = await loadAuth();
    auth.initAuth();

    const signingIn = auth.signInWithGoogle();
    authCallback()(makeUser());

    expect(auth.getCurrentSession()?.email).toBe('alex@example.com');

    pending.resolve({ user: makeUser() });
    await signingIn;
  });

  it('signs out, clearing the session and Firebase state', async () => {
    const auth = await loadAuth();
    seedSession();
    auth.initAuth();

    await auth.signOutUser();

    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(auth.getCurrentSession()).toBeUndefined();
  });

  it('reports an active session as valid', async () => {
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();
    await auth.signInWithEmail('alex@example.com', 'secret1');

    expect(auth.isSessionActive()).toBe(true);
  });

  it('reports no active session for a guest', async () => {
    const auth = await loadAuth();

    expect(auth.isSessionActive()).toBe(false);
  });

  it('expires an active session past its lifetime and shows one snackbar', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();
    await auth.signInWithEmail('alex@example.com', 'secret1');

    vi.setSystemTime(SESSION_TTL_MS + 1);
    expect(auth.isSessionActive()).toBe(false);

    expect(auth.getCurrentSession()).toBeUndefined();
    expect(mocks.signOut).toHaveBeenCalled();
    expect(mocks.showSnackbar).toHaveBeenCalledTimes(1);
  });

  it('checks expiration when the page becomes visible again', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    mocks.signInWithEmailAndPassword.mockResolvedValue({ user: makeUser() });
    const auth = await loadAuth();
    auth.initAuth();
    await auth.signInWithEmail('alex@example.com', 'secret1');

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    vi.setSystemTime(SESSION_TTL_MS + 5);
    document.dispatchEvent(new Event('visibilitychange'));

    expect(auth.getCurrentSession()).toBeUndefined();
    expect(mocks.signOut).toHaveBeenCalled();
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
