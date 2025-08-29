# Draft 2 Requirements - Fantasy Football Auction Draft Helper
*Enhanced with edge cases, error conditions, technical constraints, plus workspace model and injury tracking*
* USDAD Architect final review completed with validation plans*

## Product Vision
A fast, frictionless web-based auction draft assistant that provides real-time value-based drafting (VBD) analysis, position scarcity insights, and instant player search capabilities to help users make optimal decisions during time-pressured fantasy football auctions.

##  Deployment Requirements
- **Target Scale**: 1000 user accounts maximum
- **Concurrent Usage**: 10-20% active users (100-200 concurrent drafts)
- **Revenue Model**: $5/account target pricing
- **Infrastructure**: Must support deployment costs under $5000/year to maintain viability
- **Architecture Decision**: Client-heavy processing to minimize server costs

## Core User Stories with Edge Cases

### US-001: League Configuration
**As a** fantasy player  
**I want to** configure my league settings before the draft  
**So that** all calculations match my specific league rules

**Acceptance Criteria:**
- Can set roster requirements (QB, RB, WR, TE, FLEX, K, DST, bench spots)
- Can configure scoring system (PPR, half-PPR, standard, custom)
- Can set auction budget (default $200, range $50-$1000)
- Can define number of teams (8-14 teams)
- Can specify keeper players as pre-draft selections
- Settings persist across browser sessions
- Support for 2QB and Superflex leagues
- Auto-configure common scoring formats
- Settings saved as part of workspace file

**Edge Cases:**
- Invalid roster configurations (e.g., 0 starters)
- Budget not divisible evenly among players
- Keeper costs exceeding team budget
- Conflicting FLEX rules
- Browser localStorage disabled
- Settings corruption recovery

**Error Conditions:**
- Must validate total roster size vs player pool
- Must ensure minimum budget per roster spot
- Must handle localStorage quota exceeded
- Must provide settings export/import fallback

** Validation Plan:**
- **Unit Tests**: Validate all roster configurations and budget calculations
- **Human Validation**: Load T-001_league_settings.csv test data, verify all presets work
- **Demo Page**: demos/ui/T-001_settings.html with all configuration options

### US-002: Data Management with Validation
**As a** fantasy player  
**I want to** import and manage player projection data  
**So that** I have accurate, up-to-date information for draft decisions

**Acceptance Criteria:**
- Can import player data from CSV files
- Can manually edit player projections and values
- System validates data completeness and format
- Can undo last 10 data operations
- System maintains player master list (~300 players)
- Automatic backup after each state change
- Manual backup option available
- Track and display injury status (Healthy/Q/D/O/IR/PUP/NA)
- Color-coded injury indicators (Green/Yellow/Red/Gray)
- **** Injury status is display-only, does not affect VBD calculations
- **** IR players (season-ending) show as injured but remain in player pool

**Edge Cases:**
- Corrupt CSV files
- Missing required columns
- Duplicate player entries
- Malformed data values
- File size exceeding browser limits
- Character encoding issues
- Missing or invalid injury status values

**Error Conditions:**
- Must handle non-UTF8 encodings gracefully
- Must report specific column/row errors
- Must prevent data loss on import failure
- Must validate numeric fields are numbers
- Must handle empty/null values appropriately
- Must normalize injury status to valid enum values

** Validation Plan:**
- **Test Files**: demos/data/T-002_corrupt.csv, T-002_utf8.csv, T-002_missing_cols.csv
- **Human Validation**: Import each test file, verify error messages are clear
- **Demo Page**: Display imported data in debug tab for verification

### US-003: Lightning-Fast Player Search with Fuzzy Matching
**As a** fantasy player during live auction  
**I want to** instantly find any player being nominated  
**So that** I don't miss bidding opportunities

**Acceptance Criteria:**
- Fuzzy search handles misspellings (Levenshtein distance)
- Sub-second search results even with 300 players
- Shows player name, team, position, ADP in results
- Single-click to select and analyze player
- Search works across player name variations
- Results show drafted players as greyed out
- Keyboard navigation supported
- Display injury status in search results
- **** Test case: "C.J. Fiedorowicz" should match "CJ" or "Fiedorowitch"

