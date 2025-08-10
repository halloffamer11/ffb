# T-007 VBD — Human Validation

Steps (browser console):
```js
(async () => {
  const vbd = await import('/src/core/vbd.js');
  const players = [
    { name:'A', position:'RB', points: 250 },
    { name:'B', position:'RB', points: 230 },
    { name:'C', position:'RB', points: 210 }
  ];
  const settings = { teams: 12, starters: { RB: 2 } };
  const base = vbd.baselineForPosition(players, 'RB', settings);
  const withVbd = vbd.calculatePlayerVBD(players, settings);
  console.log({ base, vbdA: withVbd[0].vbd });
})();
```
Expected: base equals 210; vbdA equals 40.

