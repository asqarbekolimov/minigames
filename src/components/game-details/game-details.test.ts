import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommentI, GameDetailsI } from '@/utils/type';

const authMocks = vi.hoisted(() => ({
  isSessionActive: vi.fn(() => true),
  getCurrentSession: vi.fn<() => { email: string; displayName: string } | undefined>(() => ({
    email: 'alex@example.com',
    displayName: 'Alex',
  })),
}));

const apiMocks = vi.hoisted(() => ({
  getGameDetails: vi.fn(),
  getComments: vi.fn(),
  toggleFavorite: vi.fn(),
  toggleCommentLike: vi.fn(),
  postComment: vi.fn(),
}));

vi.mock('@/services/auth', () => ({
  isSessionActive: authMocks.isSessionActive,
  getCurrentSession: authMocks.getCurrentSession,
}));

vi.mock('@/services/api', () => ({
  ApiError: class ApiError extends Error {},
  getGameDetails: apiMocks.getGameDetails,
  getComments: apiMocks.getComments,
  toggleFavorite: apiMocks.toggleFavorite,
  toggleCommentLike: apiMocks.toggleCommentLike,
  postComment: apiMocks.postComment,
}));

import { createGameDetails } from '@/components/game-details/game-details';

const game: GameDetailsI = {
  slug: 'tukoni',
  name: 'Tukoni',
  heroImage: '/hero.jpg',
  rating: 4.9,
  likesCount: 31_200,
  isLikedByCurrentUser: false,
  fullDescription: 'A cozy game',
  specs: { genre: 'Puzzle', players: 'Solo', duration: '40 min', price: 'Free' },
  topRecords: [
    {
      position: 1,
      playerName: 'Alex',
      score: 1200,
      achievedAt: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      position: 4,
      playerName: 'Sam',
      score: 100,
      achievedAt: new Date().toISOString(),
    },
  ],
};

const comments: CommentI[] = [
  {
    commentId: 'c1',
    authorName: 'Alex Smith',
    text: 'Nice',
    likesCount: 2,
    isLikedByCurrentUser: true,
    createdAt: new Date(Date.now() - 60_000).toISOString(),
  },
  {
    commentId: 'c2',
    authorName: 'Sam',
    text: 'Ok',
    likesCount: 0,
    isLikedByCurrentUser: false,
    createdAt: new Date().toISOString(),
  },
];

async function renderDetails(slug = 'tukoni'): Promise<HTMLElement> {
  const page = createGameDetails(slug);

  await vi.waitFor(() => expect(page.querySelector('.game-details__title')).not.toBeNull());

  return page;
}

