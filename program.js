// Browser-only program data. Dates are civil dates, never UTC-midnight timestamps.
export const WEEKS = [
  { title: 'Освоить движения', dates: '13–19 ноября', sets: 2, note: '2 подхода, нижняя граница повторений. Оставляй 2–3 повтора в запасе.' },
  { title: 'Добавить уверенности', dates: '20–26 ноября', sets: 2, note: '2 подхода. Добавь 1–2 повтора, только если сохраняешь технику.' },
  { title: 'Чуть больше объёма', dates: '27 ноября — 3 декабря', sets: 3, note: 'Первые 3 упражнения — по 3 подхода, остальные — по 2.' },
  { title: 'Закрепить базу', dates: '4–10 декабря', sets: 3, note: '3 подхода. Верхняя граница повторений — ориентир, а не обязанность.' },
  { title: 'Контроль движения', dates: '11–17 декабря', sets: 3, note: '3 подхода. Опускайся в приседе и опускай гирю в тягах за 3 секунды.' },
  { title: 'Качество каждого повтора', dates: '18–24 декабря', sets: 3, note: '3 подхода. Закрепляй результат без отказа и без ускорения.' },
  { title: 'Легче, но регулярно', dates: '25–31 декабря', sets: 2, note: '2 лёгких подхода. 31 декабря сравни результат без максимальных попыток.' },
];

