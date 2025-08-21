# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FFB (Fantasy Football Bid) Draft Helper - A client-side web application for managing fantasy football auction drafts. Built using vanilla JavaScript with no framework dependencies, following USDAD (Unified Software Development and Delivery) methodology with three-layer context architecture.

## IMPORTANT: HITL Validation Protocol

**When completing tasks that require Human-In-The-Loop (HITL) validation:**

1. **PAUSE before marking task complete** - After implementing a feature, STOP and provide the user with:
   - The validation page URL (e.g., `demos/ui/T-XXX_validation.html`)
   - Step-by-step validation instructions
   - Expected outcomes for each step
   - Pass/fail criteria

2. **Wait for user confirmation** - Do not:
   - Mark task as CPT (complete) in tasks.md
   - Update HITL status to PASS
   - Merge branches
   - Continue to next task
   
   Until the user explicitly confirms: "HITL validation passed" or provides feedback

3. **Example validation pause format:**
   ```
   ## HITL Validation Required for T-XXX
   
   Please validate the implementation:
   
   1. Start dev server: `npm run dev`
   2. Open: http://localhost:5173/demos/ui/T-XXX_validation.html
   3. Perform these steps:
      - Step 1: [action] → Expected: [outcome]
      - Step 2: [action] → Expected: [outcome]
   4. Pass criteria: [specific measurable criteria]
   
   Please confirm validation results before I proceed.
   ```

## Essential Commands

### Development
```bash
npm install           # Install dependencies (Vite dev server)
npm run dev          # Start dev server on http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
# Run individual test files directly with Node
node tests/unit/[testfile].test.js

# Common test files:
node tests/unit/performance.test.js    # Performance benchmarks
node tests/unit/state.test.js          # State management tests
node tests/unit/vbd.test.js            # VBD calculation tests
node tests/unit/search_fuzzy.test.js   # Fuzzy search tests
```

## Architecture Overview

### Directory Structure
- **`.gsl/`** - Global Steering Layer (high-level rules and guidelines)
- **`pcl/`** - Project Context Layer (requirements, design, tasks, execution ledger)
- **`src/`** - Application code following pure core/impure edges pattern:
  - `core/` - Pure business logic (VBD, scoring, tiers, search algorithms)
  - `adapters/` - Storage and data adapters (localStorage, CSV import, backups)
  - `ui/` - UI components and interactions
  - `app/` - Application bootstrap and utilities
  - `state/` - Central state management with event bus

### Core Design Principles
1. **Pure Client-Side**: No server dependencies, all processing in browser
2. **localStorage Persistence**: All data stored locally with <5MB footprint
3. **Workspace Model**: `.ffdraft` files for complete state export/import
4. **Event-Driven Architecture**: Pub/sub pattern for component communication
5. **Automatic Backups**: Rolling backups (max 3) on every state change

### Key Components

**State Management (`src/state/store.js`)**
- Single source of truth with event bus
- 10-level undo/redo support
- Action logging and workspace sync
- Non-blocking persistence to localStorage

**Data Schema (`src/core/schema.js`)**
- Compact player representation (<100 bytes/player)
- Injury status enum
- Workspace format in `contracts/schemas/workspace.schema.json`

**Search System (`src/core/search.js`)**
- BasicSearch: Case-insensitive partial matching
- FuzzySearch: Levenshtein distance with initials support
- Performance target: <50ms for 300 players

**VBD Engine (`src/core/vbd.js`)**
- Value-based drafting calculations
- Position-specific baselines
- Real-time recalculation on draft events

**Storage Adapter (`src/adapters/storage.js`)**
- localStorage wrapper with quota handling
- Namespace isolation (`workspace::` prefix)
- Export/import with validation
- Rolling backup system

### Development Workflow

1. **Task Tracking**: Tasks defined in `pcl/tasks.md` with acceptance criteria
2. **Human Validation**: Demo pages in `demos/ui/` for HITL (Human-In-The-Loop) testing
3. **Unit Tests**: Minimal Node-based tests in `tests/unit/`
4. **Execution Ledger**: Track decisions in `pcl/context.md`

### Performance Targets
- Search operations: <50ms for 300 players
- VBD calculations: <100ms for full recalc
- UI updates: <100ms response time
- Bundle size: <200KB minified

### Testing Approach
- Unit tests run directly with Node (no test framework)
- HITL validation using demo pages (`demos/ui/T-*.html`)
- Performance benchmarks via `tests/unit/performance.test.js`
- Browser compatibility matrix in `demos/data/T-027_browser_matrix.md`

### Data Management
- CSV import with BOM/CRLF handling
- Golden datasets in `testdata/golden/`
- Sample data in `demos/data/`
- Workspace files use `.ffdraft` extension

### UI Components
All UI follows vanilla JavaScript patterns with Tailwind CSS:
- Dashboard with draggable widgets
- Search with fuzzy matching and keyboard navigation
- Draft entry and ledger with undo/redo
- Budget tracker and roster management
- Position scarcity visualization