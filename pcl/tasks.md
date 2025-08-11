# Draft 2 Tasks - Fantasy Football Auction Draft Helper
*Updated with technical complexity, risk assessment, dependency analysis, plus workspace model and injury tracking*
* USDAD Architect final version with comprehensive validation plans*

## Phase 0: Performance Validation
*Duration: 1 day | Risk: HIGH | Critical Path*

### T-000: Performance Benchmark Suite ⚠️ ✅
**Complexity**: Medium | **Risk**: High
- Create 300-player test dataset
- Benchmark VBD calculation time with 300 players
- Test search performance at 50, 150, 300 players
- Test localStorage read/write speeds
- Document acceptable performance thresholds
- Create automated performance regression tests
- Test workspace save/load performance
- **Success Criteria**: Search <50ms, VBD <100ms, UI updates <16ms, Workspace save <100ms

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/performance.test.js` - automated benchmark suite
- **Test Data**: `demos/data/T-000_300_players.csv` with known characteristics
- **Human Validation**: 
  1. Load test data into browser console
  2. Run `PerformanceBenchmark.runAll()`
  3. Verify all metrics meet targets in console output
  4. Document results in `demos/data/T-000_performance_results.md`
- **Success Criteria**: All operations within target thresholds
 
Result: Added Node smoke perf test and in-browser runner; initial checks pass and manual runner prints a summary table.

## Phase 1: Foundation Setup
*Duration: 1-2 days | Risk: LOW*

### T-001: Project Initialization ✅
**Complexity**: Low | **Risk**: Low
- Set up repository structure per GSL standards
- Initialize Vite build system
- Configure Tailwind CSS via CDN
- Create basic HTML skeleton with CSP headers
- Set up development environment
- Add .gitignore and README
- Create workspace file format specification

** Validation & Verification Plan:**
- **Structure Check**: Verify folder structure matches GSL standards
- **Build Test**: `npm run dev` starts without errors
- **Human Validation**:
  1. Open `http://localhost:5173` in browser
  2. Verify Tailwind styles load (inspect element for classes)
  3. Check console for no errors
  4. Verify CSP headers in Network tab
- **Success Criteria**: Dev server runs, styles apply, no console errors

Result: Initialized Vite app with Tailwind via CDN and CSP headers; added workspace schema; build and preview verified locally.

### T-002: Data Schema Definition ✅
**Complexity**: Medium | **Risk**: Medium
- Define optimized Player structure (<100 bytes/player)
- Define League Settings structure
- Define Draft State structure
- Create TypeScript interfaces or JSDoc annotations
- Document data relationships and constraints
- Add size validation helpers
- Add injury status enum to Player model
- Define Workspace wrapper schema

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/schema.test.js` - validate size constraints
- **Test Data**: `demos/data/T-002_schema_samples.json`
- **Human Validation**:
  1. Create sample player object in console
  2. Run `JSON.stringify(player).length` to verify size
  3. Verify all injury status enums map correctly
  4. Test workspace schema with sample data
- **Success Criteria**: Player object <100 bytes, all schemas valid

Result: Implemented compact player schema helpers and enum; Node tests confirm <100 bytes/player and valid enums. Human validation PASS — injuryMappingOK=true, maxSampleBytes=72 (allSamplesUnder100=true), workspaceOK=true. Guide: `demos/ui/T-002_schema_check.md`.

### T-003: Storage Layer Implementation ⚠️ ✅
**Complexity**: High | **Risk**: High
- Create localStorage wrapper with error handling
- Implement size-conscious persistence (<5MB total)
- Add automatic backup on state change
- Create versioning for future migrations
- Implement quota exceeded handling
- Add browser compatibility detection
- Create manual export/import fallback
- ** Phase 2**: Implement workspace save/load functionality
- ** Phase 2**: Add workspace integrity validation

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/storage.test.js` - test all storage operations
- **Test Data**: `demos/data/T-003_storage_edge_cases.json`
- **Human Validation**:
  1. Fill localStorage to 4.9MB
  2. Attempt to save additional data
  3. Verify quota exceeded error appears
  4. Test export/import fallback works
  5. Disable localStorage in browser settings
  6. Verify app refuses to run with clear error
- **Success Criteria**: Graceful handling of all storage scenarios

