import { createAppLayout } from '@/components/layout/app-layout';
import { createHomePage } from '@/pages/';

function renderApp(root: HTMLElement) {
  root.append(createAppLayout(createHomePage()));
}

export default renderApp;
