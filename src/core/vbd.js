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
    
    // Debug: baseline calculation
    console.log(`VBD Baseline ${position}: index=${baselineIndex}, points=${baselinePoints}, players=${list.length}, teams=${teams}, starters=${startersRequired}`);
  }
  
  // Calculate FLEX baseline separately after position baselines
  if ((starters.FLEX ?? 0) > 0) {
    // Get allowed positions from flexConfig, fallback to traditional RB/WR/TE
    let allowedPositions = ['RB', 'WR', 'TE'];
    
    if (leagueSettings.flexConfig?.spots?.length > 0) {
      // Get all positions that are allowed in any flex spot
      const positionSet = new Set();
      leagueSettings.flexConfig.spots.forEach(spot => {
        if (spot.allowedPositions.QB) positionSet.add('QB');
        if (spot.allowedPositions.RB) positionSet.add('RB');
        if (spot.allowedPositions.WR) positionSet.add('WR');
        if (spot.allowedPositions.TE) positionSet.add('TE');
      });
      allowedPositions = Array.from(positionSet);
    }
    
    const flexEligible = eligiblePlayers.filter(p => 
      allowedPositions.includes(p.position)
    ).sort((a, b) => b.points - a.points);
    
    const flexIndex = Math.max(0, Math.min(flexEligible.length - 1, teams * starters.FLEX - 1));
    const flexBaseline = flexEligible[flexIndex]?.points ?? 0;
    baselines.set('FLEX', flexBaseline);
    
    console.log(`VBD FLEX baseline: allowed=${allowedPositions.join(',')}, baseline=${flexBaseline}`);
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
  
  // Debug: log baselines
  console.log('VBD Baselines calculated:', Object.fromEntries(baselines));
  
  const result = players.map(p => {
    // IR players get marked but still get VBD for reference
    const isIR = p.injuryStatus === INJURY_STATUS.IR;
    
    // Get baseline for position
    let baseline = baselines.get(p.position) ?? 0;
    
    // For FLEX-eligible players, use the higher of position or FLEX baseline
    // Check if this player's position is allowed in any flex spot
    let isFlexEligible = false;
    if (leagueSettings.flexConfig?.spots?.length > 0) {
      isFlexEligible = leagueSettings.flexConfig.spots.some(spot => 
        spot.allowedPositions[p.position]
      );
    } else {
      // Fallback to traditional flex positions
      isFlexEligible = ['RB', 'WR', 'TE'].includes(p.position);
    }
    
    if (isFlexEligible && baselines.has('FLEX')) {
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
  
  // Debug: show sample VBD calculations
  const topPlayers = result
    .filter(p => p.vbd !== undefined)
    .sort((a, b) => (b.vbd || 0) - (a.vbd || 0))
    .slice(0, 5);
  console.log('Top 5 VBD players:', topPlayers.map(p => ({ name: p.name, pos: p.position, points: p.points, vbd: p.vbd })));
  
  return result;
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

// Position groups configuration for VAL% calculations
const POSITION_GROUPS = {
  'QB': ['QB'],
  'RB': ['RB'], 
  'WR': ['WR'],
  'TE': ['TE'],
  'FLEX': ['RB', 'WR', 'TE'],
  'K': ['K'],
  'DST': ['DST']
};

/**
 * Calculate VAL% (Value Percentage) for all players.
 * VAL% = (max(0, player_VBD) / sum_of_undrafted_positive_VBD_at_position) × 100
 * 
 * @param {Array} players - Array of players with VBD already calculated
 * @param {Object} leagueSettings - League configuration for FLEX position handling
 * @returns {Array} Players with valPercent property added
 */
export function calculateValuePercentages(players, leagueSettings) {
  if (!Array.isArray(players) || players.length === 0) {
    return players;
  }

  // Pre-calculate position totals for efficiency
  const positionTotals = new Map();
  
  // Initialize totals for all position groups
  for (const positionGroup of Object.keys(POSITION_GROUPS)) {
    positionTotals.set(positionGroup, 0);
  }

  // Calculate sum of positive VBD for undrafted players by position group
  for (const player of players) {
    // Skip drafted players and players with no/negative VBD
    if (player.drafted || !player.vbd || player.vbd <= 0) {
      continue;
    }

    const vbd = Math.max(0, player.vbd);
    
    // Add to direct position total
    if (POSITION_GROUPS[player.position]) {
      const currentTotal = positionTotals.get(player.position) || 0;
      positionTotals.set(player.position, currentTotal + vbd);
    }
    
    // Add to FLEX total if player is FLEX-eligible
    let isFlexEligible = false;
    if (leagueSettings?.flexConfig?.spots?.length > 0) {
      // Use configured FLEX positions
      isFlexEligible = leagueSettings.flexConfig.spots.some(spot => 
        spot.allowedPositions[player.position]
      );
    } else {
      // Fallback to traditional FLEX positions
      isFlexEligible = ['RB', 'WR', 'TE'].includes(player.position);
    }
    
    if (isFlexEligible) {
      const flexTotal = positionTotals.get('FLEX') || 0;
      positionTotals.set('FLEX', flexTotal + vbd);
    }
  }

  // Calculate VAL% for each player
  const result = players.map(player => {
    let valPercent = 0;

    // Only calculate VAL% for undrafted players with positive VBD
    if (!player.drafted && player.vbd && player.vbd > 0) {
      const playerVBD = Math.max(0, player.vbd);
      
      // Get total for player's position
      const positionTotal = positionTotals.get(player.position) || 0;
      
      // Calculate VAL% (handle division by zero)
      if (positionTotal > 0) {
        valPercent = (playerVBD / positionTotal) * 100;
        valPercent = Math.round(valPercent * 10) / 10; // Round to 1 decimal place
      }
    }

    return {
      ...player,
      valPercent
    };
  });

  // Debug: Log VAL% calculation summary
  const positionSummary = Object.fromEntries(positionTotals);
  console.log('VAL% Position Totals:', positionSummary);
  
  const topValPercent = result
    .filter(p => p.valPercent && p.valPercent > 0)
    .sort((a, b) => (b.valPercent || 0) - (a.valPercent || 0))
    .slice(0, 5);
  console.log('Top 5 VAL% players:', topValPercent.map(p => ({ 
    name: p.name, 
    pos: p.position, 
    vbd: p.vbd, 
    valPercent: p.valPercent 
  })));

  return result;
}

/**
 * Main entry point for VBD calculation with VAL% included.
 * Calculates VBD first, then adds VAL% calculations.
 * 
 * @param {Array} players - Array of players
 * @param {Object} leagueSettings - League configuration
 * @returns {Array} Players with both VBD and valPercent calculated
 */
export function calculatePlayerVBDWithValPercent(players, leagueSettings) {
  // First calculate VBD using existing function
  const playersWithVBD = calculatePlayerVBD(players, leagueSettings);
  
  // Then add VAL% calculations
  const playersWithValPercent = calculateValuePercentages(playersWithVBD, leagueSettings);
  
  return playersWithValPercent;
}


