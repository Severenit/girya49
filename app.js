import { WEEKS, EXERCISES, getDay, getPlan, dateIndex } from './program.js';
import { renderDemo, demoStyles } from './demos.js';
import { createBodyProgress } from './body-progress.js';
import { createBackup, readBackup, restoreBackup, MAX_BACKUP_BYTES } from './backup.js';

const KEY = 'girya49-v1';
const PHOTOS = Object.freeze({
  squat:'squat', pausesquat:'squat', row:'row', pushup:'pushup', easypushup:'pushup',
  rdl:'rdl', carry:'carry', deadlift:'deadlift', lunge:'lunge', floorpress:'floorpress',
  bridge:'bridge', deadbug:'deadbug', swing:'swing', walk:'walk', mobility:'mobility'
});
function renderPhoto(exerciseId) {
  const ex = EXERCISES[exerciseId];
  const photo = PHOTOS[exerciseId];
  if (!photo) return renderDemo(ex?.demo || 'warmup');
  return `<figure class="exercise-photo"><img src="./photos/${photo}.jpg" alt="${escape(ex.title)}: фото-иллюстрация положения тела" width="1200" height="800" decoding="async" fetchpriority="high" data-demo="${ex.demo}"><figcaption>Фото-иллюстрация</figcaption></figure>`;
}
const defaults = { sound: true, vibration: true, mode: 'reps', timerSeconds: 40, floorpress: false, swings: false, easy: false, dailyPractice: true };
const app = document.querySelector('#app');
const style = document.createElement('style'); style.textContent = demoStyles; document.head.append(style);
let storageOK = true;
let saved;
try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { storageOK = false; }
let state = normalize(saved);
let view = 'home';
let selected = Math.max(0, Math.min(48, dateIndex()));
let audioContext, wakeLock, deferredInstall, registration, toastTimeout;
let backupBusy = false;
const bodyProgress = createBodyProgress({ onError: error => toast(error?.message || String(error)) });
const icons = {
  bell: '<path d="M8 8V6a4 4 0 0 1 8 0v2M7 8h10l3 9a3 3 0 0 1-3 4H7a3 3 0 0 1-3-4Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  play: '<path d="m9 5 11 7-11 7Z"/>',
  settings: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  leaf: '<path d="M5 19c-5-10 2-15 15-15 0 13-5 19-15 15Zm0 0L15 9"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  volume: '<path d="m4 9 4 0 5-4v14l-5-4H4Zm12-1q5 4 0 8m3-11q7 7 0 14"/>',
};
function icon(name) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.info}</svg>`; }
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time = seconds => `${Math.floor(Math.max(0, seconds) / 60).toString().padStart(2,'0')}:${Math.floor(Math.max(0, seconds) % 60).toString().padStart(2,'0')}`;
function sanitizeSteps(steps) {
  if (!Array.isArray(steps) || !steps.length || steps.length > 500) return null;
  const bounded = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
  const result = [];
  for (const s of steps) {
    if (!s || typeof s.exerciseId !== 'string' || !Object.hasOwn(EXERCISES,s.exerciseId) || !['work','rest','warmup','cooldown'].includes(s.kind)) return null;
    if (s.reps != null && !bounded(s.reps,1,100)) return null;
    if (s.seconds != null && !bounded(s.seconds,1,3600)) return null;
    if (s.reps == null && s.seconds == null) return null;
    if (s.kind === 'rest' && !bounded(s.seconds,1,3600)) return null;
    if (s.side != null && !['Левая','Правая'].includes(s.side)) return null;
    for (const key of ['set','sets','round']) if(s[key] != null && !bounded(s[key],1,20)) return null;
    result.push({id:String(s.id || result.length).slice(0,80),exerciseId:s.exerciseId,title:s.kind==='rest'?'Отдых':EXERCISES[s.exerciseId].title,kind:s.kind,reps:s.reps??null,seconds:s.seconds??null,side:s.side??null,set:s.set??null,sets:s.sets??null,round:s.round??null,cue:typeof s.cue==='string'?s.cue.slice(0,500):''});
  }
  return result;
}
function normalize(data) {
  const result = { version: 1, settings: {...defaults}, completions: {}, active: null };
  if (!data || data.version !== 1) return result;
  for (const key of ['sound','vibration','floorpress','swings','easy','dailyPractice']) if (typeof data.settings?.[key] === 'boolean') result.settings[key] = data.settings[key];
  if (['reps','timer'].includes(data.settings?.mode)) result.settings.mode = data.settings.mode;
  if ([30,40,45,60].includes(data.settings?.timerSeconds)) result.settings.timerSeconds = data.settings.timerSeconds;
  for (let i = 0; i < 49; i++) if (['complete','partial'].includes(data.completions?.[i]?.status)) result.completions[i] = {status:data.completions[i].status,at:String(data.completions[i].at || ''),skipped:Number(data.completions[i].skipped)||0};
  const a = data.active;
  const cleanSteps = sanitizeSteps(a?.steps);
  if (a && Number.isInteger(a.day) && a.day >= 0 && a.day < 49 && cleanSteps && Number.isInteger(a.position) && a.position >= 0 && a.position <= a.steps.length) {
    result.active = {day:a.day,title:typeof a.title==='string'?a.title.slice(0,100):getDay(a.day,{dailyPractice:false}).title,planCode:typeof a.planCode==='string'?a.planCode.slice(0,20):getDay(a.day,{dailyPractice:false}).code,steps:cleanSteps,position:a.position,timer:null,skipped:Array.isArray(a.skipped)? a.skipped.filter(n=>Number.isInteger(n)&&n>=0&&n<a.steps.length):[], startedAt:Number(a.startedAt)||Date.now()};
    if (a.timer) {
      const remaining = a.timer.running ? Math.max(0,Number(a.timer.deadline)-Date.now()) : Number(a.timer.remaining);
      result.active.timer = {duration: Math.max(0, Math.min(3600000, Number(a.timer.duration)||0)), remaining: Math.max(0,Math.min(3600000,remaining||0)), running:false, finished:remaining<=0, deadline:null};
    }
  }
  return result;
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageOK = false; }
  document.querySelector('#storage-warning').hidden = storageOK;
}
function toast(message) { const el = document.querySelector('#toast'); el.textContent=message; el.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove('visible'),4000); }
function completedCount() { return Object.values(state.completions).filter(v=>v.status==='complete').length; }
function displayDate(day) { return new Intl.DateTimeFormat('ru', {day:'numeric', month:'long'}).format(new Date(`${day.date}T12:00:00`)); }
function header() {
  return `<header class="topbar"><button class="brand" data-action="home" aria-label="Гиря 49, на главный экран">${icon('bell')}<span><strong>ГИРЯ 49<span style="color:#79886d">.</span></strong><small>ОДНА ГИРЯ. СЕМЬ НЕДЕЛЬ.</small></span></button><nav class="nav" aria-label="Основная навигация"><button data-action="home" class="${view==='home'?'active':''}">Сегодня</button><button data-action="calendar" class="${view==='calendar'?'active':''}">49 дней</button><button data-action="body" class="${view==='body'?'active':''}">До / после</button><button data-action="settings" class="${view==='settings'?'active':''}" aria-label="Настройки">${icon('settings')}</button></nav><span class="desktop-date">13.11 — 31.12 / 2026</span></header>`;
}
function dayChip(index) {
  const d=getDay(index,state.settings), status=state.completions[index]?.status;
  return `<button class="day-chip ${index===selected?'selected':''} ${index===dateIndex()?'today':''} ${status==='complete'?'done':status==='partial'?'partial':''}" data-action="day" data-day="${index}" aria-label="День ${index+1}, ${displayDate(d)}, ${d.title}${status==='complete'?', выполнен':status==='partial'?', частично':''}" ${index===selected?'aria-current="date"':''}><span class="dow">${d.weekday}</span><span class="num">${Number(d.date.slice(-2))}</span><i aria-hidden="true">${status==='complete'?'✓':''}</i></button>`;
}
function footer() { return `<footer class="footer"><span><i class="offline-dot"></i><span id="offline-status">${navigator.onLine?'Прогресс на этом устройстве':'Без сети · можно тренироваться'}</span></span><span>16 КГ · БЕЗ АККАУНТА</span></footer>`; }
function estimatedMinutes(index) {
  const seconds=getPlan(index,state.settings).reduce((total,s)=>total+(s.seconds || (state.settings.mode==='timer'?state.settings.timerSeconds:(s.reps||8)*4)),0);
  return Math.ceil(seconds/60);
}
function home() {
  const d=getDay(selected,state.settings), w=WEEKS[d.week-1], steps=getPlan(selected,state.settings);
  const unique=[...new Set(steps.filter(s=>s.kind==='work').map(s=>s.exerciseId))];
  const first=unique[0] || 'mobility';
  const hasWarmup=steps[0]?.kind==='warmup';
  const rhythm=state.settings.dailyPractice?'21 силовая · 14 на кондицию<br>14 на контроль и подвижность':'21 силовая · 14 кардио<br>14 дней восстановления';
  const done=state.completions[selected]; const resume=state.active?.day===selected;
  return `<div class="shell">${header()}<main class="overview"><aside class="sidebar"><div class="journey"><div class="eyebrow">До Нового года — в движении</div><div class="count">${completedCount()} <span>/ 49 дней</span></div><div class="progress"><span style="width:${completedCount()/49*100}%"></span></div><p>${rhythm}</p></div><section><div class="week-heading"><h2>Неделя ${d.week} <small>/ 7</small></h2><select class="week-select" id="week-select" aria-label="Выбрать неделю">${WEEKS.map((_,i)=>`<option value="${i}" ${i===d.week-1?'selected':''}>${i+1} · ${WEEKS[i].dates}</option>`).join('')}</select></div><div class="week-grid">${Array.from({length:7},(_,i)=>dayChip((d.week-1)*7+i)).join('')}</div><p class="week-note"><strong>A/B/C · ${w.title}.</strong><br>${w.note}</p></section><div class="sidebar-tip"><strong>Главное — вернуться завтра.</strong><br>Оставляй 2–3 повтора в запасе. Если тяжело, выбери облегчённую тренировку в настройках. Пропуски не нужно наверстывать.</div></aside><section class="today"><div class="home-heading"><span class="date-label">${selected===dateIndex()?'Сегодня · ':''}${d.weekday}, ${displayDate(d)}</span><span class="tag"><i></i>${done?.status==='complete'?'Выполнено':done?.status==='partial'?'Частично':`День ${selected+1} из 49`}</span></div><article class="hero"><div class="hero-head"><div><div class="eyebrow">${escape(d.label)} · <span class="nowrap">Неделя ${d.week}</span></div><h1>${escape(d.title)}</h1><p>${escape(d.subtitle)}</p></div><span class="letter-badge">${['walk','recovery'].includes(d.code)?(d.code==='walk'?'↗':'↺'):d.code}</span></div><div class="hero-demo photo-demo">${renderPhoto(first)}</div><div class="hero-meta"><span>${icon('clock')}${estimatedMinutes(selected)} мин</span><span>${icon(d.usesKettlebell?'bell':'leaf')}${unique.length} упражнений</span><span>${d.type==='strength'?(state.settings.easy?'Легче':`${d.week===3?'2–3':w.sets} подхода`):'Без гири'}</span></div></article><div class="section-label"><h2>Сегодня в работе</h2><button class="text-button" data-action="week-help">Нагрузка недели</button></div><ol class="exercise-list">${unique.map((id,i)=>{
    const targets=steps.filter(s=>s.kind!=='rest'&&s.exerciseId===id); const s=targets[0]; const ex=EXERCISES[id];
    return `<li class="exercise-row"><span class="exercise-number">${String(i+1).padStart(2,'0')}</span><div><div class="name">${ex.title}</div><div class="detail">${s?.reps?`${s.reps} повторений${s.side?' на сторону':''}`:`${s?.seconds>=60?`${Math.round(s.seconds/60)} мин`:`${s?.seconds||30} сек`}${s?.side?' на сторону':''}`} · ${ex.equipment.includes('16')?'16 кг':'без веса'}</div></div><span class="row-meta">${s.set?`${Math.round(targets.length/(s.side?2:1))} подх.`:''}</span><button data-action="technique" data-exercise="${id}" aria-label="Техника: ${ex.title}">${icon('info')}</button></li>`;
  }).join('')}</ol><div class="start-wrap"><button class="button primary" data-action="start">${icon(resume?'play':'arrow')}${resume?'Продолжить тренировку':done?'Повторить тренировку':hasWarmup?'Начать с разминки':'Начать занятие'}</button><p>${resume?'Текущий шаг сохранён':hasWarmup?`${Math.round(steps[0].seconds/60)} мин разминки включены · работай в своём темпе`:'В комфортном темпе'}</p></div>${state.active&&!resume?`<button class="text-button" data-action="resume">Есть сохранённая тренировка: день ${state.active.day+1} →</button>`:''}${footer()}</section></main></div>`;
}
function calendar() {
  return `<div class="shell">${header()}<main><div class="view-head"><div><div class="eyebrow">13 ноября — 31 декабря 2026</div><h1 style="margin-top:10px">${state.settings.dailyPractice?'49 дней тренировок.':'49 дней движения.'}</h1><p>${completedCount()} выполнено. Каждый день — свой вид нагрузки.</p></div><span class="pill">${Math.round(completedCount()/49*100)}%</span></div><div class="calendar-weeks">${WEEKS.map((w,i)=>`<section class="calendar-week"><h2>Неделя ${i+1} · ${w.title}</h2><p>${w.dates} · Силовые A/B/C: ${w.note}</p><div class="week-grid">${Array.from({length:7},(_,j)=>dayChip(i*7+j)).join('')}</div></section>`).join('')}</div><div class="legend"><span><b>✓</b> Выполнено</span><span>● Частично — были пропуски</span><span>${state.settings.dailyPractice?'A/B/C · гиря; D/F · кондиция; E/G · контроль':'Пт A · Пн B · Ср C'}</span></div>${footer()}</main></div>`;
}
function setting(key,title,description) { return `<label class="setting"><span><strong>${title}</strong><small>${description}</small></span><input type="checkbox" data-setting="${key}" ${state.settings[key]?'checked':''}></label>`; }
function settings() {
  return `<div class="shell">${header()}<main class="settings-layout"><div class="view-head"><div><h1>В твоём темпе.</h1><p>Настройки нагрузки применяются к новой тренировке.</p></div></div><section class="settings-card"><h2>Во время тренировки</h2>${setting('sound','Звуковой сигнал','В конце таймера. Нажми «Проверить сигнал», чтобы разрешить звук.')}${setting('vibration','Вибрация','Если телефон и браузер поддерживают. На iPhone обычно недоступна.')}<label class="setting"><span><strong>Время на подход</strong><small>Для режима таймера. Число повторений остаётся ориентиром: не ускоряйся ради таймера.</small></span><select data-setting="timerSeconds">${[30,40,45,60].map(n=>`<option ${state.settings.timerSeconds===n?'selected':''} value="${n}">${n} сек</option>`).join('')}</select></label><button class="button secondary" data-action="test-signal">${icon('volume')}Проверить сигнал</button></section><section class="settings-card"><h2>Нагрузка</h2>${setting('dailyPractice','Занятия каждый день','A/B/C — силовые с гирей; D/F — кондиция без прыжков; E/G — лёгкие круги на контроль и подвижность. Выключи, чтобы вернуть исходные дни прогулок.')}<p class="status-note">Выбранный режим применяется к новой тренировке. Начатое занятие можно продолжить с прежнего шага.</p>${setting('easy','Облегчённая тренировка','На силовых — 2 подхода и нижняя граница повторений. В D–G — короче интервалы и меньше кругов. Без махов и тяжёлого жима. При необходимости выбери вариант без веса.')}${setting('floorpress','Жим 16 кг вместо отжиманий в B','Включай, только если уверенно контролируешь гирю и умеешь безопасно лечь и встать с ней.')}${setting('swings','Техника махов уже освоена','На неделях 3–6 заменяет становую в C отдельным блоком 4 × 8. Освой движение с тренером; чистая тяга сама по себе не подтверждает технику маха.')}<p class="status-note">Любой вариант — по самочувствию. Фото-иллюстрации созданы с помощью ИИ. Для разбора движения открой схему и короткие подсказки под упражнением.</p></section><section class="settings-card"><h2>На главный экран</h2>${deferredInstall?'<button class="button primary" data-action="install">Установить приложение</button>':''}<p class="install-note">iPhone: открой в Safari → «Поделиться» → «На экран Домой». Android: меню браузера → «Установить приложение» или «Добавить на главный экран».</p><p class="install-note">Для работы без сети сначала открой приложение онлайн. ${window.isSecureContext?'Офлайн-версия сохранится автоматически.':'Установка и офлайн требуют HTTPS; по локальному HTTP работает обычная страница.'}</p>${registration?.waiting?'<div class="new-update">Новая версия готова.<button data-action="update">Обновить</button></div>':''}</section><section class="settings-card"><h2>Твой прогресс</h2><p class="help-copy">Отметки, фото и замеры хранятся только в этом браузере. Полная копия включает всё: сохрани её у себя для переноса на другой телефон. Очистка данных сайта удалит записи.</p><div class="settings-actions"><button class="button secondary" data-action="export">Скачать полную копию</button><button class="button outline" data-action="import">Восстановить копию</button></div><button class="text-button danger" data-action="reset">Сбросить отметки тренировок</button></section><section class="settings-card"><h2>Коротко о безопасности</h2><div class="help-copy"><p>Оставляй 2–3 качественных повтора в запасе. Острая боль, головокружение, боль в груди или необычная одышка — повод остановиться.</p><p>Если упражнение тяжело с 16 кг, выбирай облегчение или пропускай его. В E/G оставляй большой запас и заканчивай без выраженного утомления. Halo и протяжки в программу не включены.</p><p>Кардио — в темпе, в котором можешь говорить фразами. Эта программа не подменяет персональную оценку нагрузки.</p></div><p class="plain-link" style="margin-top:14px">Ориентиры: <a href="https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html" target="_blank" rel="noopener">интенсивность, CDC</a> · <a href="https://www.acefitness.org/resources/pros/expert-articles/5269/how-to-get-started-with-kettlebells/" target="_blank" rel="noopener">основы работы с гирей, ACE</a></p></section>${footer()}</main></div>`;
}
function current() { return state.active?.steps[state.active.position]; }
function durationFor(step) { return step.seconds || (step.kind==='rest'?90:state.settings.timerSeconds); }
function isTimed(step) { return Boolean(step.seconds) || step.kind==='rest' || state.settings.mode==='timer'; }
function timerFor() {
  const s=current(); if (!s) return null;
  if (!state.active.timer) { const duration=durationFor(s)*1000; state.active.timer={duration, remaining:duration, running:false, finished:false, deadline:null}; }
  return state.active.timer;
}
function workProgress() {
  const a=state.active; if(!a)return {done:0,total:0};
  return {done:a.steps.slice(0,a.position).filter(s=>s.kind!=='rest').length,total:a.steps.filter(s=>s.kind!=='rest').length};
}
function techniqueText(ex,step) { return `<div class="help-copy"><ol>${ex.cues.map(c=>`<li>${escape(c)}</li>`).join('')}</ol>${step?.cue?`<p><strong>${escape(step.cue)}</strong></p>`:''}<p><strong>Легче:</strong> ${escape(ex.easier)}</p>${ex.caution?`<p>${escape(ex.caution)}</p>`:''}</div>`; }
function runner() {
  const a=state.active, s=current(); if(!a || !s) return finishScreen();
  const ex=EXERCISES[s.exerciseId], p=workProgress(), timer=timerFor();
  const rest=s.kind==='rest', prep=['warmup','cooldown'].includes(s.kind), timed=isTimed(s);
  return `<main class="runner-shell"><header class="runner-top"><button class="icon-button" data-action="leave" aria-label="Сохранить и выйти">${icon('close')}</button><div><small>ДЕНЬ ${a.day+1} · ${escape((a.title||getDay(a.day,state.settings).title).toLocaleUpperCase('ru'))}</small><div class="progress"><span style="width:${p.done/p.total*100}%"></span></div></div><span class="runner-count">${p.done}/${p.total}</span><button class="icon-button" data-action="sound" aria-label="${state.settings.sound?'Выключить':'Включить'} звук" aria-pressed="${state.settings.sound}">${icon('volume')}</button></header>${rest?`<section class="rest-card"><div class="rest-icon">${icon('leaf')}</div><div class="eyebrow">Дай себе время</div><h1>Отдых.</h1><p>${escape(s.cue || 'Поставь гирю. Восстанови дыхание.')}<br>Дальше: <strong>${escape(nextWorkTitle())}</strong></p></section>`:prep?`<section class="rest-card"><div class="rest-icon">${icon(s.kind==='warmup'?'clock':'leaf')}</div><div class="eyebrow">${s.kind==='warmup'?'Подготовка · без гири':'Спокойное завершение'}</div><h1>${ex.title}</h1><ul class="warmup-lines">${ex.cues.map(c=>`<li>${escape(c)}</li>`).join('')}</ul></section>`:`<section class="runner-card"><div class="exercise-heading"><div class="eyebrow">${s.round?`Круг ${s.round} · `:''}${s.side?`${escape(s.side)} сторона`:'Контроль каждого движения'}</div><h1>${ex.title}</h1><div class="equipment">${ex.equipment}</div></div><div class="runner-demo photo-demo">${renderPhoto(s.exerciseId)}</div><div class="cue-inline">${icon('info')}<span>${escape(ex.cues[0])}</span></div></section>`}${!rest&&!prep&&!s.seconds?`<div class="mode-control" aria-label="Режим тренировки"><button data-action="mode" data-mode="reps" class="${state.settings.mode==='reps'?'active':''}" aria-pressed="${state.settings.mode==='reps'}">Повторения</button><button data-action="mode" data-mode="timer" class="${state.settings.mode==='timer'?'active':''}" aria-pressed="${state.settings.mode==='timer'}">Таймер</button></div>`:''}<div class="prescription"><div class="set-label">${rest?'Таймер отдыха':s.set?`Подход ${s.set} из ${s.sets}${s.side?` · ${s.side}`:''}`:'Твой темп'}</div><span class="big-count" id="counter">${timed?time(Math.ceil(timer.remaining/1000)):s.reps}</span><div class="count-label" id="counter-label">${timed?(timer.finished?'Время вышло':timer.running?'Идёт таймер':timer.remaining<timer.duration?'На паузе':'Когда готов — начинай'):'качественных повторений'}${s.reps&&timed?` · ориентир ${s.reps} повт.`:''}</div></div><div class="runner-controls" id="main-controls">${controlsMarkup(s,timer,timed)}</div><div class="runner-secondary"><button class="text-button" data-action="skip">${rest?'Закончить отдых':'Пропустить шаг'}</button><span class="center-note">${rest?'Следующий подход начнётся по нажатию':s.kind==='work'?(['A','B','C'].includes(a.planCode||getDay(a.day,state.settings).code)?'Оставляй 2–3 повтора в запасе':'Работай с запасом'):'Без спешки'}</span>${rest?'<button class="text-button" data-action="add-rest">+30 сек</button>':'<button class="text-button" data-action="leave">Сохранить и выйти</button>'}</div>${!rest&&!prep?`<details class="technique"><summary>Схема, техника и вариант легче</summary><div class="demo-wrap">${renderDemo(ex.demo)}</div>${techniqueText(ex,s)}</details>`:''}<p class="status-note" id="timer-status" role="status" aria-live="polite"></p></main>`;
}
function controlsMarkup(s,t,timed) {
  if(!timed) return `<button class="button primary" data-action="complete">${icon('check')}Подход выполнен</button>`;
  if(t.finished) return `<button class="button primary" data-action="complete">${icon('check')}${s.kind==='rest'?'К следующему шагу':s.kind==='warmup'?'Разминка выполнена':s.kind==='cooldown'?'Завершить тренировку':'Шаг выполнен'}</button>`;
  return `<button class="button ${t.running?'secondary':'primary'}" data-action="timer">${icon(t.running?'pause':'play')}${t.running?'Пауза':t.remaining<t.duration?'Продолжить':'Запустить таймер'}</button>${s.kind!=='rest'?`<button class="button outline" data-action="complete">${icon('check')}Готово</button>`:''}`;
}
function nextWorkTitle() { const a=state.active;return a.steps.slice(a.position+1).find(s=>s.kind!=='rest')?.title || 'Завершение'; }
function finishScreen() {
  const a=state.active; if(!a) {view='home';return home();}
  const skipped=a.skipped.filter(i=>a.steps[i]?.kind!=='rest').length, full=skipped===0;
  return `<div class="shell">${header()}<main class="success"><div class="success-mark">${icon(full?'check':'leaf')}</div><div class="eyebrow">День ${a.day+1} · ${displayDate(getDay(a.day,state.settings))}</div><h1 style="margin-top:12px">${full?'На сегодня — готово.':'Движение засчитано.'}</h1><p>${full?'Хорошая работа. Восстановись, выпей воды и возвращайся к следующему дню.':`Пропущено шагов: ${skipped}. День отмечен как частично выполненный. Можно вернуться к пропущенным движениям, когда будешь готов.`}</p><div class="stats-row"><div><strong>${completedCount()}</strong><small>дней выполнено</small></div><div><strong>${getDay(a.day,state.settings).week}/7</strong><small>неделя челленджа</small></div></div>${!full?'<button class="button primary" data-action="retry-skipped">Вернуться к пропущенным</button>':''}<button class="button ${full?'primary':'secondary'}" data-action="finish">Вернуться к плану ${icon('arrow')}</button><p class="reps-hint">${a.day===48?'31 декабря: сравни самочувствие и качественные повторения с первым днём — без максимальных попыток.':'Прогресс сохранён на этом устройстве.'}</p></main></div>`;
}
function bodyScreen() { return `<div class="shell">${header()}<main id="body-progress-root"></main>${footer()}</div>`; }
function render() {
  bodyProgress.unmount();
  app.innerHTML = view==='run'?runner():view==='finish'?finishScreen():view==='calendar'?calendar():view==='settings'?settings():view==='body'?bodyScreen():home();
  if(view==='body') bodyProgress.mount(document.querySelector('#body-progress-root'));
  document.querySelector('#storage-warning').hidden=storageOK;
}
function navigate(next) { view=next;render();window.scrollTo(0,0); }
function unlockAudio() { try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if(audioContext.state==='suspended')audioContext.resume().catch(()=>{}); } catch {} }
function signal() {
  if(state.settings.vibration) try{navigator.vibrate?.([150,80,150]);}catch{}
  if(!state.settings.sound || !audioContext)return;
  try { [0,.22].forEach(delay=>{ const oscillator=audioContext.createOscillator(), gain=audioContext.createGain(), t=audioContext.currentTime+delay;oscillator.frequency.value=720;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.12,t+.02);gain.gain.exponentialRampToValueAtTime(.001,t+.15);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(t);oscillator.stop(t+.16); }); }catch{}
}
async function keepAwake() { try { if(!wakeLock && document.visibilityState==='visible'&&view==='run') {wakeLock=await navigator.wakeLock?.request('screen');wakeLock?.addEventListener('release',()=>wakeLock=null);} }catch{} }
function releaseAwake(){try{wakeLock?.release();}catch{}wakeLock=null;}
function start() {
  unlockAudio();
  if(state.active?.day===selected){navigate(state.active.position>=state.active.steps.length?'finish':'run');keepAwake();return;}
  if(state.active && state.active.position<state.active.steps.length && !confirm('Начать другой день? Незавершённая тренировка будет заменена. Отметки завершённых дней сохранятся.'))return;
  if(state.completions[selected]&&!confirm('Повторить этот день? Итоговая отметка обновится после завершения.'))return;
  state.active={day:selected,title:getDay(selected,state.settings).title,planCode:getDay(selected,state.settings).code, steps:getPlan(selected,state.settings),position:0,timer:null,skipped:[],startedAt:Date.now()};persist();navigate('run');keepAwake();
}
function setTimerRunning(running) { const t=timerFor();if(!t)return; if(running){t.deadline=Date.now()+t.remaining;t.running=true;t.finished=false;keepAwake();}else{t.remaining=Math.max(0,t.deadline-Date.now());t.running=false;t.deadline=null;}persist(); }
function pauseTimer() { if(state.active?.timer?.running)setTimerRunning(false); }
function advance(skip=false) {
  const a=state.active,s=current();if(!a||!s)return;
  if(skip && s.kind!=='rest')a.skipped.push(a.position);
  a.position++;a.timer=null;
  if(a.position>=a.steps.length){recordResult();navigate('finish');releaseAwake();return;}
  if(current().kind==='rest'){const t=timerFor();t.running=true;t.deadline=Date.now()+t.remaining;}
  persist();render();window.scrollTo(0,0);
}
function recordResult(){const a=state.active;state.completions[a.day]={status:a.skipped.length?'partial':'complete',at:new Date().toISOString(),skipped:a.skipped.length};persist();}
function tick() {
  const t=state.active?.timer;if(!t?.running)return;
  t.remaining=Math.max(0,t.deadline-Date.now());
  if(t.remaining===0){ t.running=false;t.finished=true;t.deadline=null;signal();persist();
    if(view==='run'&&current()?.kind==='rest'){advance();const status=document.querySelector('#timer-status');if(status)status.textContent='Отдых окончен. Начни следующий подход, когда будешь готов.';return;}
    if(view==='run'){render();const status=document.querySelector('#timer-status');if(status)status.textContent='Время вышло. Подтверди выполнение шага.';}return;
  }
  if(view==='run'){const counter=document.querySelector('#counter');if(counter)counter.textContent=time(Math.ceil(t.remaining/1000));}
}
function showHelp(title,content) {document.querySelector('#help-content').innerHTML=`<h2>${escape(title)}</h2>${content}`;document.querySelector('#help-dialog').showModal();}
function showTechnique(id) {const ex=EXERCISES[id];if(ex)showHelp(ex.title,`<div class="demo-wrap">${renderDemo(ex.demo)}</div>${techniqueText(ex)}`);}
app.addEventListener('click', async event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const action=button.dataset.action;
  if(['home','calendar','body','settings'].includes(action)){ if(view==='run'){pauseTimer();persist();releaseAwake();}navigate(action);if(action==='home')selected=Math.max(0,Math.min(48,dateIndex()));if(action==='home')render();return; }
  if(action==='day'){selected=Number(button.dataset.day);navigate('home');}
  if(action==='start')start();
  if(action==='resume'){selected=state.active.day;navigate(state.active.position>=state.active.steps.length?'finish':'run');keepAwake();}
  if(action==='technique')showTechnique(button.dataset.exercise);
  if(action==='week-help'){const d=getDay(selected,state.settings),w=WEEKS[d.week-1];showHelp(`Неделя ${d.week} · ${w.title}`,`<div class="help-copy"><p>Силовые A/B/C: ${w.note}</p><p>В A/B заверши подходы упражнения; C — круги. D/F — умеренная кондиция в разговорном темпе, E/G — лёгкий контроль движений с большим запасом. Отдых и переходы включены; при необходимости добавь времени.</p><p>Оставляй 2–3 повтора в запасе. В режиме таймера не нужно стараться успеть больше повторений.</p></div>`);}
  if(action==='timer'){unlockAudio();const t=timerFor();setTimerRunning(!t.running);render();}
  if(action==='complete'){unlockAudio();advance();}
  if(action==='skip')advance(true);
  if(action==='add-rest'){const t=timerFor();t.remaining+=30000;t.duration+=30000;if(t.running)t.deadline+=30000;t.finished=false;persist();render();}
  if(action==='mode'){state.settings.mode=button.dataset.mode;state.active.timer=null;persist();render();}
  if(action==='sound'){state.settings.sound=!state.settings.sound;unlockAudio();persist();render();toast(state.settings.sound?'Звук включён':'Звук выключен');}
  if(action==='leave'){pauseTimer();selected=state.active.day;persist();releaseAwake();navigate('home');toast('Текущий шаг сохранён');}
  if(action==='finish'){selected=state.active.day;state.active=null;persist();navigate('home');}
  if(action==='retry-skipped'){const a=state.active;const indices=[...new Set(a.skipped)].sort((x,y)=>x-y);a.steps=indices.flatMap((i,j)=>{const s={...a.steps[i]};return j<indices.length-1?[s,{id:`retry-rest-${j}`,exerciseId:s.exerciseId,title:'Отдых',kind:'rest',seconds:90,side:null,reps:null}]:[s];});a.position=0;a.skipped=[];a.timer=null;persist();navigate('run');keepAwake();}
  if(action==='test-signal'){unlockAudio();setTimeout(signal,150);toast('Сигнал зависит от громкости телефона и поддержки браузера');}
  if(action==='install'&&deferredInstall){await deferredInstall.prompt();deferredInstall=null;render();}
  if(action==='update'){pauseTimer();persist();registration?.waiting?.postMessage({type:'SKIP_WAITING'});}
  if(action==='export'){
    if(backupBusy)return;
    backupBusy=true;button.disabled=true;pauseTimer();persist();
    try{
      let data;
      try{data=await createBackup(state);}catch(error){
        if(!confirm('Не удалось прочитать фото и замеры. Скачать копию только тренировок?'))return;
        data=state;
      }
      const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
      if(blob.size>MAX_BACKUP_BYTES)throw new Error('Копия слишком большая. Сохрани часть фото отдельно и попробуй снова.');
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=`girya49-${new Date().toISOString().slice(0,10)}.json`;link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      toast(data.version===2?'Скачивается полная копия с фото и замерами':'Скачивается копия только тренировок');
    }catch(error){toast(error?.message||'Не удалось скачать копию');}
    finally{backupBusy=false;button.disabled=false;}
  }
  if(action==='import'&&!backupBusy)document.querySelector('#import-file').click();
  if(action==='reset'&&confirm('Сбросить отметки и текущую тренировку? Фото, замеры и настройки сохранятся.')){state={...normalize(null),settings:{...state.settings}};persist();navigate('home');toast('Отметки тренировок сброшены');}
});
app.addEventListener('error', event => {
  const img=event.target;
  if(img?.tagName!=='IMG'||!img.dataset.demo)return;
  const container=img.closest('.photo-demo');
  if(container){container.classList.remove('photo-demo');container.innerHTML=renderDemo(img.dataset.demo);}
},true);
app.addEventListener('change',event=>{
  const el=event.target;if(el.id==='week-select'){selected=Number(el.value)*7;navigate('home');return;}
  if(el.dataset.setting){const key=el.dataset.setting;state.settings[key]=el.type==='checkbox'?el.checked:Number(el.value);persist();}
});
document.querySelector('#close-help').addEventListener('click',()=>document.querySelector('#help-dialog').close());
document.querySelector('#help-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}});
document.querySelector('#import-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file||backupBusy)return;
  backupBusy=true;
  try{
    if(file.size>MAX_BACKUP_BYTES)throw new Error('Файл копии слишком большой.');
    const parsed=await readBackup(JSON.parse(await file.text()),normalize);
    const question=parsed.body===null?'В этой копии только тренировки. Заменить их отметки? Текущие фото и замеры сохранятся.':'Заменить отметки тренировок, фото и замеры данными из этой копии?';
    if(!confirm(question))return;
    pauseTimer();persist();
    await restoreBackup(parsed,{writeWorkout:next=>{
      try{localStorage.setItem(KEY,JSON.stringify(next));}catch(error){storageOK=false;document.querySelector('#storage-warning').hidden=false;throw error;}
      state=next;storageOK=true;
    }});
    try{await bodyProgress.refresh({resetDraft:parsed.body!==null});}catch{/* A display refresh must not undo a successful restore. */}
    releaseAwake();navigate('home');toast(parsed.body===null?'Отметки тренировок восстановлены':'Копия восстановлена');
  }catch(error){toast(error?.message||'Не удалось прочитать копию прогресса');}
  finally{backupBusy=false;event.target.value='';}
});
window.addEventListener('beforeunload',()=>persist());
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){persist();releaseAwake();}else{tick();if(view==='run')keepAwake();}});
window.addEventListener('online',()=>{const el=document.querySelector('#offline-status');if(el)el.textContent='Прогресс на этом устройстве';});
window.addEventListener('offline',()=>{const el=document.querySelector('#offline-status');if(el)el.textContent='Без сети · можно тренироваться';});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;if(view==='settings')render();});
if('serviceWorker'in navigator&&window.isSecureContext){navigator.serviceWorker.register('./sw.js').then(r=>{registration=r;r.addEventListener('updatefound',()=>r.installing?.addEventListener('statechange',()=>{if(r.waiting&&view==='settings')render();}));}).catch(()=>{});let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;pauseTimer();persist();location.reload();});}
setInterval(tick,200);setInterval(()=>{if(state.active?.timer?.running)persist();},3000);
persist();render();
