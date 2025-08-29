# Draft 2 Design - Fantasy Football Auction Draft Helper
*Final architecture with workspace model, injury tracking, and bidding intelligence hooks*

## System Architecture Overview

### Deployment Strategy
**MVP: Pure Client-Side with Workspace Model**
- Static HTML/CSS/JavaScript application
- Workspace-based persistence (.ffdraft files)
- localStorage for auto-recovery
- Export/import for backup
- Static CDN hosting (GitHub Pages/Netlify/Vercel)

**Future: Progressive Enhancement**
- Optional cloud sync
- Real-time data feeds
- LLM integration for strategy
- Payment processing
- Mobile applications

## Core Technical Components

### Frontend Architecture

#### Technology Stack
- **Core**: Vanilla JavaScript ES6+
- **Styling**: Tailwind CSS (CDN)
- **Build**: Vite
- **State**: Event-driven with pub/sub
- **Storage**: Workspace model + localStorage
- **Testing**: Vitest for unit tests

#### Application Structure
```
frontend/
├── index.html                    # Single page application
├── src/
│   ├── core/                    # Business logic
│   │   ├── vbd.js               # VBD calculation engine
│   │   ├── scoring.js           # Fantasy point calculations
│   │   ├── tiers.js             # Tier analysis
│   │   ├── search.js            # Fuzzy search implementation
│   │   └── bidding/             # Future bidding intelligence
│   │       ├── confidence.js    # P10/P90 intervals (stub)
│   │       ├── nomination.js    # Strategy engine (stub)
│   │       └── enforcement.js   # Price floors (stub)
│   ├── data/                    # Data management
│   │   ├── workspace.js         # Workspace save/load
│   │   ├── storage.js           # localStorage wrapper
│   │   ├── import.js            # CSV parser
│   │   ├── mapper.js            # Field mapping (future)
│   │   └── schema.js            # Type definitions
│   ├── state/                   # State management
│   │   ├── store.js             # Single source of truth
│   │   ├── events.js            # Event bus
│   │   └── undo.js              # Undo stack (10 levels)
│   ├── ui/                      # UI components
│   │   ├── dashboard.js         # Main interface
│   │   ├── search.js            # Search component
│   │   ├── analysis.js          # Player analysis
│   │   ├── settings.js          # League config
│   │   └── debug.js             # Debug/validation tab
│   └── app.js                   # Bootstrap
├── data/
│   └── golden/                  # Test datasets
└── styles/
    └── main.css                 # Tailwind config
```

### Data Architecture

#### Workspace Model (.ffdraft format)
```javascript
{
  version: "1.0.0",
  metadata: {
    created: "2025-01-01T00:00:00Z",
    modified: "2025-01-01T00:00:00Z",
    name: "2025 Dynasty League",
    checksum: "sha256..."  // For integrity
  },
  
  league: {
    format: {
      teams: 12,
      budget: 200,
      minBid: 1,
      type: 'auction'
    },
    roster: {
      QB: 1, RB: 2, WR: 3, TE: 1,
      FLEX: 1, K: 1, DST: 1, BENCH: 6
    },
    scoring: {
      preset: 'PPR',
      custom: Map<stat, points>
    },
    keepers: [{
      playerId: 123,
      teamId: 1,
      cost: 25
    }]
  },
  
  datasets: {
    projections: [...],  // Imported CSV data
    rankings: [...],
    adp: [...],
    auctionValues: [...],
    customValues: [...]  // User overrides
  },
  
  fieldMappings: {
    "ESPN_2025": {
      "Player": "player_name",
      "Team": "team",
      // Remembered mappings
    }
  },
  
  players: [
    // Computed/enriched player objects
  ],
  
  draft: {
    phase: 'KEEPER' | 'DRAFT' | 'COMPLETE',
    picks: [...],
    teams: Map<teamId, teamState>,
    history: [...]  // For undo
  },
  
  preferences: {
    starredPlayers: Set<playerId>,
    playerNotes: Map<playerId, string>,
    ui: {
      // Column visibility, sort preferences
    }
  },
  
  notes: "Remember: Team A overpays for RBs..."
}
```

