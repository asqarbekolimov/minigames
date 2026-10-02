import { createAsyncContent, createSkeleton } from '@/components/common/async-content';
import { createHeroSection } from '@/components/home-page/hero';
import './home-page.scss';
import { createSliderSection } from '@/components/home-page/slider';
import { createTopPlayers } from '@/components/home-page/top-player';
import { createCtaSection } from '@/components/home-page/cta';
import { getGames } from '@/services/api';
import type { GameCardI } from '@/utils/type';

export function createHomePage(): HTMLElement {
  const homePage = document.createElement('main');

  homePage.append(
    createHeroSection(),
    createFeaturedSlider(),
    createTopPlayers(),
    createCtaSection(),
  );

  return homePage;
}

async function loadFeaturedGames(): Promise<GameCardI[]> {
  const response = await getGames({ featured: true });

  return response.data;
}

function renderSlider(games: GameCardI[]): HTMLElement {
  return createSliderSection(games);
}

function renderSliderSkeleton(): Node {
  return createSkeleton({ variant: 'slider', count: 5 });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Failed to load games.';
}

function createFeaturedSlider(): HTMLElement {
  const slider = createAsyncContent<GameCardI[]>({
    load: loadFeaturedGames,
    render: renderSlider,
    renderSkeleton: renderSliderSkeleton,
    errorMessage: getErrorMessage,
    retryLabel: 'Try again',
    empty: { title: 'No games yet', message: 'New games will appear here soon.' },
  });

  slider.reload();

  return slider.element;
}
