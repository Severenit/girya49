const SESSION_COUNT = 49;
const recorded = entry => entry?.status === 'complete' || entry?.status === 'partial';

function unfinishedActive(state) {
  const active = state?.active;
  return active && Number.isInteger(active.day) && active.day >= 0 && active.day < SESSION_COUNT &&
    Array.isArray(active.steps) && Number.isInteger(active.position) && active.position >= 0 &&
    active.position < active.steps.length ? active : null;
}

/** Partial sessions remain in history and count as attended sessions. */
export function passedCount(state) {
  let count = 0;
  for (let i = 0; i < SESSION_COUNT; i++) if (recorded(state?.completions?.[i])) count++;
  return count;
}

/** Preserve an unfinished workout before returning to the first gap in the plan. */
export function nextSession(state) {
  const active = unfinishedActive(state);
  if (active) return active.day;
  for (let i = 0; i < SESSION_COUNT; i++) if (!recorded(state?.completions?.[i])) return i;
  return null;
}

/** Local civil date: stored UTC timestamps must not be sliced to obtain a day. */
export function localDateKey(value = new Date()) {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function completedToday(state, now = new Date()) {
  const today = localDateKey(now);
  if (!today) return false;
  for (let i = 0; i < SESSION_COUNT; i++) {
    const entry = state?.completions?.[i];
    if (recorded(entry) && typeof entry.at === 'string' && localDateKey(entry.at) === today) return true;
  }
  return false;
}

function localNoon(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

/** Estimate one remaining session per day; calendar arithmetic also handles DST. */
export function projectedFinish(state, now = new Date()) {
  if (!localDateKey(now)) return null;
  const remaining = SESSION_COUNT - passedCount(state);
  if (!remaining) {
    let latest = null;
    for (let i = 0; i < SESSION_COUNT; i++) {
      const entry = state?.completions?.[i];
      if (!recorded(entry) || typeof entry.at !== 'string' || !localDateKey(entry.at)) continue;
      const date = new Date(entry.at);
      if (!latest || date > latest) latest = date;
    }
    return localNoon(latest || now);
  }
  const finish = localNoon(now);
  const active = unfinishedActive(state);
  const continuingRemainingSession = active && !recorded(state?.completions?.[active.day]);
  const waitUntilTomorrow = completedToday(state, now) && !continuingRemainingSession;
  finish.setDate(finish.getDate() + remaining - 1 + Number(waitUntilTomorrow));
  return finish;
}
