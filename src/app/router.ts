import { createAppLayout } from '@/components/layout/app-layout';
import { createHomePage } from '@/pages';
import { createLibraryPage } from '@/pages/library/library-page';

type RouteName = 'home' | 'library';
type RouteView = () => HTMLElement;

const routes: Record<RouteName, RouteView> = {
  home: createHomePage,
  library: createLibraryPage,
};

const routePaths: Record<RouteName, string> = {
  home: '/',
  library: '/library',
};

function isRouteName(value: string | undefined): value is RouteName {
  return value === 'home' || value === 'library';
}

function pathToRoute(pathname: string): RouteName {
  if (pathname === '/library') {
    return 'library';
  }

  return 'home';
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
