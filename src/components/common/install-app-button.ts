import './install-app-button.scss';
import {
  canInstallApp,
  PWA_INSTALL_STATE_CHANGE,
  PWA_INSTALLED,
  promptInstallApp,
} from '@/services/pwa';

const installIcon = `<svg class="install-app-button__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3V15M12 15L7 10M12 15L17 10M5 21H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function createInstallAppButton(
  variant: 'desktop' | 'mobile' = 'desktop',
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.classList.add('install-app-button');

  if (variant === 'mobile') button.classList.add('install-app-button--mobile');

  button.innerHTML = `${installIcon}<span class="install-app-button__label">Install app</span>`;
  button.hidden = true;

  const syncVisibility = (): void => {
    button.hidden = !canInstallApp();
  };

  button.addEventListener('click', () => {
    void promptInstallApp();
  });

  globalThis.addEventListener(PWA_INSTALL_STATE_CHANGE, syncVisibility);
  globalThis.addEventListener(PWA_INSTALLED, syncVisibility);
  syncVisibility();

  return button;
}
