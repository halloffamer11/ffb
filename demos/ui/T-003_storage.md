# T-003 Storage Layer — Human Validation

Goal: Verify storage wrapper handles availability, quota limits, export/import, and backups.

Prereq:
- Dev server running: `npm run dev` → open `http://localhost:5173`

Steps (paste into browser console):

```js
(async () => {
  const { createStorageAdapter, createBackupManager } = await import('/src/adapters/storage.js');

  function log(title, value) { console.log(`%c${title}`, 'font-weight:bold;color:#2563eb', value); }

  // 1) Availability and basic CRUD
  const store = createStorageAdapter({ namespace: 'hv', version: '1.0.0' });
  log('available', store.isAvailable());
  const s1 = store.set('foo', { a: 1 });
  log('set foo', s1);
  log('get foo', store.get('foo'));
  store.remove('foo');
  log('removed foo', store.get('foo') === null);

  // 2) Namespacing
  const A = createStorageAdapter({ namespace: 'hvA' });
  const B = createStorageAdapter({ namespace: 'hvB' });
  A.set('x', 1); A.set('y', 2); B.set('x', 3);
  log('keys A', A.keys());
  log('keys B', B.keys());

  // 3) Quota handling (Quick Mode using small maxBytes)
  const quick = createStorageAdapter({ namespace: 'hvQ', maxBytes: 200_000 }); // ~200KB
  const chunk = 'x'.repeat(10_000);
  let i = 0;
  while (quick.bytesUsed() + (('k'+i).length + chunk.length) < 190_000) {
    const r = quick.set(`k${i}`, chunk);
    if (!r.ok) break;
    i += 1;
  }
  log('bytesUsed(~<190KB)', quick.bytesUsed());
  const over = quick.set('overflow', 'y'.repeat(50_000));
  log('quota predicted (expect QUOTA_EXCEEDED)', over);

  // 4) Export / Import round-trip
  const exp = quick.exportNamespace();
  log('export ok', exp.ok);
  const rt = createStorageAdapter({ namespace: 'hvRT' });
  const imp = rt.importNamespace(exp.json);
  log('import ok', imp.ok);
  log('rt keys', rt.keys().slice(0,5));

  // 5) Rolling backups (max 3 kept)
  const backups = createBackupManager(rt, { maxBackups: 3 });
  backups.save({ n: 1 });
  backups.save({ n: 2 });
  backups.save({ n: 3 });
  backups.save({ n: 4 });
  const backupKeys = rt.keys().filter(k => k.startsWith('__backup::'));
  log('backup keys (expect 3)', backupKeys);
  log('latest backup', backups.loadLatest());

  // 6) (Optional) Real-world quota: fill toward ~4.9MB
  // Uncomment to run a slower, real limit test. This may clear origin storage on some browsers if exceeded.
  // const real = createStorageAdapter({ namespace: 'hvReal' });
  // const bigChunk = 'z'.repeat(50_000);
  // let j = 0;
  // while (real.bytesUsed() + (('b'+j).length + bigChunk.length) < (4.9 * 1024 * 1024)) {
  //   const r2 = real.set(`b${j}`, bigChunk);
  //   if (!r2.ok) break;
  //   j += 1;
  // }
  // log('bytesUsed(~<4.9MB)', real.bytesUsed());
  // log('overflow result', real.set('tooBig', 't'.repeat(500_000)));

})();
```

Expected results:
- available: true
- keys A: ['x','y'] and keys B: ['x']
- quota predicted: `{ ok: false, error: 'QUOTA_EXCEEDED' }`
- export ok: true; import ok: true; rt keys: list populated
- backup keys: length 3; latest backup shows `{ n: 4 }`

Optional manual check:
- Disable or block storage for the site (browser privacy settings), reload page, and verify the app refuses to run with an error (environment check in `src/app/main.js`).

Record:
- Outcome: [pass/fail]
- Notes:

