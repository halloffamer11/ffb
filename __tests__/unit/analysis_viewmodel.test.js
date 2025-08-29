import { calculateMaxBid } from '../../src/core/budget.js';
import { stdDev } from '../../src/core/tiers.js';

function assertOk(name, cond, details) {
  if (!cond) { console.error('FAIL:', name, details||''); process.exitCode = 1; } else { console.log('OK:', name); }
}

// sanity on stdDev used for z-score
{
  const v = stdDev([10, 10, 10]);
  assertOk('stdDev zero spread', Math.abs(v - 0) < 1e-9);
}

// sanity on bid math boundary
{
  const max = calculateMaxBid(120, 6, 1);
  assertOk('max bid basic', max === 115);
}


