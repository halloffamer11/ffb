import { createStorageAdapter } from '../adapters/storage.js';
import { storeBridge, getStore } from './storeBridge.js';
import { parseQuickEntry, formatPickLogLine, isPlayerAlreadyDrafted } from './draftUtils.js';
import { showToast } from './toast.js';
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
  // Always use store bridge for consistent state
  try {
    return storeBridge.getState();
  } catch {
    return storage.get('state') || { draft: { picks: [] } };
  }
}

function saveState(st) {
  // Deprecated - use storeBridge instead
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
      <label class="ml-2 text-xs">Quick: <input id="quick" type="text" placeholder="team price e.g., 3 25" class="border p-1 rounded w-32" /></label>
      <label class="ml-2 text-xs">Edit Pick # <input id="editIdx" type="number" min="1" value="" class="border p-1 rounded w-16" /></label>
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

  // Legacy iframe message listener
  window.addEventListener('message', (e) => {
    const data = e?.data;
    if (!data || data.type !== 'player.selected') return;
    const pid = data.payload?.id;
    const pname = data.payload?.name;
    handlePlayerSelection(pid, pname);
  });
  
  // Modern cross-widget event listener
  window.addEventListener('player:selected', (e) => {
    if (e.detail.source === 'draft') return; // Ignore our own events
    const player = e.detail.player;
    if (player) {
      handlePlayerSelection(player.id, player.name);
    }
  });
  
  function handlePlayerSelection(pid, pname) {
    let p = null;
    if (pid != null && pid !== '') {
      p = players.find(pp => String(pp.id) === String(pid));
    }
    if (!p && pname) {
      p = players.find(pp => String(pp.name).toLowerCase() === String(pname).toLowerCase());
    }
    if (p) setSelected(p);
  }

  function commitDraft(teamId, pr) {
    if (!selected) { msg.textContent = 'Select a player in Search & Select.'; return; }
    if (!Number.isFinite(pr) || pr < 1) { msg.textContent = 'Enter a valid price.'; return; }
    // Already drafted guard - use store for consistency
    try {
      const stCheck = storeBridge.getState();
      const picksNow = Array.isArray(stCheck?.draft?.picks) ? stCheck.draft.picks : [];
      if (isPlayerAlreadyDrafted(picksNow, selected)) {
        msg.textContent = 'Player already drafted.';
        return;
      }
    } catch {}
    // Enforce roster limits with FLEX + BENCH policy
    try {
      const settings = storage.get('leagueSettings') || {}; const roster = settings.roster || {};
      const stCheck = storeBridge.getState();
      const picksNow = Array.isArray(stCheck?.draft?.picks) ? stCheck.draft.picks : [];
      const myPicks = picksNow.filter(p => Number(p.teamId) === teamId);
      const players = storage.get('players') || [];
      const idToPos = new Map(players.map(p => [String(p.id), String(p.position)]));
      const posCounts = myPicks.reduce((acc, p) => { const pos = idToPos.get(String(p.playerId)) || ''; acc[pos] = (acc[pos]||0)+1; return acc; }, {});
      const targetPos = String(selected.position || '').toUpperCase();
      const posMin = Number(roster[targetPos] || 0);
      const flexSlots = Number(roster.FLEX || 0);
      const benchSlots = Number(roster.BENCH || 0);
      const flexEligible = (targetPos === 'RB' || targetPos === 'WR' || targetPos === 'TE') ? flexSlots : 0;
      const posMax = posMin + flexEligible + benchSlots;
      const cur = Number(posCounts[targetPos] || 0);
      if (posMax > 0 && cur >= posMax) {
        msg.textContent = `Roster limit reached at ${targetPos} (max ${posMax}).`;
        return;
      }
    } catch {}
    // Normalize keys for robust joins (string id + name)
    const pick = { playerId: selected.id, playerName: selected.name, teamId: Number(teamId), price: pr };
    // Always use store bridge for consistency
    try { 
      storeBridge.addPick(pick);
      // Store bridge emits events automatically
    } catch (err) {
      console.error('Failed to add pick via store bridge:', err);
      msg.textContent = 'Error adding pick. Please try again.';
      return;
    }
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
    try { showToast(msg.textContent, 'success', 2000); } catch {}
    // Persistent confirmation line: "R# P# team draft player for $XX"
    try {
      const stNow = storeBridge.getState();
      const totalPicks = Array.isArray(stNow?.draft?.picks) ? stNow.draft.picks.length : 0; // after append
      const teams = Number(settings?.teams || settings?.owners?.length || 12);
      const teamName = settings.owners.find(o => o.id === teamId)?.team || `Team ${teamId}`;
      const line = formatPickLogLine({ overall: totalPicks, teamName, playerName: selected.name, price: pr, teams });
      const div = document.createElement('div');
      div.textContent = line;
      logEl?.prepend(div);
    } catch {}
    // Clear selection
    setSelected(null);
  }

  draftBtn?.addEventListener('click', (e) => {
    const idx = Number((wrapper.querySelector('#editIdx')?.value) || '');
    const teamId = Number(teamSel?.value || 1);
    const pr = Number(price?.value || 1);
    if (Number.isInteger(idx) && idx > 0) {
      const update = { playerId: selected?.id, playerName: selected?.name, teamId, price: pr };
      try { 
        storeBridge.editPick(idx, update); 
        showToast(`Edited pick #${idx}`, 'success', 1500);
        // Store bridge emits events automatically
      } catch (err) {
        console.error('Failed to edit pick:', err);
        msg.textContent = 'Error editing pick. Please try again.';
      }
      setSelected(null);
      const editIdxEl = wrapper.querySelector('#editIdx'); if (editIdxEl) editIdxEl.value = '';
      return;
    }
    commitDraft(teamId, pr);
  });

  // Quick entry: parse when Enter pressed in quick input
  const quick = wrapper.querySelector('#quick');
  quick?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const parsed = parseQuickEntry(quick.value || '');
    if (!parsed) { msg.textContent = 'Quick entry: expected "team price"'; return; }
    teamSel.value = String(parsed.teamId);
    price.value = String(parsed.price);
    commitDraft(parsed.teamId, parsed.price);
    quick.value = '';
  });
}


