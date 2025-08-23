import { logStructured, logTiming } from '../app/logger.js';
import { createStorageAdapter } from '../adapters/storage.js';
import { autoConfigure, calculatePoints } from '../core/scoring.js';
import { calculatePlayerVBD } from '../core/vbd.js';
import { computeTiers } from '../core/tiers.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

/**
 * Real-time recalculation engine (T-021)
 * Pipeline on draft or player changes:
 *   points -> vbd -> tiers
 * Also emits timing logs and updates players in storage (non-blocking).
 */
export async function recalcAll() {
  const tStart = performance.now();
  try {
    const league = storage.get('leagueSettings') || {};
    const players = storage.get('players') || [];
    
    // Get state from store bridge for consistency
    let state;
    try {
      const { storeBridge } = await import('./storeBridge.js');
      state = storeBridge.getState();
    } catch {
      state = storage.get('state') || { draft: { picks: [] } };
    }
    
    if (!Array.isArray(players) || players.length === 0) return;

    const scoring = autoConfigure(league?.scoring?.preset || 'PPR', league?.scoring?.overrides || {});

    const t0 = performance.now();
    // Derive drafted flags from picks (keeps UI in sync after undo/redo)
    const draftedSet = new Set(
      Array.isArray(state?.draft?.picks) ? state.draft.picks.map(p => String(p.playerId ?? p.playerName)) : []
    );

    const withPoints = players.map(p => ({
      ...p,
      points: safeNumber(calculatePoints(p.projections?.stats || {}, scoring)),
      drafted: draftedSet.has(String(p.id ?? p.name))
    }));
    const t1 = performance.now();
    logTiming('recalc.points', t0, t1);

    const t2 = performance.now();
    const leagueForVbd = normalizeLeagueForVbd(league);
    const withVbd = calculatePlayerVBD(withPoints, leagueForVbd);
    const t3 = performance.now();
    logTiming('recalc.vbd', t2, t3);

    const t4 = performance.now();
    const byPos = new Map();
    for (const p of withVbd) {
      const list = byPos.get(p.position) || [];
      list.push(p);
      byPos.set(p.position, list);
    }
    const tiers = computeTiers(byPos);
    const t5 = performance.now();
    logTiming('recalc.tiers', t4, t5);

    // Persist updated players (points, vbd) and a lightweight tiers summary
    try {
      storage.set('players', withVbd);
      storage.set('tiers', serializeTiers(tiers));
      // Don't fire workspace:players-changed here to avoid infinite loop
      // Other UI components should listen to workspace:state-changed instead
    } catch {}

    const tEnd = performance.now();
    logTiming('recalc.total', tStart, tEnd);
    logStructured('info', 'recalc:complete', { players: withVbd.length });
  } catch (err) {
    logStructured('error', 'recalc:error', { error: String(err && err.message || err) });
  }
}

export function attachRecalcListeners() {
  const handler = () => { try { queueMicrotask(recalcAll); } catch { setTimeout(recalcAll, 0); } };
  window.addEventListener('workspace:state-changed', handler);
  // Note: Don't listen to workspace:players-changed to avoid infinite loop
  // since recalcAll updates players storage
}

function normalizeLeagueForVbd(league) {
  const teams = Number(league?.teams || (league?.owners?.length || 12));
  const r = league?.roster || {};
  // Map to expected structure in vbd.js
  return {
    teams,
    starters: {
      QB: Number(r.QB || 1),
      RB: Number(r.RB || 2),
      WR: Number(r.WR || 2),
      TE: Number(r.TE || 1),
      K: Number(r.K || 0),
      DST: Number(r.DST || 0),
      FLEX: Number(r.FLEX || 0)
    }
  };
}

function serializeTiers(tiersMap) {
  const out = {};
  for (const [pos, data] of tiersMap.entries()) {
    out[pos] = {
      threshold: data.threshold,
      tiers: data.tiers.map(t => t.map(p => p.id ?? p.name))
    };
  }
  return out;
}

function safeNumber(n) { return Number.isFinite(Number(n)) ? Number(n) : 0; }


