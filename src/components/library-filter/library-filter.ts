import './library-filter.scss';
import { createAsyncContent, createSkeleton } from '@/components/common/async-content';
import { showSnackbar } from '@/components/common/snackbar';
import { getCategories } from '@/services/api';
import type { CategoryI, GameSort } from '@/utils/type';

export const DEFAULT_SORT: GameSort = 'rating-desc';

const DEFAULT_CATEGORY = 'all';
const CHIP_SKELETON_COUNT = 7;

interface SortOptionI {
  value: GameSort;
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

export interface LibraryFilterOptions {
  onCategoryChange?: (category: string) => void;
  onSortChange?: (sort: GameSort) => void;
}

export interface LibraryFilterController {
  element: HTMLElement;
  getCategory: () => string;
  getSort: () => GameSort;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function createLibraryFilter(options: LibraryFilterOptions = {}): LibraryFilterController {
  const filterSortBar = document.createElement('div');
  filterSortBar.classList.add('filter-sort-bar');

  let activeCategory = DEFAULT_CATEGORY;
  let selectedSort: GameSort = DEFAULT_SORT;
  let isInitialized = false;

  const renderChips = (categories: CategoryI[]): Node[] => {
    if (!isInitialized) {
      isInitialized = true;

      const defaultCategory = categories.find((category) => category.isDefault);
      if (defaultCategory) {
        activeCategory = defaultCategory.slug;
        options.onCategoryChange?.(activeCategory);
      }
    }

    const buttons = categories.map((category) => createChip(category, activeCategory));

    for (const button of buttons) {
      button.addEventListener('click', () => selectCategory(button.dataset.category ?? ''));
    }

    return buttons;
  };

  const selectCategory = (slug: string): void => {
    if (slug === activeCategory || !slug) return;

    activeCategory = slug;

    const buttons = chips.element.querySelectorAll<HTMLButtonElement>('.chip-button');
    for (const button of buttons) {
      const isActive = button.dataset.category === slug;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    }

    options.onCategoryChange?.(slug);
  };

  const chips = createAsyncContent<CategoryI[]>({
    load: async () => {
      const response = await getCategories();
      return response.data;
    },
    render: renderChips,
    renderSkeleton: () => createSkeleton({ variant: 'chips', count: CHIP_SKELETON_COUNT }),
    errorMessage: getErrorMessage,
    retryLabel: 'Try again',
    empty: { title: 'No categories yet', message: 'Categories will appear here soon.' },
    onError: (error) => {
      showSnackbar({ message: getErrorMessage(error), variant: 'error' });
    },
  });

  chips.element.classList.add('filter-chips');

  const sortDropdown = createSortDropdown((value) => {
    selectedSort = value;
    options.onSortChange?.(value);
  });

  filterSortBar.append(chips.element, sortDropdown);
  void chips.reload();

  return {
    element: filterSortBar,
    getCategory: () => activeCategory,
    getSort: () => selectedSort,
  };
}

function createChip(category: CategoryI, activeCategory: string): HTMLButtonElement {
  const button = document.createElement('button');
  const isActive = category.slug === activeCategory;

  button.type = 'button';
  button.classList.add('chip-button');
  button.textContent = category.label;
  button.dataset.category = category.slug;
  button.classList.toggle('active', isActive);
  button.setAttribute('aria-pressed', String(isActive));

  return button;
}

function createSortDropdown(onSelect: (value: GameSort) => void): HTMLElement {
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

  let selectedValue: GameSort = DEFAULT_SORT;

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

  const selectOption = (value: GameSort) => {
    const hasChanged = value !== selectedValue;

    selectedValue = value;

    if (hasChanged) {
      renderMenu();
      updateLabel();
      onSelect(value);
    }

    setOpen(false);
  };

  trigger.addEventListener('click', () => {
    setOpen(!dropdown.classList.contains('is-open'));
  });

  menu.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const item = event.target.closest<HTMLElement>('.sort-dropdown__option');
    const value = item?.dataset.value;
    const option = sortOptions.find((candidate) => candidate.value === value);
    if (option) selectOption(option.value);
  });

  renderMenu();
  updateLabel();
  dropdown.append(trigger, menu);

  return dropdown;
}
