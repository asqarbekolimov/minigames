import { createAppLayout } from '@/components/layout/app-layout';
import { createHomePage } from '@/pages';
import { createLibraryPage } from '@/pages/library/library-page';
import { createNotFoundPage } from '@/pages/not-found/not-found-page';

type RouteName = 'home' | 'library' | 'not-found';
type RouteView = () => HTMLElement;

const routes: Record<RouteName, RouteView> = {
  home: createHomePage,
  library: createLibraryPage,
  'not-found': createNotFoundPage,
};

const routePaths: Record<RouteName, string> = {
  home: '/',
  library: '/library',
  'not-found': '/404',
};

function isRouteName(value: string | undefined): value is RouteName {
  return value !== undefined && Object.hasOwn(routes, value);
}

function pathToRoute(pathname: string): RouteName {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/library') {
    return 'library';
  }

  if (normalized === '/' || normalized === '/home') {
    return 'home';
  }

  return 'not-found';
}

function renderApp(root: HTMLElement): void {
  const layout = createAppLayout();
  root.replaceChildren(layout.element);

  let currentRoute: RouteName | undefined;

  function render(route: RouteName): void {
    if (route === currentRoute) return;

    currentRoute = route;
    layout.content.replaceChildren(routes[route]());
    globalThis.dispatchEvent(new CustomEvent('route-change', { detail: { route } }));
  }

  function navigate(route: RouteName): void {
    if (route === currentRoute) return;

    const path = routePaths[route];
    globalThis.history.pushState({ route }, '', path);
    render(route);
  }

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest<HTMLAnchorElement>('[data-route]');
    if (!link) return;

    event.preventDefault();

    const route = link.dataset.route;
    if (isRouteName(route)) navigate(route);
  });

  globalThis.addEventListener('popstate', () => {
    render(pathToRoute(globalThis.location.pathname));
  });

  render(pathToRoute(globalThis.location.pathname));
}

export default renderApp;
