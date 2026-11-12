import renderApp from './router';
import '@/styles/main.scss';
import { initAuth } from '@/services/auth';
import { initPwa } from '@/services/pwa';

function createRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);
  return root;
}

const root = createRoot();
initPwa();
initAuth();
renderApp(root);
