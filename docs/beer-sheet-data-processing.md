# Beer Sheet Data Processing System

## Overview

The Beer Sheet data processing utilities transform raw player data from the unified store into a compact, high-density format optimized for fantasy football auction draft analysis. This system provides the data transformation layer that powers the Beer Sheet widget with real-time VBD-based rankings, price calculations, and draft tracking.

## Architecture

### Core Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Unified Store  │───▶│ Beer Sheet Core  │───▶│ Beer Sheet UI   │
│   (Raw Data)    │    │  (Transformers)  │    │   (Widget)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                       │
        ├─ Players               ├─ Position Tables      ├─ QB Rankings
        ├─ Picks                 ├─ Overall Rankings     ├─ RB Rankings  
        ├─ Settings              ├─ Search Highlighting  ├─ WR Rankings
        └─ UI State              └─ Draft Updates        └─ TE Rankings
```

### File Structure

```
src/core/
├── beer-sheet.ts              # Core data processing utilities
│
src/utils/
├── beer-sheet-integration.ts  # Integration with unified store
│
tests/
├── unit/beer-sheet.test.js           # Unit tests
└── integration/beer-sheet-vbd-integration.test.js  # Integration tests

demos/ui/
└── beer-sheet-data-processing-validation.html  # HITL validation
```

## Core Functions

### `processBeerSheetData()`

**Purpose**: Main data processing function that transforms raw player data into Beer Sheet format.

```typescript
function processBeerSheetData(
  players: Player[], 
  leagueSettings: LeagueSettings,
  draftedPlayers: Set<string>,
  hideDrafted: boolean = false
): BeerSheetData
```

**Processing Steps**:
1. Sync drafted status between store and draftedPlayers set
2. Calculate auction pricing based on VBD distribution
3. Create position-specific tables (QB, RB, WR, TE)
4. Generate overall cross-position rankings
5. Apply drafted/available filters
6. Return structured Beer Sheet data

**Performance Target**: < 50ms for 300+ players

### `createPositionTable()`

**Purpose**: Generate position-specific rankings with proper sorting hierarchy.

**Sorting Algorithm**:
1. **Primary**: VBD (descending) - Value-based drafting score
2. **Secondary**: VAL% (descending) - Percentage of position's positive VBD
3. **Tertiary**: Name (ascending) - Alphabetical for stability

```typescript
// Example sorting logic
players.sort((a, b) => {
  if (Math.abs(b.vbd - a.vbd) > 0.05) return b.vbd - a.vbd;      // Primary
  if (Math.abs(b.valPercent - a.valPercent) > 0.05) return b.valPercent - a.valPercent; // Secondary
  return a.name.localeCompare(b.name);                           // Tertiary
});
```

### `createOverallTable()`

**Purpose**: Generate overall rankings across all positions sorted purely by VBD.

```typescript
// Single-criterion sorting for overall rankings
players.sort((a, b) => (b.vbd || 0) - (a.vbd || 0));
```

## Data Structures

### BeerSheetPlayer Interface

```typescript
interface BeerSheetPlayer {
  id: string;
  name: string;
  team: string;
  bye: number;
  position: string;
  vbd: number;          // Value-based drafting score (1 decimal)
  valPercent: number;   // VAL% - percentage of position's VBD (1 decimal)
  price: number;        // Calculated auction price ($)
  minPrice: number;     // Minimum price range ($(min))
  maxPrice: number;     // Maximum price range ($(max))
  drafted: boolean;
  searchHighlight?: boolean;
}
```

### BeerSheetData Interface

```typescript
interface BeerSheetData {
  qb: BeerSheetPlayer[];         // QB rankings
  rb: BeerSheetPlayer[];         // RB rankings
  wr: BeerSheetPlayer[];         // WR rankings  
  te: BeerSheetPlayer[];         // TE rankings
  overall: OverallRankingPlayer[]; // Cross-position rankings
  lastUpdated: Date;
}
```

### OverallRankingPlayer Interface

```typescript
interface OverallRankingPlayer {
  ovr: number;          // Overall rank (1, 2, 3, ...)
  name: string;
  position: string;
  vbd: number;
  drafted: boolean;
  searchHighlight?: boolean;
}
```

## Pricing Algorithm

### Auction Price Calculation

Beer Sheet calculates realistic auction prices based on VBD distribution:

```typescript
function calculateAuctionPrice(
  vbd: number, 
  totalVBD: number, 
  availableBudget: number, 
  availablePlayers: number
): number {
  if (totalVBD <= 0 || availablePlayers <= 0 || vbd <= 0) {
    return MIN_BID; // $1 minimum
  }
  
  // Proportional pricing based on VBD share
  const vbdProportion = vbd / totalVBD;
  const basePrice = Math.round(vbdProportion * availableBudget);
  
  return Math.max(MIN_BID, basePrice);
}
```

### Price Ranges (Min/Max)

```typescript
function calculatePriceRange(basePrice: number, vbd: number): { min: number; max: number } {
  // Higher VBD = more stable pricing (lower variance)
  const variance = vbd > 20 ? 0.15 : vbd > 10 ? 0.25 : 0.35;
  
  return {
    min: Math.max(MIN_BID, Math.round(basePrice * (1 - variance))),
    max: Math.round(basePrice * (1 + variance))
  };
}
```

## Advanced Features

### Search Highlighting

```typescript
function applySearchHighlight(data: BeerSheetData, searchTerm: string): BeerSheetData {
  if (!searchTerm || searchTerm.length < 2) {
    // Clear all highlights
    return clearHighlights(data);
  }
  
  const searchLower = searchTerm.toLowerCase();
  
  // Highlight matching players across all tables
  return {
    ...data,
    qb: data.qb.map(highlightPlayer(searchLower)),
    rb: data.rb.map(highlightPlayer(searchLower)),
    // ... etc
  };
}
```

### Real-time Draft Updates

```typescript
function updateBeerSheetForDraft(
  beerSheetData: BeerSheetData,
  draftedPlayerId: string
): BeerSheetData {
  // Efficient incremental update
  const updatePlayer = (player: BeerSheetPlayer) => 
    player.id === draftedPlayerId ? { ...player, drafted: true } : player;
  
  return {
    ...beerSheetData,
    qb: beerSheetData.qb.map(updatePlayer),
    rb: beerSheetData.rb.map(updatePlayer),
    // ... etc
  };
}
```

### Position Scarcity Analysis

```typescript
interface PositionScarcity {
  position: string;
  totalPlayers: number;
  availablePlayers: number;
  avgVBD: number;
  topTierCount: number;      // Players with VBD > 10
  scarcityScore: number;     // 0-100 scale (higher = more scarce)
}
```

## Integration with Unified Store

### Store Integration Layer

```typescript
// src/utils/beer-sheet-integration.ts
export function createBeerSheetFromStore(
  store: Pick<UnifiedStoreState, 'players' | 'picks' | 'settings' | 'ui'>
): BeerSheetData {
  // Extract drafted players from picks
  const draftedPlayerIds = new Set(store.picks.map(pick => String(pick.player.id)));
  
  // Ensure VBD calculations are up-to-date
  const playersWithVBD = calculatePlayerVBDWithValPercent(store.players, {
    teams: store.settings.teamCount,
    starters: store.settings.positions
  });
  
  // Process Beer Sheet data
  let beerSheetData = processBeerSheetData(
    playersWithVBD,
    store.settings,
    draftedPlayerIds,
    store.ui.filters.drafted
  );
  
  // Apply search if active
  if (store.ui.searchTerm?.length >= 2) {
    beerSheetData = applySearchHighlight(beerSheetData, store.ui.searchTerm);
  }
  
  return beerSheetData;
}
```

## Performance Optimization

### Performance Targets

- **Data Processing**: < 50ms for 300+ players
- **Search Highlighting**: < 10ms for any dataset
- **Draft Updates**: < 5ms for incremental changes
- **Memory Usage**: < 5MB for typical datasets

### Optimization Techniques

1. **Efficient Sorting**: Single-pass sort with stable comparison functions
2. **Incremental Updates**: Draft changes update existing data rather than reprocessing
3. **Memory Management**: Minimal object creation during updates
4. **Lazy Evaluation**: Calculate expensive metrics only when needed

### Performance Monitoring

```typescript
const monitor = new BeerSheetPerformanceMonitor();

