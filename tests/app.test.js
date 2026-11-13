import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { WEEKS, EXERCISES, getDay, getPlan } from '../program.js';
import { MAX_BACKUP_BYTES, createBackup, readBackup, restoreBackup } from '../backup.js';

const KEY = 'girya49-v1';
const jsonCopy = value => JSON.parse(JSON.stringify(value));
const work = (id = 'one') => ({ id, exerciseId: 'squat', title: 'Гоблет-присед', kind: 'work', set: 1, sets: 1, side: null, reps: 6, seconds: null });
const rest = () => ({ id: 'rest', exerciseId: 'squat', title: 'Отдых', kind: 'rest', side: null, reps: null, seconds: 90 });

function element(id = '') {
  const listeners = new Map();
  return {
    id, listeners, innerHTML: '', textContent: '', hidden: false, value: '', dataset: {},
    classList: { add() {}, remove() {} },
    addEventListener: (name, fn) => listeners.set(name, fn),
    append() {}, click() {}, showModal() {}, close() {},
    getBoundingClientRect: () => ({ left: 0, right: 100, top: 0, bottom: 100 })
  };
}

async function harness({ saved, now = Date.UTC(2026, 10, 13, 9), storageFails = false, bodyRecords = [] } = {}) {
  const nodes = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const store = new Map(saved ? [[KEY, JSON.stringify(saved)]] : []);
  let privateRecords = structuredClone(bodyRecords);
  let bodyWrites = 0;
  const bodyStoreForTest = {
    async list() { return structuredClone(privateRecords); },
    async replaceAll(records) { privateRecords = structuredClone(records); bodyWrites++; }
  };
  const getNode = selector => {
    if (!nodes.has(selector)) nodes.set(selector, element(selector.replace(/^#/, '')));
    return nodes.get(selector);
  };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const context = {
    WEEKS, EXERCISES, getDay, getPlan, dateIndex: () => 0,
    renderDemo: () => '<svg aria-label="Схема упражнения"></svg>', demoStyles: '',
    createBodyProgress: () => ({ mount() {}, unmount() {}, refresh() {} }),
    MAX_BACKUP_BYTES,
    createBackup: workout => createBackup(workout, bodyStoreForTest),
    readBackup,
    restoreBackup: (parsed, options) => restoreBackup(parsed, { ...options, store: bodyStoreForTest }),
    Date: ClockDate, Intl, URL, Blob, console,
    document: {
      querySelector: getNode,
      createElement: () => element(),
      head: { append() {} },
      visibilityState: 'visible',
      addEventListener: (name, fn) => documentListeners.set(name, fn)
    },
    window: {
      isSecureContext: false, scrollTo() {},
      addEventListener: (name, fn) => windowListeners.set(name, fn)
    },
    navigator: { onLine: true },
    localStorage: {
      getItem: key => store.get(key) ?? null,
      setItem: (key, value) => { if (storageFails) throw new Error('Storage unavailable'); store.set(key, value); }
    },
    location: { reload() {} },
    confirm: () => true,
    setInterval: () => 1,
    setTimeout: () => 1,
    clearTimeout() {}
  };
  let source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  source = source.replace(/^import .*?;\s*$/gm, '');
  source += `\n;globalThis.__test = {
    get state() { return state; }, get view() { return view; },
    start, current, timerFor, setTimerRunning, pauseTimer, tick, advance, normalize,
    install(steps, mode = 'reps') {
      state.active = {day:0, steps, position:0, timer:null, skipped:[], startedAt:Date.now()};
      state.settings.mode = mode; view = 'run'; persist(); render();
    }
  };`;
  vm.runInNewContext(source, context, { filename: 'app.js' });
  return {
    api: context.__test, store, nodes, documentListeners, windowListeners,
    get bodyRecords() { return structuredClone(privateRecords); },
    get bodyWrites() { return bodyWrites; },
    addTime(ms) { now += ms; },
    async click(action, data = {}) {
      await getNode('#app').listeners.get('click')({ target: { closest: () => ({ dataset: { action, ...data } }) } });
    },
    async importText(text, size = text.length) {
      const target = { files: [{ size, text: async () => text }], value: 'backup.json' };
      await getNode('#import-file').listeners.get('change')({ target });
      return target;
    }
  };
}

test('completing a set starts rest; rest expiry advances but does not start the next set', async () => {
  const app = await harness();
  app.api.install([work('first'), rest(), work('second')]);
  await app.click('complete');
  assert.equal(app.api.state.active.position, 1);
  assert.equal(app.api.state.active.timer.running, true);
  app.addTime(90_200);
  app.api.tick();
  assert.equal(app.api.state.active.position, 2);
  assert.equal(app.api.current().id, 'second');
  assert.equal(app.api.state.active.timer.running, false);
  assert.equal(app.api.state.completions[0], undefined);
});

test('work timer expiry waits for explicit completion instead of awarding a day', async () => {
  const app = await harness();
  app.api.install([work()], 'timer');
  app.api.setTimerRunning(true);
  app.addTime(40_100);
  app.api.tick();
  assert.equal(app.api.state.active.position, 0);
  assert.equal(app.api.state.active.timer.finished, true);
  assert.equal(app.api.state.active.timer.running, false);
  assert.equal(app.api.state.completions[0], undefined);
  await app.click('complete');
  assert.equal(app.api.view, 'finish');
  assert.equal(app.api.state.completions[0].status, 'complete');
});

test('pause and resume use actual elapsed time with no drift or time lost while paused', async () => {
  const app = await harness();
  app.api.install([work()], 'timer');
  app.api.setTimerRunning(true);
  app.addTime(12_345);
  app.api.pauseTimer();
  assert.equal(app.api.state.active.timer.remaining, 27_655);
  app.addTime(100_000);
  app.api.tick();
  assert.equal(app.api.state.active.timer.remaining, 27_655);
  app.api.setTimerRunning(true);
  app.addTime(1_655);
  app.api.tick();
  assert.equal(app.api.state.active.timer.remaining, 26_000);
  assert.equal(app.api.state.active.timer.running, true);
});

test('leaving pauses and persists the current step; resume keeps its exact remaining time', async () => {
  const app = await harness();
  app.api.install([work()], 'timer');
  await app.click('timer');
  app.addTime(9_000);
  await app.click('leave');
  assert.equal(app.api.view, 'home');
  assert.equal(app.api.state.active.timer.running, false);
  assert.equal(app.api.state.active.timer.remaining, 31_000);
  const saved = JSON.parse(app.store.get(KEY));
  assert.equal(saved.active.position, 0);
  assert.equal(saved.active.timer.remaining, 31_000);
  await app.click('resume');
  assert.equal(app.api.view, 'run');
  assert.equal(app.api.state.active.timer.remaining, 31_000);
  assert.equal(app.api.state.active.timer.running, false);
});

test('reload restores an interrupted timer paused and accounts for elapsed wall clock time', async () => {
  const start = Date.UTC(2026, 10, 13, 9);
  const original = await harness({ now: start });
  original.api.install([work()], 'timer');
  original.api.setTimerRunning(true);
  const reloaded = await harness({ saved: JSON.parse(original.store.get(KEY)), now: start + 15_000 });
  assert.equal(reloaded.api.state.active.timer.remaining, 25_000);
  assert.equal(reloaded.api.state.active.timer.running, false);
  assert.equal(reloaded.api.state.active.position, 0);
  const expired = await harness({ saved: JSON.parse(original.store.get(KEY)), now: start + 60_000 });
  assert.equal(expired.api.state.active.timer.remaining, 0);
  assert.equal(expired.api.state.active.timer.finished, true);
  assert.equal(expired.api.state.active.position, 0);
  assert.equal(expired.api.state.completions[0], undefined);
});

test('skipping rest does not mark a day partial, while skipping work does', async () => {
  const app = await harness();
  app.api.install([work('first'), rest(), work('second')]);
  await app.click('complete');
  await app.click('skip');
  await app.click('complete');
  assert.equal(app.api.state.completions[0].status, 'complete');
  const partial = await harness();
  partial.api.install([work('first'), rest(), work('second')]);
  await partial.click('skip');
  await partial.click('skip');
  await partial.click('complete');
  assert.equal(partial.api.state.completions[0].status, 'partial');
  assert.equal(partial.api.state.completions[0].skipped, 1);
});

test('retrying skipped steps retains a partial mark until every remaining step is completed', async () => {
  const app = await harness();
  app.api.install([work('first'), work('second'), work('third')]);
  await app.click('skip');
  await app.click('skip');
  await app.click('complete');
  assert.equal(app.api.state.completions[0].status, 'partial');
  await app.click('retry-skipped');
  assert.equal(app.api.view, 'run');
  assert.equal(app.api.state.completions[0].status, 'partial');
  await app.click('complete');
  assert.equal(app.api.state.completions[0].status, 'partial');
  await app.click('skip'); // rest between retried movements
  await app.click('skip'); // second remaining movement stays skipped
  assert.equal(app.api.state.completions[0].status, 'partial');
  await app.click('retry-skipped');
  await app.click('leave');
  const reloaded = await harness({ saved: JSON.parse(app.store.get(KEY)) });
  assert.equal(reloaded.api.state.completions[0].status, 'partial');
  await reloaded.click('resume');
  await reloaded.click('complete');
  assert.equal(reloaded.api.state.completions[0].status, 'complete');
});

test('invalid or oversized backup import preserves existing progress', async () => {
  const app = await harness();
  app.api.install([work()]);
  await app.click('complete');
  const before = jsonCopy(app.api.state);
  for (const [text, size] of [['not JSON', 8], ['{"version":99,"completions":{}}', 32], ['{}', MAX_BACKUP_BYTES + 1]]) {
    const input = await app.importText(text, size);
    assert.deepEqual(jsonCopy(app.api.state), before);
    assert.equal(input.value, '');
  }
});

test('storage failure keeps the workout usable and shows the persistent storage warning', async () => {
  const app = await harness({ storageFails: true });
  app.api.install([work()]);
  assert.equal(app.nodes.get('#storage-warning').hidden, false);
  await app.click('complete');
  assert.equal(app.api.state.completions[0].status, 'complete');
  assert.equal(app.api.view, 'finish');
});

test('starting a real scheduled day persists its full plan for resume', async () => {
  const app = await harness();
  await app.click('start');
  const saved = JSON.parse(app.store.get(KEY));
  assert.equal(saved.active.day, 0);
  assert.equal(saved.active.position, 0);
  assert.equal(saved.active.steps[0].kind, 'warmup');
  assert.ok(saved.active.steps.some(step => step.exerciseId === 'carry'));
  assert.equal(app.api.view, 'run');
});

test('normalization keeps legitimate plans and rejects HTML or nonfinite step fields', async () => {
  const app = await harness();
  const backupWith = steps => ({
    version: 1,
    completions: { 1: { status: 'complete', at: '2026-11-14T12:00:00Z', skipped: 0 } },
    active: { day: 0, steps, position: 0, skipped: [], timer: null, startedAt: Date.UTC(2026, 10, 13, 9) }
  });
  for (const day of [0, 3, 5, 19, 48]) {
    for (const settings of [{}, { floorpress: true, swings: true }, { easy: true }]) {
      const steps = getPlan(day, settings);
      const normalized = app.api.normalize(backupWith(steps));
      assert.equal(normalized.active.steps.length, steps.length, `legitimate day ${day} must survive normalization`);
      assert.equal(normalized.active.steps[0].exerciseId, steps[0].exerciseId);
    }
  }
  const html = '<img src=x onerror=alert(1)>';
  for (const [field, value] of [
    ['reps', html], ['side', html], ['set', html],
    ['exerciseId', '__proto__'], ['exerciseId', 'constructor'], ['exerciseId', 'toString'],
    ['seconds', NaN], ['seconds', Infinity], ['seconds', -Infinity]
  ]) {
    const normalized = app.api.normalize(backupWith([{ ...work(), [field]: value }]));
    assert.equal(normalized.active, null, `invalid ${field} must reject the active plan`);
    assert.equal(normalized.completions[1].status, 'complete', 'valid historical marks remain available');
  }
});

test('resetting workout marks keeps settings and the separate private body history', async () => {
  const bodyRecords = [{ id: 'private-record-kept-by-workout-reset' }];
  const app = await harness({ bodyRecords });
  app.api.install([work()]);
  await app.click('complete');
  assert.equal(app.api.state.completions[0].status, 'complete');
  app.nodes.get('#app').listeners.get('change')({ target: { dataset: { setting: 'sound' }, type: 'checkbox', checked: false } });
  await app.click('reset');
  assert.deepEqual(jsonCopy(app.api.state.completions), {});
  assert.equal(app.api.state.settings.sound, false);
  assert.deepEqual(app.bodyRecords, bodyRecords);
  assert.equal(app.bodyWrites, 0);
});

test('legacy backup import replaces workouts while preserving existing private history', async () => {
  const bodyRecords = [{ id: 'private-history-preserved-by-v1-import' }];
  const app = await harness({ bodyRecords });
  app.api.install([work()]);
  await app.click('complete');
  const backup = {
    version: 1, settings: {}, active: null,
    completions: { 1: { status: 'complete', at: '2026-11-14T09:00:00Z', skipped: 0 } }
  };
  await app.importText(JSON.stringify(backup));
  assert.equal(app.api.state.completions[0], undefined);
  assert.equal(app.api.state.completions[1].status, 'complete');
  assert.deepEqual(app.bodyRecords, bodyRecords);
  assert.equal(app.bodyWrites, 0);
});

test('full backup import intentionally replaces both workouts and private history', async () => {
  const app = await harness({ bodyRecords: [{ id: 'old-private-history' }] });
  const backup = {
    version: 2, createdAt: '2026-11-14T09:00:00Z', body: [],
    workout: {
      version: 1, settings: {}, active: null,
      completions: { 1: { status: 'complete', at: '2026-11-14T09:00:00Z', skipped: 0 } }
    }
  };
  await app.importText(JSON.stringify(backup));
  assert.equal(app.api.state.completions[1].status, 'complete');
  assert.deepEqual(app.bodyRecords, []);
  assert.equal(app.bodyWrites, 1);
});

test('failed workout save during full import preserves visible progress and rolls private history back', async () => {
  const bodyRecords = [{ id: 'old-private-history' }];
  const app = await harness({ bodyRecords, storageFails: true });
  const before = jsonCopy(app.api.state);
  const backup = {
    version: 2, createdAt: '2026-11-14T09:00:00Z', body: [],
    workout: {
      version: 1, settings: {}, active: null,
      completions: { 1: { status: 'complete', at: '2026-11-14T09:00:00Z', skipped: 0 } }
    }
  };
  await app.importText(JSON.stringify(backup));
  assert.deepEqual(jsonCopy(app.api.state), before);
  assert.deepEqual(app.bodyRecords, bodyRecords);
  assert.equal(app.bodyWrites, 2);
});


test('damaged workout backups never erase existing photos or measurements', async () => {
  const privateHistory = [{id:'private-record-kept'}];
  const app = await harness({bodyRecords:privateHistory});
  app.api.install([work()]);
  await app.click('complete');
  const previous=jsonCopy(app.api.state);
  for (const changed of [
    {...previous,completions:{0:{status:'corrupt'}}},
    {...previous,active:{day:0,position:0,steps:[{...work(),exerciseId:'__proto__'}],skipped:[],timer:null}},
    {...previous,active:{day:0,position:0,steps:[work()],skipped:[],timer:{running:true,duration:40000,remaining:30000,deadline:null}}}
  ]) {
    await app.importText(JSON.stringify({version:2,workout:changed,body:[]}));
    assert.deepEqual(jsonCopy(app.api.state),previous);
    assert.deepEqual(app.bodyRecords,privateHistory);
    assert.equal(app.bodyWrites,0);
  }
});


test('daily mode is enabled by default and changing it preserves an already queued legacy session', async () => {
  const baseSteps=getPlan(1,{dailyPractice:false});
  const app=await harness({saved:{version:1,settings:{},completions:{},active:{day:1,steps:baseSteps,position:0,timer:null,skipped:[],startedAt:Date.now()}}});
  assert.equal(app.api.state.settings.dailyPractice,true);
  assert.equal(app.api.state.active.steps[0].exerciseId,'walk');
  assert.match(app.api.state.active.title,/Кардио/);
  app.nodes.get('#app').listeners.get('change')({target:{dataset:{setting:'dailyPractice'},type:'checkbox',checked:false}});
  await app.click('resume');
  assert.equal(app.api.state.settings.dailyPractice,false);
  assert.equal(app.api.state.active.steps[0].exerciseId,'walk');
  assert.equal(app.api.state.active.steps.length,baseSteps.length);
});
