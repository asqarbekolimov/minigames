import { createHomePage } from '@/pages/';

const routes: Record<string, () => HTMLElement> = {
  '/': createHomePage,
};

function render(root: HTMLElement): void {
  const createPage =
    routes[location.pathname] ??
    (() => {
      const notFound = document.createElement('div');
      notFound.textContent = '404 - Page Not Found';
      return notFound;
    });
  root.replaceChildren(createPage());
}

function renderApp(root: HTMLElement): void {
  render(root);
}

export default renderApp;
