import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { clearSession, createSession, readSession, type AppSession } from '@/services/session';

export type AuthSession = AppSession | undefined;

interface AuthState {
  session: AuthSession;
  isInitialized: boolean;
  isSignInPending: boolean;
  googleProvider?: GoogleAuthProvider;
}

const state: AuthState = {
  session: undefined,
  isInitialized: false,
  isSignInPending: false,
};

function getGoogleProvider(): GoogleAuthProvider {
  if (!state.googleProvider) {
    state.googleProvider = new GoogleAuthProvider();
    state.googleProvider.setCustomParameters({ prompt: 'select_account' });
  }
  return state.googleProvider;
}

function emitAuthChange(): void {
  globalThis.dispatchEvent(new CustomEvent('auth-state-change', { detail: state.session }));
}

function setSession(session: AuthSession): void {
  state.session = session;
  emitAuthChange();
}

export function getCurrentSession(): AuthSession {
  return state.session;
}

function getErrorCode(error: unknown): string | undefined {
  return (error as { code?: string } | undefined)?.code;
}

export function initAuth(): void {
  if (state.isInitialized) return;
  state.isInitialized = true;

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      clearSession();
      if (state.session) setSession(undefined);
      return;
    }

    const stored = readSession();
    if (stored && stored.uid === user.uid) {
      setSession(stored);
      return;
    }

    if (state.isSignInPending) {
      setSession(createSession(user));
      return;
    }

    void signOut(auth);
  });
}

function ensureSession(user: User): void {
  if (!state.session || state.session.uid !== user.uid) {
    setSession(createSession(user));
  }
}

export async function signInWithGoogle(): Promise<User> {
  state.isSignInPending = true;
  try {
    const result = await signInWithPopup(auth, getGoogleProvider());
    ensureSession(result.user);
    return result.user;
  } finally {
    state.isSignInPending = false;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  state.isSignInPending = true;
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    ensureSession(result.user);
    return result.user;
  } finally {
    state.isSignInPending = false;
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  username: string,
): Promise<User> {
  state.isSignInPending = true;
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: username });
    setSession(createSession(result.user, username));
    return result.user;
  } finally {
    state.isSignInPending = false;
  }
}

export async function signOutUser(): Promise<void> {
  clearSession();
  setSession(undefined);
  await signOut(auth);
}

export function isCanceledAuthError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (!code) return false;

  return [
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/user-cancelled',
  ].includes(code);
}

export function getAuthErrorMessage(error: unknown): string {
  switch (getErrorCode(error)) {
    case 'auth/popup-blocked': {
      return 'Your browser blocked the Google sign-in popup. Allow popups and try again.';
    }
    case 'auth/network-request-failed': {
      return 'Network error. Check your connection and try again.';
    }
    case 'auth/account-exists-with-different-credential': {
      return 'An account already exists with this email using a different sign-in method.';
    }
    case 'auth/operation-not-allowed': {
      return 'This sign-in method is not enabled for this project.';
    }
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': {
      return 'Incorrect email or password.';
    }
    case 'auth/email-already-in-use': {
      return 'An account with this email already exists.';
    }
    case 'auth/weak-password': {
      return 'Password is too weak. Use at least 6 characters.';
    }
    case 'auth/invalid-email': {
      return 'Please enter a valid email address.';
    }
    case 'auth/too-many-requests': {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    default: {
      return error instanceof Error ? error.message : 'Google sign-in failed. Please try again.';
    }
  }
}
