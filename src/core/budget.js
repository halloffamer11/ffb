/**
 * Budget calculation helpers (T-017)
 * Pure functions that operate on provided inputs; no DOM or storage access.
 */

/**
 * @typedef {Object} LeagueSettings
 * @property {number} teams
 * @property {number} budget
 * @property {{ QB:number, RB:number, WR:number, TE:number, FLEX:number, K:number, DST:number, BENCH:number }} roster
 * @property {Array<{ id:number, team:string, name:string, order:number }>} [owners]
 * @property {Array<{ teamId:number, cost:number }>} [keepers]
 * @property {number} [minBid]
 */

/**
 * @typedef {Object} DraftPick
 * @property {number} playerId
 * @property {number} teamId
 * @property {number} price
 * @property {number} [timestamp]
 */

/**
 * Compute how many total roster spots each team must fill.
 * Falls back to simple sum of starters + bench; FLEX counted as-is.
 * @param {LeagueSettings} settings
 */
export function computeRosterTotalPerTeam(settings) {
  const r = settings?.roster || /** @type any */({});
  const starters = Number(r.QB||0) + Number(r.RB||0) + Number(r.WR||0) + Number(r.TE||0) + Number(r.K||0) + Number(r.DST||0) + Number(r.FLEX||0);
  const bench = Number(r.BENCH||0);
  return Math.max(0, starters + bench);
}

/**
 * Sum keeper costs for a team if present.
 * @param {LeagueSettings} settings
 * @param {number} teamId
 */
export function getKeeperCost(settings, teamId) {
  const list = Array.isArray(settings?.keepers) ? settings.keepers : [];
  let sum = 0;
  for (const k of list) { if (Number(k.teamId) === Number(teamId)) sum += Number(k.cost||0); }
  return sum;
}

/**
 * Sum picked spend for a team.
 * @param {DraftPick[]} picks
 * @param {number} teamId
 */
export function getSpendFromPicks(picks, teamId) {
  let sum = 0;
  for (const p of (Array.isArray(picks) ? picks : [])) {
    if (Number(p.teamId) === Number(teamId)) sum += Number(p.price||0);
  }
  return sum;
}

/**
 * Calculate remaining budget for a team.
 * @param {number} teamId
 * @param {LeagueSettings} settings
 * @param {DraftPick[]} picks
 */
export function calculateRemainingBudget(teamId, settings, picks) {
  const start = Number(settings?.budget || 200);
  const keepers = getKeeperCost(settings, teamId);
  const spent = getSpendFromPicks(picks, teamId);
  return Math.max(0, start - keepers - spent);
}

/**
 * Count roster spots remaining for a team.
 * @param {number} teamId
 * @param {LeagueSettings} settings
 * @param {DraftPick[]} picks
 */
export function countSpotsRemaining(teamId, settings, picks) {
  const totalNeeded = computeRosterTotalPerTeam(settings);
  const filled = (Array.isArray(picks) ? picks : []).filter(p => Number(p.teamId) === Number(teamId)).length;
  return Math.max(0, totalNeeded - filled);
}

/**
 * Calculate maximum single bid allowed while still being able to fill remaining spots
 * at the minimum bid for the rest.
 * @param {number} remainingBudget
 * @param {number} spotsRemaining
 * @param {number} minBid
 */
export function calculateMaxBid(remainingBudget, spotsRemaining, minBid) {
  const b = Math.max(0, Number(remainingBudget||0));
  const s = Math.max(0, Number(spotsRemaining||0));
  const m = Math.max(1, Number(minBid||1));
  if (s <= 1) return b;
  return Math.max(m, b - m * (s - 1));
}

/**
 * Average dollars per remaining roster spot.
 * @param {number} remainingBudget
 * @param {number} spotsRemaining
 */
export function calculateAveragePerSpot(remainingBudget, spotsRemaining) {
  const s = Math.max(1, Number(spotsRemaining||0));
  const b = Math.max(0, Number(remainingBudget||0));
  return b / s;
}

/**
 * Build per-team budget summary across the league.
 * @param {LeagueSettings} settings
 * @param {DraftPick[]} picks
 */
export function computeAllTeamBudgets(settings, picks) {
  const teams = Number(settings?.teams || (settings?.owners?.length || 12));
  const owners = Array.isArray(settings?.owners) ? settings.owners : Array.from({ length: teams }, (_, i) => ({ id: i+1, team: `Team ${i+1}`, name: `Owner ${i+1}`, order: i+1 }));
  const minBid = Number(settings?.minBid ?? 1);
  const rosterTotal = computeRosterTotalPerTeam(settings);
  const rows = [];
  for (let i = 0; i < teams; i += 1) {
    const owner = owners[i] || { id: i+1, team: `Team ${i+1}`, name: `Owner ${i+1}`, order: i+1 };
    const remaining = calculateRemainingBudget(owner.id, settings, picks);
    const spots = countSpotsRemaining(owner.id, settings, picks);
    const spent = Math.max(0, Number(settings?.budget||200) - remaining);
    const maxBid = calculateMaxBid(remaining, spots, minBid);
    const avg = calculateAveragePerSpot(remaining, spots || 1);
    rows.push({
      teamId: owner.id,
      teamName: owner.team || `Team ${owner.id}`,
      ownerName: owner.name || `Owner ${owner.id}`,
      remaining,
      spent,
      spotsRemaining: spots,
      rosterTotal,
      maxBid,
      avgPerSpot: avg
    });
  }
  return rows;
}

/**
 * Generate simple warnings based on budget constraints.
 * @param {{ remaining:number, spotsRemaining:number, maxBid:number, avgPerSpot:number }} row
 * @param {number} minBid
 */
export function budgetAlerts(row, minBid) {
  const alerts = [];
  if (row.spotsRemaining > 0 && row.remaining < minBid * row.spotsRemaining) alerts.push('Cannot fill roster at min bid');
  if (row.maxBid < minBid) alerts.push('Max bid below minimum');
  if (row.avgPerSpot < minBid) alerts.push('Avg $/spot below min');
  return alerts;
}