export const EXERCISES = {
  warmup: {
    title: 'Разминка', demo: 'warmup', equipment: 'Без гири · 5 минут',
    cues: ['10 приседаний без веса и 10 наклонов с тазом назад.', 'По 6 обратных выпадов на ногу; можно держаться за опору.', 'Круги плечами и спокойная ходьба до конца таймера.'],
    easier: 'Уменьши глубину приседа и выпада. Разминайся в комфортном темпе.',
  },
  squat: {
    title: 'Гоблет-присед', demo: 'squat', equipment: 'Гиря 16 кг · двумя руками',
    cues: ['Держи гирю близко к груди, стопы устойчиво на полу.', 'Сядь вниз между бёдрами, колени направляй по линии носков.', 'Встань, опираясь всей стопой. Выдыхай на подъёме.'],
    easier: 'Приседай без гири до устойчивого стула. Выбирай глубину, в которой контролируешь спину.',
  },
  row: {
    title: 'Тяга гири в наклоне', demo: 'row', equipment: 'Гиря 16 кг · по одной руке',
    cues: ['Свободной рукой обопрись на устойчивую опору; спина ровная.', 'Веди локоть назад к тазу, гирю — к поясу.', 'Опусти гирю подконтрольно. Не разворачивай корпус.'],
    easier: 'Сократи число повторений. Если 16 кг не контролируются, пропусти упражнение и подбери более лёгкий вес.',
  },
  pushup: {
    title: 'Отжимания', demo: 'pushup', equipment: 'Без гири · пол или устойчивая опора',
    cues: ['Ладони чуть шире плеч; корпус — одна ровная линия.', 'Сгибай локти примерно под 30–45° к корпусу.', 'Опускай грудь между ладонями и оттолкнись.'],
    easier: 'Поставь руки на устойчивый стол или стену: чем выше опора, тем легче.',
  },
  easypushup: {
    title: 'Отжимания от опоры', demo: 'pushup', equipment: 'Без гири · высокая устойчивая опора',
    cues: ['Проверь, что стол или другая опора не сдвигается.', 'Держи корпус ровно и локти ближе к телу.', 'Плавно приблизь грудь к опоре и оттолкнись.'],
    easier: 'Отжимайся от стены, стоя ближе к ней.',
  },
  rdl: {
    title: 'Румынская тяга', demo: 'rdl', equipment: 'Гиря 16 кг · двумя руками',
    cues: ['Стой прямо, гиря перед бёдрами, колени слегка согнуты.', 'Отводи таз назад. Гиря идёт близко к ногам.', 'Остановись до округления спины и верни таз вперёд.'],
    easier: 'Отрабатывай отведение таза назад без гири, касаясь ягодицами стены.',
  },
  carry: {
    title: 'Переноска гири', demo: 'carry', equipment: 'Гиря 16 кг · по одной руке',
    cues: ['Подними гирю через становую тягу, удерживай сбоку.', 'Иди короткими шагами; плечи и таз держи ровно.', 'Не наклоняйся к гире. Дыши свободно.'],
    easier: 'Стой с гирей на месте короткими отрезками. Если теряешь ровное положение — поставь её.',
  },
  deadlift: {
    title: 'Становая тяга', demo: 'deadlift', equipment: 'Гиря 16 кг · двумя руками',
    cues: ['Гиря между стопами. Отведи таз назад и возьмись за дужку.', 'Напряги корпус, держи спину ровно и встань за счёт ног и таза.', 'Верни гирю на пол, отводя таз назад. Не дёргай.'],
    easier: 'Поставь гирю на невысокую устойчивую подставку или отрабатывай наклон без веса.',
  },
  lunge: {
    title: 'Обратные выпады', demo: 'lunge', equipment: 'Без гири · по одной ноге',
    cues: ['Сделай шаг назад, переднюю стопу оставь полностью на полу.', 'Опускай заднее колено к полу, корпус держи устойчиво.', 'Оттолкнись передней ногой и вернись. Можно держаться за опору.'],
    easier: 'Уменьши глубину и держись за устойчивую опору. Вес добавлять необязательно.',
  },
  floorpress: {
    title: 'Жим гири лёжа', demo: 'floorpress', equipment: 'Гиря 16 кг · по одной руке',
    cues: ['Безопасно устройся лёжа и помоги второй рукой вывести гирю в исходное положение.', 'Предплечье вертикально, запястье ровное; локоть примерно в 30–45° от корпуса.', 'Выжми гирю вверх и медленно верни локоть на пол.'],
    easier: 'Замени отжиманиями от высокой устойчивой опоры.',
    caution: 'Только при уверенном контроле 16 кг и безопасном входе и выходе из положения. Не тренируйся до отказа.',
  },
  bridge: {
    title: 'Ягодичный мост', demo: 'bridge', equipment: 'Без гири',
    cues: ['Ляг на спину, согни ноги; стопы стоят на полу.', 'Подними таз, напрягая ягодицы, до прямой линии плечи — таз — колени.', 'Не прогибай поясницу. Плавно опусти таз.'],
    easier: 'Поднимай таз ниже, сохраняя комфортную поясницу.',
  },
  deadbug: {
    title: 'Dead bug', demo: 'deadbug', equipment: 'Без гири · по одной стороне',
    cues: ['Ляг на спину: руки вверх, бёдра и колени согнуты примерно на 90°.', 'Вытяни противоположные руку и ногу, сохраняя спокойную поясницу.', 'Вернись. Считай повтор по стороне вытягиваемой ноги.'],
    easier: 'Двигай только ногами: по очереди касайся пяткой пола, руки оставь вверх.',
  },
  pausesquat: {
    title: 'Присед с паузой', demo: 'pausesquat', equipment: 'Гиря 16 кг · пауза 1 секунда',
    cues: ['Держи гирю у груди, всю стопу — на полу.', 'Присядь до контролируемой глубины и замри на 1 секунду.', 'Сохраняя напряжение корпуса, встань без рывка.'],
    easier: 'Приседай без гири с короткой паузой над устойчивым стулом.',
  },
  swing: {
    title: 'Махи гирей — по выбору', demo: 'swing', equipment: 'Гиря 16 кг · двумя руками · 4 × 8',
    cues: ['Только после освоения техники маха. Начинай с отведения таза назад.', 'Разгоняй гирю разгибанием таза, а не подъёмом рук.', 'Останови подход до потери положения спины. Держи пространство свободным.'],
    easier: 'Становая тяга остаётся полноценным вариантом на все 7 недель.',
    caution: 'С третьей недели и только при освоенной технике маха. 12–15 чистых тяг — предварительный ориентир, но сами по себе не подтверждают навык маха.',
  },
  walk: {
    title: 'Ходьба', demo: 'walk', equipment: 'Удобная обувь · без гири',
    cues: ['Выбери ровный маршрут и удобный темп.', 'На кардио дыши активнее, но сохраняй возможность говорить фразами.', 'Первые две недели достаточно быстрой ходьбы; ускорение необязательно.'],
    easier: 'Снизь темп и сократи прогулку по самочувствию.',
  },
  mobility: {
    title: 'Мягкая мобильность', demo: 'mobility', equipment: 'Без гири · 10 минут',
    cues: ['Мягко подвигай плечами и грудным отделом.', 'Сделай несколько спокойных наклонов с отведением таза и неглубоких приседаний.', 'Не тяни через боль. Чередуй движения с ровным дыханием.'],
    easier: 'Оставь только комфортные движения и спокойную ходьбу.',
  },
  cooldown: {
    title: 'Спокойное завершение', demo: 'walk', equipment: 'Без гири · 2 минуты',
    cues: ['Пройдись спокойным шагом.', 'Дай дыханию постепенно восстановиться.', 'Оцени самочувствие: цель — закончить с запасом сил.'],
    easier: 'Отдохни в удобном положении.',
  },
};

