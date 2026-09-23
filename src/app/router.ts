import { createAppLayout } from '@/components/layout/app-layout';
import { createHomePage } from '@/pages';
import { createLibraryPage } from '@/pages/library/library-page';

type RouteView = () => HTMLElement;

const routes: Record<string, RouteView> = {
  home: createHomePage,
  library: () => createLibraryPage(),
};

const defaultRoute = 'home';

function renderApp(root: HTMLElement): void {
  const layout = createAppLayout();
  root.replaceChildren(layout.element);

  let currentRoute = '';

  const render = (route: string): void => {
    const resolved = Object.hasOwn(routes, route) ? route : defaultRoute;
    if (resolved === currentRoute) return;

    currentRoute = resolved;
    layout.content.replaceChildren(routes[resolved]());
    globalThis.dispatchEvent(new CustomEvent('route-change', { detail: { route: resolved } }));
  };

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const link = event.target.closest<HTMLAnchorElement>('[data-route]');
    const route = link?.dataset.route;
    if (!route) return;

    event.preventDefault();
    render(route);
  });

  render(defaultRoute);
}

export default renderApp;
