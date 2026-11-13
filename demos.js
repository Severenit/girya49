/** Lightweight, offline technique schematics. No external assets or runtime. */
export const demoStyles = `
.movement-demo{margin:0;width:100%;color:#f4eedf}
.movement-demo svg{display:block;width:100%;height:auto;max-height:290px;overflow:visible}
.movement-demo .person{fill:none;stroke:#f4eedf;stroke-width:5;stroke-linecap:round;stroke-linejoin:round}
.movement-demo .far-limb{stroke:#a8a79d;stroke-width:4}
.movement-demo .weight{fill:#f5b54d;stroke:#f5b54d;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.movement-demo .weight-handle{fill:none;stroke:#f5b54d;stroke-width:3.2}
.movement-demo .floor{stroke:#525750;stroke-width:1.5;stroke-linecap:round}
.movement-demo .guide{fill:none;stroke:#f5b54d;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;opacity:.8}
.movement-demo .phase-card{fill:#ffffff;fill-opacity:.025;stroke:#f4eedf;stroke-opacity:.08;stroke-width:1}
.movement-demo .phase-label{fill:#cfcec3;font-family:inherit;font-size:11px;font-weight:600;letter-spacing:.4px;text-anchor:middle}
.movement-demo .phase-one .phase-card{animation:demo-phase 5s ease-in-out infinite}
.movement-demo .phase-two .phase-card{animation:demo-phase 5s ease-in-out 2.5s infinite}
.movement-demo .demo-caption{font-size:10px;fill:#90988b;text-anchor:middle;font-family:inherit}
@keyframes demo-phase{0%,48%,100%{fill-opacity:.025;stroke-opacity:.08}15%,35%{fill-opacity:.075;stroke:#f5b54d;stroke-opacity:.55}}
@media(prefers-reduced-motion:reduce){.movement-demo .phase-one .phase-card,.movement-demo .phase-two .phase-card{animation:none}}
`;

