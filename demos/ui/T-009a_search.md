# T-009a Basic String Search — Human Validation

What this tests:
- Case-insensitive substring match on player names
- Drafted filter modes: all | undrafted | drafted
- Returns player context (team, position) from input objects

Steps (browser console):
```js
(async () => {
  const { BasicSearch } = await import('/src/core/search.js');
  const players = [
    { id: 1, name: 'Patrick Mahomes', team: 'KC', position: 'QB', drafted: false },
    { id: 2, name: 'Travis Kelce', team: 'KC', position: 'TE', drafted: true }
  ];
  const s = new BasicSearch(players);
  console.log('lowercase', s.search('mahomes'));
  console.log('uppercase', s.search('MAHOMES'));
  console.log('partial', s.search('hom'));
  console.log('all', s.search('travis', { drafted: 'all' }));
  console.log('undrafted', s.search('travis', { drafted: 'undrafted' }));
  console.log('drafted', s.search('travis', { drafted: 'drafted' }));
})();
```

Expected:
- All: 3 searches for Mahomes return the same player
- Drafted filters: all returns Kelce; undrafted returns []; drafted returns Kelce
- Confirm `team` and `position` fields are present in the results

