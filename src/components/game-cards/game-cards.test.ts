import { describe, expect, it } from 'vitest';
import { createGameCards } from '@/components/game-cards/game-cards';
import type { GameCardI } from '@/utils/type';

function makeGame(overrides: Partial<GameCardI> = {}): GameCardI {
  return {
    cardImage: '/img.png',
    category: 'Puzzle',
    likesCount: 31_200,
    name: 'Tukoni',
    price: 'Free',
    rating: 4.9,
    shortDescription: 'A cozy game',
    slug: 'tukoni',
    ...overrides,
  };
}

describe('createGameCards', () => {
  it('renders one card per game inside the container', () => {
    const container = createGameCards([makeGame(), makeGame({ slug: 'two', name: 'Two' })]);

    expect(container.classList.contains('cards')).toBe(true);
    expect(container.querySelectorAll('.card__item')).toHaveLength(2);
    expect(container.querySelector('.game__name')?.textContent).toBe('Tukoni');
  });

  it('renders an empty container for no games', () => {
    const container = createGameCards([]);

    expect(container.querySelectorAll('.card__item')).toHaveLength(0);
  });

  it('marks numeric prices with the number class', () => {
    const container = createGameCards([makeGame({ price: '$5.99' })]);

    expect(container.querySelector('.game__price')?.classList.contains('number')).toBe(true);
  });

  it('marks non-numeric prices with the string class', () => {
    const container = createGameCards([makeGame({ price: 'Free' })]);

    expect(container.querySelector('.game__price')?.classList.contains('string')).toBe(true);
  });

  it('formats large like counts compactly and includes a details trigger', () => {
    const container = createGameCards([makeGame({ likesCount: 31_200 })]);

    const likeText = container.querySelectorAll(':scope .ratings__item span')[1];
    expect(likeText?.textContent).toBe('31.2K');
    expect(container.querySelector('[data-open-game-details]')?.textContent).toBe('Details');
  });
});
