import { createStorageAdapter } from '../adapters/storage.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

/**
 * Structured logging utility (T-024 phase 1)
 * - Writes to console
 * - Persists last 200 logs under `logs`
 * - Optionally emits a browser event for observers (debug panel)
 */
export function logStructured(level, message, data) {
  const entry = {
    ts: Date.now(),
    level: String(level || 'info').toLowerCase(),
    message: String(message || ''),
    data: safeClone(data)
  };
  try {
    const lvl = entry.level;
    const fn = (console[lvl] || console.log).bind(console);
    fn(`[FFB] ${entry.message}`, entry.data || '');
  } catch {}
  try {
    const arr = storage.get('logs') || [];
    arr.push(entry);
    while (arr.length > 200) arr.shift();
    storage.set('logs', arr);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('ffb:log', { detail: entry }));
  } catch {}
  return entry;
}

export function logTiming(label, startMs, endMs) {
  const dur = Math.max(0, Number(endMs - startMs));
  return logStructured('debug', `timing:${label}`, { durationMs: dur });
}

function safeClone(obj) {
  try { return obj == null ? obj : JSON.parse(JSON.stringify(obj)); } catch { return undefined; }
}


