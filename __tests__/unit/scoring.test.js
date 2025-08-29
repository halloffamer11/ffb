/* Scoring tests for PPR/HALF/STD and custom overrides. */

import { calculatePoints, autoConfigure } from '../../src/core/scoring.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const stats = {
  pass_yds: 300, pass_tds: 2, pass_int: 1,
  rush_yds: 40, rush_tds: 1,
  rec: 5, rec_yds: 60, rec_tds: 0,
  fumbles: 1
};

// PPR
{
  const cfg = autoConfigure('PPR');
  const pts = calculatePoints(stats, cfg);
  assertOkay('PPR computes', Math.abs(pts - ((300/25)+(2*4)+(-2)+(40/10)+(1*6)+(5*1)+(60/10)+(0*6)+(-2))) < 0.1);
}

// HALF
{
  const cfg = autoConfigure('HALF');
  const pts = calculatePoints(stats, cfg);
  assertOkay('HALF lower than PPR', pts < calculatePoints(stats, autoConfigure('PPR')));
}

// STD
{
  const cfg = autoConfigure('STD');
  const pts = calculatePoints(stats, cfg);
  assertOkay('STD lower than HALF', pts < calculatePoints(stats, autoConfigure('HALF')));
}

// Overrides
{
  const cfg = autoConfigure('PPR', { passTds: 5, rec: 2 });
  const pts = calculatePoints(stats, cfg);
  assertOkay('overrides applied', pts > calculatePoints(stats, autoConfigure('PPR')));
}


