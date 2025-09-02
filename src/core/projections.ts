/**
 * Core Projection Calculations
 * 
 * Handles fantasy point calculations, projection updates, and dynamic recalculations
 * based on scoring settings and draft events.
 */

import {
  Player,
  PositionStats,
  QBStats,
  RBStats,
  WRStats,
  TEStats,
  KStats,
  DSTStats,
  ScoringSystem,
  FantasyScoringRules,
  ProjectionData,
  ProjectionRange,
  Position,
  isQBStats,
  isRBStats,
  isWRStats,
  isTEStats,
  isKStats,
  isDSTStats
} from '../types/data-contracts';

/**
 * Calculate fantasy points for a player based on their stats and scoring system
 */
export function calculateFantasyPoints(stats: PositionStats, scoring: ScoringSystem): number {
  const rules = scoring.values;
  
  switch (stats.type) {
    case 'QB':
      return calculateQBPoints(stats, rules);
    case 'RB':
      return calculateRBPoints(stats, rules);
    case 'WR':
      return calculateWRPoints(stats, rules);
    case 'TE':
      return calculateTEPoints(stats, rules);
    case 'K':
      return calculateKPoints(stats, rules);
    case 'DST':
      return calculateDSTPoints(stats, rules);
    default:
      return 0;
  }
}

/**
 * Calculate QB fantasy points
 */
