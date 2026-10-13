import { describe, expect, it, vi } from 'vitest';
import {
  createAsyncContent,
  createEmptyState,
  createErrorBanner,
  createSkeleton,
} from '@/components/common/async-content';

function deferred<T>() {
  return Promise.withResolvers<T>();
}

describe('createSkeleton', () => {
  it('renders the default cards variant with six items', () => {
    const skeleton = createSkeleton();

    expect(skeleton.classList.contains('skeleton')).toBe(true);
    expect(skeleton.classList.contains('skeleton--cards')).toBe(true);
    expect(skeleton.getAttribute('aria-hidden')).toBe('true');
    expect(skeleton.querySelectorAll('.skeleton__item')).toHaveLength(6);
  });

  it.each(['table', 'details', 'text', 'chips', 'slider'] as const)(
    'renders the %s variant with the requested count',
    (variant) => {
      const skeleton = createSkeleton({ variant, count: 3 });

      expect(skeleton.classList.contains(`skeleton--${variant}`)).toBe(true);
      expect(skeleton.querySelectorAll('.skeleton__item')).toHaveLength(3);
    },
  );
});

describe('createErrorBanner', () => {
  it('shows the default message and role', () => {
    const banner = createErrorBanner();

    expect(banner.classList.contains('error-banner')).toBe(true);
    expect(banner.getAttribute('role')).toBe('alert');
    expect(banner.querySelector('.error-banner__message')?.textContent).toContain(
      'Something went wrong',
    );
    expect(banner.querySelector('.error-banner__retry')).toBeNull();
  });

  it('renders a retry button that invokes the callback', () => {
    const onRetry = vi.fn();
    const banner = createErrorBanner({ message: 'Failed', retryLabel: 'Retry now', onRetry });

    expect(banner.querySelector('.error-banner__message')?.textContent).toBe('Failed');
    const retry = banner.querySelector<HTMLButtonElement>('.error-banner__retry');
    expect(retry?.textContent).toBe('Retry now');
    retry?.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('createEmptyState', () => {
  it('shows default copy', () => {
    const empty = createEmptyState();

    expect(empty.classList.contains('empty-state')).toBe(true);
    expect(empty.getAttribute('role')).toBe('status');
    expect(empty.querySelector('.empty-state__title')?.textContent).toBe('Nothing here yet');
  });

  it('shows custom copy', () => {
    const empty = createEmptyState({ title: 'No games', message: 'Try again later' });

    expect(empty.querySelector('.empty-state__title')?.textContent).toBe('No games');
    expect(empty.querySelector('.empty-state__message')?.textContent).toBe('Try again later');
  });
});

describe('createAsyncContent', () => {
  it('starts in the loading state and renders loaded data on success', async () => {
    const load = vi.fn().mockResolvedValue(['a', 'b']);
    const controller = createAsyncContent<string[]>({
      load,
      render: (data) => {
        const node = document.createElement('ul');
        node.dataset.count = String(data.length);
        return node;
      },
    });

    expect(controller.getState()).toBe('loading');

    await controller.reload();

    expect(controller.getState()).toBe('success');
    expect(controller.element.dataset.state).toBe('success');
    expect(controller.element.getAttribute('aria-busy')).toBe('false');
    expect(controller.element.querySelector('ul')?.dataset.count).toBe('2');
  });

  it('renders an empty state for empty arrays', async () => {
    const controller = createAsyncContent<string[]>({
      load: async () => [],
      render: () => document.createElement('div'),
      empty: { title: 'No items' },
    });

    await controller.reload();

    expect(controller.getState()).toBe('empty');
    expect(controller.element.querySelector('.empty-state__title')?.textContent).toBe('No items');
  });

  it('honours a custom isEmpty predicate', async () => {
    const controller = createAsyncContent<{ items: unknown[] }>({
      load: async () => ({ items: [] }),
      render: () => document.createElement('div'),
      isEmpty: (data) => data.items.length === 0,
    });

    await controller.reload();

    expect(controller.getState()).toBe('empty');
  });

  it('renders the error state using an Error message and notifies onError', async () => {
    const onError = vi.fn();
    const controller = createAsyncContent({
      load: async () => {
        throw new Error('Boom');
      },
      render: () => document.createElement('div'),
      onError,
    });

    await controller.reload();

    expect(controller.getState()).toBe('error');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(controller.element.querySelector('.error-banner__message')?.textContent).toBe('Boom');
  });

  it('uses the custom errorMessage mapper', async () => {
    const controller = createAsyncContent({
      load: async () => {
        throw 'plain string';
      },
      render: () => document.createElement('div'),
      errorMessage: (error) => `mapped:${String(error)}`,
    });

    await controller.reload();

    expect(controller.element.querySelector('.error-banner__message')?.textContent).toBe(
      'mapped:plain string',
    );
  });

  it('falls back to the default message for unknown errors', async () => {
    const controller = createAsyncContent({
      load: async () => {
        throw 42;
      },
      render: () => document.createElement('div'),
    });

    await controller.reload();

    expect(controller.element.querySelector('.error-banner__message')?.textContent).toContain(
      'Something went wrong',
    );
  });

  it('renders a single node when render returns a Node', async () => {
    const controller = createAsyncContent<string>({
      load: async () => 'ready',
      render: (data) => {
        const node = document.createElement('p');
        node.textContent = data;
        return node;
      },
    });

    await controller.reload();

    expect(controller.element.querySelector('p')?.textContent).toBe('ready');
  });

  it('reloads from the error retry button', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce(['ok']);
    const controller = createAsyncContent<string[]>({
      load,
      render: (data) => {
        const node = document.createElement('div');
        node.dataset.value = data.join(',');
        return node;
      },
    });

    await controller.reload();
    expect(controller.getState()).toBe('error');

    controller.element.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();
    await vi.waitFor(() => {
      expect(controller.getState()).toBe('success');
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('ignores the result of a stale request', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const load = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const controller = createAsyncContent<string[]>({
      load,
      render: (data) => {
        const node = document.createElement('div');
        node.dataset.value = data.join(',');
        return node;
      },
    });

    const firstReload = controller.reload();
    const secondReload = controller.reload();

    second.resolve(['second']);
    await secondReload;
    first.resolve(['first']);
    await firstReload;

    expect(controller.element.querySelector<HTMLElement>('[data-value]')?.dataset.value).toBe(
      'second',
    );
  });
});
