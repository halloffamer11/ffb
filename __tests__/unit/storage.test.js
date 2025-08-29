/* Storage adapter unit tests (Node). No DOM required.
 * Uses an in-memory Map to simulate localStorage behavior and errors.
 */

import { createStorageAdapter, createBackupManager } from '../../src/adapters/storage.js';

class MemoryStorage {
  constructor(maxBytes = Infinity) {
    this._map = new Map();
    this._maxBytes = maxBytes;
  }
  get length() { return this._map.size; }
  key(index) { return Array.from(this._map.keys())[index] ?? null; }
  getItem(k) { return this._map.has(k) ? this._map.get(k) : null; }
  removeItem(k) { this._map.delete(k); }
  setItem(k, v) {
    const currentBytes = Array.from(this._map.entries()).reduce((acc, [kk, vv]) => acc + kk.length + vv.length, 0);
    const newBytes = currentBytes - (this._map.has(k) ? (k.length + this._map.get(k).length) : 0) + (k.length + v.length);
    if (newBytes > this._maxBytes) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
    this._map.set(k, v);
  }
}

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

// 1) Available and simple set/get/remove
{
  const mem = new MemoryStorage();
  const store = createStorageAdapter({ driver: mem, namespace: 'test', version: '1.0.0' });
  assertOkay('available', store.isAvailable());
  assertOkay('initial version set', store.getVersion() === '1.0.0');

  const resSet = store.set('foo', { a: 1 });
  assertOkay('set ok', resSet.ok);
  assertOkay('get returns value', store.get('foo')?.a === 1);
  store.remove('foo');
  assertOkay('removed', store.get('foo') === null);
}

// 2) Keys and namespacing
{
  const mem = new MemoryStorage();
  const storeA = createStorageAdapter({ driver: mem, namespace: 'A' });
  const storeB = createStorageAdapter({ driver: mem, namespace: 'B' });
  storeA.set('x', 1); storeA.set('y', 2);
  storeB.set('x', 3);
  assertOkay('keys A', JSON.stringify(storeA.keys()) === JSON.stringify(['x','y']));
  assertOkay('keys B', JSON.stringify(storeB.keys()) === JSON.stringify(['x']));
}

// 3) Quota exceeded via predicted size
{
  const mem = new MemoryStorage(128); // small limit
  const store = createStorageAdapter({ driver: mem, namespace: 'q', maxBytes: 100 });
  const big = { data: 'x'.repeat(150) };
  const res = store.set('big', big);
  assertOkay('quota predicted', !res.ok && res.error === 'QUOTA_EXCEEDED');
}

// 4) Quota exceeded via underlying driver error
{
  const mem = new MemoryStorage(64); // will throw on setItem
  const store = createStorageAdapter({ driver: mem, namespace: 'q2', maxBytes: 1024 });
  const payload = { s: 'y'.repeat(60) };
  const res = store.set('payload', payload);
  assertOkay('quota thrown', !res.ok && res.error === 'QUOTA_EXCEEDED');
}

// 5) Export / Import namespace round-trip
{
  const mem = new MemoryStorage();
  const store = createStorageAdapter({ driver: mem, namespace: 'rt', version: '1.0.0' });
  store.set('a', { v: 1 });
  store.set('b', [1,2,3]);
  const exp = store.exportNamespace();
  assertOkay('export ok', exp.ok);

  const mem2 = new MemoryStorage();
  const store2 = createStorageAdapter({ driver: mem2, namespace: 'rt' });
  const imp = store2.importNamespace(exp.json);
  assertOkay('import ok', imp.ok);
  assertOkay('rt a', store2.get('a').v === 1);
  assertOkay('rt b', Array.isArray(store2.get('b')) && store2.get('b').length === 3);
}

// 6) Backups keep rolling 3
{
  const mem = new MemoryStorage();
  const store = createStorageAdapter({ driver: mem, namespace: 'bk' });
  const backups = createBackupManager(store, { maxBackups: 3 });
  backups.save({ n: 1 });
  backups.save({ n: 2 });
  backups.save({ n: 3 });
  backups.save({ n: 4 });
  const k = store.keys().filter(k => k.startsWith('__backup::'));
  assertOkay('max 3 backups kept', k.length === 3);
  const latest = backups.loadLatest();
  assertOkay('latest backup present', latest && latest.n === 4);
}


