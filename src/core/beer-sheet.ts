/**
 * Beer Sheet Data Processing Utilities
 * 
 * Transforms raw player data from the unified store into the compact,
 * high-density format required for the Beer Sheet widget display.
 * 
 * Features:
 * - Position-specific tables (QB, RB, WR, TE) with VBD-based sorting
 * - Overall rankings across all positions
 * - Real-time draft updates and search highlighting
 * - Performance optimized for 300+ players in <50ms
 * - VAL% percentage calculations and price formatting
 */

import { Player, LeagueSettings, Position } from '../types/data-contracts';

// Beer Sheet specific data interfaces
export interface BeerSheetPlayer {
  id: string;
  name: string;
  team: string;
  bye: number;
  position: string;
  vbd: number;
  valPercent: number;
  price: number;          // $
  minPrice: number;       // $(min)
  maxPrice: number;       // $(max)
  drafted: boolean;
  searchHighlight?: boolean;
  isFocused?: boolean;    // Player is currently focused/selected
}

export interface OverallRankingPlayer {
  id: string;             // Player ID for matching
  ovr: number;            // Overall rank
  name: string;
  position: string;
  vbd: number;
  drafted: boolean;
  searchHighlight?: boolean;
  isFocused?: boolean;    // Player is currently focused/selected
}

export interface BeerSheetData {
  qb: BeerSheetPlayer[];
  rb: BeerSheetPlayer[];
  wr: BeerSheetPlayer[];
  te: BeerSheetPlayer[];
  overall: OverallRankingPlayer[];
  lastUpdated: Date;
}

export interface PositionScarcity {
  position: string;
  totalPlayers: number;
  availablePlayers: number;
  avgVBD: number;
  topTierCount: number;
  scarcityScore: number;
}

// Price calculation constants
const DEFAULT_BUDGET = 200;
const DEFAULT_ROSTER_SIZE = 16;
const MIN_BID = 1;

/**
 * Calculate auction prices based on VBD and league settings
 */
function calculateAuctionPrice(vbd: number, totalVBD: number, availableBudget: number, availablePlayers: number): number {
  if (totalVBD <= 0 || availablePlayers <= 0 || vbd <= 0) {
    return MIN_BID;
  }
  
  // Base price calculation using VBD proportion
  const vbdProportion = vbd / totalVBD;
  const basePrice = Math.round(vbdProportion * availableBudget);
  
  return Math.max(MIN_BID, basePrice);
}

/**
 * Calculate price ranges (min/max) based on VBD uncertainty
 */
function calculatePriceRange(basePrice: number, vbd: number): { min: number; max: number } {
  // Price variance based on VBD magnitude (higher VBD = more stable pricing)
  const variance = vbd > 20 ? 0.15 : vbd > 10 ? 0.25 : 0.35;
  
  const minPrice = Math.max(MIN_BID, Math.round(basePrice * (1 - variance)));
  const maxPrice = Math.round(basePrice * (1 + variance));
  
  return { min: minPrice, max: maxPrice };
}

/**
 * Convert raw player data to BeerSheetPlayer format
 */
function transformToBeerSheetPlayer(player: Player, totalVBD: number, leagueSettings: LeagueSettings): BeerSheetPlayer {
  // Calculate auction pricing
  const availableBudget = leagueSettings.budget || DEFAULT_BUDGET;
  const rosterSize = leagueSettings.rosterSize || DEFAULT_ROSTER_SIZE;
  const estimatedPlayers = leagueSettings.teamCount * rosterSize;
  
  const basePrice = calculateAuctionPrice(player.vbd, totalVBD, availableBudget, estimatedPlayers);
  const priceRange = calculatePriceRange(basePrice, player.vbd);
  
  return {
    id: String(player.id),
    name: player.name,
    team: player.team,
    bye: player.byeWeek || 0,
    position: player.position,
    vbd: Math.round(player.vbd * 10) / 10, // 1 decimal place
    valPercent: Math.round((player.valPercent || 0) * 10) / 10, // 1 decimal place
    price: basePrice,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    drafted: player.drafted || false,
    searchHighlight: false
  };
}

/**
 * Create position-specific table with proper sorting
 * 
 * Sorting hierarchy:
 * 1. Primary: VBD (descending)
 * 2. Secondary: VAL% (descending)
 * 3. Tertiary: Player name (ascending) for stability
 */
