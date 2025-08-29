# Draft 2 Design - Fantasy Football Auction Draft Helper
*Hardened architecture addressing identified risks and failure modes, plus workspace model and injury tracking*

## System Architecture Overview

### Deployment Strategy
**MVP: Pure Client-Side Application**
- Static HTML/CSS/JavaScript (no server dependencies)
- localStorage for all persistence (<5MB footprint)
- **** Workspace file system (.ffdraft format) for complete state management
- Automatic backup on every state change
- Export/import for disaster recovery
- Hosted on static CDN (GitHub Pages/Netlify/Vercel)

**Future: Progressive Enhancement**
- Optional server sync for multi-device
- User accounts with cloud backup
- API for real-time data updates
- Payment processing for premium features
- **** LLM integration for strategy assistance

## Core Technical Components

### Frontend Architecture

#### Technology Stack
- **Core**: Vanilla JavaScript ES6+ (no framework dependencies)
- **Styling**: Tailwind CSS via CDN
- **Build**: Vite for development, static bundle for production
- **State**: Event-driven architecture with pub/sub pattern
- **Storage**: localStorage with automatic backup
- ** Workspace**: File-based complete state persistence

#### Application Structure
```
frontend/
├── index.html                 # Single page application
├── src/
│   ├── core/                 # Business logic (pure functions)
│   │   ├── vbd.js            # VBD calculation engine
│   │   ├── scoring.js        # Point calculations
│   │   ├── tiers.js          # Tier clustering
│   │   ├── search.js         # Fuzzy search algorithms
│   │   └── bidding/          #  Future bidding intelligence
│   │       ├── confidence.js # P10/P90 intervals (stub)
│   │       ├── nomination.js # Strategy engine (stub)
│   │       └── enforcement.js # Price floors (stub)
│   ├── data/                 # Data management
│   │   ├── storage.js        # localStorage with fallback
│   │   ├── backup.js         # Auto-backup system
│   │   ├── import.js         # CSV parser with validation
│   │   ├── workspace.js      #  Workspace save/load
│   │   └── schema.js         # Type definitions
│   ├── state/                # State management
│   │   ├── store.js          # Single source of truth
│   │   ├── events.js         # Event bus implementation
│   │   └── undo.js           # Undo stack (10 levels)
│   ├── ui/                   # UI components
│   │   ├── dashboard.js      # Main draft interface
│   │   ├── search.js         # Search with fuzzy matching
│   │   ├── analysis.js       # Player analysis display
│   │   ├── settings.js       # League configuration
│   │   └── debug.js          #  Debug/validation tab
│   └── app.js               # Application bootstrap
├── styles/
│   └── main.css             # Tailwind configuration
└── data/
    └── golden/              # Test datasets
```

### Data Architecture with Size Constraints

#### Optimized Data Models (Total: ~40KB for 300 players)

**Player Model (100 bytes/player)**
```javascript
{
  id: Uint16,                   // 2 bytes (0-65535)
  name: String[20],             // 20 bytes avg
  position: Uint8,              // 1 byte (enum: 0-7)
  team: Uint8,                  // 1 byte (enum: 0-31)
  byeWeek: Uint8,              // 1 byte (4-14)
  injuryStatus: Uint8,          //  1 byte (enum: 0-6)
  // 0=HEALTHY, 1=Q, 2=D, 3=O, 4=IR, 5=PUP, 6=NA
  projections: {
    stats: Uint16[15],         // 30 bytes (15 stats)
  },
  marketData: {
    adp: Uint16,               // 2 bytes
    auctionValue: Uint8,       // 1 byte ($0-255)
    consensus: Float32,        // 4 bytes (averaged)
  },
  calculated: {
    points: Float32,           // 4 bytes
    vbd: Float32,              // 4 bytes
    tier: Uint8,               // 1 byte
    posRank: Uint8             // 1 byte
  }
}
```