#### Player Model with Injury Status
```javascript
{
  // Identity
  id: Uint16,                    // 2 bytes
  name: String[30],              // 30 bytes (some names longer)
  position: Enum,                // 1 byte (QB|RB|WR|TE|K|DST|FLEX)
  team: Enum,                    // 1 byte (32 NFL teams)
  byeWeek: Uint8,               // 1 byte
  age: Uint8,                   // 1 byte
  rookie: Boolean,              // 1 bit
  
  // Health
  injuryStatus: Enum,           // 1 byte
  // HEALTHY | Q | D | O | IR | PUP | NA
  injuryNotes: String,          // Optional detail
  
  // Projections
  stats: {
    passing: { att, cmp, yds, td, int },
    rushing: { att, yds, td },
    receiving: { tgt, rec, yds, td },
    misc: { fumbles, twoPoint }
  },
  
  // Market Data
  marketData: {
    adp: Float32,
    auctionValue: Uint8,
    consensus: Float32
  },
  
  // Calculated
  calculated: {
    projectedPoints: Float32,
    vbdScore: Float32,
    tier: Uint8,
    positionRank: Uint8,
    confidence: {              // Future
      p10: Float32,
      p50: Float32,
      p90: Float32
    }
  }
}
```

### Core Algorithms

#### VBD Calculation with Injury Adjustment
```javascript
function calculateVBD(players, settings) {
  // Step 1: Apply injury discount
  players.forEach(p => {
    if (p.injuryStatus === 'Q') p.projectedPoints *= 0.95;
    if (p.injuryStatus === 'D') p.projectedPoints *= 0.80;
    if (p.injuryStatus === 'O') p.projectedPoints *= 0.50;
    // IR/PUP typically not draftable
  });
  
  // Step 2: Standard VBD calculation
  // Sort by position
  // Determine baselines (teams × starters)
  // Calculate VBD = points - baseline
  // Cache results
}
```

#### Fuzzy Search with Injury Priority
```javascript
class FuzzySearch {
  search(query) {
    // 1. Exact match
    // 2. Contains match
    // 3. Levenshtein distance
    // 4. Sort results by:
    //    - Match quality
    //    - Injury status (healthy first)
    //    - ADP
    return filtered.slice(0, 10);
  }
}
```

### User Interface Design

#### Dashboard Layout with Debug Tab
```
┌─────────────────────────────────────────────────┐
│  League | Data | Dashboard | Debug              │
├──────────────┬──────────────────────┬───────────┤
│              │                      │           │
│   Budget/    │   Player Analysis    │  Position │
│   Team       │   - Stats           │   Tiers   │
│   Panel      │   - VBD Score       │           │
│              │   - Injury: [Q]     │           │
│              │   - Value Range     │           │
│              │   - Bid Guidance    │           │
│              │   [Future: P10-P90] │           │
│              │                      │           │
├──────────────┴──────────────────────┴───────────┤
│            My Roster & Remaining Needs          │
└─────────────────────────────────────────────────┘
```

#### Debug Tab Interface
```
┌─────────────────────────────────────────────────┐
│                   Debug Tab                     │
├─────────────────────────────────────────────────┤
│  [Load Golden Dataset]  [Run Validation]        │
│                                                  │
│  Validation Results:                            │
│  ┌──────────────────────────────────────┐      │
│  │ Player    | ProjPts | VBD  | Diff    │      │
│  │ Mahomes   | 380.2   | 95.3 | +0.2    │      │
│  │ McCaffrey | 320.5   | 120.1| -0.5    │      │
│  └──────────────────────────────────────┘      │
│                                                  │
│  Metrics:                                       │
│  - MAE (ProjPts): 0.35                         │
│  - MAE (VBD): 0.42                             │
│  - Within Tolerance: 98.5%                      │
│                                                  │
│  Missing Fields: [auction_values: 15 players]   │
└─────────────────────────────────────────────────┘
```

### State Management

#### Event-Driven Architecture
```javascript
class DraftState {
  constructor() {
    this.workspace = new Workspace();
    this.events = new EventBus();
    this.undo = new UndoStack(10);
  }
  
  dispatch(action) {
    // Validate
    const oldState = this.workspace.snapshot();
    
    // Apply
    this.workspace.apply(action);
    
    // Save
    this.undo.push(oldState);
    this.workspace.autoSave();
    
    // Notify
    this.events.emit('stateChange', action);
  }
}
```

### Storage Strategy

