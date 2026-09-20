import { createAppLayout } from '@/components/layout/app-layout';
import { createHomePage } from '@/pages/';
import { createAuthForm } from '@/components/auth/auth-form';

function renderApp(root: HTMLElement) {
  const layout = createAppLayout(createHomePage());
  let loginModal: HTMLElement | undefined;

  const closeLoginModal = () => {
    loginModal?.remove();
    loginModal = undefined;
    document.body.classList.remove('auth-modal-open');
  };

  document.addEventListener('keydown', (event) => {
    if (loginModal && event.key === 'Escape') closeLoginModal();
  });

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    if (loginModal) return;
    loginModal = createAuthForm(mode);
    layout.append(loginModal);
    document.body.classList.add('auth-modal-open');
    loginModal.addEventListener('login-modal-close', closeLoginModal, { once: true });
  };

  globalThis.addEventListener('open-auth-modal', (event) => {
    const mode = (event as CustomEvent<'login' | 'register'>).detail;
    openAuthModal(mode);
  });
  root.replaceChildren(layout);
}

export default renderApp;
