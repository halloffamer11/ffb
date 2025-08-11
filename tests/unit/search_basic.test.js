/* Basic search tests for case-insensitive matching and drafted filtering */

import { BasicSearch } from '../../src/core/search.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

const players = [
  { id: 1, name: 'Patrick Mahomes', team: 'KC', position: 'QB', drafted: false },
  { id: 2, name: 'Travis Kelce', team: 'KC', position: 'TE', drafted: true },
  { id: 3, name: 'Mahmoud Ali', team: 'FA', position: 'WR', drafted: false }
];

const search = new BasicSearch(players);

// Case-insensitive
{
  const res = search.search('mahomes');
  assertOkay('case-insensitive', res.length === 1 && res[0].id === 1);
}

// Partial
{
  const res = search.search('HOM');
  assertOkay('partial match', res.length === 1 && res[0].id === 1);
}

// Drafted filters
{
  const all = search.search('travis', { drafted: 'all' });
  const onlyUndrafted = search.search('travis', { drafted: 'undrafted' });
  const onlyDrafted = search.search('travis', { drafted: 'drafted' });
  assertOkay('all returns drafted player', all.length === 1 && all[0].id === 2);
  assertOkay('undrafted filters out', onlyUndrafted.length === 0);
  assertOkay('drafted returns player', onlyDrafted.length === 1 && onlyDrafted[0].id === 2);
}


