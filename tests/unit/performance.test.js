/* Minimal Node-based smoke performance checks.
 * Not a precise benchmark harness, but catches gross regressions.
 */

import { vbdChecksum } from '../../src/core/vbd.js';
import { BasicSearch, searchChecksum } from '../../src/core/search.js';
import fs from 'node:fs';
import path from 'node:path';

function loadCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const cols = header.split(',');
  return lines.map(line => {
    const vals = line.split(',');
    const row = {};
    for (let i = 0; i < cols.length; i += 1) {
      row[cols[i]] = vals[i];
    }
    return row;
  });
}

function toPlayers(rows) {
  return rows.map((r, idx) => ({
    id: idx + 1,
    name: r.name,
    team: r.team,
    position: r.position,
    points: Number(r.points)
  }));
}

function nowMs() {
  const hr = process.hrtime.bigint();
  return Number(hr) / 1e6;
}

const datasetPath = path.resolve('demos/data/T-000_300_players.csv');

try {
  fs.mkdirSync(path.dirname(datasetPath), { recursive: true });
} catch {}

// Generate dataset once if not present
if (!fs.existsSync(datasetPath)) {
  const teams = ['KC','SF','BUF','PHI','DAL','MIA','CIN','BAL','DET','GB'];
  const positions = ['QB','RB','WR','TE'];
  const rows = ['name,team,position,points'];
  for (let i = 0; i < 300; i += 1) {
    const name = `Player ${i + 1}`;
    const team = teams[i % teams.length];
    const position = positions[i % positions.length];
    const points = (300 - i) + (i % 7) * 0.3;
    rows.push([name, team, position, points.toFixed(1)].join(','));
  }
  fs.writeFileSync(datasetPath, rows.join('\n'));
}

const rows = loadCsv(datasetPath);
const players = toPlayers(rows);

const leagueSettings = {
  teams: 12,
  starters: { QB: 1, RB: 2, WR: 2, TE: 1 }
};

function assertOkay(name, condition, details) {
  if (!condition) {
    console.error(`FAIL: ${name}`, details || '');
    process.exitCode = 1;
  } else {
    console.log(`OK: ${name}`);
  }
}

// VBD timing (<100ms target for 300 players)
{
  const t0 = nowMs();
  const checksum = vbdChecksum(players, leagueSettings);
  const t1 = nowMs();
  assertOkay('VBD <100ms', (t1 - t0) < 100, { durationMs: (t1 - t0), checksum });
}

// Search timing (<50ms target)
{
  const search = new BasicSearch(players);
  const t0 = nowMs();
  const res = search.search('player 2');
  const checksum = searchChecksum(res);
  const t1 = nowMs();
  assertOkay('Search <50ms', (t1 - t0) < 50, { durationMs: (t1 - t0), checksum, count: res.length });
}

// localStorage and workspace timings are browser-only; covered by in-browser runner.


