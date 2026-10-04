import type {
  ApiResponseI,
  CategoryI,
  CommentI,
  CommentLikeToggleI,
  CommentsQueryI,
  FavoriteToggleI,
  GameCardI,
  GameDetailsI,
  GamesQueryI,
  LeaderboardPlayerI,
  PostCommentI,
} from '@/utils/type';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com'
).replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function toQuery(parameters: object): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined) search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // Fall back to a generic message when the body is not JSON.
  }

  return `Request failed with status ${response.status}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Network error. Please check your connection and try again.', 0);
  }

  if (!response.ok) {
    throw new ApiError(await extractErrorMessage(response), response.status);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function postJson<T>(path: string, body: object): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function getCategories(): Promise<ApiResponseI<CategoryI[]>> {
  return request('/api/categories');
}

export function getLeaderboard(): Promise<ApiResponseI<LeaderboardPlayerI[]>> {
  return request('/api/leaderboard');
}

export function getGames(query: GamesQueryI = {}): Promise<ApiResponseI<GameCardI[]>> {
  return request(`/api/games${toQuery(query)}`);
}

export function getGameDetails(
  gameSlug: string,
  userEmail?: string,
): Promise<ApiResponseI<GameDetailsI>> {
  return request(`/api/games/${encodeURIComponent(gameSlug)}${toQuery({ userEmail })}`);
}

export function toggleFavorite(
  gameSlug: string,
  userEmail: string,
): Promise<ApiResponseI<FavoriteToggleI>> {
  return postJson(`/api/games/${encodeURIComponent(gameSlug)}/favorite`, { userEmail });
}

export function getComments(
  gameSlug: string,
  query: CommentsQueryI = {},
): Promise<ApiResponseI<CommentI[]>> {
  return request(`/api/games/${encodeURIComponent(gameSlug)}/comments${toQuery(query)}`);
}

export function postComment(
  gameSlug: string,
  payload: PostCommentI,
): Promise<ApiResponseI<CommentI>> {
  return postJson(`/api/games/${encodeURIComponent(gameSlug)}/comments`, payload);
}

export function toggleCommentLike(
  commentId: string,
  userEmail: string,
): Promise<ApiResponseI<CommentLikeToggleI>> {
  return postJson(`/api/comments/${encodeURIComponent(commentId)}/like`, { userEmail });
}
