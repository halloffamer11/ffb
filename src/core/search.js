/**
 * Basic case-insensitive substring search with trivial caching.
 * - Case-insensitive contains match on name
 * - Optional drafted filter: 'all' | 'undrafted' | 'drafted'
 * - Returns original player objects to preserve downstream compatibility
 * Player shape: { id, name, team, position, drafted?, injuryStatus?, adp? | marketData?.adp }
 */

export class BasicSearch {
  constructor(players) {
    this.players = players;
    this.cache = new Map();
  }

  /**
   * @param {string} query
   * @param {{ drafted?: 'all'|'undrafted'|'drafted' }} [options]
   */
  search(query, options = {}) {
    const q = (query || '').toLowerCase();
    const draftedMode = options.drafted || 'all';
    const cacheKey = q + '|' + draftedMode;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    if (!q) return [];

    const result = this.players.filter(p => {
      if (!p || !p.name) return false;
      if (!p.name.toLowerCase().includes(q)) return false;
      if (draftedMode === 'undrafted' && p.drafted === true) return false;
      if (draftedMode === 'drafted' && p.drafted !== true) return false;
      return true;
    });

    this.cache.set(cacheKey, result);
    return result;
  }
}

/**
 * Fuzzy search with normalization and bounded Levenshtein.
 * - Removes punctuation/whitespace for robust matching
 * - Supports initials (e.g., "C.J." → "cj")
 * - Early-exit Levenshtein bounded by dynamic threshold for <50ms perf on ~300 players
 * - Returns original player objects
 */
export class FuzzySearch {
  constructor(players) {
    this.players = players || [];
    this.cache = new Map();
    this.index = this.players.map(p => {
      const nameLower = (p?.name || '').toLowerCase();
      const tokens = tokenize(nameLower);
      return {
        player: p,
        nameLower,
        nameStripped: stripNonAlnum(nameLower),
        tokens,
        initials: tokens.map(t => t[0]).join('')
      };
    });

    // Build lightweight prefix index for quick candidate narrowing
    this.prefixMap = new Map(); // key: token prefix (1..3 chars), value: Set of row indices
    this.initialsMap = new Map(); // key: initials string, value: Set of row indices
    for (let i = 0; i < this.index.length; i += 1) {
      const r = this.index[i];
      // Prefixes for each token up to length 3
      for (const t of r.tokens) {
        const max = Math.min(3, t.length);
        for (let L = 1; L <= max; L += 1) {
          const pref = t.slice(0, L);
          let set = this.prefixMap.get(pref);
          if (!set) { set = new Set(); this.prefixMap.set(pref, set); }
          set.add(i);
        }
      }
      // Initials map
      if (r.initials) {
        let setI = this.initialsMap.get(r.initials);
        if (!setI) { setI = new Set(); this.initialsMap.set(r.initials, setI); }
        setI.add(i);
      }
    }
  }