function calculateQBPoints(stats: QBStats, rules: ScoringSystem['values']): number {
  let points = 0;
  
  // Passing stats
  points += stats.passYds * (rules.passingYards / 25); // Usually 1 pt per 25 yards
  points += stats.passTDs * rules.passingTDs;
  points += stats.passInt * rules.interceptions; // Usually negative
  
  // Rushing stats
  points += stats.rushYds * (rules.rushingYards / 10); // Usually 1 pt per 10 yards
  points += stats.rushTDs * rules.rushingTDs;
  
  // Fumbles
  points += stats.fumbles * rules.fumbles; // Usually negative
  
  return Math.round(points * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate RB fantasy points
 */
function calculateRBPoints(stats: RBStats, rules: ScoringSystem['values']): number {
  let points = 0;
  
  // Rushing stats
  points += stats.rushYds * (rules.rushingYards / 10);
  points += stats.rushTDs * rules.rushingTDs;
  
  // Receiving stats
  points += stats.recYds * (rules.receivingYards / 10);
  points += stats.recTDs * rules.receivingTDs;
  points += stats.rec * rules.receptions; // PPR value
  
  // Fumbles
  points += stats.fumbles * rules.fumbles;
  
  return Math.round(points * 10) / 10;
}

/**
 * Calculate WR fantasy points
 */
function calculateWRPoints(stats: WRStats, rules: ScoringSystem['values']): number {
  let points = 0;
  
  // Receiving stats
  points += stats.recYds * (rules.receivingYards / 10);
  points += stats.recTDs * rules.receivingTDs;
  points += stats.rec * rules.receptions;
  
  // Rushing stats (for WRs with carries)
  points += stats.rushYds * (rules.rushingYards / 10);
  points += stats.rushTDs * rules.rushingTDs;
  
  // Fumbles
  points += stats.fumbles * rules.fumbles;
  
  return Math.round(points * 10) / 10;
}

/**
 * Calculate TE fantasy points
 */
function calculateTEPoints(stats: TEStats, rules: ScoringSystem['values']): number {
  let points = 0;
  
  // Receiving stats
  points += stats.recYds * (rules.receivingYards / 10);
  points += stats.recTDs * rules.receivingTDs;
  points += stats.rec * rules.receptions;
  
  // Fumbles
  points += stats.fumbles * rules.fumbles;
  
  return Math.round(points * 10) / 10;
}

/**
 * Calculate K fantasy points
 */
function calculateKPoints(stats: KStats, rules: ScoringSystem['values']): number {
  let points = 0;
  
  // Extra points
  points += stats.xp * rules.kickingXP;
  
  // Field goals by distance
  points += stats.fg_0019 * rules.fieldGoals.under40;
  points += stats.fg_2029 * rules.fieldGoals.under40;
  points += stats.fg_3039 * rules.fieldGoals.under40;
  points += stats.fg_4049 * rules.fieldGoals.from40to49;
  points += stats.fg_50 * rules.fieldGoals.over50;
  
  return Math.round(points * 10) / 10;
}

/**
 * Calculate DST fantasy points
 */
function calculateDSTPoints(stats: DSTStats, rules: ScoringSystem['values']): number {
  let points = 0;
  
  // Defensive stats
  points += stats.sacks * rules.defense.sacks;
  points += stats.int * rules.defense.interceptions;
  points += stats.fumbleRec * rules.defense.fumbleRecoveries;
  points += stats.safety * rules.defense.safeties;
  points += stats.td * rules.defense.touchdowns;
  
  // Points allowed (this would need more sophisticated logic)
  points += getPointsAllowedScore(stats.pointsAllowed, rules.defense);
  
  // Yards allowed (this would need more sophisticated logic)
  points += getYardsAllowedScore(stats.yardsAllowed, rules.defense);
  
  return Math.round(points * 10) / 10;
}

/**
 * Get points allowed score for DST
 */
function getPointsAllowedScore(pointsAllowed: number, defenseRules: ScoringSystem['values']['defense']): number {
  if (pointsAllowed === 0) return defenseRules.pointsAllowed0;
  if (pointsAllowed <= 6) return defenseRules.pointsAllowed1to6;
  if (pointsAllowed <= 13) return defenseRules.pointsAllowed7to13;
  if (pointsAllowed <= 20) return defenseRules.pointsAllowed14to20;
  if (pointsAllowed <= 27) return defenseRules.pointsAllowed21to27;
  if (pointsAllowed <= 34) return defenseRules.pointsAllowed28to34;
  return defenseRules.pointsAllowed35Plus;
}

/**
 * Get yards allowed score for DST
 */
function getYardsAllowedScore(yardsAllowed: number, defenseRules: ScoringSystem['values']['defense']): number {
  if (yardsAllowed < 100) return defenseRules.yardsAllowed0to99;
  if (yardsAllowed <= 199) return defenseRules.yardsAllowed100to199;
  if (yardsAllowed <= 299) return defenseRules.yardsAllowed200to299;
  if (yardsAllowed <= 399) return defenseRules.yardsAllowed300to399;
  if (yardsAllowed <= 449) return defenseRules.yardsAllowed400to449;
  if (yardsAllowed <= 499) return defenseRules.yardsAllowed450to499;
  return defenseRules.yardsAllowed500Plus;
}

/**
 * Calculate projection range based on high/low values and confidence
 */
export function calculateProjectionRange(projections: ProjectionData): ProjectionRange {
  const base = projections.points;
  const high = projections.pointsHigh || base;
  const low = projections.pointsLow || base;
  const confidence = projections.confidence || 0.5;
  
  // If we have explicit high/low, use those
  if (projections.pointsHigh && projections.pointsLow) {
    return {
      low: projections.pointsLow,
      high: projections.pointsHigh,
      confidence,
    };
  }
  
  // Otherwise, create range based on confidence
  const range = base * (1 - confidence) * 0.5; // 50% of uncertainty as range
  return {
    low: Math.max(0, base - range),
    high: base + range,
    confidence,
  };
}

/**
 * Recalculate fantasy points for all players with new scoring system
 */
export function recalculateAllProjections(players: Player[], scoring: ScoringSystem): Player[] {
  const startTime = performance.now();
  
  const updatedPlayers = players.map(player => {
    const newPoints = calculateFantasyPoints(player.stats, scoring);
    
    return {
      ...player,
      points: newPoints,
      projections: {
        ...player.projections,
        points: newPoints,
        lastUpdated: Date.now(),
      },
    };
  });
  
  const duration = performance.now() - startTime;
  console.log(`Recalculated ${players.length} player projections in ${duration.toFixed(2)}ms`);
  
  return updatedPlayers;
}

/**
 * Update a player's projections based on new stats
 */
export function updatePlayerProjection(
  player: Player, 
  newStats: Partial<PositionStats>, 
  scoring: ScoringSystem
): Player {
  // Merge new stats with existing stats
  const updatedStats = { ...player.stats, ...newStats } as PositionStats;
  
  // Recalculate fantasy points
  const newPoints = calculateFantasyPoints(updatedStats, scoring);
  
  return {
    ...player,
    stats: updatedStats,
    points: newPoints,
    projections: {
      ...player.projections,
      points: newPoints,
      lastUpdated: Date.now(),
    },
  };
}

/**
 * Adjust projections based on draft events (remaining games, injury updates, etc.)
 */
export function adjustProjectionsForDraftState(
  players: Player[], 
  draftedPlayers: Set<number>,
  scoring: ScoringSystem
): Player[] {
  return players.map(player => {
    if (draftedPlayers.has(player.id)) {
      // Player is already drafted, potentially adjust for different scenarios
      return player;
    }
    
    // For available players, we might adjust based on remaining draft state
    // This could include injury updates, snap count changes, etc.
    return player;
  });
}

/**
 * Calculate confidence interval for a projection
 */
export function calculateConfidenceInterval(
  stats: PositionStats,
  confidenceLevel: number = 0.68 // 1 standard deviation
): { low: number; high: number } {
  let variance = 0;
  let baseValue = 0;
  
  // Calculate variance based on standard deviations in stats
  switch (stats.type) {
    case 'QB':
      if (isQBStats(stats)) {
        const passVariance = Math.pow(stats.passYdsSd || 0, 2);
        const tdVariance = Math.pow(stats.passTDsSd || 0, 2);
        const intVariance = Math.pow(stats.passIntSd || 0, 2);
        variance = Math.sqrt(passVariance + tdVariance + intVariance);
        baseValue = stats.passYds + stats.passTDs * 25 + stats.passInt * -50; // Rough estimate
      }
      break;
    case 'RB':
      if (isRBStats(stats)) {
        const rushVariance = Math.pow(stats.rushYdsSd || 0, 2);
        const recVariance = Math.pow(stats.recYdsSd || 0, 2);
        variance = Math.sqrt(rushVariance + recVariance);
        baseValue = stats.rushYds + stats.recYds + stats.rushTDs * 40 + stats.recTDs * 40;
      }
      break;
    // Add other positions as needed
  }
  
  const margin = variance * confidenceLevel;
  
  return {
    low: Math.max(0, baseValue - margin),
    high: baseValue + margin,
  };
}

/**
 * Create simplified scoring rules for quick calculations
 */
export function createSimplifiedScoring(): ScoringSystem {
  return {
    preset: 'standard',
    values: {
      passingYards: 1/25,
      passingTDs: 4,
      interceptions: -2,
      rushingYards: 0.1,
      rushingTDs: 6,
      receivingYards: 0.1,
      receivingTDs: 6,
      receptions: 0.5, // Half PPR
      fumbles: -2,
      kickingXP: 1,
      fieldGoals: {
        under40: 3,
        from40to49: 4,
        over50: 5,
      },
      defense: {
        pointsAllowed0: 10,
        pointsAllowed1to6: 7,
        pointsAllowed7to13: 4,
        pointsAllowed14to20: 1,
        pointsAllowed21to27: 0,
        pointsAllowed28to34: -1,
        pointsAllowed35Plus: -4,
        yardsAllowed0to99: 5,
        yardsAllowed100to199: 3,
        yardsAllowed200to299: 2,
        yardsAllowed300to399: 0,
        yardsAllowed400to449: -1,
        yardsAllowed450to499: -3,
        yardsAllowed500Plus: -5,
        sacks: 1,
        interceptions: 2,
        fumbleRecoveries: 2,
        safeties: 2,
        touchdowns: 6,
      },
    },
  };
}

/**
 * Performance-optimized bulk projection calculation
 */
export function bulkCalculateProjections(players: Player[], scoring: ScoringSystem): Map<number, number> {
  const startTime = performance.now();
  const projectionMap = new Map<number, number>();
  
  // Process players in batches to avoid blocking the UI
  const batchSize = 50;
  for (let i = 0; i < players.length; i += batchSize) {
    const batch = players.slice(i, i + batchSize);
    
    for (const player of batch) {
      const points = calculateFantasyPoints(player.stats, scoring);
      projectionMap.set(player.id, points);
    }
    
    // Allow other tasks to run between batches
    if (i + batchSize < players.length) {
      setTimeout(() => {}, 0);
    }
  }
  
  const duration = performance.now() - startTime;
  if (duration > 50) {
    console.warn(`Bulk projection calculation took ${duration.toFixed(2)}ms for ${players.length} players`);
  }
  
  return projectionMap;
}

/**
 * Validate projection data for consistency
 */
export function validateProjectionData(player: Player): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check basic required fields
  if (!player.projections) {
    errors.push('Missing projections data');
  } else {
    if (typeof player.projections.points !== 'number' || player.projections.points < 0) {
      errors.push('Invalid points value');
    }
    
    if (!player.projections.source) {
      errors.push('Missing projection source');
    }
    
    if (!player.projections.lastUpdated) {
      errors.push('Missing last updated timestamp');
    }
  }
  
  // Check stats consistency
  if (!player.stats) {
    errors.push('Missing stats data');
  } else {
    if (player.stats.type !== player.position) {
      errors.push(`Stats type (${player.stats.type}) doesn't match position (${player.position})`);
    }
  }
  
  // Check calculated vs projected points alignment
  if (player.points !== player.projections?.points) {
    errors.push('Points and projection points are out of sync');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}