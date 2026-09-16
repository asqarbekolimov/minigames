import renderApp from './router';
import '@/styles/main.scss';

function createRoot(): HTMLElement {
  const root = document.createElement('div');
  root.id = 'app';
  document.body.append(root);
  return root;
}

const root = createRoot();
renderApp(root);