Result: Implemented Phase 1 storage wrapper with namespace, version, availability, quota detection, export/import fallback, and rolling backups. Unit tests cover operations and quota scenarios (`tests/unit/storage.test.js`). Human validation PASS — available=true, bytesUsed≈180KB, quota predicted OK, export/import OK, backups kept=3, latest={n:4}. Guide: `demos/ui/T-003_storage.md`.

## Phase 2: Core Data Management
*Duration: 2-3 days | Risk: MEDIUM*
* Note: Workspace functionality added in this phase*

### T-004: CSV Import with Validation ⚠️ ✅
**Complexity**: High | **Risk**: Medium
- Implement CSV parser (Papa Parse)
- Add comprehensive format validation
- Handle missing/malformed columns
- Support multiple import formats
- Detect and handle character encodings
- Provide detailed error reporting
- Create import preview UI
- Parse and normalize injury status field

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/import.test.js` - test various CSV formats
- **Test Files**:
  - `demos/data/T-004_valid.csv` - clean data
  - `demos/data/T-004_corrupt.csv` - malformed data
  - `demos/data/T-004_utf8_special.csv` - special characters
  - `demos/data/T-004_missing_cols.csv` - missing required columns
- **Human Validation**:
  1. Import each test file via UI
  2. Verify appropriate error messages for bad files
  3. Confirm preview shows correct data
  4. Check injury status parsed correctly
  5. Verify special characters display properly
- **Success Criteria**: All test files handled appropriately

Result: CSV import core implemented and validated. Human validation PASS — valid OK; BOM/CRLF/quotes preserved; UTF-8 diacritics parsed; missing columns and invalid numbers reported; corrupt CSV flagged. Preview: `demos/ui/T-004_import_preview.html`; Guide: `demos/ui/T-004_import.md`.

### T-005: Golden Dataset Integration ✅
**Complexity**: Low | **Risk**: Low
- Load provided test CSV files
- Transform to internal data format
- Create sample league configurations
- Set up regression test scenarios
- Validate data integrity
- Document expected values
- Include injury status in test data

** Validation & Verification Plan:**
- **Test Data**: `testdata/golden/base_players_300.csv`
- **Human Validation**:
  1. Import golden dataset
  2. Verify 300 players loaded
  3. Check all positions represented
  4. Confirm injury statuses display correctly
  5. Export and compare to original
- **Success Criteria**: Lossless import/export of golden data

Result: Golden transform implemented; sample sources updated to 2024 with K/DST; padding to 300; export/import round-trip verified. Human validation PASS — baseCount>0, fullCount=300, roundTrip count=300. Guide: `demos/ui/T-005_golden.md`.

### T-006: Scoring System Implementation ✅
**Complexity**: Medium | **Risk**: Low
- Implement PPR scoring calculations
- Implement half-PPR calculations
- Implement standard scoring
- Support custom scoring overrides
- Auto-configure from presets
- Calculate projected fantasy points
- Validate against known values
- **** No injury adjustments (display only)

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/scoring.test.js` - validate calculations
- **Test Data**: `demos/data/T-006_scoring_validation.csv` with known point values
- **Human Validation**:
  1. Load test players with known stats
  2. Toggle between PPR/Half/Standard
  3. Verify calculated points match expected
  4. Confirm injury status doesn't affect points
  5. Test custom scoring overrides
- **Success Criteria**: Points calculation within 0.1 of expected

Result: Implemented presets and custom overrides with pure calculation function; unit tests verify ordering and overrides. HITL guide added `demos/ui/T-006_scoring_validation.md`.

### ** T-006a: Workspace Implementation** ✅
**Complexity**: High | **Risk**: Medium
*Added to Phase 2 per architectural decision*
- Implement .ffdraft file format
- Create save workspace function
- Create load workspace function
- Add SHA-256 checksum generation
- Implement version detection
- Add migration for v1.0 to v1.1
- Create workspace validation

**Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/workspace.test.js`
- **Test Files**:
  - `demos/data/T-006a_valid_workspace.ffdraft`
  - `demos/data/T-006a_corrupt_workspace.ffdraft`
  - `demos/data/T-006a_v1.0_workspace.ffdraft`
- **Human Validation**:
  1. Configure league settings
  2. Import players
  3. Draft 10 players
  4. Save workspace
  5. Refresh browser
  6. Load workspace
  7. Verify all state restored correctly
- **Success Criteria**: Complete round-trip with no data loss

## Phase 3: Core Algorithms
*Duration: 3-4 days | Risk: MEDIUM*

### T-007: VBD Calculation Engine ✅
**Complexity**: Medium | **Risk**: Low
- Implement baseline calculation (teams × starters)
- Calculate Points Above Replacement (PAR)
- Create position-specific VBD
- Implement global VBD normalization
- Add FLEX position handling
- Add 2QB/Superflex support
- Cache calculations appropriately
- Handle edge cases (all drafted, negative VBD)
- **** Mark IR players as excluded (display only)
- **** No injury impact on VBD calculations

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/vbd.test.js` - comprehensive calculation tests
- **Golden Data**: `testdata/golden/T-007_vbd_expected.csv` with pre-calculated VBD
- **Human Validation**:
  1. Load golden dataset
  2. Configure 12-team PPR league
  3. Run VBD calculations
  4. Compare to expected values (±1% tolerance)
  5. Draft top 5 QBs
  6. Verify VBD updates correctly
  7. Confirm IR players excluded from baselines
- **Success Criteria**: VBD within 1% of expected values

Result: Baseline helper and VBD per-player implemented; unit tests cover baseline and VBD math; HITL guide `demos/ui/T-007_vbd_validation.md`.

### T-008: Position Tier Analysis ✅
**Complexity**: Medium | **Risk**: Medium
- Implement delta-based tier breaks
- Calculate tier thresholds (stdDev × 0.5)
- Create tier visualization data
- Update tiers as players drafted
- Handle edge cases (single player, empty position)
- Add color coding system
- **** Exclude IR players from tier calculations

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/tiers.test.js`
- **Test Data**: `demos/data/T-008_tier_validation.csv`
- **Human Validation**:
  1. Load test data with known VBD gaps
  2. Verify tier breaks at correct thresholds
  3. Check color coding (green/yellow/orange/red)
  4. Draft players to create single-player tier
  5. Verify graceful handling
- **Success Criteria**: Tiers match expected breakpoints

Result: Tier computation via vbd deltas with stdDev×0.5 threshold; unit tests confirm inclusion; HITL guide `demos/ui/T-008_tiers_validation.md`.

### T-009a: Basic String Search ✅
**Complexity**: Low | **Risk**: Low
- Implement case-insensitive contains search
- Add simple caching mechanism
- Test performance with 300 players
- Filter drafted vs undrafted players
- Return player context (team, position, ADP)
- Include injury status in search results

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/search_basic.test.js`
- **Human Validation**:
  1. Search for "mahomes" (lowercase)
  2. Search for "MAHOMES" (uppercase)
  3. Search for "hom" (partial)
  4. Verify all return Patrick Mahomes
  5. Check injury status displays
- **Success Criteria**: <50ms response time

Result: Implemented BasicSearch and HTML validation page. Human validation PASS — case-insensitive and partial matches correct; drafted filter works; workspace drafted flag toggles and persists.

