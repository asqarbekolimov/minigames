import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoryI } from '@/utils/type';

const mocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('@/services/api', () => ({ getCategories: mocks.getCategories }));
vi.mock('@/components/common/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

import { createLibraryFilter, DEFAULT_SORT } from '@/components/library-filter/library-filter';

const categories: CategoryI[] = [
  { slug: 'all', label: 'All', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
];

describe('createLibraryFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads categories, selects the default and notifies listeners', async () => {
    mocks.getCategories.mockResolvedValue({ data: categories });
    const onCategoryChange = vi.fn();
    const controller = createLibraryFilter({ onCategoryChange });

    await vi.waitFor(() =>
      expect(controller.element.querySelectorAll('.chip-button')).toHaveLength(2),
    );

    expect(controller.getCategory()).toBe('all');
    expect(onCategoryChange).toHaveBeenCalledWith('all');
    expect(
      controller.element
        .querySelector<HTMLButtonElement>('.chip-button[data-category="all"]')
        ?.classList.contains('active'),
    ).toBe(true);
    expect(controller.getSort()).toBe(DEFAULT_SORT);
  });

  it('changes the active category when a chip is clicked', async () => {
    mocks.getCategories.mockResolvedValue({ data: categories });
    const onCategoryChange = vi.fn();
    const controller = createLibraryFilter({ onCategoryChange });

    await vi.waitFor(() =>
      expect(
        controller.element.querySelector('.chip-button[data-category="puzzle"]'),
      ).not.toBeNull(),
    );
    onCategoryChange.mockClear();

    controller.element
      .querySelector<HTMLButtonElement>('.chip-button[data-category="puzzle"]')
      ?.click();

    expect(controller.getCategory()).toBe('puzzle');
    expect(onCategoryChange).toHaveBeenCalledWith('puzzle');
    expect(
      controller.element
        .querySelector<HTMLButtonElement>('.chip-button[data-category="puzzle"]')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('opens the sort dropdown and applies a new sort', async () => {
    mocks.getCategories.mockResolvedValue({ data: categories });
    const onSortChange = vi.fn();
    const controller = createLibraryFilter({ onSortChange });
    await vi.waitFor(() =>
      expect(controller.element.querySelector('.sort-dropdown__trigger')).not.toBeNull(),
    );

    const trigger = controller.element.querySelector<HTMLButtonElement>('.sort-dropdown__trigger');
    trigger?.click();
    expect(controller.element.querySelector('.sort-dropdown')?.classList.contains('is-open')).toBe(
      true,
    );

    controller.element.querySelector<HTMLElement>('[data-value="name-asc"]')?.click();

    expect(onSortChange).toHaveBeenCalledWith('name-asc');
    expect(controller.getSort()).toBe('name-asc');
    expect(controller.element.querySelector('.sort-dropdown__label')?.textContent).toBe(
      'Sort by: Name A→Z',
    );
    expect(controller.element.querySelector('.sort-dropdown')?.classList.contains('is-open')).toBe(
      false,
    );
  });

  it('closes the sort dropdown on Escape and outside clicks', async () => {
    mocks.getCategories.mockResolvedValue({ data: categories });
    const controller = createLibraryFilter();
    await vi.waitFor(() =>
      expect(controller.element.querySelector('.sort-dropdown__trigger')).not.toBeNull(),
    );
    const trigger = controller.element.querySelector<HTMLButtonElement>('.sort-dropdown__trigger');

    trigger?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(controller.element.querySelector('.sort-dropdown')?.classList.contains('is-open')).toBe(
      false,
    );

    trigger?.click();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(controller.element.querySelector('.sort-dropdown')?.classList.contains('is-open')).toBe(
      false,
    );
  });

  it('shows an empty state when there are no categories', async () => {
    mocks.getCategories.mockResolvedValue({ data: [] });
    const controller = createLibraryFilter();

    await vi.waitFor(() => expect(controller.element.querySelector('.empty-state')).not.toBeNull());
    expect(controller.element.querySelector<HTMLElement>('.filter-chips')?.dataset.state).toBe(
      'empty',
    );
  });

  it('surfaces a loading error through the snackbar', async () => {
    mocks.getCategories.mockRejectedValue(new Error('network down'));
    createLibraryFilter();

    await vi.waitFor(() => expect(mocks.showSnackbar).toHaveBeenCalledTimes(1));
    expect(mocks.showSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error', message: 'network down' }),
    );
  });
});
