export const PWA_INSTALL_STATE_CHANGE = 'pwa-install-state-change';
export const PWA_INSTALLED = 'pwa-installed';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const installState: { prompt?: InstallPromptEvent; installed: boolean } = {
  installed: false,
};

function isStandaloneDisplay(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const matchesStandalone = globalThis.matchMedia
    ? globalThis.matchMedia('(display-mode: standalone)').matches
    : false;

  return matchesStandalone || navigatorWithStandalone.standalone === true;
}

function notifyInstallState(): void {
  globalThis.dispatchEvent(new CustomEvent(PWA_INSTALL_STATE_CHANGE));
}

export function canInstallApp(): boolean {
  return installState.prompt !== undefined && !installState.installed && !isStandaloneDisplay();
}

export async function promptInstallApp(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const installPrompt = installState.prompt;

  if (!installPrompt) return 'unavailable';

  await installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;

  installState.prompt = undefined;

  if (outcome === 'accepted') {
    installState.installed = true;
    globalThis.dispatchEvent(new CustomEvent(PWA_INSTALLED));
  }

  notifyInstallState();

  return outcome;
}

async function registerServiceWorker(): Promise<void> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;

      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  } catch (error) {
    console.warn('Service worker registration failed.', error);
  }
}

export function initPwa(): void {
  installState.installed = isStandaloneDisplay();

  globalThis.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installState.prompt = event as InstallPromptEvent;
    notifyInstallState();
  });

  globalThis.addEventListener('appinstalled', () => {
    installState.installed = true;
    installState.prompt = undefined;
    notifyInstallState();
    globalThis.dispatchEvent(new CustomEvent(PWA_INSTALLED));
  });

  void registerServiceWorker();
}
