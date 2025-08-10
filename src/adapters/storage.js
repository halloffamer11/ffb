/**
 * Storage adapter: localStorage wrapper with error handling, quota awareness,
 * lightweight versioning, and export/import helpers.
 *
 * Design notes:
 * - Pure core-like interface exposed as functions operating on an injected driver
 *   so that tests can run in Node without a DOM.
 * - In browsers, pass `window.localStorage` as the driver. If omitted and a DOM
 *   is present, the adapter attempts to use `window.localStorage`.
 * - Namespacing prevents key collisions and enables scoped export/import.
 * - Size checks are best-effort by summing JSON string lengths of namespaced keys.
 */

/**
 * @typedef {Object} StorageAdapter
 * @property {() => boolean} isAvailable
 * @property {(key: string) => any} get
 * @property {(key: string, value: any) => { ok: true } | { ok: false, error: string }} set
 * @property {(key: string) => void} remove
 * @property {() => string[]} keys
 * @property {() => number} bytesUsed
 * @property {() => { ok: true, json: string } | { ok: false, error: string }} exportNamespace
 * @property {(json: string) => { ok: true } | { ok: false, error: string }} importNamespace
 * @property {() => string} getVersion
 * @property {(version: string) => void} setVersion
 */

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // ~5MB budget per origin

/**
 * Create a storage adapter bound to a namespace.
 * @param {Object} options
 * @param {Storage|null} [options.driver]
 * @param {string} [options.namespace]
 * @param {string} [options.version]
 * @param {number} [options.maxBytes]
 * @returns {StorageAdapter}
 */
