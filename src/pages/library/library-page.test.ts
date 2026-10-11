import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoryI, GameCardI } from '@/utils/type';

const mocks = vi.hoisted(() => ({
  getGames: vi.fn(),
  getCategories: vi.fn(),
  showSnackbar: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  getGames: mocks.getGames,
  getCategories: mocks.getCategories,
}));
vi.mock('@/components/common/snackbar', () => ({ showSnackbar: mocks.showSnackbar }));

import { createLibraryPage } from '@/pages/library/library-page';

const categories: CategoryI[] = [
  { slug: 'all', label: 'All', isDefault: true },
  { slug: 'puzzle', label: 'Puzzle', isDefault: false },
];

function makeGame(slug: string): GameCardI {
  return {
    cardImage: '/img.png',
    category: 'Puzzle',
    likesCount: 10,
    name: slug,
    price: 'Free',
    rating: 4.5,
    shortDescription: 'desc',
    slug,
  };
}

describe('createLibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCategories.mockResolvedValue({ data: categories });
  });

  it('loads games on mount and renders the cards', async () => {
    mocks.getGames.mockResolvedValue({
      data: [makeGame('a'), makeGame('b')],
      meta: { page: 1, totalPages: 1 },
    });

    const page = createLibraryPage();

    await vi.waitFor(() => expect(page.querySelectorAll('.card__item')).toHaveLength(2));
    expect(mocks.getGames).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'all', page: 1, limit: 6 }),
    );
  });

  it('renders pagination and requests the next page', async () => {
    mocks.getGames.mockResolvedValue({
      data: [makeGame('a')],
      meta: { page: 1, totalPages: 3 },
    });

    const page = createLibraryPage();
    await vi.waitFor(() =>
      expect(page.querySelectorAll('.pagination__page-button')).toHaveLength(3),
    );

    page.querySelector<HTMLButtonElement>('[data-page="2"]')?.click();

    await vi.waitFor(() => expect(mocks.getGames).toHaveBeenCalledTimes(2));
    expect(mocks.getGames.mock.calls[1][0]).toMatchObject({ page: 2 });
  });

  it('reloads with the selected category', async () => {
    mocks.getGames.mockResolvedValue({ data: [makeGame('a')], meta: { page: 1, totalPages: 1 } });

    const page = createLibraryPage();
    await vi.waitFor(() =>
      expect(page.querySelector('.chip-button[data-category="puzzle"]')).not.toBeNull(),
    );

    page.querySelector<HTMLButtonElement>('.chip-button[data-category="puzzle"]')?.click();

    await vi.waitFor(() => expect(mocks.getGames).toHaveBeenCalledTimes(2));
    expect(mocks.getGames.mock.calls[1][0]).toMatchObject({ category: 'puzzle', page: 1 });
  });

  it('shows an empty state when no games are returned', async () => {
    mocks.getGames.mockResolvedValue({ data: [], meta: { page: 1, totalPages: 1 } });

    const page = createLibraryPage();

    await vi.waitFor(() => expect(page.querySelector('.empty-state')).not.toBeNull());
  });

  it('shows an error banner and snackbar when loading fails', async () => {
    mocks.getGames.mockRejectedValue(new Error('boom'));

    const page = createLibraryPage();

    await vi.waitFor(() => expect(page.querySelector('.error-banner')).not.toBeNull());
    expect(mocks.showSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'error', message: 'boom' }),
    );
  });
});
