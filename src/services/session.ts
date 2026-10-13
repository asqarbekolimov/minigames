import type { User } from 'firebase/auth';

export const APP_SESSION_STORAGE_KEY = 'minigames:minigames-22dbe:app-session';

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface AppSession {
  displayName: string;
  email: string;
  authenticatedAt: number;
  avatarUrl?: string;
}

export interface StoredSessionResult {
  session?: AppSession;
  wasInvalid: boolean;
}

function getStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function removeStoredSession(): void {
  getStorage()?.removeItem(APP_SESSION_STORAGE_KEY);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

export function isValidAppSession(value: unknown): value is AppSession {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  if (!isNonEmptyString(candidate.displayName) || !isNonEmptyString(candidate.email)) return false;
  if (
    typeof candidate.authenticatedAt !== 'number' ||
    !Number.isFinite(candidate.authenticatedAt)
  ) {
    return false;
  }
  if (candidate.avatarUrl !== undefined && !isNonEmptyString(candidate.avatarUrl)) return false;

  return true;
}

export function readStoredSession(): StoredSessionResult {
  const raw = getStorage()?.getItem(APP_SESSION_STORAGE_KEY);
  if (raw === undefined || raw === null) return { wasInvalid: false };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    removeStoredSession();
    return { wasInvalid: true };
  }

  if (!isValidAppSession(parsed)) {
    removeStoredSession();
    return { wasInvalid: true };
  }

  return { session: parsed, wasInvalid: false };
}

export function isSessionExpired(session: AppSession, now: number = Date.now()): boolean {
  return now - session.authenticatedAt >= SESSION_TTL_MS;
}

export function deriveDisplayName(email: string): string {
  const local = email.split('@', 1)[0] ?? '';
  const candidate = local.slice(0, 30);
  return candidate.length >= 2 ? candidate : 'Player';
}

export function createSession(user: User, displayName?: string): AppSession {
  const email = user.email ?? '';
  const session: AppSession = {
    displayName: displayName ?? user.displayName ?? deriveDisplayName(email),
    email,
    authenticatedAt: Date.now(),
  };
  if (user.photoURL) session.avatarUrl = user.photoURL;

  getStorage()?.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  removeStoredSession();
}
