import { describe, expect, it } from 'vitest';
import { createNotFoundPage } from '@/pages/not-found/not-found-page';

describe('createNotFoundPage', () => {
  it('renders the 404 copy and echoes the current path', () => {
    globalThis.history.replaceState({}, '', '/missing-page');

    const page = createNotFoundPage();

    expect(page.classList.contains('not-found')).toBe(true);
    expect(page.querySelector('.not-found__code')?.textContent).toBe('404');
    expect(page.querySelector('.not-found__path')?.textContent).toBe('/missing-page');
  });
});