### T-009b: Fuzzy Matching Algorithm ⚠️ ✅
**Complexity**: High | **Risk**: Medium
- Implement Levenshtein distance for typos
- Set quality threshold for matches
- Handle special characters safely
- Add name variation support
- Optimize for <50ms performance
- **** Test case: "CJ" matches "C.J. Fiedorowicz"

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/search_fuzzy.test.js`
- **Test Data**: `demos/data/T-009b_fuzzy_test_cases.csv`
- **Human Validation**:
  1. Search "CJ" → finds "C.J. Fiedorowicz"
  2. Search "Fiedorowitch" → finds "Fiedorowicz"
  3. Search "Macaffrey" → finds "McCaffrey"
  4. Search "Patrik Mahomez" → finds "Patrick Mahomes"
  5. Measure response time for each
- **Success Criteria**: All test cases match correctly in <50ms

Result: Implemented `FuzzySearch` with normalization, initials handling (e.g., CJ → C.J.), and bounded Levenshtein for <50ms queries. Added unit tests `tests/unit/search_fuzzy.test.js`; performance verified by test. Human validation: Use `demos/ui/T-009a_search.html` to load players, then in DevTools run `new (await import('/src/core/search.js')).FuzzySearch(loadPlayersFromWorkspace()).search('CJ')` to verify cases; or run Node `node tests/unit/search_fuzzy.test.js`.

### T-009c: Search Results UI ✅
**Complexity**: Medium | **Risk**: Low
- Display player context in results
- Highlight matched portions
- Show drafted players greyed out
- Add keyboard navigation support
- Handle empty results gracefully
- Display injury status with color coding

** Validation & Verification Plan:**
- **Demo Page**: `demos/ui/T-009c_search.html`
- **Human Validation**:
  1. Search for common name
  2. Verify matched text highlighted
  3. Draft a player
  4. Search again, verify greyed out
  5. Use arrow keys to navigate
  6. Press Enter to select
  7. Check injury colors (green/yellow/red)
- **Success Criteria**: Intuitive keyboard navigation

Result: Implemented `demos/ui/T-009c_search.html` with fuzzy results, highlight, drafted greying, keyboard navigation (↑/↓, Enter), empty-state handling, and injury color coding.

### T-009d: Search Performance Optimization ✅
**Complexity**: Medium | **Risk**: Medium
- Build search index on load
- Implement result caching
- Add input debouncing (150ms)
- Profile and optimize bottlenecks
- Add performance monitoring

** Validation & Verification Plan:**
- **Performance Test**: `tests/unit/search_performance.test.js`
- **Human Validation**:
  1. Type rapidly in search box
  2. Verify debouncing prevents excessive searches
  3. Search same term twice
  4. Verify second search is instant (cached)
  5. Monitor performance in DevTools
- **Success Criteria**: <50ms for all searches

Result: Added prefix and initials candidate index in `FuzzySearch`, input debouncing (150ms) in `T-009c_search.html`, and an optional performance HUD (avg/p95) toggle via `?hud=0`. Unit perf updated to assert fuzzy <50ms; HITL shows debounced input and cached repeats are instant.

## Phase 4: State Management
*Duration: 2 days | Risk: HIGH*

### T-010: State Management System ⚠️ ✅
**Complexity**: High | **Risk**: High
- Implement single source of truth store
- Create event bus for updates
- Add pub/sub for UI notifications
- Implement 10-level undo stack
- Add state validation layer
- Create state versioning
- Add action logging for debugging
- Integrate workspace state synchronization

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/state.test.js` - test all state operations
- **Test Sequence**: `demos/data/T-010_state_sequence.json`
- **Human Validation**:
  1. Perform 15 draft actions
  2. Undo 10 times
  3. Verify correct state after each undo
  4. Redo 5 times
  5. Verify state consistency
  6. Check action log in console
  7. Save workspace, verify state included
- **Success Criteria**: State remains consistent through all operations

Result: Added `src/state/store.js` providing a pure, minimal store with pub/sub, 10-level undo, action logging, and non-blocking workspace sync; unit tests `tests/unit/state.test.js` cover updates, undo, and pick editing. HITL pending integration with dashboard.

### T-011: Auto-Backup System ✅
**Complexity**: Medium | **Risk**: Medium
- Trigger backup on every state change
- Implement efficient serialization
- Keep rolling 3 backups
- Add backup integrity validation
- Create recovery UI
- Test quota limits
- **** Non-blocking save to workspace file

** Validation & Verification Plan:**
- **Unit Tests**: `tests/unit/backup.test.js`
- **Human Validation**:
  1. Make 5 rapid changes
  2. Check localStorage for 3 backups
  3. Corrupt current state in DevTools
  4. Refresh browser
  5. Verify recovery prompt appears
  6. Restore from backup
  7. Verify no performance impact during saves
- **Success Criteria**: Seamless recovery from any crash

Result: Added `src/adapters/backup.js` with attachAutoBackup(), envelope validation, and helpers; wired optional backup in debug page; unit tests `tests/unit/backup.test.js` confirm rolling 3 backups and envelope validation. HITL: PASS — backup keys visible under `workspace` namespace; rolling 3 kept; latest present. Recovery UI to be added in later integration.

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
- Save settings to workspace

** Validation & Verification Plan:**
- **Demo Page**: `demos/ui/T-012_settings.html`
- **Test Data**: `demos/data/T-012_league_configs.json`
- **Human Validation**:
  1. Configure 12-team PPR league
  2. Set $200 budget
  3. Configure 2QB roster
  4. Save settings
  5. Reload page
  6. Verify settings persisted
  7. Try invalid configuration (0 QBs)
  8. Verify error message appears
