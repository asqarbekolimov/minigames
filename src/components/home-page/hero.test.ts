import { describe, expect, it } from 'vitest';
import { createHeroSection } from '@/components/home-page/hero';

describe('createHeroSection', () => {
  it('renders the hero copy and a library button', () => {
    const hero = createHeroSection();

    expect(hero.classList.contains('section__hero')).toBe(true);
    expect(hero.querySelector('.hero__title')?.textContent).toBe('Take a Short Break & Have Fun');
    expect(hero.querySelector('.hero__button')?.textContent).toBe('Browse Library');
  });
});
