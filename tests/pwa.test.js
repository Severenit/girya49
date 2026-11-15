import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';
import { getPlan } from '../program.js';

const dist = new URL('../', import.meta.url);

test('manifest is installable and uses paths that also work on a subpath', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', dist), 'utf8'));
  assert.equal(manifest.lang, 'ru');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.id, './');
  assert.equal(manifest.display, 'standalone');
  for (const size of ['192x192', '512x512']) assert.ok(manifest.icons.some(icon => icon.sizes === size && icon.type === 'image/png'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('./'));
    await access(new URL(icon.src, dist));
  }
});

test('every precached file exists and cache URLs are relative to the worker scope', async () => {
  const source = await readFile(new URL('sw.js', dist), 'utf8');
  const list = source.match(/const APP_FILES = \[([\s\S]*?)\];/);
  assert.ok(list, 'APP_FILES must remain inspectable');
  const paths = [...list[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.ok(paths.includes('./index.html'));
  assert.ok(paths.includes('./app.js'));
  assert.ok(paths.includes('./program.js'));
  assert.ok(paths.includes('./demos.js'));
  for (const module of ['./body-progress.js', './body-progress.css', './body-store.js', './backup.js', './schedule.js']) {
    assert.ok(paths.includes(module), `${module} must be available offline`);
  }
  for (const path of paths) {
    assert.ok(path.startsWith('./'));
    await access(new URL(path, dist));
    assert.ok(new URL(path, 'https://example.com/my-app/').pathname.startsWith('/my-app/'));
  }
  assert.match(source, /self\.registration\.scope/);
  assert.match(source, /request\.method !== 'GET'/);
  assert.match(source, /url\.origin !== scope\.origin/);
  assert.match(source, /SKIP_WAITING/);
});

test('icons have valid PNG signatures and exact declared dimensions', async () => {
  for (const [filename, expected] of [['icon-192.png', 192], ['icon-512.png', 512], ['maskable-512.png', 512]]) {
    const png = await readFile(new URL(`icons/${filename}`, dist));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), expected);
    assert.equal(png.readUInt32BE(20), expected);
  }
});

async function workerHarness({ offline = false, scope = 'https://example.com/girya/' } = {}) {
  const handlers = new Map();
  const stored = new Map();
  const deleted = [];
  let claimed = false;
  let skipped = false;
  let networkCalls = 0;
  const cache = {
    addAll: async urls => { for (const url of urls) stored.set(url, { body: `cached:${url}` }); },
    match: async request => stored.get(typeof request === 'string' ? request : request.url),
    put: async (request, response) => stored.set(typeof request === 'string' ? request : request.url, response)
  };
  const context = {
    URL,
    Response,
    self: {
      registration: { scope },
      addEventListener: (name, fn) => handlers.set(name, fn),
      clients: { claim: async () => { claimed = true; } },
      skipWaiting: () => { skipped = true; }
    },
    caches: {
      open: async () => cache,
      match: cache.match,
      keys: async () => ['girya49-v1', 'girya49-v2', 'another-app-v1'],
      delete: async name => { deleted.push(name); return true; }
    },
    fetch: async request => {
      networkCalls++;
      if (offline) throw new Error('Network unavailable');
      return new Response('network', { status: 200 });
    }
  };
  vm.runInNewContext(await readFile(new URL('sw.js', dist), 'utf8'), context);
  return {
    handlers, stored, deleted,
    get claimed() { return claimed; },
    get skipped() { return skipped; },
    get networkCalls() { return networkCalls; }
  };
}

test('every scheduled work exercise has a real photo available in the offline cache', async () => {
  const source=await readFile(new URL('app.js',dist),'utf8');
  const declaration=source.match(/const PHOTOS = Object\.freeze\((\{[\s\S]*?\})\);/);
  assert.ok(declaration,'the actual photo mapping must be inspectable');
  const photos=vm.runInNewContext(`(${declaration[1]})`);
  const ids=new Set();
  for(const settings of [{},{shortSessions:false,swings:true,floorpress:true},{dailyPractice:false,shortSessions:false},{kneePushups:true},{shortSessions:false,kneePushups:true}]) {
    for(let day=0;day<49;day++) {
      for(const step of getPlan(day,settings)) if(step.kind==='work') ids.add(step.exerciseId);
    }
  }
  const worker=await workerHarness({offline:true});
  let installed;
  worker.handlers.get('install')({waitUntil:promise=>{installed=promise;}});
  await installed;
  for(const id of ids) {
    assert.ok(Object.hasOwn(photos,id),`${id} needs a photo in the primary exercise view`);
    assert.match(photos[id],/^[a-z][a-z0-9-]*$/);
    const path=`photos/${photos[id]}.jpg`;
    const bytes=await readFile(new URL(path,dist));
    assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff',`${id} must use an actual JPEG asset`);
    assert.ok(bytes.length>1000,`${id} needs a usable photo rather than an empty placeholder`);
    assert.ok(worker.stored.has(`https://example.com/girya/${path}`),`${id} photo must also work offline`);
  }
});

