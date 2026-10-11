import { describe, expect, it } from 'vitest';
import { createCtaSection } from '@/components/home-page/cta';

describe('createCtaSection', () => {
  it('renders the developer call to action', () => {
    const cta = createCtaSection();

    expect(cta.classList.contains('section__cta')).toBe(true);
    expect(cta.querySelector('.cta__title')?.textContent).toBe('Are You a Game Developer?');
    expect(cta.querySelector('.cta__button-text')?.textContent?.trim()).toBe('Submit Form');
  });
});
