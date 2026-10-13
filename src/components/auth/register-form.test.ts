import { describe, expect, it, vi } from 'vitest';
import { createRegisterForm } from '@/components/auth/register-form';

function setInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function query<T extends Element>(form: HTMLFormElement, selector: string): T {
  const element = form.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

function fillValid(form: HTMLFormElement): void {
  setInput(query<HTMLInputElement>(form, '#register-username'), 'CozyGamer99');
  setInput(query<HTMLInputElement>(form, '#register-email'), 'alex@example.com');
  setInput(query<HTMLInputElement>(form, '#register-password'), 'Secret1!');
  setInput(query<HTMLInputElement>(form, '#register-confirm-password'), 'Secret1!');
}

describe('createRegisterForm', () => {
  it('builds all four fields', () => {
    const form = createRegisterForm();

    expect(form.querySelector('#register-username')).not.toBeNull();
    expect(form.querySelector('#register-email')).not.toBeNull();
    expect(form.querySelector('#register-password')).not.toBeNull();
    expect(form.querySelector('#register-confirm-password')).not.toBeNull();
    expect(form.noValidate).toBe(true);
  });

  it('enforces the username rules', () => {
    const form = createRegisterForm();
    const username = query<HTMLInputElement>(form, '#register-username');
    const error = query<HTMLElement>(form, '.usernamefield__error');

    setInput(username, '');
    expect(error.textContent).toBe('Please enter your username.');

    setInput(username, 'lowercase');
    expect(error.textContent).toContain('capital letter');

    setInput(username, 'A');
    expect(error.textContent).toContain('2-30 characters');

    setInput(username, 'Bad_Name');
    expect(error.textContent).toContain('letters and numbers');

    setInput(username, 'CozyGamer99');
    expect(error.textContent).toBe('');
  });

  it('validates the email address', () => {
    const form = createRegisterForm();
    const email = query<HTMLInputElement>(form, '#register-email');
    const error = query<HTMLElement>(form, '.emailfield__error');

    setInput(email, 'nope');
    expect(error.textContent).toBe('Please enter a valid email address.');

    setInput(email, 'alex@example.com');
    expect(error.textContent).toBe('');
  });

  it('enforces the strong password rules', () => {
    const form = createRegisterForm();
    const password = query<HTMLInputElement>(form, '#register-password');
    const error = query<HTMLElement>(form, '.passwordfield__error');

    setInput(password, 'weak');
    expect(error.textContent).toContain('at least 6 characters');

    setInput(password, 'alllower1!');
    expect(error.textContent).toContain('uppercase');

    setInput(password, 'NoNumber!');
    expect(error.textContent).toContain('digit');

    setInput(password, 'NoSpecial1');
    expect(error.textContent).toContain('special');

    setInput(password, 'Secret1!');
    expect(error.textContent).toBe('');
  });

  it('requires the confirmation to match and revalidates on password change', () => {
    const form = createRegisterForm();
    const password = query<HTMLInputElement>(form, '#register-password');
    const confirm = query<HTMLInputElement>(form, '#register-confirm-password');
    const error = query<HTMLElement>(form, '.confirm-passwordfield__error');

    setInput(confirm, '');
    expect(error.textContent).toBe('Please confirm your password.');

    setInput(password, 'Secret1!');
    setInput(confirm, 'Secret1!');
    expect(error.textContent).toBe('');

    setInput(confirm, 'Mismatch1!');
    expect(error.textContent).toBe('Passwords do not match.');

    setInput(password, 'Changed1!');
    expect(error.textContent).toBe('Passwords do not match.');
  });

  it('dispatches an auth-submit event with the registration payload', () => {
    const form = createRegisterForm();
    const listener = vi.fn();
    form.addEventListener('auth-submit', listener);

    fillValid(form);
    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({
      mode: 'register',
      email: 'alex@example.com',
      password: 'Secret1!',
      username: 'CozyGamer99',
    });
  });

  it('does not dispatch an invalid registration', () => {
    const form = createRegisterForm();
    const listener = vi.fn();
    form.addEventListener('auth-submit', listener);

    form.dispatchEvent(new Event('submit', { cancelable: true }));

    expect(listener).not.toHaveBeenCalled();
  });

  it('toggles password visibility', () => {
    const form = createRegisterForm();
    const password = query<HTMLInputElement>(form, '#register-password');
    const toggle = query<HTMLButtonElement>(form, '.password-toggle');

    toggle.click();
    expect(password.type).toBe('text');
  });
});