  /**
   * @param {string} query
   * @param {{ drafted?: 'all'|'undrafted'|'drafted' }} [options]
   */
  search(query, options = {}) {
    const q = (query || '').toLowerCase();
    if (!q) return [];
    const draftedMode = options.drafted || 'all';
    const cacheKey = `fz|${q}|${draftedMode}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const qStripped = stripNonAlnum(q);
    const qTokens = tokenize(q);
    const qInitials = qTokens.map(t => t[0]).join('');

    // 1) Candidates via prefix/initials to reduce scanning
    let candidateIdxSet = null;
    if (qStripped.length > 0 && qStripped.length <= 3) {
      candidateIdxSet = this.prefixMap.get(qStripped) || null;
      // If no prefix match, try initials map directly
      if (!candidateIdxSet && this.initialsMap.has(qStripped)) {
        candidateIdxSet = this.initialsMap.get(qStripped);
      }
    } else if (qStripped.length >= 4) {
      // Use first 3 chars to seed
      const seed = qStripped.slice(0, 3);
      candidateIdxSet = this.prefixMap.get(seed) || null;
    }

    // 2) Fast contains path (either all or narrowed candidates)
    const quick = [];
    if (candidateIdxSet) {
      for (const i of candidateIdxSet) {
        const r = this.index[i];
        if (!passesDrafted(r.player, draftedMode)) continue;
        if (r.nameLower.includes(q)) quick.push(r);
      }
    } else {
      for (const r of this.index) {
        if (!passesDrafted(r.player, draftedMode)) continue;
        if (r.nameLower.includes(q)) quick.push(r);
      }
    }
    if (quick.length > 0 && q.length <= 3) {
      const outQuick = quick.map(r => r.player);
      this.cache.set(cacheKey, outQuick);
      return outQuick;
    }

    // 3) Fuzzy match with bounded Levenshtein
    const scored = [];
    const threshold = dynamicThreshold(qStripped.length);
    const iterate = candidateIdxSet ? candidateIdxSet.values() : null;
    const iterator = iterate ? iterate : null;
    if (iterator) {
      for (const i of iterator) {
        const r = this.index[i];
        if (!passesDrafted(r.player, draftedMode)) continue;
        // Exact/contains variants first
        if (r.nameStripped.includes(qStripped)) {
          scored.push({ r, dist: 0 });
          continue;
        }
        if (r.initials === qStripped || r.initials === qInitials) {
          scored.push({ r, dist: 0 });
          continue;
        }
        const dFull = boundedLevenshtein(qStripped, r.nameStripped, threshold);
        let dToken = Infinity;
        for (const t of r.tokens) {
          const d = boundedLevenshtein(qStripped, t, threshold);
          if (d < dToken) dToken = d;
          if (dToken === 0) break;
        }
        const dInit = boundedLevenshtein(qStripped, r.initials, Math.min(threshold, 2));
        const d = Math.min(dFull, dToken, dInit);
        if (Number.isFinite(d) && d <= threshold) {
          scored.push({ r, dist: d });
        }
      }
    } else {
      for (const r of this.index) {
      if (!passesDrafted(r.player, draftedMode)) continue;
      // Exact/contains variants first
      if (r.nameStripped.includes(qStripped)) {
        scored.push({ r, dist: 0 });
        continue;
      }
      if (r.initials === qStripped || r.initials === qInitials) {
        scored.push({ r, dist: 0 });
        continue;
      }

      // Compute minimal distance among variants
      const dFull = boundedLevenshtein(qStripped, r.nameStripped, threshold);
      let dToken = Infinity;
      for (const t of r.tokens) {
        const d = boundedLevenshtein(qStripped, t, threshold);
        if (d < dToken) dToken = d;
        if (dToken === 0) break;
      }
      const dInit = boundedLevenshtein(qStripped, r.initials, Math.min(threshold, 2));
      const d = Math.min(dFull, dToken, dInit);
      if (Number.isFinite(d) && d <= threshold) {
        scored.push({ r, dist: d });
      }
      }
    }

    scored.sort((a, b) => {
      if (a.dist !== b.dist) return a.dist - b.dist;
      // Tie-breaker: lower ADP or lexical name
      const adpA = getAdp(a.r.player);
      const adpB = getAdp(b.r.player);
      if (adpA !== adpB) return adpA - adpB;
      return a.r.nameLower.localeCompare(b.r.nameLower);
    });

    const out = scored.map(s => s.r.player);
    this.cache.set(cacheKey, out);
    return out;
  }
}

function tokenize(nameLower) {
  // split by non-alphanumeric, drop empties
  return nameLower.split(/[^a-z0-9]+/g).filter(Boolean);
}

function stripNonAlnum(s) {
  return (s || '').replace(/[^a-z0-9]/g, '');
}

function passesDrafted(player, mode) {
  if (mode === 'all') return true;
  if (mode === 'undrafted') return player?.drafted !== true;
  if (mode === 'drafted') return player?.drafted === true;
  return true;
}

function dynamicThreshold(qLen) {
  if (qLen <= 2) return 1;
  if (qLen <= 5) return 2;
  return Math.max(3, Math.ceil(qLen * 0.3));
}

function getAdp(player) {
  // Prefer nested marketData.adp if present
  const adp = player?.marketData?.adp ?? player?.adp;
  return Number.isFinite(adp) ? adp : Number.POSITIVE_INFINITY;
}

// Bounded Levenshtein distance with early exit
function boundedLevenshtein(a, b, maxDist) {
  const lenA = a.length;
  const lenB = b.length;
  if (lenA === 0) return Math.min(lenB, maxDist + 1);
  if (lenB === 0) return Math.min(lenA, maxDist + 1);
  if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1; // Early bound

  const prev = new Array(lenB + 1);
  const curr = new Array(lenB + 1);
  for (let j = 0; j <= lenB; j++) prev[j] = j;

  for (let i = 1; i <= lenA; i++) {
    curr[0] = i;
    // Narrow band around diagonal
    const from = Math.max(1, i - maxDist);
    const to = Math.min(lenB, i + maxDist);
    let rowMin = curr[0];
    for (let j = from; j <= to; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      const sub = prev[j - 1] + cost;
      const val = Math.min(del, ins, sub);
      curr[j] = val;
      if (val < rowMin) rowMin = val;
    }
    // Early exit if row minimum already exceeds bound
    if (rowMin > maxDist) return maxDist + 1;
    // Prepare next iteration
    for (let j = 0; j <= lenB; j++) prev[j] = curr[j] ?? (prev[j] + 1);
  }
  const dist = prev[lenB];
  return dist;
}

/**
 * Compute a simple checksum over results for benchmarking.
 */
export function searchChecksum(results) {
  let sum = 0;
  for (let i = 0; i < results.length; i += 1) {
    sum += results[i].id;
  }
  return sum;
}


