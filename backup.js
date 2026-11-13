import { bodyStore, serializeBodyRecords, deserializeBodyRecords } from './body-store.js';

export const MAX_BACKUP_BYTES = 70 * 1024 * 1024;

function workoutFrom(value, normalizeWorkout) {
  if (!value || typeof value !== 'object' || value.version !== 1 ||
      !value.completions || typeof value.completions !== 'object' || Array.isArray(value.completions)) {
    throw new Error('В файле нет корректной копии тренировок.');
  }
  const invalid = () => { throw new Error('Копия тренировок повреждена. Текущие записи не изменены.'); };
  for (const [day, entry] of Object.entries(value.completions)) {
    if (!/^(?:[0-9]|[1-3][0-9]|4[0-8])$/.test(day) || !entry ||
        !['complete','partial'].includes(entry.status) ||
        (entry.at !== undefined && typeof entry.at !== 'string') ||
        (entry.skipped !== undefined && (!Number.isInteger(entry.skipped) || entry.skipped < 0))) invalid();
  }
  if (value.settings !== undefined) {
    if (!value.settings || typeof value.settings !== 'object' || Array.isArray(value.settings)) invalid();
    for (const key of ['sound','vibration','floorpress','swings','easy','dailyPractice']) {
      if (value.settings[key] !== undefined && typeof value.settings[key] !== 'boolean') invalid();
    }
    if (value.settings.mode !== undefined && !['reps','timer'].includes(value.settings.mode)) invalid();
    if (value.settings.timerSeconds !== undefined && ![30,40,45,60].includes(value.settings.timerSeconds)) invalid();
  }
  if (value.active != null) {
    const active = value.active;
    if (!active || typeof active !== 'object' || !Array.isArray(active.steps)) invalid();
    if (active.skipped !== undefined && (!Array.isArray(active.skipped) || active.skipped.some(i => !Number.isInteger(i) || i < 0 || i >= active.steps.length))) invalid();
    if (active.timer != null) {
      const timer = active.timer;
      if (typeof timer !== 'object' || typeof timer.running !== 'boolean' ||
          !Number.isFinite(timer.duration) || timer.duration < 0 || timer.duration > 3600000 ||
          !Number.isFinite(timer.remaining) || timer.remaining < 0 || timer.remaining > 3600000 ||
          (timer.running && !Number.isFinite(timer.deadline))) invalid();
    }
  }
  const normalized = normalizeWorkout(value);
  if (value.active != null && !normalized.active) invalid();
  return normalized;
}

export async function createBackup(workout, store = bodyStore) {
  const snapshot = JSON.parse(JSON.stringify(workout));
  const records = await store.list();
  return {
    version: 2,
    createdAt: new Date().toISOString(),
    workout: snapshot,
    body: await serializeBodyRecords(records),
  };
}

export async function readBackup(data, normalizeWorkout) {
  if (typeof normalizeWorkout !== 'function') throw new TypeError('Нужна проверка данных тренировок.');
  if (data?.version === 1) return { workout: workoutFrom(data, normalizeWorkout), body: null };
  if (data?.version !== 2 || !Array.isArray(data.body)) throw new Error('Это не копия приложения «Гиря 49».');
  const workout = workoutFrom(data.workout, normalizeWorkout);
  const body = await deserializeBodyRecords(data.body);
  return { workout, body };
}

// writeWorkout must be atomic: commit localStorage before replacing in-memory state.
// A failed photo transaction never changes workouts. A failed workout write rolls photos back.
export async function restoreBackup(parsed, { store = bodyStore, writeWorkout }) {
  if (typeof writeWorkout !== 'function') throw new TypeError('Нужно сохранение тренировок.');
  if (parsed.body === null) {
    await writeWorkout(parsed.workout);
    return;
  }
  const previousBody = await store.list();
  await store.replaceAll(parsed.body);
  try {
    await writeWorkout(parsed.workout);
  } catch (error) {
    try {
      await store.replaceAll(previousBody);
    } catch {
      throw new Error('Фото и замеры загружены, но отметки тренировок восстановить не удалось. Скачай копию перед повторной попыткой.', { cause: error });
    }
    throw new Error('Не удалось сохранить копию. Прежние фото, замеры и отметки сохранены.', { cause: error });
  }
}
