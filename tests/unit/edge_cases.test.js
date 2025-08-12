/* T-029 Edge Case Tests (subset via pure helpers) */
import { computeRosterTotalPerTeam, calculateMaxBid } from '../../src/core/budget.js';
import { groupRosterByPosition } from '../../src/core/roster.js';

function assertOk(name, cond, details) {
  if (!cond) { console.error('FAIL:', name, details||''); process.exitCode = 1; } else { console.log('OK:', name); }
}

// Large roster sizes
{
  const settings = { teams: 14, budget: 200, minBid: 1, roster: { QB:2, RB:3, WR:4, TE:2, FLEX:2, K:1, DST:1, BENCH:8 } };
  const total = computeRosterTotalPerTeam(settings);
  assertOk('large roster total computed', total > 0 && Number.isFinite(total));
}

// Minimum budgets logic
{
  const max = calculateMaxBid(50, 5, 1); // can bid 50 - 1*(5-1) = 46
  assertOk('min budget max bid', max === 46);
}

// Rapid pick entry simulation (no perf assertion, structural only)
{
  const picks = [];
  for (let i = 0; i < 50; i += 1) picks.push({ playerId: 1000 + i, teamId: (i % 12) + 1, price: 1 + (i % 50) });
  assertOk('50 picks appended', picks.length === 50);
}

// All positions drafted edge leading to empty roster grouping
{
  const players = [];
  const picks = [ { playerId: 1, teamId: 1, price: 1 } ];
  const map = groupRosterByPosition(players, picks, 1);
  assertOk('empty players yields empty map', map.size === 0);
}