#### Workspace Persistence
```javascript
class Workspace {
  constructor() {
    this.data = {};
    this.isDirty = false;
  }
  
  save() {
    // Create .ffdraft file
    const blob = new Blob([
      JSON.stringify(this.data)
    ], { type: 'application/json' });
    
    // Trigger download
    downloadFile('my_draft.ffdraft', blob);
    
    // Also save to localStorage
    localStorage.setItem('ffd_workspace', 
      JSON.stringify(this.data));
  }
  
  load(file) {
    // Read .ffdraft file
    const reader = new FileReader();
    reader.onload = (e) => {
      this.data = JSON.parse(e.target.result);
      this.validate();
      this.migrate();
    };
    reader.readAsText(file);
  }
  
  autoSave() {
    // Debounced save to localStorage
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      localStorage.setItem('ffd_autosave', 
        JSON.stringify(this.data));
    }, 500);
  }
}
```

### Error Handling & Recovery

#### Comprehensive Error Strategy
```javascript
// Workspace corruption recovery
function recoverWorkspace() {
  try {
    // Try primary workspace
    return Workspace.load('ffd_workspace');
  } catch (e1) {
    try {
      // Try autosave
      return Workspace.load('ffd_autosave');
    } catch (e2) {
      // Offer manual recovery
      return promptFileUpload();
    }
  }
}

// Calculation safety
function safeCalculate(fn, fallback = 0) {
  try {
    const result = fn();
    if (!isFinite(result)) return fallback;
    return result;
  } catch (e) {
    console.error('Calculation error:', e);
    return fallback;
  }
}
```

### Performance Optimizations

#### Target Metrics
| Operation | Target | Strategy |
|-----------|--------|----------|
| Search | <50ms | Index + cache |
| VBD Recalc | <100ms | Incremental |
| UI Update | <16ms | RAF batching |
| Workspace Save | <100ms | Debounced |
| CSV Import | <500ms | Stream parse |

### Future Integration Hooks

#### Bidding Intelligence Module
```javascript
// Stub for future implementation
class BiddingIntelligence {
  // P10/P90 confidence intervals
  calculateConfidence(player, league) {
    return { p10: 0, p50: 0, p90: 0 };
  }
  
  // Nomination strategy
  suggestNomination(draftState) {
    return { player: null, reason: '' };
  }
  
  // Price enforcement
  calculateFloor(player, myTeam, opponents) {
    return 1; // Minimum bid for now
  }
  
  // Advanced analytics placeholder
  runAdvancedAnalytics(workspace) {
    // TODO: Integrate research paper algorithm
    return {};
  }
}
```

#### LLM Integration Hook
```javascript
// Future: Strategy assistant
class StrategyAssistant {
  async getAdvice(context) {
    // TODO: Call LLM API
    return "Draft best available value";
  }
  
  async analyzeOpponents(history) {
    // TODO: Pattern recognition
    return {};
  }
}
```

### Testing Strategy

#### Debug Tab Validation
```javascript
class DebugValidator {
  validateAgainstGolden(golden, current) {
    const results = {
      players: [],
      metrics: {
        maePoints: 0,
        maeVBD: 0,
        withinTolerance: 0
      },
      missing: []
    };
    
    // Compare each player
    golden.forEach(g => {
      const c = current.find(p => p.id === g.id);
      if (!c) {
        results.missing.push(g.name);
        return;
      }
      
      const diff = {
        points: Math.abs(g.points - c.points),
        vbd: Math.abs(g.vbd - c.vbd)
      };
      
      results.players.push({ ...g, diff });
    });
    
    // Calculate metrics
    results.metrics = this.calculateMetrics(results.players);
    
    return results;
  }
}
```

### Security Considerations

#### Input Sanitization
```javascript
function sanitizeWorkspace(data) {
  // Validate version
  if (!isValidVersion(data.version)) {
    throw new Error('Invalid workspace version');
  }
  
  // Sanitize strings
  data.players.forEach(p => {
    p.name = sanitizeString(p.name);
    p.notes = sanitizeString(p.notes);
  });
  
  // Verify checksum
  if (!verifyChecksum(data)) {
    console.warn('Workspace checksum mismatch');
  }
  
  return data;
}
```

### Migration Strategy

#### Version Handling
```javascript
class WorkspaceMigrator {
  migrate(workspace) {
    const version = workspace.version;
    
    if (version < "1.0.0") {
      workspace = this.migrateTo100(workspace);
    }
    
    if (version < "1.1.0") {
      workspace = this.migrateTo110(workspace);
    }
    
    workspace.version = CURRENT_VERSION;
    return workspace;
  }
}
```