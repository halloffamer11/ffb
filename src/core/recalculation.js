import { logStructured, logTiming } from '../app/logger.js';
import { createStorageAdapter } from '../adapters/storage.js';
import { autoConfigure, calculatePoints } from './scoring.js';
import { calculatePlayerVBDWithValPercent } from './vbd.js';
import { computeTiers } from './tiers.js';

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
    // Get data from unified store first, then fallback to storage
    let players = [];
    let settings = {};
    let picks = [];
    
    try {
      // Try to get state from React store first
      const { useUnifiedStore } = await import('../stores/unified-store.ts');
      const store = useUnifiedStore.getState();
      players = store.players || [];
      settings = store.settings || {};
      picks = store.picks || [];
    } catch {
      // Fallback to storage
      const unifiedState = storage.get('state');
      if (unifiedState) {
        players = unifiedState.players || [];
        settings = unifiedState.settings || {};
        picks = unifiedState.picks || [];
      } else {
        // Legacy fallback
        players = storage.get('players') || [];
        settings = storage.get('leagueSettings') || {};
        const draftData = storage.get('draft') || {};
        picks = draftData.picks || [];
      }
    }
    
    const league = settings;
    const state = { draft: { picks } };
    
    if (!Array.isArray(players) || players.length === 0) return;

    const scoring = autoConfigure(league?.scoring?.preset || 'PPR', league?.scoring?.overrides || {});

    const t0 = performance.now();
    // Derive drafted flags from picks (keeps UI in sync after undo/redo)
    const draftedSet = new Set(
      Array.isArray(state?.draft?.picks) ? state.draft.picks.map(p => String(p.player?.id ?? p.playerId ?? p.playerName)) : []
    );

    const withPoints = players.map(p => ({
      ...p,
      // Preserve existing points if they exist, otherwise calculate from projections
      points: p.points !== undefined && p.points !== null ? safeNumber(p.points) : safeNumber(calculatePoints(p.projections?.stats || {}, scoring)),
      drafted: draftedSet.has(String(p.id ?? p.name))
    }));
    const t1 = performance.now();
    logTiming('recalc.points', t0, t1);

    const t2 = performance.now();
    const leagueForVbd = normalizeLeagueForVbd(league);
    const withVbdAndValPercent = calculatePlayerVBDWithValPercent(withPoints, leagueForVbd);
    const t3 = performance.now();
    logTiming('recalc.vbd_valpercent', t2, t3);
    
    // Debug: Log VBD and VAL% calculation results
    const vbdSample = withVbdAndValPercent.slice(0, 3).map(p => ({ 
      name: p.name, 
      points: p.points, 
      vbd: p.vbd,
      valPercent: p.valPercent 
    }));
    logStructured('info', 'vbd_valpercent:calculated', { samplePlayers: vbdSample, leagueSettings: leagueForVbd });

    const t4 = performance.now();
    const byPos = new Map();
    for (const p of withVbdAndValPercent) {
      const list = byPos.get(p.position) || [];
      list.push(p);
      byPos.set(p.position, list);
    }
    const tiers = computeTiers(byPos);
    const t5 = performance.now();
    logTiming('recalc.tiers', t4, t5);

    // Persist updated players (points, vbd, valPercent) and a lightweight tiers summary
    try {
      storage.set('players', withVbdAndValPercent);
      storage.set('tiers', serializeTiers(tiers));
      
      // CRITICAL: Also update the unified store with recalculated data
      try {
        const { useUnifiedStore } = await import('../stores/unified-store.ts');
        const store = useUnifiedStore.getState();
        store.importPlayers(withVbdAndValPercent); // This will trigger React re-renders
        console.log('✅ Updated unified store with recalculated VBD and VAL% data');
      } catch (storeError) {
        console.warn('Failed to update unified store:', storeError);
      }
      
      // Don't fire workspace:players-changed here to avoid infinite loop
      // Other UI components should listen to workspace:state-changed instead
    } catch {}

    const tEnd = performance.now();
    logTiming('recalc.total', tStart, tEnd);
    logStructured('info', 'recalc:complete', { players: withVbdAndValPercent.length });
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
  // Fix: teams can be an array (Team[]) or a number - handle both cases
  let teams;
  if (Array.isArray(league?.teams)) {
    teams = league.teams.length;
  } else if (typeof league?.teamCount === 'number') {
    teams = league.teamCount;
  } else if (typeof league?.teams === 'number') {
    teams = league.teams;
  } else if (Array.isArray(league?.owners)) {
    teams = league.owners.length;
  } else {
    teams = 12; // Default fallback
  }
  
  // Fix: Use settings.positions instead of league.roster
  const positions = league?.positions || {};
  
  // Default roster for standard fantasy leagues if no settings
  const defaultPositions = {
    QB: 1,
    RB: 2,
    WR: 2,
    TE: 1,
    FLEX: 1, // RB/WR/TE flex spot
    K: 1,
    DST: 1
  };
  
  // Map to expected structure in vbd.js
  const normalized = {
    teams,
    starters: {
      QB: Number(positions.QB ?? defaultPositions.QB),
      RB: Number(positions.RB ?? defaultPositions.RB),
      WR: Number(positions.WR ?? defaultPositions.WR),
      TE: Number(positions.TE ?? defaultPositions.TE),
      K: Number(positions.K ?? defaultPositions.K),
      DST: Number(positions.DST ?? defaultPositions.DST),
      FLEX: Number(positions.FLEX ?? defaultPositions.FLEX)
    },
    // Fix: Pass through flexConfig for proper FLEX baseline calculation
    flexConfig: league?.flexConfig
  };
  
  // Debug log to see what settings are being used
  console.log('VBD League Settings:', normalized);
  console.log('Original league.teams:', league?.teams, 'Array?', Array.isArray(league?.teams));
  console.log('Computed teams:', teams);
  
  return normalized;
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