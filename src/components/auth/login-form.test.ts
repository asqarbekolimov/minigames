import { describe, expect, it, vi } from 'vitest';
import { createLoginForm } from '@/components/auth/login-form';

function setInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function query<T extends Element>(form: HTMLFormElement, selector: string): T {
  const element = form.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

describe('createLoginForm', () => {
  it('builds the email and password fields with a disabled submit button', () => {
    const form = createLoginForm();

    expect(form.classList.contains('login-form')).toBe(true);
    expect(query<HTMLInputElement>(form, '#login-email').type).toBe('email');
    expect(query<HTMLInputElement>(form, '#login-password').type).toBe('password');
    expect(query<HTMLButtonElement>(form, '.login-actions__submit').disabled).toBe(true);
  });

  it('validates the email format', () => {
    const form = createLoginForm();
    const email = query<HTMLInputElement>(form, '#login-email');
    const error = query<HTMLElement>(form, '.emailfield__error');

    setInput(email, 'not-an-email');
    expect(error.textContent).toBe('Please enter a valid email address.');

    setInput(email, '');
    expect(error.textContent).toBe('Please enter your email.');

    setInput(email, 'alex@example.com');
    expect(error.textContent).toBe('');
  });

  it('requires a password of at least six characters', () => {
    const form = createLoginForm();
    const password = query<HTMLInputElement>(form, '#login-password');
    const error = query<HTMLElement>(form, '.passwordfield__error');

    setInput(password, '');
    expect(error.textContent).toBe('Please enter your password.');

    setInput(password, '123');
    expect(error.textContent).toBe('Password must be at least 6 characters long.');

    setInput(password, '123456');
    expect(error.textContent).toBe('');
  });

  it('enables submit only when both fields are valid', () => {
    const form = createLoginForm();
    const email = query<HTMLInputElement>(form, '#login-email');
    const password = query<HTMLInputElement>(form, '#login-password');
    const submit = query<HTMLButtonElement>(form, '.login-actions__submit');

    setInput(email, 'alex@example.com');
    expect(submit.disabled).toBe(true);

    setInput(password, '123456');
    expect(submit.disabled).toBe(false);
  });

  it('reveals validation errors when the disabled login button is pressed', () => {
    const form = createLoginForm();
    const emailError = query<HTMLElement>(form, '.emailfield__error');

    query<HTMLElement>(form, '.login-actions__submit-wrap').click();

    expect(emailError.textContent).toBe('Please enter your email.');
  });

  it('dispatches an auth-submit event with the credentials when valid', () => {
    const form = createLoginForm();
    const email = query<HTMLInputElement>(form, '#login-email');
    const password = query<HTMLInputElement>(form, '#login-password');
    const listener = vi.fn();
    form.addEventListener('auth-submit', listener);

    setInput(email, 'alex@example.com');
    setInput(password, 'secret1');
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ mode: 'login', email: 'alex@example.com', password: 'secret1' });
  });

  it('does not dispatch when the form is invalid', () => {
    const form = createLoginForm();
    const listener = vi.fn();
    form.addEventListener('auth-submit', listener);

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(listener).not.toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    const form = createLoginForm();
    const password = query<HTMLInputElement>(form, '#login-password');
    const toggle = query<HTMLButtonElement>(form, '.password-toggle');

    toggle.click();
    expect(password.type).toBe('text');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');

    toggle.click();
    expect(password.type).toBe('password');
  });
});
