/**
 * Value-Based Drafting (VBD) calculation utilities.
 * Minimal implementation for performance benchmarking.
 *
 * Player shape expected by these helpers:
 * { id: number, name: string, position: string, team: string, points: number }
 */

/**
 * Calculate VBD baselines per position using league settings.
 * Baseline rank per position = teams * startersPerPosition.
 */
export function calculateBaselines(players, leagueSettings) {
  const { teams, starters } = leagueSettings;
  const playersByPosition = new Map();

  for (const player of players) {
    const list = playersByPosition.get(player.position) || [];
    list.push(player);
    playersByPosition.set(player.position, list);
  }

  const baselines = new Map();
  for (const [position, list] of playersByPosition.entries()) {
    list.sort((a, b) => b.points - a.points);
    const startersRequired = starters[position] ?? 0;
    const baselineIndex = Math.max(0, Math.min(list.length - 1, teams * startersRequired - 1));
    const baselinePoints = list.length === 0 ? 0 : list[baselineIndex]?.points ?? 0;
    baselines.set(position, baselinePoints);
  }

  return baselines;
}

/**
 * Calculate VBD values for all players, returning a new array with { ...player, vbd }.
 */
export function calculatePlayerVBD(players, leagueSettings) {
  const baselines = calculateBaselines(players, leagueSettings);
  return players.map(p => ({ ...p, vbd: (p.points ?? 0) - (baselines.get(p.position) ?? 0) }));
}

/**
 * Convenience method for benchmarking: compute VBD and return a checksum to ensure work is not optimized away.
 */
export function vbdChecksum(players, leagueSettings) {
  const withVbd = calculatePlayerVBD(players, leagueSettings);
  let sum = 0;
  for (let i = 0; i < withVbd.length; i += 1) {
    sum += withVbd[i].vbd;
  }
  return sum;
}

/** Baseline helper for a single position */
export function baselineForPosition(players, position, leagueSettings) {
  const { teams, starters } = leagueSettings;
  const list = players.filter(p => p.position === position).sort((a, b) => b.points - a.points);
  const idx = Math.max(0, Math.min(list.length - 1, teams * (starters[position] ?? 0) - 1));
  return list.length === 0 ? 0 : (list[idx]?.points ?? 0);
}


