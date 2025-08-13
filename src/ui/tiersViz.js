import { createStorageAdapter } from '../adapters/storage.js';
import { calculatePlayerVBD } from '../core/vbd.js';
import { computeTiers } from '../core/tiers.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadSettings() { return storage.get('leagueSettings') || { teams: 12, roster: { QB:1, RB:2, WR:2, TE:1, FLEX:0, K:0, DST:0, BENCH:6 } }; }
function loadPlayers() { return storage.get('players') || []; }
function loadState() { return storage.get('state') || { draft: { picks: [] } }; }

function groupByPosition(arr) {
  const map = new Map();
  for (const p of arr) {
    const k = String(p.position||'').toUpperCase();
    map.set(k, (map.get(k) || []).concat([p]));
  }
  return map;
}

function colorForTier(idx) {
  return idx === 0 ? 'bg-emerald-50 border-emerald-200' : idx === 1 ? 'bg-yellow-50 border-yellow-200' : idx === 2 ? 'bg-orange-50 border-orange-200' : 'bg-rose-50 border-rose-200';
}

function render(container, tiersMap) {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full h-full text-sm text-slate-800';
  const positions = ['QB','RB','WR','TE','DST','K'];
  positions.forEach(pos => {
    const info = tiersMap.get(pos);
    const sec = document.createElement('div');
    sec.className = 'mb-3';
    const hdr = document.createElement('div');
    hdr.className = 'text-xs font-medium text-slate-600 mb-1';
    hdr.textContent = `Position ${pos}`;
    sec.appendChild(hdr);
    if (!info || !Array.isArray(info.tiers) || info.tiers.length === 0) {
      const p = document.createElement('div');
      p.className = 'text-slate-500 text-xs';
      p.textContent = 'No players or all drafted';
      sec.appendChild(p);
      wrapper.appendChild(sec);
      return;
    }
    const row = document.createElement('div');
    row.className = 'flex flex-wrap gap-2';
    info.tiers.forEach((tier, tIdx) => {
      const box = document.createElement('div');
      box.className = `border rounded ${colorForTier(tIdx)} px-2 py-1`;
      const names = tier.map(p => p.name).slice(0, 10).join(', ');
      const untilDrop = tier.length; // players until next drop-off
      box.innerHTML = `<div class="text-xs"><span class="font-semibold">T${tIdx+1}</span> • ${untilDrop} until drop</div><div class="text-[11px] text-slate-700 truncate max-w-[22rem]">${names}</div>`;
      row.appendChild(box);
    });
    sec.appendChild(row);
    wrapper.appendChild(sec);
  });
  container.appendChild(wrapper);
}

export function initTiersWidget(container) {
  if (!container) return;
  function recompute() {
    const settings = loadSettings();
    const players = loadPlayers();
    const league = { teams: Number(settings.teams||12), starters: settings.roster || {} };
    const undrafted = players.filter(p => !p.drafted);
    const withVbd = calculatePlayerVBD(undrafted, league);
    const map = groupByPosition(withVbd);
    const tiersMap = computeTiers(map);
    render(container, tiersMap);
  }
  recompute();
  window.addEventListener('workspace:players-changed', recompute);
  window.addEventListener('workspace:state-changed', recompute);
}


