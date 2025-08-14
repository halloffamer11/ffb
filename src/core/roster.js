/**
 * Roster aggregation helpers (T-018)
 * Pure functions over workspace-like inputs.
 */

/**
 * Group drafted players by position for a specific team.
 * @param {Array<{ id:number, name:string, position:string, team:string, byeWeek?:number, injuryStatus?:number, drafted?:boolean }>} players
 * @param {Array<{ playerId:number, teamId:number, price:number }>} picks
 * @param {number} teamId
 */
function playerKey(p) {
  return String(p?.id ?? p?.name ?? '').toLowerCase();
}
function pickKey(p) {
  return String(p?.playerId ?? p?.playerName ?? '').toLowerCase();
}

export function groupRosterByPosition(players, picks, teamId) {
  const draftedByTeam = new Set(
    (Array.isArray(picks) ? picks : [])
      .filter(p => Number(p.teamId) === Number(teamId))
      .map(p => pickKey(p))
  );
  const map = new Map(); // pos -> players
  for (const p of (Array.isArray(players) ? players : [])) {
    if (!draftedByTeam.has(playerKey(p))) continue;
    const list = map.get(p.position) || [];
    list.push(p);
    map.set(p.position, list);
  }
  // sort within position by name
  for (const [pos, list] of map.entries()) {
    list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    map.set(pos, list);
  }
  return map;
}

/**
 * Compute simple team projection = sum of player.points (already scored by scoring engine)
 * @param {Array<{ id:number, points?:number }>} players
 * @param {Array<{ playerId:number, teamId:number }>} picks
 * @param {number} teamId
 */
export function computeTeamProjection(players, picks, teamId) {
  const draftedByTeam = new Set(
    (Array.isArray(picks) ? picks : [])
      .filter(p => Number(p.teamId) === Number(teamId))
      .map(p => pickKey(p))
  );
  let sum = 0;
  for (const p of (Array.isArray(players) ? players : [])) {
    if (draftedByTeam.has(playerKey(p))) sum += Number(p.points || 0);
  }
  return sum;
}

/**
 * Identify bye week conflicts: returns a map of week -> count for weeks with >=2 players
 * @param {Array<{ id:number, byeWeek?:number }>} players
 * @param {Array<{ playerId:number, teamId:number }>} picks
 * @param {number} teamId
 */
export function computeByeConflicts(players, picks, teamId) {
  const draftedByTeam = new Set(
    (Array.isArray(picks) ? picks : [])
      .filter(p => Number(p.teamId) === Number(teamId))
      .map(p => pickKey(p))
  );
  const weekCounts = new Map();
  for (const p of (Array.isArray(players) ? players : [])) {
    if (!draftedByTeam.has(playerKey(p))) continue;
    const w = Number(p.byeWeek || 0);
    if (!Number.isFinite(w) || w <= 0) continue;
    weekCounts.set(w, (weekCounts.get(w) || 0) + 1);
  }
  const conflicts = new Map();
  for (const [w, c] of weekCounts.entries()) { if (c >= 2) conflicts.set(w, c); }
  return conflicts;
}


