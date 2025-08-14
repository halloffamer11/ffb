import { createStorageAdapter } from '../adapters/storage.js';
import { baselineForPosition, calculatePlayerVBD } from '../core/vbd.js';
import { stdDev } from '../core/tiers.js';
import { calculateMaxBid, calculateRemainingBudget, countSpotsRemaining } from '../core/budget.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadSettings() { return storage.get('leagueSettings') || { teams: 12, roster: { QB:1, RB:2, WR:2, TE:1, FLEX:0, K:0, DST:0, BENCH:6 }, minBid: 1 }; }
function loadPlayers() { return storage.get('players') || []; }
function loadState() { return storage.get('state') || { draft: { picks: [] } }; }

function classForValue(v) {
  if (!Number.isFinite(v)) return 'text-slate-500';
  if (v >= 20) return 'text-emerald-700';
  if (v >= 5) return 'text-yellow-700';
  return 'text-rose-700';
}

function injuryBadge(p) {
  const s = String(p?.injuryStatus ?? 'NA').toUpperCase();
  const code = (s === '0' || s === 'HEALTHY') ? 0 : (s === 'Q' || s === '1') ? 1 : (s === 'D' || s === '2') ? 2 : (s === 'O' || s === '3') ? 3 : (s === 'IR' || s === '4') ? 4 : (s === 'PUP' || s === '5') ? 5 : 6;
  const map = {
    0: { label: 'Healthy', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    1: { label: 'Q', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    2: { label: 'D', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    3: { label: 'Out', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    4: { label: 'IR', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    5: { label: 'PUP', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    6: { label: 'NA', cls: 'bg-slate-50 text-slate-600 border-slate-200' }
  };
  const m = map[code] || map[6];
  return `<span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${m.cls}">${m.label}</span>`;
}

function computeBidRecommendation(player, leagueSettings, picks) {
  const me = (storage.get('leagueSettings')?.userTeamId) || 1;
  const remaining = calculateRemainingBudget(me, leagueSettings, picks);
  const spots = countSpotsRemaining(me, leagueSettings, picks);
  const maxBid = calculateMaxBid(remaining, spots, Number(leagueSettings.minBid ?? 1));
  // Conservative: recommend between avg-per-spot and maxBid bounded by VBD signal
  const avg = spots > 0 ? (remaining / spots) : remaining;
  const v = Number(player?.vbd || 0);
  // Scale by VBD tiers: high VBD → closer to max
  const weight = v >= 20 ? 0.9 : v >= 10 ? 0.7 : v >= 5 ? 0.5 : 0.3;
  const rec = Math.max(Number(leagueSettings.minBid ?? 1), Math.min(maxBid, Math.round(avg * (0.8 + weight * 0.4))));
  return { remaining, spots, maxBid, recommended: rec, avgPerSpot: spots > 0 ? (remaining / spots) : remaining };
}

function viewModel(player, players, leagueSettings) {
  if (!player) return null;
  const byPos = players.filter(p => String(p.position||'').toUpperCase() === String(player.position||'').toUpperCase());
  const league = { teams: Number(leagueSettings.teams||12), starters: leagueSettings.roster || {} };
  const withVbd = calculatePlayerVBD(players, league);
  const hasId = player.id != null && player.id !== '';
  const p2 = withVbd.find(p => (hasId ? String(p.id) === String(player.id) : String(p.name).toLowerCase() === String(player.name).toLowerCase())) || player;
  const baseline = baselineForPosition(players, String(player.position||''), league);
  const vbd = Number(p2.vbd || ((Number(p2.points||0)) - baseline));
  const vbdVals = byPos.map(p => p.vbd != null ? Number(p.vbd) : (Number(p.points||0) - baseline));
  const sigma = stdDev(vbdVals);
  const z = sigma > 0 ? (vbd / sigma) : 0;
  const picks = (storage.get('state')?.draft?.picks) || [];
  const bid = computeBidRecommendation({ ...p2, vbd }, leagueSettings, picks);
  return {
    id: p2.id, name: p2.name, team: p2.team, position: p2.position,
    points: Number(p2.points||0), vbd, baseline,
    zScore: Number.isFinite(z) ? Number(z.toFixed(2)) : 0,
    injury: injuryBadge(p2),
    bid
  };
}

function render(container, vm) {
  if (!container) return;
  container.innerHTML = '';
  if (!vm) { container.innerHTML = `<div class="text-slate-500 text-sm">Select a player from Search & Select to see analysis.</div>`; return; }
  const colorCls = classForValue(vm.vbd);
  const el = document.createElement('div');
  el.className = 'w-full h-full text-sm text-slate-800';
  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="font-semibold text-slate-900">${vm.name} <span class="text-slate-500">· ${vm.team} · ${vm.position}</span></div>
      <div>${vm.injury}</div>
    </div>
    <div class="grid grid-cols-2 gap-3 mt-2">
      <div class="rounded border p-2">
        <div class="text-xs text-slate-500">Projected Points</div>
        <div class="text-lg">${vm.points.toFixed(1)}</div>
      </div>
      <div class="rounded border p-2">
        <div class="text-xs text-slate-500">VBD vs Baseline (${vm.position})</div>
        <div class="text-lg font-semibold ${colorCls}">${vm.vbd.toFixed(1)}</div>
      </div>
      <div class="rounded border p-2">
        <div class="text-xs text-slate-500">Baseline Points (${vm.position})</div>
        <div class="text-lg">${vm.baseline.toFixed(1)}</div>
      </div>
      <div class="rounded border p-2">
        <div class="text-xs text-slate-500">Relative Strength (z-score)</div>
        <div class="text-lg">${vm.zScore}</div>
      </div>
    </div>
    <div class="rounded border p-2 mt-3">
      <div class="text-xs text-slate-500">Bid Recommendation</div>
      <div class="text-sm">Recommended: <span class="font-semibold">$${vm.bid.recommended}</span> · Max Bid: <span>$${vm.bid.maxBid}</span> · Remaining: <span>$${vm.bid.remaining}</span> · Avg/Spot: <span>$${vm.bid.avgPerSpot.toFixed(1)}</span></div>
    </div>`;
  container.appendChild(el);
}

export function initAnalysisWidget(container) {
  if (!container) return;
  container.innerHTML = '';
  let selected = null;
  const settings = loadSettings();
  function update() {
    const players = loadPlayers();
    const vm = viewModel(selected, players, settings);
    if (vm) {
      try { console.debug('[analysis] vm', { id: vm.id, name: vm.name, pos: vm.position, vbd: vm.vbd }); } catch {}
    }
    render(container, vm);
  }
  update();
  window.addEventListener('message', (e) => {
    const data = e?.data; if (!data || data.type !== 'player.selected') return;
    const pid = data.payload?.id; const pname = data.payload?.name;
    // Reload players to avoid stale snapshots
    const players = loadPlayers();
    selected = null;
    if (pid != null && pid !== '') {
      selected = players.find(pp => String(pp.id) === String(pid)) || null;
    }
    if (!selected && pname) {
      selected = players.find(pp => String(pp.name).toLowerCase() === String(pname).toLowerCase()) || null;
    }
    try { console.debug('[analysis] selection', { pid, pname, resolved: selected ? { id: selected.id, name: selected.name } : null }); } catch {}
    update();
  });
  window.addEventListener('workspace:players-changed', () => { update(); });
  window.addEventListener('workspace:state-changed', () => { update(); });
}