** Injury Status Display Mapping**
```javascript
const INJURY_STATUS = {
  HEALTHY: { value: 0, color: 'green', label: 'Healthy' },
  Q: { value: 1, color: 'yellow', label: 'Questionable' },
  D: { value: 2, color: 'red', label: 'Doubtful' },
  O: { value: 3, color: 'red', label: 'Out' },
  IR: { value: 4, color: 'red', label: 'Injured Reserve' },
  PUP: { value: 5, color: 'red', label: 'PUP List' },
  NA: { value: 6, color: 'gray', label: 'Not Available' }
};
```

**League Settings (2KB)**
```javascript
{
  format: {
    teams: 8-14,
    budget: 50-1000,
    type: 'auction'|'snake'
  },
  roster: {
    QB: 1-2, RB: 2-3, WR: 2-4, TE: 1-2,
    FLEX: 0-2, K: 0-1, DST: 0-1, BENCH: 4-8
  },
  scoring: {
    preset: 'PPR'|'HALF'|'STD'|'CUSTOM',
    overrides: Map<stat, points>
  },
  keepers: [{
    playerId: Uint16,
    teamId: Uint8,
    cost: Uint8
  }]
}
```

**Draft State (6KB max)**
```javascript
{
  phase: 'KEEPER'|'DRAFT'|'COMPLETE',
  picks: [{
    playerId: Uint16,         // 2 bytes
    teamId: Uint8,            // 1 byte
    price: Uint8,             // 1 byte
    round: Uint8,             // 1 byte
    timestamp: Uint32         // 4 bytes
  }],
  teams: Map<id, {
    budget: Uint16,
    roster: Set<playerId>
  }>,
  undoStack: CircularBuffer[10]  // Last 10 actions
}
```

** Workspace Model (.ffdraft format)**
```javascript
{
  version: "1.0.0",
  metadata: {
    created: Date.now(),
    modified: Date.now(),
    name: "2025 Dynasty League",
    checksum: "sha256..."  // For integrity
  },
  league: { /* League Settings */ },
  players: [ /* All player data with customizations */ ],
  draftState: { /* Current draft state */ },
  ui: {
    starredPlayers: Set<playerId>,
    playerNotes: Map<playerId, string>,
    columnSettings: { /* Grid preferences */ }
  },
  history: [ /* Action history for recovery */ ]
}
```

### Core Algorithms with Performance Guarantees

#### VBD Calculation (Target: <100ms for 300 players)
```javascript
function calculateVBD(players, settings) {
  //  Step 0: Apply injury adjustments
  players.forEach(p => {
    if (p.injuryStatus === INJURY_STATUS.Q.value) {
      p.adjustedPoints = p.points * 0.95;
    } else if (p.injuryStatus === INJURY_STATUS.D.value) {
      p.adjustedPoints = p.points * 0.80;
    } else if (p.injuryStatus === INJURY_STATUS.O.value) {
      p.adjustedPoints = p.points * 0.50;
    } else {
      p.adjustedPoints = p.points;
    }
  });
  
  // Step 1: Calculate fantasy points (parallelizable)
  // Step 2: Sort by position (O(n log n))
  // Step 3: Determine baselines
  //   baseline = settings.teams * settings.roster[position]
  // Step 4: Calculate VBD (O(n))
  //   VBD = adjustedPoints - baseline[position]
  // Step 5: Cache results
}
```

**Performance Optimizations:**
- Pre-calculate on data load
- Only recalculate affected positions
- Use typed arrays for calculations
- Cache baseline players

#### Fuzzy Search Implementation (Target: <50ms)
```javascript
class FuzzySearch {
  constructor(players) {
    // Build search index on initialization
    this.index = this.buildIndex(players);
    this.cache = new Map();
  }
  
  search(query) {
    // 1. Check cache first
    // 2. Simple contains for short queries
    // 3. Levenshtein for longer queries
    // 4. Return filtered, not rebuilt array
    //  5. Include injury status in results
  }
}
```

**Search Strategy:**
- Pre-built index at startup
- Simple filter for drafted/undrafted
- Cache recent searches
- Debounce input (150ms)

