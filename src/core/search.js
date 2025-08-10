/**
 * Basic case-insensitive substring search with trivial caching for benchmarking.
 * Player shape: { id, name, team, position }
 */

export class BasicSearch {
  constructor(players) {
    this.players = players;
    this.cache = new Map();
  }

  search(query) {
    const q = (query || '').toLowerCase();
    if (this.cache.has(q)) return this.cache.get(q);
    if (!q) return [];

    const result = this.players.filter(p => p.name.toLowerCase().includes(q));
    this.cache.set(q, result);
    return result;
  }
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