**Edge Cases:**
- Multiple players with same name
- Defense/Special Teams naming variations
- Hyphenated and apostrophe names
- Single letter searches
- Empty search results
- Search during rapid updates

**Error Conditions:**
- Must handle special characters safely
- Must not crash on malformed regex
- Must handle search index corruption
- Must degrade gracefully if fuzzy match fails

** Validation Plan:**
- **Test Dataset**: demos/data/T-003_search_tests.csv with known misspellings
- **Human Test**: Search for "CJ", "Fiedorowitch", "Macaffrey" (McCaffrey)
- **Performance**: Verify <100ms response with 300 players loaded

### US-004: Instant VBD Analysis with Clear Algorithm
**As a** fantasy player evaluating a nominated player  
**I want to** immediately see value-based drafting metrics  
**So that** I can make informed bidding decisions

**Acceptance Criteria:**
- Calculate points above replacement (PAR) for position
- Players on IR or confirmed season-ending injury are excluded from VBD players pool
- Show global VBD across all positions
- Display color-coded value range (green=steal, yellow=fair, red=overpay)
- Update calculations as players are drafted
- Show recommended bid range based on remaining budget
- Use baseline replacement calculation: rank = teams × starters per position
- **** Display injury status as informational flag only

**Edge Cases:**
- All players at position drafted
- Negative VBD values
- FLEX position calculations
- Custom scoring edge cases
- Calculation produces NaN/Infinity
- Ties in player projections

**Error Conditions:**
- Must handle division by zero
- Must validate calculation results
- Must handle missing projection data
- Must update if baseline player gets drafted

** Validation Plan:**
- **Golden Dataset**: testdata/golden/T-004_vbd_expected.csv with pre-calculated values
- **Tolerance**: ±1% for VBD values to account for rounding
- **Human Test**: Draft 10 players, verify VBD updates correctly

### US-005: Position Scarcity Tracking with Tier Visualization
**As a** fantasy player  
**I want to** understand position scarcity at any moment  
**So that** I know when to prioritize certain positions

**Acceptance Criteria:**
- Show VBD curve for next 10 available players per position
- Color-code tiers based on VBD delta thresholds
- Display "players until tier drop" metrics
- Highlight positions with unfilled roster spots
- Update in real-time as players are drafted
- Visual representation of tier breakpoints

**Edge Cases:**
- Fewer than 10 players remaining
- Single player tiers
- Position completely drafted out
- Tier recalculation mid-draft
- Custom tier thresholds

**Error Conditions:**
- Must handle empty position pools
- Must validate tier calculations
- Must prevent UI freezing during updates

** Validation Plan:**
- **Test Scenario**: demos/data/T-005_scarcity_test.csv with 50% players drafted
- **Human Validation**: Verify tier colors match VBD gaps
- **Edge Test**: Draft all QBs except 1, verify display handles gracefully

### US-006: Draft Event Logging with Recovery
**As a** fantasy player  
**I want to** quickly log each draft result  
**So that** the tool stays synchronized with the actual draft

**Acceptance Criteria:**
- Two-step process: select player → enter result
- Auto-complete for team names and owner names
- Enter winning bid amount
- Update all calculations within 1 second
- Maintain draft history with undo capability (last 10 actions)
- Can edit any historical pick independently
- Automatic save after each action
- Save draft state to workspace file
- **** Auto-save is non-blocking, happens after calculation completion

**Edge Cases:**
- Wrong player selected initially
- Need to correct historical picks
- Rapid consecutive nominations
- Browser refresh mid-draft
- Undo with dependent calculations

**Error Conditions:**
- Must validate price is positive number
- Must ensure player not already drafted
- Must handle state corruption gracefully
- Must provide draft recovery mechanism

** Validation Plan:**
- **Rapid Entry Test**: Script for entering 50 picks in 2 minutes
- **Recovery Test**: Refresh browser at pick #25, verify recovery
- **Human Test**: Use in actual mock draft with friends as alpha testers

### US-007: Budget Management with Constraints
**As a** fantasy player  
**I want to** track my remaining budget and roster needs  
**So that** I can allocate funds strategically