const DAY_MS = 86400000;
const START_CIVIL = Date.UTC(2026, 10, 13);
const WEEKDAYS = ['Пт', 'Сб', 'Вс', 'Пн', 'Вт', 'Ср', 'Чт'];
const CYCLE = ['A', 'walk', 'recovery', 'B', 'walk', 'C', 'recovery'];
const RANGE = {
  squat: [6, 10], row: [8, 12], pushup: [6, 12], rdl: [8, 12],
  carry: [20, 40], deadlift: [8, 12], lunge: [6, 10], easypushup: [6, 10],
  floorpress: [6, 10], bridge: [12, 15], deadbug: [8, 10], pausesquat: [6, 8], swing: [8, 8],
};
const SIDED = new Set(['row', 'carry', 'lunge', 'floorpress', 'deadbug']);

function assertIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index > 48) throw new RangeError('День должен быть целым числом от 0 до 48.');
}
function assertWeek(week) {
  if (!Number.isInteger(week) || week < 1 || week > 7) throw new RangeError('Неделя должна быть от 1 до 7.');
}

/** Returns the un-clamped civil-day index; negative / >48 indicate outside the challenge. */
export function dateIndex(date = new Date()) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    const time = Date.UTC(year, month - 1, day);
    const normalized = new Date(time).toISOString().slice(0, 10);
    if (normalized !== date) throw new RangeError('Некорректная дата.');
    return Math.round((time - START_CIVIL) / DAY_MS);
  }
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new TypeError('Ожидается дата или строка YYYY-MM-DD.');
  return Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - START_CIVIL) / DAY_MS);
}

export function getDay(index) {
  assertIndex(index);
  const week = Math.floor(index / 7) + 1;
  const slot = index % 7;
  const code = CYCLE[slot];
  const type = ['A', 'B', 'C'].includes(code) ? 'strength' : code === 'walk' ? 'cardio' : 'recovery';
  const minutes = type === 'strength' ? (week === 1 || week === 2 || week === 7 ? 25 : 35)
    : type === 'recovery' ? 20
    : (slot === 1 ? [30, 30, 35, 35, 40, 45, 30] : [25, 25, 30, 30, 35, 40, 25])[week - 1];
  const title = type === 'strength' ? `Тренировка ${code}` : type === 'cardio' ? 'Кардио · ходьба' : 'Восстановление';
  const subtitle = code === 'A' ? 'База · 5 упражнений' : code === 'B' ? 'Устойчивость и контроль · 5 упражнений'
    : code === 'C' ? 'Полный корпус · круги' : type === 'cardio' ? 'Разговорный темп · без гири'
    : index === 48 ? 'Лёгкая прогулка · финальная оценка' : slot === 2 ? 'Мобильность + спокойная прогулка' : 'Спокойная прогулка и отдых';
  return { index, date: new Date(START_CIVIL + index * DAY_MS).toISOString().slice(0, 10), week, weekday: WEEKDAYS[slot], type, code, title, subtitle, minutes };
}

/** Base A/B prescription; circuit C applies its fixed targets when constructing the plan. */
export function getExercisePrescription(exerciseId, week) {
  assertWeek(week);
  if (!RANGE[exerciseId]) throw new RangeError(`Нет силового назначения для ${exerciseId}.`);
  const [low, high] = RANGE[exerciseId];
  const target = week === 1 || week === 7 ? low : week === 2 ? Math.min(high, low + (exerciseId === 'carry' ? 5 : 2))
    : week === 3 ? Math.min(high, low + (exerciseId === 'carry' ? 10 : 2)) : high;
  return {
    reps: exerciseId === 'carry' ? null : target,
    seconds: exerciseId === 'carry' ? target : null,
    sets: week === 1 || week === 2 || week === 7 ? 2 : 3,
    side: SIDED.has(exerciseId),
    cue: week === 5 && ['squat', 'pausesquat', 'rdl', 'deadlift', 'row'].includes(exerciseId)
      ? 'Опускайся или опускай гирю за 3 секунды. Оставляй 2–3 повтора в запасе.'
      : 'Оставляй 2–3 качественных повтора в запасе.',
  };
}