#### Tier Calculation
```javascript
function calculateTiers(players) {
  // Use VBD delta thresholds, not k-means
  // Tier break = VBD delta > threshold
  // Threshold = stdDev * 0.5
  // Color code: green(T1), yellow(T2), orange(T3), red(T4+)
  //  Consider injured players in tier gaps
}
```

### State Management Architecture

#### Event-Driven Updates
```javascript
class DraftState {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.undoStack = [];
    this.workspace = new Workspace(); // 
  }
  
  dispatch(action) {
    // 1. Validate action
    // 2. Update state
    // 3. Push to undo stack
    // 4. Trigger auto-backup
    // 5. Notify listeners
    //  6. Update workspace
    this.workspace.update(this.state);
  }
}
```

#### Update Flow
```
User Action → Validate → Update State → Auto-Backup → Calculate → Update UI
                              ↓                ↓
                         Undo Stack      Workspace Save
```

### ** Workspace Management**

```javascript
class Workspace {
  constructor() {
    this.data = {
      version: "1.0.0",
      metadata: {},
      league: {},
      players: [],
      draftState: {},
      ui: {},
      history: []
    };
  }
  
  save() {
    const blob = new Blob([JSON.stringify(this.data)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `draft_${Date.now()}.ffdraft`;
    a.click();
  }
  
  async load(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate version and checksum
    if (!this.validate(data)) {
      throw new Error('Invalid workspace file');
    }
    
    // Migrate if needed
    if (data.version < this.data.version) {
      data = this.migrate(data);
    }
    
    this.data = data;
    return data;
  }
  
  validate(data) {
    // Check required fields
    // Verify checksum
    // Validate data integrity
    return true;
  }
}
```

### ** Debug Tab Interface**

```javascript
class DebugValidator {
  constructor() {
    this.goldenData = null;
    this.currentData = null;
  }
  
  loadGolden(file) {
    // Load golden dataset for comparison
  }
  
  validate() {
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
    this.goldenData.forEach(golden => {
      const current = this.currentData.find(p => p.id === golden.id);
      if (!current) {
        results.missing.push(golden.name);
        return;
      }
      
      const diff = {
        points: Math.abs(golden.points - current.points),
        vbd: Math.abs(golden.vbd - current.vbd)
      };
      
      results.players.push({ ...golden, diff });
    });
    
    // Calculate metrics
    results.metrics = this.calculateMetrics(results.players);
    
    return results;
  }
  
  exportReport(results) {
    // Generate CSV or JSON report
  }
}
```

### Error Handling & Recovery

#### Defensive Programming
```javascript
// Every external data point wrapped
function safeParseInt(value, defaultValue = 0) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Every calculation checked
function calculateVBD(points, baseline) {
  if (!isFinite(points) || !isFinite(baseline)) {
    console.error('Invalid VBD inputs:', points, baseline);
    return 0;
  }
  return Math.max(0, points - baseline);
}

//  Injury status validation
function normalizeInjuryStatus(status) {
  const valid = ['HEALTHY', 'Q', 'D', 'O', 'IR', 'PUP', 'NA'];
  if (!valid.includes(status)) {
    console.warn('Invalid injury status:', status);
    return 'NA';
  }
  return status;
}
```

#### Recovery Mechanisms
1. **Auto-Backup System**
   - Trigger: Every state change
   - Storage: localStorage + exportable JSON
   - **** Workspace: Auto-save to .ffdraft file
   - Size: <1MB compressed
   - Format: `{ version, timestamp, state }`

2. **Crash Recovery**
   - On load: Check for backup
   - **** Check for auto-saved workspace
   - Validate backup integrity
   - Offer recovery or fresh start
   - Keep last 3 backups

3. **Import/Export**
   ```javascript
   // Export format (backward compatible)
   {
     version: "1.0.0",
     timestamp: Date.now(),
     settings: {...},
     players: [...],
     draft: {...}
   }
   
   //  Workspace format (comprehensive)
   {
     version: "1.0.0",
     metadata: {...},
     league: {...},
     players: [...],
     draftState: {...},
     ui: {...},
     history: [...]
   }
   ```

