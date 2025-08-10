/**
 * Scoring system calculations.
 * - Presets: PPR, HALF, STD
 * - Custom overrides via partial coefficient map
 * - Deterministic pure functions for testability
 */

const PRESETS = Object.freeze({
  PPR: {
    passYdsPerPt: 25,
    passTds: 4,
    passInt: -2,
    rushYdsPerPt: 10,
    rushTds: 6,
    rec: 1,
    recYdsPerPt: 10,
    recTds: 6,
    fumbles: -2
  },
  HALF: {
    passYdsPerPt: 25,
    passTds: 4,
    passInt: -2,
    rushYdsPerPt: 10,
    rushTds: 6,
    rec: 0.5,
    recYdsPerPt: 10,
    recTds: 6,
    fumbles: -2
  },
  STD: {
    passYdsPerPt: 25,
    passTds: 4,
    passInt: -2,
    rushYdsPerPt: 10,
    rushTds: 6,
    rec: 0,
    recYdsPerPt: 10,
    recTds: 6,
    fumbles: -2
  }
});

export function getPreset(name = 'PPR') {
  const key = String(name || 'PPR').toUpperCase();
  return PRESETS[key] || PRESETS.PPR;
}

export function mergeOverrides(base, overrides = {}) {
  const out = { ...base };
  for (const [k, v] of Object.entries(overrides || {})) {
    if (k in out && Number.isFinite(Number(v))) out[k] = Number(v);
  }
  return out;
}

/**
 * Calculate fantasy points for a player's season stats using scoring config.
 * Injury status must NOT affect points (display-only per requirements).
 *
 * @param {Object} stats - season or projection stats
 * @param {Object} config - coefficients from preset + overrides
 * @returns {number}
 */
export function calculatePoints(stats, config) {
  const c = config || PRESETS.PPR;
  const passYds = Number(stats.pass_yds || 0);
  const passTds = Number(stats.pass_tds || 0);
  const passInt = Number(stats.pass_int || 0);
  const rushYds = Number(stats.rush_yds || 0);
  const rushTds = Number(stats.rush_tds || 0);
  const rec = Number(stats.rec || 0);
  const recYds = Number(stats.rec_yds || 0);
  const recTds = Number(stats.rec_tds || 0);
  const fumbles = Number(stats.fumbles || 0);

  const pts =
    (passYds / c.passYdsPerPt) + (passTds * c.passTds) + (passInt * c.passInt) +
    (rushYds / c.rushYdsPerPt) + (rushTds * c.rushTds) +
    (rec * c.rec) + (recYds / c.recYdsPerPt) + (recTds * c.recTds) + (fumbles * c.fumbles);

  return Number.isFinite(pts) ? Number(pts.toFixed(1)) : 0;
}

export function autoConfigure(preset = 'PPR', overrides) {
  return mergeOverrides(getPreset(preset), overrides);
}


