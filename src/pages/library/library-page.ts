import { createLibraryFilter, DEFAULT_SORT } from '@/components/library-filter/library-filter';
import './library-page.scss';
import { createGameCards } from '@/components/game-cards/game-cards';
import { createAsyncContent, createSkeleton } from '@/components/common/async-content';
import { showSnackbar } from '@/components/common/snackbar';
import { getGames } from '@/services/api';
import type { GameCardI, GamesQueryI } from '@/utils/type';

const PAGE_SIZE = 6;

interface CardsSectionController {
  element: HTMLElement;
  setQuery: (query: Partial<GamesQueryI>) => void;
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

  const cards = createCardsSection({
    category: 'all',
    sort: DEFAULT_SORT,
    page: 1,
    limit: PAGE_SIZE,
  });

  const filter = createLibraryFilter({
    onCategoryChange: (category) => cards.setQuery({ category, page: 1 }),
    onSortChange: (sort) => cards.setQuery({ sort, page: 1 }),
  });

  contents.append(libraryPageTitle(), filter.element, cards.element, createPaginationControl());

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

function createCardsSection(initialQuery: GamesQueryI): CardsSectionController {
  let query: GamesQueryI = { ...initialQuery };

  const cards = createAsyncContent<GameCardI[]>({
    load: async () => {
      const response = await getGames(query);
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

function createPaginationControl() {
  const paginationControl = document.createElement('nav');
  paginationControl.classList.add('pagination__control');
  paginationControl.setAttribute('aria-label', 'Pagination');

  const pageCount = 4;
  let currentPage = 1;

  const selectPage = (page: number) => {
    if (page === currentPage || page < 1 || page > pageCount) {
      return;
    }

    currentPage = page;
    render();
  };

  const render = () => {
    paginationControl.replaceChildren(
      createArrowControl('previous', currentPage === 1, () => selectPage(currentPage - 1)),
      ...Array.from({ length: pageCount }, (_, index) =>
        createPageControl(index + 1, currentPage, selectPage),
      ),
      createArrowControl('next', currentPage === pageCount, () => selectPage(currentPage + 1)),
    );
  };

  render();

  return paginationControl;
}

function createPageControl(
  page: number,
  currentPage: number,
  selectPage: (page: number) => void,
): HTMLButtonElement {
  const pageControl = document.createElement('button');

  pageControl.type = 'button';
  pageControl.classList.add('pagination__button', 'pagination__page-button');
  pageControl.textContent = String(page);
  pageControl.dataset.page = String(page);
  pageControl.setAttribute('aria-label', `Page ${page}`);

  if (page === 1) {
    pageControl.classList.toggle('active', page === currentPage);
  }

  if (page === currentPage) {
    pageControl.setAttribute('aria-current', 'page');
  }

  pageControl.addEventListener('click', () => selectPage(page));

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