export function createStorageAdapter(options = {}) {
  const driver = resolveDriver(options.driver);
  const namespace = String(options.namespace || 'ffb').trim();
  const maxBytes = Number.isFinite(options.maxBytes) ? options.maxBytes : DEFAULT_MAX_BYTES;
  const metaKey = `${namespace}::__meta`;

  function namespacedKey(key) {
    return `${namespace}::${String(key)}`;
  }

  function isAvailable() {
    if (!driver) return false;
    try {
      const probeKey = namespacedKey('__probe');
      driver.setItem(probeKey, '1');
      driver.removeItem(probeKey);
      return true;
    } catch {
      return false;
    }
  }

  function keys() {
    if (!driver) return [];
    const result = [];
    for (let i = 0; i < driver.length; i += 1) {
      const k = driver.key(i);
      if (k && k.startsWith(`${namespace}::`) && k !== metaKey) {
        // Strip namespace prefix for return value
        result.push(k.substring(namespace.length + 2));
      }
    }
    return result.sort();
  }

  function bytesUsed() {
    if (!driver) return 0;
    let total = 0;
    for (let i = 0; i < driver.length; i += 1) {
      const k = driver.key(i);
      if (k && (k.startsWith(`${namespace}::`) || k === metaKey)) {
        const v = driver.getItem(k);
        total += (k.length + (v ? v.length : 0));
      }
    }
    return total;
  }

  function get(key) {
    if (!driver) return null;
    try {
      const raw = driver.getItem(namespacedKey(key));
      if (raw == null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function predictBytesAfterSet(key, value) {
    const current = bytesUsed();
    const fullKey = namespacedKey(key);
    const existing = driver ? driver.getItem(fullKey) : null;
    const serialized = safeStringify(value);
    const delta = (fullKey.length + serialized.length) - (existing ? (fullKey.length + existing.length) : 0);
    return current + Math.max(0, delta);
  }

  function set(key, value) {
    if (!driver) return { ok: false, error: 'UNAVAILABLE' };
    const fullKey = namespacedKey(key);
    const serialized = safeStringify(value);

    // Best-effort size check before writing
    if (predictBytesAfterSet(key, value) > maxBytes) {
      return { ok: false, error: 'QUOTA_EXCEEDED' };
    }

    try {
      driver.setItem(fullKey, serialized);
      return { ok: true };
    } catch (err) {
      if (isQuotaError(err)) return { ok: false, error: 'QUOTA_EXCEEDED' };
      return { ok: false, error: 'WRITE_FAILED' };
    }
  }

  function remove(key) {
    if (!driver) return;
    try { driver.removeItem(namespacedKey(key)); } catch {}
  }

  function exportNamespace() {
    if (!driver) return { ok: false, error: 'UNAVAILABLE' };
    try {
      const data = { __meta: getMeta(), items: {} };
      for (const k of keys()) {
        data.items[k] = get(k);
      }
      const json = JSON.stringify(data);
      return { ok: true, json };
    } catch {
      return { ok: false, error: 'EXPORT_FAILED' };
    }
  }

  function importNamespace(json) {
    if (!driver) return { ok: false, error: 'UNAVAILABLE' };
    try {
      const data = JSON.parse(String(json || '{}'));
      if (!data || typeof data !== 'object' || !data.items) return { ok: false, error: 'INVALID_IMPORT' };
      // Clear existing namespace (except meta)
      for (const k of keys()) remove(k);
      // Write items, with quota awareness
      for (const [k, v] of Object.entries(data.items)) {
        const res = set(k, v);
        if (!res.ok) return res;
      }
      // Restore metadata
      if (data.__meta && typeof data.__meta.version === 'string') {
        setMeta({ version: data.__meta.version });
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'IMPORT_FAILED' };
    }
  }

  function getMeta() {
    if (!driver) return { version: '' };
    try {
      const raw = driver.getItem(metaKey);
      return raw ? JSON.parse(raw) : { version: '' };
    } catch {
      return { version: '' };
    }
  }

  function setMeta(meta) {
    if (!driver) return;
    try { driver.setItem(metaKey, JSON.stringify(meta || {})); } catch {}
  }

  function getVersion() {
    return getMeta().version || '';
  }

  function setVersion(version) {
    setMeta({ version: String(version || '') });
  }

  // Initialize version if provided
  if (isAvailable() && options.version) {
    setVersion(options.version);
  }

  return {
    isAvailable,
    get,
    set,
    remove,
    keys,
    bytesUsed,
    exportNamespace,
    importNamespace,
    getVersion,
    setVersion
  };
}

/**
 * Backup manager: keeps rolling N backups within the same namespace using
 * keys of the form `${namespace}::__backup::<timestamp>`.
 */
export function createBackupManager(adapter, options = {}) {
  const maxBackups = Number.isInteger(options.maxBackups) ? options.maxBackups : 3;
  const prefix = '__backup::';
  let lastStamp = 0;
  let seq = 0;

  function listBackupKeys() {
    return adapter.keys().filter(k => k.startsWith(prefix)).sort();
  }

  function save(data) {
    const stamp = Date.now();
    if (stamp === lastStamp) {
      seq += 1;
    } else {
      seq = 0;
      lastStamp = stamp;
    }
    const key = `${prefix}${stamp}_${seq}`;
    const res = adapter.set(key, data);
    if (!res.ok) return res;
    // prune to maxBackups (keep newest)
    const all = listBackupKeys();
    const excess = all.length - maxBackups;
    for (let i = 0; i < excess; i += 1) {
      adapter.remove(all[i]);
    }
    return { ok: true };
  }

  function loadLatest() {
    const all = listBackupKeys();
    if (all.length === 0) return null;
    const latestKey = all[all.length - 1];
    return adapter.get(latestKey);
  }

  return { save, loadLatest };
}

// Helpers
function resolveDriver(provided) {
  if (provided) return provided;
  try {
    if (typeof window !== 'undefined' && window && window.localStorage) {
      return window.localStorage;
    }
  } catch {}
  return null;
}

function safeStringify(value) {
  try { return JSON.stringify(value); } catch { return 'null'; }
}

function isQuotaError(err) {
  if (!err) return false;
  const name = err.name || '';
  const message = String(err.message || '');
  return name === 'QuotaExceededError' || /quota/i.test(message);
}


