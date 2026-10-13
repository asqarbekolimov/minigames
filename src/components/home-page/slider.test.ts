import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSliderSection } from '@/components/home-page/slider';
import type { GameCardI } from '@/utils/type';

function makeGame(slug: string): GameCardI {
  return {
    cardImage: '/img.png',
    category: 'Puzzle',
    likesCount: 1200,
    name: slug,
    price: 'Free',
    rating: 4.7,
    shortDescription: 'desc',
    slug,
  };
}

describe('createSliderSection', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a card per game with navigation buttons', () => {
    vi.useFakeTimers();
    const slider = createSliderSection([makeGame('a'), makeGame('b'), makeGame('c')]);

    expect(slider.classList.contains('section__slider')).toBe(true);
    expect(slider.querySelectorAll('.game-card')).toHaveLength(3);
    expect(slider.querySelector('.slider__button-item--prev')).not.toBeNull();
    expect(slider.querySelector('.slider__button-item--next')).not.toBeNull();

    vi.advanceTimersByTime(20);
    expect(slider.classList.contains('slider--ready')).toBe(true);
  });

  it('advances and rewinds when the nav buttons are clicked', () => {
    vi.useFakeTimers();
    const slider = createSliderSection([makeGame('a'), makeGame('b')]);

    slider.querySelector<HTMLButtonElement>('.slider__button-item--next')?.click();
    vi.advanceTimersByTime(50);
    slider.querySelector<HTMLButtonElement>('.slider__button-item--prev')?.click();
    vi.advanceTimersByTime(50);

    expect(slider.querySelectorAll('.game-card')).toHaveLength(2);
  });

  it('handles a pointer drag gesture', () => {
    vi.useFakeTimers();
    const slider = createSliderSection([makeGame('a'), makeGame('b')]);
    const inner = slider.querySelector<HTMLElement>('.slider__inner');

    inner?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 200 }));
    expect(slider.classList.contains('slider--dragging')).toBe(true);

    document.dispatchEvent(new MouseEvent('pointermove', { clientX: 150 }));
    document.dispatchEvent(new MouseEvent('pointerup', { clientX: 150 }));
    vi.advanceTimersByTime(50);

    expect(slider.classList.contains('slider--dragging')).toBe(false);
  });

  it('ignores non-primary pointer presses and stray pointer moves', () => {
    vi.useFakeTimers();
    const slider = createSliderSection([makeGame('a')]);
    const inner = slider.querySelector<HTMLElement>('.slider__inner');

    inner?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 2, clientX: 10 }));
    expect(slider.classList.contains('slider--dragging')).toBe(false);

    document.dispatchEvent(new MouseEvent('pointermove', { clientX: 40 }));
    document.dispatchEvent(new MouseEvent('pointerup', { clientX: 40 }));
  });

  it('swallows a details click that follows a drag', () => {
    vi.useFakeTimers();
    const slider = createSliderSection([makeGame('a'), makeGame('b')]);
    const inner = slider.querySelector<HTMLElement>('.slider__inner');

    inner?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 200 }));
    document.dispatchEvent(new MouseEvent('pointermove', { clientX: 100 }));
    document.dispatchEvent(new MouseEvent('pointerup', { clientX: 100 }));

    const trigger = slider.querySelector<HTMLElement>('[data-open-game-details]');
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    trigger?.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
  });

  it('recalculates on window resize', () => {
    vi.useFakeTimers();
    const slider = createSliderSection([makeGame('a')]);

    globalThis.dispatchEvent(new Event('resize'));

    expect(slider.querySelectorAll('.game-card')).toHaveLength(1);
  });
});
