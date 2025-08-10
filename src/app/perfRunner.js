import { vbdChecksum } from '../core/vbd.js';
import { BasicSearch, searchChecksum } from '../core/search.js';

function msNow() {
  return performance.now();
}

function generatePlayers(count = 300) {
  const teams = ['KC','SF','BUF','PHI','DAL','MIA','CIN','BAL','DET','GB'];
  const positions = ['QB','RB','WR','TE'];
  const players = [];
  for (let i = 0; i < count; i += 1) {
    players.push({
      id: i + 1,
      name: `Player ${i + 1}`,
      team: teams[i % teams.length],
      position: positions[i % positions.length],
      points: (count - i) + (i % 7) * 0.3
    });
  }
  return players;
}

export class PerformanceBenchmark {
  static runAll() {
    const results = {};
    results.search = this.testSearch();
    results.vbd = this.testVBD();
    results.ui = this.testUIUpdate();
    results.workspace = this.testWorkspace();
    console.table(results);
    return results;
  }

  static testSearch() {
    const players = generatePlayers(300);
    const search = new BasicSearch(players);
    const t0 = msNow();
    const res = search.search('player 2');
    const t1 = msNow();
    return { durationMs: +(t1 - t0).toFixed(2), count: res.length, checksum: searchChecksum(res) };
  }

  static testVBD() {
    const players = generatePlayers(300);
    const settings = { teams: 12, starters: { QB: 1, RB: 2, WR: 2, TE: 1 } };
    const t0 = msNow();
    const checksum = vbdChecksum(players, settings);
    const t1 = msNow();
    return { durationMs: +(t1 - t0).toFixed(2), checksum };
  }

  static testUIUpdate() {
    // Approximate UI frame timing baseline using requestAnimationFrame
    const t0 = msNow();
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        const t1 = msNow();
        resolve({ frameMs: +(t1 - t0).toFixed(2) });
      });
    });
  }

  static testWorkspace() {
    // Simulate workspace JSON stringify timing
    const data = { version: '1.0.0', players: generatePlayers(300), league: {}, draftState: {} };
    const t0 = msNow();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const t1 = msNow();
    // Avoid unused var elimination
    if (!blob) console.warn('blob not created');
    return { saveMs: +(t1 - t0).toFixed(2) };
  }
}

// Expose to window for manual run: PerformanceBenchmark.runAll()
window.PerformanceBenchmark = PerformanceBenchmark;