const path = (d, cls = '') => `<path class="person ${cls}" d="${d}"/>`;
const head = (x, y, r = 10) => `<circle class="person" cx="${x}" cy="${y}" r="${r}"/>`;
const bell = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path class="weight-handle" d="M-6-5v-4a6 6 0 0 1 12 0v4"/><path class="weight" d="M-7-5Q-13 0-10 8Q0 15 10 8Q13 0 7-5Z"/></g>`;
const arrow = (d, tip) => `<path class="guide" d="${d}"/><path class="guide" d="${tip}"/>`;
const floor = '<path class="floor" d="M20 176H160"/>';

function standingTwoHands() {
  return head(88, 27) + path('M88 39L88 102') +
    path('M88 102L103 139L111 173M111 173H125', 'far-limb') +
    path('M88 102L76 137L70 173M70 173H84') +
    path('M85 52L95 81L100 112', 'far-limb') +
    path('M89 51L103 80L106 112') + bell(104, 126, .9);
}

function standing({ goblet = false, load = false } = {}) {
  return head(88, 27) + path('M88 39L88 102') +
    path('M88 102L103 139L111 173M111 173H125', 'far-limb') +
    path('M88 102L76 137L70 173M70 173H84') +
    (goblet
      ? path('M88 50L69 68L84 64M89 50L110 68L96 64') + bell(90, 73, .82)
      : path('M88 50L104 79L106 112M88 50L69 80L65 109', 'far-limb') +
        (load ? bell(106, 128) : ''));
}

function squat() {
  return head(100, 67) + path('M100 79L77 118') +
    path('M77 118L115 138L111 173M111 173H129', 'far-limb') +
    path('M77 118L107 140L91 173M91 173H109') +
    path('M98 84L83 100L103 94M101 84L120 100L113 94') + bell(108, 103, .8);
}

function hinge({ ground = false, pulled = false } = {}) {
  const person = head(119, 62) + path('M110 73L65 109') +
    path('M65 109L83 143L86 173M86 173H105', 'far-limb') +
    path('M65 109L73 142L64 173M64 173H84');
  if (pulled) return person + path('M106 78L80 99L111 104') + bell(111, 120, .85) + path('M105 78L91 122L76 137', 'far-limb');
  if (ground) return person + path('M107 79L99 116L101 150M105 79L111 115L104 150', 'far-limb') + bell(102, 163, .86);
  return person + path('M107 79L111 114L111 143M105 79L91 122L76 137', 'far-limb') + bell(111, 155, .86);
}

function hingeTwoHands() {
  return head(119, 62) + path('M110 73L65 109') +
    path('M65 109L83 143L86 173M86 173H105', 'far-limb') +
    path('M65 109L73 142L64 173M64 173H84') +
    path('M104 79L104 112L103 139', 'far-limb') +
    path('M109 79L113 112L109 139') + bell(106, 153, .86);
}

function pushup(down = false) {
  return down
    ? head(137, 127, 9) + path('M126 132L75 139L34 151') +
      path('M34 151L25 172M25 172H40') +
      path('M123 134L103 148L125 173M125 173H141') +
      path('M119 134L99 147L119 173', 'far-limb')
    : head(135, 86, 9) + path('M125 95L75 127L34 153') +
      path('M34 153L25 172M25 172H40') +
      path('M123 98L121 135L125 173M125 173H141') +
      path('M117 102L113 137L119 173', 'far-limb');
}

function floorpress(up = false) {
  return head(30, 159, 9) + path('M42 161L96 162L126 132L148 173M148 173H163') +
    path('M91 162L121 140L140 173', 'far-limb') +
    (up
      ? path('M56 160L69 127L73 86') + bell(73, 99, .85)
      : path('M56 160L80 172L81 132') + bell(81, 145, .85));
}

function bridge(up = false) {
  return head(31, 158, 9) +
    (up
      ? path('M43 160L94 142L130 130L145 173M145 173H159') + path('M89 144L122 135L139 173', 'far-limb')
      : path('M43 162L95 163L122 127L145 173M145 173H159') + path('M91 163L116 137L139 173', 'far-limb')) +
    path('M55 157L71 170L98 172');
}

function deadbug(extended = false) {
  return head(28, 157, 9) + path('M40 160L91 161') +
    (extended
      ? path('M55 158L64 129L67 104M91 161L120 164L159 168', 'far-limb') + path('M55 157L33 132L16 109M91 161L105 128L136 127')
      : path('M55 157L63 129L67 103M91 161L105 125L142 125') + path('M55 158L53 130L55 105M91 161L96 119L129 119', 'far-limb'));
}

function lunge() {
  return head(89, 41) + path('M89 53L89 110') +
    path('M89 110L117 158L145 170M145 170L153 173', 'far-limb') +
    path('M89 110L56 122L51 173M51 173H69') +
    path('M89 65L72 83L86 89M89 65L108 82L96 89');
}

function walk(other = false, loaded = false) {
  return head(89, 27) + path('M89 39L87 102') +
    path(other ? 'M87 102L66 137L48 171M48 171H65' : 'M87 102L103 139L126 172M126 172H142', 'far-limb') +
    path(other ? 'M87 102L107 137L122 173M122 173H140' : 'M87 102L73 140L55 173M55 173H73') +
    (loaded ? path('M89 51L110 79L110 113M89 51L64 79L72 95', 'far-limb') + bell(110, 128, .85)
      : path(other ? 'M89 51L108 77L91 97M89 51L69 80L80 97' : 'M89 51L67 77L81 95M89 51L111 79L102 96'));
}

function swing(up = false) {
  return up
    ? head(79, 27) + path('M79 39L79 102M79 102L66 139L61 173M61 173H79M79 102L99 140L110 173M110 173H127') + path('M79 51L112 53L147 55') + `<g transform="rotate(-90 158 57)">${bell(158, 57, .9)}</g>`
    : head(120, 68) + path('M111 78L62 111M62 111L79 142L67 173M67 173H84M62 111L103 144L114 173M114 173H131') + path('M107 81L86 115L72 134') + bell(66, 145, .9);
}

function mobility(second = false) {
  return second
    ? head(58, 99, 9) + path('M68 104L112 127M112 127L126 153L126 173M126 173H144M72 108L61 140L61 173M61 173H78') + path('M112 127L100 151L84 174', 'far-limb')
    : head(53, 119, 9) + path('M65 122Q88 102 111 125M111 125L126 151L126 173M126 173H144M70 122L61 145L61 173M61 173H78') + path('M111 125L101 151L84 174', 'far-limb');
}

// Low-impact and floor movements: two key positions, without external assets.
function march(lifted = false) {
  return head(88, 27) + path('M88 39L88 103') +
    path('M88 103L76 138L74 173M74 173H90') +
    path(lifted ? 'M88 103L114 123L122 151M122 151H137' : 'M88 103L104 139L108 173M108 173H124', 'far-limb') +
    path(lifted ? 'M88 52L108 76L93 92M88 52L69 79L76 100' : 'M88 52L71 80L66 109M88 52L107 80L111 109');
}

function stepJack(open = false) {
  return head(90, 27) + path('M90 39L90 104') +
    path(open ? 'M90 104L119 140L140 173M140 173H155' : 'M90 104L102 140L105 173M105 173H120', 'far-limb') +
    path('M90 104L78 140L74 173M74 173H89') +
    path(open ? 'M84 52L64 32L58 12M96 52L116 32L122 12' : 'M84 52L67 81L65 111M96 52L112 81L115 111');
}

function lateralStep(wide = false) {
  const x = wide ? 103 : 79;
  return head(x, 27) + path(`M${x} 39L${x} 104`) +
    path(wide ? 'M103 104L126 141L145 173M145 173H160' : 'M79 104L93 140L99 173M99 173H114', 'far-limb') +
    path(wide ? 'M103 104L82 140L65 173M65 173H80' : 'M79 104L67 140L63 173M63 173H78') +
    path(`M${x} 52L${x-18} 79L${x-10} 96M${x} 52L${x+19} 79L${x+10} 96`) +
    (wide ? arrow('M25 111H49', 'M41 104L49 111L41 118') : '');
}

function shadowbox(punch = false) {
  return head(88, 35) + path('M88 47L80 108') +
    path('M80 108L102 139L121 173M121 173H137', 'far-limb') +
    path('M80 108L61 139L45 173M45 173H63') +
    path('M84 61L67 80L73 55', 'far-limb') +
    path(punch ? 'M88 62L123 68L155 59' : 'M88 62L109 87L116 59');
}

function heelRaise(raised = false) {
  const y = raised ? -9 : 0;
  return '<path class="floor" d="M145 48V176"/>' +
    head(83, 29 + y) + path(`M83 ${41+y}L83 ${103+y}`) +
    path(raised ? 'M83 94L92 132L92 160L120 173' : 'M83 103L94 140L94 173H122', 'far-limb') +
    path(raised ? 'M83 94L78 132L77 160L105 173' : 'M83 103L78 140L77 173H105') +
    path(`M83 ${53+y}L111 ${72+y}L145 65M83 ${53+y}L67 ${80+y}L70 ${104+y}`);
}

function sidePlank(raised = false) {
  return head(43, raised ? 112 : 134, 9) +
    path(raised ? 'M54 119L65 125L102 149L139 173L154 154H164' : 'M54 141L65 147L102 170L139 173L154 154H164') +
    path(raised ? 'M65 125L67 173H44M65 125L85 119L103 148' : 'M65 147L67 173H44M65 147L85 144L102 166') +
    path(raised ? 'M100 151L135 173L150 156' : 'M100 173L135 173L150 156', 'far-limb');
}

function thoracicOpen(open = false) {
  return head(32, 152, 9) + path('M44 157L57 158L104 160L131 137L153 161') +
    path('M103 163L132 141L154 165M54 161L80 141L106 123', 'far-limb') +
    path(open ? 'M57 158L37 133L17 114' : 'M57 158L83 137L109 120');
}

function hipFlexor(forward = false) {
  const x = forward ? 88 : 77;
  return '<path class="floor" d="M145 88V176M128 88H160"/>' +
    head(x, 36) + path(`M${x} 48L${x} 111`) +
    path(`M${x} 111L54 173H27M27 173H20`, 'far-limb') +
    path(`M${x} 111L${forward?122:111} 123L111 173H129`) +
    path(`M${x} 61L110 79L145 88M${x} 61L${x-11} 88L${x+9} 115`);
}

function birdDog(extended = false) {
  return head(44, 96, 9) + path('M54 103L65 109L116 109') +
    path(extended ? 'M71 111L74 142L74 173H86M116 111L143 109L165 109L169 116' : 'M71 111L74 142L74 173H86M116 111L128 170H154', 'far-limb') +
    path('M116 109L121 173H151') +
    path(extended ? 'M65 109L42 109H16' : 'M65 109L65 142L65 173H77');
}

function hipHingeBW() {
  return head(119, 62) + path('M110 73L65 109') +
    path('M65 109L83 143L86 173M86 173H105M104 79L85 102L66 110', 'far-limb') +
    path('M65 109L73 142L64 173M64 173H84M109 79L92 103L66 110');
}

function ankleMobility(forward = false) {
  const x = forward ? 88 : 78;
  return '<path class="floor" d="M148 45V176"/>' +
    head(x, forward ? 33 : 30) + path(`M${x} ${forward?45:42}L${x} ${forward?105:103}`) +
    path(`M${x} ${forward?105:103}L62 139L53 173H70`, 'far-limb') +
    path(`M${x} ${forward?105:103}L${forward?116:103} 132L101 173H127`) +
    path(`M${x} ${forward?56:53}L113 74L148 64`);
}

function catCow(rounded = false) {
  return head(rounded ? 49 : 44, rounded ? 113 : 97, 9) +
    path(rounded ? 'M60 113L65 113Q89 97 116 113' : 'M55 104L65 110H116') +
    path(`M72 ${rounded?114:112}L74 173H86M116 ${rounded?114:112}L128 170H154`, 'far-limb') +
    path(`M65 ${rounded?113:110}L65 173H77M116 ${rounded?113:110}L121 173H151`);
}

const demos = {
  squat: { title: 'Гоблет-присед: стойка и нижнее положение', labels: ['СТОЙКА', 'ПРИСЕД'], poses: [standing({ goblet: true }), squat()], note: 'Схема движения · глубина по самочувствию' },
  pausesquat: { title: 'Гоблет-присед с паузой в нижнем положении', labels: ['СТОЙКА', 'ПАУЗА 1–2 С'], poses: [standing({ goblet: true }), squat()], note: 'Удерживайте напряжение во время паузы' },
  row: { title: 'Тяга одной рукой: гиря под плечом и у таза', labels: ['ОПУСТИТЬ', 'ЛОКОТЬ К ТАЗУ'], poses: [hinge(), hinge({ pulled: true })], note: 'Свободная рука опирается на бедро · спина ровная' },
  pushup: { title: 'Отжимание: прямая линия корпуса вверху и внизу', labels: ['ПЛАНКА', 'ОПУСТИТЬСЯ'], poses: [pushup(), pushup(true)], note: 'Можно от устойчивой высокой опоры' },
  rdl: { title: 'Румынская тяга: стойка и наклон от таза', labels: ['СТОЙКА', 'ТАЗ НАЗАД'], poses: [standingTwoHands(), hingeTwoHands()], note: 'Гиря близко к ногам · держите двумя руками' },
  deadlift: { title: 'Становая тяга: гиря с пола и выпрямление', labels: ['ПОДГОТОВКА', 'ВЫПРЯМИТЬСЯ'], poses: [hinge({ ground: true }), standingTwoHands()], note: 'Держите гирю двумя руками · при необходимости поднимите опору' },
  carry: { title: 'Переноска: ходьба с гирей сбоку', labels: ['ШАГ', 'СЛЕДУЮЩИЙ ШАГ'], poses: [walk(false, true), walk(true, true)], note: 'Корпус вертикально · затем поменяйте руку' },
  lunge: { title: 'Обратный выпад: стойка и шаг назад', labels: ['СТОЙКА', 'ШАГ НАЗАД'], poses: [standing(), lunge()], note: 'Начните без гири · при необходимости держитесь за опору' },
  floorpress: { title: 'Жим лёжа на полу: локоть на полу и рука вверху', labels: ['ЛОКОТЬ НА ПОЛУ', 'ЖИМ ВВЕРХ'], poses: [floorpress(), floorpress(true)], note: 'При тяжёлой гире выберите отжимания от опоры' },
  bridge: { title: 'Ягодичный мост: таз на полу и подъём таза', labels: ['НА ПОЛУ', 'ПОДНЯТЬ ТАЗ'], poses: [bridge(), bridge(true)], note: 'Давите пятками · не переразгибайте поясницу' },
  deadbug: { title: 'Dead bug: исходное положение и противоположные рука и нога', labels: ['РУКИ И НОГИ ВВЕРХ', 'РУКА + ДРУГАЯ НОГА'], poses: [deadbug(), deadbug(true)], note: 'Поясница сохраняет контакт с полом · чередуйте стороны' },
  swing: { title: 'Махи гирей: таз назад и выпрямление таза', labels: ['ТАЗ НАЗАД', 'РАЗГИБАНИЕ ТАЗА'], poses: [swing(), swing(true)], note: 'Только после освоения техники · по умолчанию становая тяга' },
  walk: { title: 'Кардио: спокойная или быстрая ходьба', labels: ['ШАГ', 'ДЫШИТЕ СВОБОДНО'], poses: [walk(), walk(true)], note: 'Умеренный темп: можете говорить полными фразами' },
  mobility: { title: 'Мягкая подвижность спины в опоре на руки и колени', labels: ['МЯГКО ОКРУГЛИТЬ', 'ВЕРНУТЬСЯ'], poses: [mobility(), mobility(true)], note: 'Без боли · небольшая комфортная амплитуда' },
  march: { title: 'Ходьба на месте без прыжков', labels: ['СТОЙКА', 'ШАГ НА МЕСТЕ'], poses: [march(), march(true)], note: 'По очереди поднимайте колени на комфортную высоту. Дышите свободно.', caption: 'Колени на удобную высоту · без прыжков' },
  stepjacks: { title: 'Шаг в сторону с подъёмом рук без прыжка', labels: ['СТОЙКА', 'ШАГ + РУКИ ВВЕРХ'], poses: [stepJack(), stepJack(true)], note: 'Шагните в сторону и поднимите руки в комфортной амплитуде, затем вернитесь. Чередуйте стороны без прыжков.', caption: 'Шагайте без прыжков · руки по комфорту' },
  lateralstep: { title: 'Приставной шаг в сторону', labels: ['СТОЙКА', 'ШАГ В СТОРОНУ'], poses: [lateralStep(), lateralStep(true)], note: 'Мягко шагните в сторону, приставьте вторую ногу и вернитесь в другую сторону. Без гири и прыжков.', caption: 'Мягкие шаги вправо и влево · без гири' },
  shadowboxing: { title: 'Лёгкие удары руками в воздух', labels: ['РУКИ У ЛИЦА', 'МЯГКИЙ УДАР'], poses: [shadowbox(), shadowbox(true)], note: 'Легко вытягивайте руку и возвращайте к лицу. Сохраняйте устойчивую стойку, не выпрямляйте локоть резко до упора.', caption: 'Лёгкие удары · локоть остаётся мягким' },
  heelraise: { title: 'Подъём на носки с устойчивой опорой', labels: ['СТОПЫ НА ПОЛУ', 'ПОДНЯТЬ ПЯТКИ'], poses: [heelRaise(), heelRaise(true)], note: 'Держитесь за устойчивую опору, поднимите пятки и плавно опустите. Не раскачивайтесь.', caption: 'Держитесь за опору · опускайтесь плавно' },
  sideplank: { title: 'Боковая планка на предплечье и согнутых коленях', labels: ['НА БОКУ', 'ПОДНЯТЬ ТАЗ'], poses: [sidePlank(), sidePlank(true)], note: 'Локоть под плечом. Поднимите таз до линии плечо — таз — колени; колени остаются согнутыми на полу. Не задерживайте дыхание.', caption: 'Предплечье и колени — опора · таз ровно' },
  thoracicopen: { title: 'Открытая книга лёжа на боку', labels: ['ЛАДОНИ ВМЕСТЕ', 'ОТКРЫТЬ РУКУ'], poses: [thoracicOpen(), thoracicOpen(true)], note: 'Лёжа на боку держите согнутые колени вместе. Откройте верхнюю руку в комфортном диапазоне без разворота таза и рывков.', caption: 'Колени вместе · таз остаётся на месте' },
  hipflexor: { title: 'Мягкое растяжение сгибателей бедра на одном колене', labels: ['НА ОДНОМ КОЛЕНЕ', 'МЯГКО ВПЕРЁД'], poses: [hipFlexor(), hipFlexor(true)], note: 'Опирайтесь рукой на устойчивую опору. Из положения на одном колене мягко подайте таз вперёд, сохраняя корпус вертикально и поясницу нейтрально.', caption: 'Таз немного вперёд · без прогиба в спине' },
  birddog: { title: 'Противоположные рука и нога из положения на четвереньках', labels: ['ЧЕТВЕРЕНЬКИ', 'РУКА + ДРУГАЯ НОГА'], poses: [birdDog(), birdDog(true)], note: 'Вытяните противоположные руку и ногу до уровня корпуса. Сохраняйте ровный таз и нейтральную поясницу. Чередуйте стороны.', caption: 'Противоположные рука и нога · без прогиба' },
  hiphingebw: { title: 'Отведение таза назад без веса', labels: ['СТОЙКА', 'ТАЗ НАЗАД'], poses: [standing(), hipHingeBW()], note: 'Колени слегка согнуты. Отведите таз назад, наклоняя прямой корпус, и вернитесь в стойку. Без гири.', caption: 'Таз назад · мягкие колени · спина ровная' },
  anklemobility: { title: 'Подвижность голеностопа у устойчивой опоры', labels: ['ПЯТКА НА ПОЛУ', 'КОЛЕНО ВПЕРЁД'], poses: [ankleMobility(), ankleMobility(true)], note: 'Держитесь за опору. Мягко направляйте переднее колено по линии носка, сохраняя пятку на полу. Вернитесь без рывка.', caption: 'Колено по линии носка · пятка на полу' },
  catcow: { title: 'Мягкое округление спины и возвращение к нейтрали', labels: ['НЕЙТРАЛЬНО', 'МЯГКО ОКРУГЛИТЬ'], poses: [catCow(), catCow(true)], note: 'На четвереньках слегка округлите спину и вернитесь к нейтральному положению. Не проваливайтесь в глубокий прогиб.', caption: 'Мягко округлите · вернитесь к нейтрали' },
  warmup: { title: 'Разминка: ходьба на месте и лёгкий присед без гири', labels: ['ШАГАЙТЕ НА МЕСТЕ', 'ПРИСЕД БЕЗ ГИРИ'], poses: [walk(), head(100, 67) + path('M100 79L77 118M77 118L107 140L91 173M91 173H109M77 118L115 138L111 173M111 173H129M98 84L112 101L134 102')], note: 'Начните легко · движения без веса' },
};

/** Returns a two-position SVG schematic; id must be one of the exported demoIds. */
export function renderDemo(id) {
  const demo = demos[id] || demos.warmup;
  return `<figure class="movement-demo"><svg viewBox="0 0 400 226" role="img" aria-label="${demo.title}" xmlns="http://www.w3.org/2000/svg"><title>${demo.title}</title>${demo.poses.map((pose, index) => `<g class="demo-position phase-${index === 0 ? 'one' : 'two'}" transform="translate(${index === 0 ? 8 : 212} 6)"><rect class="phase-card" x="0" y="0" width="180" height="202" rx="16"/>${floor}${pose}<text class="phase-label" x="90" y="194">${demo.labels[index]}</text></g>`).join('')}<text class="demo-caption" x="200" y="222">${demo.caption || 'Схема техники · двигайтесь плавно'}</text></svg><figcaption class="sr-only">${demo.note}</figcaption></figure>`;
}

export const demoIds = Object.freeze(Object.keys(demos));