export function createPositionTable(
  players: Player[],
  position: string,
  hideDrafted: boolean = false,
  limit?: number
): BeerSheetPlayer[] {
  const startTime = performance.now();
  
  // Filter players by position
  let positionPlayers = players.filter(p => p.position === position.toUpperCase());
  
  // Apply drafted filter if requested
  if (hideDrafted) {
    positionPlayers = positionPlayers.filter(p => !p.drafted);
  }
  
  // Calculate total VBD for price calculations (only positive VBD)
  const totalVBD = positionPlayers
    .filter(p => p.vbd > 0 && !p.drafted)
    .reduce((sum, p) => sum + p.vbd, 0);
  
  // Transform to BeerSheet format
  const beerSheetPlayers = positionPlayers.map(player => {
    // Use reasonable defaults for missing league settings
    const defaultSettings: LeagueSettings = {
      budget: DEFAULT_BUDGET,
      rosterSize: DEFAULT_ROSTER_SIZE,
      teamCount: 12,
      // Minimal required fields
      leagueName: '',
      minBid: MIN_BID,
      positions: { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1, FLEX: 1, BENCH: 8 },
      teams: [],
      userTeamId: null,
      scoring: { preset: 'standard' as const, values: {} as any },
      isDraftStarted: false
    };
    
    return transformToBeerSheetPlayer(player, totalVBD, defaultSettings);
  });
  
  // Sort by Beer Sheet criteria
  beerSheetPlayers.sort((a, b) => {
    // Primary: VBD descending
    if (Math.abs(b.vbd - a.vbd) > 0.05) {
      return b.vbd - a.vbd;
    }
    
    // Secondary: VAL% descending
    if (Math.abs(b.valPercent - a.valPercent) > 0.05) {
      return b.valPercent - a.valPercent;
    }
    
    // Tertiary: Name ascending (for stability)
    return a.name.localeCompare(b.name);
  });
  
  // Apply player limit if specified
  const finalPlayers = limit && limit > 0 ? beerSheetPlayers.slice(0, limit) : beerSheetPlayers;
  
  const duration = performance.now() - startTime;
  if (duration > 10) {
    console.warn(`Slow position table creation: ${position} took ${duration.toFixed(2)}ms`);
  }
  
  return finalPlayers;
}

/**
 * Create overall rankings table sorted by VBD across all positions
 */
export function createOverallTable(
  players: Player[],
  hideDrafted: boolean = false,
  limit?: number
): OverallRankingPlayer[] {
  const startTime = performance.now();
  
  // Filter players
  let eligiblePlayers = players.slice(); // Copy array
  
  if (hideDrafted) {
    eligiblePlayers = eligiblePlayers.filter(p => !p.drafted);
  }
  
  // Sort by VBD (descending)
  eligiblePlayers.sort((a, b) => (b.vbd || 0) - (a.vbd || 0));
  
  // Transform to overall ranking format with rank numbers
  const allPlayers = eligiblePlayers.map((player, index) => ({
    id: player.id, // Include player ID for matching
    ovr: index + 1, // Overall rank (1-based)
    name: player.name,
    position: player.position,
    vbd: Math.round((player.vbd || 0) * 10) / 10, // 1 decimal place
    drafted: player.drafted || false,
    searchHighlight: false
  }));
  
  // Apply limit if specified
  const overallPlayers = limit && limit > 0 ? allPlayers.slice(0, limit) : allPlayers;
  
  const duration = performance.now() - startTime;
  if (duration > 10) {
    console.warn(`Slow overall table creation took ${duration.toFixed(2)}ms`);
  }
  
  return overallPlayers;
}

/**
 * Enhanced processing with real-time draft state synchronization
 * Ensures all draft states are properly reflected in Beer Sheet data
 */
function synchronizeDraftState(
  players: Player[],
  draftedPlayers: Set<string>
): Player[] {
  return players.map(player => {
    const isDrafted = player.drafted || draftedPlayers.has(String(player.id));
    return isDrafted !== player.drafted ? { ...player, drafted: isDrafted } : player;
  });
}

/**
 * Main data processing function - transforms unified store data to Beer Sheet format
 */
