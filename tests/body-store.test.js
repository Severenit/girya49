import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANGLES, MEASUREMENT_FIELDS, MAX_PHOTO_BYTES, MAX_BACKUP_BYTES,
  createBodyStore, normalizeBodyRecord, serializeBodyRecords, deserializeBodyRecords,
} from '../body-store.js';

// Small transactional IndexedDB test double: writes commit together, aborted writes vanish.
// This exercises the public store contract without a browser or runtime dependency.
function indexedDBHarness() {
  let records = new Map();
  let opens = 0;
  let rejectDate = null;
  const factory = {
    open(name, version) {
      assert.equal(name, 'girya49-body-v1');
      assert.equal(version, 1);
      opens += 1;
      const request = {};
      const database = {
        objectStoreNames: { contains: () => true },
        close() {},
        transaction(storeName, mode) {
          assert.equal(storeName, 'records');
          const pending = new Map(records);
          let aborted = false;
          const tx = {
            error: null,
            abort() {
              if (aborted) return;
              aborted = true;
              queueMicrotask(() => tx.onabort?.());
            },
            objectStore() {
              function operation(action) {
                const result = {};
                queueMicrotask(() => {
                  if (aborted) return;
                  try { result.result = action(); result.onsuccess?.(); }
                  catch (error) { tx.error = error; tx.onerror?.(); tx.abort(); }
                });
                return result;
              }
              return {
                getAll: () => operation(() => [...pending.values()].map(value => structuredClone(value))),
                get: date => operation(() => structuredClone(pending.get(date))),
                put: value => operation(() => {
                  if (value.date === rejectDate) throw new DOMException('Test storage quota failure', 'QuotaExceededError');
                  pending.set(value.date, structuredClone(value));
                  return value.date;
                }),
                delete: date => operation(() => { pending.delete(date); }),
                clear: () => operation(() => { pending.clear(); }),
              };
            },
          };
          setTimeout(() => {
            if (aborted) return;
            if (mode === 'readwrite') records = pending;
            tx.oncomplete?.();
          }, 0);
          return tx;
        },
      };
      queueMicrotask(() => { request.result = database; request.onsuccess?.(); });
      return request;
    },
  };
  return { factory, get opens() { return opens; }, failOn(date) { rejectDate = date; } };
}

const jpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 1, 0xff, 0xd9])], { type: 'image/jpeg' });
const png = () => new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])], { type: 'image/png' });
const entry = (date = '2026-11-13', measurements = { weight: 80.5, waist: 87 }) => ({ date, measurements, note: '', photos: {} });

test('field metadata and angles expose the agreed UI contract', () => {
  assert.deepEqual(MEASUREMENT_FIELDS.map(field => field.key), ['weight', 'waist', 'belly', 'chest', 'hips', 'arm']);
  assert.deepEqual(ANGLES.map(angle => angle.key), ['front', 'side', 'back']);
  assert.ok(MEASUREMENT_FIELDS.every(field => field.step === 0.1 && field.min < field.max));
});

test('normalization validates calendar dates, numbers, keys and notes without discarding invalid input', () => {
  assert.deepEqual(normalizeBodyRecord({ date: '2028-02-29', measurements: { waist: 88.5, weight: '' } }), {
    date: '2028-02-29', measurements: { waist: 88.5 }, note: '', photos: {},
  });
  assert.equal(normalizeBodyRecord({ date: '2026-11-13', note: '  Отличное самочувствие  ' }).note, 'Отличное самочувствие');
  for (const record of [
    entry('2026-02-29'), entry('1899-12-31'), entry('2101-01-01'), entry('2026-13-01'), entry('2026-11-31'),
    entry('2026-11-13', { weight: NaN }), entry('2026-11-13', { weight: Infinity }),
    entry('2026-11-13', { waist: '88,5' }), entry('2026-11-13', { arm: -2 }),
    entry('2026-11-13', { unknown: 10 }), { ...entry(), extra: 1 },
    { ...entry(), note: 'x'.repeat(1001) }, { date: '2026-11-13' },
  ]) assert.throws(() => normalizeBodyRecord(record), { name: 'BodyValidationError' });
});

test('photos permit only the three local raster types and enforce the size limit', () => {
  assert.equal(normalizeBodyRecord({ ...entry(), photos: { front: jpeg() } }).photos.front.type, 'image/jpeg');
  for (const photo of [
    new Blob(['<svg/>'], { type: 'image/svg+xml' }), new Blob(['text'], { type: 'text/plain' }),
    new Blob([], { type: 'image/jpeg' }), new Blob([new Uint8Array(MAX_PHOTO_BYTES + 1)], { type: 'image/jpeg' }),
    { type: 'image/jpeg', size: 8 },
  ]) assert.throws(() => normalizeBodyRecord({ ...entry(), photos: { front: photo } }));
  assert.throws(() => normalizeBodyRecord({ ...entry(), photos: { unknown: jpeg() } }));
});

