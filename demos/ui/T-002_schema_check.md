# T-002 Data Schema — Human Validation

Goal: Validate compact player size and injury enum mapping.

Steps:
1) Open app and DevTools Console
2) Paste:
```js
import('/src/core/schema.js').then(m => {
  const sample = {
    id: 42, name: 'Sample Player', position: 'WR', team: 'GB', byeWeek: 6, injuryStatus: 'Q', points: 199.9
  };
  const packed = m.createPackedPlayer(sample);
  console.log('packed', packed);
  console.log('bytes', JSON.stringify(packed).length);
  console.log('status code', m.normalizeInjuryStatus('Q'));
});
```
3) Confirm:
- `bytes` < 100
- `status code` equals 1 (Q)
4) Review `demos/data/T-002_schema_samples.json`

Record:
- Outcome: [pass/fail]
- Notes:
