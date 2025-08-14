/* Micro-bench scaffolds (T-026) */

import { timeFunction } from '../../src/core/perf.js';

function assertOkay(name, condition, details) {
  if (!condition) { console.error(`FAIL: ${name}`, details || ''); process.exitCode = 1; } else { console.log(`OK: ${name}`); }
}

{
  const res = timeFunction(() => 1 + 1, 1000);
  assertOkay('timeFunction returns duration', res && typeof res.durationMs === 'number');
}


