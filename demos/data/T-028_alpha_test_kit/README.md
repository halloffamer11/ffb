# T-028 Alpha Test Kit

This folder contains the materials to run an alpha validation of the dashboard. HITL approval required.

Checklist
- Dashboard loads without console errors
- Search & Select works and focuses input
- Draft Entry: add 5 picks rapidly
- Ledger shows history, Undo/Redo buttons reflect availability
- Budget panel updates remaining and max bid per pick
- Roster panel reflects drafted players; bye conflicts visible when applicable
- Scarcity/Tiers update after picks
- Debug logs visible (optional): window.localStorage under `workspace::logs`

How to run
1) Open `demos/ui/T-014_dashboard.html`
2) Import `demos/data/top300_2024.csv` via Data tab if players are empty
3) Configure settings (e.g., 12 teams, $200 budget, min bid 1)
4) In Dashboard tab, draft 5 players using Draft Entry
5) Use Undo twice, Redo once
6) Observe recalculation indicators (budget, tiers)
7) Test Export Workspace button (top of page) - should download .ffdraft file
8) Test Import Workspace button - should be able to reload the exported file

Expected outcomes
- Draft history shows latest on top with round/pick
- Undo removes most recent picks; Redo restores them
- Budget remaining decreases; max bid respects min-bid math
- Roster groups by position; conflicts show when 2+ same bye week
- No UI freezes (<500ms updates)

HITL status: PENDING (do not mark complete until maintainer approval)

## Known Issues (Alpha Testing Findings)

### State Synchronization Bug
- **Issue**: Settings changes (team names, owners) don't immediately update in Dashboard tab
- **Impact**: Draft Entry team dropdown shows old values until page refresh
- **Workaround**: Refresh page after changing settings
- **Severity**: Minor - functionality works but requires refresh for UI sync
- **Location**: Settings → Dashboard communication
- **Status**: Identified during alpha testing, needs investigation


