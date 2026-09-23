import { createAppLayout } from '@/components/layout/app-layout';

function renderApp(root: HTMLElement) {
  root.replaceChildren(createAppLayout());
}

export default renderApp;