**Acceptance Criteria:**
- Display remaining budget prominently
- Show max bid considering roster spots to fill
- Track budget for all teams in league
- Calculate average cost per remaining roster spot
- Alert when budget constraints affect strategy
- Account for keeper costs affecting budgets

**Edge Cases:**
- Minimum $1 bid requirements
- Budget exactly equals remaining needs
- Keeper costs creating uneven budgets
- Max bid calculations with FLEX positions

**Error Conditions:**
- Must prevent negative budgets
- Must validate budget calculations
- Must handle budget overflow

** Validation Plan:**
- **Test Cases**: demos/data/T-007_budget_edge_cases.csv
- **Human Test**: Draft until $10 remaining with 5 spots, verify max bid logic
- **Demo Display**: Show all team budgets in debug tab

### US-008: Draft Dashboard with Performance Targets
**As a** fantasy player  
**I want to** see all critical information on one screen  
**So that** I can make quick decisions without switching views

**Acceptance Criteria:**
- Main area: current player analysis
- Sidebar: roster, budget, needs
- Top section: position tiers  
- All updates < 500ms
- Minimal clicks for any action
- No UI freezing during calculations
- Fourth tab for Debug/Validation view
- **** Debug tab disabled in production build but same codebase

**Performance Requirements:**
- Initial page load < 2 seconds
- Search results < 100ms
- VBD recalculation < 500ms
- UI updates non-blocking

**Edge Cases:**
- Slow devices/browsers
- Large roster configurations
- Many concurrent updates
- Window resize during draft

** Validation Plan:**
- **Performance Test**: demos/data/T-008_performance_300_players.csv
- **Human Test**: Verify all info visible without scrolling on 1080p screen
- **Debug Tab**: Verify developer features work but can be disabled

### US-009: Offline Capability with Sync
**As a** fantasy player  
**I want to** use core features without internet  
**So that** I'm not dependent on connectivity

**Acceptance Criteria:**
- Store player data in browser localStorage (<5MB)
- VBD calculations work offline
- Draft progress saves locally
- Clear indication of online/offline status
- Data export/import for recovery
- Workspace file for complete state backup
- **** Refuse to run if localStorage unavailable

**Edge Cases:**
- localStorage disabled/full
- Private browsing mode
- Data corruption
- Sync conflicts
- Storage quota exceeded

**Error Conditions:**
- Must detect localStorage availability
- Must handle quota exceeded gracefully
- Must provide manual export option
- Must validate imported data

** Validation Plan:**
- **Test Mode**: Disable network, verify full functionality
- **Storage Test**: Fill localStorage to 4.5MB, verify warnings
- **Human Test**: Export and reimport workspace, verify identical state

### US-010: Pre-Draft Preparation with Keepers
**As a** fantasy player  
**I want to** set up keepers and target players  
**So that** I can execute my plan efficiently

**Acceptance Criteria:**
- Enter keepers using same draft interface
- "Start Draft" button separates keeper entry from live draft
- Star/flag players as targets
- Add notes to specific players
- Keeper costs affect team budgets
- Keepers reduce available player pool

**Edge Cases:**
- Keeper costs exceeding budget
- Duplicate keeper selections
- Keepers affecting VBD baselines
- Late keeper changes

** Validation Plan:**
- **Test Data**: demos/data/T-010_keeper_configs.csv
- **Human Test**: Enter 5 keepers, start draft, verify budget adjustments
- **Edge Test**: Try to add keeper exceeding budget, verify error

### US-011: Workspace Management
**As a** fantasy player  
**I want to** save and load my complete draft setup as a single file  
**So that** I can easily manage multiple leagues and recover from issues

**Acceptance Criteria:**
- Save complete workspace as .ffdraft file
- Workspace includes all settings, data, and draft state
- Load workspace restores complete application state
- Auto-save workspace on every change
- Version tracking in workspace file
- Integrity checking on load
- **** Workspace implementation in Phase 2, localStorage in Phase 1
- **** Use SHA-256 checksum for integrity validation

**Edge Cases:**
- Corrupted workspace files
- Version mismatch between saves
- Large workspace files (>5MB)
- Browser file API limitations

