import test from 'node:test';
import assert from 'node:assert/strict';
import { WEEKS, EXERCISES, getDay, getPlan, getExercisePrescription, dateIndex, estimateMinutes } from '../program.js';

const works = plan => plan.filter(step => step.kind === 'work');
const count = (plan, id) => works(plan).filter(step => step.exerciseId === id).length;

test('49 civil dates span Nov 13 through Dec 31 with exactly 21/14/14 sessions', () => {
  const days = Array.from({ length: 49 }, (_, index) => getDay(index));
  assert.equal(days[0].date, '2026-11-13');
  assert.equal(days.at(-1).date, '2026-12-31');
  assert.equal(new Set(days.map(day => day.date)).size, 49);
  assert.deepEqual(['strength', 'cardio', 'recovery'].map(type => days.filter(day => day.type === type).length), [21, 14, 14]);
  assert.deepEqual(days.slice(0, 7).map(day => day.code), ['A', 'walk', 'recovery', 'B', 'walk', 'C', 'recovery']);
  assert.equal(WEEKS.length, 7);
});

test('dateIndex uses local civil date and accepts validated ISO dates', () => {
  assert.equal(dateIndex(new Date(2026, 10, 13, 0, 1)), 0);
  assert.equal(dateIndex(new Date(2026, 11, 31, 23, 59)), 48);
  assert.equal(dateIndex('2026-11-12'), -1);
  assert.equal(dateIndex('2027-01-01'), 49);
  assert.throws(() => dateIndex('2026-11-31'));
  assert.throws(() => getDay(49));
  assert.throws(() => getDay(-1));
});

test('week 3 adds sets only to first three exercises; week 7 deloads', () => {
  const plan = getPlan(14);
  assert.deepEqual(['squat', 'row', 'pushup', 'rdl', 'carry'].map(id => count(plan, id)), [3, 6, 3, 2, 4]);
  const final = getPlan(42);
  assert.deepEqual(['squat', 'row', 'pushup', 'rdl', 'carry'].map(id => count(final, id)), [2, 4, 2, 2, 4]);
  assert.equal(works(final).find(step => step.exerciseId === 'squat').reps, 6);
  assert.equal(getExercisePrescription('bridge', 4).reps, 15);
  assert.match(getExercisePrescription('rdl', 5).cue, /3 секунды/);
});

test('unilateral sets preserve both sides and side-change rest', () => {
  const plan = getPlan(0);
  const firstRow = plan.findIndex(step => step.exerciseId === 'row');
  assert.equal(plan[firstRow].side, 'Левая');
  assert.equal(plan[firstRow + 1].kind, 'rest');
  assert.equal(plan[firstRow + 1].seconds, 30);
  assert.equal(plan[firstRow + 2].side, 'Правая');
  assert.equal(plan[firstRow].set, plan[firstRow + 2].set);
  const carry = works(plan).find(step => step.exerciseId === 'carry');
  assert.equal(carry.reps, null);
  assert.equal(carry.seconds, 20);
});

test('B defaults to supported push-ups, with floor press only by choice', () => {
  assert.equal(count(getPlan(3), 'floorpress'), 0);
  assert.equal(count(getPlan(3), 'easypushup'), 2);
  assert.equal(count(getPlan(3, { floorpress: true }), 'floorpress'), 4);
  assert.equal(EXERCISES.lunge.equipment, 'Без гири · по одной ноге');
});

test('C is a circuit; week 3 omits last two exercises in third round', () => {
  const plan = getPlan(19);
  const third = works(plan).filter(step => step.round === 3);
  assert.deepEqual([...new Set(third.map(step => step.exerciseId))], ['pausesquat', 'row', 'deadlift']);
  assert.equal(count(plan, 'carry'), 4);
  assert.equal(count(plan, 'row'), 6);
  assert.ok(works(plan).filter(step => step.exerciseId === 'row').every(step => step.reps === 8));
  assert.ok(works(plan).filter(step => step.exerciseId === 'deadlift').every(step => step.reps === 10));
  assert.equal(plan.filter(step => step.kind === 'rest' && step.seconds === 90).length, 2);
});

