/**
 * Draft UI helpers (pure)
 */

/**
 * Parse quick entry text like "3 25" or "team:3 price:25" into parts.
 * @param {string} text
 * @returns {{ teamId:number, price:number }|null}
 */
export function parseQuickEntry(text) {
  const s = String(text || '').trim();
  if (s === '') return null;
  // Accept two numbers separated by space or comma
  const m = s.match(/(\d+)[,\s]+(\d+)/);
  if (m) {
    const teamId = Number(m[1]);
    const price = Number(m[2]);
    if (Number.isFinite(teamId) && Number.isFinite(price)) return { teamId, price };
  }
  // Accept key:value pairs in any order
  const parts = Object.fromEntries(s.split(/[\s,]+/).map(tok => {
    const kv = tok.split(':');
    return [kv[0].toLowerCase(), kv[1]];
  }));
  const t = Number(parts.team ?? parts.t ?? parts.teamid);
  const p = Number(parts.price ?? parts.p ?? parts.bid);
  if (Number.isFinite(t) && Number.isFinite(p)) return { teamId: t, price: p };
  return null;
}

/**
 * Compute round and pick-in-round for an overall index (1-based).
 * @param {number} overall 1-based overall pick index
 * @param {number} teams number of teams
 */
export function computeRoundAndPick(overall, teams) {
  const t = Math.max(1, Number(teams || 1));
  const o = Math.max(1, Number(overall || 1));
  const round = Math.ceil(o / t);
  const pickInRound = ((o - 1) % t) + 1;
  return { round, pickInRound };
}

/**
 * Format a log line for a draft pick.
 * @param {{ overall:number, teamName:string, playerName:string, price:number, teams:number }} ctx
 */
export function formatPickLogLine(ctx) {
  const { round, pickInRound } = computeRoundAndPick(ctx.overall, ctx.teams);
  return `[#${ctx.overall} R${round} P${pickInRound}] ${ctx.teamName} draft ${ctx.playerName} for $${ctx.price}`;
}

/**
 * Determine if a player is already drafted given current picks.
 * @param {Array<{ playerId?:number|string, playerName?:string }>} picks
 * @param {{ id?:number|string, name?:string }} player
 */
export function isPlayerAlreadyDrafted(picks, player) {
  if (!player) return false;
  const idKey = player.id != null ? String(player.id) : null;
  const nameKey = player.name != null ? String(player.name).toLowerCase() : null;
  return (Array.isArray(picks) ? picks : []).some(p => {
    if (idKey != null && p.playerId != null && String(p.playerId) === idKey) return true;
    if (nameKey != null && p.playerName != null && String(p.playerName).toLowerCase() === nameKey) return true;
    return false;
  });
}