test('worker installs under a subpath and removes only obsolete app caches', async () => {
  const worker = await workerHarness();
  let pending;
  worker.handlers.get('install')({ waitUntil: promise => { pending = promise; } });
  await pending;
  assert.ok(worker.stored.has('https://example.com/girya/app.js'));
  assert.ok(!worker.stored.has('https://example.com/app.js'));
  worker.handlers.get('activate')({ waitUntil: promise => { pending = promise; } });
  await pending;
  assert.deepEqual(worker.deleted, ['girya49-v1', 'girya49-v2']);
  assert.ok(worker.claimed);
  assert.equal(worker.skipped, false);
  worker.handlers.get('message')({ data: { type: 'SKIP_WAITING' } });
  assert.ok(worker.skipped);
});

test('offline navigation uses the shell while unrelated traffic remains untouched', async () => {
  const worker = await workerHarness({ offline: true });
  worker.stored.set('https://example.com/girya/index.html', { body: 'offline shell' });
  let response;
  worker.handlers.get('fetch')({
    request: { method: 'GET', url: 'https://example.com/girya/?day=3', mode: 'navigate' },
    respondWith: promise => { response = promise; }
  });
  assert.equal((await response).body, 'offline shell');
  for (const request of [
    { method: 'GET', url: 'https://example.net/girya/app.js', mode: 'cors' },
    { method: 'GET', url: 'https://example.com/another-app/', mode: 'navigate' },
    { method: 'POST', url: 'https://example.com/girya/', mode: 'cors' },
    { method: 'GET', url: 'https://example.com/girya/api/private', mode: 'cors' }
  ]) {
    let intercepted = false;
    worker.handlers.get('fetch')({ request, respondWith: () => { intercepted = true; } });
    assert.equal(intercepted, false);
  }
});

test('preloaded assets work without a network request', async () => {
  const worker = await workerHarness({ offline: true });
  worker.stored.set('https://example.com/girya/app.js', { body: 'cached script' });
  let response;
  worker.handlers.get('fetch')({
    request: { method: 'GET', url: 'https://example.com/girya/app.js', mode: 'cors' },
    respondWith: promise => { response = promise; }
  });
  assert.equal((await response).body, 'cached script');
  assert.equal(worker.networkCalls, 0);
});

test('private body photos and blobs are never intercepted or cached by the worker', async () => {
  const worker = await workerHarness();
  for (const url of [
    'blob:https://example.com/7bd81ccb-local-body-photo',
    'https://example.com/girya/body-photos/private-front.jpg',
    'https://example.com/girya/private-progress.json'
  ]) {
    let intercepted = false;
    worker.handlers.get('fetch')({
      request: { method: 'GET', url, mode: 'cors' },
      respondWith: () => { intercepted = true; }
    });
    assert.equal(intercepted, false);
  }
  assert.equal(worker.stored.size, 0);
  assert.equal(worker.networkCalls, 0);
});

test('localhost previews request fresh assets and fall back to cache when offline', async () => {
  for (const hostname of ['localhost', '127.0.0.1']) {
    const scope = `http://${hostname}:8080/girya/`;
    const request = { method: 'GET', url: `${scope}app.js`, mode: 'cors' };
    const online = await workerHarness({ scope });
    online.stored.set(request.url, { body: 'old script' });
    let response;
    online.handlers.get('fetch')({ request, respondWith: promise => { response = promise; } });
    assert.equal(await (await response).text(), 'network');
    assert.equal(online.networkCalls, 1);
    assert.equal(await online.stored.get(request.url).text(), 'network');
    const offline = await workerHarness({ scope, offline: true });
    offline.stored.set(request.url, { body: 'offline script' });
    offline.handlers.get('fetch')({ request, respondWith: promise => { response = promise; } });
    assert.equal((await response).body, 'offline script');
    assert.equal(offline.networkCalls, 1);
  }
});
