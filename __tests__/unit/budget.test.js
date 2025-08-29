import { computeRosterTotalPerTeam, calculateRemainingBudget, countSpotsRemaining, calculateMaxBid, calculateAveragePerSpot, computeAllTeamBudgets } from '../../src/core/budget.js';

function assertOk(name, cond, details) {
  if (!cond) { console.error('FAIL:', name, details||''); process.exitCode = 1; } else { console.log('OK:', name); }
}

const settings = {
  teams: 3,
  budget: 200,
  minBid: 1,
  roster: { QB:1, RB:2, WR:2, TE:1, FLEX:0, K:0, DST:0, BENCH:2 },
  owners: [
    { id: 1, team: 'A', name: 'A', order: 1 },
    { id: 2, team: 'B', name: 'B', order: 2 },
    { id: 3, team: 'C', name: 'C', order: 3 }
  ],
  keepers: [{ teamId: 2, cost: 10 }]
};

const picks = [
  { playerId: 101, teamId: 1, price: 50 },
  { playerId: 102, teamId: 1, price: 30 },
  { playerId: 201, teamId: 2, price: 70 }
];

// roster total = starters(1+2+2+1)+bench(2)=8
assertOk('roster total per team', computeRosterTotalPerTeam(settings) === 8);

// remaining budget
assertOk('remaining team1', calculateRemainingBudget(1, settings, picks) === 120);
// team2 has 10 keepers + 70 picks = 80 spent
assertOk('remaining team2', calculateRemainingBudget(2, settings, picks) === 120);

// spots remaining: team1 has 2 picks
assertOk('spots remaining team1', countSpotsRemaining(1, settings, picks) === 6);

// max bid: remaining 120, spots 6, min 1 -> 120 - 1*(6-1) = 115
assertOk('max bid logic', calculateMaxBid(120, 6, 1) === 115);
assertOk('avg per spot', Math.abs(calculateAveragePerSpot(120, 6) - 20) < 0.001);

// league table
{
  const rows = computeAllTeamBudgets(settings, picks);
  assertOk('rows length == teams', rows.length === 3);
  const t1 = rows.find(r => r.teamId === 1);
  assertOk('t1 remaining 120', t1.remaining === 120);
}


