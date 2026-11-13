import { bodyStore, MEASUREMENT_FIELDS, ANGLES, normalizeBodyRecord, MAX_PHOTO_BYTES } from './body-store.js';

const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const dateText = date => new Intl.DateTimeFormat('ru', {day:'numeric',month:'long',year:'numeric'}).format(new Date(`${date}T12:00:00`));
const recordCount = count => `${count} ${count%100>=11&&count%100<=14?'записей':count%10===1?'запись':count%10>=2&&count%10<=4?'записи':'записей'}`;
const numberText = value => typeof value === 'number' ? new Intl.NumberFormat('ru', {maximumFractionDigits:1}).format(value) : '—';

export function parseMeasurements(values) {
  const result = {};
  for (const field of MEASUREMENT_FIELDS) {
    const raw = String(values[field.key] ?? '').trim();
    if (!raw) continue;
    if (!/^\d+(?:[.,]\d+)?$/.test(raw)) throw new Error(`${field.label}: введи число, например 82,5.`);
    const value = Number(raw.replace(',', '.'));
    if (!Number.isFinite(value) || value < field.min || value > field.max) throw new Error(`${field.label}: укажи от ${field.min} до ${field.max} ${field.unit}.`);
    result[field.key] = Math.round(value * 10) / 10;
  }
  return result;
}

export async function preparePhoto(file) {
  const type = String(file?.type || '').toLowerCase();
  if (!file || !file.size || file.size > 25*1024*1024) throw new Error('Выбери фото размером до 25 МБ.');
  if (!['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif'].includes(type)
      && !(type === '' && /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || ''))) {
    throw new Error('Выбери фотографию JPEG, PNG или WebP.');
  }
  let image, temporaryURL;
  try {
    if (typeof createImageBitmap === 'function') {
      try { image = await createImageBitmap(file, {imageOrientation:'from-image'}); } catch { /* Safari may decode camera photos through Image instead. */ }
    }
    if (!image) {
      temporaryURL = URL.createObjectURL(file);
      image = await new Promise((resolve,reject) => { const img = new Image(); img.onload=()=>resolve(img); img.onerror=reject; img.src=temporaryURL; });
    }
    const width = image.naturalWidth || image.width, height = image.naturalHeight || image.height;
    if (!width || !height || width*height > 80000000) throw new Error('Фото слишком большое. Выбери уменьшенную копию.');
    const scale = Math.min(1,1600/Math.max(width,height)), canvas = document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale)); canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d');
    if(!context) throw new Error('Браузер не смог обработать фото.');
    context.fillStyle='#fff'; context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.82));
    if(!blob || blob.size>MAX_PHOTO_BYTES)throw new Error('Не удалось уменьшить фото. Попробуй другую копию.');
    return blob;
  } catch(error) {
    if (error instanceof Error && /слишком большое|уменьшить|обработать/.test(error.message)) throw error;
    throw new Error('Не удалось открыть фото. Попробуй JPEG, PNG или WebP; если это HEIC, сохрани его как JPEG.');
  } finally {
    image?.close?.();
    if(temporaryURL)URL.revokeObjectURL(temporaryURL);
  }
}

