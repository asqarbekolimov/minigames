import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';

const mocks = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  getAuthErrorMessage: vi.fn(() => 'Authentication failed'),
  isCanceledAuthError: vi.fn(() => false),
  showSnackbar: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  signInWithGoogle: mocks.signInWithGoogle,
  signInWithEmail: mocks.signInWithEmail,
  registerWithEmail: mocks.registerWithEmail,
  getAuthErrorMessage: mocks.getAuthErrorMessage,
  isCanceledAuthError: mocks.isCanceledAuthError,
}));

vi.mock('@/components/common/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

import { createAuthForm } from '@/components/auth/auth-form';

function deferred<T>() {
  return Promise.withResolvers<T>();
}

function user(overrides: Partial<User> = {}): User {
  return { uid: 'u1', email: 'alex@example.com', displayName: 'Alex', ...overrides } as User;
}

function finishModeAnimation(form: HTMLElement): void {
  for (let pass = 0; pass < 2; pass += 1) {
    for (const panel of form.querySelectorAll('.auth-form-slot')) {
      panel.dispatchEvent(new Event('animationend'));
    }
  }
}

describe('createAuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAuthErrorMessage.mockReturnValue('Authentication failed');
    mocks.isCanceledAuthError.mockReturnValue(false);
  });

  it('renders the dialog with the login panel active by default', () => {
    const form = createAuthForm('login');

    expect(form.classList.contains('auth-page')).toBe(true);
    expect(form.querySelector('#login-panel')?.hasAttribute('hidden')).toBe(false);
    expect(form.querySelector('#register-panel')?.hasAttribute('hidden')).toBe(true);
    expect(form.querySelector('[data-auth-title]')?.textContent).toBe('Welcome Back!');
  });

  it('opens in register mode when requested', () => {
    const form = createAuthForm('register');

    expect(form.querySelector('[data-auth-title]')?.textContent).toBe('Create Your Account');
    expect(form.querySelector('#register-panel')?.hasAttribute('hidden')).toBe(false);
  });

  it('switches between login and register tabs and clears the forms', () => {
    const form = createAuthForm('login');

    form.querySelector<HTMLButtonElement>('[data-auth-tab="register"]')?.click();
    finishModeAnimation(form);
    expect(form.querySelector('#register-panel')?.hasAttribute('hidden')).toBe(false);
    expect(form.querySelector(':scope #register-panel #register-email')).not.toBeNull();

    form.querySelector<HTMLButtonElement>('[data-auth-tab="login"]')?.click();
    finishModeAnimation(form);
    expect(form.querySelector(':scope #login-panel #login-email')).not.toBeNull();
  });

  it('toggles back to login from the footer action', () => {
    const form = createAuthForm('register');

    form.querySelector<HTMLButtonElement>('[data-footer-action]')?.click();
    finishModeAnimation(form);

    expect(form.querySelector('#login-panel')?.hasAttribute('hidden')).toBe(false);
  });

  it('runs the google flow, locks every control, then closes on success', async () => {
    const pending = deferred<User>();
    mocks.signInWithGoogle.mockReturnValue(pending.promise);

    const form = createAuthForm('login');
    const close = vi.fn();
    form.addEventListener('login-modal-close', close);

    const google = form.querySelector<HTMLButtonElement>('.login-actions__google');
    google?.click();

    expect(form.classList.contains('auth-page--pending')).toBe(true);
    expect(google?.disabled).toBe(true);
    expect(form.querySelector<HTMLInputElement>('#login-email')?.disabled).toBe(true);
    expect(google?.classList.contains('is-loading')).toBe(true);

    pending.resolve(user({ displayName: 'Alex' }));
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));

    expect(form.classList.contains('auth-page--pending')).toBe(false);
    expect(mocks.showSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'success' }),
    );
  });

  it('blocks closing the dialog while a provider request is pending', () => {
    const pending = deferred<User>();
    mocks.signInWithGoogle.mockReturnValue(pending.promise);

    const form = createAuthForm('login');
    const close = vi.fn();
    form.addEventListener('login-modal-close', close);

    form.querySelector<HTMLButtonElement>('.login-actions__google')?.click();

    form.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    form.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).not.toHaveBeenCalled();

    pending.resolve(user());
  });

  it('keeps the dialog open and shows an error when google fails', async () => {
    mocks.signInWithGoogle.mockRejectedValue(new Error('popup blocked'));

    const form = createAuthForm('login');
    const close = vi.fn();
    form.addEventListener('login-modal-close', close);

    form.querySelector<HTMLButtonElement>('.login-actions__google')?.click();

    await vi.waitFor(() =>
      expect(mocks.showSnackbar).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'error' }),
      ),
    );
    expect(close).not.toHaveBeenCalled();
    expect(form.classList.contains('auth-page--pending')).toBe(false);
    expect(form.querySelector<HTMLInputElement>('#login-email')?.disabled).toBe(false);
  });

  it('shows an info message when the provider flow is canceled', async () => {
    mocks.signInWithGoogle.mockRejectedValue(new Error('canceled'));
    mocks.isCanceledAuthError.mockReturnValue(true);

    const form = createAuthForm('login');
    form.querySelector<HTMLButtonElement>('.login-actions__google')?.click();

    await vi.waitFor(() =>
      expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'info' })),
    );
  });

  it('ignores a second google click while one is pending', () => {
    const pending = deferred<User>();
    mocks.signInWithGoogle.mockReturnValue(pending.promise);

    const form = createAuthForm('login');
    const google = form.querySelector<HTMLButtonElement>('.login-actions__google');
    google?.click();
    google?.click();

    expect(mocks.signInWithGoogle).toHaveBeenCalledTimes(1);
    pending.resolve(user());
  });

  it('signs in with email and password from the login form', async () => {
    const pending = deferred<User>();
    mocks.signInWithEmail.mockReturnValue(pending.promise);

    const form = createAuthForm('login');
    const close = vi.fn();
    form.addEventListener('login-modal-close', close);

    const innerForm = form.querySelector(':scope #login-panel form');
    innerForm?.dispatchEvent(
      new CustomEvent('auth-submit', {
        bubbles: true,
        detail: { mode: 'login', email: 'alex@example.com', password: 'secret1' },
      }),
    );

    expect(mocks.signInWithEmail).toHaveBeenCalledWith('alex@example.com', 'secret1');
    pending.resolve(user());
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it('registers a new account from the register form', async () => {
    const pending = deferred<User>();
    mocks.registerWithEmail.mockReturnValue(pending.promise);

    const form = createAuthForm('register');
    const innerForm = form.querySelector(':scope #register-panel form');
    innerForm?.dispatchEvent(
      new CustomEvent('auth-submit', {
        bubbles: true,
        detail: {
          mode: 'register',
          email: 'alex@example.com',
          password: 'Secret1!',
          username: 'CozyGamer99',
        },
      }),
    );

    expect(mocks.registerWithEmail).toHaveBeenCalledWith(
      'alex@example.com',
      'Secret1!',
      'CozyGamer99',
    );
    pending.resolve(user({ displayName: 'CozyGamer99' }));
  });

  it('closes when the backdrop is clicked while idle', () => {
    const form = createAuthForm('login');
    const close = vi.fn();
    form.addEventListener('login-modal-close', close);

    form.dispatchEvent(new MouseEvent('click'));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape while idle', () => {
    const form = createAuthForm('login');
    const close = vi.fn();
    form.addEventListener('login-modal-close', close);

    form.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(close).toHaveBeenCalledTimes(1);
  });
});