test('serialization round-trip preserves measurements, Unicode note and Blob bytes', async () => {
  const records = [{ ...entry(), note: 'Старт — всё хорошо 🟢', photos: { front: jpeg(), side: png() } }];
  const encoded = await serializeBodyRecords(records);
  assert.equal(typeof encoded[0].photos.front.data, 'string');
  assert.deepEqual(Object.keys(encoded[0].photos.front), ['type', 'data']);
  const decoded = await deserializeBodyRecords(JSON.stringify(encoded));
  assert.deepEqual(decoded[0].measurements, records[0].measurements);
  assert.equal(decoded[0].note, records[0].note);
  assert.ok(decoded[0].photos.front instanceof Blob);
  assert.deepEqual(await decoded[0].photos.front.arrayBuffer(), await records[0].photos.front.arrayBuffer());
  assert.equal(decoded[0].photos.side.type, 'image/png');
});

test('corrupt backups, disguised SVG, duplicate dates and excessive input are rejected', async () => {
  const valid = (await serializeBodyRecords([{ ...entry(), photos: { front: jpeg() } }]))[0];
  const badPhoto = photo => [{ ...valid, photos: { front: photo } }];
  for (const data of [
    '{bad-json', {}, Array(501).fill(entry()), [valid, valid],
    badPhoto({ type: 'image/jpeg', data: '%%%=' }),
    badPhoto({ type: 'image/jpeg', data: '/x==' }),
    badPhoto({ type: 'image/jpeg', data: btoa('<svg xmlns="http://www.w3.org/2000/svg"/>') }),
    badPhoto({ type: 'image/svg+xml', data: btoa('<svg/>') }),
    badPhoto({ type: 'image/jpeg', data: '' }),
    badPhoto({ type: 'image/jpeg', data: 'data:image/jpeg;base64,/9j/4AAB/9k=' }),
    badPhoto({ type: 'image/jpeg', data: valid.photos.front.data, url: 'https://example.com/photo.jpg' }),
    ' '.repeat(MAX_BACKUP_BYTES + 1),
  ]) await assert.rejects(deserializeBodyRecords(data), { name: 'BodyValidationError' });
});

test('store is lazy, sorts dates, upserts one record per day and retains Blob photos', async () => {
  const db = indexedDBHarness();
  const store = createBodyStore(db.factory);
  assert.equal(db.opens, 0);
  await store.put(entry('2026-12-31'));
  await store.put({ ...entry(), photos: { front: jpeg() } });
  assert.deepEqual((await store.list()).map(record => record.date), ['2026-11-13', '2026-12-31']);
  assert.ok((await store.get('2026-11-13')).photos.front instanceof Blob);
  await store.put(entry('2026-11-13', { waist: 85 }));
  assert.equal((await store.list()).length, 2);
  assert.deepEqual((await store.get('2026-11-13')).measurements, { waist: 85 });
  await store.remove('2026-11-13');
  assert.equal(await store.get('2026-11-13'), undefined);
  assert.equal(db.opens, 1);
  await store.clear();
  assert.deepEqual(await store.list(), []);
});

test('invalid imports preserve the current records; transaction failure rolls back the whole replacement', async () => {
  const db = indexedDBHarness();
  const store = createBodyStore(db.factory);
  const original = { ...entry(), photos: { front: jpeg() } };
  await store.put(original);
  const backup = await serializeBodyRecords(await store.list());
  await assert.rejects(async () => {
    const decoded = await deserializeBodyRecords([backup[0], { ...entry('2026-11-14'), measurements: { weight: -1 } }]);
    await store.replaceAll(decoded);
  });
  assert.deepEqual(await serializeBodyRecords(await store.list()), backup);
  await assert.rejects(store.replaceAll([entry('2026-11-15'), entry('2026-11-16', { waist: NaN })]));
  assert.deepEqual(await serializeBodyRecords(await store.list()), backup);
  db.failOn('2026-11-16');
  await assert.rejects(store.replaceAll([entry('2026-11-15'), entry('2026-11-16')]), /Недостаточно места/);
  assert.deepEqual(await serializeBodyRecords(await store.list()), backup);
  db.failOn(null);
  await store.replaceAll([entry('2026-12-31', { waist: 82 })]);
  assert.deepEqual((await store.list()).map(record => record.date), ['2026-12-31']);
});

test('unavailable, denied and blocked storage return visible errors without an in-memory fallback', async () => {
  await assert.rejects(createBodyStore(null).list(), { name: 'BodyStorageError' });
  const denied = createBodyStore({ open() { throw new DOMException('Denied', 'SecurityError'); } });
  await assert.rejects(denied.put(entry()), /Хранилище фото недоступно/);
  await assert.rejects(denied.list(), /Хранилище фото недоступно/);
  const blocked = createBodyStore({ open() {
    const request = {};
    queueMicrotask(() => request.onblocked?.());
    return request;
  } });
  await assert.rejects(blocked.list(), /заблокировано другой вкладкой/);
});

test('default store defers even a throwing IndexedDB property lookup until use', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  let lookups = 0;
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, get() {
    lookups += 1;
    throw new DOMException('Restricted context', 'SecurityError');
  } });
  try {
    const module = await import('../body-store.js?lazy-default-store-test');
    assert.equal(lookups, 0);
    await assert.rejects(module.bodyStore.list(), { name: 'BodyStorageError' });
    assert.equal(lookups, 1);
  } finally {
    if (original) Object.defineProperty(globalThis, 'indexedDB', original);
    else delete globalThis.indexedDB;
  }
});
