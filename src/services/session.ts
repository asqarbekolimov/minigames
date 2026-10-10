import type { User } from 'firebase/auth';

const SESSION_STORAGE_KEY = 'minigames.auth.session';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface AppSession {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
  expiresAt: number;
}

function getStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function readSession(): AppSession | undefined {
  const raw = getStorage()?.getItem(SESSION_STORAGE_KEY);
  if (!raw) return undefined;

  try {
    const session = JSON.parse(raw) as AppSession;
    if (typeof session.expiresAt !== 'number' || Date.now() >= session.expiresAt) {
      getStorage()?.removeItem(SESSION_STORAGE_KEY);
      return undefined;
    }
    return session;
  } catch {
    getStorage()?.removeItem(SESSION_STORAGE_KEY);
    return undefined;
  }
}

export function createSession(user: User, displayName?: string): AppSession {
  const now = Date.now();
  const session: AppSession = {
    uid: user.uid,
    email: user.email ?? undefined,
    displayName: displayName ?? user.displayName ?? undefined,
    photoURL: user.photoURL ?? undefined,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  getStorage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  getStorage()?.removeItem(SESSION_STORAGE_KEY);
}
