import type { User } from 'firebase/auth';
import { createLoginForm } from '@/components/auth/login-form';
import { createRegisterForm } from '@/components/auth/register-form';
import { showSnackbar } from '@/components/common/snackbar';
import {
  getAuthErrorMessage,
  isCanceledAuthError,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from '@/services/auth';
import './login-page.scss';

interface AuthSubmitDetail {
  mode: 'login' | 'register';
  email: string;
  password: string;
  username?: string;
}

function getDisplayName(user: User): string {
  return user.displayName ?? user.email ?? 'player';
}

export function createAuthForm(initialMode: 'login' | 'register' = 'login'): HTMLElement {
  const form = document.createElement('div');
  form.classList.add('auth-page');

  form.innerHTML = `
    <section class="login-dialog" role="dialog" aria-modal="true" aria-labelledby="login-title">
      <div class="auth-tabs" role="tablist" aria-label="Account access">
        <button id="login-tab" class="auth-tabs__tab auth-tabs__tab--active" type="button" role="tab" aria-selected="true" aria-controls="login-panel" data-auth-tab="login">Login</button>
        <button id="register-tab" class="auth-tabs__tab" type="button" role="tab" aria-selected="false" aria-controls="register-panel" data-auth-tab="register">Register</button>
      </div>

      <div class="login-dialog__header">
        <h1 id="login-title" data-auth-title>Welcome Back!</h1>
        <p data-auth-copy>Sign in to resume your games and progress.</p>
      </div>

      <div id="login-panel" class="auth-form-slot" role="tabpanel" aria-labelledby="login-tab"></div>
      <div id="register-panel" class="auth-form-slot" role="tabpanel" aria-labelledby="register-tab" hidden></div>

      <p class="login-dialog__footer">
        <span data-footer-copy>Don't have an account?</span>
        <button type="button" data-footer-action>Register</button>
      </p>
    </section>
  `;

  const tabs = [...form.querySelectorAll<HTMLButtonElement>('[data-auth-tab]')];
  const title = form.querySelector<HTMLElement>('[data-auth-title]');
  const copy = form.querySelector<HTMLElement>('[data-auth-copy]');
  const formSlots = {
    login: form.querySelector<HTMLElement>('#login-panel'),
    register: form.querySelector<HTMLElement>('#register-panel'),
  };
  const footerCopy = form.querySelector<HTMLElement>('[data-footer-copy]');
  const footerAction = form.querySelector<HTMLButtonElement>('[data-footer-action]');

  let currentMode: 'login' | 'register' = initialMode;
  let isAnimating = false;

  const applyMode = (mode: 'login' | 'register') => {
    const isLogin = mode === 'login';
    for (const tab of tabs) {
      const isActive = tab.dataset.authTab === mode;
      tab.classList.toggle('auth-tabs__tab--active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    }
    for (const [panelMode, panel] of Object.entries(formSlots)) {
      panel?.toggleAttribute('hidden', panelMode !== mode);
    }
    if (title) title.textContent = isLogin ? 'Welcome Back!' : 'Create Your Account';
    if (copy)
      copy.textContent = isLogin
        ? 'Sign in to resume your games and progress.'
        : 'Create an account to save your games and progress.';
    formSlots[mode]?.replaceChildren(isLogin ? createLoginForm() : createRegisterForm());
    if (footerCopy)
      footerCopy.textContent = isLogin ? "Don't have an account?" : 'Already have an account?';
    if (footerAction) footerAction.textContent = isLogin ? 'Register' : 'Login';
  };

  const setMode = (mode: 'login' | 'register') => {
    if (mode === currentMode || isAnimating) return;
    isAnimating = true;

    const isForward = mode === 'register';
    const outClass = isForward ? 'auth-form-slot--out-left' : 'auth-form-slot--out-right';
    const inClass = isForward ? 'auth-form-slot--in-right' : 'auth-form-slot--in-left';

    const oldPanel = formSlots[currentMode];
    const newPanel = formSlots[mode];

    for (const tab of tabs) {
      const isActive = tab.dataset.authTab === mode;
      tab.classList.toggle('auth-tabs__tab--active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    }

    if (oldPanel) {
      oldPanel.classList.add(outClass);

      const onOutEnd = () => {
        oldPanel.removeEventListener('animationend', onOutEnd);
        oldPanel.classList.remove(outClass);
        oldPanel.toggleAttribute('hidden', true);

        const isLogin = mode === 'login';
        if (title) title.textContent = isLogin ? 'Welcome Back!' : 'Create Your Account';
        if (copy)
          copy.textContent = isLogin
            ? 'Sign in to resume your games and progress.'
            : 'Create an account to save your games and progress.';
        if (footerCopy)
          footerCopy.textContent = isLogin ? "Don't have an account?" : 'Already have an account?';
        if (footerAction) footerAction.textContent = isLogin ? 'Register' : 'Login';

        const header = form.querySelector('.login-dialog__header');
        if (header) {
          header.classList.remove('login-dialog__header--animating');
          void (header as HTMLElement).offsetWidth;
          header.classList.add('login-dialog__header--animating');
          header.addEventListener(
            'animationend',
            () => header.classList.remove('login-dialog__header--animating'),
            { once: true },
          );
        }

        if (newPanel) {
          newPanel.replaceChildren(isLogin ? createLoginForm() : createRegisterForm());
          newPanel.toggleAttribute('hidden', false);
          newPanel.classList.add(inClass);

          const onInEnd = () => {
            newPanel.removeEventListener('animationend', onInEnd);
            newPanel.classList.remove(inClass);
            currentMode = mode;
            isAnimating = false;
          };
          newPanel.addEventListener('animationend', onInEnd);
        }
      };
      oldPanel.addEventListener('animationend', onOutEnd);
    }
  };

  let isAuthPending = false;
  const pendingControls: Array<{
    control: HTMLInputElement | HTMLButtonElement;
    disabled: boolean;
  }> = [];

  const setPending = (isPending: boolean): void => {
    isAuthPending = isPending;
    form.classList.toggle('auth-page--pending', isPending);

    const controls = form.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input, button');

    if (isPending) {
      for (const control of controls) {
        pendingControls.push({ control, disabled: control.disabled });
        control.disabled = true;
      }
      return;
    }

    for (const { control, disabled } of pendingControls) {
      control.disabled = disabled;
    }
    pendingControls.length = 0;
  };

  const requestClose = (): void => {
    if (isAuthPending) return;
    form.dispatchEvent(new Event('login-modal-close'));
  };

  const runAuthOperation = async (
    operation: () => Promise<User>,
    successMessage: (user: User) => string,
    triggerButton?: HTMLButtonElement,
  ): Promise<void> => {
    if (isAuthPending) return;

    setPending(true);
    triggerButton?.classList.add('is-loading');
    triggerButton?.setAttribute('aria-busy', 'true');

    try {
      const user = await operation();
      triggerButton?.classList.remove('is-loading');
      triggerButton?.removeAttribute('aria-busy');
      setPending(false);

      showSnackbar({ message: successMessage(user), variant: 'success' });
      form.dispatchEvent(new Event('login-modal-close'));
    } catch (error) {
      triggerButton?.classList.remove('is-loading');
      triggerButton?.removeAttribute('aria-busy');
      setPending(false);

      if (isCanceledAuthError(error)) {
        showSnackbar({ message: 'Sign-in was canceled.', variant: 'info' });
        return;
      }

      showSnackbar({ message: getAuthErrorMessage(error), variant: 'error' });
    }
  };

  form.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const googleButton = event.target.closest<HTMLButtonElement>('.login-actions__google');
    if (!googleButton) return;
    event.preventDefault();

    void runAuthOperation(
      () => signInWithGoogle(),
      (user) => `Signed in as ${getDisplayName(user)}.`,
      googleButton,
    );
  });

  form.addEventListener('auth-submit', (event) => {
    const detail = (event as CustomEvent<AuthSubmitDetail>).detail;
    if (!detail) return;

    const sourceForm = event.target instanceof HTMLFormElement ? event.target : undefined;
    const submitButton =
      sourceForm?.querySelector<HTMLButtonElement>('.login-actions__submit') ?? undefined;

    if (detail.mode === 'login') {
      void runAuthOperation(
        () => signInWithEmail(detail.email, detail.password),
        (user) => `Signed in as ${getDisplayName(user)}.`,
        submitButton,
      );
      return;
    }

    void runAuthOperation(
      () => registerWithEmail(detail.email, detail.password, detail.username ?? ''),
      (user) => `Welcome, ${getDisplayName(user)}! Your account is ready.`,
      submitButton,
    );
  });

  for (const tab of tabs) {
    tab.addEventListener('click', () => setMode(tab.dataset.authTab as 'login' | 'register'));
  }
  footerAction?.addEventListener('click', () =>
    setMode(footerAction.textContent === 'Register' ? 'register' : 'login'),
  );
  form.addEventListener('click', (event) => {
    if (event.target === form) requestClose();
  });
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') requestClose();
  });
  applyMode(initialMode);

  return form;
}
