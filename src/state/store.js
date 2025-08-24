/**
 * Draft State Store (T-010)
 * - Single source of truth
 * - Event bus (pub/sub)
 * - 10-level undo stack
 * - Action logging
 * - Optional workspace sync (non-blocking) via injected storage adapter
 *
 * Pure core: no DOM usage, storage adapter injected.
 */

import { 
  calculateRemainingBudget, 
  countSpotsRemaining, 
  calculateMaxBid 
} from '../core/budget.js';

/**
 * @typedef {Object} StoreOptions
 * @property {object} [initialState]
 * @property {{ set: (key:string, value:any)=>{ok:boolean,error?:string} }|null} [storageAdapter]
 * @property {string} [version]
 */

export class DraftStore {
  /**
   * @param {StoreOptions} [options]
   */
  constructor(options = {}) {
    this.version = String(options.version || '1.0.0');
    this.storage = options.storageAdapter || null;
    this.state = deepClone(options.initialState || createInitialState());
    this.listeners = new Map(); // eventName -> Set<fn>
    this.undoStack = []; // array of state snapshots
    this.maxUndo = 10;
    this.actionLog = []; // { type, ts, durationMs }
    this.redoStack = [];
  }

  /** @returns {object} */
  getState() {
    return deepClone(this.state);
  }

  /**
   * Subscribe to an event. Known events: 'change', 'action'
   * @param {string} event
   * @param {(payload:any)=>void} fn
   * @returns {() => void} unsubscribe
   */
  subscribe(event, fn) {
    const key = String(event || '');
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    const set = this.listeners.get(key);
    set.add(fn);
    return () => { set.delete(fn); };
  }

  /**
   * Dispatch an action to update state.
   * @param {{ type: string, payload?: any }} action
   */
  dispatch(action) {
    const ts = Date.now();
    validateAction(action);
    // snapshot for undo
    this._pushUndoSnapshot();
    // New action invalidates redo history
    this.redoStack = [];

    const t0 = performanceNow();
    this._apply(action);
    const t1 = performanceNow();
    this.actionLog.push({ type: action.type, ts, durationMs: t1 - t0 });

    this._emit('action', { action, state: this.getState() });
    this._emit('change', this.getState());
    this._saveAsync();
  }

  /** Undo last change, if any */
  undo() {
    if (this.undoStack.length === 0) return false;
    const prev = this.undoStack.pop();
    // current -> redo, prev -> state
    this.redoStack.push(deepClone(this.state));
    this.state = deepClone(prev);
    this._emit('change', this.getState());
    this._saveAsync();
    return true;
  }

  /** Redo last undone change, if any */
  redo() {
    if (this.redoStack.length === 0) return false;
    const next = this.redoStack.pop();
    // current -> undo, next -> state
    this._pushUndoSnapshot();
    this.state = deepClone(next);
    this._emit('change', this.getState());
    this._saveAsync();
    return true;
  }

  /** @returns {boolean} */
  canUndo() { return this.undoStack.length > 0; }
  /** @returns {boolean} */
  canRedo() { return this.redoStack.length > 0; }

  /** Hydrate undo/redo history (e.g., from storage) */
  hydrateHistory(undoArr, redoArr) {
    if (Array.isArray(undoArr)) this.undoStack = deepClone(undoArr);
    if (Array.isArray(redoArr)) this.redoStack = deepClone(redoArr);
  }

