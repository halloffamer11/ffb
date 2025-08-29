/* Golden dataset transformation tests */

import fs from 'node:fs';
import path from 'node:path';
import { transformSourcesToInternal, padToTargetCount, exportRecordsToCsv, roundTripImportCount } from '../../src/adapters/golden.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const read = (p) => fs.readFileSync(path.resolve(p), 'utf8');

// Use tiny golden source samples from repo
const pm = read('testdata/golden/sources/player_master.csv');
const proj = read('testdata/golden/sources/projections_offense_season.csv');
const auc = read('testdata/golden/sources/auction_values.csv');

// 1) Transform to internal
{
  const recs = transformSourcesToInternal({ playerMasterCsv: pm, projectionsSeasonCsv: proj, auctionValuesCsv: auc });
  assertOkay('transform produced records', recs.length > 0);
  const one = recs[0];
  assertOkay('record has fields', 'name' in one && 'team' in one && 'position' in one && 'points' in one);
}

// 2) pad to 300
{
  const base = transformSourcesToInternal({ playerMasterCsv: pm, projectionsSeasonCsv: proj, auctionValuesCsv: auc });
  const full = padToTargetCount(base, 300);
  assertOkay('padded to 300', full.length === 300);
}

// 3) round-trip export/import maintains count
{
  const base = transformSourcesToInternal({ playerMasterCsv: pm, projectionsSeasonCsv: proj, auctionValuesCsv: auc });
  const full = padToTargetCount(base, 300);
  const csv = exportRecordsToCsv(full);
  const rt = roundTripImportCount(csv);
  assertOkay('round-trip import ok', rt.ok);
  assertOkay('round-trip count matches', rt.count === 300);
}


