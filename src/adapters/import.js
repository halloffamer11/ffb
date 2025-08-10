/**
 * CSV Import with Validation
 * - Robust-enough CSV parser for common cases (commas, quotes, CRLF, BOM)
 * - Header mapping with synonyms to internal fields
 * - Row normalization with numeric validation
 * - Detailed error reporting with row/column indices
 * - Injury status normalization via core schema
 */

import { normalizeInjuryStatus } from '../core/schema.js';

/**
 * Parse CSV text into rows of string arrays.
 * Handles: \r, \n, \r\n newlines, quoted fields with escaped quotes ("").
 * Returns { ok: true, rows } or { ok: false, error }.
 *
 * @param {string|Uint8Array} input
 */
export function parseCsv(input) {
  let text = toText(input);
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rows = [];
  const len = text.length;
  let i = 0;
  let row = [];
  let field = '';
  let inQuotes = false;

  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        // End quote
        inQuotes = false; i += 1; continue;
      } else {
        field += ch; i += 1; continue;
      }
    } else {
      if (ch === '"') { inQuotes = true; i += 1; continue; }
      if (ch === ',') { row.push(field); field = ''; i += 1; continue; }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 1; continue; }
      if (ch === '\r') {
        // Support CRLF and lone CR
        if (text[i + 1] === '\n') { i += 2; } else { i += 1; }
        row.push(field); rows.push(row); row = []; field = ''; continue;
      }
      field += ch; i += 1; continue;
    }
  }
  // end of text
  if (inQuotes) {
    return { ok: false, error: 'UNCLOSED_QUOTE' };
  }
  // push last field/row if any content present
  if (field.length > 0 || row.length > 0) {
    row.push(field); rows.push(row);
  }
  return { ok: true, rows };
}

/** Header mapping synonyms (case-insensitive) */
const HEADER_SYNONYMS = {
  name: ['name', 'player', 'player_name', 'player name'],
  team: ['team', 'tm'],
  position: ['position', 'pos'],
  points: ['points', 'projpts', 'projected_points', 'proj_points', 'proj pts'],
  injuryStatus: ['injury', 'injury_status', 'status']
};

const REQUIRED_FIELDS = ['name', 'team', 'position', 'points'];

/**
 * Detect column mapping from header row to internal fields using synonyms.
 * Returns: { ok: true, mapping: { internalField: columnIndex } } or { ok:false, missing:[...] }
 */
export function detectColumnMapping(headerRow) {
  const lower = headerRow.map(c => String(c || '').trim().toLowerCase());
  const mapping = {};

  for (const [internal, syns] of Object.entries(HEADER_SYNONYMS)) {
    for (let colIdx = 0; colIdx < lower.length; colIdx += 1) {
      const col = lower[colIdx];
      if (syns.includes(col)) { mapping[internal] = colIdx; break; }
    }
  }

  const missing = REQUIRED_FIELDS.filter(f => !(f in mapping));
  if (missing.length) return { ok: false, missing };
  return { ok: true, mapping };
}

/**
 * Normalize one CSV row according to mapping. Returns { ok, value } or { ok:false, error, rowIndex, col }
 */
export function normalizeRow(row, mapping, rowIndex) {
  const get = (field) => row[mapping[field]] ?? '';
  const name = String(get('name')).trim();
  const team = String(get('team')).trim();
  const position = String(get('position')).trim();
  const pointsRaw = String(get('points')).trim();
  if (!name || !team || !position) {
    return { ok: false, error: 'MISSING_REQUIRED_VALUE', rowIndex };
  }
  const points = Number(pointsRaw);
  if (!Number.isFinite(points)) {
    return { ok: false, error: 'INVALID_NUMBER', rowIndex, col: mapping.points };
  }
  let injuryStatusCode = undefined;
  if (mapping.injuryStatus != null) {
    injuryStatusCode = normalizeInjuryStatus(row[mapping.injuryStatus]);
  }
  return {
    ok: true,
    value: {
      name,
      team,
      position,
      points,
      injuryStatus: injuryStatusCode
    }
  };
}

/**
 * Import CSV text and return normalized records with validation.
 * Returns { ok: true, records, header, sample } or { ok: false, errors }.
 */
export function importFromCsvText(input) {
  const parsed = parseCsv(input);
  if (!parsed.ok) return { ok: false, errors: [{ error: parsed.error }] };
  if (parsed.rows.length === 0) return { ok: false, errors: [{ error: 'EMPTY_FILE' }] };
  const header = parsed.rows[0];
  const mapRes = detectColumnMapping(header);
  if (!mapRes.ok) return { ok: false, errors: [{ error: 'MISSING_COLUMNS', missing: mapRes.missing }] };

  const mapping = mapRes.mapping;
  const errors = [];
  const records = [];
  for (let r = 1; r < parsed.rows.length; r += 1) {
    const row = parsed.rows[r];
    if (row.length === 1 && String(row[0]).trim() === '') continue; // skip blank lines
    const norm = normalizeRow(row, mapping, r);
    if (!norm.ok) { errors.push(norm); continue; }
    records.push(norm.value);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, header, records, sample: records.slice(0, 5) };
}

// Helpers
function toText(input) {
  if (typeof input === 'string') return input;
  if (input instanceof Uint8Array) {
    if (typeof TextDecoder !== 'undefined') {
      return new TextDecoder('utf-8', { fatal: false }).decode(input);
    }
    // Fallback: naive conversion
    return Array.from(input).map(c => String.fromCharCode(c)).join('');
  }
  return String(input ?? '');
}


