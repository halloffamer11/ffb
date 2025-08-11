/**
 * Auto-backup utilities for DraftStore using storage adapter's namespace.
 * Keeps rolling backups via createBackupManager(adapter, { maxBackups }).
 */

import { createBackupManager } from './storage.js';

/**
 * Attach automatic backups on every store change.
 * @param {import('../state/store.js').DraftStore} store
 * @param {import('./storage.js').createStorageAdapter} storageAdapter
 * @param {{ maxBackups?: number }} [options]
 * @returns {() => void} unsubscribe
 */
export function attachAutoBackup(store, storageAdapter, options = {}) {
  const backups = createBackupManager(storageAdapter, { maxBackups: options.maxBackups ?? 3 });
  const unsub = store.subscribe('change', () => {
    try {
      const snapshot = buildBackupEnvelope(store);
      backups.save(snapshot);
    } catch {}
  });
  return unsub;
}

export function buildBackupEnvelope(store) {
  const state = store.getState();
  const json = JSON.stringify(state);
  return {
    version: store.version || '1.0.0',
    timestamp: Date.now(),
    size: json.length,
    state
  };
}

export function validateBackup(envelope) {
  if (!envelope || typeof envelope !== 'object') return false;
  if (!envelope.version || !envelope.timestamp || !envelope.state) return false;
  const len = JSON.stringify(envelope.state).length;
  return Number.isFinite(envelope.size) ? (envelope.size === len) : true;
}

export function listBackupKeys(adapter) {
  return (adapter.keys() || []).filter(k => k.startsWith('__backup::')).sort();
}

export function loadLatestBackup(adapter) {
  const keys = listBackupKeys(adapter);
  if (!keys.length) return null;
  const latestKey = keys[keys.length - 1];
  return adapter.get(latestKey);
}


