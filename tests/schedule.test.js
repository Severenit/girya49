import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { nextSession, passedCount, localDateKey, completedToday, projectedFinish } from '../schedule.js';

const entry = (at, status = 'complete') => ({ status, at, skipped: status === 'partial' ? 1 : 0 });
const stateWith = (completions = {}, active = null) => ({ completions, active });
const fullHistory = at => Object.fromEntries(Array.from({ length: 49 }, (_, i) => [i, entry(at)]));

test('missed days never advance the sequence and earlier gaps are not silently discarded', () => {
  assert.equal(nextSession(stateWith()), 0);
  const state = stateWith({ 0: entry('2026-11-13T09:00:00Z'), 2: entry('2026-11-15T09:00:00Z') });
  const snapshot = structuredClone(state);
  assert.equal(nextSession(state), 1);
  assert.equal(passedCount(state), 2);
  assert.deepEqual(state, snapshot);
});

test('partial sessions preserve their status and let the next session become available', () => {
  const state = stateWith({ 0: entry('2026-11-13T09:00:00Z', 'partial') });
  assert.equal(nextSession(state), 1);
  assert.equal(passedCount(state), 1);
  assert.equal(state.completions[0].status, 'partial');
});

test('an unfinished saved workout has priority, while a finished result cannot pin the next session', () => {
  const completions = { 0: entry('2026-11-13T09:00:00Z') };
  const active = { day: 3, steps: [{}, {}], position: 1 };
  assert.equal(nextSession(stateWith(completions, active)), 3);
  assert.equal(nextSession(stateWith(completions, { ...active, position: 2 })), 1);
  assert.equal(nextSession(stateWith(completions, { ...active, day: 49 })), 1);
});

test('a completed challenge has no next session and counts only the 49 valid plan entries', () => {
  const completions = fullHistory('2026-12-31T09:00:00Z');
  completions[100] = entry('2027-01-01T09:00:00Z');
  completions.extra = entry('2027-01-01T09:00:00Z');
  assert.equal(nextSession(stateWith(completions)), null);
  assert.equal(passedCount(stateWith(completions)), 49);
});

test('finish moves with missed days and uses tomorrow after a session already recorded today', () => {
  const now = new Date(2026, 10, 15, 10);
  assert.equal(localDateKey(projectedFinish(stateWith(), now)), '2027-01-02');
  const beforeToday = stateWith({ 0: entry(new Date(2026, 10, 13, 10).toISOString()) });
  assert.equal(localDateKey(projectedFinish(beforeToday, now)), '2027-01-01');
  const doneToday = stateWith({ 0: entry(now.toISOString()) });
  assert.equal(completedToday(doneToday, now), true);
  assert.equal(localDateKey(projectedFinish(doneToday, now)), '2027-01-02');
  const active = { day: 1, steps: [{}], position: 0 };
  assert.equal(localDateKey(projectedFinish(stateWith(doneToday.completions, active), now)), '2027-01-01');
});

test('final completed date is taken from actual history, including a partial final session', () => {
  const completions = fullHistory(new Date(2026, 11, 31, 10).toISOString());
  completions[48] = entry(new Date(2027, 0, 3, 10).toISOString(), 'partial');
  const state = stateWith(completions);
  assert.equal(localDateKey(projectedFinish(state, new Date(2027, 0, 5))), '2027-01-03');
  assert.equal(nextSession(state), null);
});

test('repeating a recorded session today does not move the remaining sessions one day earlier', () => {
  const now = new Date(2026, 11, 31, 10);
  for (const status of ['complete', 'partial']) {
    const completions = fullHistory(new Date(2026, 11, 30, 10).toISOString());
    delete completions[48];
    completions[0] = entry(now.toISOString(), status);
    const active = { day: 0, steps: [{}], position: 0 };
    assert.equal(localDateKey(projectedFinish(stateWith(completions, active), now)), '2027-01-01');
    assert.equal(localDateKey(projectedFinish(stateWith(completions, { ...active, day: 48 }), now)), '2026-12-31');
  }
});

test('missing or invalid timestamps never become a false completion today', () => {
  const now = new Date(2026, 10, 15, 10);
  for (const at of ['', undefined, null, 'not a date']) {
    const state = stateWith({ 0: entry(at) });
    assert.equal(completedToday(state, now), false);
    assert.equal(localDateKey(projectedFinish(state, now)), '2027-01-01');
  }
  assert.equal(localDateKey(new Date('invalid')), null);
  assert.equal(projectedFinish(stateWith(), new Date('invalid')), null);
});

test('today follows the device local day on both sides of UTC midnight', () => {
  const moduleUrl = new URL('../schedule.js', import.meta.url).href;
  for (const [tz, now, at, expectedDay] of [
    ['Europe/Moscow', '2026-11-15T00:30:00+03:00', '2026-11-14T21:15:00Z', '2026-11-15'],
    ['America/Los_Angeles', '2026-11-14T23:30:00-08:00', '2026-11-15T07:15:00Z', '2026-11-14']
  ]) {
    const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
      import { completedToday, localDateKey } from ${JSON.stringify(moduleUrl)};
      const now = new Date(${JSON.stringify(now)});
      const state = {completions:{0:{status:'partial',at:${JSON.stringify(at)}}}};
      process.stdout.write(JSON.stringify([completedToday(state,now),localDateKey(now)]));
    `], { env: { ...process.env, TZ: tz }, encoding: 'utf8' });
    assert.deepEqual(JSON.parse(output), [true, expectedDay]);
  }
});

test('finish counts civil days across daylight saving transitions rather than fixed milliseconds', () => {
  const moduleUrl = new URL('../schedule.js', import.meta.url).href;
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', `
    import { projectedFinish, localDateKey } from ${JSON.stringify(moduleUrl)};
    const completions=Object.fromEntries(Array.from({length:47},(_,i)=>[i,{status:'complete',at:'2026-02-01T12:00:00Z'}]));
    const spring=projectedFinish({completions},new Date(2026,2,7,10));
    const fall=projectedFinish({completions},new Date(2026,9,31,10));
    process.stdout.write(JSON.stringify([[localDateKey(spring),spring.getHours()],[localDateKey(fall),fall.getHours()]]));
  `], { env: { ...process.env, TZ: 'America/New_York' }, encoding: 'utf8' });
  assert.deepEqual(JSON.parse(output), [['2026-03-08', 12], ['2026-11-01', 12]]);
});
