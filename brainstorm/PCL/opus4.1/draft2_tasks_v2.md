# Draft 2 Tasks - Fantasy Football Auction Draft Helper
*Updated with technical complexity, risk assessment, dependency analysis, plus workspace model and injury tracking*

## Phase 0: Performance Validation
*Duration: 1 day | Risk: HIGH | Critical Path*

### T-000: Performance Benchmark Suite ⚠️
**Complexity**: Medium | **Risk**: High
- Create 300-player test dataset
- Benchmark VBD calculation time with 300 players
- Test search performance at 50, 150, 300 players
- Test localStorage read/write speeds
- Document acceptable performance thresholds
- Create automated performance regression tests
- **** Test workspace save/load performance
- **Success Criteria**: Search <50ms, VBD <100ms, UI updates <16ms, Workspace save <100ms

## Phase 1: Foundation Setup
*Duration: 1-2 days | Risk: LOW*

### T-001: Project Initialization
**Complexity**: Low | **Risk**: Low
- Set up repository structure per GSL standards
- Initialize Vite build system
- Configure Tailwind CSS via CDN
- Create basic HTML skeleton with CSP headers
- Set up development environment
- Add .gitignore and README
- **** Create workspace file format specification

### T-002: Data Schema Definition
**Complexity**: Medium | **Risk**: Medium
- Define optimized Player structure (<100 bytes/player)
- Define League Settings structure
- Define Draft State structure
- Create TypeScript interfaces or JSDoc annotations
- Document data relationships and constraints
- Add size validation helpers
- **** Add injury status enum to Player model
- **** Define Workspace wrapper schema

### T-003: Storage Layer Implementation ⚠️
**Complexity**: High | **Risk**: High
- Create localStorage wrapper with error handling
- Implement size-conscious persistence (<5MB total)
- Add automatic backup on state change
- Create versioning for future migrations
- Implement quota exceeded handling
- Add browser compatibility detection
- Create manual export/import fallback
- **** Implement workspace save/load functionality
- **** Add workspace integrity validation

## Phase 2: Core Data Management
*Duration: 2-3 days | Risk: MEDIUM*

### T-004: CSV Import with Validation ⚠️
**Complexity**: High | **Risk**: Medium
- Implement CSV parser (Papa Parse)
- Add comprehensive format validation
- Handle missing/malformed columns
- Support multiple import formats
- Detect and handle character encodings
- Provide detailed error reporting
- Create import preview UI
- **** Parse and normalize injury status field

### T-005: Golden Dataset Integration
**Complexity**: Low | **Risk**: Low
- Load provided test CSV files
- Transform to internal data format
- Create sample league configurations
- Set up regression test scenarios
- Validate data integrity
- Document expected values
- **** Include injury status in test data

### T-006: Scoring System Implementation
**Complexity**: Medium | **Risk**: Low
- Implement PPR scoring calculations
- Implement half-PPR calculations
- Implement standard scoring
- Support custom scoring overrides
- Auto-configure from presets
- Calculate projected fantasy points
- Validate against known values
- **** Apply injury adjustments (Q=95%, D=80%, O=50%)

## Phase 3: Core Algorithms
*Duration: 3-4 days | Risk: MEDIUM*

### T-007: VBD Calculation Engine
**Complexity**: Medium | **Risk**: Low
- Implement baseline calculation (teams × starters)
- Calculate Points Above Replacement (PAR)
- Create position-specific VBD
- Implement global VBD normalization
- Add FLEX position handling
- Add 2QB/Superflex support
- Cache calculations appropriately
- Handle edge cases (all drafted, negative VBD)
- **** Factor injury status into VBD calculations

### T-008: Position Tier Analysis
**Complexity**: Medium | **Risk**: Medium
- Implement delta-based tier breaks
- Calculate tier thresholds (stdDev × 0.5)
- Create tier visualization data
- Update tiers as players drafted
- Handle edge cases (single player, empty position)
- Add color coding system
- **** Account for injured players in tier gaps

### T-009a: Basic String Search
**Complexity**: Low | **Risk**: Low
- Implement case-insensitive contains search
- Add simple caching mechanism
- Test performance with 300 players
- Filter drafted vs undrafted players
- Return player context (team, position, ADP)
- **** Include injury status in search results

