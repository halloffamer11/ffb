# T-008 Tiers — Human Validation

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
Expected: tiers are present and include all players; threshold reported.