export function processBeerSheetData(
  players: Player[],
  leagueSettings: LeagueSettings,
  draftedPlayers: Set<string>,
  hideDrafted: boolean = false,
  playerLimits?: { QB: number; TE: number; RB: number; WR: number; overall: number }
): BeerSheetData {
  const startTime = performance.now();
  
  if (!Array.isArray(players)) {
    console.warn('processBeerSheetData: players is not an array');
    return {
      qb: [],
      rb: [],
      wr: [],
      te: [],
      overall: [],
      lastUpdated: new Date()
    };
  }
  
  // Synchronize draft status efficiently
  const playersWithDraftStatus = synchronizeDraftState(players, draftedPlayers);
  
  // Create position tables
  const qb = createPositionTable(playersWithDraftStatus, 'QB', hideDrafted, playerLimits?.QB);
  const rb = createPositionTable(playersWithDraftStatus, 'RB', hideDrafted, playerLimits?.RB);
  const wr = createPositionTable(playersWithDraftStatus, 'WR', hideDrafted, playerLimits?.WR);
  const te = createPositionTable(playersWithDraftStatus, 'TE', hideDrafted, playerLimits?.TE);
  
  // Create overall rankings
  const overall = createOverallTable(playersWithDraftStatus, hideDrafted, playerLimits?.overall);
  
  const duration = performance.now() - startTime;
  
  // Log performance warning if processing is slow
  if (duration > 50) {
    console.warn(`Slow Beer Sheet processing: ${duration.toFixed(2)}ms for ${players.length} players`);
  }
  
  // Performance and stats logging
  const draftedCount = playersWithDraftStatus.filter(p => p.drafted).length;
  const availableCount = playersWithDraftStatus.length - draftedCount;
  
  console.log(`🍺 Beer Sheet processed ${players.length} players (${availableCount} available, ${draftedCount} drafted) in ${duration.toFixed(1)}ms`);
  
  return {
    qb,
    rb,
    wr,
    te,
    overall,
    lastUpdated: new Date()
  };
}

/**
 * Apply search highlighting to Beer Sheet data
 */
export function applySearchHighlight(
  beerSheetData: BeerSheetData,
  searchTerm: string
): BeerSheetData {
  if (!searchTerm || searchTerm.length < 2) {
    // Clear all highlights if no search term
    return {
      ...beerSheetData,
      qb: beerSheetData.qb.map(p => ({ ...p, searchHighlight: false })),
      rb: beerSheetData.rb.map(p => ({ ...p, searchHighlight: false })),
      wr: beerSheetData.wr.map(p => ({ ...p, searchHighlight: false })),
      te: beerSheetData.te.map(p => ({ ...p, searchHighlight: false })),
      overall: beerSheetData.overall.map(p => ({ ...p, searchHighlight: false }))
    };
  }
  
  const searchLower = searchTerm.toLowerCase();
  
  const highlightPlayer = (player: BeerSheetPlayer) => ({
    ...player,
    searchHighlight: player.name.toLowerCase().includes(searchLower) ||
                    player.team.toLowerCase().includes(searchLower)
  });
  
  const highlightOverallPlayer = (player: OverallRankingPlayer) => ({
    ...player,
    searchHighlight: player.name.toLowerCase().includes(searchLower)
  });
  
  return {
    ...beerSheetData,
    qb: beerSheetData.qb.map(highlightPlayer),
    rb: beerSheetData.rb.map(highlightPlayer),
    wr: beerSheetData.wr.map(highlightPlayer),
    te: beerSheetData.te.map(highlightPlayer),
    overall: beerSheetData.overall.map(highlightOverallPlayer),
    lastUpdated: new Date()
  };
}

/**
 * Recalculate VAL% for a specific position after a draft event
 * This maintains accurate relative values as the player pool changes
 */
