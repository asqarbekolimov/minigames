import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createHeader: vi.fn(() => document.createElement('header')),
  createFooter: vi.fn(() => document.createElement('footer')),
  createAuthForm: vi.fn(() => {
    const element = document.createElement('div');
    element.classList.add('auth-page');
    return element;
  }),
  createGameDetails: vi.fn(() => {
    const element = document.createElement('div');
    element.classList.add('game-details-page');
    return element;
  }),
}));

vi.mock('@/components/header/header', () => ({ createHeader: mocks.createHeader }));
vi.mock('@/components/footer/footer', () => ({ createFooter: mocks.createFooter }));
vi.mock('@/components/auth/auth-form', () => ({ createAuthForm: mocks.createAuthForm }));
vi.mock('@/components/game-details/game-details', () => ({
  createGameDetails: mocks.createGameDetails,
}));

import { createAppLayout } from '@/components/layout/app-layout';

describe('createAppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    document.body.className = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('assembles the wrapper with header, content and footer', () => {
    const layout = createAppLayout();

    expect(layout.element.classList.contains('wrapper')).toBe(true);
    expect(layout.content.classList.contains('layout__content')).toBe(true);
    expect(layout.element.querySelector('header')).not.toBeNull();
    expect(layout.element.querySelector('footer')).not.toBeNull();
  });

  it('opens the auth modal on the open-auth-modal event', () => {
    const layout = createAppLayout();

    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'register' }));

    expect(mocks.createAuthForm).toHaveBeenCalledWith('register');
    expect(layout.element.querySelector('.auth-page')).not.toBeNull();
    expect(document.body.classList.contains('auth-modal-open')).toBe(true);
  });

  it('does not open a second modal while one is open', () => {
    createAppLayout();

    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));

    expect(mocks.createAuthForm).toHaveBeenCalledTimes(1);
  });

  it('closes the modal on login-modal-close', () => {
    vi.useFakeTimers();
    const layout = createAppLayout();
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    const modal = layout.element.querySelector('.auth-page');

    modal?.dispatchEvent(new Event('login-modal-close'));
    vi.advanceTimersByTime(200);

    expect(layout.element.querySelector('.auth-page')).toBeNull();
    expect(document.body.classList.contains('auth-modal-open')).toBe(false);
  });

  it('closes the modal on Escape when idle', () => {
    vi.useFakeTimers();
    const layout = createAppLayout();
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(200);

    expect(layout.element.querySelector('.auth-page')).toBeNull();
  });

  it('keeps a pending auth modal open on Escape', () => {
    vi.useFakeTimers();
    const layout = createAppLayout();
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    const modal = layout.element.querySelector('.auth-page');
    modal?.classList.add('auth-page--pending');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(200);

    expect(layout.element.querySelector('.auth-page')).not.toBeNull();
  });

  it('opens and closes the game details modal via delegated events', () => {
    vi.useFakeTimers();
    const layout = createAppLayout();
    const trigger = document.createElement('button');
    trigger.dataset.openGameDetails = '';
    layout.element.append(trigger);
    document.body.append(layout.element);

    trigger.click();
    expect(mocks.createGameDetails).toHaveBeenCalled();
    const modal = layout.element.querySelector('.game-details-page');
    expect(modal).not.toBeNull();

    modal?.dispatchEvent(new Event('game-details-close'));
    vi.advanceTimersByTime(200);
    expect(layout.element.querySelector('.game-details-page')).toBeNull();
  });

  it('closes immediately when the user prefers reduced motion', () => {
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const layout = createAppLayout();
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));

    layout.element.querySelector('.auth-page')?.dispatchEvent(new Event('login-modal-close'));

    expect(layout.element.querySelector('.auth-page')).toBeNull();
    expect(document.body.classList.contains('auth-modal-open')).toBe(false);
  });

  it('closes game details immediately when reduced motion is preferred', () => {
    vi.spyOn(globalThis, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const layout = createAppLayout();
    const trigger = document.createElement('button');
    trigger.dataset.openGameDetails = '';
    layout.element.append(trigger);
    document.body.append(layout.element);

    trigger.click();
    layout.element
      .querySelector('.game-details-page')
      ?.dispatchEvent(new Event('game-details-close'));

    expect(layout.element.querySelector('.game-details-page')).toBeNull();
    expect(document.body.classList.contains('game-details-open')).toBe(false);
  });

  it('finishes the auth close only for animation events targeting the modal', () => {
    const layout = createAppLayout();
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));
    const modal = layout.element.querySelector('.auth-page');
    modal?.dispatchEvent(new Event('login-modal-close'));

    const child = document.createElement('span');
    modal?.append(child);
    child.dispatchEvent(new Event('animationend', { bubbles: true }));
    expect(layout.element.querySelector('.auth-page')).not.toBeNull();

    modal?.dispatchEvent(new Event('animationend'));
    expect(layout.element.querySelector('.auth-page')).toBeNull();
  });

  it('ignores unrelated key presses and ignores clicks without an element target', () => {
    vi.useFakeTimers();
    const layout = createAppLayout();
    globalThis.dispatchEvent(new CustomEvent('open-auth-modal', { detail: 'login' }));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(layout.element.querySelector('.auth-page')).not.toBeNull();

    document.dispatchEvent(new MouseEvent('click'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Esc' }));
    vi.advanceTimersByTime(200);

    expect(layout.element.querySelector('.auth-page')).toBeNull();
  });

  it('does not re-open game details while one is already open', () => {
    const layout = createAppLayout();
    const trigger = document.createElement('button');
    trigger.dataset.openGameDetails = '';
    layout.element.append(trigger);
    document.body.append(layout.element);

    trigger.click();
    trigger.click();

    expect(mocks.createGameDetails).toHaveBeenCalled();
  });
});
