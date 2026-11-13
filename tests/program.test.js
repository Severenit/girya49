import test from 'node:test';
import { demoIds } from '../demos.js';
import { getPlan as currentDailyPlan } from '../program.js';
import assert from 'node:assert/strict';
import {
  WEEKS, EXERCISES,
  getDay as getProgramDay, getPlan as getProgramPlan,
  getExercisePrescription, dateIndex, estimateMinutes as getProgramEstimateMinutes, stepDurationSeconds
} from '../program.js';

// Keep the original agreed 3/2/2 schedule covered explicitly; new daily defaults
// are exercised below through the unwrapped getProgramDay/getProgramPlan APIs.
const getDay = (index, settings = {}) => getProgramDay(index, { dailyPractice: false, shortSessions: false, ...settings });
const getPlan = (index, settings = {}) => getProgramPlan(index, { dailyPractice: false, shortSessions: false, ...settings });
const estimateMinutes = (index, settings = {}) => getProgramEstimateMinutes(index, { dailyPractice: false, shortSessions: false, ...settings });

const works = plan => plan.filter(step => step.kind === 'work');
const count = (plan, id) => works(plan).filter(step => step.exerciseId === id).length;

test('baseline mode keeps 49 civil dates and exactly 21/14/14 sessions', () => {
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

const workVolume = plan => works(plan).reduce((total, step) => total + (step.seconds || step.reps * 4), 0);

test('compact format also limits optional walking days to twenty minutes', () => {
  for(let day=0;day<49;day++) assert.ok(getProgramEstimateMinutes(day,{dailyPractice:false})<=20);
  assert.equal(getProgramEstimateMinutes(36,{dailyPractice:false}),20);
  assert.equal(getProgramEstimateMinutes(36,{dailyPractice:false,shortSessions:false}),45);
});
const kettleExerciseIds = new Set(['squat', 'pausesquat', 'row', 'rdl', 'carry', 'deadlift', 'floorpress', 'swing']);

test('daily mode is the default and gives all 49 dates an actual exercise session', () => {
  assert.deepEqual(Array.from({ length: 7 }, (_, day) => getProgramDay(day).code), ['A', 'D', 'E', 'B', 'F', 'C', 'G']);
  const types = Array.from({ length: 49 }, (_, day) => getProgramDay(day).type);
  assert.deepEqual(['strength', 'conditioning', 'mobility'].map(type => types.filter(value => value === type).length), [21, 14, 14]);
  for (let day = 0; day < 49; day++) {
    const plan = getProgramPlan(day);
    assert.ok(new Set(works(plan).map(step => step.exerciseId)).size >= 4, `day ${day + 1} needs at least four work exercises`);
    assert.equal(plan[0].kind, 'warmup', `day ${day + 1} must start with preparation`);
    assert.equal(plan.at(-1).kind, 'cooldown', `day ${day + 1} must finish gently`);
    assert.equal(new Set(plan.map(step => step.id)).size, plan.length, `day ${day + 1} step IDs must be unique`);
    for (const step of plan) {
      assert.ok(EXERCISES[step.exerciseId]);
      assert.ok(step.reps === null || (Number.isInteger(step.reps) && step.reps > 0));
      assert.ok(step.seconds === null || (Number.isInteger(step.seconds) && step.seconds > 0));
      assert.ok(step.reps !== null || step.seconds !== null);
    }
  }
});

test('D E F G use bodyweight practice and never add heavy kettlebell work', () => {
  for (let day = 0; day < 49; day++) {
    if (!['D', 'E', 'F', 'G'].includes(getProgramDay(day).code)) continue;
    assert.equal(getProgramDay(day).usesKettlebell, false);
    const plan = getProgramPlan(day);
    for (const step of works(plan)) {
      assert.equal(kettleExerciseIds.has(step.exerciseId), false, `day ${day + 1} must leave the kettlebell aside`);
      assert.doesNotMatch(EXERCISES[step.exerciseId].equipment, /16\s*кг/i);
    }
  }
});

test('daily bodyweight sessions deload in week seven and shrink in easy mode', () => {
  for (const slot of [1, 2, 4, 6]) {
    const normal = getProgramPlan(21 + slot);
    const easy = getProgramPlan(21 + slot, { easy: true });
    assert.ok(works(easy).length <= works(normal).length);
    assert.ok(workVolume(easy) < workVolume(normal), `easy ${getProgramDay(21 + slot).code} must reduce work`);
    assert.ok(workVolume(getProgramPlan(42 + slot)) < workVolume(getProgramPlan(35 + slot)), `final ${getProgramDay(42 + slot).code} must be lighter than week six`);
  }
});

test('daily practice toggle keeps kettlebell sessions unchanged in compact and expanded modes', () => {
  for (let day = 0; day < 49; day++) {
    if (![0, 3, 5].includes(day % 7)) continue;
    for (const settings of [{}, { easy: true }, { swings: true, floorpress: true }, { shortSessions: false }, { shortSessions: false, easy: true }, { shortSessions: false, swings: true, floorpress: true }]) {
      assert.deepEqual(getProgramPlan(day, settings), getProgramPlan(day, { ...settings, dailyPractice: false }));
    }
  }
});

test('additional daily sessions explicitly preserve an effort reserve', () => {
  for (let day = 0; day < 49; day++) {
    const descriptor = getProgramDay(day);
    if (!['conditioning', 'mobility'].includes(descriptor.type)) continue;
    const workSteps = works(getProgramPlan(day));
    for (const step of workSteps) assert.match(step.cue, /запас/i, `${descriptor.code} must explain when to stop`);
    if (descriptor.type === 'conditioning') {
      assert.ok(workSteps.some(step => /разговорный темп/i.test(step.cue)));
    } else {
      assert.ok(workSteps.every(step => /л[её]гкая практика/i.test(step.cue) && /не накапливай усталость/i.test(step.cue)));
    }
  }
});


test('every new daily exercise has its own offline technique demonstration', () => {
  for(let day=0;day<49;day++)for(const step of currentDailyPlan(day)){
    assert.ok(demoIds.includes(EXERCISES[step.exerciseId].demo), `missing demo for ${step.exerciseId}`);
  }
});

test('compact default keeps every date within twenty estimated minutes, including timer choices', () => {
  for (const mode of ['reps', 'timer']) for (const floorpress of [false, true]) for (const swings of [false, true]) {
    const settings = { mode, timerSeconds: 60, floorpress, swings };
    for (let day = 0; day < 49; day++) {
      const plan = getProgramPlan(day, settings);
      assert.ok(getProgramEstimateMinutes(day, settings) <= 20, `${getProgramDay(day).code} week ${getProgramDay(day).week}, ${JSON.stringify(settings)} exceeds twenty minutes`);
      assert.equal(new Set(works(plan).map(step => step.exerciseId)).size, 5, `day ${day + 1} keeps five exercises`);
      assert.equal(plan[0].kind, 'warmup');
      assert.equal(plan[0].seconds, 180);
      assert.equal(plan.at(-1).kind, 'cooldown');
      assert.equal(plan.at(-1).seconds, 60);
      assert.equal(count(plan, 'swing'), 0, 'the optional expanded swing block must not extend compact sessions');
    }
  }
});

test('compact strength keeps two rounds and both sides without a late-week volume jump', () => {
  const unilateral = new Set(['row', 'carry', 'lunge', 'floorpress', 'deadbug']);
  for (let week = 0; week < 7; week++) for (const slot of [0, 3, 5]) {
    const day = week * 7 + slot;
    const plan = getProgramPlan(day, { floorpress: true });
    assert.deepEqual([...new Set(works(plan).map(step => step.round))], [1, 2]);
    assert.ok(works(plan).every(step => step.set <= 2 && step.sets === 2));
    for (const step of works(plan).filter(step => unilateral.has(step.exerciseId))) {
      const matching = works(plan).filter(candidate => candidate.exerciseId === step.exerciseId && candidate.set === step.set);
      assert.deepEqual(matching.map(candidate => candidate.side), ['Левая', 'Правая']);
    }
    const firstSide = plan.findIndex(step => step.kind === 'work' && step.side === 'Левая');
    assert.equal(plan[firstSide + 1].kind, 'rest');
    assert.equal(plan[firstSide + 1].seconds, 15);
    const easy = getProgramPlan(day, { easy: true, floorpress: true });
    assert.deepEqual([...new Set(works(easy).map(step => step.round))], [1]);
    assert.ok(workVolume(easy) < workVolume(plan));
  }
});

test('compact progression adds controlled work then returns to lower targets in week seven', () => {
  for (const slot of [0, 3, 5]) {
    const start = getProgramPlan(slot), second = getProgramPlan(7 + slot), developed = getProgramPlan(35 + slot), finish = getProgramPlan(42 + slot);
    assert.ok(workVolume(start) <= workVolume(second));
    assert.ok(workVolume(second) <= workVolume(developed));
    assert.ok(workVolume(start) < workVolume(developed));
    assert.equal(workVolume(finish), workVolume(start));
    assert.ok(works(developed).every(step => /2–3/.test(step.cue)));
  }
});

test('compact timer cap survives stored steps and the estimate matches actual step durations', () => {
  const settings = { mode: 'timer', timerSeconds: 60, floorpress: true };
  for (let day = 0; day < 49; day++) {
    const plan = getProgramPlan(day, settings);
    const stored = JSON.parse(JSON.stringify(plan));
    const expectedSeconds = stored.reduce((total, step) => total + (step.seconds ?? Math.min(60, 35)), 0);
    assert.equal(getProgramEstimateMinutes(day, settings), Math.ceil(expectedSeconds / 60));
    assert.equal(stored.reduce((total, step) => total + stepDurationSeconds(step, settings), 0), expectedSeconds);
    const expectedRepSeconds = stored.reduce((total, step) => total + (step.seconds ?? step.reps * 4), 0);
    assert.equal(getProgramEstimateMinutes(day, { ...settings, mode: 'reps' }), Math.ceil(expectedRepSeconds / 60));
    for (const step of stored.filter(step => step.reps !== null)) {
      assert.equal(step.timerCap, 35);
      assert.equal(stepDurationSeconds(step, { ...settings, shortSessions: false }), 35, 'a queued short session keeps its duration after changing settings');
    }
  }
});
