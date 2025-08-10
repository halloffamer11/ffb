# T-002 Data Schema — Human Validation

Goal: Validate compact player size and injury enum mapping.

Steps:
1) Start dev server: `npm run dev` (Vite at http://localhost:5173) and open DevTools Console.
2) Paste the following into the console:
```js
(async () => {
  const schema = await import('/src/core/schema.js');
  const res = await fetch('/demos/data/T-002_schema_samples.json').then(r => r.json());

  // 1) Create sample, pack, and size check
  const sample = { id: 42, name: 'Sample Player', position: 'WR', team: 'GB', byeWeek: 6, injuryStatus: 'Q', points: 199.9 };
  const packed = schema.createPackedPlayer(sample);
  const bytes = JSON.stringify(packed).length;
  console.log({ packed, bytes, under100: bytes < 100 });

  // 2) Verify ALL injury statuses map correctly
  const expected = { HEALTHY: 0, Q: 1, D: 2, O: 3, IR: 4, PUP: 5, NA: 6 };
  const observed = Object.fromEntries(Object.keys(expected).map(k => [k, schema.normalizeInjuryStatus(k)]));
  console.table(observed);
  console.log('injuryMappingOK', Object.keys(expected).every(k => expected[k] === observed[k]));

  // 3) Validate provided packed samples are <100 bytes
  const sizes = res.playersPacked.map(p => JSON.stringify(p).length);
  console.log({ maxSampleBytes: Math.max(...sizes), allSamplesUnder100: sizes.every(n => n < 100) });

  // 4) Basic workspace schema sanity with sample
  const w = res.workspaceSample;
  const workspaceOK =
    typeof w.version === 'string' &&
    w.metadata && typeof w.metadata.name === 'string' && typeof w.metadata.checksum === 'string' &&
    w.league && w.league.format && Number.isFinite(w.league.format.teams) && Number.isFinite(w.league.format.budget) &&
    w.league.roster && typeof w.league.roster.QB === 'number' &&
    Array.isArray(w.players) &&
    w.draftState && typeof w.draftState.phase === 'string' &&
    Array.isArray(w.history);
  console.log({ workspaceOK });
})();
```
3) Expected results:
- `under100: true`
- `injuryMappingOK: true` and table shows HEALTHY→0, Q→1, D→2, O→3, IR→4, PUP→5, NA→6
- `allSamplesUnder100: true` and `maxSampleBytes < 100`
- `{ workspaceOK: true }`

Record:
- Outcome: [pass/fail]
- Notes:
