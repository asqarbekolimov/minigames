import './async-content.scss';

export type AsyncState = 'loading' | 'error' | 'empty' | 'success';

export type SkeletonVariant = 'table' | 'cards' | 'slider' | 'details' | 'text';

export interface SkeletonOptions {
  variant?: SkeletonVariant;
  count?: number;
}

export interface ErrorBannerOptions {
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export interface EmptyStateOptions {
  title?: string;
  message?: string;
}

export interface AsyncContentOptions<T> {
  load: () => Promise<T>;
  render: (data: T) => Node | Node[];
  isEmpty?: (data: T) => boolean;
  renderSkeleton?: () => Node;
  errorMessage?: (error: unknown) => string;
  empty?: EmptyStateOptions;
  retryLabel?: string;
}

export interface AsyncContentController {
  element: HTMLElement;
  getState: () => AsyncState;
  reload: () => Promise<void>;
}

const DEFAULT_ERROR_MESSAGE = 'Something went wrong while loading this section. Please try again.';
const DEFAULT_EMPTY_TITLE = 'Nothing here yet';
const DEFAULT_EMPTY_MESSAGE = 'No items match the current criteria.';

const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-13h2v6h-2V7Zm0 8h2v2h-2v-2Z" fill="currentColor"/></svg>`;

const emptyIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z" fill="currentColor"/></svg>`;

function createSkeletonItem(variant: SkeletonVariant): HTMLElement {
  const item = document.createElement('div');
  item.classList.add('skeleton__item');

  switch (variant) {
    case 'table': {
      item.innerHTML = `
        <span class="skeleton__line skeleton__line--sm"></span>
        <span class="skeleton__line skeleton__line--md"></span>
        <span class="skeleton__line skeleton__line--sm"></span>
        <span class="skeleton__line skeleton__line--md"></span>
        <span class="skeleton__line skeleton__line--sm"></span>
      `;
      break;
    }
    case 'details': {
      item.innerHTML = `
        <span class="skeleton__block skeleton__block--hero"></span>
        <span class="skeleton__line skeleton__line--lg"></span>
        <span class="skeleton__line"></span>
        <span class="skeleton__line"></span>
        <span class="skeleton__line skeleton__line--sm"></span>
      `;
      break;
    }
    case 'text': {
      item.innerHTML = `
        <span class="skeleton__line"></span>
        <span class="skeleton__line"></span>
        <span class="skeleton__line skeleton__line--sm"></span>
      `;
      break;
    }
    default: {
      item.innerHTML = `
        <span class="skeleton__block"></span>
        <span class="skeleton__line skeleton__line--md"></span>
        <span class="skeleton__line skeleton__line--sm"></span>
      `;
      break;
    }
  }

  return item;
}

export function createSkeleton(options: SkeletonOptions = {}): HTMLElement {
  const variant = options.variant ?? 'cards';
  const count = options.count ?? 6;
  const skeleton = document.createElement('div');

  skeleton.classList.add('skeleton', `skeleton--${variant}`);
  skeleton.setAttribute('aria-hidden', 'true');

  for (let index = 0; index < count; index += 1) {
    skeleton.append(createSkeletonItem(variant));
  }

  return skeleton;
}

export function createErrorBanner(options: ErrorBannerOptions = {}): HTMLElement {
  const message = options.message ?? DEFAULT_ERROR_MESSAGE;
  const retryLabel = options.retryLabel ?? 'Try again';

  const banner = document.createElement('div');
  banner.classList.add('error-banner');
  banner.setAttribute('role', 'alert');

  const icon = document.createElement('span');
  icon.classList.add('error-banner__icon');
  icon.innerHTML = errorIcon;

  const text = document.createElement('p');
  text.classList.add('error-banner__message');
  text.textContent = message;

  banner.append(icon, text);

  if (options.onRetry) {
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('error-banner__retry');
    button.textContent = retryLabel;
    button.addEventListener('click', () => options.onRetry?.());
    banner.append(button);
  }

  return banner;
}

export function createEmptyState(options: EmptyStateOptions = {}): HTMLElement {
  const title = options.title ?? DEFAULT_EMPTY_TITLE;
  const message = options.message ?? DEFAULT_EMPTY_MESSAGE;

  const empty = document.createElement('div');
  empty.classList.add('empty-state');
  empty.setAttribute('role', 'status');

  const icon = document.createElement('span');
  icon.classList.add('empty-state__icon');
  icon.innerHTML = emptyIcon;

  const heading = document.createElement('p');
  heading.classList.add('empty-state__title');
  heading.textContent = title;

  const text = document.createElement('p');
  text.classList.add('empty-state__message');
  text.textContent = message;

  empty.append(icon, heading, text);

  return empty;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  return DEFAULT_ERROR_MESSAGE;
}

function isEmptyData<T>(data: T): boolean {
  return Array.isArray(data) && data.length === 0;
}

export function createAsyncContent<T>(options: AsyncContentOptions<T>): AsyncContentController {
  const element = document.createElement('div');
  element.classList.add('async-content');

  let state: AsyncState = 'loading';

  const setState = (nextState: AsyncState): void => {
    state = nextState;
    element.dataset.state = nextState;
    element.setAttribute('aria-busy', String(nextState === 'loading'));
  };

  const showLoading = (): void => {
    setState('loading');

    const skeleton = options.renderSkeleton
      ? options.renderSkeleton()
      : createSkeleton({ variant: 'cards' });

    element.replaceChildren(skeleton);
  };

  const showEmpty = (): void => {
    setState('empty');
    element.replaceChildren(createEmptyState(options.empty));
  };

  const showError = (error: unknown): void => {
    setState('error');

    const message = options.errorMessage ? options.errorMessage(error) : getErrorMessage(error);

    element.replaceChildren(
      createErrorBanner({
        message,
        retryLabel: options.retryLabel,
        onRetry: () => {
          void reload();
        },
      }),
    );
  };

  const showSuccess = (data: T): void => {
    setState('success');

    const rendered = options.render(data);

    if (Array.isArray(rendered)) {
      element.replaceChildren(...rendered);
    } else {
      element.replaceChildren(rendered);
    }
  };

  async function reload(): Promise<void> {
    showLoading();

    try {
      const data = await options.load();
      const isEmpty = options.isEmpty ? options.isEmpty(data) : isEmptyData(data);

      if (isEmpty) {
        showEmpty();
        return;
      }

      showSuccess(data);
    } catch (error) {
      showError(error);
    }
  }

  return {
    element,
    getState: () => state,
    reload,
  };
}
