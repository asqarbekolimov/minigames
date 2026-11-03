import { navigateToRoute, readUrlState, type AppRoute } from '@/app/url-state';
import { createAppLayout } from '@/components/layout/app-layout';
import { isSessionActive } from '@/services/auth';
import { createHomePage } from '@/pages';
import { createLibraryPage } from '@/pages/library/library-page';
import { createNotFoundPage } from '@/pages/not-found/not-found-page';

type RouteName = AppRoute;
type RouteView = () => HTMLElement;

const routes: Record<RouteName, RouteView> = {
  home: createHomePage,
  library: createLibraryPage,
  'not-found': createNotFoundPage,
};

function isRouteName(value: string | undefined): value is RouteName {
  return value !== undefined && Object.hasOwn(routes, value);
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
    isSessionActive();
    if (route === currentRoute) return;

    navigateToRoute(route);
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
    render(readUrlState().route);
  });

  render(readUrlState().route);
}

export default renderApp;
