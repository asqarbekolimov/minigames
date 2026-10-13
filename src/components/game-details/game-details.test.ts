import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommentI, GameDetailsI, MockResponseI } from '@/utils/type';

const authMocks = vi.hoisted(() => ({ isSessionActive: vi.fn(() => true) }));
vi.mock('@/services/auth', () => ({ isSessionActive: authMocks.isSessionActive }));

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

function payload<T>(data: T): Response {
  return { ok: true, status: 200, json: async () => ({ data }) as MockResponseI<T> } as Response;
}

const fetchMock = vi.fn();

describe('createGameDetails', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    authMocks.isSessionActive.mockReturnValue(true);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hydrates the dialog from the mock endpoints', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) =>
      Promise.resolve(payload(String(input).includes('game-tukoni') ? game : comments)),
    );

    const page = createGameDetails();

    await vi.waitFor(() =>
      expect(page.querySelector('.game-details__title')?.textContent).toBe('Tukoni'),
    );
    expect(page.querySelector('[data-game-rating]')?.textContent).toBe('4.9');
    expect(page.querySelector('[data-game-likes]')?.textContent).toBe('31.2K');
    expect(page.querySelector('[data-spec-genre]')?.textContent).toBe('Puzzle');
    expect(page.querySelectorAll('.records__row')).toHaveLength(2);
    expect(page.querySelectorAll('.comment')).toHaveLength(2);
    expect(page.querySelector('[data-comments-title]')?.textContent).toBe('Comments (2)');
  });

  it('keeps the fallback content when the data cannot be loaded', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response);

    const page = createGameDetails();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(page.querySelector('.game-details__title')?.textContent).toBe('Tukoni: Forest Keepers');
  });

  it('toggles the favorite button state and label', () => {
    fetchMock.mockImplementation(() => Promise.resolve(payload(game)));
    const page = createGameDetails();
    const favorite = page.querySelector<HTMLButtonElement>('.game-details__favorite');

    favorite?.click();
    expect(favorite?.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('.game-details__favorite-label')?.textContent).toBe(
      'Remove from Favorites',
    );

    favorite?.click();
    expect(favorite?.getAttribute('aria-pressed')).toBe('false');
  });

  it('increments and decrements a comment like count', async () => {
    fetchMock.mockImplementation((input: RequestInfo | URL) =>
      Promise.resolve(payload(String(input).includes('game-tukoni') ? game : comments)),
    );
    const page = createGameDetails();
    await vi.waitFor(() => expect(page.querySelectorAll('.comment')).toHaveLength(2));

    const likeButtons = page.querySelectorAll<HTMLButtonElement>('.comment__like');
    const target = likeButtons[1];
    target.click();
    expect(target.getAttribute('aria-pressed')).toBe('true');
    expect(target.querySelector('.comment__like-count')?.textContent).toBe('1');

    target.click();
    expect(target.querySelector('.comment__like-count')?.textContent).toBe('0');
  });

  it('resizes the comment textarea on input and prevents submit navigation', () => {
    fetchMock.mockImplementation(() => Promise.resolve(payload(game)));
    const page = createGameDetails();
    const textarea = page.querySelector<HTMLTextAreaElement>('.comment-form__textarea');

    textarea?.dispatchEvent(new Event('input'));
    expect(textarea?.style.height).not.toBe('');

    const form = page.querySelector<HTMLFormElement>('.comment-form');
    const submit = new Event('submit', { cancelable: true });
    form?.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
  });

  it('blocks a protected action and requests authentication when there is no session', () => {
    fetchMock.mockImplementation(() => Promise.resolve(payload(game)));
    authMocks.isSessionActive.mockReturnValue(false);
    const page = createGameDetails();
    const listener = vi.fn();
    globalThis.addEventListener('auth-required-for-action', listener);
    const favorite = page.querySelector<HTMLButtonElement>('.game-details__favorite');

    favorite?.click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(favorite?.getAttribute('aria-pressed')).toBe('false');
    globalThis.removeEventListener('auth-required-for-action', listener);
  });

  it('dispatches a close event from the close button and the backdrop', () => {
    fetchMock.mockImplementation(() => Promise.resolve(payload(game)));
    const page = createGameDetails();
    const close = vi.fn();
    page.addEventListener('game-details-close', close);

    page.querySelector<HTMLButtonElement>('.game-details__close')?.click();
    page.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(close).toHaveBeenCalledTimes(2);
  });
});