### Performance Benchmarks

#### Required Benchmarks
| Operation | Target | Measurement Method |
|-----------|--------|-------------------|
| Initial Load | <2s | Performance.now() |
| Search (300 players) | <50ms | Average of 100 searches |
| VBD Recalc (per pick) | <100ms | After each draft event |
| UI Update | <16ms | RequestAnimationFrame |
| Auto-backup | <50ms | After state change |
| CSV Import (300 rows) | <500ms | File input to ready |
| **** Workspace Save | <100ms | File generation time |
| **** Debug Validation | <200ms | Golden comparison |

#### Performance Test Suite
```javascript
class PerformanceBenchmark {
  static runAll() {
    this.testSearch();      // Various query lengths
    this.testVBD();         // Full recalculation
    this.testUIUpdate();    // Rapid draft events
    this.testMemory();      // Check for leaks
    this.testBackup();      // Auto-save performance
    this.testWorkspace();   //  Workspace operations
    this.testDebug();       //  Debug validation
  }
}
```

### Browser Compatibility Strategy

#### Feature Detection
```javascript
// On app load
const features = {
  localStorage: 'localStorage' in window,
  es6: checkES6Support(),
  performance: 'performance' in window,
  fileAPI: 'File' in window  //  For workspace files
};

if (!features.localStorage) {
  showError('localStorage required');
  offerManualMode();
}
```

#### Graceful Degradation
- No localStorage → Manual export/import only
- Slow device → Reduce update frequency
- Old browser → Show compatibility warning
- **** No File API → Basic JSON export/import

### Testing Strategy

#### Unit Tests
- VBD calculations with edge cases
- Search algorithm accuracy
- Tier breakpoint calculations
- Import validation logic
- State management integrity
- **** Injury adjustment calculations
- **** Workspace save/load
- **** Debug comparison logic

#### Integration Tests
- Full draft flow simulation
- Rapid pick entry
- Undo/redo sequences
- Import → Draft → Export cycle
- Recovery from corrupted state
- **** Workspace round-trip
- **** Debug validation flow

#### Performance Tests
- 300 player search benchmark
- Rapid draft event handling
- Memory leak detection
- localStorage limits
- Backup performance
- **** Workspace file size limits
- **** Debug with large datasets

#### Manual Test Checklist
- [ ] Import golden dataset
- [ ] Configure league settings
- [ ] Enter 5 keeper players
- [ ] Start draft
- [ ] Search for misspelled player
- [ ] Complete 50 picks rapidly
- [ ] Undo last 10 actions
- [ ] Refresh browser mid-draft
- [ ] Recover from backup
- [ ] Export final results
- [ ] **** Save workspace file
- [ ] **** Load workspace file
- [ ] **** Run debug validation
- [ ] **** Check injury status display

### Security Considerations

#### Input Sanitization
```javascript
function sanitizePlayerName(name) {
  return name
    .replace(/<script>/gi, '')
    .replace(/javascript:/gi, '')
    .substring(0, 50);
}

//  Workspace validation
function sanitizeWorkspace(data) {
  // Validate structure
  // Sanitize strings
  // Check file size
  // Verify checksum
  return data;
}
```

#### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               style-src 'self' 'unsafe-inline' cdn.tailwindcss.com;">
```

### ** Future Bidding Intelligence Hooks**

```javascript
// Stub interfaces for future implementation
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

### Future Architecture Paths

#### Progressive Enhancement
1. **Phase 1**: Pure client-side (MVP)
2. **Phase 2**: Optional sync server
3. **Phase 3**: Real-time data feeds
4. **Phase 4**: LLM integration
5. **Phase 5**: Mobile apps
6. ** Phase 6**: Advanced bidding intelligence

#### API Structure (Future)
```
/api/v1/
  /auth/login
  /auth/logout
  /sync/pull
  /sync/push
  /data/players
  /data/projections
  /premium/analyze
  /llm/strategy       
  /analytics/advanced  
```