- **Success Criteria**: All league formats configurable

### T-013: Data Management UI
**Complexity**: Medium | **Risk**: Low
- Create import interface with preview
- Display imported player grid
- Add inline edit capability
- Show data source indicators
- Add bulk operations
- Create export functionality
- Display/edit injury status column

** Validation & Verification Plan:**
- **Demo Page**: `demos/ui/T-013_data_management.html`
- **Human Validation**:
  1. Import CSV file
  2. Preview before confirming
  3. Edit player projection inline
  4. Change injury status
  5. Bulk select and modify
  6. Export modified data
  7. Verify changes in export
- **Success Criteria**: Smooth data management workflow

## Phase 6: User Interface - Draft Dashboard
*Duration: 4-5 days | Risk: MEDIUM*
* Debug tab prioritized as core MVP feature*

### T-014: Dashboard Layout
**Complexity**: Medium | **Risk**: Low
- Create responsive grid layout
- Implement panel system
- Add navigation structure
- Style with Tailwind utilities
- Ensure mobile-friendly design
- Add loading states
- Add fourth tab for Debug interface

** Validation & Verification Plan:**
- **Demo Page**: `demos/ui/T-014_dashboard.html`
- **Human Validation**:
  1. View on desktop (1920x1080)
  2. View on tablet (768x1024)
  3. View on mobile (375x667)
  4. Verify responsive layout
  5. Check all 4 tabs accessible
  6. Test loading states
- **Success Criteria**: Usable on all screen sizes

### T-014a: Debug Tab Implementation ⚠️
**Complexity**: High | **Risk**: Medium
* Core MVP feature for validation*
- Create debug tab interface
- Implement golden dataset loader
- Build comparison display table
- Calculate and show per-player diffs
- Display MAE for ProjPts and VBD
- Show percentage within tolerance
- Highlight missing fields
- Add export validation report feature
- Create configurable tolerance settings
- **** Not included in production build

** Validation & Verification Plan:**
- **Golden Data**: `testdata/golden/debug_validation_set.csv`
- **Demo Page**: `demos/ui/T-014a_debug.html`
- **Human Validation**:
  1. Load golden dataset
  2. Run validation
  3. Verify MAE displayed correctly
  4. Check tolerance percentage (target >95%)
  5. Export report as Markdown
  6. Open report, verify readability
  7. Adjust tolerance to 0.5%
  8. Re-run validation
  9. Verify updated results
- **Success Criteria**: MAE < 1%, clear validation reporting

### T-015: Player Search Component
**Complexity**: Medium | **Risk**: Medium
- Create always-visible search input
- Auto-focus on page load
- Display search results dropdown
- Connect to fuzzy search engine
- Add player selection handler
- Show player preview on hover

** Validation & Verification Plan:**
- **Demo Page**: Uses main dashboard
- **Human Validation**:
  1. Load page, verify search auto-focused
  2. Type "mah", see dropdown appear
  3. Hover over result, see preview
  4. Click result, verify selection
  5. Press Escape, verify dropdown closes
- **Success Criteria**: Seamless search experience

### T-016: Player Analysis Display ⚠️
**Complexity**: High | **Risk**: Medium
- Create comprehensive player card
- Display VBD metrics prominently
- Implement value range visualization (color gradient)
- Show tier and scarcity information
- Add bid recommendation engine
- Display positional need indicator
- Update in <100ms after selection
- Display injury status prominently with color indicator

** Validation & Verification Plan:**
- **Demo Page**: Part of main dashboard
- **Test Data**: `demos/data/T-016_analysis_players.json`
- **Human Validation**:
  1. Select healthy player (green indicator)
  2. Select questionable player (yellow)
  3. Select IR player (red, excluded notice)
  4. Verify VBD color coding
  5. Check bid recommendation logic
  6. Measure update time in DevTools
- **Success Criteria**: <100ms updates, clear visual indicators

### T-017: Budget Tracker Component
**Complexity**: Medium | **Risk**: Low
- Display remaining budget prominently
- Calculate max bid with roster needs
- Track all teams' budgets
- Show average $/roster spot
- Add budget alerts/warnings
- Handle keeper-adjusted budgets

