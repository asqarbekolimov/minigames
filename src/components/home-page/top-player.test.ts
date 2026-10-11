import { describe, expect, it } from 'vitest';
import { createTopPlayers } from '@/components/home-page/top-player';
import type { LeaderboardPlayerI } from '@/utils/type';

function makePlayer(overrides: Partial<LeaderboardPlayerI> = {}): LeaderboardPlayerI {
  return {
    rank: 1,
    playerName: 'cozy_gamer',
    gamesPlayed: 12,
    totalScore: 1234,
    streakDays: 5,
    favoriteGameSlug: 'tukoni',
    favoriteGameName: 'Tukoni',
    ...overrides,
  };
}

describe('createTopPlayers', () => {
  it('renders the leaderboard table with a row per player', () => {
    const section = createTopPlayers([makePlayer(), makePlayer({ rank: 2, playerName: 'Alex' })]);

    expect(section.classList.contains('section__leaderboard')).toBe(true);
    expect(
      section.querySelectorAll('.top-players__row:not(.top-players__row--header)'),
    ).toHaveLength(2);
  });

  it('uses the first two initials from an underscore/space name', () => {
    const section = createTopPlayers([makePlayer({ playerName: 'cozy_gamer' })]);

    expect(section.querySelector('.top-players__avatar')?.textContent).toBe('CG');
  });

  it('derives initials from a single short name', () => {
    const section = createTopPlayers([makePlayer({ playerName: 'Alex' })]);

    expect(section.querySelector('.top-players__avatar')?.textContent).toBe('AL');
  });

  it('highlights the first rank in gold and others in dark', () => {
    const section = createTopPlayers([
      makePlayer({ rank: 1 }),
      makePlayer({ rank: 2, playerName: 'Second' }),
    ]);

    const ranks = section.querySelectorAll<HTMLElement>('.top-players__rank');
    expect(ranks[0].style.color).toBe('rgb(255, 208, 43)');
    expect(ranks[1].style.color).toBe('rgb(36, 33, 69)');
  });

  it('formats the total score and favorite game', () => {
    const section = createTopPlayers([makePlayer({ totalScore: 1234 })]);

    expect(section.querySelector('.top-players__value--score')?.textContent).toBe('1,234');
    expect(section.querySelector('.top-players__badge')?.textContent).toBe('Tukoni');
  });

  it('cycles avatar colors', () => {
    const players = Array.from({ length: 6 }, (_, index) =>
      makePlayer({ rank: index + 1, playerName: `Player${index}` }),
    );
    const section = createTopPlayers(players);

    const avatars = section.querySelectorAll<HTMLElement>('.top-players__avatar');
    expect(avatars[5].style.backgroundColor).toBe('rgb(255, 208, 43)');
  });
});
