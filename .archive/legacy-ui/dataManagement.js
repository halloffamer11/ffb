import { importFromCsvText } from '../adapters/import.js';
import { createStorageAdapter } from '../adapters/storage.js';

const store = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

export async function loadPlayersFromFile(file) {
  const text = await file.text();
  const res = importFromCsvText(text);
  // Map records to data for consistent API
  if (res.ok) {
    return { ok: true, data: res.records };
  }
  return res;
}

export function savePlayersToWorkspace(records) {
  return store.set('players', records);
}

export function loadPlayersFromWorkspace() {
  return store.get('players') || [];
}

export function withSourceTag(records, source) {
  return (records || []).map(r => ({ ...r, __source: source }));
}