### T-009b: Fuzzy Matching Algorithm ⚠️
**Complexity**: High | **Risk**: Medium
- Implement Levenshtein distance for typos
- Set quality threshold for matches
- Handle special characters safely
- Add name variation support
- Optimize for <50ms performance

### T-009c: Search Results UI
**Complexity**: Medium | **Risk**: Low
- Display player context in results
- Highlight matched portions
- Show drafted players greyed out
- Add keyboard navigation support
- Handle empty results gracefully
- **** Display injury status with color coding

### T-009d: Search Performance Optimization
**Complexity**: Medium | **Risk**: Medium
- Build search index on load
- Implement result caching
- Add input debouncing (150ms)
- Profile and optimize bottlenecks
- Add performance monitoring

## Phase 4: State Management
*Duration: 2 days | Risk: HIGH*

### T-010: State Management System ⚠️
**Complexity**: High | **Risk**: High
- Implement single source of truth store
- Create event bus for updates
- Add pub/sub for UI notifications
- Implement 10-level undo stack
- Add state validation layer
- Create state versioning
- Add action logging for debugging
- **** Integrate workspace state synchronization

### T-011: Auto-Backup System
**Complexity**: Medium | **Risk**: Medium
- Trigger backup on every state change
- Implement efficient serialization
- Keep rolling 3 backups
- Add backup integrity validation
- Create recovery UI
- Test quota limits
- **** Auto-save to workspace file

## Phase 5: User Interface - Settings
*Duration: 2 days | Risk: LOW*

### T-012: League Settings UI
**Complexity**: Medium | **Risk**: Low
- Create settings form interface
- Implement roster configuration UI
- Add scoring system selection
- Create budget configuration
- Add team/owner management
- Support keeper entry mode
- Add validation messages
- **** Save settings to workspace

### T-013: Data Management UI
**Complexity**: Medium | **Risk**: Low
- Create import interface with preview
- Display imported player grid
- Add inline edit capability
- Show data source indicators
- Add bulk operations
- Create export functionality
- **** Display/edit injury status column

## Phase 6: User Interface - Draft Dashboard
*Duration: 4-5 days | Risk: MEDIUM*

### T-014: Dashboard Layout
**Complexity**: Medium | **Risk**: Low
- Create responsive grid layout
- Implement panel system
- Add navigation structure
- Style with Tailwind utilities
- Ensure mobile-friendly design
- Add loading states
- **** Add fourth tab for Debug interface

### ** T-014a: Debug Tab Implementation**
**Complexity**: High | **Risk**: Medium
- Create debug tab interface
- Implement golden dataset loader
- Build comparison display table
- Calculate and show per-player diffs
- Display MAE for ProjPts and VBD
- Show percentage within tolerance
- Highlight missing fields
- Add export validation report feature
- Create configurable tolerance settings

### T-015: Player Search Component
**Complexity**: Medium | **Risk**: Medium
- Create always-visible search input
- Auto-focus on page load
- Display search results dropdown
- Connect to fuzzy search engine
- Add player selection handler
- Show player preview on hover

### T-016: Player Analysis Display ⚠️
**Complexity**: High | **Risk**: Medium
- Create comprehensive player card
- Display VBD metrics prominently
- Implement value range visualization (color gradient)
- Show tier and scarcity information
- Add bid recommendation engine
- Display positional need indicator
- Update in <100ms after selection
- **** Display injury status prominently with color indicator

### T-017: Budget Tracker Component
**Complexity**: Medium | **Risk**: Low
- Display remaining budget prominently
- Calculate max bid with roster needs
- Track all teams' budgets
- Show average $/roster spot
- Add budget alerts/warnings
- Handle keeper-adjusted budgets

### T-018: My Roster Panel
**Complexity**: Medium | **Risk**: Low
- Display drafted players by position
- Show roster composition vs requirements
- Highlight position needs
- Calculate team projections
- Add player removal option
- Show bye week conflicts
- **** Show injury status for rostered players

## Phase 7: Draft Flow Implementation
*Duration: 3-4 days | Risk: HIGH*

