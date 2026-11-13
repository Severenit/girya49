// Body records stay on this device. This module never opens a database at import time.
export const MEASUREMENT_FIELDS = Object.freeze([
  { key: 'weight', label: 'Вес', unit: 'кг', min: 20, max: 500, step: 0.1 },
  { key: 'waist', label: 'Талия', unit: 'см', min: 20, max: 300, step: 0.1 },
  { key: 'belly', label: 'Живот по пупку', unit: 'см', min: 20, max: 350, step: 0.1 },
  { key: 'chest', label: 'Грудь', unit: 'см', min: 30, max: 300, step: 0.1 },
  { key: 'hips', label: 'Бёдра', unit: 'см', min: 30, max: 300, step: 0.1 },
  { key: 'arm', label: 'Обхват руки', unit: 'см', min: 10, max: 100, step: 0.1 },
].map(Object.freeze));

export const ANGLES = Object.freeze([
  { key: 'front', label: 'Спереди' },
  { key: 'side', label: 'Сбоку' },
  { key: 'back', label: 'Сзади' },
].map(Object.freeze));

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
export const MAX_BODY_RECORDS = 500;
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const FIELD_KEYS = new Set(MEASUREMENT_FIELDS.map(field => field.key));
const ANGLE_KEYS = new Set(ANGLES.map(angle => angle.key));
const RECORD_KEYS = new Set(['date', 'measurements', 'note', 'photos']);
const DB_NAME = 'girya49-body-v1';
const STORE_NAME = 'records';

function invalid(message) {
  const error = new Error(message);
  error.name = 'BodyValidationError';
  return error;
}

function storageError(cause, blocked = false) {
  const message = blocked
    ? 'Хранилище фото заблокировано другой вкладкой. Закрой другие вкладки приложения и попробуй снова.'
    : cause?.name === 'QuotaExceededError'
      ? 'Недостаточно места для фото. Освободи место на устройстве или уменьши число фото.'
      : 'Хранилище фото недоступно. Проверь разрешения браузера и свободное место. Запись не сохранена.';
  const error = new Error(message, cause ? { cause } : undefined);
  error.name = 'BodyStorageError';
  return error;
}

function plainObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    throw invalid(`${label}: ожидается объект.`);
  }
  return value;
}

function knownKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw invalid(`${label}: неизвестное поле «${key}».`);
  }
}

function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw invalid('Дата должна быть в формате ГГГГ-ММ-ДД.');
  }
  const [year, month, day] = date.split('-').map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31
    || new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) !== date) {
    throw invalid('Укажи существующую дату с 1900 по 2100 год.');
  }
  return date;
}

function validPhoto(photo, label) {
  if (!(photo instanceof Blob)) throw invalid(`${label}: ожидается файл изображения.`);
  if (!PHOTO_TYPES.has(photo.type)) throw invalid(`${label}: поддерживаются только JPEG, PNG и WebP.`);
  if (!photo.size || photo.size > MAX_PHOTO_BYTES) throw invalid(`${label}: фото должно быть от 1 байта до 5 МБ.`);
  return photo;
}

export function normalizeBodyRecord(record) {
  plainObject(record, 'Запись');
  knownKeys(record, RECORD_KEYS, 'Запись');
  const date = validDate(record.date);
  const measurements = {};
  const sourceMeasurements = record.measurements === undefined ? {} : plainObject(record.measurements, 'Замеры');
  knownKeys(sourceMeasurements, FIELD_KEYS, 'Замеры');
  for (const field of MEASUREMENT_FIELDS) {
    const value = sourceMeasurements[field.key];
    if (value === undefined || (typeof value === 'string' && !value.trim())) continue;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < field.min || value > field.max) {
      throw invalid(`${field.label}: укажи число от ${field.min} до ${field.max} ${field.unit}.`);
    }
    measurements[field.key] = value;
  }
  const note = record.note === undefined ? '' : record.note;
  if (typeof note !== 'string' || note.length > 1000) throw invalid('Заметка должна содержать не более 1000 символов.');
  const sourcePhotos = record.photos === undefined ? {} : plainObject(record.photos, 'Фото');
  knownKeys(sourcePhotos, ANGLE_KEYS, 'Фото');
  const photos = {};
  for (const angle of ANGLES) {
    if (sourcePhotos[angle.key] !== undefined) photos[angle.key] = validPhoto(sourcePhotos[angle.key], angle.label);
  }
  if (!Object.keys(measurements).length && !Object.keys(photos).length && !note.trim()) {
    throw invalid('Добавь хотя бы один замер, фото или заметку.');
  }
  return { date, measurements, note: note.trim(), photos };
}

