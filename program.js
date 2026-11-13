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

const SHORT_NOTES = [
  '2 круга, нижняя граница повторений. Оставляй 2–3 повтора в запасе.',
  '2 круга. Добавь 1 повтор, только если сохраняешь технику.',
  '2 круга. Ещё 1 повтор при уверенной технике; третий круг не добавляем.',
  '2 круга. Закрепляй достигнутые повторения без отказа.',
  '2 круга. Плавные, подконтрольные движения без увеличения объёма.',
  '2 круга. Сохраняй качество и запас сил.',
  '2 лёгких круга, нижняя граница повторений. Без максимальных попыток.',
];
export function getWeekInfo(week, settings = {}) {
  assertWeek(week);
  const base = WEEKS[week - 1];
  return settings.shortSessions === false ? base : {
    ...base, sets: 2, note: SHORT_NOTES[week - 1],
    title: week === 3 ? 'Повторения без лишних кругов' : base.title,
  };
}

export const EXERCISES = {
  shortwarmup: {
    title: 'Разминка · 3 минуты', demo: 'warmup', equipment: 'Без гири · 3 минуты',
    cues: ['Начни со спокойного шага, мягко подвигай плечами.', 'Сделай 6 приседаний и 6 наклонов с отведением таза без веса.', 'По 3 неглубоких обратных выпада на ногу с опорой. Продолжай шагать до конца таймера.'],
    easier: 'Используй небольшую амплитуду и устойчивую опору. Если ещё не разогрелся, добавь времени.',
  },
  dailywarmup: {
    title: 'Разминка без гири', demo: 'warmup', equipment: 'Без гири · 3 минуты',
    cues: ['Начни с лёгкого шага на месте.', 'Мягко подвигай плечами, сделай несколько подъёмов на носки.', 'Постепенно увеличивай амплитуду. Дыши свободно.'],
    easier: 'Шагай медленнее и используй небольшую амплитуду.',
  },
  march: {
    title: 'Марш с подъёмом коленей', demo: 'march', equipment: 'Без гири · без прыжков',
    cues: ['Шагай на месте, поднимая колено до удобной высоты.', 'Корпус держи ровно, мягко ставь стопу и помогай руками.', 'Сохраняй темп, в котором можешь говорить фразами.'],
    easier: 'Обычный спокойный шаг на месте; колени поднимай ниже.',
  },
  stepjacks: {
    title: 'Шаги «джампинг-джек»', demo: 'stepjacks', equipment: 'Без гири · шаг вместо прыжка',
    cues: ['Шагни одной ногой в сторону, мягко подними руки.', 'Вернись в центр и повтори другой ногой. Обе ноги не отрывай одновременно.', 'Выбирай комфортную высоту рук, не прогибай поясницу.'],
    easier: 'Оставь руки на поясе и делай короткие шаги в стороны.',
  },
  lateralstep: {
    title: 'Приставные шаги', demo: 'lateralstep', equipment: 'Без гири · свободное место',
    cues: ['Сделай шаг в сторону и приставь другую ногу.', 'Двигайся туда и обратно, слегка смягчая колени.', 'Не скрещивай ноги. Проверь, что рядом нет препятствий.'],
    easier: 'Уменьши длину шага и темп.',
  },
  shadowboxing: {
    title: 'Бой с тенью', demo: 'shadowboxing', equipment: 'Без гири · лёгкие движения',
    cues: ['Встань устойчиво и по очереди направляй руки вперёд.', 'Двигайся легко, без силовых ударов и резкого запирания локтя.', 'Держи плечи свободными. Дыши и сохраняй разговорный темп.'],
    easier: 'Короткие движения руками на месте, без разворота корпуса.',
  },
  heelraise: {
    title: 'Подъёмы на носки', demo: 'heelraise', equipment: 'Без гири · опора при необходимости',
    cues: ['Стой ровно, при необходимости придерживайся за стену.', 'Поднимись на носки обеих ног без раскачивания.', 'Подконтрольно опусти пятки. Не пружинь.'],
    easier: 'Небольшой подъём пяток с опорой двумя руками.',
  },
  sideplank: {
    title: 'Боковая планка с колен', demo: 'sideplank', equipment: 'Без гири · по одной стороне',
    cues: ['Ляг на бок, согни колени; локоть поставь под плечом.', 'Мягко подними таз: плечо, таз и колени на одной линии.', 'Дыши свободно. Заканчивай до дрожи и потери положения.'],
    easier: 'Удерживай таз ниже или сократи время до 5–10 секунд.',
  },
  catcow: {
    title: 'Кошка — нейтральная спина', demo: 'catcow', equipment: 'Без гири · коврик',
    cues: ['Встань на четвереньки: кисти под плечами, колени под тазом.', 'Мягко округли спину на выдохе, затем вернись в нейтраль.', 'Не проваливай поясницу и не дави в крайние положения.'],
    easier: 'Делай совсем небольшое движение или удерживай нейтральную спину.',
  },
  thoracicopen: {
    title: 'Раскрытие грудного отдела', demo: 'thoracicopen', equipment: 'Без гири · по одной стороне',
    cues: ['Ляг на бок, согни колени и сложи их вместе.', 'Верхнюю руку медленно раскрой назад, сохраняя колени вместе.', 'Следи за кистью взглядом. Достаточно комфортной амплитуды.'],
    easier: 'Раскрывай руку лишь на небольшое расстояние, не тяни плечо к полу.',
  },
  hipflexor: {
    title: 'Полувыпад · растяжка бедра', demo: 'hipflexor', equipment: 'Без гири · по одной стороне',
    cues: ['Поставь одно колено на мягкий коврик, другую стопу — впереди.', 'Подтяни таз под себя и совсем немного сместись вперёд.', 'Сохраняй корпус ровным. Не прогибайся и не тяни через боль.'],
    easier: 'Держись за устойчивую опору и уменьши смещение таза.',
  },
  birddog: {
    title: 'Bird dog', demo: 'birddog', equipment: 'Без гири · по одной стороне',
    cues: ['Встань на четвереньки и держи спину спокойно.', 'Вытяни противоположные руку и ногу, не поднимая их выше корпуса.', 'Вернись без раскачивания. Сторону считай по вытягиваемой ноге.'],
    easier: 'Двигай только одной ногой, скользя носком по полу.',
  },
  hiphingebw: {
    title: 'Наклон с отведением таза', demo: 'hiphingebw', equipment: 'Без гири · техника движения',
    cues: ['Стой ровно, чуть смягчи колени.', 'Отведи таз назад, сохраняя длинную ровную спину.', 'Вернись в стойку без рывка. Амплитуда небольшая.'],
    easier: 'Встань недалеко от стены и мягко коснись её ягодицами.',
  },
  anklemobility: {
    title: 'Подвижность голеностопа', demo: 'anklemobility', equipment: 'Без гири · по одной стороне',
    cues: ['Встань в небольшой шаг и держись за опору.', 'Медленно направь переднее колено вперёд по линии носка.', 'Передняя пятка остаётся на полу. Вернись без пружины.'],
    easier: 'Сократи движение колена и перенеси меньше веса вперёд.',
  },
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

export function getDay(index, settings = {}) {
  assertIndex(index);
  const week = Math.floor(index / 7) + 1;
  const slot = index % 7;
  if (settings.dailyPractice !== false && [1,2,4,6].includes(slot)) {
    const sessions = {
      1: {code:'D',type:'conditioning',title:'D · Кондиция + корпус',subtitle:'Шаги, работа руками и боковая планка',label:'Тренировка без гири',minutes:20},
      2: {code:'E',type:'mobility',title:'E · Контроль тела',subtitle:'Спина, таз и устойчивость · лёгкий темп',label:'Практика движения',minutes:17},
      4: {code:'F',type:'conditioning',title:'F · Выносливость',subtitle:'Круги без прыжков и без гири',label:'Тренировка без гири',minutes:21},
      6: {code:'G',type:'mobility',title:'G · Техника и подвижность',subtitle:index===48?'Лёгкое занятие · финальное сравнение':'Таз, спина и координация · лёгкий темп',label:'Практика движения',minutes:17},
    };
    return {index,date:new Date(START_CIVIL+index*DAY_MS).toISOString().slice(0,10),week,weekday:WEEKDAYS[slot],usesKettlebell:false,...sessions[slot]};
  }
  const code = CYCLE[slot];
  const type = ['A', 'B', 'C'].includes(code) ? 'strength' : code === 'walk' ? 'cardio' : 'recovery';
  const minutes = type === 'strength' ? (week === 1 || week === 2 || week === 7 ? 25 : 35)
    : type === 'recovery' ? 20
    : (slot === 1 ? [30, 30, 35, 35, 40, 45, 30] : [25, 25, 30, 30, 35, 40, 25])[week - 1];
  const title = type === 'strength' ? `Тренировка ${code}` : type === 'cardio' ? 'Кардио · ходьба' : 'Восстановление';
  const subtitle = code === 'A' ? 'База · 5 упражнений' : code === 'B' ? 'Устойчивость и контроль · 5 упражнений'
    : code === 'C' ? 'Полный корпус · круги' : type === 'cardio' ? 'Разговорный темп · без гири'
    : index === 48 ? 'Лёгкая прогулка · финальная оценка' : slot === 2 ? 'Мобильность + спокойная прогулка' : 'Спокойная прогулка и отдых';
  return { index, date: new Date(START_CIVIL + index * DAY_MS).toISOString().slice(0, 10), week, weekday: WEEKDAYS[slot], type, code, title, subtitle, minutes, usesKettlebell:type==='strength', label:type==='strength'?'Силовая тренировка':type==='cardio'?'День кардио':'Восстановление' };
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
  const day = getDay(index, settings);
  if (day.type === 'conditioning' || day.type === 'mobility') return getDailyPlan(day, settings);
  if (day.type === 'strength' && settings.shortSessions !== false) return getShortStrengthPlan(day, settings);
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

function getShortStrengthPlan(day, settings) {
  const steps = [], easy = settings.easy === true;
  const low = easy || day.week === 1 || day.week === 7;
  const middle = day.week === 2;
  const rounds = easy ? 1 : 2;
  const target = (a, b) => low ? a : middle ? a + Math.ceil((b - a) / 2) : b;
  const entries = day.code === 'B'
    ? [['deadlift',8,10],['lunge',6,8],[settings.floorpress && !easy ? 'floorpress' : 'easypushup',6,8],['bridge',12,14],['deadbug',5,6]]
    : [[day.code === 'C' ? 'pausesquat' : 'squat',6,8],['row',8,10],...(day.code === 'C' ? [['deadlift',8,10],['pushup',6,8]] : [['pushup',6,8],['rdl',8,10]]),['carry',20,25]];
  const add = (exerciseId, kind, data = {}) => steps.push({id:`${day.index}-${steps.length}-${exerciseId}`,exerciseId,title:EXERCISES[exerciseId].title,kind,set:null,sets:null,side:null,reps:null,seconds:null,...data});
  const rest = (seconds, cue, round) => add('cooldown','rest',{seconds,title:'Отдых',cue,round});
  add('shortwarmup','warmup',{seconds:180,cue:EXERCISES.shortwarmup.cues.join(' ')});
  for (let round = 1; round <= rounds; round++) {
    entries.forEach(([id,a,b], position) => {
      const sides = SIDED.has(id) ? ['Левая','Правая'] : [null];
      sides.forEach((side, i) => {
        if (i) rest(15,'Поставь гирю. Спокойно поменяй сторону; при необходимости добавь отдых.',round);
        add(id,'work',{set:round,sets:rounds,round,side,reps:id === 'carry' ? null : target(a,b),seconds:id === 'carry' ? target(a,b) : null,timerCap:35,
          cue:'Оставляй 2–3 качественных повтора в запасе. Не ускоряйся ради таймера; если нужно, добавь отдых.'});
      });
      if (position < entries.length - 1) rest(30,'Спокойно подготовь следующее движение. Если дыхание не восстановилось — добавь отдых.',round);
    });
    if (round < rounds) rest(60,'Круг завершён. Восстанови дыхание перед следующим.',round);
  }
  add('cooldown','cooldown',{seconds:60,cue:'Спокойно пройдись и восстанови дыхание. При необходимости продолжи дольше.'});
  return steps;
}

function getDailyPlan(day, settings) {
  const steps=[];
  const easy=settings.easy===true, week=day.week, deload=week===7;
  const short=settings.shortSessions!==false;
  const add=(exerciseId,kind,data={})=>steps.push({id:`${day.index}-${steps.length}-${exerciseId}`,exerciseId,title:EXERCISES[exerciseId].title,kind,set:null,sets:null,side:null,reps:null,seconds:null,...data});
  const rest=(seconds,cue)=>add('cooldown','rest',{seconds,title:'Отдых',cue});
  const work=(id,round,sets,{reps=null,seconds=null,sided=false}={},cue)=>{
    (sided?['Левая','Правая']:[null]).forEach((side,i)=>{
      if(i)rest(15,'Спокойно поменяй сторону.');
      add(id,'work',{set:round,sets,round,side,reps,seconds,cue,...(short?{timerCap:35}:{})});
    });
  };
  add('dailywarmup','warmup',{seconds:180,cue:'Мягко разогрейся без гири.'});
  if(day.type==='conditioning') {
    const rounds=short?2:easy||deload?2:week<=2?3:4;
    const seconds=easy||deload?30:week<=2?35:week<=4?40:45;
    const cue='Умеренный разговорный темп. Оставь запас, не работай до предела.';
    const entries=['march','stepjacks','lateralstep','shadowboxing',...(day.code==='F'?['heelraise']:[])];
    for(let round=1;round<=rounds;round++) {
      entries.forEach((id,i)=>{
        work(id,round,rounds,id==='heelraise'?{reps:easy||deload?10:week<=2?12:15}:{seconds},cue);
        if(i<entries.length-1)rest(20,'Восстанови дыхание и подготовь следующее движение.');
      });
      if(round<rounds)rest(60,'Круг окончен. Начни следующий, когда готов.');
    }
    if(day.code==='D') {
      rest(45,'Переход к короткому блоку корпуса. Всё без гири.');
      const sets=easy||deload||week<=2?1:2;
      for(let set=1;set<=sets;set++) {
        work('sideplank',set,sets,{seconds:easy||deload?10:week<=2?15:20,sided:true},'Лёгкое удержание, без дрожи. Заверши с запасом времени.');
        if(set<sets)rest(45,'Расслабь корпус перед следующим удержанием.');
      }
    }
  } else {
    const rounds=easy||deload?1:2;
    const advanced=week>=3&&!easy&&!deload;
    const entries=day.code==='E'
      ? [['catcow',{reps:advanced?10:8}],['thoracicopen',{reps:advanced?8:6,sided:true}],['hipflexor',{seconds:advanced?30:25,sided:true}],['birddog',{reps:advanced?6:4,sided:true}],['bridge',{reps:advanced?12:10}]]
      : [['hiphingebw',{reps:advanced?12:10}],['anklemobility',{reps:advanced?10:8,sided:true}],['birddog',{reps:advanced?6:4,sided:true}],['thoracicopen',{reps:advanced?8:6,sided:true}],['catcow',{reps:advanced?10:8}]];
    const cue='Лёгкая практика: оставь не меньше 5 повторов в запасе, не накапливай усталость.';
    for(let round=1;round<=rounds;round++) {
      entries.forEach(([id,target],i)=>{
        work(id,round,rounds,target,cue);
        if(i<entries.length-1)rest(15,'Спокойно смени положение.');
      });
      if(round<rounds)rest(30,'Короткая пауза перед следующим кругом.');
    }
  }
  add('cooldown','cooldown',{seconds:short?60:120,cue:day.index===48?'Челлендж завершён. Сравни фото, замеры и качество движений без максимальных попыток.':'Спокойно восстанови дыхание и оцени самочувствие.'});
  return steps;
}

/** Stored caps travel with a queued workout; changing settings never rewrites it. */
export function stepDurationSeconds(step, settings = {}) {
  if (step.seconds != null) return step.seconds;
  if (settings.mode !== 'timer') return step.reps * 4;
  const timerSeconds = [30,40,45,60].includes(settings.timerSeconds) ? settings.timerSeconds : 40;
  return Math.min(timerSeconds, step.timerCap || timerSeconds);
}

/** Includes rest, side changes, preparation and finish; pauses remain user-controlled. */
export function estimateMinutes(index, settings = {}) {
  const seconds = getPlan(index, settings).reduce((total, step) => total + stepDurationSeconds(step,settings), 0);
  return Math.ceil(seconds / 60);
}
