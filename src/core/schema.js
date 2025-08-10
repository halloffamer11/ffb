/**
 * Core data schemas and helpers (JSDoc types, enums, size validation).
 * KISS: compact "packed" player representation for size checks only.
 */

/**
 * Injury status enum mapping (display-only; no calc impact).
 * 0=HEALTHY, 1=Q, 2=D, 3=O, 4=IR, 5=PUP, 6=NA
 */
export const INJURY_STATUS = Object.freeze({
  HEALTHY: 0,
  Q: 1,
  D: 2,
  O: 3,
  IR: 4,
  PUP: 5,
  NA: 6
});

/**
 * Position codes (compact numeric form for packed storage).
 */
export const POSITION_CODE = Object.freeze({
  QB: 0,
  RB: 1,
  WR: 2,
  TE: 3,
  K: 4,
  DST: 5,
  FLEX: 6
});

/**
 * @typedef {Object} PackedPlayer
 * @property {number} i  // id (Uint16)
 * @property {string} n  // name (<= 20 chars typical)
 * @property {number} p  // position code (0-6)
 * @property {string|number} t // team (short code or enum)
 * @property {number} b  // bye week (4-14)
 * @property {number} s  // injury status code (0-6)
 * @property {number} pts // projected points (float)
 */

/**
 * Normalize injury status to enum code.
 * Accepts string keys ("HEALTHY", "Q"...) or numeric codes; defaults to NA.
 * @param {string|number} status
 * @returns {number}
 */
export function normalizeInjuryStatus(status) {
  if (typeof status === 'number' && status >= 0 && status <= 6) return status;
  const key = String(status || '').toUpperCase();
  if (key in INJURY_STATUS) return INJURY_STATUS[key];
  return INJURY_STATUS.NA;
}

/**
 * Convert position string to compact code.
 * @param {string|number} position
 * @returns {number}
 */
export function encodePosition(position) {
  if (typeof position === 'number') return position;
  const key = String(position || '').toUpperCase();
  return POSITION_CODE[key] ?? POSITION_CODE.WR; // default to WR as common
}

/**
 * Create a compact PackedPlayer instance for storage/size validation.
 * @param {Object} input
 * @param {number} input.id
 * @param {string} input.name
 * @param {string|number} input.position
 * @param {string|number} input.team
 * @param {number} input.byeWeek
 * @param {string|number} input.injuryStatus
 * @param {number} input.points
 * @returns {PackedPlayer}
 */
export function createPackedPlayer(input) {
  return {
    i: input.id >>> 0,
    n: String(input.name || '').slice(0, 20),
    p: encodePosition(input.position),
    t: typeof input.team === 'number' ? input.team : String(input.team || '').slice(0, 3),
    b: Math.max(0, Math.min(18, Number(input.byeWeek || 0))),
    s: normalizeInjuryStatus(input.injuryStatus),
    pts: Number.isFinite(input.points) ? Number(input.points) : 0
  };
}

/**
 * Estimate serialized byte length using JSON string length.
 * @param {PackedPlayer} packed
 */
export function estimatePackedPlayerSizeBytes(packed) {
  return JSON.stringify(packed).length;
}

/**
 * Validate packed player is under size limit (default 100 bytes).
 * @param {PackedPlayer} packed
 * @param {number} maxBytes
 */
export function isPackedPlayerUnderSize(packed, maxBytes = 100) {
  return estimatePackedPlayerSizeBytes(packed) < maxBytes;
}


