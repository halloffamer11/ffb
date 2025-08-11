/* Fuzzy search tests: typos, initials, special chars, performance */

import { FuzzySearch } from '../../src/core/search.js';

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

function nowMs() {
  const hr = process.hrtime.bigint();
  return Number(hr) / 1e6;
}

const players = [
  { id: 1, name: 'Patrick Mahomes', team: 'KC', position: 'QB', drafted: false },
  { id: 2, name: 'Christian McCaffrey', team: 'SF', position: 'RB', drafted: false },
  { id: 3, name: 'C.J. Fiedorowicz', team: 'HOU', position: 'TE', drafted: false },
  { id: 4, name: "D'Andre Swift", team: 'CHI', position: 'RB', drafted: false },
  { id: 5, name: 'Travis Kelce', team: 'KC', position: 'TE', drafted: true }
];

const search = new FuzzySearch(players);

// 1) Initials match: "CJ" → "C.J. Fiedorowicz"
{
  const res = search.search('CJ');
  assertOkay('initials match CJ → C.J. Fiedorowicz', res.length > 0 && res[0].id === 3, { ids: res.map(r => r.id) });
}

// 2) Typo tolerance: "Fiedorowitch" → "Fiedorowicz"
{
  const res = search.search('Fiedorowitch');
  assertOkay('typo match Fiedorowitch → Fiedorowicz', res.length > 0 && res[0].id === 3, { names: res.map(r => r.name) });
}

// 3) Typo tolerance: "Macaffrey" → "McCaffrey"
{
  const res = search.search('Macaffrey');
  assertOkay('typo match Macaffrey → McCaffrey', res.some(p => p.id === 2));
}

// 4) Special characters: handle apostrophes gracefully
{
  const res = search.search("dandre");
  assertOkay('special char stripping for D\'Andre Swift', res.some(p => p.id === 4));
}

// 5) Drafted filter still works
{
  const draftedOnly = search.search('kelce', { drafted: 'drafted' });
  const undraftedOnly = search.search('kelce', { drafted: 'undrafted' });
  assertOkay('drafted filter keeps drafted', draftedOnly.length === 1 && draftedOnly[0].id === 5);
  assertOkay('drafted filter removes from undrafted', undraftedOnly.length === 0);
}

// 6) Performance check: ensure typical search <50ms on small set
{
  const t0 = nowMs();
  const res = search.search('mahomes');
  const t1 = nowMs();
  assertOkay('fuzzy search perf <50ms', (t1 - t0) < 50, { durationMs: (t1 - t0), count: res.length });
}


