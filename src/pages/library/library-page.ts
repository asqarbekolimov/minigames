import { createLibraryFilter } from '@/components/library-filter/library-filter';
import './library-page.scss';
import { createGameCards } from '@/components/game-cards/game-cards';

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

  contents.append(
    libraryPageTitle(),
    createLibraryFilter(),
    createGameCards(),
    createPaginationControl(),
  );

  return contents;
}

function libraryPageTitle() {
  const pageTitle = document.createElement('div');
  pageTitle.classList.add('library__header');

  const headingText = document.createElement('h2'),
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
