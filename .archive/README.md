# Archive Directory

This directory contains archived files from the FFB Fantasy Football Draft Helper project.

## Contents

### `legacy-ui/`

Contains the original vanilla JavaScript UI components that were replaced during the React migration (Phase 3 completion). These files are preserved for reference and to understand the evolution of the codebase.

**Original UI Components:**
- `analysis.js` - Player analysis UI components
- `budget.js` - Budget tracking UI 
- `dashboard.js` - Main dashboard layout and widgets
- `dataManagement.js` - Data import/export UI
- `draft.js` - Draft entry and management UI
- `draftEnhanced.js` - Enhanced draft features
- `draftUtils.js` - Draft utility functions and helpers
- `keeper.js` - Keeper selection UI
- `ledger.js` - Draft ledger and history display
- `recalc.js` - Recalculation UI components
- `recovery.js` - Data recovery and backup UI
- `roster.js` - Roster management UI
- `searchComponent.js` - Player search component (replaced by PlayerSearchWidget.tsx)
- `settings.js` - Settings and configuration UI
- `storeBridge.js` - Bridge between vanilla JS and store state
- `toast.js` - Toast notification system
- `vbdScatter.js` - VBD scatter plot visualization (replaced by VBDScatterWidget.tsx)

**Migration Date:** August 2025

**Replacement Architecture:** 
These vanilla JavaScript components were replaced with React components following a hybrid island architecture pattern. The new components use TypeScript, styled-components, and modern React patterns while maintaining backward compatibility through the state bridge system.

**Access:** 
These files should NOT be imported or used in the active codebase. They are maintained purely for historical reference and to understand migration decisions.