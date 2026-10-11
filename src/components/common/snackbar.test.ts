import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissSnackbar, showSnackbar } from '@/components/common/snackbar';

describe('snackbar', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a shared region and shows an info snackbar', () => {
    const handle = showSnackbar({ message: 'Hello' });

    const region = document.querySelector('#snackbar-region');
    expect(region).not.toBeNull();
    expect(handle.element.classList.contains('snackbar')).toBe(true);
    expect(handle.element.classList.contains('snackbar--info')).toBe(true);
    expect(handle.element.getAttribute('role')).toBe('status');
    expect(handle.element.querySelector('.snackbar__message')?.textContent).toBe('Hello');
  });

  it('reuses a single region across snackbars', () => {
    showSnackbar({ message: 'One' });
    showSnackbar({ message: 'Two' });

    expect(document.querySelectorAll('.snackbar-region')).toHaveLength(1);
    expect(document.querySelectorAll('.snackbar')).toHaveLength(2);
  });

  it.each(['success', 'warning', 'error'] as const)('applies the %s variant class', (variant) => {
    const handle = showSnackbar({ message: 'msg', variant });

    expect(handle.element.classList.contains(`snackbar--${variant}`)).toBe(true);
  });

  it('uses role alert for errors only', () => {
    const error = showSnackbar({ message: 'bad', variant: 'error' });
    const success = showSnackbar({ message: 'good', variant: 'success' });

    expect(error.element.getAttribute('role')).toBe('alert');
    expect(success.element.getAttribute('role')).toBe('status');
  });

  it('runs the action and dismisses when the action button is clicked', () => {
    const onAction = vi.fn();
    const handle = showSnackbar({ message: 'Saved', actionLabel: 'Undo', onAction });

    const action = handle.element.querySelector<HTMLButtonElement>('.snackbar__action');
    expect(action?.textContent).toBe('Undo');
    action?.click();

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(handle.element.classList.contains('snackbar--closing')).toBe(true);
  });

  it('does not add an action button without a handler', () => {
    const handle = showSnackbar({ message: 'No action', actionLabel: 'Undo' });

    expect(handle.element.querySelector('.snackbar__action')).toBeNull();
  });

  it('dismisses via the close button', () => {
    const handle = showSnackbar({ message: 'Closable' });

    handle.element.querySelector<HTMLButtonElement>('.snackbar__close')?.click();

    expect(handle.element.classList.contains('snackbar--closing')).toBe(true);
  });

  it('is a no-op when dismissing a detached element', () => {
    const element = document.createElement('div');

    expect(() => dismissSnackbar(element)).not.toThrow();
    expect(element.classList.contains('snackbar--closing')).toBe(false);
  });

  it('auto-dismisses after the duration and removes the element', () => {
    vi.useFakeTimers();
    const handle = showSnackbar({ message: 'Temporary', duration: 1000 });

    vi.advanceTimersByTime(1000);
    expect(handle.element.classList.contains('snackbar--closing')).toBe(true);

    vi.advanceTimersByTime(300);
    expect(handle.element.isConnected).toBe(false);
  });

  it('stays open when duration is zero', () => {
    vi.useFakeTimers();
    const handle = showSnackbar({ message: 'Sticky', duration: 0 });

    vi.advanceTimersByTime(10_000);

    expect(handle.element.isConnected).toBe(true);
    expect(handle.element.classList.contains('snackbar--closing')).toBe(false);
  });

  it('pauses the countdown on hover and resumes on leave', () => {
    vi.useFakeTimers();
    const handle = showSnackbar({ message: 'Hover me', duration: 1000 });

    vi.advanceTimersByTime(600);
    handle.element.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    expect(handle.element.isConnected).toBe(true);

    handle.element.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(400);
    expect(handle.element.classList.contains('snackbar--closing')).toBe(true);
  });

  it('pauses on focus and resumes on blur', () => {
    vi.useFakeTimers();
    const handle = showSnackbar({ message: 'Focus me', duration: 1000 });

    handle.element.dispatchEvent(new FocusEvent('focusin'));
    vi.advanceTimersByTime(5000);
    expect(handle.element.isConnected).toBe(true);

    handle.element.dispatchEvent(new FocusEvent('focusout'));
    vi.advanceTimersByTime(1000);
    expect(handle.element.classList.contains('snackbar--closing')).toBe(true);
  });

  it('returns a dismiss handle', () => {
    const handle = showSnackbar({ message: 'Bye', duration: 0 });

    handle.dismiss();

    expect(handle.element.classList.contains('snackbar--closing')).toBe(true);
  });
});
