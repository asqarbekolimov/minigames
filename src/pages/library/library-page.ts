import { createLibraryFilter } from '@/components/library-filter/library-filter';
import './library-page.scss';
import { createGameCards } from '@/components/game-cards/game-cards';
import { createAsyncContent, createSkeleton } from '@/components/common/async-content';
import { showSnackbar } from '@/components/common/snackbar';
import { getGames } from '@/services/api';
import { APP_URL_CHANGE, readUrlState, updateUrlState, type AppUrlState } from '@/app/url-state';
import type { ApiMetaI, GameCardI, GameSort, GamesQueryI } from '@/utils/type';

const PAGE_SIZE = 6;
const DESKTOP_PAGE_LIMIT = 4;
const MOBILE_PAGE_LIMIT = 3;
const MOBILE_MEDIA = '(max-width: 375.5px)';

interface LibraryStateI {
  category: string;
  sort: GameSort;
  page: number;
}

interface CardsSectionController {
  element: HTMLElement;
  setQuery: (query: Partial<GamesQueryI>) => void;
}

interface PaginationController {
  element: HTMLElement;
  update: (page: number, totalPages: number) => void;
}

export function createLibraryPage(): HTMLElement {
  const main = document.createElement('main'),
    libraryPage = document.createElement('section'),
    container = document.createElement('div');

  libraryPage.classList.add('library-section');
  container.classList.add('container');

  main.append(libraryPage);
  libraryPage.append(container);
  container.append(renderLibraryPageContents(main, readUrlState()));

  return main;
}

function renderLibraryPageContents(main: HTMLElement, initial: AppUrlState): HTMLElement {
  const contents = document.createElement('div');

  contents.classList.add('library__contents');

  const state: LibraryStateI = {
    category: initial.category,
    sort: initial.sort,
    page: initial.page,
  };

  const commitState = (patch: Partial<LibraryStateI>, mode: 'push' | 'replace' = 'push') => {
    Object.assign(state, patch);
    updateUrlState({ category: state.category, sort: state.sort, page: state.page }, mode);
  };

  const pagination = createPaginationControl((page) => {
    if (page === state.page) return;

    cards.setQuery({ page });
    commitState({ page });
  }, initial.page);

  const cards = createCardsSection(
    {
      category: initial.category,
      sort: initial.sort,
      page: initial.page,
      limit: PAGE_SIZE,
    },
    (meta) => pagination.update(meta?.page ?? 1, meta?.totalPages ?? 1),
  );

  const filter = createLibraryFilter({
    initialCategory: initial.category,
    initialSort: initial.sort,
    onCategoryChange: (category) => {
      if (category === state.category) return;

      cards.setQuery({ category, page: 1 });
      commitState({ category, page: 1 });
    },
    onSortChange: (sort) => {
      if (sort === state.sort) return;

      cards.setQuery({ sort, page: 1 });
      commitState({ sort, page: 1 });
    },
  });

  contents.append(libraryPageTitle(), filter.element, cards.element, pagination.element);

  const applyUrlState = (urlState: AppUrlState): void => {
    if (urlState.route !== 'library') return;
    if (
      urlState.category === state.category &&
      urlState.sort === state.sort &&
      urlState.page === state.page
    ) {
      return;
    }

    state.category = urlState.category;
    state.sort = urlState.sort;
    state.page = urlState.page;

    filter.setState({ category: state.category, sort: state.sort });
    cards.setQuery({ category: state.category, sort: state.sort, page: state.page });
  };

  const handleUrlChange = (event: Event): void => {
    if (!main.isConnected) {
      globalThis.removeEventListener('popstate', handleUrlChange);
      globalThis.removeEventListener(APP_URL_CHANGE, handleUrlChange);
      return;
    }

    const urlState = event instanceof CustomEvent ? (event.detail as AppUrlState) : readUrlState();

    applyUrlState(urlState);
  };

  globalThis.addEventListener('popstate', handleUrlChange);
  globalThis.addEventListener(APP_URL_CHANGE, handleUrlChange);

  return contents;
}

