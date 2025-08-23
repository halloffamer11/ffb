/**
 * Value-Based Drafting (VBD) calculation utilities (T-007)
 * 
 * Complete implementation with:
 * - IR player exclusion from baselines
 * - FLEX position handling
 * - 2QB/Superflex support
 * - Edge case handling (all drafted, negative VBD)
 *
 * Player shape expected:
 * { id, name, position, team, points, injuryStatus?, drafted? }
 */

// Injury status enum values
const INJURY_STATUS = {
  HEALTHY: 0,
  Q: 1,        // Questionable
  D: 2,        // Doubtful  
  O: 3,        // Out
  IR: 4,       // Injured Reserve (excluded from VBD)
  PUP: 5,      // PUP List
  NA: 6        // Not Available
};

/**
 * Calculate VBD baselines per position using league settings.
 * Baseline rank per position = teams * startersPerPosition.
 * IR players are excluded from baseline calculations.
 */
export function calculateBaselines(players, leagueSettings) {
  const { teams, starters } = leagueSettings;
  const playersByPosition = new Map();

  // Filter out IR players and undrafted players for baseline calculation
  const eligiblePlayers = players.filter(p => {
    // Exclude IR players from baselines
    if (p.injuryStatus === INJURY_STATUS.IR) return false;
    // Include only undrafted players for baseline
    if (p.drafted) return false;
    return true;
  });

  for (const player of eligiblePlayers) {
    const list = playersByPosition.get(player.position) || [];
    list.push(player);
    playersByPosition.set(player.position, list);
  }

  const baselines = new Map();
  
  // Calculate baselines for each position
  for (const [position, list] of playersByPosition.entries()) {
    list.sort((a, b) => b.points - a.points);
    const startersRequired = starters[position] ?? 0;
    
    const baselineIndex = Math.max(0, Math.min(list.length - 1, teams * startersRequired - 1));
    const baselinePoints = list.length === 0 ? 0 : list[baselineIndex]?.points ?? 0;
    baselines.set(position, baselinePoints);
  }
  
  // Calculate FLEX baseline separately after position baselines
  if ((starters.FLEX ?? 0) > 0) {
    const flexEligible = eligiblePlayers.filter(p => 
      ['RB', 'WR', 'TE'].includes(p.position)
    ).sort((a, b) => b.points - a.points);
    
    const flexIndex = Math.max(0, Math.min(flexEligible.length - 1, teams * starters.FLEX - 1));
    const flexBaseline = flexEligible[flexIndex]?.points ?? 0;
    baselines.set('FLEX', flexBaseline);
  }

  // Handle 2QB/Superflex if present
  if (starters.SUPERFLEX > 0) {
    const sfEligible = eligiblePlayers.filter(p => 
      ['QB', 'RB', 'WR', 'TE'].includes(p.position)
    ).sort((a, b) => b.points - a.points);
    
    const sfIndex = Math.max(0, Math.min(sfEligible.length - 1, teams * starters.SUPERFLEX - 1));
    baselines.set('SUPERFLEX', sfEligible[sfIndex]?.points ?? 0);
  }

  return baselines;
}

/**
 * Calculate VBD values for all players, returning a new array with { ...player, vbd }.
 * Handles edge cases like negative VBD and all players drafted at position.
 */
export function calculatePlayerVBD(players, leagueSettings) {
  const baselines = calculateBaselines(players, leagueSettings);
  
  return players.map(p => {
    // IR players get marked but still get VBD for reference
    const isIR = p.injuryStatus === INJURY_STATUS.IR;
    
    // Get baseline for position
    let baseline = baselines.get(p.position) ?? 0;
    
    // For FLEX-eligible players, use the higher of position or FLEX baseline
    if (['RB', 'WR', 'TE'].includes(p.position) && baselines.has('FLEX')) {
      baseline = Math.max(baseline, baselines.get('FLEX'));
    }
    
    // Calculate VBD (can be negative)
    const vbd = (p.points ?? 0) - baseline;
    
    return { 
      ...p, 
      vbd: Math.round(vbd * 10) / 10, // Round to 1 decimal
      vbdExcluded: isIR // Mark IR players
    };
  });
}

/**
 * Recalculate VBD after draft events (players being marked as drafted)
 */
export function recalculateVBD(players, leagueSettings) {
  // This will automatically handle drafted players since calculateBaselines filters them
  return calculatePlayerVBD(players, leagueSettings);
}

/**
 * Convenience method for benchmarking: compute VBD and return a checksum to ensure work is not optimized away.
 */
export function vbdChecksum(players, leagueSettings) {
  const withVbd = calculatePlayerVBD(players, leagueSettings);
  let sum = 0;
  for (let i = 0; i < withVbd.length; i += 1) {
    sum += withVbd[i].vbd;
  }
  return sum;
}

/** Baseline helper for a single position */
export function baselineForPosition(players, position, leagueSettings) {
  const { teams, starters } = leagueSettings;
  const list = players.filter(p => p.position === position).sort((a, b) => b.points - a.points);
  const idx = Math.max(0, Math.min(list.length - 1, teams * (starters[position] ?? 0) - 1));
  return list.length === 0 ? 0 : (list[idx]?.points ?? 0);
}


