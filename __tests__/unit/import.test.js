/* CSV Import tests covering valid, corrupt, BOM/UTF-8, and missing columns. */

import { parseCsv, detectColumnMapping, importFromCsvText } from '../../src/adapters/import.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

// 1) Parse simple CSV
{
  const text = 'name,team,position,points\nA,KC,QB,300\nB,SF,RB,250';
  const res = parseCsv(text);
  assertOkay('parse ok', res.ok);
  assertOkay('row count', res.rows.length === 3);
}

// 2) BOM + CRLF + quoted commas
{
  const text = '\uFEFFname,team,position,points\r\n"Player, Sr.",KC,QB,300\r\n';
  const res = parseCsv(text);
  assertOkay('parse ok (BOM/CRLF/quotes)', res.ok);
  assertOkay('quoted field preserved', res.rows[1][0] === 'Player, Sr.');
}

// 3) Mapping detection with synonyms
{
  const header = ['Player Name', 'tm', 'pos', 'ProjPts'];
  const map = detectColumnMapping(header);
  assertOkay('mapping ok', map.ok);
  assertOkay('has name', typeof map.mapping.name === 'number');
  assertOkay('has points', typeof map.mapping.points === 'number');
}

// 4) Import valid text
{
  const text = 'player,tm,pos,projpts,injury\nMahomes,KC,QB,355.4,HEALTHY\nMcCaffrey,SF,RB,330.2,Q';
  const res = importFromCsvText(text);
  assertOkay('import ok', res.ok);
  assertOkay('records length', res.records.length === 2);
  assertOkay('injury normalized present', typeof res.records[0].injuryStatus === 'number');
}

// 5) Missing required columns
{
  const text = 'name,team,projpts\nA,KC,100';
  const res = importFromCsvText(text);
  assertOkay('missing columns', !res.ok && res.errors[0].error === 'MISSING_COLUMNS');
}

// 6) Invalid number
{
  const text = 'name,team,position,points\nA,KC,QB,NaN';
  const res = importFromCsvText(text);
  assertOkay('invalid number error', !res.ok && res.errors[0].error === 'INVALID_NUMBER');
}

// 7) Unclosed quote
{
  const text = 'name,team,position,points\n"A,KC,QB,100';
  const res = importFromCsvText(text);
  assertOkay('unclosed quote error', !res.ok && res.errors[0].error === 'UNCLOSED_QUOTE');
}