function normalizeRecords(records) {
  if (!Array.isArray(records) || records.length > MAX_BODY_RECORDS) {
    throw invalid(`Ожидается список не более чем из ${MAX_BODY_RECORDS} записей.`);
  }
  const normalized = records.map(normalizeBodyRecord);
  if (new Set(normalized.map(record => record.date)).size !== normalized.length) {
    throw invalid('В копии есть несколько записей с одной датой.');
  }
  return normalized.sort((a, b) => a.date.localeCompare(b.date));
}

export function createBodyStore(indexedDBFactory = globalThis.indexedDB) {
  let connection = null;
  function open() {
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      if (!indexedDBFactory || typeof indexedDBFactory.open !== 'function') {
        reject(storageError());
        return;
      }
      let request;
      let finished = false;
      const fail = (error, blocked = false) => {
        if (finished) return;
        finished = true;
        reject(storageError(error, blocked));
      };
      try { request = indexedDBFactory.open(DB_NAME, 1); }
      catch (error) { fail(error); return; }
      request.onupgradeneeded = () => {
        try {
          if (!request.result.objectStoreNames.contains(STORE_NAME)) {
            request.result.createObjectStore(STORE_NAME, { keyPath: 'date' });
          }
        } catch (error) {
          try { request.transaction?.abort(); } catch { /* The open request reports its own failure. */ }
          fail(error);
        }
      };
      request.onerror = () => fail(request.error);
      request.onblocked = () => fail(request.error, true);
      request.onsuccess = () => {
        const database = request.result;
        if (finished) { database.close(); return; }
        finished = true;
        database.onversionchange = () => { database.close(); connection = null; };
        resolve(database);
      };
    }).catch(error => { connection = null; throw error; });
    return connection;
  }

  async function transaction(mode, action) {
    const database = await open();
    return new Promise((resolve, reject) => {
      let tx;
      let result;
      let failure;
      try { tx = database.transaction(STORE_NAME, mode); }
      catch (error) { reject(storageError(error)); return; }
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(storageError(failure || tx.error));
      // Leave the default error action intact so IndexedDB aborts and rolls back.
      tx.onerror = () => {};
      try {
        action(tx.objectStore(STORE_NAME), value => { result = value; });
      } catch (error) {
        failure = error;
        try { tx.abort(); }
        catch { reject(storageError(error)); }
      }
    });
  }

  return {
    async list() {
      const records = await transaction('readonly', (store, result) => {
        const request = store.getAll();
        request.onsuccess = () => result(request.result);
      });
      return records.map(normalizeBodyRecord).sort((a, b) => a.date.localeCompare(b.date));
    },
    async get(date) {
      validDate(date);
      const record = await transaction('readonly', (store, result) => {
        const request = store.get(date);
        request.onsuccess = () => result(request.result);
      });
      return record === undefined ? undefined : normalizeBodyRecord(record);
    },
    async put(record) {
      const normalized = normalizeBodyRecord(record);
      await transaction('readwrite', store => { store.put(normalized); });
      return normalized;
    },
    async remove(date) {
      validDate(date);
      await transaction('readwrite', store => { store.delete(date); });
    },
    async replaceAll(records) {
      // Validate everything before opening a write transaction or clearing anything.
      const normalized = normalizeRecords(records);
      await transaction('readwrite', store => {
        store.clear();
        for (const record of normalized) store.put(record);
      });
      return normalized;
    },
    async clear() { await transaction('readwrite', store => { store.clear(); }); },
  };
}

function assertBackupSize(value) {
  let text;
  try { text = typeof value === 'string' ? value : JSON.stringify(value); }
  catch { throw invalid('Не удалось прочитать структуру копии.'); }
  if (typeof text !== 'string' || text.length > MAX_BACKUP_BYTES || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) {
    throw invalid('Копия замеров и фото должна быть не больше 50 МБ.');
  }
}

function bytesToBase64(bytes) {
  const parts = [];
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    parts.push(String.fromCharCode(...bytes.subarray(offset, offset + 8192)));
  }
  return btoa(parts.join(''));
}

function base64ToBytes(data) {
  if (typeof data !== 'string' || !data.length || data.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4
    || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
    throw invalid('В копии повреждено фото: некорректный base64 или размер больше 5 МБ.');
  }
  let binary;
  try { binary = atob(data); } catch { throw invalid('В копии повреждён base64 фотографии.'); }
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  if (!bytes.length || bytes.length > MAX_PHOTO_BYTES || bytesToBase64(bytes) !== data) {
    throw invalid('В копии повреждено фото или превышен размер 5 МБ.');
  }
  return bytes;
}

function hasImageSignature(bytes, type) {
  if (type === 'image/jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  if (type === 'image/webp') {
    return bytes.length >= 12 && String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF'
      && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP';
  }
  return false;
}

export async function serializeBodyRecords(records) {
  const normalized = normalizeRecords(records);
  const approximateSize = normalized.reduce((total, record) => total
    + new TextEncoder().encode(JSON.stringify({ ...record, photos: {} })).length
    + Object.values(record.photos).reduce((photoTotal, photo) => photoTotal + Math.ceil(photo.size / 3) * 4 + 100, 0), 0);
  if (approximateSize > MAX_BACKUP_BYTES) throw invalid('Копия замеров и фото должна быть не больше 50 МБ.');
  const output = [];
  for (const record of normalized) {
    const photos = {};
    for (const [angle, photo] of Object.entries(record.photos)) {
      const bytes = new Uint8Array(await photo.arrayBuffer());
      if (!hasImageSignature(bytes, photo.type)) throw invalid('Не удалось экспортировать повреждённый файл фотографии.');
      photos[angle] = { type: photo.type, data: bytesToBase64(bytes) };
    }
    output.push({ ...record, photos });
  }
  assertBackupSize(output);
  return output;
}

export async function deserializeBodyRecords(data) {
  assertBackupSize(data);
  let records = data;
  if (typeof records === 'string') {
    try { records = JSON.parse(records); } catch { throw invalid('Копия содержит некорректный JSON.'); }
  }
  if (!Array.isArray(records) || records.length > MAX_BODY_RECORDS) {
    throw invalid(`Ожидается список не более чем из ${MAX_BODY_RECORDS} записей.`);
  }
  const decoded = [];
  for (const record of records) {
    plainObject(record, 'Запись');
    knownKeys(record, RECORD_KEYS, 'Запись');
    const photos = {};
    const sourcePhotos = record.photos === undefined ? {} : plainObject(record.photos, 'Фото');
    knownKeys(sourcePhotos, ANGLE_KEYS, 'Фото');
    for (const [angle, photo] of Object.entries(sourcePhotos)) {
      plainObject(photo, 'Фото');
      knownKeys(photo, new Set(['type', 'data']), 'Фото');
      if (!PHOTO_TYPES.has(photo.type)) throw invalid('В копии разрешены только фото JPEG, PNG и WebP.');
      const bytes = base64ToBytes(photo.data);
      if (!hasImageSignature(bytes, photo.type)) throw invalid('Содержимое фото не соответствует JPEG, PNG или WebP.');
      photos[angle] = new Blob([bytes], { type: photo.type });
    }
    decoded.push(normalizeBodyRecord({ ...record, photos }));
  }
  return normalizeRecords(decoded);
}

// Even reading window.indexedDB can throw in a restricted context, so defer that lookup too.
export const bodyStore = createBodyStore({
  open(name, version) { return globalThis.indexedDB.open(name, version); },
});
export default bodyStore;
