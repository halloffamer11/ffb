# T-029 Edge Case Scenarios

Use these scenarios to validate edge behaviors manually:

1) 14-team, 20-roster league
- Configure in Settings: QB2/RB3/WR4/TE2/FLEX2/K1/DST1/BENCH8 (rounds auto)
- Verify search and roster views responsive

2) Minimum budget stress
- Set budget to $50
- Draft players until remaining $10 with 5 spots
- Verify budget warnings in T-017 Budget page

3) Rapid picks (50 in 2 min)
- Use a script in DevTools to append 50 picks to workspace state
- Ensure no UI freezes in dashboard/search pages

4) Full position drafted
- Draft all QBs but one
- Verify scarcity visualization handles gracefully (placeholder until integrated)

5) Refresh mid-draft
- After 25 picks, refresh browser and confirm state persists via storage/backup

6) Import/export cycle
- Import dataset in Data Management, export, then re-import and compare counts

7) Workspace round-trip
- Save workspace, reload page, load workspace file

8) Debug validation
- Open T-014a_debug.html, load golden set, check MAE < 1%