export function createBodyProgress({onError=()=>{},onChange=()=>{},store=bodyStore}={}) {
  let root=null, records=[], ready=false, loading=false, loadSequence=0;
  let draft=null, originalDate=null, dirty=false, saving=false, issue='', notice='', storageIssue='';
  let before='', after='', angle='front', urls=[], jobs={};
  const revokeURLs=()=>{for(const url of urls)URL.revokeObjectURL(url);urls=[];};
  const photoURL=blob=>{const url=URL.createObjectURL(blob);urls.push(url);return url;};
  const pending=()=>Object.keys(jobs).length>0;
  function syncComparison() {
    if(!records.some(r=>r.date===before))before=records[0]?.date || '';
    if(!records.some(r=>r.date===after))after=records.at(-1)?.date || '';
  }
  function fail(error) { issue=error?.message || 'Не удалось сохранить запись. Попробуй ещё раз.';onError(error);render(); }
  function options(selected) { return records.map(record=>`<option value="${record.date}" ${record.date===selected?'selected':''}>${dateText(record.date)}</option>`).join(''); }
  function comparePhoto(record,label) {
    const photo=record?.photos[angle];
    return `<figure class="body-comparison-photo"><figcaption><strong>${label}</strong><span>${dateText(record.date)}</span></figcaption>${photo?`<img src="${photoURL(photo)}" alt="${html(label)}: ${ANGLES.find(a=>a.key===angle).label.toLowerCase()}, ${dateText(record.date)}">`:`<div class="body-photo-missing"><span>Нет фото<br>${ANGLES.find(a=>a.key===angle).label.toLowerCase()}</span><button type="button" class="text-button" data-body-action="edit" data-date="${record.date}">Добавить фото</button></div>`}</figure>`;
  }
  function comparison() {
    if(records.length<2)return `<section class="body-card body-one-record"><span class="body-kicker">Первая точка есть</span><h2>Следующая запись покажет изменения.</h2><p>Когда добавишь ещё одну дату, здесь можно будет сравнить фото и замеры.</p></section>`;
    const first=records.find(r=>r.date===before),last=records.find(r=>r.date===after);
    const rows=MEASUREMENT_FIELDS.filter(f=>first.measurements[f.key]!==undefined || last.measurements[f.key]!==undefined).map(field=>{
      const a=first.measurements[field.key],b=last.measurements[field.key];
      const delta=typeof a==='number'&&typeof b==='number'?Math.round((b-a)*10)/10:null;
      return `<tr><th scope="row">${field.label}<small>${field.unit}</small></th><td>${numberText(a)}</td><td>${numberText(b)}</td><td>${delta===null?'—':`${delta>0?'+':''}${numberText(delta)}`}</td></tr>`;
    }).join('');
    return `<section class="body-card body-compare"><div class="body-section-head"><h2>До / после</h2><span class="body-kicker">Выбери две даты</span></div><div class="body-date-pair"><label>До<select id="body-before">${options(before)}</select></label><label>После<select id="body-after">${options(after)}</select></label></div><div class="body-angle-tabs" role="group" aria-label="Ракурс фото">${ANGLES.map(a=>`<button type="button" data-body-action="angle" data-angle="${a.key}" class="${angle===a.key?'selected':''}" aria-pressed="${angle===a.key}">${a.label}</button>`).join('')}</div><div class="body-photo-pair">${comparePhoto(first,'До')}${comparePhoto(last,'После')}</div>${before===after?'<p class="body-hint">Сейчас выбрана одна и та же дата. Выбери другую, чтобы сравнить изменения.</p>':''}${rows?`<div class="body-table-wrap"><table class="body-measurements"><thead><tr><th>Замер</th><th>До</th><th>После</th><th>Разница</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="body-hint">Добавь замеры к записям, чтобы увидеть разницу в цифрах.</p>'}</section>`;
  }
  function history() {
    return `<section class="body-history"><div class="body-section-head"><h2>История</h2><span class="body-kicker">${recordCount(records.length)}</span></div>${records.slice().reverse().map(record=>{
      const measurements=MEASUREMENT_FIELDS.filter(f=>record.measurements[f.key]!==undefined).map(f=>`${f.label} ${numberText(record.measurements[f.key])} ${f.unit}`).join(' · ');
      return `<article class="body-history-row"><div><h3>${dateText(record.date)}</h3>${measurements?`<p>${measurements}</p>`:''}<small>${Object.keys(record.photos).length} фото</small>${record.note?`<p class="body-record-note">${html(record.note)}</p>`:''}</div><div class="body-row-actions"><button type="button" data-body-action="edit" data-date="${record.date}">Изменить</button><button type="button" class="danger" data-body-action="delete" data-date="${record.date}">Удалить</button></div></article>`;
    }).join('')}</section>`;
  }
  function journal() {
    return `<div class="body-view-head"><div><div class="eyebrow">Дневник формы</div><h1>Твоё до / после.</h1><p>Фото и замеры по датам. Только на этом устройстве.</p></div><button type="button" class="button primary" data-body-action="new" ${loading?'disabled':''}>+ Добавить запись</button></div>${notice?`<p class="body-notice" role="status">${html(notice)}</p>`:''}${storageIssue?`<div class="body-error" role="alert">${html(storageIssue)}<button type="button" class="text-button" data-body-action="retry">Попробовать снова</button></div>`:''}${loading&&!ready?'<p class="body-hint" role="status">Открываю записи…</p>':records.length?comparison()+history():`<section class="body-card body-empty"><span class="body-empty-mark" aria-hidden="true">↗</span><h2>Сохрани точку старта.</h2><p>Добавь вес, замер талии или первое фото. Все поля необязательные — достаточно одного.</p><div class="body-empty-angles"><span>Спереди</span><span>Сбоку</span><span>Сзади</span></div><small>Для сравнения используй похожие свет, расстояние и позу.</small></section>`}<div class="body-backup-note"><p>Фото и замеры не отправляются в интернет. Если очистить данные браузера или сменить телефон, понадобится копия.</p><button class="text-button" type="button" data-action="settings">Скачать полную копию в настройках →</button></div>`;
  }
  function editor() {
    return `<div class="body-view-head"><div><div class="eyebrow">${originalDate?'Редактирование записи':'Точка на пути'}</div><h1>${originalDate?'Твоя запись.':'Новая запись.'}</h1><p>Можно добавить только фото или только замеры.</p></div></div><form id="body-record-form" class="body-editor"><fieldset class="body-editor-fieldset" ${saving?'disabled':''}><section class="body-card"><label class="body-date-field">Дата<input type="date" name="date" id="body-record-date" value="${html(draft.date)}" min="1900-01-01" max="2100-12-31" required></label>${originalDate?'<p class="body-hint">Если изменить дату, запись сохранится отдельно. Прежняя останется в истории.</p>':''}<h2 class="body-form-title">Замеры</h2><div class="body-fields">${MEASUREMENT_FIELDS.map(f=>`<label>${f.label}<span class="body-number-input"><input type="text" inputmode="decimal" autocomplete="off" data-measure="${f.key}" value="${html(draft.measurements[f.key]??'')}" placeholder="—" aria-label="${f.label}, ${f.unit}"><span>${f.unit}</span></span></label>`).join('')}</div></section><section class="body-card"><h2>Фото</h2><p class="body-hint">Выбери из галереи или сделай снимок. Фото уменьшится для хранения; оригинал на телефоне останется.</p><div class="body-photo-inputs">${ANGLES.map(a=>`<div class="body-photo-input"><strong>${a.label}</strong>${draft.photos[a.key]?`<img src="${photoURL(draft.photos[a.key])}" alt="Фото ${a.label.toLowerCase()} для этой записи">`:'<div class="body-upload-placeholder" aria-hidden="true">+</div>'}<label class="body-file-button">${jobs[a.key]?'Обработка…':draft.photos[a.key]?'Заменить фото':'Добавить фото'}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" data-photo="${a.key}" aria-label="Фото ${a.label.toLowerCase()}"></label>${draft.photos[a.key]||jobs[a.key]?`<button type="button" class="text-button" data-body-action="remove-photo" data-angle="${a.key}">Убрать фото</button>`:''}</div>`).join('')}</div></section><section class="body-card"><label class="body-note-field">Заметка <small>необязательно</small><textarea id="body-record-note" maxlength="1000" rows="3" placeholder="Как самочувствие? Что хочется запомнить?">${html(draft.note)}</textarea></label></section>${issue?`<p class="body-error" role="alert">${html(issue)}</p>`:''}<div class="body-editor-actions"><button type="submit" class="button primary" ${saving||pending()?'disabled':''}>${saving?'Сохраняю…':pending()?'Готовлю фото…':'Сохранить запись'}</button><button type="button" class="button outline" data-body-action="cancel" ${saving?'disabled':''}>Отмена</button></div><p class="body-hint">Запись сохраняется на этом устройстве. Полная копия с фотографиями доступна в настройках.</p></fieldset></form>`;
  }
  function render() { if(!root)return;revokeURLs();root.innerHTML=`<div class="body-progress">${draft?editor():journal()}</div>`; }
  function makeDraft(record) {
    draft={date:record?.date || today(),measurements:Object.fromEntries(Object.entries(record?.measurements||{}).map(([key,value])=>[key,String(value).replace('.',',')])),note:record?.note||'',photos:{...record?.photos}};
    originalDate=record?.date || null;dirty=false;jobs={};issue='';notice='';render();root?.scrollIntoView({block:'start'});
  }
  async function refresh({resetDraft=false}={}) {
    if(resetDraft){draft=null;originalDate=null;jobs={};dirty=false;issue='';}
    const sequence=++loadSequence;loading=true;render();
    try{const loaded=await store.list();if(sequence!==loadSequence)return;records=loaded;ready=true;storageIssue='';syncComparison();}
    catch(error){if(sequence!==loadSequence)return;storageIssue=error?.message||'Не удалось открыть записи.';ready=true;onError(error);}
    finally{if(sequence===loadSequence){loading=false;render();}}
  }
  async function save(event) {
    event.preventDefault();if(!draft||saving||pending())return;
    issue='';const currentDraft=draft;let saved=false;
    try{
      const candidate=normalizeBodyRecord({...currentDraft,measurements:parseMeasurements(currentDraft.measurements)});
      saving=true;render();
      const existing=await store.get(candidate.date);
      if(existing&&candidate.date!==originalDate&&!confirm(`За ${dateText(candidate.date)} уже есть запись. Заменить её фото и замеры данными этой формы?`))return;
      await store.put(candidate);
      records=[...records.filter(record=>record.date!==candidate.date),candidate].sort((a,b)=>a.date.localeCompare(b.date));
      ready=true;storageIssue='';draft=null;originalDate=null;dirty=false;jobs={};notice='Запись сохранена на устройстве.';
      before=records[0]?.date||'';after=candidate.date;syncComparison();saved=true;onChange({type:'save',record:candidate});
    }catch(error){fail(error);}
    finally{saving=false;render();if(saved)root?.scrollIntoView({block:'start'});}
  }
  async function click(event) {
    const button=event.target.closest('[data-body-action]');if(!button)return;
    const action=button.dataset.bodyAction;
    if(action==='new'){makeDraft(records.find(record=>record.date===today()));}
    if(action==='edit'){const record=records.find(r=>r.date===button.dataset.date);if(record)makeDraft(record);}
    if(action==='cancel'){
      if((dirty||pending())&&!confirm('Закрыть запись без сохранения изменений?'))return;
      draft=null;originalDate=null;jobs={};issue='';render();
    }
    if(action==='angle'){angle=button.dataset.angle;render();}
    if(action==='remove-photo'&&draft){delete jobs[button.dataset.angle];delete draft.photos[button.dataset.angle];dirty=true;render();}
    if(action==='retry')await refresh();
    if(action==='delete'){
      const date=button.dataset.date;if(!confirm(`Удалить запись за ${dateText(date)} вместе с её фотографиями?`))return;
      button.disabled=true;
      try{await store.remove(date);records=records.filter(r=>r.date!==date);syncComparison();notice='Запись удалена.';onChange({type:'delete',date});render();}
      catch(error){button.disabled=false;fail(error);}
    }
  }
  function input(event) {
    if(!draft||saving)return;const element=event.target;
    if(element.dataset.measure){draft.measurements[element.dataset.measure]=element.value;dirty=true;}
    if(element.id==='body-record-date'){draft.date=element.value;dirty=true;}
    if(element.id==='body-record-note'){draft.note=element.value;dirty=true;}
  }
  async function change(event) {
    const element=event.target;
    if(element.id==='body-before'){before=element.value;render();return;}
    if(element.id==='body-after'){after=element.value;render();return;}
    input(event);
    const key=element.dataset.photo,file=element.files?.[0];if(!key||!file||!draft||saving)return;
    const target=draft,token=Symbol();jobs[key]=token;issue='';render();
    try{const blob=await preparePhoto(file);if(draft!==target||jobs[key]!==token)return;draft.photos[key]=blob;dirty=true;}
    catch(error){if(draft===target&&jobs[key]===token)fail(error);}
    finally{if(draft===target&&jobs[key]===token){delete jobs[key];render();}}
  }
  function unmount() {
    if(root){root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',change);root.removeEventListener('submit',save);}
    root=null;revokeURLs();
  }
  function mount(element) {
    unmount();root=element;
    root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',change);root.addEventListener('submit',save);
    render();if(!ready&&!loading)void refresh();
  }
  return {mount,unmount,refresh};
}
