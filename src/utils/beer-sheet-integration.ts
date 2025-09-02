/**
 * Beer Sheet Integration Utilities
 * 
 * Integration layer between the Beer Sheet data processing utilities
 * and the unified store, providing seamless data flow and type safety.
 */

import { 
  processBeerSheetData, 
  applySearchHighlight, 
  updateBeerSheetForDraft,
  calculatePositionScarcity,
  BeerSheetData,
  BeerSheetPlayer,
  OverallRankingPlayer,
  PositionScarcity
} from '../core/beer-sheet';
import { Player, LeagueSettings, UnifiedStoreState } from '../types/data-contracts';
import { calculatePlayerVBDWithValPercent } from '../core/vbd.js';

/**
 * Create Beer Sheet data from unified store state
 */
export function createBeerSheetFromStore(
  store: Pick<UnifiedStoreState, 'players' | 'picks' | 'settings' | 'ui'>
): BeerSheetData {
  // Extract drafted player IDs from picks
  const draftedPlayerIds = new Set(
    store.picks.map(pick => String(pick.player.id))
  );
  
  // Ensure players have VBD and VAL% calculations
  const playersWithVBD = calculatePlayerVBDWithValPercent(
    store.players, 
    {
      teams: store.settings.teamCount,
      starters: store.settings.positions
    }
  );
  
  // Process Beer Sheet data
  const beerSheetData = processBeerSheetData(
    playersWithVBD,
    store.settings,
    draftedPlayerIds,
    store.ui.filters.drafted // Hide drafted if filter is set
  );
  
  // Apply search highlighting if search term exists
  if (store.ui.searchTerm && store.ui.searchTerm.length >= 2) {
    return applySearchHighlight(beerSheetData, store.ui.searchTerm);
  }
  
  return beerSheetData;
}

/**
 * Update Beer Sheet data when a player is drafted
 * Provides optimized incremental update
 */
export function updateBeerSheetOnDraft(
  currentBeerSheetData: BeerSheetData,
  draftedPlayerId: string | number,
  store: Pick<UnifiedStoreState, 'players' | 'settings'>
): BeerSheetData {
  // For small datasets, full reprocessing might be faster than incremental
  if (store.players.length < 100) {
    // Full reprocess
    const draftedIds = new Set([String(draftedPlayerId)]);
    // Add existing drafted players
    currentBeerSheetData.qb.concat(
      currentBeerSheetData.rb,
      currentBeerSheetData.wr, 
      currentBeerSheetData.te
    ).forEach(player => {
      if (player.drafted) {
        draftedIds.add(player.id);
      }
    });
    
    return processBeerSheetData(store.players, store.settings, draftedIds);
  }
  
  // Incremental update for larger datasets
  return updateBeerSheetForDraft(currentBeerSheetData, String(draftedPlayerId));
}

/**
 * Get position scarcity analysis for all positions
 */
export function getPositionScarcityAnalysis(beerSheetData: BeerSheetData): Record<string, PositionScarcity> {
  return {
    QB: calculatePositionScarcity(beerSheetData.qb),
    RB: calculatePositionScarcity(beerSheetData.rb), 
    WR: calculatePositionScarcity(beerSheetData.wr),
    TE: calculatePositionScarcity(beerSheetData.te)
  };
}

/**
 * Get top players at each position (for quick reference)
 */
export function getTopPlayersByPosition(
  beerSheetData: BeerSheetData, 
  count: number = 5
): Record<string, BeerSheetPlayer[]> {
  return {
    QB: beerSheetData.qb.filter(p => !p.drafted).slice(0, count),
    RB: beerSheetData.rb.filter(p => !p.drafted).slice(0, count),
    WR: beerSheetData.wr.filter(p => !p.drafted).slice(0, count),
    TE: beerSheetData.te.filter(p => !p.drafted).slice(0, count)
  };
}

/**
 * Get overall top available players
 */
export function getTopAvailablePlayers(
  beerSheetData: BeerSheetData,
  count: number = 10
): OverallRankingPlayer[] {
  return beerSheetData.overall
    .filter(player => !player.drafted)
    .slice(0, count);
}

/**
 * Find players that match search criteria
 */
export function findPlayersInBeerSheet(
  beerSheetData: BeerSheetData,
  searchCriteria: {
    name?: string;
    position?: string;
    minVBD?: number;
    maxPrice?: number;
    team?: string;
  }
): BeerSheetPlayer[] {
  const allPlayers = [
    ...beerSheetData.qb,
    ...beerSheetData.rb,
    ...beerSheetData.wr,
    ...beerSheetData.te
  ];
  
  return allPlayers.filter(player => {
    if (searchCriteria.name && !player.name.toLowerCase().includes(searchCriteria.name.toLowerCase())) {
      return false;
    }
    if (searchCriteria.position && player.position !== searchCriteria.position) {
      return false;
    }
    if (searchCriteria.minVBD && player.vbd < searchCriteria.minVBD) {
      return false;
    }
    if (searchCriteria.maxPrice && player.price > searchCriteria.maxPrice) {
      return false;
    }
    if (searchCriteria.team && player.team !== searchCriteria.team) {
      return false;
    }
    return true;
  });
}

/**
 * Export Beer Sheet data to CSV format (for external tools)
 */
