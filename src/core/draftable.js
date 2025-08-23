/**
 * Draftable Player Calculation
 * Determines how many players at each position are expected to be drafted
 * based on league settings, roster requirements, and typical draft patterns
 */

/**
 * Calculate expected draftable player counts per position
 * @param {Object} leagueSettings - League configuration
 * @param {Array} draftHistory - Optional draft picks for adaptive adjustment
 * @returns {Object} Draftable counts by position
 */
export function calculateDraftableThresholds(leagueSettings, draftHistory = null) {
  const { teams, roster } = leagueSettings;
  const teamCount = Number(teams) || 12;
  
  // Default roster if not provided
  const defaultRoster = { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 };
  const rosterConfig = roster || defaultRoster;
  
  // Base multipliers for how many players typically get drafted at each position
  const positionMultipliers = {
    QB: {
      starter: 1.0,      // Teams draft exactly their starter count
      bench: 0.6,        // 60% of teams draft a backup QB
      flexWeight: 0.0,   // QBs don't fill FLEX spots
      variance: 0.15     // Low variance in QB drafting patterns
    },
    RB: {
      starter: 1.0,      // All starting spots filled
      bench: 2.8,        // Teams heavily draft RB depth (injury risk)
      flexWeight: 0.4,   // 40% of FLEX spots filled by RBs
      variance: 0.25     // Higher variance due to different strategies
    },
    WR: {
      starter: 1.0,
      bench: 2.2,        // Teams draft WR depth but less than RB
      flexWeight: 0.5,   // 50% of FLEX spots filled by WRs
      variance: 0.20
    },
    TE: {
      starter: 1.0,
      bench: 0.4,        // Most teams draft minimal TE depth
      flexWeight: 0.1,   // 10% of FLEX spots filled by TEs
      variance: 0.35     // High variance (some punt, some draft multiple)
    },
    K: {
      starter: 1.0,
      bench: 0.1,        // Very few teams draft backup kickers
      flexWeight: 0.0,
      variance: 0.05     // Very consistent drafting
    },
    DST: {
      starter: 1.0,
      bench: 0.2,        // Some teams draft backup defenses
      flexWeight: 0.0,
      variance: 0.10
    }
  };
  
  const draftableByPosition = {};
  
  // Calculate for each position
  Object.keys(positionMultipliers).forEach(position => {
    const config = positionMultipliers[position];
    const starters = Number(rosterConfig[position]) || 0;
    const flexSpots = Number(rosterConfig.FLEX) || 0;
    const benchSpots = Number(rosterConfig.BENCH) || 0;
    
    if (starters === 0) {
      draftableByPosition[position] = { count: 0, factors: { starters: 0, bench: 0, flex: 0 } };
      return;
    }
    
    // Core calculation: starters for all teams
    let baseDraftable = teamCount * starters * config.starter;
    
    // Add bench allocation (proportional to bench spots and position priority)
    const benchFactor = Math.min(benchSpots / 6, 1.0); // Normalize to standard 6 bench spots
    const benchDraftable = teamCount * config.bench * benchFactor;
    baseDraftable += benchDraftable;
    
    // Add FLEX considerations for eligible positions
    let flexDraftable = 0;
    if (config.flexWeight > 0 && flexSpots > 0) {
      flexDraftable = teamCount * flexSpots * config.flexWeight;
      baseDraftable += flexDraftable;
    }
    
    // Apply historical adjustment if available
    let historicalAdjustment = 0;
    if (draftHistory && draftHistory.length > 10) {
      const historicalRatio = analyzeHistoricalPattern(draftHistory, position, baseDraftable);
      historicalAdjustment = baseDraftable * (historicalRatio - 1.0) * 0.3; // 30% weight to history
    }
    
    // Final count with variance bounds
    const finalCount = Math.max(
      teamCount, // At least one per team
      Math.round(baseDraftable + historicalAdjustment)
    );
    
    draftableByPosition[position] = {
      count: finalCount,
      confidence: {
        low: Math.round(baseDraftable * (1 - config.variance)),
        high: Math.round(baseDraftable * (1 + config.variance)),
        expected: finalCount
      },
      factors: {
        starters: Math.round(teamCount * starters),
        bench: Math.round(benchDraftable),
        flex: Math.round(flexDraftable),
        adjustment: Math.round(historicalAdjustment)
      }
    };
  });
  
  return draftableByPosition;
}

/**
 * Analyze historical draft patterns to adjust projections
 * @param {Array} draftHistory - Array of draft picks
 * @param {string} position - Position to analyze
 * @param {number} expectedCount - Expected drafts for this position
 * @returns {number} Ratio of actual to expected (1.0 = exactly as expected)
 */
function analyzeHistoricalPattern(draftHistory, position, expectedCount) {
  if (!draftHistory || draftHistory.length < 10) return 1.0;
  
  // Count how many of this position have been drafted
  const actualCount = draftHistory.filter(pick => 
    pick.player && pick.player.position === position
  ).length;
  
  // Calculate what percentage of draft is complete
  const totalPicks = draftHistory.length;
  const estimatedTotalRounds = Math.ceil(totalPicks / (draftHistory[0]?.leagueSize || 12));
  const draftProgress = Math.min(totalPicks / (estimatedTotalRounds * 12), 1.0);
  
  // Expected drafts so far
  const expectedSoFar = expectedCount * draftProgress;
  
  // Return ratio of actual vs expected
  return expectedSoFar > 0 ? actualCount / expectedSoFar : 1.0;
}

/**
 * Get the top N draftable players for a position
 * @param {Array} players - All players
 * @param {string} position - Position to filter
 * @param {number} count - Number of players to return
 * @returns {Array} Top N undrafted players for the position, sorted by VBD
 */
export function getTopDraftablePlayers(players, position, count) {
  if (!Array.isArray(players) || !position || count <= 0) {
    return [];
  }
  
  // Filter to undrafted players at this position (exclude IR players from rankings)
  const available = players.filter(player => 
    player.position === position && 
    !player.drafted &&
    player.injuryStatus !== 4 // Exclude IR players
  );
  
  // Sort by VBD (highest first)
  available.sort((a, b) => (b.vbd || 0) - (a.vbd || 0));
  
  // Return top N
  return available.slice(0, count).map((player, index) => ({
    ...player,
    positionRank: index + 1
  }));
}

/**
 * Calculate VBD baseline for a position based on draftable threshold
 * @param {Array} players - All players for the position
 * @param {number} draftableCount - Number of draftable players
 * @returns {number} VBD baseline value
 */
export function calculatePositionBaseline(players, draftableCount) {
  if (!Array.isArray(players) || players.length === 0 || draftableCount <= 0) {
    return 0;
  }
  
  // Get undrafted players sorted by points
  const available = players
    .filter(p => !p.drafted && p.injuryStatus !== 4)
    .sort((a, b) => (b.points || 0) - (a.points || 0));
  
  if (available.length === 0) return 0;
  
  // Baseline is the points of the player at the draftable threshold
  const baselineIndex = Math.min(draftableCount - 1, available.length - 1);
  const baselinePlayer = available[baselineIndex];
  
  return baselinePlayer ? (baselinePlayer.points || 0) : 0;
}