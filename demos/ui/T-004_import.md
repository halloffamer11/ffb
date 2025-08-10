# T-004 CSV Import — Human Validation

Goal: Validate CSV parser and importer handle valid, corrupt, BOM, and missing columns with clear errors.

Steps (browser console):

```js
(async () => {
  const { importFromCsvText } = await import('/src/adapters/import.js');
  function log(title, value) { console.log(`%c${title}`, 'font-weight:bold;color:#2563eb', value); }

  // Valid
  const valid = 'player,tm,pos,projpts,injury\nMahomes,KC,QB,355.4,HEALTHY\nMcCaffrey,SF,RB,330.2,Q';
  log('valid', importFromCsvText(valid));

  // BOM + CRLF + quotes
  const bom = '\uFEFFname,team,position,points\r\n"Player, Sr.",KC,QB,300\r\n';
  log('bom+crlf+quotes', importFromCsvText(bom));

  // Missing columns
  const miss = 'name,team,projpts\nA,KC,100';
  log('missing cols', importFromCsvText(miss));

  // Invalid number
  const badnum = 'name,team,position,points\nA,KC,QB,NaN';
  log('invalid number', importFromCsvText(badnum));

  // Unclosed quote
  const unclosed = 'name,team,position,points\n"A,KC,QB,100';
  log('unclosed quote', importFromCsvText(unclosed));
})();
```

Expected:
- valid.ok === true and records length matches
- bom+crlf+quotes.ok === true and first name is "Player, Sr."
- missing cols → `{ ok:false, errors:[{ error:'MISSING_COLUMNS', missing:[...] }] }`
- invalid number → `{ ok:false, errors:[{ error:'INVALID_NUMBER', rowIndex: 1 }] }`
- unclosed quote → `{ ok:false, errors:[{ error:'UNCLOSED_QUOTE' }] }`

Record:
- Outcome: [pass/fail]
- Notes:

