import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameCardI, LeaderboardPlayerI } from '@/utils/type';

const mocks = vi.hoisted(() => ({
  getGames: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  getGames: mocks.getGames,
  getLeaderboard: mocks.getLeaderboard,
}));

import { createHomePage } from '@/pages/home/home-page';

function makeGame(slug: string): GameCardI {
  return {
    cardImage: '/img.png',
    category: 'Puzzle',
    likesCount: 100,
    name: slug,
    price: 'Free',
    rating: 4.8,
    shortDescription: 'desc',
    slug,
  };
}

function makePlayer(name: string): LeaderboardPlayerI {
  return {
    rank: 1,
    playerName: name,
    gamesPlayed: 3,
    totalScore: 1000,
    streakDays: 2,
    favoriteGameSlug: 'a',
    favoriteGameName: 'A',
  };
}

describe('createHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all home sections', async () => {
    mocks.getGames.mockResolvedValue({ data: [makeGame('a')] });
    mocks.getLeaderboard.mockResolvedValue({ data: [makePlayer('Alex')] });

    const page = createHomePage();

    expect(page.querySelector('.section__hero')).not.toBeNull();
    expect(page.querySelector('.section__cta')).not.toBeNull();
    await vi.waitFor(() => expect(page.querySelector('.section__slider')).not.toBeNull());
    expect(page.querySelector('.section__leaderboard')).not.toBeNull();
  });

  it('requests featured games and the leaderboard and renders results', async () => {
    mocks.getGames.mockResolvedValue({ data: [makeGame('a'), makeGame('b')] });
    mocks.getLeaderboard.mockResolvedValue({ data: [makePlayer('Alex')] });

    const page = createHomePage();

    expect(mocks.getGames).toHaveBeenCalledWith({ featured: true });
    await vi.waitFor(() =>
      expect(page.querySelectorAll('.game-card').length).toBeGreaterThanOrEqual(2),
    );
    expect(page.querySelector('.top-players__row:not(.top-players__row--header)')).not.toBeNull();
  });

  it('shows empty states when there is no data', async () => {
    mocks.getGames.mockResolvedValue({ data: [] });
    mocks.getLeaderboard.mockResolvedValue({ data: [] });

    const page = createHomePage();

    await vi.waitFor(() =>
      expect(page.querySelectorAll('.empty-state').length).toBeGreaterThanOrEqual(2),
    );
  });
});
