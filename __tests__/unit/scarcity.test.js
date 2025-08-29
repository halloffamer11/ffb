import { computeTiers } from '../../src/core/tiers.js';

function assertOk(name, cond, details) {
  if (!cond) { console.error('FAIL:', name, details||''); process.exitCode = 1; } else { console.log('OK:', name); }
}

{
  const rb = [
    { name: 'A', position: 'RB', vbd: 40 },
    { name: 'B', position: 'RB', vbd: 38 },
    { name: 'C', position: 'RB', vbd: 20 },
    { name: 'D', position: 'RB', vbd: 19 },
    { name: 'E', position: 'RB', vbd: 5 }
  ];
  const map = new Map([[ 'RB', rb ]]);
  const tiersMap = computeTiers(map);
  const info = tiersMap.get('RB');
  assertOk('tiersMap has tiers', info && Array.isArray(info.tiers) && info.tiers.length >= 1);
  const flat = info.tiers.flat().map(p => p.name);
  assertOk('all included', flat.length === rb.length);
}


