import { createAsyncContent, createSkeleton } from '@/components/common/async-content';
import { createHeroSection } from '@/components/home-page/hero';
import './home-page.scss';
import { createSliderSection } from '@/components/home-page/slider';
import { createTopPlayers } from '@/components/home-page/top-player';
import { createCtaSection } from '@/components/home-page/cta';
import { getGames, getLeaderboard } from '@/services/api';
import type { GameCardI, LeaderboardPlayerI } from '@/utils/type';

export function createHomePage(): HTMLElement {
  const homePage = document.createElement('main');

  homePage.append(
    createHeroSection(),
    createFeaturedSlider(),
    createLeaderboard(),
    createCtaSection(),
  );

  return homePage;
}

async function loadFeaturedGames(): Promise<GameCardI[]> {
  const response = await getGames({ featured: true });

  return response.data;
}

async function loadTopPlayers(): Promise<LeaderboardPlayerI[]> {
  const response = await getLeaderboard();

  return response.data;
}

function renderSlider(games: GameCardI[]): HTMLElement {
  return createSliderSection(games);
}

function renderTopPlayers(players: LeaderboardPlayerI[]): HTMLElement {
  return createTopPlayers(players);
}

function renderSliderSkeleton(): Node {
  return createSkeleton({ variant: 'slider', count: 5 });
}

function renderTableSkeleton(): Node {
  return createSkeleton({ variant: 'table', count: 5 });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
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

function createLeaderboard(): HTMLElement {
  const leaderboard = createAsyncContent<LeaderboardPlayerI[]>({
    load: loadTopPlayers,
    render: renderTopPlayers,
    renderSkeleton: renderTableSkeleton,
    errorMessage: getErrorMessage,
    retryLabel: 'Try again',
    empty: { title: 'No players yet', message: 'Play a game to appear on the leaderboard.' },
  });

  leaderboard.reload();

  return leaderboard.element;
}
