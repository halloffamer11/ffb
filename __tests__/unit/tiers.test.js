/* Tier calculation tests */

import { computeTiers } from '../../src/core/tiers.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const playersRB = [
  { name:'A', position:'RB', vbd: 50 },
  { name:'B', position:'RB', vbd: 48 },
  { name:'C', position:'RB', vbd: 35 },
  { name:'D', position:'RB', vbd: 34 },
  { name:'E', position:'RB', vbd: 10 }
];

{
  const map = new Map([['RB', playersRB]]);
  const res = computeTiers(map);
  const info = res.get('RB');
  assertOkay('tiers exist', Array.isArray(info.tiers) && info.tiers.length >= 1);
  const flat = info.tiers.flat().map(p => p.name);
  assertOkay('all players included', flat.length === playersRB.length);
}


