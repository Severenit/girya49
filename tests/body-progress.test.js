import test from 'node:test';
import assert from 'node:assert/strict';
import { createBodyProgress, parseMeasurements, preparePhoto } from '../body-progress.js';

test('measurement entry accepts decimal commas and rejects invalid or out-of-range input', () => {
  assert.deepEqual(parseMeasurements({weight:'82,5',waist:'90',belly:''}), {weight:82.5,waist:90});
  for (const values of [{weight:'NaN'},{waist:'-1'},{weight:'8e1'},{arm:'999'},{hips:'1,2,3'}]) assert.throws(()=>parseMeasurements(values));
});

test('photo processing rejects SVG, non-images and oversized originals before decoding', async () => {
  for (const file of [new Blob(['<svg/>'],{type:'image/svg+xml'}),new Blob(['text'],{type:'text/plain'}),new Blob([],{type:'image/jpeg'}),{size:26*1024*1024,type:'image/jpeg'}]) await assert.rejects(preparePhoto(file));
});

test('removing a photo while it is being processed prevents it from reappearing or being saved', async () => {
  const previousDocument=globalThis.document, previousBitmap=globalThis.createImageBitmap;
  let finishDecode;
  globalThis.createImageBitmap=()=>new Promise(resolve=>{finishDecode=resolve;});
  globalThis.document={createElement:()=>({getContext:()=>({fillRect(){},drawImage(){}}),toBlob:callback=>callback(new Blob([new Uint8Array([255,216,255,224])],{type:'image/jpeg'}))})};
  const handlers=new Map();let records=[];
  const root={innerHTML:'',scrollIntoView(){},addEventListener:(key,fn)=>handlers.set(key,fn),removeEventListener:key=>handlers.delete(key)};
  const store={list:async()=>records,get:async date=>records.find(r=>r.date===date),put:async record=>{records.push(record);}};
  const ui=createBodyProgress({store});
  const click=(action,extra={})=>handlers.get('click')({target:{closest:()=>({dataset:{bodyAction:action,...extra}})}});
  try{
    ui.mount(root);await ui.refresh();await click('new');
    handlers.get('input')({target:{dataset:{measure:'weight'},value:'82,5'}});
    const processing=handlers.get('change')({target:{dataset:{photo:'front'},files:[new Blob(['jpeg'],{type:'image/jpeg'})]}});
    assert.match(root.innerHTML,/Готовлю фото/);
    await click('remove-photo',{angle:'front'});
    finishDecode({width:100,height:100,close(){}});await processing;
    await handlers.get('submit')({preventDefault(){}});
    assert.equal(records.length,1);
    assert.deepEqual(records[0].photos,{});
    assert.equal(records[0].measurements.weight,82.5);
  }finally{ui.unmount();globalThis.document=previousDocument;globalThis.createImageBitmap=previousBitmap;}
});

test('failed persistence retains the editable measurements and photos rather than claiming success', async () => {
  const handlers=new Map(),errors=[];
  const root={innerHTML:'',scrollIntoView(){},addEventListener:(key,fn)=>handlers.set(key,fn),removeEventListener:key=>handlers.delete(key)};
  const photo=new Blob([new Uint8Array([255,216,255])],{type:'image/jpeg'});
  const record={date:'2026-11-13',measurements:{weight:82.5},photos:{front:photo},note:'Сохрани меня'};
  const store={list:async()=>[record],get:async()=>record,put:async()=>{throw new Error('Недостаточно места');}};
  const ui=createBodyProgress({store,onError:error=>errors.push(error)});
  try{
    ui.mount(root);await ui.refresh();
    await handlers.get('click')({target:{closest:()=>({dataset:{bodyAction:'edit',date:record.date}})}});
    await handlers.get('submit')({preventDefault(){}});
    assert.match(root.innerHTML,/Недостаточно места/);
    assert.match(root.innerHTML,/value="82,5"/);
    assert.match(root.innerHTML,/Фото спереди для этой записи/);
    assert.match(root.innerHTML,/Сохрани меня/);
    assert.doesNotMatch(root.innerHTML,/Запись сохранена на устройстве/);
    assert.equal(errors.length,1);
  }finally{ui.unmount();}
});