export function getPlan(index, settings = {}) {
  const day = getDay(index);
  const steps = [];
  const easy = settings.easy === true;
  const week = easy ? 1 : day.week;
  const add = (exerciseId, kind, data = {}) => {
    steps.push({ id: `${index}-${steps.length}-${exerciseId}`, exerciseId, title: EXERCISES[exerciseId].title, kind,
      set: null, sets: null, side: null, reps: null, seconds: null, ...data });
  };
  const rest = (seconds, cue, round = null) => add('cooldown', 'rest', { title: 'Отдых', seconds, cue, round });
  const addWork = (exerciseId, set, sets, override = {}, round = null) => {
    const prescription = { ...getExercisePrescription(exerciseId, week), ...override };
    const sides = prescription.side ? ['Левая', 'Правая'] : [null];
    sides.forEach((side, sideIndex) => {
      add(exerciseId, 'work', { set, sets, side, reps: prescription.reps, seconds: prescription.seconds,
        cue: prescription.cue, round });
      if (sideIndex < sides.length - 1) rest(30, 'Поставь гирю. Подготовь другую сторону.', round);
    });
  };

  if (day.type === 'cardio') {
    add('walk', 'work', { seconds: (easy ? Math.min(day.minutes, 25) : day.minutes) * 60,
      cue: 'Можно говорить фразами. Поставь на паузу, если нужен отдых.' });
    return steps;
  }
  if (day.type === 'recovery') {
    if (index % 7 === 2) add('mobility', 'work', { seconds: 600, cue: 'Мягкие движения в комфортном диапазоне.' });
    add('walk', 'work', { seconds: index % 7 === 2 ? 600 : 1200,
      cue: index === 48 ? 'Финальный день: сравни самочувствие и регулярность. Максимальные попытки не нужны.' : 'Спокойный темп. Восстановление — часть программы.' });
    return steps;
  }

  add('warmup', 'warmup', { seconds: 300, cue: EXERCISES.warmup.cues.join(' ') });
  const setCount = (position) => week === 1 || week === 2 || week === 7 ? 2 : week === 3 && position >= 3 ? 2 : 3;

  if (day.code === 'A' || day.code === 'B') {
    const exercises = day.code === 'A' ? ['squat', 'row', 'pushup', 'rdl', 'carry']
      : ['deadlift', 'lunge', settings.floorpress && !easy ? 'floorpress' : 'easypushup', 'bridge', 'deadbug'];
    exercises.forEach((exerciseId, position) => {
      const sets = setCount(position);
      for (let set = 1; set <= sets; set += 1) {
        addWork(exerciseId, set, sets);
        if (set < sets || position < exercises.length - 1) rest(90, 'Восстанови дыхание. Если нужно — добавь времени.');
      }
    });
  } else {
    // In week 3 only the first three exercises get the third round.
    // The optional swing is a separate 4 × 8 block, never multiplied by the circuit count.
    // Week 7 keeps the agreed two light sets rather than the four-set swing block.
    const useSwings = settings.swings === true && day.week >= 3 && day.week <= 6 && !easy;
    const entries = [
      { exerciseId: 'pausesquat', position: 0 },
      { exerciseId: 'row', position: 1, override: { reps: 8 } },
      ...(!useSwings ? [{ exerciseId: 'deadlift', position: 2, override: { reps: easy ? 8 : 10 } }] : []),
      { exerciseId: 'pushup', position: 3, override: { reps: week === 1 || week === 7 ? 6 : week <= 3 ? 8 : 10 } },
      { exerciseId: 'carry', position: 4, override: { seconds: easy ? 20 : 30 } },
    ];
    const rounds = Math.max(...entries.map(entry => setCount(entry.position)));
    for (let round = 1; round <= rounds; round += 1) {
      const active = entries.filter(entry => round <= setCount(entry.position));
      active.forEach((entry, entryIndex) => {
        addWork(entry.exerciseId, round, setCount(entry.position), entry.override, round);
        if (entryIndex < active.length - 1) rest(30, 'Спокойно подготовься к следующему движению.', round);
      });
      if (round < rounds) rest(90, 'Круг завершён. Восстанови дыхание перед следующим.', round);
    }
    if (useSwings) {
      rest(90, 'Отдельный блок: 4 подхода по 8 освоенных махов. Не спеши.');
      for (let set = 1; set <= 4; set += 1) {
        addWork('swing', set, 4, { reps: 8, side: false });
        if (set < 4) rest(90, 'Восстанови дыхание. При потере техники остановись.');
      }
    }
  }
  add('cooldown', 'cooldown', { seconds: 120, cue: 'Спокойная ходьба и ровное дыхание.' });
  return steps;
}

/** Includes every rest, side switch, warmup and cooldown; 4 seconds per controlled rep. */
export function estimateMinutes(index, settings = {}) {
  const seconds = getPlan(index, settings).reduce((total, step) => total + (step.seconds ?? step.reps * 4), 0);
  return Math.ceil(seconds / 60);
}