### T-019: Keeper Entry Mode
**Complexity**: Medium | **Risk**: Medium
- Use same search/select interface
- Add "Start Draft" button
- Update budgets for keeper costs
- Remove keepers from player pool
- Adjust VBD calculations
- Validate keeper rules
- **** Save keeper state to workspace

### T-020: Draft Event Management ⚠️
**Complexity**: High | **Risk**: High
- Implement two-phase selection flow
- Create result entry interface
- Add team/owner autocomplete
- Validate inputs (price, team)
- Update all state atomically
- Handle rapid consecutive entries
- Add pick editing capability
- **** Update workspace on each event

### T-021: Real-time Recalculation Engine
**Complexity**: High | **Risk**: High
- Trigger VBD recalculation
- Update position tiers
- Refresh all budget displays
- Update roster needs
- Ensure <500ms total update
- Prevent UI blocking
- **** Consider injury status in recalculations

### T-022: Draft History & Undo
**Complexity**: Medium | **Risk**: Medium
- Track all draft actions in order
- Implement 10-deep undo stack
- Show draft log/history view
- Handle dependent calculations on undo
- Add redo capability
- Persist undo stack
- **** Save history to workspace

### T-023: Position Scarcity Visualization
**Complexity**: Medium | **Risk**: Low
- Create VBD curve for next 10 players
- Color-code by tier breaks
- Show "players until drop-off"
- Update after each pick
- Add hover for player details
- Handle empty positions

## Phase 8: Error Handling & Recovery
*Duration: 2 days | Risk: HIGH*

### T-024: Comprehensive Error Handling ⚠️
**Complexity**: High | **Risk**: High
- Wrap all calculations in try-catch
- Add NaN/Infinity checks
- Create user-friendly error messages
- Implement graceful degradation
- Add error reporting system
- Test all error paths
- **** Handle workspace corruption errors

### T-025: Draft Recovery System
**Complexity**: High | **Risk**: High
- Detect corrupted state on load
- Offer recovery options
- Implement state repair logic
- Create disaster recovery UI
- Add manual backup triggers
- Test browser crash scenarios
- **** Recover from workspace file

## Phase 9: Polish & Validation
*Duration: 2-3 days | Risk: LOW*

### T-026: Performance Optimization
**Complexity**: Medium | **Risk**: Medium
- Profile with Chrome DevTools
- Identify and fix bottlenecks
- Implement virtual scrolling if needed
- Add calculation memoization
- Optimize render cycles
- Reduce memory footprint
- **** Optimize workspace operations

### T-027: Browser Compatibility Testing
**Complexity**: Low | **Risk**: Low
- Test Chrome, Firefox, Safari, Edge
- Verify localStorage in all browsers
- Check responsive layouts
- Test in private browsing modes
- Document limitations
- Add compatibility warnings
- **** Test File API support

### T-028: Alpha Testing Preparation
**Complexity**: Low | **Risk**: Low
- Create demo scenarios
- Write testing checklist
- Prepare sample drafts
- Document known issues
- Set up feedback collection
- Create user guide
- **** Include workspace save/load in guide

### T-029: Edge Case Testing
**Complexity**: Medium | **Risk**: Medium
- Test with maximum roster sizes
- Test with minimum budgets
- Test rapid pick entry (50+ in 2 min)
- Test with all positions drafted
- Test browser refresh scenarios
- Test import/export cycles
- **** Test workspace round-trip
- **** Test debug validation accuracy

## Phase 10: Future Enhancements - Infrastructure (Post-MVP)
*Duration: TBD | Risk: LOW*

### T-030: Future Ideas Backlog
- Auction draft trades
- Dynasty league support
- Advanced LLM integration
- Opponent tendency analysis
- Mobile-optimized version
- Real-time data feeds
- Multi-league support
- Historical draft analysis
- Custom projection models
- Social features

### T-031: Backend API Development
- Set up Node.js/Express server
- Create PostgreSQL schema
- Implement JWT authentication
- Add data synchronization
- Deploy to cloud hosting

### T-032: Payment Integration
- Integrate Stripe
- Create subscription tiers
- Add feature gating
- Implement usage limits
- Ensure PCI compliance

### ** T-033: IndexedDB Storage Migration**
**Complexity**: High | **Risk**: Medium
- Migrate from localStorage to IndexedDB
- Support 50MB+ storage capacity
- Implement structured queries
- Maintain backward compatibility
- Create migration tool