  /** Internal: apply action to state (pure mutation isolated here) */
  _apply(action) {
    const { type, payload } = action;
    switch (type) {
      case 'SET_SETTINGS': {
        this.state.settings = deepClone(payload || {});
        break;
      }
      case 'IMPORT_PLAYERS': {
        const arr = Array.isArray(payload) ? payload : [];
        this.state.players = arr.map(p => ({ ...p }));
        break;
      }
      case 'PLAYER_TOGGLE_DRAFTED': {
        const id = payload?.id ?? payload?.name;
        const idx = this.state.players.findIndex(p => String(p.id ?? p.name) === String(id));
        if (idx >= 0) this.state.players[idx].drafted = !this.state.players[idx].drafted;
        break;
      }
      case 'DRAFT_PICK_ADD': {
        const pick = { ...payload, timestamp: Date.now() };
        
        // Budget validation before adding pick
        if (pick.teamId && pick.price) {
          const teamId = Number(pick.teamId);
          const price = Number(pick.price);
          const minBid = Number(this.state.settings?.minBid || 1);
          
          // Calculate current budget situation
          const remainingBudget = calculateRemainingBudget(teamId, this.state.settings, this.state.draft.picks);
          const spotsRemaining = countSpotsRemaining(teamId, this.state.settings, this.state.draft.picks);
          const maxBid = calculateMaxBid(remainingBudget, spotsRemaining, minBid);
          
          // Validate the bid
          if (price > remainingBudget) {
            throw new Error(`Budget exceeded: ${pick.player?.name || 'Player'} costs $${price} but only $${remainingBudget} remaining`);
          }
          
          if (price > maxBid) {
            throw new Error(`Max bid exceeded: ${pick.player?.name || 'Player'} costs $${price} but max bid is $${maxBid} (need $${minBid} minimum for ${spotsRemaining - 1} remaining spots)`);
          }
          
          if (price < minBid) {
            throw new Error(`Below minimum bid: ${pick.player?.name || 'Player'} costs $${price} but minimum bid is $${minBid}`);
          }
        }
        
        this.state.draft.picks.push(pick);
        break;
      }
      case 'DRAFT_PICK_EDIT': {
        const { index, update } = payload || {};
        // Accept 1-based index from UI; convert to 0-based internally
        const zeroIdx = Number.isInteger(index) ? (index - 1) : NaN;
        if (Number.isInteger(zeroIdx) && zeroIdx >= 0 && zeroIdx < this.state.draft.picks.length) {
          this.state.draft.picks[zeroIdx] = { ...this.state.draft.picks[zeroIdx], ...update };
        }
        break;
      }
      case 'KEEPER_ADD': {
        if (!this.state.draft.keepers) this.state.draft.keepers = [];
        this.state.draft.keepers.push({ ...payload });
        break;
      }
      case 'KEEPER_UPDATE_COST': {
        const { index, cost } = payload || {};
        if (Number.isInteger(index) && index >= 0 && index < (this.state.draft.keepers?.length || 0)) {
          this.state.draft.keepers[index].cost = cost;
        }
        break;
      }
      case 'KEEPER_REMOVE': {
        const index = payload;
        if (Number.isInteger(index) && index >= 0 && index < (this.state.draft.keepers?.length || 0)) {
          this.state.draft.keepers.splice(index, 1);
        }
        break;
      }
      case 'KEEPER_CLEAR': {
        this.state.draft.keepers = [];
        break;
      }
      case 'DRAFT_CLEAR': {
        this.state.draft.picks = [];
        break;
      }
      default: {
        // Unknown action: no-op for forward compatibility
        break;
      }
    }
  }

  _emit(event, payload) {
    const set = this.listeners.get(String(event));
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch {}
    }
  }

  _pushUndoSnapshot() {
    if (this.undoStack.length >= this.maxUndo) {
      this.undoStack.shift();
    }
    this.undoStack.push(deepClone(this.state));
  }

  _saveAsync() {
    if (!this.storage || typeof this.storage.set !== 'function') return;
    // Non-blocking save after state update
    setTimeout(() => {
      try {
        this.storage.set('state', this.state);
        // Persist limited history for undo/redo per T-022
        // Keep shallow copies; storage adapter JSON-serializes
        this.storage.set('state.undo', this.undoStack.slice(-this.maxUndo));
        this.storage.set('state.redo', this.redoStack.slice(-this.maxUndo));
        this.storage.set('state.actionLog', this.actionLog.slice(-100));
      } catch {}
    }, 0);
  }
}

// Helpers
function createInitialState() {
  return {
    settings: {},
    players: [],
    draft: { picks: [], keepers: [] }
  };
}

function validateAction(action) {
  if (!action || typeof action.type !== 'string' || action.type.length === 0) {
    throw new Error('Invalid action');
  }
}

function deepClone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

function performanceNow() {
  try { return Number(process.hrtime.bigint()) / 1e6; } catch { return Date.now(); }
}


