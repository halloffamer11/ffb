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
    this.state = deepClone(prev);
    this._emit('change', this.getState());
    this._saveAsync();
    return true;
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
        this.state.draft.picks.push(pick);
        break;
      }
      case 'DRAFT_PICK_EDIT': {
        const { index, update } = payload || {};
        if (Number.isInteger(index) && index >= 0 && index < this.state.draft.picks.length) {
          this.state.draft.picks[index] = { ...this.state.draft.picks[index], ...update };
        }
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
      try { this.storage.set('state', this.state); } catch {}
    }, 0);
  }
}

// Helpers
function createInitialState() {
  return {
    settings: {},
    players: [],
    draft: { picks: [] }
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