function recalculatePositionVAL(
  players: BeerSheetPlayer[],
  position: string
): BeerSheetPlayer[] {
  if (players.length === 0) return players;
  
  // Filter available players for this position
  const availablePlayers = players.filter(p => !p.drafted);
  
  if (availablePlayers.length === 0) {
    // All players drafted, return original with VAL% = 0
    return players.map(p => ({ ...p, valPercent: 0 }));
  }
  
  // Find max VBD among available players for baseline
  const maxVBD = Math.max(...availablePlayers.map(p => p.vbd));
  
  if (maxVBD <= 0) {
    // No positive VBD players available
    return players.map(p => ({ ...p, valPercent: 0 }));
  }
  
  // Recalculate VAL% = (VBD / maxVBD) * 100 for all players
  return players.map(player => ({
    ...player,
    valPercent: player.vbd > 0 ? (player.vbd / maxVBD) * 100 : 0
  }));
}

/**
 * Update Beer Sheet data when a player is drafted
 * Includes real-time VAL% recalculation for affected position
 */
export function updateBeerSheetForDraft(
  beerSheetData: BeerSheetData,
  draftedPlayer: Player | { id: string; position: string; name: string }
): BeerSheetData {
  const startTime = performance.now();
  
  const playerId = String(draftedPlayer.id);
  const position = draftedPlayer.position?.toUpperCase();
  
  const updatePlayer = (player: BeerSheetPlayer) => 
    player.id === playerId ? { ...player, drafted: true } : player;
  
  const updateOverallPlayer = (player: OverallRankingPlayer) => {
    // Match by name for overall table since it may not have same ID structure
    const matchesName = player.name === draftedPlayer.name;
    const matchesId = player.name === playerId || String(player) === playerId;
    return (matchesName || matchesId) ? { ...player, drafted: true } : player;
  };
  
  // Update the affected position table with VAL% recalculation
  let updatedData = { ...beerSheetData };
  
  switch (position) {
    case 'QB':
      const updatedQB = beerSheetData.qb.map(updatePlayer);
      updatedData.qb = recalculatePositionVAL(updatedQB, 'QB');
      break;
    case 'RB':
      const updatedRB = beerSheetData.rb.map(updatePlayer);
      updatedData.rb = recalculatePositionVAL(updatedRB, 'RB');
      break;
    case 'WR':
      const updatedWR = beerSheetData.wr.map(updatePlayer);
      updatedData.wr = recalculatePositionVAL(updatedWR, 'WR');
      break;
    case 'TE':
      const updatedTE = beerSheetData.te.map(updatePlayer);
      updatedData.te = recalculatePositionVAL(updatedTE, 'TE');
      break;
    default:
      // Update all positions if position is unknown
      updatedData.qb = recalculatePositionVAL(beerSheetData.qb.map(updatePlayer), 'QB');
      updatedData.rb = recalculatePositionVAL(beerSheetData.rb.map(updatePlayer), 'RB');
      updatedData.wr = recalculatePositionVAL(beerSheetData.wr.map(updatePlayer), 'WR');
      updatedData.te = recalculatePositionVAL(beerSheetData.te.map(updatePlayer), 'TE');
      break;
  }
  
  // Update overall rankings - remove drafted player and recompute ranks
  const availableOverallPlayers = beerSheetData.overall
    .map(updateOverallPlayer)
    .filter(p => !p.drafted)
    .sort((a, b) => (b.vbd || 0) - (a.vbd || 0))
    .map((player, index) => ({ ...player, ovr: index + 1 }));
    
  // Add drafted players back at the end
  const draftedOverallPlayers = beerSheetData.overall
    .map(updateOverallPlayer)
    .filter(p => p.drafted);
    
  updatedData.overall = [...availableOverallPlayers, ...draftedOverallPlayers];
  updatedData.lastUpdated = new Date();
  
  const duration = performance.now() - startTime;
  if (duration > 10) {
    console.warn(`Slow draft update: ${duration.toFixed(2)}ms`);
  }
  
  console.log(`📊 Updated Beer Sheet for ${draftedPlayer.name} draft in ${duration.toFixed(1)}ms`);
  
  return updatedData;
}

/**
 * Calculate position scarcity metrics for advanced analysis
 */
