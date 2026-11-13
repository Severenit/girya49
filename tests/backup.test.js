import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, readBackup, restoreBackup } from '../backup.js';

const workout = (day = 0) => ({
  version: 1,
  settings: { sound: true, mode: 'reps' },
  completions: { [day]: { status: 'complete', at: '2026-11-13T09:00:00Z', skipped: 0 } },
  active: null
});
const clone = value => structuredClone(value);
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD0cAAAAASUVORK5CYII=';

function memoryStore(initial = [], { failReplaceAt = [] } = {}) {
  let records = clone(initial);
  let replacements = 0;
  let reads = 0;
  return {
    async list() { reads++; return clone(records); },
    async replaceAll(next) {
      replacements++;
      if (failReplaceAt.includes(replacements)) throw new Error('Body storage failure');
      records = clone(next);
    },
    get records() { return clone(records); },
    get replacements() { return replacements; },
    get reads() { return reads; }
  };
}

test('full backup round-trips workout data with an intentionally empty body history', async () => {
  const original = workout();
  const backup = await createBackup(original, memoryStore());
  assert.equal(backup.version, 2);
  assert.ok(Number.isFinite(Date.parse(backup.createdAt)));
  assert.deepEqual(backup.workout, original);
  assert.deepEqual(backup.body, []);
  const parsed = await readBackup(JSON.parse(JSON.stringify(backup)), raw => ({ ...raw, normalized: true }));
  assert.equal(parsed.workout.normalized, true);
  assert.deepEqual(parsed.body, []);
  const store = memoryStore([{ id: 'old-record' }]);
  let installed = null;
  await restoreBackup(parsed, { store, writeWorkout: value => { installed = value; } });
  assert.deepEqual(store.records, []);
  assert.equal(installed.normalized, true);
  assert.equal(store.replacements, 1);
});

test('full backup round-trips dated measurements and the exact private photo bytes', async () => {
  const bytes = Buffer.from(PNG_BASE64, 'base64');
  const record = {
    date: '2026-11-13',
    measurements: { weight: 80.5, waist: 87 },
    note: 'Старт',
    photos: { front: new Blob([bytes], { type: 'image/png' }) }
  };
  const backup = await createBackup(workout(), memoryStore([record]));
  assert.equal(backup.body.length, 1);
  assert.equal(backup.body[0].photos.front.type, 'image/png');
  assert.equal(backup.body[0].photos.front.data, PNG_BASE64);
  const parsed = await readBackup(JSON.parse(JSON.stringify(backup)), raw => raw);
  assert.equal(parsed.body[0].date, record.date);
  assert.equal(parsed.body[0].measurements.weight, 80.5);
  assert.equal(parsed.body[0].measurements.waist, 87);
  assert.equal(parsed.body[0].note, record.note);
  assert.equal(parsed.body[0].photos.front.type, 'image/png');
  assert.deepEqual(Buffer.from(await parsed.body[0].photos.front.arrayBuffer()), bytes);
});

test('export failure never silently returns a backup missing inaccessible body history', async () => {
  await assert.rejects(createBackup(workout(), {
    async list() { throw new Error('Private history could not be read'); }
  }), /Private history could not be read/);
});

test('export snapshots workout state before asynchronous body reads can change the active workout', async () => {
  let finishRead;
  const original = workout();
  const pending = createBackup(original, { list: () => new Promise(resolve => { finishRead = resolve; }) });
  original.completions = {};
  original.settings.sound = false;
  finishRead([]);
  const backup = await pending;
  assert.equal(backup.workout.completions[0].status, 'complete');
  assert.equal(backup.workout.settings.sound, true);
});

test('legacy v1 restore changes only workout data and never reads or replaces body history', async () => {
  const original = workout();
  const parsed = await readBackup(original, raw => ({ ...raw, normalized: true }));
  assert.equal(parsed.body, null);
  const store = memoryStore([{ id: 'private-body-record' }]);
  let installed;
  await restoreBackup(parsed, { store, writeWorkout: value => { installed = value; } });
  assert.equal(installed.normalized, true);
  assert.equal(store.reads, 0);
  assert.equal(store.replacements, 0);
  assert.deepEqual(store.records, [{ id: 'private-body-record' }]);
});

test('malformed backup data is rejected before any existing history can be changed', async () => {
  const oldWorkout = workout(1);
  const store = memoryStore([{ id: 'current-body-record' }]);
  let current = oldWorkout;
  for (const data of [null, { version: 99 }, { version: 2, workout: workout(), body: 'invalid-body' }, {version:2,workout:{...workout(),completions:{0:{status:'corrupt'}}},body:[]}]) {
    await assert.rejects(async () => {
      const parsed = await readBackup(data, raw => raw);
      await restoreBackup(parsed, { store, writeWorkout: value => { current = value; } });
    });
    assert.deepEqual(current, oldWorkout);
    assert.deepEqual(store.records, [{ id: 'current-body-record' }]);
    assert.equal(store.replacements, 0);
  }
});

test('corrupt or remote photo data is validated before any restore mutation', async () => {
  const store = memoryStore([{ id: 'current-private-history' }]);
  let workoutWrites = 0;
  for (const photo of [
    { type: 'image/png', data: 'https://example.com/private-photo.png' },
    { type: 'image/png', data: `${PNG_BASE64}!` },
    { type: 'image/jpeg', data: PNG_BASE64 }
  ]) {
    const backup = {
      version: 2, workout: workout(),
      body: [{ date: '2026-11-13', measurements: { weight: 80.5 }, note: '', photos: { front: photo } }]
    };
    await assert.rejects(async () => {
      const parsed = await readBackup(backup, raw => raw);
      await restoreBackup(parsed, { store, writeWorkout: () => { workoutWrites++; } });
    });
    assert.equal(workoutWrites, 0);
    assert.equal(store.replacements, 0);
    assert.deepEqual(store.records, [{ id: 'current-private-history' }]);
  }
});

test('body persistence failure leaves workout and previous body data unchanged', async () => {
  const oldWorkout = workout(1);
  const previousBody = [{ id: 'previous' }];
  const store = memoryStore(previousBody, { failReplaceAt: [1] });
  let current = oldWorkout;
  let workoutWrites = 0;
  await assert.rejects(restoreBackup({ workout: workout(2), body: [{ id: 'new' }] }, {
    store,
    writeWorkout: value => { workoutWrites++; current = value; }
  }));
  assert.equal(workoutWrites, 0);
  assert.deepEqual(current, oldWorkout);
  assert.deepEqual(store.records, previousBody);
});

test('workout persistence failure rolls body data back to the complete previous snapshot', async () => {
  const previousBody = [{ id: 'previous-a' }, { id: 'previous-b' }];
  const store = memoryStore(previousBody);
  await assert.rejects(restoreBackup({ workout: workout(2), body: [{ id: 'new' }] }, {
    store,
    writeWorkout: () => { throw new Error('Workout storage full'); }
  }));
  assert.equal(store.replacements, 2);
  assert.deepEqual(store.records, previousBody);
});

test('rollback failure is reported as a partial restore rather than a successful import', async () => {
  const store = memoryStore([{ id: 'previous' }], { failReplaceAt: [2] });
  await assert.rejects(restoreBackup({ workout: workout(2), body: [{ id: 'new' }] }, {
    store,
    writeWorkout: () => { throw new Error('Workout storage full'); }
  }), /загружены.*восстановить не удалось|част|rollback|partial/i);
  assert.equal(store.replacements, 2);
  assert.deepEqual(store.records, [{ id: 'new' }]);
});
