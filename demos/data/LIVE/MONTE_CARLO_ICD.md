# Monte Carlo Fantasy Football Simulation Output Interface Control Document (ICD)

**Version:** 1.0  
**Date:** September 2025  
**Author:** Senior Software Development Engineer  
**Document Type:** Interface Control Document  
**Classification:** Internal Development  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Migration Strategy](#2-migration-strategy)
3. [Complete Data Dictionary](#3-complete-data-dictionary)
4. [Field Tiers & Integration Priorities](#4-field-tiers--integration-priorities)
5. [React Widget Integration Recommendations](#5-react-widget-integration-recommendations)
6. [Data Quality Assurance](#6-data-quality-assurance)
7. [Technical Implementation Notes](#7-technical-implementation-notes)
8. [Appendices](#8-appendices)

---

## 1. Executive Summary

### 1.1 Document Purpose

This Interface Control Document defines the data schema and integration requirements for Monte Carlo fantasy football simulation outputs consumed by auction draft applications. The simulation system generates comprehensive player projections with statistical variance modeling for betting-grade accuracy.

### 1.2 System Overview

The Monte Carlo engine produces two simulation modes:
- **Baseline Conservative Mode**: Dirichlet-constrained projections (low variance)
- **Component-Free Mode**: Statistical distribution-based projections (realistic variance)

Each player record contains 89 fields spanning:
- Player identity and team information
- Statistical projections with confidence intervals  
- Variance diagnostics and calibration metrics
- Big-play probability estimates
- Quality assurance flags

### 1.3 Critical Business Impact

**For Auction Draft Applications**, this data enables:
- **Risk-adjusted player valuations** using percentile distributions
- **Real-time auction strategy** with uncertainty modeling
- **Portfolio optimization** across roster construction
- **Competitive advantage** through statistical edge detection

### 1.4 Integration Complexity

- **Simple Integration**: Use 15 core fields for basic draft functionality
- **Enhanced Integration**: Add 25 variance/risk fields for advanced features  
- **Full Integration**: Leverage all 89 fields for professional-grade analytics

---

## 2. Migration Strategy

### 2.1 Current State Assessment

Your existing auction draft system likely uses simplified projections with limited variance modeling. This Monte Carlo output provides exponentially more sophisticated player modeling.

### 2.2 Phased Migration Approach

#### **Phase 1: Drop-in Replacement (Week 1-2)**
**Objective**: Maintain current functionality while upgrading data quality

**Required Changes**:
```javascript
// Current simple projection mapping
const playerValue = {
  name: player.name,
  position: player.position,  
  projection: player.fantasy_points, // Simple point estimate
  team: player.team
};

// New Monte Carlo mapping (1:1 replacement)
const playerValue = {
  name: player.name,
  position: player.position,
  projection: player.fp_mean,  // Monte Carlo mean estimate
  team: player.team,
  confidence: player.fp_std    // NEW: Uncertainty measure
};
```

**Benefits**: Improved projection accuracy with minimal code changes

#### **Phase 2: Variance-Aware Features (Week 3-4)**
**Objective**: Add risk analysis and confidence intervals

**New Features**:
- Player value confidence bands in auction interface
- Risk-adjusted auction recommendations  
- Tier boundary uncertainty visualization

#### **Phase 3: Advanced Analytics (Month 2)**
**Objective**: Full professional-grade auction intelligence

**Advanced Features**:
- Portfolio construction optimization
- Real-time auction flow modeling
- Comparative advantage detection

### 2.3 Backward Compatibility

The Monte Carlo outputs are **fully backward compatible**. All legacy field mappings work with these improvements:

| Legacy Field | Monte Carlo Equivalent | Enhancement |
|--------------|------------------------|-------------|
| `fantasy_points` | `fp_mean` | Statistical mean vs. point estimate |
| `projection` | `fp_mean` | Same concept, higher accuracy |
| `floor` | `fp_p10` | Statistical 10th percentile |
| `ceiling` | `fp_p90` | Statistical 90th percentile |
| N/A | `fp_std` | **NEW**: Uncertainty quantification |
| N/A | `cv_fp` | **NEW**: Risk normalization |

---

## 3. Complete Data Dictionary

### 3.1 Player Identity & Metadata

| Field | Type | Description | Usage for Auction Draft |
|-------|------|-------------|-------------------------|
| `player_id` | String | Unique player identifier | Primary key for data joins |
| `name` | String | Player full name | Display in auction interface |
| `position` | String | Position (QB, RB, WR, TE, K, DST) | Position-specific auction logic |
| `team` | String | NFL team abbreviation | Bye week planning, team stacking |
| `games` | Integer | Expected games played (typically 17) | Per-game normalization |

### 3.2 Statistical Projections (Baseline Mode)

| Field | Type | Units | Range | Description | Auction Usage |
|-------|------|-------|-------|-------------|---------------|
| `fp_mean` | Float | Fantasy Points | 0-500 | **Statistical mean projection** | **PRIMARY VALUE METRIC** |
| `fp_std` | Float | Fantasy Points | 0-50 | **Standard deviation** | **RISK ASSESSMENT** |
| `fp_p10` | Float | Fantasy Points | 0-500 | 10th percentile (floor) | Worst-case scenario planning |
| `fp_p25` | Float | Fantasy Points | 0-500 | 25th percentile | Conservative projection |
| `fp_p50` | Float | Fantasy Points | 0-500 | Median projection | Risk-neutral valuation |
| `fp_p75` | Float | Fantasy Points | 0-500 | 75th percentile | Optimistic projection |
| `fp_p90` | Float | Fantasy Points | 0-500 | 90th percentile (ceiling) | Best-case scenario |

**Critical Notes**:
- `fp_mean` is your **primary valuation metric** - replaces simple projections
- `fp_std` enables **risk-adjusted pricing** in auction settings
- Percentiles provide **confidence bands** for auction decision-making

### 3.3 Component-Free Mode Results (Advanced Variance)

| Field | Type | Description | Advanced Auction Usage |
|-------|------|-------------|------------------------|
| `fp_mean_comp` | Float | Component-free mode mean | Alternative projection for high-variance scenarios |
| `fp_std_comp` | Float | Component-free standard deviation | Realistic variance estimates |
| `fp_p10_comp` | Float | Component 10th percentile | Wide confidence intervals |
| `fp_p25_comp` | Float | Component 25th percentile | Risk assessment |
| `fp_p50_comp` | Float | Component median | Median outcome |
| `fp_p75_comp` | Float | Component 75th percentile | Upside scenarios |
| `fp_p90_comp` | Float | Component 90th percentile | Maximum ceiling |

### 3.4 Variance & Risk Metrics

| Field | Type | Units | Range | Description | Auction Intelligence |
|-------|------|-------|-------|-------------|---------------------|
| `cv_fp` | Float | Ratio | 0-1.0 | **Coefficient of Variation** | **STANDARDIZED RISK MEASURE** |
| `weekly_cv_fp` | Float | Ratio | 0-2.0 | Weekly variance coefficient | Consistency scoring |
| `UncertaintyPercentile` | Integer | Percentile | 0-100 | Player uncertainty rank | Risk tier classification |
| `weekly_fp_mean_avg` | Float | Points | 0-30 | Average weekly fantasy points | Per-game expectations |
| `weekly_fp_std_avg` | Float | Points | 0-20 | Average weekly volatility | Week-to-week consistency |

**Business Logic**:
- **`cv_fp < 0.05`**: High-confidence projections (stable auction values)
- **`cv_fp > 0.15`**: High-variance players (boom/bust candidates) 
- **`UncertaintyPercentile > 80`**: Avoid in conservative auction strategies

### 3.5 Original Projections (Pre-Simulation)

All fields prefixed with `proj_*` contain the original input projections before Monte Carlo processing:

| Field | Type | Description | Usage |
|-------|------|-------------|--------|
| `proj_pass_yd` | Float | Projected passing yards | QB analysis |
| `proj_pass_td` | Integer | Projected passing TDs | QB scoring |
| `proj_rush_yd` | Float | Projected rushing yards | RB/QB analysis |
| `proj_rush_td` | Integer | Projected rushing TDs | RB/QB scoring |
| `proj_rec_yd` | Float | Projected receiving yards | WR/TE/RB analysis |
| `proj_rec` | Integer | Projected receptions | PPR league adjustments |
| `proj_rec_td` | Integer | Projected receiving TDs | WR/TE scoring |

### 3.6 Variance Diagnostics (Quality Control)

| Field | Type | Description | QA Usage |
|-------|------|-------------|----------|
| `variance_source` | String | Source of variance estimate ("baseline", "player", "position") | Data lineage tracking |
| `variance_outlier_flag` | Integer | 0/1 outlier detection flag | Data quality alerts |
| `variance_outlier_z` | Float | Z-score for outlier detection | Statistical deviation measure |
| `vif_from_projection_error` | Float | Variance inflation from projection errors | Uncertainty attribution |

### 3.7 Big-Play Probability Estimates

| Field | Type | Description | Advanced Strategy |
|-------|------|-------------|-------------------|
| `expected_pass_300_399` | Float | Expected 300-399 yard passing games | QB ceiling weeks |
| `expected_pass_400_499` | Float | Expected 400-499 yard passing games | Elite QB weeks |
| `expected_pass_500_plus` | Float | Expected 500+ yard passing games | Historic performance |
| `expected_40_pass_cmp` | Float | Expected 40+ yard completions | Big-play frequency |
| `expected_40_rush` | Float | Expected 40+ yard rush attempts | Breakaway potential |
| `expected_40_rec` | Float | Expected 40+ yard receptions | Deep threat value |

### 3.8 Simulation Metadata

| Field | Type | Description | Technical Notes |
|-------|------|-------------|-----------------|
| `league` | String | League rules applied ("YAHOO_AUCTION", "CBS_SNAKE") | Scoring system identification |
| `samples` | Integer | Number of Monte Carlo samples (typically 50,000) | Statistical precision indicator |
| `seed` | Integer | Random seed for reproducibility | Result verification |
| `simulation_version` | String | Engine version | Compatibility tracking |
| `validation_passed` | Boolean | Quality assurance flag | Data integrity check |

---

## 4. Field Tiers & Integration Priorities

### 4.1 Tier 1: Essential Fields (Required for Basic Auction)

**Priority Level**: CRITICAL - Implement First

```javascript
// Minimum viable auction data structure
const essentialFields = [
  'player_id',      // Primary key
  'name',           // Display name  
  'position',       // Auction logic
  'team',           // Team identification
  'fp_mean',        // **PRIMARY VALUATION**
  'fp_std',         // **RISK MEASURE**
  'fp_p10',         // Floor projection
  'fp_p25',         // Conservative estimate
  'fp_p50',         // Median projection  
  'fp_p75',         // Optimistic estimate
  'fp_p90',         // Ceiling projection
  'cv_fp',          // **STANDARDIZED RISK**
  'league',         // Scoring system
  'validation_passed' // Data quality
];
```

**Implementation Time**: 1-2 days  
**Business Value**: Core auction functionality with enhanced accuracy

### 4.2 Tier 2: Enhanced Intelligence (Add for Competitive Advantage)

**Priority Level**: HIGH - Implement Second

```javascript
// Enhanced auction intelligence fields
const enhancedFields = [
  'weekly_fp_mean_avg',    // Per-game expectations
  'weekly_fp_std_avg',     // Consistency measure
  'UncertaintyPercentile', // Risk ranking
  'fp_mean_comp',          // Alternative projection
  'fp_std_comp',           // Alternative risk
  'cv_fp_comp',            // Component risk measure
  'variance_source',       // Data confidence
  'proj_pass_td',          // Position-specific analysis
  'proj_rush_td',          // Touchdown upside
  'proj_rec_td',           // Receiving scoring
  'proj_rec'               // PPR value
];
```

**Implementation Time**: 1 week  
**Business Value**: Advanced risk analysis, position-specific intelligence

### 4.3 Tier 3: Professional Analytics (Future Enhancement)

**Priority Level**: MEDIUM - Implement for Professional Edge

```javascript
// Professional-grade analytics fields  
const professionalFields = [
  // Detailed projections
  'proj_pass_yd', 'proj_rush_yd', 'proj_rec_yd',
  
  // Big-play probabilities
  'expected_pass_400_499', 'expected_40_rush', 'expected_40_rec',
  
  // Variance diagnostics  
  'variance_outlier_flag', 'pos_baseline_cv_pass_yd',
  'overdisp_used_pass_td', 'vif_from_projection_error',
  
  // Quality metrics
  'samples', 'seed', 'simulation_version'
];
```

**Implementation Time**: 2-3 weeks  
**Business Value**: Professional-grade analytics, outlier detection, quality assurance

---

## 5. React Widget Integration Recommendations

### 5.1 Player Card Component Enhancement

```jsx
// Enhanced Player Card with Monte Carlo data
const PlayerCard = ({ player }) => {
  const riskLevel = player.cv_fp > 0.15 ? 'high' : 
                   player.cv_fp > 0.08 ? 'medium' : 'low';
  
  const projectionRange = player.fp_p90 - player.fp_p10;
  
  return (
    <div className={`player-card risk-${riskLevel}`}>
      <h3>{player.name} ({player.position})</h3>
      
      {/* Primary Value Display */}
      <div className="projection-display">
        <span className="mean">{player.fp_mean.toFixed(1)}</span>
        <span className="range">±{player.fp_std.toFixed(1)}</span>
      </div>
      
      {/* Confidence Interval Bar */}
      <div className="confidence-bar">
        <div className="p10" style={{left: '10%'}}>{player.fp_p10}</div>
        <div className="p90" style={{left: '90%'}}>{player.fp_p90}</div>
        <div className="range-bar" 
             style={{width: `${projectionRange}%`}}>
        </div>
      </div>
      
      {/* Risk Indicator */}
      <div className="risk-badge">
        Risk: {riskLevel.toUpperCase()}
        <span className="cv">CV: {(player.cv_fp * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};
```

### 5.2 Auction Value Calculator

```javascript
// Value Over Replacement with risk adjustment
class AuctionValueCalculator {
  constructor(players, budget = 200, rosterSize = 16) {
    this.players = players;
    this.budget = budget;
    this.rosterSize = rosterSize;
  }
  
  calculateVOR(player) {
    const positionBaseline = this.getReplacementLevel(player.position);
    return player.fp_mean - positionBaseline;
  }
  
  // Risk-adjusted auction value
  calculateAuctionValue(player, riskTolerance = 0.5) {
    const vor = this.calculateVOR(player);
    const riskDiscount = player.cv_fp * riskTolerance;
    const riskAdjustedVOR = vor * (1 - riskDiscount);
    
    return Math.max(1, riskAdjustedVOR * this.dollarPerPoint);
  }
  
  // Conservative/optimistic scenarios
  getScenarioValue(player, scenario = 'median') {
    const scenarioMap = {
      'floor': player.fp_p10,
      'conservative': player.fp_p25, 
      'median': player.fp_p50,
      'optimistic': player.fp_p75,
      'ceiling': player.fp_p90
    };
    
    return scenarioMap[scenario] || player.fp_mean;
  }
}
```

### 5.3 Real-Time Auction Strategy Component

```jsx
const AuctionStrategy = ({ availablePlayers, currentBudget, roster }) => {
  const getRecommendation = () => {
    const needsByPosition = calculateNeedsByPosition(roster);
    const budgetPerSlot = currentBudget / Object.values(needsByPosition).sum();
    
    return availablePlayers
      .filter(player => needsByPosition[player.position] > 0)
      .map(player => ({
        ...player,
        auctionValue: calculateAuctionValue(player),
        recommendation: getRecommendationType(player, budgetPerSlot)
      }))
      .sort((a, b) => b.auctionValue - a.auctionValue);
  };
  
  const getRecommendationType = (player, budgetPerSlot) => {
    if (player.cv_fp < 0.05 && player.auctionValue <= budgetPerSlot) {
      return 'SAFE_BUY';  // Low risk, good value
    }
    if (player.fp_p90 > player.fp_mean * 1.3 && player.cv_fp > 0.15) {
      return 'UPSIDE_PLAY';  // High ceiling, high risk
    }
    if (player.auctionValue > budgetPerSlot * 1.5) {
      return 'PREMIUM_PICK';  // Expensive but elite
    }
    return 'STANDARD';
  };
  
  return (
    <div className="auction-strategy">
      {getRecommendation().slice(0, 10).map(player => (
        <div key={player.player_id} 
             className={`recommendation ${player.recommendation.toLowerCase()}`}>
          <span>{player.name}</span>
          <span>${player.auctionValue}</span>
          <span className="strategy">{player.recommendation}</span>
        </div>
      ))}
    </div>
  );
};
```

### 5.4 Portfolio Risk Management

```javascript
// Portfolio construction with correlation awareness  
class PortfolioOptimizer {
  constructor(players) {
    this.players = players;
  }
  
  // Calculate portfolio variance considering player correlations
  calculatePortfolioRisk(roster) {
    const totalVariance = roster.reduce((sum, player) => {
      return sum + Math.pow(player.fp_std, 2);
    }, 0);
    
    // Simplified correlation adjustment (in reality, use covariance matrix)
    const diversificationFactor = Math.sqrt(roster.length) / roster.length;
    return Math.sqrt(totalVariance) * diversificationFactor;
  }
  
  // Optimize roster for risk-return tradeoff
  optimizeRoster(availablePlayers, budget, riskTolerance) {
    // Kelly Criterion-inspired position sizing
    return availablePlayers
      .map(player => ({
        ...player,
        kellyWeight: this.calculateKellyWeight(player, riskTolerance),
        efficiency: player.fp_mean / Math.max(player.auctionValue, 1)
      }))
      .filter(player => player.kellyWeight > 0)
      .sort((a, b) => b.efficiency - a.efficiency);
  }
  
  calculateKellyWeight(player, riskTolerance) {
    const edge = (player.fp_mean - this.getMarketValue(player)) / this.getMarketValue(player);
    const variance = Math.pow(player.cv_fp, 2);
    return Math.max(0, edge / variance * riskTolerance);
  }
}
```

---

## 6. Data Quality Assurance

### 6.1 Field Validation Rules

```javascript
const validationRules = {
  // Core identity validations
  player_id: (value) => typeof value === 'string' && value.length > 0,
  name: (value) => typeof value === 'string' && value.length > 2,
  position: (value) => ['QB', 'RB', 'WR', 'TE', 'K', 'DST'].includes(value),
  
  // Fantasy point validations
  fp_mean: (value, player) => {
    const positionRanges = {
      QB: [50, 450], RB: [20, 350], WR: [20, 350], 
      TE: [20, 300], K: [60, 150], DST: [50, 200]
    };
    const [min, max] = positionRanges[player.position] || [0, 500];
    return value >= min && value <= max;
  },
  
  // Statistical consistency checks
  fp_std: (value, player) => {
    // Standard deviation should be reasonable relative to mean
    const cvRatio = value / player.fp_mean;
    return cvRatio >= 0 && cvRatio <= 0.8;  // CV shouldn't exceed 80%
  },
  
  // Percentile ordering validation
  percentiles: (player) => {
    return player.fp_p10 <= player.fp_p25 && 
           player.fp_p25 <= player.fp_p50 && 
           player.fp_p50 <= player.fp_p75 && 
           player.fp_p75 <= player.fp_p90;
  },
  
  // Cross-mode consistency (if component data exists)
  componentConsistency: (player) => {
    if (!player.fp_mean_comp) return true;
    
    // Component mode should have higher variance
    return player.fp_std_comp >= player.fp_std &&
           player.cv_fp_comp >= player.cv_fp;
  }
};
```

### 6.2 Data Quality Metrics

**Expected Value Ranges by Position:**

| Position | fp_mean Range | cv_fp Range | Weekly Avg |
|----------|---------------|-------------|------------|
| QB | 180-400 | 0.005-0.040 | 15-25 |
| RB | 120-320 | 0.008-0.060 | 8-20 |  
| WR | 100-300 | 0.010-0.080 | 7-18 |
| TE | 80-250 | 0.010-0.070 | 6-15 |
| K | 80-150 | 0.015-0.100 | 5-9 |
| DST | 60-180 | 0.020-0.120 | 4-11 |

### 6.3 Automated Quality Checks

```javascript
// Quality assurance function for production data
function validatePlayerData(players) {
  const issues = [];
  
  players.forEach((player, index) => {
    // Check for missing critical fields
    const requiredFields = ['player_id', 'name', 'position', 'fp_mean', 'fp_std'];
    requiredFields.forEach(field => {
      if (player[field] === undefined || player[field] === null) {
        issues.push(`Row ${index}: Missing ${field}`);
      }
    });
    
    // Validate data ranges
    Object.entries(validationRules).forEach(([rule, validator]) => {
      if (typeof validator === 'function' && !validator(player[rule], player)) {
        issues.push(`Row ${index}: Invalid ${rule} for ${player.name}`);
      }
    });
    
    // Check for outliers
    if (player.variance_outlier_flag === 1) {
      issues.push(`Row ${index}: Outlier detected for ${player.name} (z-score: ${player.variance_outlier_z})`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    summary: {
      totalPlayers: players.length,
      validPlayers: players.filter(p => p.validation_passed).length,
      outliers: players.filter(p => p.variance_outlier_flag === 1).length
    }
  };
}
```

---

## 7. Technical Implementation Notes

### 7.1 Data Loading & Parsing

```javascript
// Efficient CSV parsing for large datasets
import Papa from 'papaparse';

class MonteCarloDataLoader {
  static async loadPlayerData(csvFilePath) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvFilePath, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          const validatedData = this.validateAndTransform(results.data);
          resolve(validatedData);
        },
        error: reject
      });
    });
  }
  
  static validateAndTransform(rawData) {
    return rawData
      .filter(player => player.validation_passed === true)
      .map(player => ({
        ...player,
        // Convert string numeric fields to numbers
        fp_mean: parseFloat(player.fp_mean),
        fp_std: parseFloat(player.fp_std),
        cv_fp: parseFloat(player.cv_fp),
        // Add computed convenience fields
        projectionRange: player.fp_p90 - player.fp_p10,
        riskLevel: player.cv_fp > 0.15 ? 'high' : 
                   player.cv_fp > 0.08 ? 'medium' : 'low'
      }));
  }
}
```

### 7.2 Memory Optimization

```javascript
// Optimize memory usage for 500+ player datasets
class MemoryEfficientPlayerStore {
  constructor(players) {
    // Store essential fields in typed arrays for memory efficiency
    this.playerIds = players.map(p => p.player_id);
    this.fpMeans = new Float32Array(players.map(p => p.fp_mean));
    this.fpStds = new Float32Array(players.map(p => p.fp_std));
    this.positions = players.map(p => p.position);
    
    // Index for fast lookups
    this.playerIndex = new Map();
    players.forEach((player, index) => {
      this.playerIndex.set(player.player_id, index);
    });
  }
  
  getPlayer(playerId) {
    const index = this.playerIndex.get(playerId);
    if (index === undefined) return null;
    
    return {
      player_id: this.playerIds[index],
      fp_mean: this.fpMeans[index],
      fp_std: this.fpStds[index],
      position: this.positions[index]
    };
  }
}
```

### 7.3 Caching Strategy

```javascript
// Redis caching for auction performance
class AuctionDataCache {
  constructor(redisClient) {
    this.redis = redisClient;
    this.CACHE_TTL = 3600; // 1 hour
  }
  
  async getCachedPlayerData(league) {
    const cacheKey = `monte_carlo:${league}:players`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Load fresh data
    const freshData = await MonteCarloDataLoader.loadPlayerData(`data/${league}.csv`);
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(freshData));
    return freshData;
  }
  
  async invalidateCache(league) {
    await this.redis.del(`monte_carlo:${league}:players`);
  }
}
```

### 7.4 WebSocket Live Updates

```javascript
// Real-time auction updates using WebSocket
class LiveAuctionManager {
  constructor(socketConnection, playerData) {
    this.socket = socketConnection;
    this.players = new Map(playerData.map(p => [p.player_id, p]));
  }
  
  onPlayerDrafted(playerId, draftPrice) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Update remaining player values based on market signals
    this.updateMarketValues(player, draftPrice);
    
    // Broadcast updated recommendations
    this.socket.emit('auction_update', {
      draftedPlayer: { ...player, draftPrice },
      updatedRecommendations: this.getUpdatedRecommendations()
    });
  }
  
  updateMarketValues(draftedPlayer, actualPrice) {
    const projectedValue = draftedPlayer.fp_mean * this.dollarPerPoint;
    const marketAdjustment = (actualPrice - projectedValue) / projectedValue;
    
    // Apply position-specific market adjustment
    this.players.forEach((player, id) => {
      if (player.position === draftedPlayer.position) {
        player.marketAdjustedValue = player.auctionValue * (1 + marketAdjustment * 0.3);
      }
    });
  }
}
```

### 7.5 Performance Monitoring

```javascript
// Performance tracking for auction application
class PerformanceMonitor {
  static trackDataLoading() {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        console.log(`Data loading took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
  
  static memoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      };
    }
    return null;
  }
}
```

---

## 8. Appendices

### 8.1 Sample Data Structure

```json
{
  "player_id": "14777",
  "name": "Joe Burrow", 
  "position": "QB",
  "team": "CIN",
  "games": 17,
  "fp_mean": 348.76,
  "fp_std": 2.89,
  "fp_p10": 345.39,
  "fp_p25": 346.39,
  "fp_p50": 348.39,
  "fp_p75": 350.39,
  "fp_p90": 352.39,
  "cv_fp": 0.008,
  "weekly_cv_fp": 0.642,
  "UncertaintyPercentile": 14,
  "fp_mean_comp": 378.65,
  "fp_std_comp": 36.84,
  "cv_fp_comp": 0.097,
  "variance_source": "baseline",
  "validation_passed": true,
  "league": "YAHOO_AUCTION",
  "samples": 50000
}
```

### 8.2 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Sep 2025 | Initial release with complete schema documentation |

### 8.3 Contact Information

For technical questions regarding this Interface Control Document:
- **Document Owner**: Senior Software Development Engineer  
- **Review Cycle**: Quarterly updates with simulation engine releases

---

**END OF DOCUMENT**