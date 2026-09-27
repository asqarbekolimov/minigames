export interface GameCardI {
  cardImage: string;
  category: string;
  featured: boolean;
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
