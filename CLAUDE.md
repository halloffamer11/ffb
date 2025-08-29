# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FFB (Fantasy Football Bid) Draft Helper - A client-side web application for managing fantasy football auction drafts. Built with React and TypeScript, following USDAD methodology with **UNIFIED DATA ARCHITECTURE** as the cornerstone principle.

## 🔴 CRITICAL DATA COMMANDMENTS - VIOLATIONS WILL NOT BE TOLERATED

**THE PRIME DIRECTIVE: UNIFIED DATA ARCHITECTURE**

### 🔥 THE TEN COMMANDMENTS OF DATA MANAGEMENT

1. **THOU SHALT USE ONLY THE UNIFIED STORE**
   - Location: `src/stores/unified-store.ts`  
   - Hook: `useUnifiedStore()`
   - Namespace: `workspace::`
   - **NO OTHER STORES SHALL EXIST**

2. **THOU SHALT NOT CREATE SEPARATE STATE SYSTEMS**
   - No React Context for shared data
   - No useState for application data  
   - No direct localStorage access
   - **ALL DATA FLOWS THROUGH UNIFIED STORE**

3. **THOU SHALT NOT SYNC BETWEEN STORES**
   - There is **ONE** store and **ONE** store only
   - If you find yourself syncing, **STOP IMMEDIATELY**
   - Report legacy code for immediate removal

4. **THOU SHALT NOT USE LEGACY PATTERNS**
   - `src/stores/draftStore.ts` is for **COMPATIBILITY ONLY**
   - Do not extend or modify legacy wrappers
   - **NEW CODE MUST USE `useUnifiedStore()`**

5. **THOU SHALT VALIDATE ALL DATA**
   - Use TypeScript interfaces from `src/types/data-contracts.ts`
   - Validate data with `src/utils/state-validation.ts`
   - **NO UNTYPED DATA SHALL PASS**

6. **THOU SHALT MAINTAIN SINGLE SOURCE OF TRUTH**
   - Data exists in **ONE PLACE ONLY**
   - UI state and application data are clearly separated
   - **NO DUPLICATE DATA STORAGE**

7. **THOU SHALT USE PROPER ERROR HANDLING**
   - All storage operations must handle failures
   - Corruption detection is **MANDATORY**
   - **DATA INTEGRITY IS SACRED**

8. **THOU SHALT FOLLOW THE UNIFIED NAMESPACE**
   - All data uses `workspace::` namespace
   - No fragmentation across namespaces
   - **CONSISTENCY IS LAW**

9. **THOU SHALT MONITOR DATA FLOW**
   - Use developer tools to inspect state
   - Performance monitoring is **REQUIRED**
   - **VISIBILITY INTO ALL DATA OPERATIONS**

10. **THOU SHALT DOCUMENT ALL DATA CHANGES**
    - Update data contracts when modifying structure
    - Add validation for new data types
    - **NO UNDOCUMENTED DATA MUTATIONS**

### 🚨 ENFORCEMENT

**Violations of these commandments will result in:**
- Immediate code review rejection
- Mandatory refactoring to unified store
- **ZERO TOLERANCE for dual store patterns**

### 🎯 MIGRATION CHECKLIST

**Before touching any data-related code:**
- [ ] Am I using `useUnifiedStore()`?
- [ ] Is my data properly typed?
- [ ] Am I avoiding direct localStorage access?
- [ ] Have I checked for legacy patterns?
- [ ] Is error handling in place?

**Remember: There is only ONE store. There is only ONE way.**

---

## MANDATORY: HITL Validation Protocol

**EVERY TASK SHALL AND MUST conduct a Human-In-The-Loop (HITL) validation event.**

This is NOT optional. Claude SHALL:

### 1. CREATE a Human-Readable Validation Target
- **MUST** create an HTML page in `demos/ui/T-XXX_validation.html` 
- Page **MUST** be accessible via dev server (`npm run dev`)
- Page **MUST** demonstrate the implemented feature interactively
- Page **MUST** include test controls and sample data if needed

### 2. PROVIDE Validation Instructions  
- **MUST** include step-by-step validation procedures
- **MUST** specify expected outcomes for each action
- **MUST** define clear, measurable pass/fail criteria
- **MUST** include setup instructions (dev server, test data, etc.)

### 3. PROVIDE Implementation Summary
- **MUST** briefly describe what code was added/modified
- **MUST** explain the feature's purpose and functionality  
- **MUST** list key files that were changed
- **MUST** note any dependencies or integration points

### 4. PAUSE and WAIT for User Confirmation
Claude **SHALL NOT**:
- Mark task as CPT (complete) in `pcl/tasks.md`
- Update HITL status to PASS
- Make commits beyond the implementation
- Merge branches  
- Continue to next task

Until user explicitly confirms: **"HITL validation passed"**

### Required Validation Template

Every task validation MUST follow this format:

```markdown
## HITL Validation Required for T-XXX: [Task Name]

### Implementation Summary
- **Purpose**: [Brief description of what this feature does]
- **Code Added**: [Key files and components created/modified]
- **Integration**: [How this connects to existing system]

### Validation Instructions
1. **Setup**: 
   - Start dev server: `npm run dev`
   - Load test data: [if applicable]
   
2. **Access**: Open http://localhost:XXXX/demos/ui/T-XXX_validation.html

3. **Test Steps**:
   - Step 1: [specific action] → Expected: [specific outcome]
   - Step 2: [specific action] → Expected: [specific outcome]
   - Step N: [specific action] → Expected: [specific outcome]

4. **Pass Criteria**: 
   - [Measurable criterion 1]
   - [Measurable criterion 2]
   - [Overall success condition]

### Files Changed
- [List of modified/created files with brief description]

**Please confirm validation results before I proceed.**
```

### Enforcement Rules
1. **NO EXCEPTIONS**: Every task, no matter how small, requires HITL validation
2. **NO SHORTCUTS**: Tasks cannot be marked complete without validation page
3. **NO ASSUMPTIONS**: User must explicitly confirm validation passed
4. **NO PROCEEDING**: Next task cannot begin until current validation confirmed

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
2. **Implementation**: Code the feature following architecture patterns
3. **MANDATORY HITL Validation**: Create validation page and instructions - **NO EXCEPTIONS**
4. **User Confirmation**: Wait for explicit "HITL validation passed" before proceeding
5. **Task Completion**: Mark as CPT in `pcl/tasks.md` only after validation confirmed
6. **Unit Tests**: Minimal Node-based tests in `tests/unit/` (where applicable)
7. **Execution Ledger**: Track decisions in `pcl/context.md`

**Critical**: Steps 3-5 are mandatory checkpoints. No task can bypass HITL validation.

### Performance Targets
- Search operations: <50ms for 300 players
- VBD calculations: <100ms for full recalc
- UI updates: <100ms response time
- Bundle size: <200KB minified

### Testing Approach
- **MANDATORY HITL validation**: Every task requires validation page (`demos/ui/T-*.html`) - NO EXCEPTIONS
- Unit tests run directly with Node (no test framework) where applicable
- Performance benchmarks via `tests/unit/performance.test.js`
- Browser compatibility matrix in `demos/data/T-027_browser_matrix.md`
- **All features must be human-validated before task completion**

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