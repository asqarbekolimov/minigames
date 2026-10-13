import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentSession: vi.fn((): unknown => undefined),
  signOutUser: vi.fn(() => Promise.resolve()),
  showSnackbar: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  getCurrentSession: mocks.getCurrentSession,
  signOutUser: mocks.signOutUser,
}));

vi.mock('@/components/common/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

import { createHeader } from '@/components/header/header';

const session = {
  displayName: 'Alex',
  email: 'alex@example.com',
  authenticatedAt: 1,
  avatarUrl: undefined,
};

describe('createHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentSession.mockReturnValue(undefined);
  });

  it('renders navigation and auth buttons for a signed-out visitor', () => {
    const header = createHeader();

    expect(header.classList.contains('header')).toBe(true);
    expect(header.querySelectorAll('.nav__item')).toHaveLength(4);
    expect(header.querySelector('.signin__button')?.classList.contains('is-hidden')).toBe(false);
    expect(header.querySelector('.header__user')?.classList.contains('is-hidden')).toBe(true);
  });

  it('shows the authenticated user when a session exists at creation', () => {
    mocks.getCurrentSession.mockReturnValue(session);

    const header = createHeader();

    expect(header.querySelector('.signin__button')?.classList.contains('is-hidden')).toBe(true);
    const userArea = header.querySelector('.header__user');
    expect(userArea?.classList.contains('is-hidden')).toBe(false);
    expect(userArea?.querySelector('.header__user-name')?.textContent).toBe('Alex');
  });

  it('updates the UI on an auth-state-change event', () => {
    const header = createHeader();

    globalThis.dispatchEvent(new CustomEvent('auth-state-change', { detail: session }));
    expect(header.querySelector('.header__user')?.classList.contains('is-hidden')).toBe(false);
    expect(header.querySelector('.signin__button')?.classList.contains('is-hidden')).toBe(true);

    globalThis.dispatchEvent(new CustomEvent('auth-state-change', { detail: undefined }));
    expect(header.querySelector('.header__user')?.classList.contains('is-hidden')).toBe(true);
    expect(header.querySelector('.signin__button')?.classList.contains('is-hidden')).toBe(false);
  });

  it('falls back to email then a placeholder name', () => {
    const header = createHeader();

    globalThis.dispatchEvent(
      new CustomEvent('auth-state-change', { detail: { ...session, displayName: undefined } }),
    );
    expect(header.querySelector('.header__user-name')?.textContent).toBe('alex@example.com');
  });

  it('signs out and notifies via the snackbar', async () => {
    mocks.getCurrentSession.mockReturnValue(session);
    const header = createHeader();

    header.querySelector<HTMLButtonElement>('.header__user-logout')?.click();

    await vi.waitFor(() => expect(mocks.signOutUser).toHaveBeenCalledTimes(1));
    expect(mocks.showSnackbar).toHaveBeenCalledWith(expect.objectContaining({ variant: 'info' }));
  });

  it('dispatches open-auth-modal from the log in and sign up buttons', () => {
    const header = createHeader();
    const listener = vi.fn();
    globalThis.addEventListener('open-auth-modal', listener);

    header.querySelector<HTMLButtonElement>('.signin__button')?.click();
    header.querySelector<HTMLButtonElement>('.signup__button')?.click();

    expect(listener).toHaveBeenCalledTimes(2);
    globalThis.removeEventListener('open-auth-modal', listener);
  });

  it('toggles the mobile menu and closes it on Escape', () => {
    const header = createHeader();
    const menuButton = header.querySelector<HTMLButtonElement>(
      ':scope .header__nav-buttons .menu__button',
    );

    menuButton?.click();
    expect(header.classList.contains('menu-open')).toBe(true);
    expect(header.querySelector('.mobile_menu')?.classList.contains('is-open')).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(header.classList.contains('menu-open')).toBe(false);
  });

  it('updates the active link on route change', () => {
    const header = createHeader();

    globalThis.dispatchEvent(new CustomEvent('route-change', { detail: { route: 'library' } }));

    const libraryLink = header.querySelector<HTMLAnchorElement>('a[data-route="library"]');
    expect(libraryLink?.classList.contains('active')).toBe(true);
  });
});