**Error Conditions:**
- Must validate workspace integrity
- Must handle version migrations
- Must provide recovery from corruption
- Must report specific load errors

** Validation Plan:**
- **Test Files**: demos/data/T-011_workspace_valid.ffdraft, T-011_workspace_corrupt.ffdraft
- **Version Test**: Load v1.0 file in v1.1 app, verify migration
- **Human Test**: Complete 25 picks, save, reload, continue draft

### US-012: Debug Validation Tab
**As a** fantasy player  
**I want to** validate my calculations against golden datasets  
**So that** I can trust the tool's accuracy

**Acceptance Criteria:**
- Load golden dataset for comparison
- Display per-player differences (ProjPts, VBD)
- Calculate Mean Absolute Error (MAE)
- Show percentage within tolerance
- Highlight missing or mismatched fields
- Export validation report
- **** Debug tab is core MVP feature for validation
- **** Export as Markdown primary, HTML secondary
- **** Not included in production build

**Edge Cases:**
- Golden dataset format mismatch
- Missing players in comparison
- Different scoring systems

**Error Conditions:**
- Must handle golden dataset load failures
- Must validate golden data format
- Must report comparison errors clearly

** Validation Plan:**
- **Golden Data**: testdata/golden/draft_scenarios/ with known outcomes
- **Human Test**: Load golden data, verify MAE < 1%
- **Report Test**: Export validation report, verify readability

## Future User Stories

### US-020: Bid Range Confidence Overlay
**As a** fantasy player  
**I want to** see confidence intervals for player values  
**So that** I can bid with statistical confidence

### US-021: Nomination Strategy Engine
**As a** fantasy player  
**I want to** receive strategic nomination suggestions  
**So that** I can manipulate the draft flow

### US-022: Deep Sleeper Nomination Timing
**As a** fantasy player  
**I want to** know when to nominate sleepers  
**So that** I can exploit attention gaps

### US-023: Price Floor Enforcement
**As a** fantasy player  
**I want to** prevent opponents from getting steals  
**So that** I maintain competitive balance

### US-024: Advanced Analytics Integration
**As a** fantasy player  
**I want to** leverage advanced algorithms  
**So that** I can optimize my draft strategy
**Note:** Requires research paper for implementation

### US-025: LLM Strategy Assistant
**As a** fantasy player  
**I want to** receive AI-powered strategy suggestions  
**So that** I can adapt to draft flow and opponent tendencies

### US-026: Opponent Analysis  
**As a** fantasy player  
**I want to** analyze historical opponent behavior  
**So that** I can predict and exploit their patterns

### US-027: Mobile Optimization
**As a** fantasy player  
**I want to** use the tool on my phone  
**So that** I can draft from anywhere

### US-028: User Accounts & Persistence
**As a** returning user  
**I want to** save my settings and history  
**So that** I can track performance over multiple seasons

### US-029: Monetization
**As a** user  
**I want to** pay a small fee ($5) for premium features  
**So that** I can access advanced analytics and remove limitations

## Non-Functional Requirements

### Performance Benchmarks
- Page load < 2 seconds with 300 players
- Search results < 100ms at all draft stages
- VBD calculation < 500ms for full recalc
- No UI freezing or jank
- Memory usage < 100MB
- **** All calculations client-side to minimize server costs

### Data Constraints
- Support 300+ players
- localStorage usage < 5MB total
- Export file size < 1MB
- Auto-backup frequency: every state change
- Workspace file size < 5MB
- **** Golden datasets not included in production bundle

### Reliability
- Zero data loss during draft
- Automatic recovery from browser crash
- Export/import for disaster recovery
- Graceful degradation for errors
- 10-level undo minimum
- Workspace integrity validation
- **** Environment validation on startup

### Browser Support
- Chrome 90+, Firefox 85+, Safari 14+, Edge 90+
- localStorage required
- JavaScript ES6+ support
- No IE11 support
- **** Refuse to run if environment check fails

### Testing Requirements
- Golden dataset validation
- Performance benchmarks documented
- Edge case test coverage
- Manual test checklist for draft flow
- Alpha testing with real users
- Debug tab for continuous validation
- **** Task-numbered test data organization (T-XXX prefix)