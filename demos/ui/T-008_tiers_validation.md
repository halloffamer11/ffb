# T-008 Tiers — Human Validation

What this tests:
- Tier breaks based on VBD deltas
- Threshold = stdDev(VBD) × 0.5
- New tier starts when delta > threshold
- Returns computed threshold and tier arrays (all players included)

Steps (browser console):
```js
(async () => {
  const t = await import('/src/core/tiers.js');
  const playersRB = [
    { name:'A', position:'RB', vbd: 50 },
    { name:'B', position:'RB', vbd: 48 },
    { name:'C', position:'RB', vbd: 35 },
    { name:'D', position:'RB', vbd: 34 },
    { name:'E', position:'RB', vbd: 10 }
  ];
  const map = new Map([['RB', playersRB]]);
  const res = t.computeTiers(map);
  console.log(res.get('RB'));
})();
```
Expected:
- threshold ≈ 7.14
- tiers: [50,48], [35,34], [10] (breaks at deltas 13 and 24)

