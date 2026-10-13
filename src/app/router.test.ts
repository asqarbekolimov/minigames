import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const content = document.createElement('div');
  return {
    content,
    createAppLayout: vi.fn(() => {
      const element = document.createElement('div');
      element.append(content);
      return { element, content };
    }),
    createHomePage: vi.fn(() => {
      const element = document.createElement('main');
      element.dataset.page = 'home';
      return element;
    }),
    createLibraryPage: vi.fn(() => {
      const element = document.createElement('main');
      element.dataset.page = 'library';
      return element;
    }),
    createNotFoundPage: vi.fn(() => {
      const element = document.createElement('main');
      element.dataset.page = 'not-found';
      return element;
    }),
  };
});

vi.mock('@/services/auth', () => ({ isSessionActive: vi.fn(() => true) }));
vi.mock('@/components/layout/app-layout', () => ({ createAppLayout: mocks.createAppLayout }));
vi.mock('@/pages', () => ({ createHomePage: mocks.createHomePage }));
vi.mock('@/pages/library/library-page', () => ({ createLibraryPage: mocks.createLibraryPage }));
vi.mock('@/pages/not-found/not-found-page', () => ({
  createNotFoundPage: mocks.createNotFoundPage,
}));

import renderApp from '@/app/router';

function mountRoot(): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  return root;
}

function currentPage(): string | undefined {
  return mocks.content.querySelector<HTMLElement>('main')?.dataset.page;
}

describe('renderApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.replaceChildren();
    globalThis.history.replaceState({}, '', '/');
  });

  it('renders the home page for the root path', () => {
    const root = mountRoot();

    renderApp(root);

    expect(mocks.createHomePage).toHaveBeenCalledTimes(1);
    expect(currentPage()).toBe('home');
    expect(root.contains(mocks.content)).toBe(true);
  });

  it('renders the library page for /library', () => {
    globalThis.history.replaceState({}, '', '/library');

    renderApp(mountRoot());

    expect(mocks.createLibraryPage).toHaveBeenCalledTimes(1);
    expect(currentPage()).toBe('library');
  });

  it('renders the not-found page for unknown paths', () => {
    globalThis.history.replaceState({}, '', '/nope');

    renderApp(mountRoot());

    expect(mocks.createNotFoundPage).toHaveBeenCalledTimes(1);
    expect(currentPage()).toBe('not-found');
  });

  it('emits route-change with the resolved route', () => {
    const listener = vi.fn();
    globalThis.addEventListener('route-change', listener);

    renderApp(mountRoot());

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { route: 'home' } }));
    globalThis.removeEventListener('route-change', listener);
  });

  it('navigates when a data-route link is clicked', () => {
    renderApp(mountRoot());
    const link = document.createElement('a');
    link.href = '/library';
    link.dataset.route = 'library';
    document.body.append(link);

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(mocks.createLibraryPage).toHaveBeenCalled();
    expect(globalThis.location.pathname).toBe('/library');
  });

  it('ignores modified clicks on links', () => {
    renderApp(mountRoot());
    const link = document.createElement('a');
    link.dataset.route = 'library';
    document.body.append(link);

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));

    expect(mocks.createLibraryPage).not.toHaveBeenCalled();
  });

  it('responds to popstate', () => {
    renderApp(mountRoot());

    globalThis.history.replaceState({}, '', '/library');
    mocks.createLibraryPage.mockClear();
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(mocks.createLibraryPage).toHaveBeenCalled();
  });
});
