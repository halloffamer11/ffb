import { groupRosterByPosition, computeTeamProjection, computeByeConflicts } from '../core/roster.js';
import { createStorageAdapter } from '../adapters/storage.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadSettings() { return storage.get('leagueSettings') || { teams: 12, owners: [{ id:1, team:'Team 1', name:'Owner 1', order:1 }], userTeamId: 1 }; }
function loadPicks() { const s = storage.get('state'); return s?.draft?.picks || []; }
function loadPlayers() { return storage.get('players') || []; }

function statusDisplay(n) {
  const map = {
    0: { label: 'HEALTHY', cls: 'text-emerald-600' },
    1: { label: 'Q', cls: 'text-amber-600' },
    2: { label: 'D', cls: 'text-orange-600' },
    3: { label: 'O', cls: 'text-red-600' },
    4: { label: 'IR', cls: 'text-red-700' },
    5: { label: 'PUP', cls: 'text-red-600' },
    6: { label: 'NA', cls: 'text-slate-400' }
  };
  return map[Number(n)||0] || map[6];
}

function requiredStartersByPos(settings) {
  const r = (settings && settings.roster) || {};
  return { QB: r.QB||0, RB: r.RB||0, WR: r.WR||0, TE: r.TE||0, K: r.K||0, DST: r.DST||0 };
}

function removePick(playerId, teamId) {
  const s = storage.get('state') || { draft: { picks: [] } };
  const picks = Array.isArray(s.draft?.picks) ? s.draft.picks : (s.draft.picks = []);
  const idx = picks.findIndex(p => Number(p.playerId) === Number(playerId) && Number(p.teamId) === Number(teamId));
  if (idx >= 0) {
    const [removed] = picks.splice(idx, 1);
    storage.set('state', s);
    return removed;
  }
  return null;
}

function addPick(pick) {
  const s = storage.get('state') || { draft: { picks: [] } };
  const picks = Array.isArray(s.draft?.picks) ? s.draft.picks : (s.draft.picks = []);
  picks.push({ ...pick, timestamp: pick.timestamp || Date.now() });
  storage.set('state', s);
}

/**
 * Render My Roster panel content
 * @param {HTMLElement} container
 */
export function renderMyRoster(container) {
  if (!container) return;
  const settings = loadSettings();
  const picks = loadPicks();
  const players = loadPlayers();
  const teamId = Number(settings.userTeamId || 1);

  const byPos = groupRosterByPosition(players, picks, teamId);
  const proj = computeTeamProjection(players, picks, teamId);
  const byeConf = computeByeConflicts(players, picks, teamId);
  const req = requiredStartersByPos(settings);

  container.innerHTML = '';
  const header = document.createElement('div');
  const me = (settings.owners || []).find(o => Number(o.id) === Number(settings.userTeamId || 1));
  const teamLabel = me ? `${me.team} (${me.name})` : `Team ${settings.userTeamId || 1}`;
  header.className = 'mb-2 flex items-center justify-between text-sm';
  header.innerHTML = `<div class="text-slate-600"><span class="font-medium">${teamLabel}</span> · Team projection: ${proj.toFixed(1)}</div>
    <button id="undoRemove" class="px-2 py-1 border rounded text-xs">Undo last removal</button>`;
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-2 md:grid-cols-3 gap-3';

  const positions = ['QB','RB','WR','TE','K','DST'];
  for (const pos of positions) {
    const card = document.createElement('div');
    const have = (byPos.get(pos) || []).length;
    const need = req[pos] || 0;
    const needsClass = have < need ? 'text-rose-700' : 'text-slate-600';
    card.className = 'border rounded bg-white';
    const list = byPos.get(pos) || [];
    const body = list.map(p => {
      const st = statusDisplay(p.injuryStatus);
      return `<div class="px-2 py-1 text-sm flex items-center justify-between">
        <span class="flex items-center gap-2">
          <span class="inline-block w-2 h-2 rounded-full ${st.cls}" title="${st.label}"></span>
          <span>${p.name}</span>
        </span>
        <span class="text-xs text-slate-500 flex items-center gap-2">
          <span>${p.points?.toFixed?.(1) ?? ''}</span>
          <button class="btn-remove px-2 py-0.5 border rounded" data-player="${p.id}" data-team="${teamId}">Remove</button>
        </span>
      </div>`;
    }).join('');
    card.innerHTML = `<div class="px-2 py-1 border-b font-medium flex items-center justify-between">
        <span>${pos}</span>
        <span class="text-xs ${needsClass}">${have}/${need}</span>
      </div>
      <div>${body || '<div class="px-2 py-3 text-slate-400 text-sm">—</div>'}</div>`;
    grid.appendChild(card);
  }

  container.appendChild(grid);

  if (byeConf.size) {
    const box = document.createElement('div');
    box.className = 'mt-3 text-xs text-amber-700';
    const items = Array.from(byeConf.entries()).map(([w, c]) => `Week ${w}: ${c}`).join(', ');
    box.textContent = `Bye conflicts: ${items}`;
    container.appendChild(box);
  }

  // Wire removal and undo
  let lastRemoved = null;
  container.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (t && t.matches('button.btn-remove')) {
      const playerId = Number(t.getAttribute('data-player'));
      const teamIdAttr = Number(t.getAttribute('data-team'));
      lastRemoved = removePick(playerId, teamIdAttr);
      renderMyRoster(container);
    }
    if (t && t.id === 'undoRemove' && lastRemoved) {
      addPick(lastRemoved);
      lastRemoved = null;
      renderMyRoster(container);
    }
  }, { once: false });
}

export function attachRosterAutoRefresh(container, intervalMs = 1000) {
  let timer = null;
  function tick() { renderMyRoster(container); }
  function start() { if (timer) return; timer = setInterval(tick, intervalMs); }
  function stop() { if (!timer) return; clearInterval(timer); timer = null; }
  renderMyRoster(container);
  start();
  // Also react immediately to state/player changes
  const onState = () => renderMyRoster(container);
  window.addEventListener('workspace:state-changed', onState);
  window.addEventListener('workspace:players-changed', onState);
  window.addEventListener('storage', (e) => {
    try {
      if (!e) return; const k = String(e.key || '');
      if (k.includes('workspace::state') || k.includes('workspace::players')) renderMyRoster(container);
    } catch {}
  });
  return { start, stop };
}