export function calculatePositionScarcity(
  positionPlayers: BeerSheetPlayer[]
): PositionScarcity {
  const availablePlayers = positionPlayers.filter(p => !p.drafted);
  const totalPlayers = positionPlayers.length;
  
  // Calculate average VBD for available players
  const avgVBD = availablePlayers.length > 0 
    ? availablePlayers.reduce((sum, p) => sum + p.vbd, 0) / availablePlayers.length
    : 0;
  
  // Count top tier players (VBD > 10)
  const topTierCount = availablePlayers.filter(p => p.vbd > 10).length;
  
  // Calculate scarcity score (0-100, higher = more scarce)
  const draftedRatio = totalPlayers > 0 ? (totalPlayers - availablePlayers.length) / totalPlayers : 0;
  const topTierRatio = availablePlayers.length > 0 ? topTierCount / availablePlayers.length : 0;
  const scarcityScore = Math.round((draftedRatio * 60 + (1 - topTierRatio) * 40) * 100) / 100;
  
  return {
    position: positionPlayers[0]?.position || 'UNKNOWN',
    totalPlayers,
    availablePlayers: availablePlayers.length,
    avgVBD: Math.round(avgVBD * 10) / 10,
    topTierCount,
    scarcityScore
  };
}

/**
 * Format numeric values for display in Beer Sheet
 */
export const formatters = {
  vbd: (value: number): string => value.toFixed(1),
  valPercent: (value: number): string => `${value.toFixed(1)}%`,
  price: (value: number): string => `$${value}`,
  bye: (value: number): string => value > 0 ? String(value) : '-'
};

/**
 * Validation function to ensure data integrity
 */