describe('createGameDetails', () => {
  beforeEach(() => {
    apiMocks.getGameDetails.mockReset().mockResolvedValue({ data: game });
    apiMocks.getComments.mockReset().mockResolvedValue({ data: comments });
    apiMocks.toggleFavorite.mockReset().mockResolvedValue({
      data: { isFavorited: false, likesCount: game.likesCount },
    });
    apiMocks.toggleCommentLike.mockReset().mockResolvedValue({
      data: { isLikedByCurrentUser: false, likesCount: 0 },
    });
    apiMocks.postComment.mockReset().mockResolvedValue({ data: comments[0] });
    authMocks.isSessionActive.mockReturnValue(true);
    authMocks.getCurrentSession.mockReturnValue({ email: 'alex@example.com', displayName: 'Alex' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates the dialog from the games API using the selected slug', async () => {
    const page = await renderDetails();

    expect(apiMocks.getGameDetails).toHaveBeenCalledWith('tukoni', 'alex@example.com');
    expect(apiMocks.getComments).toHaveBeenCalledWith(
      'tukoni',
      expect.objectContaining({ userEmail: 'alex@example.com' }),
    );
    expect(page.querySelector('.game-details__title')?.textContent).toBe('Tukoni');
    expect(page.querySelector('.game-details__hero-image')?.getAttribute('src')).toBe('/hero.jpg');
    expect(page.querySelector('[data-game-rating]')?.textContent).toBe('4.9');
    expect(page.querySelector('[data-game-likes]')?.textContent).toBe('31.2K');
    expect(page.querySelector('[data-spec-genre]')?.textContent).toBe('Puzzle');
    expect(page.querySelectorAll('.records__row')).toHaveLength(2);
    expect(page.querySelectorAll('.comment')).toHaveLength(2);
    expect(page.querySelector('[data-comments-title]')?.textContent).toBe('Comments (2)');
  });

  it('omits the user email from the requests when there is no session', async () => {
    authMocks.getCurrentSession.mockReturnValue(undefined);

    await renderDetails();

    expect(apiMocks.getGameDetails).toHaveBeenCalledWith('tukoni', undefined);
    expect(apiMocks.getComments).toHaveBeenCalledWith(
      'tukoni',
      expect.objectContaining({ userEmail: undefined }),
    );
  });

  it('shows an error banner and retries the request on failure', async () => {
    apiMocks.getGameDetails.mockRejectedValueOnce(new Error('Game not found'));
    const page = createGameDetails('missing');

    await vi.waitFor(() =>
      expect(page.querySelector('.error-banner__message')?.textContent).toBe('Game not found'),
    );
    expect(page.querySelector('.game-details__close')).not.toBeNull();

    page.querySelector<HTMLButtonElement>('.error-banner__retry')?.click();

    await vi.waitFor(() =>
      expect(page.querySelector('.game-details__title')?.textContent).toBe('Tukoni'),
    );
    expect(apiMocks.getGameDetails).toHaveBeenCalledTimes(2);
  });

  it('renders a loading skeleton before the data arrives', () => {
    apiMocks.getGameDetails.mockReturnValue(new Promise(() => {}));
    apiMocks.getComments.mockReturnValue(new Promise(() => {}));

    const page = createGameDetails('tukoni');

    expect(page.querySelector('.skeleton--details')).not.toBeNull();
  });

  it('reflects the liked state returned by the API', async () => {
    apiMocks.getGameDetails.mockResolvedValue({
      data: { ...game, isLikedByCurrentUser: true },
    });

    const page = await renderDetails();
    const favorite = page.querySelector<HTMLButtonElement>('.game-details__favorite');

    expect(favorite?.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('.game-details__favorite-label')?.textContent).toBe(
      'Remove from Favorites',
    );
  });

  it('toggles the favorite button state and label', async () => {
    apiMocks.toggleFavorite
      .mockResolvedValueOnce({ data: { isFavorited: true, likesCount: game.likesCount } })
      .mockResolvedValueOnce({ data: { isFavorited: false, likesCount: game.likesCount } });
    const page = await renderDetails();
    const favorite = page.querySelector<HTMLButtonElement>('.game-details__favorite');

    favorite?.click();
    await vi.waitFor(() => expect(favorite?.getAttribute('aria-pressed')).toBe('true'));
    expect(page.querySelector('.game-details__favorite-label')?.textContent).toBe(
      'Remove from Favorites',
    );

    favorite?.click();
    await vi.waitFor(() => expect(favorite?.getAttribute('aria-pressed')).toBe('false'));
  });

  it('increments and decrements a comment like count', async () => {
    apiMocks.toggleCommentLike
      .mockResolvedValueOnce({ data: { isLikedByCurrentUser: true, likesCount: 1 } })
      .mockResolvedValueOnce({ data: { isLikedByCurrentUser: false, likesCount: 0 } });
    const page = await renderDetails();

    const likeButtons = page.querySelectorAll<HTMLButtonElement>('.comment__like');
    const target = likeButtons[1];
    target.click();
    await vi.waitFor(() => expect(target.getAttribute('aria-pressed')).toBe('true'));
    expect(target.querySelector('.comment__like-count')?.textContent).toBe('1');

    target.click();
    await vi.waitFor(() =>
      expect(target.querySelector('.comment__like-count')?.textContent).toBe('0'),
    );
  });

  it('resizes the comment textarea on input and prevents submit navigation', async () => {
    const page = await renderDetails();
    const textarea = page.querySelector<HTMLTextAreaElement>('.comment-form__textarea');

    textarea?.dispatchEvent(new Event('input'));
    expect(textarea?.style.height).not.toBe('');

    const form = page.querySelector<HTMLFormElement>('.comment-form');
    const submit = new Event('submit', { cancelable: true });
    form?.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
  });

  it('blocks a protected action and requests authentication when there is no session', async () => {
    const page = await renderDetails();
    authMocks.isSessionActive.mockReturnValue(false);
    const listener = vi.fn();
    globalThis.addEventListener('auth-required-for-action', listener);
    const favorite = page.querySelector<HTMLButtonElement>('.game-details__favorite');

    favorite?.click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(favorite?.getAttribute('aria-pressed')).toBe('false');
    globalThis.removeEventListener('auth-required-for-action', listener);
  });

  it('dispatches a close event from the close button and the backdrop', () => {
    const page = createGameDetails('tukoni');
    const close = vi.fn();
    page.addEventListener('game-details-close', close);

    page.querySelector<HTMLButtonElement>('.game-details__close')?.click();
    page.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(close).toHaveBeenCalledTimes(2);
  });
});
