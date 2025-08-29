import { groupRosterByPosition, computeTeamProjection, computeByeConflicts } from '../../src/core/roster.js';

function assertOk(name, cond, details) {
  if (!cond) { console.error('FAIL:', name, details||''); process.exitCode = 1; } else { console.log('OK:', name); }
}

const players = [
  { id: 1, name: 'A QB', position: 'QB', points: 300, byeWeek: 7 },
  { id: 2, name: 'B RB', position: 'RB', points: 220, byeWeek: 7 },
  { id: 3, name: 'C RB', position: 'RB', points: 210, byeWeek: 7 },
  { id: 4, name: 'D WR', position: 'WR', points: 200, byeWeek: 8 }
];
const picks = [ { playerId: 1, teamId: 1, price: 20 }, { playerId: 2, teamId: 1, price: 30 }, { playerId: 3, teamId: 2, price: 15 } ];

{
  const map = groupRosterByPosition(players, picks, 1);
  assertOk('grouped QB length 1', (map.get('QB')||[]).length === 1);
  assertOk('grouped RB length 1 for team 1', (map.get('RB')||[]).length === 1);
}

{
  const proj = computeTeamProjection(players, picks, 1);
  assertOk('projection sums drafted players for team', Math.abs(proj - (300 + 220)) < 0.001);
}

{
  const conflicts = computeByeConflicts(players, picks, 1);
  // team 1 has 2 players with bye week 7 -> conflict present
  assertOk('conflict week 7 for team 1', conflicts.has(7));
}


