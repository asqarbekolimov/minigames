import { createAppLayout } from '@/components/layout/app-layout';
import { createHomePage } from '@/pages/';
import { createAuthForm } from '@/components/auth/auth-form';

function renderApp(root: HTMLElement) {
  const layout = createAppLayout(createHomePage());
  let loginModal: HTMLElement | undefined;

  const closeLoginModal = () => {
    const modal = loginModal;
    if (!modal || modal.classList.contains('auth-page--closing')) return;

    if (globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      modal.remove();
      loginModal = undefined;
      document.body.classList.remove('auth-modal-open');
      return;
    }

    const finishClose = () => {
      if (loginModal !== modal) return;
      clearTimeout(closeTimer);
      modal.removeEventListener('animationend', handleAnimationEnd);
      modal.remove();
      loginModal = undefined;
      document.body.classList.remove('auth-modal-open');
    };

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === modal) finishClose();
    };

    modal.classList.add('auth-page--closing');
    modal.addEventListener('animationend', handleAnimationEnd);
    const closeTimer = setTimeout(finishClose, 200);
  };

  document.addEventListener('keydown', (event) => {
    if (loginModal && (event.key === 'Escape' || event.key === 'Esc')) closeLoginModal();
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
