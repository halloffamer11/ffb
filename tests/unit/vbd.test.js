/* VBD tests with baselines and edge cases */

import { calculatePlayerVBD, baselineForPosition } from '../../src/core/vbd.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const players = [
  { id:1, name:'A', position:'RB', team:'X', points: 250 },
  { id:2, name:'B', position:'RB', team:'Y', points: 230 },
  { id:3, name:'C', position:'RB', team:'Z', points: 210 },
  { id:4, name:'D', position:'WR', team:'X', points: 260 },
  { id:5, name:'E', position:'WR', team:'Y', points: 240 }
];

const settings = { teams: 12, starters: { RB: 2, WR: 2 } };

// Baseline checks
{
  const rbBase = baselineForPosition(players, 'RB', settings); // 24th RB -> clamped to last available (index 2)
  assertOkay('rb baseline equals last available', rbBase === 210);
}

// VBD values subtract baseline
{
  const withVbd = calculatePlayerVBD(players, settings);
  const p1 = withVbd.find(p => p.name === 'A');
  assertOkay('A VBD = 250-210=40', Math.abs(p1.vbd - 40) < 0.0001);
}

// Edge: empty position
{
  const base = baselineForPosition([], 'QB', settings);
  assertOkay('empty baseline 0', base === 0);
}