const data = monitor.measure('processBeerSheetData', players.length, () => 
  processBeerSheetData(players, settings, draftedPlayers)
);

console.log(monitor.getPerformanceReport());
// Output: processBeerSheetData: avg=23.45ms, min=18.32ms, max=48.71ms (15 samples)
```

## Error Handling

### Graceful Degradation

```typescript
// Handle missing or invalid data
function processBeerSheetData(players, settings, draftedPlayers, hideDrafted) {
  if (!Array.isArray(players)) {
    console.warn('processBeerSheetData: players is not an array');
    return createEmptyBeerSheetData();
  }
  
  // Continue processing with defaults for missing fields
  const playersWithDefaults = players.map(player => ({
    vbd: 0,
    valPercent: 0,
    byeWeek: 0,
    ...player  // Override with actual values
  }));
  
  // ... rest of processing
}
```

### Input Validation

```typescript
export function validateBeerSheetData(data: BeerSheetData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required structure
  if (!Array.isArray(data.qb)) errors.push('QB data missing');
  if (!Array.isArray(data.rb)) errors.push('RB data missing');
  // ... etc
  
  return { valid: errors.length === 0, errors };
}
```

## Testing Strategy

### Unit Tests (10 tests)
1. Basic data transformation
2. Position table sorting algorithm
3. Overall rankings cross-position sorting
4. Hide drafted functionality
5. Draft status synchronization
6. Search highlighting
7. Edge cases (empty data, negative VBD)
8. Position scarcity calculations
9. Performance benchmarks (< 50ms)
10. Data structure validation

### Integration Tests (5 tests)
1. VBD calculation pipeline
2. Draft state consistency
3. Position ranking consistency
4. Performance with realistic datasets
5. Error handling and data validation

### HITL Validation
- Interactive HTML page with full feature demonstration
- Real-time draft simulation
- Search and filter testing
- Performance metrics display
- Comprehensive validation checklist

## Usage Examples

### Basic Usage

```typescript
import { processBeerSheetData } from '../core/beer-sheet';

