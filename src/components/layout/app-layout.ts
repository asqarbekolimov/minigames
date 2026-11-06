import {
  APP_URL_CHANGE,
  readUrlState,
  updateUrlState,
  type AppUrlState,
  type AuthMode,
} from '@/app/url-state';
import { createHeader } from '@/components/header/header';
import { createFooter } from '@/components/footer/footer';
import { createAuthForm } from '@/components/auth/auth-form';
import { createGameDetails } from '@/components/game-details/game-details';
import { isSessionActive } from '@/services/auth';
import { play } from '@/utils/sounds';

export interface AppLayout {
  element: HTMLElement;
  content: HTMLElement;
}

interface OpenOptions {
  updateUrl?: boolean;
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
  let authMode: AuthMode = 'login';
  let suspendedGameDetails: HTMLElement | undefined;
  let gameDetailsModal: HTMLElement | undefined;
  let gameDetailsSlug: string | undefined;
  let isSyncingUrl = false;

  const resumeSuspendedGameDetails = () => {
    if (!suspendedGameDetails) return;
    suspendedGameDetails.hidden = false;
    suspendedGameDetails.dispatchEvent(new Event('game-details-resume'));
    suspendedGameDetails = undefined;
  };

  const closeLoginModal = (options: OpenOptions = {}) => {
    const modal = loginModal;
    if (!modal || modal.classList.contains('auth-page--closing')) return;

    if (modal.classList.contains('auth-page--pending')) return;

    if (options.updateUrl !== false) {
      updateUrlState({ auth: undefined }, 'replace');
    }

    if (shouldReduceMotion()) {
      modal.remove();
      loginModal = undefined;
      document.body.classList.remove('auth-modal-open');
      resumeSuspendedGameDetails();
      return;
    }

    const finishClose = () => {
      if (loginModal !== modal) return;
      clearTimeout(closeTimer);
      modal.removeEventListener('animationend', handleAnimationEnd);
      modal.remove();
      loginModal = undefined;
      document.body.classList.remove('auth-modal-open');
      resumeSuspendedGameDetails();
    };

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === modal) finishClose();
    };

    modal.classList.add('auth-page--closing');
    modal.addEventListener('animationend', handleAnimationEnd);
    const closeTimer = setTimeout(finishClose, 200);
  };

  const openAuthModal = (mode: AuthMode = 'login', options: OpenOptions = {}) => {
    if (isSessionActive()) {
      if (loginModal) closeLoginModal({ updateUrl: options.updateUrl });
      else if (options.updateUrl !== false) updateUrlState({ auth: undefined }, 'replace');

      return;
    }

    if (loginModal) {
      if (authMode !== mode) {
        authMode = mode;
        loginModal.dispatchEvent(new CustomEvent<AuthMode>('auth-mode-set', { detail: mode }));
      }
      return;
    }

    authMode = mode;
    loginModal = createAuthForm(mode);
    layout.append(loginModal);
    document.body.classList.add('auth-modal-open');
    loginModal.addEventListener('login-modal-close', () => closeLoginModal(), { once: true });
    loginModal.addEventListener('auth-mode-change', (event) => {
      const nextMode = (event as CustomEvent<AuthMode>).detail;
      authMode = nextMode;

      if (isSyncingUrl) return;
      if (readUrlState().auth !== nextMode) {
        updateUrlState({ auth: nextMode }, 'push');
      }
    });

    if (options.updateUrl !== false) {
      updateUrlState({ auth: mode }, 'push');
    }
  };

  const closeGameDetails = (options: OpenOptions = {}) => {
    const modal = gameDetailsModal;
    if (!modal || modal.classList.contains('game-details-page--closing')) return;

    if (options.updateUrl !== false) {
      updateUrlState({ game: undefined }, 'replace');
    }

    if (shouldReduceMotion()) {
      modal.remove();
      gameDetailsModal = undefined;
      gameDetailsSlug = undefined;
      if (suspendedGameDetails === modal) suspendedGameDetails = undefined;
      document.body.classList.remove('game-details-open');
      return;
    }

    const finishClose = () => {
      if (gameDetailsModal !== modal) return;
      clearTimeout(closeTimer);
      modal.removeEventListener('animationend', handleAnimationEnd);
      modal.remove();
      gameDetailsModal = undefined;
      gameDetailsSlug = undefined;
      if (suspendedGameDetails === modal) suspendedGameDetails = undefined;
      document.body.classList.remove('game-details-open');
    };

    const handleAnimationEnd = (event: AnimationEvent) => {
      if (event.target === modal) finishClose();
    };

    modal.classList.add('game-details-page--closing');
    modal.addEventListener('animationend', handleAnimationEnd);
    const closeTimer = setTimeout(finishClose, 200);
  };

  const openGameDetails = (gameSlug: string, options: OpenOptions = {}) => {
    if (!gameSlug) return;

    if (gameDetailsModal) {
      if (gameDetailsSlug === gameSlug) {
        if (!loginModal) {
          gameDetailsModal.hidden = false;
          suspendedGameDetails = undefined;
        }
        return;
      }

      gameDetailsModal.remove();
      if (suspendedGameDetails === gameDetailsModal) suspendedGameDetails = undefined;
      gameDetailsModal = undefined;
      gameDetailsSlug = undefined;
    }

    isSessionActive();
    gameDetailsModal = createGameDetails(gameSlug);
    gameDetailsSlug = gameSlug;
    layout.append(gameDetailsModal);
    document.body.classList.add('game-details-open');
    gameDetailsModal.addEventListener('game-details-close', () => closeGameDetails(), {
      once: true,
    });

    if (options.updateUrl !== false) {
      play('boot', { volume: 0.8 });
      updateUrlState({ game: gameSlug }, 'push');
    }
  };

  const syncFromUrl = (state: AppUrlState = readUrlState()) => {
    isSyncingUrl = true;

    try {
      if (state.game) {
        if (gameDetailsModal && gameDetailsSlug === state.game) {
          if (!loginModal) {
            gameDetailsModal.hidden = false;
            suspendedGameDetails = undefined;
          }
        } else {
          openGameDetails(state.game, { updateUrl: false });
        }
      } else if (gameDetailsModal) {
        closeGameDetails({ updateUrl: false });
      }

      if (state.auth) {
        if (isSessionActive()) {
          if (loginModal) closeLoginModal({ updateUrl: false });
          updateUrlState({ auth: undefined }, 'replace');
        } else if (loginModal) {
          if (authMode !== state.auth) {
            authMode = state.auth;
            loginModal.dispatchEvent(
              new CustomEvent<AuthMode>('auth-mode-set', { detail: state.auth }),
            );
          }
        } else {
          openAuthModal(state.auth, { updateUrl: false });
        }
      } else if (loginModal) {
        closeLoginModal({ updateUrl: false });
      }

      if (loginModal && gameDetailsModal && !gameDetailsModal.hidden) {
        gameDetailsModal.hidden = true;
        suspendedGameDetails = gameDetailsModal;
      }
    } finally {
      isSyncingUrl = false;
    }
  };

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;

    if (loginModal) {
      closeLoginModal();
      return;
    }

    if (gameDetailsModal) {
      play('hush', { volume: 0.7 });
      closeGameDetails();
    }
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;

    const trigger = event.target.closest<HTMLElement>('[data-open-game-details]');
    if (trigger) openGameDetails(trigger.dataset.gameSlug ?? '');
  });

  globalThis.addEventListener('open-auth-modal', (event) => {
    const mode = (event as CustomEvent<AuthMode>).detail;
    openAuthModal(mode ?? 'login');
  });

  globalThis.addEventListener('auth-required-for-action', () => {
    if (loginModal || isSessionActive()) return;

    if (gameDetailsModal) {
      gameDetailsModal.hidden = true;
      suspendedGameDetails = gameDetailsModal;
    }

    openAuthModal('login');
  });

  globalThis.addEventListener('popstate', () => syncFromUrl());
  globalThis.addEventListener(APP_URL_CHANGE, (event) => {
    syncFromUrl((event as CustomEvent<AppUrlState>).detail);
  });

  syncFromUrl();

  return { element: layout, content };
}
