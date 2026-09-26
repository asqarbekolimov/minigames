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
  const contents = document.createElement('div'),
    paginationControl = document.createElement('div');

  contents.classList.add('library__contents');

  paginationControl.classList.add('pagination__control');

  contents.append(libraryPageTitle(), createLibraryFilter(), createGameCards(), paginationControl);

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
