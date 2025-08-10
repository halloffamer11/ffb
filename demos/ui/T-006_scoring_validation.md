# T-006 Scoring — Human Validation

What this tests:
- PPR, Half-PPR, and Standard presets
- Pure points calculation across passing, rushing, receiving, INTs, fumbles
- No injury-based adjustments (display-only per requirements)
- Custom overrides supported (not exercised here)

Steps (browser console):
```js
(async () => {
  const { calculatePoints, autoConfigure } = await import('/src/core/scoring.js');
  const stats = { pass_yds: 300, pass_tds: 2, pass_int: 1, rush_yds: 40, rush_tds: 1, rec: 5, rec_yds: 60, rec_tds: 0, fumbles: 1 };
  const ppr = calculatePoints(stats, autoConfigure('PPR'));
  const half = calculatePoints(stats, autoConfigure('HALF'));
  const std = calculatePoints(stats, autoConfigure('STD'));
  console.log({ ppr, half, std, orderOK: ppr > half && half > std });
})();
```
Expected:
- ppr ≈ 37.0, half ≈ 34.5, std ≈ 32.0
- orderOK === true