const players = [/* player data */];
const leagueSettings = {/* league config */};
const draftedPlayers = new Set(['1', '3', '7']); // Drafted player IDs

const beerSheetData = processBeerSheetData(
  players, 
  leagueSettings, 
  draftedPlayers,
  false // Don't hide drafted
);

console.log(`QB Rankings: ${beerSheetData.qb.length} players`);
console.log(`Top Overall: ${beerSheetData.overall[0].name} (VBD: ${beerSheetData.overall[0].vbd})`);
```

### With Search and Filtering

```typescript
import { applySearchHighlight } from '../core/beer-sheet';

// Process base data
let data = processBeerSheetData(players, settings, draftedPlayers, true); // Hide drafted

// Apply search
data = applySearchHighlight(data, 'mahomes');

// Find highlighted QB
const highlightedQB = data.qb.find(p => p.searchHighlight);
```

### Performance Monitoring

```typescript
import { createMonitoredBeerSheetProcessor } from '../utils/beer-sheet-integration';

const processor = createMonitoredBeerSheetProcessor();

const data = processor.processBeerSheetData(players, settings, draftedPlayers);

console.log('Performance Report:');
console.log(processor.getPerformanceReport());
```

## Future Enhancements

1. **Tier-based Analysis**: Group players into value tiers within positions
2. **Positional Flexibility**: Handle FLEX eligibility and Superflex scoring  
3. **Historical Trends**: Track VBD changes over time during draft
4. **Export Formats**: JSON, Excel, PDF export options
5. **Advanced Metrics**: Add composite scores, risk factors, upside calculations
6. **Mobile Optimization**: Touch-friendly interactions for mobile draft rooms

## Conclusion

The Beer Sheet data processing system provides a robust, high-performance foundation for fantasy football auction draft analysis. With comprehensive sorting algorithms, real-time updates, and extensive error handling, it delivers the data transformation capabilities needed for professional-grade draft preparation tools.

Key strengths:
- **Performance**: Sub-50ms processing for large datasets
- **Reliability**: Comprehensive error handling and graceful degradation  
- **Flexibility**: Supports search, filtering, and real-time draft updates
- **Integration**: Seamless integration with unified store architecture
- **Testing**: 100% test coverage with unit, integration, and HITL validation