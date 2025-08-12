import { createStorageAdapter } from '../adapters/storage.js';
// Draft widget relies on Search & Select widget for player selection

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadSettings() {
  const s = storage.get('leagueSettings') || { teams: 12, owners: [] };
  if (!Array.isArray(s.owners) || s.owners.length !== (s.teams || 12)) {
    const list = [];
    const t = Number(s.teams || 12);
    for (let i = 1; i <= t; i += 1) list.push({ id: i, team: `Team ${i}`, name: `Owner ${i}`, order: i });
    s.owners = list;
  }
  return s;
}

function loadPlayers() {
  return storage.get('players') || [];
}

function loadState() {
  return storage.get('state') || { draft: { picks: [] } };
}

function saveState(st) {
  storage.set('state', st);
}

function formatPlayer(p) {
  const inj = p.injuryStatus != null ? String(p.injuryStatus) : '';
  return `${p.name} · ${p.team} · ${p.position}${inj !== '' ? ` · s${inj}` : ''}`;
}

/**
 * Initialize Draft widget into a container element.
 * @param {HTMLElement} container
 */
export function initDraftWidget(container) {
  if (!container) return;
  container.innerHTML = '';

  const settings = loadSettings();
  const players = loadPlayers();
  let selected = null;

  const wrapper = document.createElement('div');
  wrapper.className = 'w-full h-full p-2 flex flex-col gap-2 text-sm';
  wrapper.innerHTML = `
    <div class="flex items-center gap-2">
      <div class="text-xs text-slate-600">Selected:</div>
      <div id="sel" class="text-sm font-medium text-slate-800">—</div>
      <button id="clearSel" class="px-2 py-1 border rounded text-xs">Clear</button>
    </div>
    <div class="flex items-center gap-2">
      <label class="flex items-center gap-1">Team
        <select id="teamSel" class="border p-1 rounded">
          ${settings.owners.map(o => `<option value="${o.id}">${o.team} (${o.name})</option>`).join('')}
        </select>
      </label>
      <label class="flex items-center gap-1">Price
        <input id="price" type="number" min="1" value="1" class="border p-1 rounded w-20" />
      </label>
      <button id="draftBtn" class="px-3 py-2 rounded bg-blue-600 text-white">Draft</button>
      <span id="msg" class="text-xs text-slate-500"></span>
    </div>
    <div id="log" class="mt-2 text-xs text-slate-700 bg-slate-50 border rounded p-2 h-20 overflow-auto"></div>
    ${players.length ? '' : '<div class="text-amber-700 text-xs">No players in workspace. Load data via Data Management.</div>'}
  `;
  container.appendChild(wrapper);

  const selEl = wrapper.querySelector('#sel');
  const clearSel = wrapper.querySelector('#clearSel');
  const teamSel = wrapper.querySelector('#teamSel');
  const price = wrapper.querySelector('#price');
  const draftBtn = wrapper.querySelector('#draftBtn');
  const msg = wrapper.querySelector('#msg');
  const logEl = wrapper.querySelector('#log');

  // Default drafting team to the user's team
  try {
    const s = loadSettings();
    if (teamSel && s?.userTeamId != null) {
      teamSel.value = String(s.userTeamId);
    }
  } catch {}

  function setSelected(p) {
    selected = p || null;
    selEl.textContent = p ? formatPlayer(p) : '—';
    msg.textContent = '';
  }

  clearSel?.addEventListener('click', () => setSelected(null));

  // Listen to selection events from Search & Select widget (home base)
  window.addEventListener('message', (e) => {
    const data = e?.data;
    if (!data || data.type !== 'player.selected') return;
    const pid = data.payload?.id;
    const pname = data.payload?.name;
    let p = null;
    if (pid != null && pid !== '') {
      p = players.find(pp => String(pp.id) === String(pid));
    }
    if (!p && pname) {
      p = players.find(pp => String(pp.name).toLowerCase() === String(pname).toLowerCase());
    }
    if (p) setSelected(p);
  });

  draftBtn?.addEventListener('click', () => {
    const teamId = Number(teamSel?.value || 1);
    const pr = Number(price?.value || 1);
    if (!selected) { msg.textContent = 'Select a player in Search & Select.'; return; }
    if (!Number.isFinite(pr) || pr < 1) { msg.textContent = 'Enter a valid price.'; return; }
    // Enforce position/roster limits
    try {
      const settings = storage.get('leagueSettings') || {}; const roster = settings.roster || {};
      const owners = settings.owners || []; const teams = Number(settings.teams || owners.length || 12);
      const stCheck = storage.get('state') || { draft: { picks: [] } };
      const picksNow = Array.isArray(stCheck?.draft?.picks) ? stCheck.draft.picks : [];
      const myPicks = picksNow.filter(p => Number(p.teamId) === teamId);
      const players = storage.get('players') || [];
      const idToPos = new Map(players.map(p => [String(p.id), String(p.position)]));
      const myPosCounts = myPicks.reduce((acc, p) => { const pos = idToPos.get(String(p.playerId)) || ''; acc[pos] = (acc[pos]||0)+1; return acc; }, {});
      const targetPos = String(selected.position || '');
      const limit = Number(roster[targetPos] || 0) + (targetPos === 'FLEX' ? 0 : 0); // Simple: ignore FLEX allocation here
      if (limit > 0 && (myPosCounts[targetPos] || 0) >= limit) {
        msg.textContent = `Roster full at ${targetPos} (${limit}).`;
        return;
      }
    } catch {}
    const st = loadState();
    st.draft = st.draft || { picks: [] };
    // Normalize keys for robust joins (string id + name)
    const pick = { playerId: selected.id, playerName: selected.name, teamId: Number(teamId), price: pr, timestamp: Date.now() };
    st.draft.picks.push(pick);
    saveState(st);
    // Notify in-app listeners (widgets) immediately
    try { window.dispatchEvent(new CustomEvent('workspace:state-changed')); } catch {}
    // Also mark player as drafted in workspace players to keep Search UI in sync
    try {
      const all = storage.get('players') || [];
      let idx = -1;
      // Prefer ID match when present
      if (selected && selected.id != null && selected.id !== '') {
        idx = all.findIndex(p => String(p.id) === String(selected.id));
      }
      // Fallback to case-insensitive name match
      if (idx < 0) {
        const targetName = String(selected?.name || '').toLowerCase();
        idx = all.findIndex(p => String(p.name || '').toLowerCase() === targetName);
      }
      if (idx >= 0) {
        all[idx] = { ...all[idx], drafted: true };
        storage.set('players', all);
      }
    } catch {}
    // Notify players-changed as well for any widgets relying on player flags
    try { window.dispatchEvent(new CustomEvent('workspace:players-changed')); } catch {}
    msg.textContent = `Drafted ${selected.name} for $${pr} to ${settings.owners.find(o => o.id === teamId)?.team || 'Team ' + teamId}`;
    // Persistent confirmation line: "R# P# team draft player for $XX"
    try {
      const totalPicks = st.draft.picks.length; // after append
      const teams = Number(settings?.teams || settings?.owners?.length || 12);
      const round = Math.ceil(totalPicks / teams);
      const pickInRound = ((totalPicks - 1) % teams) + 1;
      const teamName = settings.owners.find(o => o.id === teamId)?.team || `Team ${teamId}`;
      const line = `[#${totalPicks} R${round} P${pickInRound}] ${teamName} draft ${selected.name} for $${pr}`;
      const div = document.createElement('div');
      div.textContent = line;
      logEl?.prepend(div);
    } catch {}
    // Clear selection
    setSelected(null);
  });
}


