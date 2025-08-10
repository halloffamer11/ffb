# T-005 Golden Dataset Integration — Human Validation

Goal: Load tiny source CSVs, transform to internal format, pad to 300, and verify export/import round-trip.

Steps (browser console):

```js
(async () => {
  const g = await import('/src/adapters/golden.js');
  async function txt(u){ return await fetch(u).then(r => r.text()); }

  const pm = await txt('/testdata/golden/sources/player_master.csv');
  const proj = await txt('/testdata/golden/sources/projections_offense_season.csv');
  const auc = await txt('/testdata/golden/sources/auction_values.csv');

  const base = g.transformSourcesToInternal({ playerMasterCsv: pm, projectionsSeasonCsv: proj, auctionValuesCsv: auc });
  console.log('baseCount', base.length, base.slice(0,3));
  const full = g.padToTargetCount(base, 300);
  console.log('fullCount', full.length);
  const csv = g.exportRecordsToCsv(full);
  const rt = g.roundTripImportCount(csv);
  console.log('roundTrip', rt);
})();
```

Expected:
- baseCount > 0, fullCount === 300
- roundTrip.ok === true; roundTrip.count === 300

Record:
- Outcome: [pass/fail]
- Notes:

