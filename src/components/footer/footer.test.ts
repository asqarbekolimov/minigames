import { describe, expect, it } from 'vitest';
import { createFooter } from '@/components/footer/footer';

describe('createFooter', () => {
  it('renders navigation groups and route links', () => {
    const footer = createFooter();

    expect(footer.classList.contains('footer')).toBe(true);
    expect(footer.querySelectorAll('.footer__group')).toHaveLength(3);
    expect(footer.querySelector(':scope a[data-route="library"]')?.textContent).toBe('Library');
    expect(footer.querySelectorAll(':scope .footer__socials a')).toHaveLength(3);
  });
});