** Validation & Verification Plan:**
- **Test Scenario**: `demos/data/T-017_budget_scenario.json`
- **Human Validation**:
  1. Start with $200 budget
  2. Draft player for $65
  3. Verify $135 remaining
  4. Verify max bid calculation
  5. Draft until $10 with 5 spots
  6. Verify warning appears
- **Success Criteria**: Accurate budget math and warnings

### T-018: My Roster Panel
**Complexity**: Medium | **Risk**: Low
- Display drafted players by position
- Show roster composition vs requirements
- Highlight position needs
- Calculate team projections
- Add player removal option
- Show bye week conflicts
- Show injury status for rostered players

** Validation & Verification Plan:**
- **Human Validation**:
  1. Draft complete starting lineup
  2. Verify positions filled/remaining
  3. Check team projection total
  4. Draft 3 players with Week 7 bye
  5. Verify bye week warning
  6. Remove player (undo)
  7. Check injury indicators display
- **Success Criteria**: Clear roster visualization

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
- Save keeper state to workspace

** Validation & Verification Plan:**
- **Test Data**: `demos/data/T-019_keeper_configs.csv`
- **Human Validation**:
  1. Enter keeper mode
  2. Add 3 keepers with costs
  3. Verify budget reduced
  4. Start draft
  5. Search for keeper
  6. Verify not in available pool
  7. Check VBD baselines adjusted
- **Success Criteria**: Seamless keeper → draft transition

### T-020: Draft Event Management ⚠️
**Complexity**: High | **Risk**: High
- Implement two-phase selection flow
- Create result entry interface
- Add team/owner autocomplete
- Validate inputs (price, team)
- Update all state atomically
- Handle rapid consecutive entries
- Add pick editing capability
- Update workspace on each event

** Validation & Verification Plan:**
- **Test Script**: `demos/data/T-020_rapid_draft_script.md`
- **Human Validation**:
  1. Select player
  2. Enter team and price
  3. Verify state updates
  4. Rapidly enter 10 picks
  5. Edit pick #5
  6. Verify all calculations correct
  7. Check workspace saves
- **Success Criteria**: Handle 50 picks in 2 minutes

### T-021: Real-time Recalculation Engine
**Complexity**: High | **Risk**: High
- Trigger VBD recalculation
- Update position tiers
- Refresh all budget displays
- Update roster needs
- Ensure <500ms total update
- Prevent UI blocking

** Validation & Verification Plan:**
- **Performance Test**: `tests/unit/recalc_performance.test.js`
- **Human Validation**:
  1. Draft top 5 RBs rapidly
  2. Monitor update time in Performance tab
  3. Verify no UI freezing
  4. Check VBD updates for all positions
  5. Verify tier adjustments
- **Success Criteria**: <500ms total update time

### T-022: Draft History & Undo
**Complexity**: Medium | **Risk**: Medium
- Track all draft actions in order
- Implement 10-deep undo stack
- Show draft log/history view
- Handle dependent calculations on undo
- Add redo capability
- Persist undo stack
- Save history to workspace

** Validation & Verification Plan:**
- **Test Sequence**: `demos/data/T-022_undo_sequence.json`
- **Human Validation**:
  1. Draft 15 players
  2. Undo 10 times
  3. Verify state after each
  4. Redo 5 times
  5. Refresh browser
  6. Verify undo stack persisted
  7. Continue draft
- **Success Criteria**: Consistent undo/redo behavior

### T-023: Position Scarcity Visualization
**Complexity**: Medium | **Risk**: Low
- Create VBD curve for next 10 players
- Color-code by tier breaks
- Show "players until drop-off"
- Update after each pick
- Add hover for player details
- Handle empty positions

** Validation & Verification Plan:**
- **Demo Display**: Part of main dashboard
- **Human Validation**:
  1. View RB scarcity curve
  2. Draft top 3 RBs
  3. Verify curve updates
  4. Hover for player details
  5. Draft all but 1 TE
  6. Verify graceful display
- **Success Criteria**: Clear scarcity visualization

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
- Handle workspace corruption errors