export function validateBeerSheetData(data: BeerSheetData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!data.qb || !Array.isArray(data.qb)) errors.push('QB data is missing or invalid');
  if (!data.rb || !Array.isArray(data.rb)) errors.push('RB data is missing or invalid');
  if (!data.wr || !Array.isArray(data.wr)) errors.push('WR data is missing or invalid');
  if (!data.te || !Array.isArray(data.te)) errors.push('TE data is missing or invalid');
  if (!data.overall || !Array.isArray(data.overall)) errors.push('Overall data is missing or invalid');
  
  // Check lastUpdated
  if (!data.lastUpdated || !(data.lastUpdated instanceof Date)) {
    errors.push('lastUpdated is missing or invalid');
  }
  
  // Sample a few players to check structure
  const samplePlayer = data.qb[0] || data.rb[0] || data.wr[0] || data.te[0];
  if (samplePlayer) {
    const requiredFields = ['id', 'name', 'team', 'position', 'vbd', 'price'];
    for (const field of requiredFields) {
      if (!(field in samplePlayer)) {
        errors.push(`Sample player missing required field: ${field}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Batch update multiple draft actions efficiently
 * Reduces redundant recalculations when processing multiple drafts
 */
export function batchUpdateDrafts(
  beerSheetData: BeerSheetData,
  draftedPlayers: Array<{ id: string; position: string; name: string }>
): BeerSheetData {
  if (draftedPlayers.length === 0) return beerSheetData;
  
  const startTime = performance.now();
  
  let updatedData = { ...beerSheetData };
  const positionsToRecalculate = new Set<string>();
  
  // Mark all affected players as drafted and track positions
  draftedPlayers.forEach(draftedPlayer => {
    const playerId = String(draftedPlayer.id);
    const position = draftedPlayer.position?.toUpperCase();
    positionsToRecalculate.add(position);
    
    const updatePlayer = (player: BeerSheetPlayer) => 
      player.id === playerId ? { ...player, drafted: true } : player;
    
    switch (position) {
      case 'QB': updatedData.qb = updatedData.qb.map(updatePlayer); break;
      case 'RB': updatedData.rb = updatedData.rb.map(updatePlayer); break;
      case 'WR': updatedData.wr = updatedData.wr.map(updatePlayer); break;
      case 'TE': updatedData.te = updatedData.te.map(updatePlayer); break;
    }
  });
  
  // Recalculate VAL% for all affected positions
  positionsToRecalculate.forEach(position => {
    switch (position) {
      case 'QB': updatedData.qb = recalculatePositionVAL(updatedData.qb, 'QB'); break;
      case 'RB': updatedData.rb = recalculatePositionVAL(updatedData.rb, 'RB'); break;
      case 'WR': updatedData.wr = recalculatePositionVAL(updatedData.wr, 'WR'); break;
      case 'TE': updatedData.te = recalculatePositionVAL(updatedData.te, 'TE'); break;
    }
  });
  
  // Update overall rankings
  const updateOverallPlayer = (player: OverallRankingPlayer) => {
    const matchesDraftedPlayer = draftedPlayers.some(dp => 
      player.name === dp.name || player.name === String(dp.id)
    );
    return matchesDraftedPlayer ? { ...player, drafted: true } : player;
  };
  
  const availableOverallPlayers = updatedData.overall
    .map(updateOverallPlayer)
    .filter(p => !p.drafted)
    .sort((a, b) => (b.vbd || 0) - (a.vbd || 0))
    .map((player, index) => ({ ...player, ovr: index + 1 }));
    
  const draftedOverallPlayers = updatedData.overall
    .map(updateOverallPlayer)
    .filter(p => p.drafted);
    
  updatedData.overall = [...availableOverallPlayers, ...draftedOverallPlayers];
  updatedData.lastUpdated = new Date();
  
  const duration = performance.now() - startTime;
  console.log(`📦 Batch updated ${draftedPlayers.length} drafts in ${duration.toFixed(1)}ms`);
  
  return updatedData;
}

/**
 * Get draft impact statistics for analytics
 */
export function calculateDraftImpact(
  beforeData: BeerSheetData,
  afterData: BeerSheetData,
  draftedPlayer: { position: string; name: string }
): {
  position: string;
  playersAffected: number;
  avgVALChange: number;
  scarcityIncrease: number;
  topTierRemaining: number;
} {
  const position = draftedPlayer.position.toUpperCase();
  let beforePlayers: BeerSheetPlayer[] = [];
  let afterPlayers: BeerSheetPlayer[] = [];
  
  switch (position) {
    case 'QB': beforePlayers = beforeData.qb; afterPlayers = afterData.qb; break;
    case 'RB': beforePlayers = beforeData.rb; afterPlayers = afterData.rb; break;
    case 'WR': beforePlayers = beforeData.wr; afterPlayers = afterData.wr; break;
    case 'TE': beforePlayers = beforeData.te; afterPlayers = afterData.te; break;
  }
  
  const availableAfter = afterPlayers.filter(p => !p.drafted);
  const topTierRemaining = availableAfter.filter(p => p.vbd > 10).length;
  
  // Calculate average VAL% change
  const valChanges = beforePlayers
    .filter(p => !p.drafted)
    .map(beforePlayer => {
      const afterPlayer = afterPlayers.find(p => p.id === beforePlayer.id);
      return afterPlayer ? afterPlayer.valPercent - beforePlayer.valPercent : 0;
    });
  
  const avgVALChange = valChanges.length > 0 
    ? valChanges.reduce((sum, change) => sum + change, 0) / valChanges.length 
    : 0;
  
  return {
    position,
    playersAffected: valChanges.length,
    avgVALChange: Math.round(avgVALChange * 10) / 10,
    scarcityIncrease: calculatePositionScarcity(afterPlayers).scarcityScore - 
                     calculatePositionScarcity(beforePlayers).scarcityScore,
    topTierRemaining
  };
}

/**
 * Performance optimization: pre-calculate commonly needed derived data
 */
export function optimizeBeerSheetData(data: BeerSheetData): BeerSheetData {
  // Pre-calculate position rankings within each table
  const addPositionRanks = (players: BeerSheetPlayer[]) =>
    players.map((player, index) => ({
      ...player,
      positionRank: index + 1
    }));
  
  return {
    ...data,
    qb: addPositionRanks(data.qb),
    rb: addPositionRanks(data.rb),
    wr: addPositionRanks(data.wr),
    te: addPositionRanks(data.te),
    lastUpdated: new Date()
  };
}

// Export type guards for runtime type checking
export function isBeerSheetPlayer(obj: any): obj is BeerSheetPlayer {
  return obj && 
         typeof obj.id === 'string' &&
         typeof obj.name === 'string' &&
         typeof obj.position === 'string' &&
         typeof obj.vbd === 'number' &&
         typeof obj.price === 'number';
}

export function isBeerSheetData(obj: any): obj is BeerSheetData {
  return obj &&
         Array.isArray(obj.qb) &&
         Array.isArray(obj.rb) &&
         Array.isArray(obj.wr) &&
         Array.isArray(obj.te) &&
         Array.isArray(obj.overall) &&
         obj.lastUpdated instanceof Date;
}