import type { GameSort } from '@/utils/type';

export type AppRoute = 'home' | 'library' | 'not-found';
export type AuthMode = 'login' | 'register';

export interface AppUrlState {
  route: AppRoute;
  pathname: string;
  category: string;
  sort: GameSort;
  page: number;
  game?: string;
  auth?: AuthMode;
}

export const DEFAULT_CATEGORY = 'all';
export const DEFAULT_SORT: GameSort = 'rating-desc';
export const APP_URL_CHANGE = 'app-url-change';

const SORT_VALUES = new Set<string>(['rating-asc', 'rating-desc', 'name-asc', 'name-desc']);
const AUTH_MODES = new Set<string>(['login', 'register']);

const routePaths: Record<'home' | 'library', string> = {
  home: '/',
  library: '/library',
};

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

export function routeFromPath(pathname: string): AppRoute {
  const normalized = normalizePath(pathname);

  if (normalized === '/library') return 'library';
  if (normalized === '/' || normalized === '/home') return 'home';

  return 'not-found';
}

export function pathForRoute(route: AppRoute): string {
  return route === 'not-found' ? '/404' : routePaths[route];
}

export function readUrlState(url: URL = new URL(globalThis.location.href)): AppUrlState {
  const pathname = normalizePath(url.pathname);
  const parameters = url.searchParams;
  const rawSort = parameters.get('sort');
  const rawPage = Number(parameters.get('page') ?? '');
  const rawAuth = parameters.get('auth');

  return {
    route: routeFromPath(pathname),
    pathname,
    category: parameters.get('category')?.trim() || DEFAULT_CATEGORY,
    sort: rawSort && SORT_VALUES.has(rawSort) ? (rawSort as GameSort) : DEFAULT_SORT,
    page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1,
    game: parameters.get('game')?.trim() || undefined,
    auth: rawAuth && AUTH_MODES.has(rawAuth) ? (rawAuth as AuthMode) : undefined,
  };
}

export function buildUrl(state: AppUrlState): string {
  const pathname = state.route === 'not-found' ? state.pathname : pathForRoute(state.route);
  const parameters = new URLSearchParams();

  if (state.route === 'library') {
    if (state.category !== DEFAULT_CATEGORY) parameters.set('category', state.category);
    if (state.sort !== DEFAULT_SORT) parameters.set('sort', state.sort);
    if (state.page > 1) parameters.set('page', String(state.page));
  }

  if (state.game) parameters.set('game', state.game);
  if (state.auth) parameters.set('auth', state.auth);

  const query = parameters.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function notifyUrlChange(): AppUrlState {
  const state = readUrlState();
  globalThis.dispatchEvent(new CustomEvent<AppUrlState>(APP_URL_CHANGE, { detail: state }));

  return state;
}

export function updateUrlState(
  patch: Partial<AppUrlState>,
  mode: 'push' | 'replace' = 'push',
): AppUrlState {
  const current = readUrlState();
  const next: AppUrlState = { ...current, ...patch };
  const url = buildUrl(next);
  const currentUrl = `${globalThis.location.pathname}${globalThis.location.search}`;

  if (url === currentUrl) return current;

  if (mode === 'replace') globalThis.history.replaceState(globalThis.history.state, '', url);
  else globalThis.history.pushState({}, '', url);

  return notifyUrlChange();
}

export function navigateToRoute(route: AppRoute): void {
  globalThis.history.pushState({}, '', pathForRoute(route));
  notifyUrlChange();
}
