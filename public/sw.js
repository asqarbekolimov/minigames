const CACHE_VERSION = 'minigames-v2';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const API_CACHE = `${CACHE_VERSION}-api`;
const APP_SHELL_URL = '/index.html';
const OFFLINE_URL = '/offline.html';
const API_ORIGIN = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com';

const PRECACHE_URLS = [
  '/',
  APP_SHELL_URL,
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/icons/apple-touch-icon.png',
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      await Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' }))),
      );

      await globalThis.skipWaiting();
    })(),
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
          .map((cacheName) => caches.delete(cacheName)),
      );

      await globalThis.clients.claim();
    })(),
  );
});

globalThis.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void globalThis.skipWaiting();
});

globalThis.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin === globalThis.location.origin) {
    event.respondWith(handleAsset(request));
    return;
  }

  if (url.origin === API_ORIGIN) {
    event.respondWith(handleApi(request));
  }
});

async function handleNavigation(request) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(request, response.clone());
      return response;
    }

    const cachedResponse = await caches.match(request);

    if (cachedResponse) return cachedResponse;

    const shellResponse = await caches.match(APP_SHELL_URL);

    if (shellResponse) return shellResponse;

    return response;
  } catch {
    const cached = await caches.match(request);

    if (cached) return cached;

    const shell = await caches.match(APP_SHELL_URL);

    if (shell) return shell;

    return (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
}

async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    void fetch(request)
      .then((response) => {
        if (response.ok) return cache.put(request, response.clone());
      })
      .catch(() => {});

    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) await cache.put(request, response.clone());

    return response;
  } catch {
    const shellAsset = await caches.match(request);

    if (shellAsset) return shellAsset;

    return (await caches.match(OFFLINE_URL)) ?? Response.error();
  }
}

async function handleApi(request) {
  const cache = await caches.open(API_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) await cache.put(request, response.clone());

    return response;
  } catch {
    const cached = await cache.match(request);

    if (cached) return cached;

    return new Response(
      JSON.stringify({ message: 'You are offline and this data is not cached yet.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
