import { createStorageAdapter } from '../adapters/storage.js';
import { DraftStore } from '../state/store.js';
import { logStructured } from '../app/logger.js';

let singleton = null;

function createInitialFromStorage(storage) {
  const st = storage.get('state') || { settings: {}, players: [], draft: { picks: [] } };
  return st;
}

function dispatchStateChanged() {
  try { window.dispatchEvent(new CustomEvent('workspace:state-changed')); } catch {}
}

export function getStore() {
  if (singleton) return singleton;
  const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });
  const init = createInitialFromStorage(storage);
  const store = new DraftStore({ initialState: init, storageAdapter: storage, version: '1.0.0' });
  try {
    const undoArr = storage.get('state.undo') || [];
    const redoArr = storage.get('state.redo') || [];
    store.hydrateHistory(undoArr, redoArr);
  } catch {}
  store.subscribe('change', (state) => {
    logStructured('debug', 'store:change', { picks: state?.draft?.picks?.length || 0 });
    dispatchStateChanged();
  });
  store.subscribe('action', (payload) => {
    logStructured('debug', 'store:action', { type: payload?.action?.type });
  });
  singleton = store;
  return store;
}

export const storeBridge = {
  getState() { return getStore().getState(); },
  dispatch(action) { return getStore().dispatch(action); },
  addPick(pick) { getStore().dispatch({ type: 'DRAFT_PICK_ADD', payload: pick }); },
  editPick(index, update) { getStore().dispatch({ type: 'DRAFT_PICK_EDIT', payload: { index, update } }); },
  undo() { return getStore().undo(); },
  redo() { return getStore().redo(); },
  canUndo() { return getStore().canUndo(); },
  canRedo() { return getStore().canRedo(); },
  subscribe(event, fn) { return getStore().subscribe(event, fn); }
};


