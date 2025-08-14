import { createStorageAdapter } from '../adapters/storage.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadSettings() { return storage.get('leagueSettings') || { teams: 12, owners: [] }; }
function loadState() { return storage.get('state') || { draft: { picks: [] } }; }

function findOwnerName(owners, teamId) {
  const o = (owners || []).find(x => Number(x.id) === Number(teamId));
  return o ? (o.team || `Team ${o.id}`) : `Team ${teamId}`;
}

export function initLedgerWidget(container) {
  if (!container) return;
  container.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'w-full h-full p-2 text-xs';
  wrap.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <div class="font-medium text-slate-700">Draft History</div>
      <div class="flex items-center gap-2">
        <button id="undoBtn" class="px-2 py-1 border rounded text-xs">Undo</button>
        <button id="redoBtn" class="px-2 py-1 border rounded text-xs">Redo</button>
      </div>
    </div>
    <div id="ledger" class="h-[calc(100%-36px)] overflow-auto border rounded bg-white"></div>`;
  container.appendChild(wrap);

  const ledgerEl = wrap.querySelector('#ledger');
  const undoBtn = wrap.querySelector('#undoBtn');
  const redoBtn = wrap.querySelector('#redoBtn');

  function render() {
    const settings = loadSettings();
    const owners = settings.owners || [];
    const st = loadState();
    const picks = Array.isArray(st?.draft?.picks) ? st.draft.picks : [];
    const teams = Number(settings?.teams || owners.length || 12);
    // Build player id->name map (skip undefined ids to avoid a single shared key)
    const idToName = new Map();
    try {
      const pRaw = window.localStorage.getItem('workspace::players');
      const arr = pRaw ? JSON.parse(pRaw) : [];
      for (const pp of (Array.isArray(arr) ? arr : [])) {
        if (pp != null && pp.id != null) idToName.set(String(pp.id), String(pp.name || ''));
      }
    } catch {}
    const rows = picks.map((p, idx) => {
      const overall = idx + 1;
      const round = Math.ceil(overall / teams);
      const pickInRound = ((overall - 1) % teams) + 1;
      const team = findOwnerName(owners, p.teamId);
      const playerName = (p.playerName ? String(p.playerName) : '') || (p.playerId != null ? idToName.get(String(p.playerId)) : '') || '';
      return { overall, round, pickInRound, team, price: p.price, timestamp: p.timestamp, playerId: p.playerId, playerName };
    }).reverse(); // latest first

    ledgerEl.innerHTML = rows.map(r => `<div class="px-2 py-1 border-b flex items-center gap-2">
      <span class="w-14 text-slate-500">#${r.overall}</span>
      <span class="w-14">R${r.round} P${r.pickInRound}</span>
      <span class="w-32">${r.team}</span>
      <span class="grow">${(r.playerName && r.playerName.trim()) ? r.playerName : ('Player ' + (r.playerId ?? ''))}</span>
      <span class="w-16 text-right">$${r.price}</span>
    </div>`).join('');
  }

  // Initial + live updates via storage
  render();
  window.addEventListener('storage', (e) => {
    try {
      if (!e) return;
      const k = String(e.key || '');
      if (k.includes('workspace::state') || k.includes('workspace::leagueSettings') || k.includes('workspace::players')) render();
    } catch {}
  });
  // Also listen to in-app custom events fired by Draft widget
  window.addEventListener('workspace:state-changed', render);
  window.addEventListener('workspace:players-changed', render);

  // Undo/Redo controls: use storeBridge if available, fall back to storage snapshot (no-op)
  try {
    import('./storeBridge.js').then(mod => {
      const bridge = mod.storeBridge;
      const refreshButtons = () => {
        try {
          undoBtn.disabled = !bridge.canUndo();
          redoBtn.disabled = !bridge.canRedo();
        } catch {}
      };
      refreshButtons();
      bridge.subscribe('change', () => { render(); refreshButtons(); });
      undoBtn?.addEventListener('click', () => { bridge.undo(); });
      redoBtn?.addEventListener('click', () => { bridge.redo(); });
    }).catch(() => {});
  } catch {}
}