test('optional swings gated by week, exactly 4 × 8, outside C circuit', () => {
  assert.equal(count(getPlan(5, { swings: true }), 'swing'), 0);
  const plan = getPlan(19, { swings: true });
  assert.equal(count(plan, 'deadlift'), 0);
  const swings = works(plan).filter(step => step.exerciseId === 'swing');
  assert.equal(swings.length, 4);
  assert.ok(swings.every(step => step.reps === 8 && step.round === null));
  assert.equal(count(getPlan(19), 'swing'), 0);
  assert.equal(count(getPlan(19, { swings: true, easy: true }), 'swing'), 0);
  assert.equal(count(getPlan(47, { swings: true }), 'swing'), 0);
  assert.equal(count(getPlan(47, { swings: true }), 'deadlift'), 2);
});

test('easy C keeps two lower-bound sets, preserves preparation, and suppresses swings', () => {
  const plan = getPlan(40, { easy: true, swings: true, floorpress: true });
  assert.equal(plan[0].kind, 'warmup');
  assert.equal(plan[0].seconds, 300);
  assert.equal(plan.at(-1).kind, 'cooldown');
  assert.equal(plan.at(-1).seconds, 120);
  assert.equal(count(plan, 'swing'), 0);
  assert.equal(count(plan, 'floorpress'), 0);
  assert.deepEqual(['pausesquat', 'row', 'deadlift', 'pushup', 'carry'].map(id => count(plan, id)), [2, 4, 2, 2, 4]);
  for (const step of works(plan)) {
    assert.ok(step.set <= 2);
    assert.equal(step.sets, 2);
    assert.equal(step.reps ?? step.seconds, ({ pausesquat: 6, row: 8, deadlift: 8, pushup: 6, carry: 20 })[step.exerciseId]);
  }
  assert.ok(estimateMinutes(40, { easy: true }) < estimateMinutes(40));
});

test('duration estimate includes rests, both sides, warmup, and cooldown', () => {
  // First A: 420s prep/finish + 810s ordinary rests + 120s side rests
  // + 72 controlled reps × 4s + 4 carries × 20s = 1718s, rounded up.
  assert.equal(estimateMinutes(0), 29);
  assert.equal(estimateMinutes(1), 30);
  assert.equal(estimateMinutes(2), 20);
  assert.equal(estimateMinutes(24), 47);
  assert.equal(estimateMinutes(24, { floorpress: true }), 50);
});

test('all plans have unique IDs, resolvable demonstrations, valid durations and no trailing rests', () => {
  for (let index = 0; index < 49; index += 1) {
    const plan = getPlan(index);
    assert.equal(new Set(plan.map(step => step.id)).size, plan.length);
    for (const step of plan) {
      assert.ok(EXERCISES[step.exerciseId], `Unknown exercise ${step.exerciseId}`);
      assert.ok(step.reps === null || (Number.isInteger(step.reps) && step.reps > 0));
      assert.ok(step.seconds === null || (Number.isInteger(step.seconds) && step.seconds > 0));
      assert.ok(step.reps !== null || step.seconds !== null);
    }
    assert.notEqual(plan.at(-1).kind, 'rest');
    if (getDay(index).type === 'strength') {
      assert.equal(plan[0].kind, 'warmup');
      assert.equal(plan[0].seconds, 300);
      assert.equal(plan.at(-1).kind, 'cooldown');
    }
  }
});

test('cardio progresses then deloads; recovery is intentionally light', () => {
  assert.equal(getPlan(1)[0].seconds, 30 * 60);
  assert.equal(getPlan(36)[0].seconds, 45 * 60);
  assert.equal(getPlan(43)[0].seconds, 30 * 60);
  assert.deepEqual(getPlan(2).map(step => step.seconds), [600, 600]);
  assert.equal(getPlan(48)[0].seconds, 1200);
  assert.match(getPlan(48)[0].cue, /Финальный день/);
});
