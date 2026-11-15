/* Increment VERSION when releasing changed application files. */
const VERSION = 'girya49-v10';
const APP_FILES = [
  './', './index.html', './app.js', './styles.css', './program.js', './schedule.js', './day-purpose.js', './demos.js',
  './body-progress.js', './body-progress.css', './body-store.js', './backup.js',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png',
  './icons/icon-512.png', './icons/maskable-512.png',
  './photos/squat.jpg', './photos/row.jpg', './photos/pushup.jpg', './photos/rdl.jpg',
  './photos/carry.jpg', './photos/deadlift.jpg', './photos/lunge.jpg', './photos/floorpress.jpg',
  './photos/bridge.jpg', './photos/deadbug.jpg', './photos/swing.jpg', './photos/walk.jpg', './photos/mobility.jpg',
  './photos/march.jpg', './photos/stepjacks.jpg', './photos/lateralstep.jpg', './photos/shadowboxing.jpg',
  './photos/heelraise.jpg', './photos/sideplank.jpg', './photos/catcow.jpg', './photos/thoracicopen.jpg',
  './photos/hipflexor.jpg', './photos/birddog.jpg', './photos/hiphingebw.jpg', './photos/anklemobility.jpg', './photos/kneepushup.jpg'
];
const appURL = path => new URL(path, self.registration.scope).href;
const assetURLs = new Set(APP_FILES.map(appURL));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(APP_FILES.map(appURL))));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('girya49-') && name !== VERSION).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  // This static application has one page. Do not capture unrelated server routes.
  const isAppPage = url.pathname === scope.pathname || url.pathname === new URL('index.html', scope).pathname;
  if (request.mode === 'navigate' && isAppPage) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type !== 'opaqueredirect') {
          const cache = await caches.open(VERSION);
          await cache.put(appURL('./index.html'), response.clone());
        }
        return response;
      } catch {
        return (await caches.match(appURL('./index.html'))) || Response.error();
      }
    })());
    return;
  }

  if (!assetURLs.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(request);
    // Local development must show edited scripts without reinstalling the worker.
    // Production remains cache-first so the complete offline version stays coherent.
    if (['localhost', '127.0.0.1'].includes(scope.hostname)) {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return cached || Response.error();
      }
    }
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
