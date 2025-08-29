/* T-011: Auto-backup tests */

import { DraftStore } from '../../src/state/store.js';
import { createStorageAdapter } from '../../src/adapters/storage.js';
import { attachAutoBackup, loadLatestBackup, validateBackup } from '../../src/adapters/backup.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

// 1) Auto backup on change keeps 3 and validates size
{
  const mem = new (class MemoryStorage { constructor(){this._m=new Map();} get length(){return this._m.size;} key(i){return Array.from(this._m.keys())[i]??null;} getItem(k){return this._m.has(k)?this._m.get(k):null;} removeItem(k){this._m.delete(k);} setItem(k,v){this._m.set(k,v);} })();
  const adapter = createStorageAdapter({ driver: mem, namespace: 'bk_demo' });
  const store = new DraftStore({ storageAdapter: adapter, initialState: { settings: { teams: 12 }, players: [], draft: { picks: [] } } });
  const unsub = attachAutoBackup(store, adapter, { maxBackups: 3 });
  store.dispatch({ type: 'IMPORT_PLAYERS', payload: [{ id: 1, name: 'A' }] });
  store.dispatch({ type: 'PLAYER_TOGGLE_DRAFTED', payload: { id: 1 } });
  store.dispatch({ type: 'DRAFT_PICK_ADD', payload: { playerId: 1, teamId: 1, price: 10 } });
  unsub();
  const latest = loadLatestBackup(adapter);
  assertOkay('latest backup exists', !!latest);
  assertOkay('backup validates', validateBackup(latest));
}


