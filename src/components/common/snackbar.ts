import './snackbar.scss';

export type SnackbarVariant = 'info' | 'success' | 'warning' | 'error';

export interface SnackbarOptions {
  message: string;
  variant?: SnackbarVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export interface SnackbarHandle {
  element: HTMLElement;
  dismiss: () => void;
}

const DEFAULT_DURATION = 4500;
const REGION_ID = 'snackbar-region';

const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18.3 5.71 12 12.01 5.7 5.71 4.29 7.12 10.59 13.42 4.29 19.72 5.7 21.13 12 14.83 18.3 21.13 19.71 19.72 13.41 13.42 19.71 7.12 18.3 5.71Z" fill="currentColor"/></svg>`;

const icons: Record<SnackbarVariant, string> = {
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z" fill="currentColor"/></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z" fill="currentColor"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" fill="currentColor"/></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z" fill="currentColor"/></svg>`,
};

function getRegion(): HTMLElement {
  const existing = document.querySelector<HTMLElement>(`#${REGION_ID}`);
  if (existing) return existing;

  const region = document.createElement('div');
  region.id = REGION_ID;
  region.classList.add('snackbar-region');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'false');
  document.body.append(region);

  return region;
}

export function dismissSnackbar(element: HTMLElement): void {
  if (!element.isConnected) return;

  element.classList.add('snackbar--closing');
  const remove = () => element.remove();

  element.addEventListener('animationend', remove, { once: true });
  globalThis.setTimeout(remove, 300);
}

export function showSnackbar(options: SnackbarOptions): SnackbarHandle {
  const { message, variant = 'info', duration = DEFAULT_DURATION } = options;
  const region = getRegion();

  const element = document.createElement('div');
  element.classList.add('snackbar', `snackbar--${variant}`);
  element.setAttribute('role', variant === 'error' ? 'alert' : 'status');

  const icon = document.createElement('span');
  icon.classList.add('snackbar__icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = icons[variant];

  const text = document.createElement('p');
  text.classList.add('snackbar__message');
  text.textContent = message;

  element.append(icon, text);

  if (options.actionLabel && options.onAction) {
    const action = document.createElement('button');
    action.type = 'button';
    action.classList.add('snackbar__action');
    action.textContent = options.actionLabel;
    action.addEventListener('click', () => {
      options.onAction?.();
      dismissSnackbar(element);
    });
    element.append(action);
  }

  const close = document.createElement('button');
  close.type = 'button';
  close.classList.add('snackbar__close');
  close.setAttribute('aria-label', 'Dismiss notification');
  close.innerHTML = closeIcon;
  close.addEventListener('click', () => dismissSnackbar(element));
  element.append(close);

  region.append(element);

  if (duration > 0) {
    let remaining = duration;
    let startedAt = Date.now();
    let timer: number | undefined;

    const start = () => {
      startedAt = Date.now();
      timer = globalThis.setTimeout(() => dismissSnackbar(element), remaining);
    };

    const pause = () => {
      if (timer === undefined) return;

      globalThis.clearTimeout(timer);
      timer = undefined;
      remaining -= Date.now() - startedAt;

      if (remaining <= 0) dismissSnackbar(element);
    };

    const resume = () => {
      if (timer !== undefined || remaining <= 0) return;
      start();
    };

    start();
    element.addEventListener('mouseenter', pause);
    element.addEventListener('mouseleave', resume);
    element.addEventListener('focusin', pause);
    element.addEventListener('focusout', resume);
  }

  return { element, dismiss: () => dismissSnackbar(element) };
}