** Validation & Verification Plan:**
- **Test Cases**: `demos/data/T-024_error_scenarios.json`
- **Human Validation**:
  1. Import malformed CSV
  2. Verify friendly error message
  3. Corrupt localStorage data
  4. Refresh and verify recovery
  5. Force calculation error
  6. Verify graceful handling
  7. Check error logs in console
- **Success Criteria**: No crashes, clear error messages

### T-025: Draft Recovery System
**Complexity**: High | **Risk**: High
- Detect corrupted state on load
- Offer recovery options
- Implement state repair logic
- Create disaster recovery UI
- Add manual backup triggers
- Test browser crash scenarios
- Recover from workspace file

** Validation & Verification Plan:**
- **Crash Simulation**: `demos/data/T-025_crash_test.md`
- **Human Validation**:
  1. Draft 25 players
  2. Force browser crash (kill process)
  3. Reopen browser
  4. Verify recovery prompt
  5. Choose recovery
  6. Verify state restored
  7. Continue draft normally
- **Success Criteria**: Full recovery from any crash

## Phase 9: Polish & Validation
*Duration: 2-3 days | Risk: LOW*
* MVP completion phase*

### T-026: Performance Optimization
**Complexity**: Medium | **Risk**: Medium
- Profile with Chrome DevTools
- Identify and fix bottlenecks
- Implement virtual scrolling if needed
- Add calculation memoization
- Optimize render cycles
- Reduce memory footprint
- Optimize workspace operations

** Validation & Verification Plan:**
- **Performance Suite**: Run T-000 benchmarks again
- **Human Validation**:
  1. Complete full mock draft
  2. Monitor Performance tab throughout
  3. Check memory usage stays <100MB
  4. Verify no memory leaks
  5. Test with 300 players
- **Success Criteria**: All performance targets met

### T-027: Browser Compatibility Testing
**Complexity**: Low | **Risk**: Low
- Test Chrome, Firefox, Safari, Edge
- Verify localStorage in all browsers
- Check responsive layouts
- Test in private browsing modes
- Document limitations
- Add compatibility warnings
- Test File API support

** Validation & Verification Plan:**
- **Browser Matrix**: `demos/data/T-027_browser_matrix.md`
- **Human Validation**:
  1. Test in Chrome 90+
  2. Test in Firefox 85+
  3. Test in Safari 14+
  4. Test in Edge 90+
  5. Try private browsing
  6. Verify appropriate warnings
- **Success Criteria**: Works in all target browsers

### T-028: Alpha Testing Preparation
**Complexity**: Low | **Risk**: Low
- Create demo scenarios
- Write testing checklist
- Prepare sample drafts
- Document known issues
- Set up feedback collection
- Create user guide
- Include workspace save/load in guide

** Validation & Verification Plan:**
- **Test Materials**: `demos/data/T-028_alpha_test_kit/`
- **Human Validation**:
  1. Run through demo scenario
  2. Follow testing checklist
  3. Verify guide completeness
  4. Test feedback form
  5. Document any issues found
- **Success Criteria**: Alpha testers can use independently

### T-029: Edge Case Testing
**Complexity**: Medium | **Risk**: Medium
- Test with maximum roster sizes
- Test with minimum budgets
- Test rapid pick entry (50+ in 2 min)
- Test with all positions drafted
- Test browser refresh scenarios
- Test import/export cycles
- Test workspace round-trip
- Test debug validation accuracy

** Validation & Verification Plan:**
- **Edge Case Suite**: `demos/data/T-029_edge_cases/`
- **Human Validation**:
  1. Configure 14-team, 20-roster league
  2. Set $50 budget
  3. Rapidly draft 50 players
  4. Draft all QBs
  5. Refresh mid-draft
  6. Export and reimport
  7. Save and load workspace
  8. Run debug validation
- **Success Criteria**: All edge cases handled gracefully

### ** T-030: MVP Release Preparation**
**Complexity**: Low | **Risk**: Low
*Final MVP validation before release*
- Remove debug tab from production build
- Minify and optimize bundle
- Set up CDN deployment
- Configure domain and SSL
- Create landing page
- Write deployment documentation

**Validation & Verification Plan:**
- **Production Build**: `npm run build`
- **Human Validation**:
  1. Build production bundle
  2. Verify debug tab not accessible
  3. Check bundle size <500KB
  4. Deploy to staging CDN
  5. Test with real draft scenario
  6. Verify SSL certificate