### ** T-034: Field Mapping UI**
**Complexity**: Medium | **Risk**: Low
- Create column mapping interface
- Save mapping templates to workspace
- Auto-detect common formats
- Handle CSV header variations
- Support custom field names

### ** T-035: PWA Implementation**
**Complexity**: Medium | **Risk**: Low
- Create service worker
- Implement offline manifest
- Design cache strategies
- Add install prompts
- Test offline functionality

## ** Phase 11: Future Enhancements - Bidding Intelligence (Post-MVP)**
*Duration: TBD | Risk: HIGH*

### **T-040: Bid Range Confidence Overlay** 🎯
**Complexity**: Very High | **Risk**: High
- Calculate P10/P90 confidence intervals for auction values
- Identify "safe bid" zones where you won't be outbid
- Predict competitor bid ranges based on:
  - Team roster needs
  - Remaining budgets
  - Historical patterns
- Create visual overlay showing:
  - Your maximum bid line
  - Predicted competitor ranges
  - Safe zones for winning
- Integrate with player analysis display

### **T-041: Nomination Strategy Engine** 🎣
**Complexity**: Very High | **Risk**: High
- Identify "bait" players to trigger bidding wars
- Analyze opponent roster needs
- Find players where 2+ teams need that position
- Predict overpay likelihood scores
- Suggest supply manipulation tactics:
  - Drain specific position pools
  - Force early overspending
- Implement price enforcement alerts
- Adapt to draft flow in real-time

### **T-042: Deep Sleeper Nomination Timing** 💎
**Complexity**: High | **Risk**: Medium
- Identify optimal timing for sleeper nominations
- Exploit early-draft attention bias
- Calculate draft fatigue patterns
- Track budget depletion curves
- Suggest "stealth nominations"
- Monitor success rates
- Learn from historical patterns

### **T-043: Price Floor Enforcement System** 🚫
**Complexity**: High | **Risk**: Medium
- Calculate minimum acceptable price for every player
- Auto-alert when player might go for steal price
- Quick-bid suggestions to prevent steals
- Factor in:
  - Your roster construction value
  - Opponent advantage prevention
  - Late-draft budget preservation
- Create "never less than X" thresholds
- One-click bid to enforce floor

### **T-044: Advanced Analytics Algorithm Integration** 🧮
**Complexity**: Extremely High | **Risk**: Very High
- **[REQUIRES RESEARCH PAPER]**
- **Pre-task**: Mini planning/challenge/architect loop
- Implement game theory optimization
- Multi-factor player valuation models
- Monte Carlo draft simulations
- Opponent behavior modeling
- Real-time strategy adaptation
- Machine learning integration
- Performance optimization for real-time use

## Risk Matrix

| Risk Level | Tasks | Mitigation Strategy |
|------------|-------|-------------------|
| **HIGH** | T-000, T-003, T-010, T-020, T-024, T-025, T-040-T-044 | Extra testing, fallback plans, careful review |
| **MEDIUM** | T-002, T-004, T-009b, T-014a, T-015, T-016, T-019, T-033 | Prototype first, iterate based on testing |
| **LOW** | T-001, T-005, T-006, T-012, T-027, T-034, T-035 | Standard development practices |

## Critical Path
```
T-000 (Performance Validation)
  ↓
T-003 (Storage Layer + Workspace)
  ↓
T-010 (State Management)
  ↓
T-007 (VBD Engine) + T-009a-d (Search)
  ↓
T-014a (Debug Tab)
  ↓
T-020 (Draft Events)
  ↓
T-024 (Error Handling)
```

## Success Metrics
- ✅ Search returns results in <50ms
- ✅ VBD calculations complete in <100ms
- ✅ All UI updates in <500ms
- ✅ Zero data loss during draft
- ✅ Successful recovery from browser crash
- ✅ Works offline for core features
- ✅ Handles 300+ players smoothly
- ✅ 10-level undo works correctly
- **** ✅ Workspace saves/loads correctly
- **** ✅ Injury status displays properly
- **** ✅ Debug validation matches golden data
- **** ✅ Future bidding hooks ready for implementation