export function exportBeerSheetToCSV(beerSheetData: BeerSheetData): string {
  const headers = ['Position', 'Rank', 'Name', 'Team', 'Bye', 'VBD', 'VAL%', 'Price', 'Min$', 'Max$', 'Drafted'];
  const rows = [headers.join(',')];
  
  // Add position data
  const positions = [
    { pos: 'QB', data: beerSheetData.qb },
    { pos: 'RB', data: beerSheetData.rb },
    { pos: 'WR', data: beerSheetData.wr },
    { pos: 'TE', data: beerSheetData.te }
  ];
  
  positions.forEach(({ pos, data }) => {
    data.forEach((player, index) => {
      const row = [
        pos,
        String(index + 1),
        `"${player.name}"`,
        player.team,
        String(player.bye),
        String(player.vbd),
        String(player.valPercent),
        String(player.price),
        String(player.minPrice),
        String(player.maxPrice),
        player.drafted ? 'Y' : 'N'
      ];
      rows.push(row.join(','));
    });
  });
  
  return rows.join('\n');
}

/**
 * Import Beer Sheet-compatible data from CSV
 * (For testing and external data integration)
 */
export function importBeerSheetFromCSV(csvData: string): Partial<BeerSheetData> {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',');
  
  const qb: BeerSheetPlayer[] = [];
  const rb: BeerSheetPlayer[] = [];
  const wr: BeerSheetPlayer[] = [];
  const te: BeerSheetPlayer[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const position = values[0];
    
    const player: BeerSheetPlayer = {
      id: `${position}-${i}`,
      name: values[2].replace(/"/g, ''),
      team: values[3],
      bye: parseInt(values[4]) || 0,
      position,
      vbd: parseFloat(values[5]) || 0,
      valPercent: parseFloat(values[6]) || 0,
      price: parseInt(values[7]) || 1,
      minPrice: parseInt(values[8]) || 1,
      maxPrice: parseInt(values[9]) || 1,
      drafted: values[10] === 'Y'
    };
    
    switch (position) {
      case 'QB': qb.push(player); break;
      case 'RB': rb.push(player); break;
      case 'WR': wr.push(player); break;
      case 'TE': te.push(player); break;
    }
  }
  
  return {
    qb,
    rb,
    wr,
    te,
    lastUpdated: new Date()
  };
}

/**
 * Performance monitoring for Beer Sheet operations
 */
export class BeerSheetPerformanceMonitor {
  private metrics: {
    operation: string;
    duration: number;
    playerCount: number;
    timestamp: number;
  }[] = [];
  
  measure<T>(operation: string, playerCount: number, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;
    
    this.metrics.push({
      operation,
      duration,
      playerCount,
      timestamp: Date.now()
    });
    
    // Keep only last 100 measurements
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
    
    // Warn about slow operations
    if (duration > 50) {
      console.warn(`Slow Beer Sheet operation: ${operation} took ${duration.toFixed(2)}ms for ${playerCount} players`);
    }
    
    return result;
  }
  
  getAveragePerformance(operation?: string): number {
    const filteredMetrics = operation 
      ? this.metrics.filter(m => m.operation === operation)
      : this.metrics;
    
    if (filteredMetrics.length === 0) return 0;
    
    const totalDuration = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    return totalDuration / filteredMetrics.length;
  }
  
  getPerformanceReport(): string {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    
    const report = operations.map(op => {
      const opMetrics = this.metrics.filter(m => m.operation === op);
      const avgDuration = this.getAveragePerformance(op);
      const maxDuration = Math.max(...opMetrics.map(m => m.duration));
      const minDuration = Math.min(...opMetrics.map(m => m.duration));
      
      return `${op}: avg=${avgDuration.toFixed(2)}ms, min=${minDuration.toFixed(2)}ms, max=${maxDuration.toFixed(2)}ms (${opMetrics.length} samples)`;
    });
    
    return report.join('\n');
  }
}

/**
 * Create a performance-monitored version of Beer Sheet processor
 */
export function createMonitoredBeerSheetProcessor() {
  const monitor = new BeerSheetPerformanceMonitor();
  
  return {
    processBeerSheetData: (players: Player[], settings: LeagueSettings, draftedPlayers: Set<string>, hideDrafted?: boolean) =>
      monitor.measure('processBeerSheetData', players.length, () => 
        processBeerSheetData(players, settings, draftedPlayers, hideDrafted)
      ),
    
    applySearchHighlight: (data: BeerSheetData, searchTerm: string) =>
      monitor.measure('applySearchHighlight', data.overall.length, () =>
        applySearchHighlight(data, searchTerm)
      ),
    
    updateBeerSheetForDraft: (data: BeerSheetData, playerId: string) =>
      monitor.measure('updateBeerSheetForDraft', data.overall.length, () =>
        updateBeerSheetForDraft(data, playerId)
      ),
    
    getPerformanceReport: () => monitor.getPerformanceReport(),
    getAveragePerformance: (operation?: string) => monitor.getAveragePerformance(operation)
  };
}

// Type guard utilities for runtime validation
export function isBeerSheetData(obj: any): obj is BeerSheetData {
  return obj &&
         Array.isArray(obj.qb) &&
         Array.isArray(obj.rb) &&
         Array.isArray(obj.wr) &&
         Array.isArray(obj.te) &&
         Array.isArray(obj.overall) &&
         obj.lastUpdated instanceof Date;
}

export function isBeerSheetPlayer(obj: any): obj is BeerSheetPlayer {
  return obj &&
         typeof obj.id === 'string' &&
         typeof obj.name === 'string' &&
         typeof obj.position === 'string' &&
         typeof obj.vbd === 'number' &&
         typeof obj.price === 'number';
}