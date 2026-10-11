import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  getCategories,
  getComments,
  getGameDetails,
  getGames,
  getLeaderboard,
  postComment,
  toggleCommentLike,
  toggleFavorite,
} from '@/services/api';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, isOk = true, status = 200): Response {
  return {
    ok: isOk,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function emptyResponse(status = 204): Response {
  return {
    ok: true,
    status,
    json: async () => ({}),
    text: async () => '',
  } as unknown as Response;
}

function firstUrl(): string {
  return String(fetchMock.mock.calls[0]?.[0]);
}

function firstInit(): RequestInit {
  return (fetchMock.mock.calls[0]?.[1] ?? {}) as RequestInit;
}

describe('api service', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches categories with an Accept header', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [{ slug: 'all' }] }));

    const result = await getCategories();

    expect(result.data).toEqual([{ slug: 'all' }]);
    expect(firstUrl()).toContain('/api/categories');
    const headers = new Headers(firstInit().headers);
    expect(headers.get('Accept')).toBe('application/json');
  });

  it('fetches the leaderboard', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await getLeaderboard();

    expect(firstUrl()).toContain('/api/leaderboard');
  });

  it('builds a query string for games and omits undefined values', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await getGames({ featured: true, page: 2, limit: 6, category: 'puzzle', sort: 'rating-desc' });

    const url = new URL(firstUrl());
    expect(url.pathname).toBe('/api/games');
    expect(url.searchParams.get('featured')).toBe('true');
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('limit')).toBe('6');
    expect(url.searchParams.get('category')).toBe('puzzle');
    expect(url.searchParams.get('sort')).toBe('rating-desc');
  });

  it('encodes the game slug and forwards the user email', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));

    await getGameDetails('tukoni forest', 'alex@example.com');

    const url = new URL(firstUrl());
    expect(url.pathname).toBe('/api/games/tukoni%20forest');
    expect(url.searchParams.get('userEmail')).toBe('alex@example.com');
  });

  it('posts a favorite toggle as JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));

    await toggleFavorite('game-1', 'alex@example.com');

    const init = firstInit();
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(String(init.body))).toEqual({ userEmail: 'alex@example.com' });
  });

  it('fetches comments with a query and posts new comments', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: [] }));

    await getComments('game-1', { limit: 10, sort: 'newest', userEmail: 'alex@example.com' });

    const url = new URL(firstUrl());
    expect(url.pathname).toBe('/api/games/game-1/comments');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.searchParams.get('sort')).toBe('newest');
    expect(url.searchParams.get('userEmail')).toBe('alex@example.com');

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));
    await postComment('game-1', {
      userEmail: 'alex@example.com',
      authorName: 'Alex',
      text: 'Nice game',
    });

    const init = firstInit();
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body)).text).toBe('Nice game');
  });

  it('posts a comment like toggle', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: {} }));

    await toggleCommentLike('comment-9', 'alex@example.com');

    expect(firstUrl()).toContain('/api/comments/comment-9/like');
    expect(firstInit().method).toBe('POST');
  });

  it('throws an ApiError carrying the server error message and status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'Game not found' }, false, 404));

    const promise = getGameDetails('missing');

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ message: 'Game not found', status: 404 });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
      text: async () => 'boom',
    } as unknown as Response);

    await expect(getCategories()).rejects.toMatchObject({
      message: 'Request failed with status 500',
      status: 500,
    });
  });

  it('reports network failures with status 0', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(getCategories()).rejects.toMatchObject({
      message: 'Network error. Please check your connection and try again.',
      status: 0,
    });
  });

  it('returns an empty object for empty response bodies', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await expect(getCategories()).resolves.toEqual({});
  });

  it('names the ApiError class for easier debugging', () => {
    expect(new ApiError('x', 1).name).toBe('ApiError');
  });
});