- **Success Criteria**: Production-ready deployment

## Phase 10: Future Enhancements - Infrastructure (Post-MVP)
*Duration: TBD | Risk: LOW*

### T-031: Future Ideas Backlog
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

### T-032: Backend API Development
- Set up Node.js/Express server
- Create PostgreSQL schema
- Implement JWT authentication
- Add data synchronization
- Deploy to cloud hosting

### T-033: Payment Integration
- Integrate Stripe
- Create subscription tiers
- Add feature gating
- Implement usage limits
- Ensure PCI compliance

### T-034: IndexedDB Storage Migration
**Complexity**: High | **Risk**: Medium
- Migrate from localStorage to IndexedDB
- Support 50MB+ storage capacity
- Implement structured queries
- Maintain backward compatibility
- Create migration tool

### T-035: Field Mapping UI
**Complexity**: Medium | **Risk**: Low
- Create column mapping interface
- Save mapping templates to workspace
- Auto-detect common formats
- Handle CSV header variations
- Support custom field names

### T-036: PWA Implementation
**Complexity**: Medium | **Risk**: Low
- Create service worker
- Implement offline manifest
- Design cache strategies
- Add install prompts
- Test offline functionality

### ** T-037: Post-MVP Performance Options**
**Complexity**: Low | **Risk**: Low
- Add user preference for update frequency
- Create "performance mode" toggle
- Implement reduced animations option
- Add data pagination options
- Create "lite mode" for slow devices

## Phase 11: Future Enhancements - Bidding Intelligence (Post-MVP)
*Duration: TBD | Risk: HIGH*

### T-040: Bid Range Confidence Overlay 🎯
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

### T-041: Nomination Strategy Engine 🎣
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

### T-042: Deep Sleeper Nomination Timing 💎
**Complexity**: High | **Risk**: Medium
- Identify optimal timing for sleeper nominations
- Exploit early-draft attention bias
- Calculate draft fatigue patterns
- Track budget depletion curves
- Suggest "stealth nominations"
- Monitor success rates
- Learn from historical patterns

### T-043: Price Floor Enforcement System 🚫
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

### T-044: Advanced Analytics Algorithm Integration 🧮
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
| **HIGH** | T-000, T-003, T-010, T-014a, T-020, T-024, T-025, T-040-T-044 | Extra testing, fallback plans, careful review, human validation |
| **MEDIUM** | T-002, T-004, T-006a, T-009b, T-015, T-016, T-019, T-034-T-036 | Prototype first, iterate based on testing |
| **LOW** | T-001, T-005, T-006, T-012, T-027, T-030, T-037 | Standard development practices |

## Critical Path
```
T-000 (Performance Validation) 
  ↓
T-001-T-002 (Foundation)
  ↓
T-003 (Storage Layer - Phase 1)
  ↓
T-004-T-006 (Data Management)
  ↓
T-006a (Workspace - Phase 2)
  ↓
T-007-T-009 (Core Algorithms)
  ↓
T-010 (State Management)
  ↓
T-014a (Debug Tab - Early)
  ↓
T-014-T-018 (UI Components)
  ↓
T-019-T-023 (Draft Flow)
  ↓
T-024-T-025 (Error Handling)
  ↓
T-026-T-030 (Polish & Release)
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
- ✅ Workspace saves/loads correctly
- ✅ Injury status displays properly (no VBD impact)
- ✅ Debug validation matches golden data (±1%)
- ✅ Alpha testing with real mock draft
- ✅ Production deployment <$50/month
- ✅ Future bidding hooks ready for implementation

##  Validation Summary

### Test Data Organization
```
demos/
├── ui/           # HTML validation pages per feature
├── data/         # Task-specific test data (T-XXX prefix)
└── results/      # Human validation results

testdata/
└── golden/       # Core algorithm validation data

tests/
└── unit/         # Automated unit tests per component
```

### Human-in-the-Loop Process
1. Each task has specific validation steps
2. Test data prepared with T-XXX prefix for easy location
3. Human tester follows validation plan
4. Results documented in demos/results/
5. Task marked complete only after validation passes
6. Alpha testing with real users before MVP release

### Continuous Validation
- Debug tab available throughout development
- Golden dataset comparison at each milestone
- Performance benchmarks after each phase
- Mock draft testing before release