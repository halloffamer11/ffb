/* T-010: State store tests */

import { DraftStore } from '../../src/state/store.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

// Stub storage that records last set
function createStubStorage() {
  let last = null;
  return {
    set(key, value) { last = { key, value }; return { ok: true }; },
    _last() { return last; }
  };
}

// 1) basic init and subscribe/emit
{
  const store = new DraftStore({ initialState: { settings: { teams: 12 }, players: [], draft: { picks: [] } } });
  let changed = 0; store.subscribe('change', () => { changed += 1; });
  store.dispatch({ type: 'SET_SETTINGS', payload: { teams: 10 } });
  const s = store.getState();
  assertOkay('settings updated', s.settings.teams === 10);
  assertOkay('change emitted', changed === 1);
}

// 2) import players and toggle drafted, undo works
{
  const st = createStubStorage();
  const store = new DraftStore({ storageAdapter: st });
  store.dispatch({ type: 'IMPORT_PLAYERS', payload: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }] });
  store.dispatch({ type: 'PLAYER_TOGGLE_DRAFTED', payload: { id: 2 } });
  let state = store.getState();
  assertOkay('drafted toggled', state.players.find(p => p.id === 2).drafted === true);
  const ok = store.undo();
  assertOkay('undo returned true', ok === true);
  state = store.getState();
  assertOkay('undo restored drafted=false', state.players.find(p => p.id === 2).drafted !== true);
}

// 3) pick add/edit and non-blocking save
{
  const st = createStubStorage();
  const store = new DraftStore({ storageAdapter: st });
  store.dispatch({ type: 'DRAFT_PICK_ADD', payload: { playerId: 1, teamId: 3, price: 25 } });
  const before = store.getState().draft.picks.length;
  store.dispatch({ type: 'DRAFT_PICK_EDIT', payload: { index: 0, update: { price: 30 } } });
  const after = store.getState().draft.picks[0].price;
  assertOkay('pick added then edited', before === 1 && after === 30);
}


