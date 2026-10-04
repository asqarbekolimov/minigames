export interface GameCardI {
  cardImage: string;
  category: string;
  featured?: boolean;
  likesCount: number;
  name: string;
  price: string | number;
  rating: number;
  shortDescription: string;
  slug: string;
}

export interface GameSpecsI {
  genre: string;
  players: string;
  duration: string;
  price: string;
}

export interface TopRecordI {
  position: number;
  playerName: string;
  score: number;
  achievedAt: string;
}

export interface GameDetailsI {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: GameSpecsI;
  topRecords: TopRecordI[];
}

export interface CommentI {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
}

export interface MockResponseI<T> {
  data: T;
}

export type GameSort = 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc';

export type CommentSort = 'newest' | 'oldest';

export interface ApiMetaI {
  totalItems?: number;
  description?: string;
  page?: number;
  limit?: number;
  totalPages?: number;
  appliedFilter?: {
    category: string;
    sort: GameSort | string;
  };
  totalComments?: number;
  returnedCount?: number;
  sort?: string;
}

export interface ApiResponseI<T> {
  data: T;
  meta?: ApiMetaI;
}

export interface CategoryI {
  slug: string;
  label: string;
  isDefault: boolean;
}

export interface LeaderboardPlayerI {
  rank: number;
  playerName: string;
  gamesPlayed: number;
  totalScore: number;
  streakDays: number;
  favoriteGameSlug: string;
  favoriteGameName: string;
}

export interface FavoriteToggleI {
  gameSlug: string;
  isFavorited: boolean;
  likesCount: number;
}

export interface CommentLikeToggleI {
  isLikedByCurrentUser: boolean;
  likesCount: number;
}

export interface GamesQueryI {
  featured?: boolean;
  page?: number;
  limit?: number;
  category?: string;
  sort?: GameSort | string;
}

export interface CommentsQueryI {
  limit?: number;
  sort?: CommentSort | string;
  userEmail?: string;
}

export interface PostCommentI {
  userEmail: string;
  authorName: string;
  text: string;
}
