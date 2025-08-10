/**
 * Golden dataset integration helpers.
 * - Load small source CSVs and transform into internal records
 * - Generate synthetic base dataset up to N players (e.g., 300)
 * - Export records to CSV for lossless round-trip checks
 */

import { importFromCsvText } from './import.js';
import { normalizeInjuryStatus } from '../core/schema.js';

/**
 * Minimal PPR-ish scoring used only to populate a plausible `points` column
 * for golden datasets before the real scoring module exists.
 */
export function estimatePointsPpr(stats) {
  const passYds = Number(stats.pass_yds || 0);
  const passTds = Number(stats.pass_tds || 0);
  const rushYds = Number(stats.rush_yds || 0);
  const rushTds = Number(stats.rush_tds || 0);
  const rec = Number(stats.rec || 0);
  const recYds = Number(stats.rec_yds || 0);
  const recTds = Number(stats.rec_tds || 0);
  // Common simplified scoring: 1pt per 25 pass yds, 4 per pass TD, 1 per 10 rush/rec yds, 6 per rush/rec TD, 1 per reception
  return (passYds / 25) + (passTds * 4) + (rushYds / 10) + (rushTds * 6) + (rec) + (recYds / 10) + (recTds * 6);
}

/**
 * Merge small source arrays into internal records [{ name, team, position, points, injuryStatus }]
 * Sources can be provided as CSV strings; this function will parse as needed.
 */
export function transformSourcesToInternal({ playerMasterCsv, projectionsSeasonCsv, auctionValuesCsv }) {
  const pm = toObjects(playerMasterCsv);
  const proj = toObjects(projectionsSeasonCsv);
  const auc = toObjects(auctionValuesCsv);

  const projByName = indexBy(proj, 'player_name');
  const aucByName = indexBy(auc, 'player_name');

  const records = [];
  for (const row of pm) {
    const name = row.player_name;
    const position = row.position;
    const team = row.team;
    const stats = projByName[name] || {};
    // If no offensive stats exist (e.g., K, DST, IDP), synthesize minimal points for ordering
    const hasOffense = stats && (Number(stats.pass_yds) || Number(stats.rush_yds) || Number(stats.rec_yds));
    const points = hasOffense ? estimatePointsPpr(stats) : synthesizePointsForNonOffense(position, name);
    const auction = aucByName[name] || {};
    const injuryStatus = normalizeInjuryStatus('HEALTHY');

    records.push({ name, team, position, points: round(points, 1), injuryStatus, auctionValue: Number(auction.auction_value || 0) });
  }
  return records;
}

/**
 * Generate synthetic records to reach targetCount if source-derived records are fewer.
 */
export function padToTargetCount(records, targetCount = 300) {
  const teams = ['KC','SF','BUF','PHI','DAL','MIA','CIN','BAL','DET','GB','MIN','NYJ','LAR','SEA'];
  const positions = ['QB','RB','WR','TE'];
  let nextId = 1;
  const out = records.slice();
  while (out.length < targetCount) {
    const idx = out.length;
    const name = `Player ${idx + 1}`;
    const team = teams[idx % teams.length];
    const position = positions[idx % positions.length];
    const points = Math.max(0, 300 - idx) + (idx % 7) * 0.3;
    out.push({ name, team, position, points: round(points, 1), injuryStatus: 0, auctionValue: 0 });
    nextId += 1;
  }
  return out;
}

/**
 * Export internal records to CSV string.
 */
export function exportRecordsToCsv(records) {
  const header = ['name','team','position','points','injury','auction_value'];
  const rows = [header.join(',')];
  for (const r of records) {
    const name = csvEscape(r.name);
    rows.push([name, r.team, r.position, String(r.points), toInjuryKey(r.injuryStatus), String(r.auctionValue ?? 0)].join(','));
  }
  return rows.join('\n');
}

/**
 * Verify round-trip import using our CSV importer returns the same count and basic fields.
 */
export function roundTripImportCount(csv) {
  const res = importFromCsvText(csv);
  if (!res.ok) return { ok: false, error: 'IMPORT_FAILED', details: res.errors };
  return { ok: true, count: res.records.length };
}

// Helpers
function toObjects(csvTextOrArray) {
  if (!csvTextOrArray) return [];
  if (Array.isArray(csvTextOrArray)) return csvTextOrArray;
  // lightweight CSV to array-of-objects by header
  const lines = String(csvTextOrArray).trim().split(/\r?\n/);
  const header = lines.shift().split(',');
  return lines.filter(Boolean).map(line => {
    const vals = splitCsvLine(line);
    const obj = {};
    for (let i = 0; i < header.length; i += 1) obj[header[i]] = vals[i];
    return obj;
  });
}

function indexBy(arr, key) {
  const map = Object.create(null);
  for (const it of arr) map[it[key]] = it;
  return map;
}

function round(n, d = 1) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

function csvEscape(s) {
  const str = String(s ?? '');
  if (/,|"/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function toInjuryKey(code) {
  // Reverse mapping for our compact schema enum (assumes 0=HEALTHY ... 6=NA)
  const keys = ['HEALTHY','Q','D','O','IR','PUP','NA'];
  return keys[Number(code) | 0] ?? 'NA';
}

function splitCsvLine(line) {
  // Simple splitter for non-nested fields; acceptable for tiny source files here
  const res = [];
  let i = 0; let cur = ''; let inQ = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 2; continue; }
      if (ch === '"') { inQ = false; i += 1; continue; }
      cur += ch; i += 1; continue;
    } else {
      if (ch === '"') { inQ = true; i += 1; continue; }
      if (ch === ',') { res.push(cur); cur = ''; i += 1; continue; }
      cur += ch; i += 1; continue;
    }
  }
  res.push(cur);
  return res;
}

function synthesizePointsForNonOffense(position, name) {
  // Very rough ordering values so K/DST appear reasonable in lists
  if (position === 'K') {
    // Slightly higher for notable names
    if (/tucker/i.test(name)) return 140;
    if (/butker/i.test(name)) return 135;
    return 120;
  }
  if (position === 'DST') {
    if (/49ers|san\s*francisco/i.test(name)) return 120;
    if (/ravens|baltimore/i.test(name)) return 118;
    return 110;
  }
  // IDP placeholders (not primary in this MVP)
  return 50;
}


