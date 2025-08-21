# T-014a Debug Tab HITL Validation Guide

## Objective
Validate the Debug Tab implementation for comparing current calculations against golden dataset values and ensure MAE < 1% accuracy target.

## Prerequisites
1. Development server running (`npm run dev`)
2. Browser with developer console access

## Validation Steps

### Step 1: Initial Setup
1. Open http://localhost:5173/demos/ui/T-014a_debug.html
2. Verify the page loads with four sections:
   - Live Data Explorer (dev)
   - League Settings
   - Data Management
   - Golden Dataset Validation

### Step 2: Configure League Settings
1. In the **League Settings** section:
   - Set Teams: 12
   - Set Scoring: PPR
   - Configure roster (e.g., 1 QB, 2 RB, 3 WR, 1 TE, 1 FLEX)
   - Click "Save Settings"
   - Verify: Settings saved confirmation

### Step 3: Load Golden Dataset
1. In the **Golden Dataset Validation** section:
   - Select "Full Set (65 players)" from dropdown
   - Click "Load Golden Data"
   - **Expected**: Alert showing "Loaded golden dataset: 65 players"
   - **Verify**: Golden Players count shows "65"

### Step 4: Use Golden as Current
1. Click "Use Golden as Current" button
2. **Expected**: Alert "Workspace updated with 65 golden rows"
3. **Verify**: Current Players count shows "65"

### Step 5: Run Validation
1. Set Tolerance to 1.0%
2. Click "Run Validation"
3. **Expected Results**:
   - Dataset Status shows:
     - Current Players: 65
     - Golden Players: 65
     - Matched Players: 65
     - Missing Players: 0
   - Validation Metrics shows:
     - MAE Points: < 1.0
     - MAE VBD: < 1.0
     - MAPE Points: < 1.0%
     - MAPE VBD: < 5.0%
     - Within Tolerance: > 95%

### Step 6: Test Comparison Table
1. In Player Comparison section:
   - All players should show green checkmarks (✓)
   - Points and VBD deltas should be 0.0
2. Click "Errors Only" button
   - Table should be empty or show minimal errors
3. Click "Sort by Error" button
   - Any errors should appear at top
4. Click "Show All" to return to full view

### Step 7: Export Validation Report
1. Click "Export Report" button
2. **Expected**: Markdown file downloads
3. Open the downloaded file
4. **Verify**:
   - Report header shows current date
   - Summary metrics table is complete
   - Shows "✅ PASS" validation result
   - Contains detailed player comparison

### Step 8: Test with Modified Data
1. In Data Management section:
   - Import a different CSV or edit a player's points
   - Save to workspace
2. Return to Golden Dataset Validation
3. Run Validation again
4. **Expected**:
   - Some players show red X (✗)
   - MAE and MAPE values increase
   - Within Tolerance percentage decreases
5. Use filter buttons to view only errors

### Step 9: Test Tolerance Adjustment
1. Change Tolerance to 5.0%
2. Run Validation
3. **Expected**: More players pass (higher Within Tolerance %)
4. Change Tolerance to 0.5%
5. Run Validation
6. **Expected**: Fewer players pass (lower Within Tolerance %)

### Step 10: Live Data Explorer
1. In Live Data Explorer section:
   - Select "workspace::players" from dropdown
   - Click "Refresh"
   - **Verify**: Table shows current player data
   - Click "Export CSV"
   - **Verify**: CSV file downloads with player data

## Pass Criteria
✅ All golden players load successfully
✅ Validation runs without errors
✅ MAE Points < 1.0 when using golden as current
✅ MAE VBD < 1.0 when using golden as current
✅ Within Tolerance > 95% at 1% tolerance
✅ Export produces valid Markdown report
✅ Filter and sort buttons work correctly
✅ Tolerance adjustment affects results appropriately

## Known Issues
- None expected for this validation

## Evidence to Capture
1. Screenshot of Validation Metrics showing all green status indicators
2. Downloaded Markdown report showing PASS status
3. Screenshot of Player Comparison table with all checkmarks

## Troubleshooting
- If server not running: `npm run dev`
- If golden dataset fails to load: Check testdata/golden/ directory
- If validation shows all failures: Check league settings configuration
- Clear browser cache if UI doesn't update properly