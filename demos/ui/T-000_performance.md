# T-000 Performance Benchmark — Human Validation

Targets:
- Search < 50 ms
- VBD < 100 ms
- UI frame < 16 ms
- Workspace save < 100 ms

Steps:
1) Build and preview: `npm run build && npm run preview` (or use dev server)
2) Open the app and DevTools Console
3) Run: `PerformanceBenchmark.runAll()`
4) If UI shows pending, run: `PerformanceBenchmark.testUIUpdate().then(console.log)`
5) Append results with timestamp and device/browser to `demos/data/T-000_performance_results.md`

Pass criteria:
- All durations meet targets above
