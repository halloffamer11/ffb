import { parseQuickEntry, computeRoundAndPick, formatPickLogLine, isPlayerAlreadyDrafted } from '../../src/ui/draftUtils.js';

function assertEq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { console.error('FAIL', name, 'got=', got, 'want=', want); process.exitCode = 1; } else { console.log('OK', name); }
}

// parseQuickEntry
assertEq('parseQuickEntry space', parseQuickEntry('3 25'), { teamId: 3, price: 25 });
assertEq('parseQuickEntry csv', parseQuickEntry('4, 11'), { teamId: 4, price: 11 });
assertEq('parseQuickEntry kv', parseQuickEntry('team:5 price:17'), { teamId: 5, price: 17 });
assertEq('parseQuickEntry mixed', parseQuickEntry('p:9 t:2'), { teamId: 2, price: 9 });
assertEq('parseQuickEntry bad', parseQuickEntry('abc'), null);

// computeRoundAndPick
assertEq('compute R/P #1 T12', computeRoundAndPick(1, 12), { round: 1, pickInRound: 1 });
assertEq('compute R/P #12 T12', computeRoundAndPick(12, 12), { round: 1, pickInRound: 12 });
assertEq('compute R/P #13 T12', computeRoundAndPick(13, 12), { round: 2, pickInRound: 1 });

// formatPickLogLine
assertEq('format line', formatPickLogLine({ overall: 13, teamName: 'Team 1', playerName: 'Player A', price: 11, teams: 12 }), '[#13 R2 P1] Team 1 draft Player A for $11');

// isPlayerAlreadyDrafted
const picks = [ { playerId: 10, playerName: 'Foo' }, { playerId: 11, playerName: 'Bar' } ];
assertEq('already drafted by id', isPlayerAlreadyDrafted(picks, { id: 10, name: 'Foo' }), true);
assertEq('already drafted by name', isPlayerAlreadyDrafted(picks, { id: 12, name: 'Bar' }), true);
assertEq('not drafted', isPlayerAlreadyDrafted(picks, { id: 99, name: 'Baz' }), false);


