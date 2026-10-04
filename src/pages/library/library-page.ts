import { createLibraryFilter, DEFAULT_SORT } from '@/components/library-filter/library-filter';
import './library-page.scss';
import { createGameCards } from '@/components/game-cards/game-cards';
import { createAsyncContent, createSkeleton } from '@/components/common/async-content';
import { showSnackbar } from '@/components/common/snackbar';
import { getGames } from '@/services/api';
import type { ApiMetaI, GameCardI, GamesQueryI } from '@/utils/type';

const PAGE_SIZE = 6;
const DESKTOP_PAGE_LIMIT = 4;
const MOBILE_PAGE_LIMIT = 3;
const MOBILE_MEDIA = '(max-width: 375.5px)';

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
  container.append(renderLibraryPageContents());

  return main;
}

function renderLibraryPageContents(): HTMLElement {
  const contents = document.createElement('div');

  contents.classList.add('library__contents');

  const pagination = createPaginationControl((page) => cards.setQuery({ page }));

  const cards = createCardsSection(
    { category: 'all', sort: DEFAULT_SORT, page: 1, limit: PAGE_SIZE },
    (meta) => pagination.update(meta?.page ?? 1, meta?.totalPages ?? 1),
  );

  const filter = createLibraryFilter({
    onCategoryChange: (category) => cards.setQuery({ category, page: 1 }),
    onSortChange: (sort) => cards.setQuery({ sort, page: 1 }),
  });

  contents.append(libraryPageTitle(), filter.element, cards.element, pagination.element);

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

function createPaginationControl(onPageChange: (page: number) => void): PaginationController {
  const paginationControl = document.createElement('nav');
  const mediaQuery = globalThis.matchMedia(MOBILE_MEDIA);

  paginationControl.classList.add('pagination__control');
  paginationControl.setAttribute('aria-label', 'Pagination');

  let currentPage = 1;
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