function renderCardsSkeleton(): Node {
  return createSkeleton({ variant: 'cards', count: PAGE_SIZE });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

function createCardsSection(
  initialQuery: GamesQueryI,
  onMeta: (meta?: ApiMetaI) => void,
): CardsSectionController {
  let query: GamesQueryI = { ...initialQuery };
  let requestToken = 0;

  const cards = createAsyncContent<GameCardI[]>({
    load: async () => {
      const token = ++requestToken;
      const response = await getGames(query);

      if (token === requestToken) {
        onMeta(response.meta);
      }

      return response.data;
    },
    render: createGameCards,
    renderSkeleton: renderCardsSkeleton,
    errorMessage: getErrorMessage,
    retryLabel: 'Try again',
    empty: { title: 'No games found', message: 'Try adjusting your filters or check back soon.' },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), variant: 'error' });
    },
  });

  void cards.reload();

  return {
    element: cards.element,
    setQuery: (nextQuery) => {
      const hasChanged = Object.entries(nextQuery).some(
        ([key, value]) => query[key as keyof GamesQueryI] !== value,
      );

      if (!hasChanged) return;

      query = { ...query, ...nextQuery };
      void cards.reload();
    },
  };
}

function libraryPageTitle() {
  const pageTitle = document.createElement('div');
  pageTitle.classList.add('library__header');

  const headingText = document.createElement('h1'),
    descriptionText = document.createElement('p');

  headingText.classList.add('library__header-title');
  descriptionText.classList.add('library__header-text');

  headingText.textContent = 'Game Library';
  descriptionText.textContent = 'Browse our collection of casual mini-games';

  pageTitle.append(headingText, descriptionText);

  return pageTitle;
}

function getVisiblePageCount(): number {
  return globalThis.matchMedia(MOBILE_MEDIA).matches ? MOBILE_PAGE_LIMIT : DESKTOP_PAGE_LIMIT;
}

function getVisiblePages(currentPage: number, totalPages: number, maxVisible: number): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(
    1,
    Math.min(currentPage - Math.floor(maxVisible / 2), totalPages - maxVisible + 1),
  );

  return Array.from({ length: maxVisible }, (_, index) => start + index);
}

function createPaginationControl(
  onPageChange: (page: number) => void,
  initialPage = 1,
): PaginationController {
  const paginationControl = document.createElement('nav');
  const mediaQuery = globalThis.matchMedia(MOBILE_MEDIA);

  paginationControl.classList.add('pagination__control');
  paginationControl.setAttribute('aria-label', 'Pagination');

  let currentPage = Math.max(1, initialPage);
  let totalPages = 1;

  const handleViewportChange = (): void => {
    if (!paginationControl.isConnected) {
      mediaQuery.removeEventListener('change', handleViewportChange);
      return;
    }

    render();
  };

  const render = (): void => {
    const visiblePages = getVisiblePages(currentPage, totalPages, getVisiblePageCount());

    paginationControl.replaceChildren(
      createArrowControl('previous', currentPage <= 1, () => onPageChange(currentPage - 1)),
      ...visiblePages.map((page) => createPageControl(page, currentPage, onPageChange)),
      createArrowControl('next', currentPage >= totalPages, () => onPageChange(currentPage + 1)),
    );
  };

  mediaQuery.addEventListener('change', handleViewportChange);
  render();

  return {
    element: paginationControl,
    update: (page, total) => {
      currentPage = Math.max(1, page);
      totalPages = Math.max(1, total);
      render();
    },
  };
}

function createPageControl(
  page: number,
  currentPage: number,
  onPageChange: (page: number) => void,
): HTMLButtonElement {
  const pageControl = document.createElement('button');
  const isActive = page === currentPage;

  pageControl.type = 'button';
  pageControl.classList.add('pagination__button', 'pagination__page-button');
  pageControl.textContent = String(page);
  pageControl.dataset.page = String(page);
  pageControl.setAttribute('aria-label', `Page ${page}`);
  pageControl.classList.toggle('active', isActive);

  if (isActive) {
    pageControl.setAttribute('aria-current', 'page');
  }

  pageControl.addEventListener('click', () => {
    if (!isActive) onPageChange(page);
  });

  return pageControl;
}

function createArrowControl(
  direction: 'previous' | 'next',
  isDisabled: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const arrowControl = document.createElement('button');
  const arrow = document.createElement('span');

  arrowControl.type = 'button';
  arrowControl.classList.add('pagination__button', 'pagination__arrow-button');
  arrowControl.disabled = isDisabled;
  arrowControl.setAttribute('aria-label', direction === 'previous' ? 'Previous page' : 'Next page');
  arrow.classList.add('pagination__arrow', direction);
  arrow.setAttribute('aria-hidden', 'true');
  arrowControl.append(arrow);
  arrowControl.addEventListener('click', onClick);

  return arrowControl;
}
