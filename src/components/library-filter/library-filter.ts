import './library-filter.scss';

const chips = ['All Games', 'Puzzle', 'Card', 'Match', 'Farm', 'Strategy', 'Arcade'];

interface SortOptionI {
  value: string;
  label: string;
}

const sortOptions: SortOptionI[] = [
  { value: 'rating-asc', label: 'Rating ↑' },
  { value: 'rating-desc', label: 'Rating ↓' },
  { value: 'name-asc', label: 'Name A→Z' },
  { value: 'name-desc', label: 'Name Z→A' },
];

const chevronIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5" fill="none" aria-hidden="true"><path d="M0 0L5 5L10 0H0Z" fill="currentColor"/></svg>`;

const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const DEFAULT_SORT = 'rating-desc';

export function createLibraryFilter(): HTMLElement {
  const filterSortBar = document.createElement('div');
  const filterChipsContainer = document.createElement('div');

  filterChipsContainer.classList.add('filter-chips');
  filterSortBar.classList.add('filter-sort-bar');

  const filterChips = chips.map((chip, index) => {
    const chipButton = document.createElement('button');
    chipButton.type = 'button';
    chipButton.classList.add('chip-button');
    chipButton.textContent = chip;

    if (index === 0) chipButton.classList.add('active');

    chipButton.addEventListener('click', () => {
      const buttons = filterChipsContainer.querySelectorAll<HTMLElement>('.chip-button');
      for (const button of buttons) button.classList.toggle('active', button === chipButton);
    });

    return chipButton;
  });

  filterChipsContainer.append(...filterChips);
  filterSortBar.append(filterChipsContainer, createSortDropdown());

  return filterSortBar;
}

function createSortDropdown(): HTMLElement {
  const dropdown = document.createElement('div');
  dropdown.classList.add('sort-dropdown');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.classList.add('sort-dropdown__trigger');
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const label = document.createElement('span');
  label.classList.add('sort-dropdown__label');

  const chevron = document.createElement('span');
  chevron.classList.add('sort-dropdown__chevron');
  chevron.innerHTML = chevronIcon;

  trigger.append(label, chevron);

  const menu = document.createElement('ul');
  menu.classList.add('sort-dropdown__menu');
  menu.setAttribute('role', 'listbox');

  let selectedValue = DEFAULT_SORT;

  const createOption = (option: SortOptionI): HTMLLIElement => {
    const item = document.createElement('li');
    const isSelected = option.value === selectedValue;

    item.classList.add('sort-dropdown__option');
    item.dataset.value = option.value;
    item.setAttribute('role', 'option');
    item.setAttribute('aria-selected', String(isSelected));
    item.classList.toggle('is-selected', isSelected);

    const check = document.createElement('span');
    check.classList.add('sort-dropdown__check');
    if (isSelected) check.innerHTML = checkIcon;

    const text = document.createElement('span');
    text.classList.add('sort-dropdown__option-label');
    text.textContent = option.label;

    item.append(check, text);
    return item;
  };

  const renderMenu = () => {
    menu.replaceChildren(...sortOptions.map((option) => createOption(option)));
  };

  const updateLabel = () => {
    const selected = sortOptions.find((option) => option.value === selectedValue);
    label.textContent = `Sort by: ${selected?.label ?? ''}`;
  };

  const handleOutsideClick = (event: MouseEvent) => {
    if (!(event.target instanceof Node) || !dropdown.contains(event.target)) setOpen(false);
  };

  const handleEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') setOpen(false);
  };

  function setOpen(isOpen: boolean): void {
    dropdown.classList.toggle('is-open', isOpen);
    trigger.setAttribute('aria-expanded', String(isOpen));

    if (isOpen) {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    }
  }

  const selectOption = (value: string) => {
    selectedValue = value;
    renderMenu();
    updateLabel();
    setOpen(false);
  };

  trigger.addEventListener('click', () => {
    setOpen(!dropdown.classList.contains('is-open'));
  });

  menu.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const item = event.target.closest<HTMLElement>('.sort-dropdown__option');
    const value = item?.dataset.value;
    if (value) selectOption(value);
  });

  renderMenu();
  updateLabel();
  dropdown.append(trigger, menu);

  return dropdown;
}
