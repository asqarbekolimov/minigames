import './library-filter.scss';

const chips = ['All Games', 'Puzzle', 'Card', 'Match', 'Farm', 'Strategy', 'Arcade'];

export function createLibraryFilter(): HTMLElement {
  const filterSortBar = document.createElement('div'),
    filterChipsContainer = document.createElement('div'),
    sortDropdown = document.createElement('div'),
    sortText = document.createElement('span'),
    dropdownArrow = document.createElement('span');

  sortDropdown.classList.add('filter-dropdown');
  dropdownArrow.classList.add('dropdown__arrow');

  dropdownArrow.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5" fill="none">
  <path d="M0 5L5 0L10 5H0Z" fill="#444746"/>
  </svg>
  `;

  sortText.textContent = 'Sort by: Rating ↓';

  sortDropdown.append(sortText, dropdownArrow);

  filterChipsContainer.classList.add('filter-chips');
  filterSortBar.classList.add('filter-sort-bar');

  const filterChips = chips.map((chip, index) => {
    const chipButton = document.createElement('button');
    chipButton.classList.add('chip-button');
    chipButton.textContent = chip;

    if (index === 0) {
      chipButton.classList.add('active');
    }

    return chipButton;
  });

  filterChipsContainer.append(...filterChips);

  filterSortBar.append(filterChipsContainer, sortDropdown);
  return filterSortBar;
}
