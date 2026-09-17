import { createHomePage } from '@/pages/';

function renderApp(root: HTMLElement) {
  root.append(createHomePage());
}

export default renderApp;
