import { importFromCsvText } from '../adapters/import.js';
import { createStorageAdapter } from '../adapters/storage.js';

const store = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

export async function loadPlayersFromFile(file) {
  const text = await file.text();
  const res = importFromCsvText(text);
  return res;
}

export function savePlayersToWorkspace(records) {
  return store.set('players', records);
}

export function loadPlayersFromWorkspace() {
  return store.get('players') || [];
}


