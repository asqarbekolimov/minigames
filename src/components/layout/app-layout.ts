import { createHeader } from '@/components/header/header';
import { createFooter } from '@/components/footer/footer';
import { createAuthForm } from '@/components/auth/auth-form';
import { createGameDetails } from '@/components/game-details/game-details';

export interface AppLayout {
  element: HTMLElement;
  content: HTMLElement;
}

function shouldReduceMotion(): boolean {
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createAppLayout(): AppLayout {
  const layout = document.createElement('div');
  layout.classList.add('wrapper');

  const content = document.createElement('div');
  content.classList.add('layout__content');

  layout.append(createHeader(), content, createFooter());

  let loginModal: HTMLElement | undefined;

  const closeLoginModal = () => {
    const modal = loginModal;
    if (!modal || modal.classList.contains('auth-page--closing')) return;

    if (modal.classList.contains('auth-page--pending')) return;

    if (shouldReduceMotion()) {
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

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    if (loginModal) return;
    loginModal = createAuthForm(mode);
    layout.append(loginModal);
    document.body.classList.add('auth-modal-open');
    loginModal.addEventListener('login-modal-close', closeLoginModal, { once: true });
  };

  let gameDetailsModal: HTMLElement | undefined;

  const closeGameDetails = () => {
    const modal = gameDetailsModal;
    if (!modal || modal.classList.contains('game-details-page--closing')) return;

    if (shouldReduceMotion()) {
      modal.remove();
      gameDetailsModal = undefined;
      document.body.classList.remove('game-details-open');
      return;
    }

    const finishClose = () => {
      if (gameDetailsModal !== modal) return;
      clearTimeout(closeTimer);
      modal.removeEventListener('animationend', handleAnimationEnd);
      modal.remove();
      gameDetailsModal = undefined;
      document.body.classList.remove('game-details-open');
    };

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === modal) finishClose();
    };

    modal.classList.add('game-details-page--closing');
    modal.addEventListener('animationend', handleAnimationEnd);
    const closeTimer = setTimeout(finishClose, 200);
  };

  const openGameDetails = () => {
    if (gameDetailsModal) return;
    gameDetailsModal = createGameDetails();
    layout.append(gameDetailsModal);
    document.body.classList.add('game-details-open');
    gameDetailsModal.addEventListener('game-details-close', closeGameDetails, { once: true });
  };

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;

    if (loginModal) closeLoginModal();
    if (gameDetailsModal) closeGameDetails();
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    if (event.target.closest('[data-open-game-details]')) openGameDetails();
  });

  globalThis.addEventListener('open-auth-modal', (event) => {
    const mode = (event as CustomEvent<'login' | 'register'>).detail;
    openAuthModal(mode);
  });

  return { element: layout, content };
}
