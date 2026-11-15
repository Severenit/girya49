import test from 'node:test';
import assert from 'node:assert/strict';
import { getDay, getPlan, getWeekInfo } from '../program.js';
import { getDayPurpose } from '../day-purpose.js';

test('all 49 dates explain purpose in daily, legacy, easy and expanded modes', () => {
  for (let index = 0; index < 49; index++) {
    for (const settings of [{}, { easy: true }, { dailyPractice: false }, { shortSessions: false }, { dailyPractice: false, shortSessions: false, easy: true }, { swings: true, floorpress: true }]) {
      const purpose = getDayPurpose(index, settings);
      assert.deepEqual(Object.keys(purpose).sort(), ['effect', 'focus', 'weekFocus', 'why']);
      for (const value of Object.values(purpose)) {
        assert.equal(typeof value, 'string');
        assert.ok(value.length > 15 && value.length <= 200);
        assert.doesNotMatch(value, /<[^>]+>/);
        assert.doesNotMatch(value, /кубик|сжига[а-яё]* жир|гарант|похуде[а-яё]* за/i);
      }
    }
  }
  assert.throws(() => getDayPurpose(-1), RangeError);
  assert.throws(() => getDayPurpose(49), RangeError);
});

test('each exercise day has its own focus and legacy days reflect their actual activities', () => {
  const daily = Array.from({length: 7}, (_, index) => getDayPurpose(index));
  assert.equal(new Set(daily.map(value => value.focus)).size, 7);
  assert.equal(new Set(daily.map(value => value.why)).size, 7);
  assert.match(getDayPurpose(1).why, /боковая планка/i);
  assert.ok(getPlan(1).some(step => step.exerciseId === 'sideplank'));
  assert.match(getDayPurpose(4).focus, /голени/i);
  assert.ok(getPlan(4).some(step => step.exerciseId === 'heelraise'));
  const walk = getDayPurpose(1, {dailyPractice: false});
  assert.match(walk.why, /говорить фразами/);
  const sunday = getDayPurpose(2, {dailyPractice: false});
  const thursday = getDayPurpose(6, {dailyPractice: false});
  assert.match(sunday.why, /мобильность/i);
  assert.doesNotMatch(thursday.why, /мобильность/i);
  assert.ok(getPlan(2, {dailyPractice: false}).some(step => step.exerciseId === 'mobility'));
  assert.ok(getPlan(6, {dailyPractice: false}).every(step => step.exerciseId !== 'mobility'));
});

test('strength weekly focus follows actual compact and expanded progression', () => {
  for (let week = 1; week <= 7; week++) {
    for (const settings of [{}, {shortSessions: false}]) {
      for (const slot of [0,3,5]) {
        const index = (week - 1) * 7 + slot;
        assert.equal(getDayPurpose(index, settings).weekFocus, getWeekInfo(week, settings).note);
      }
    }
  }
  assert.notEqual(getDayPurpose(0).weekFocus, getDayPurpose(14).weekFocus);
  assert.match(getDayPurpose(14).weekFocus, /третий круг не добавляем/);
  assert.match(getDayPurpose(14, {shortSessions: false}).weekFocus, /3 подхода/);
});

test('easy and deload descriptions match smaller queues without importing strength rules into light days', () => {
  for (const slot of [0,3,5]) {
    const index = 35 + slot;
    const compact = getPlan(index, {easy: true}).filter(step => step.kind === 'work');
    assert.ok(compact.every(step => step.sets === 1));
    assert.match(getDayPurpose(index, {easy: true}).weekFocus, /один облегчённый круг/);
    const expanded = getPlan(index, {easy: true, shortSessions: false}).filter(step => step.kind === 'work');
    assert.ok(expanded.every(step => step.sets === 2));
    assert.match(getDayPurpose(index, {easy: true, shortSessions: false}).weekFocus, /два облегчённых подхода/);
  }
  for (const slot of [1,4]) {
    assert.notEqual(getDayPurpose(slot).weekFocus, getDayPurpose(14 + slot).weekFocus);
    assert.match(getDayPurpose(42 + slot).weekFocus, /интервалы короче/);
    assert.match(getDayPurpose(21 + slot, {easy: true}).weekFocus, /Облегчённые интервалы/);
  }
  for (const slot of [2,6]) {
    assert.match(getDayPurpose(21 + slot).weekFocus, /пяти повторов в запасе/);
    assert.match(getDayPurpose(21 + slot, {easy: true}).weekFocus, /Один лёгкий круг/);
    assert.equal(getDay(21 + slot).type, 'mobility');
    assert.doesNotMatch(getDayPurpose(21 + slot).weekFocus, /2–3/);
  }
});

test('the last day invites comparison without maximal tests in either schedule', () => {
  for (const settings of [{}, {dailyPractice: false}, {easy: true}]) {
    const purpose = getDayPurpose(48, settings);
    assert.match(purpose.weekFocus, /фото, замеры и самочувствие/);
    assert.match(purpose.weekFocus, /максимальные попытки не нужны/);
    assert.doesNotMatch(purpose.effect, /за 49|за 50/);
  }
  const changed = getDayPurpose(0);
  changed.focus = 'changed by a caller';
  assert.notEqual(getDayPurpose(0).focus, changed.focus);
});
