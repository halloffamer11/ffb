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
  wrap.innerHTML = `<div id="ledger" class="h-full overflow-auto border rounded bg-white"></div>`;
  container.appendChild(wrap);

  const ledgerEl = wrap.querySelector('#ledger');

  function render() {
    const settings = loadSettings();
    const owners = settings.owners || [];
    const st = loadState();
    const picks = Array.isArray(st?.draft?.picks) ? st.draft.picks : [];
    const teams = Number(settings?.teams || owners.length || 12);
    const rows = picks.map((p, idx) => {
      const overall = idx + 1;
      const round = Math.ceil(overall / teams);
      const pickInRound = ((overall - 1) % teams) + 1;
      const team = findOwnerName(owners, p.teamId);
      return { overall, round, pickInRound, team, price: p.price, timestamp: p.timestamp, playerId: p.playerId };
    }).reverse(); // latest first

    ledgerEl.innerHTML = rows.map(r => `<div class="px-2 py-1 border-b flex items-center gap-2">
      <span class="w-14 text-slate-500">#${r.overall}</span>
      <span class="w-14">R${r.round} P${r.pickInRound}</span>
      <span class="w-32">${r.team}</span>
      <span class="grow">Player ${r.playerId}</span>
      <span class="w-16 text-right">$${r.price}</span>
    </div>`).join('');
  }

  // Initial + live updates via storage
  render();
  window.addEventListener('storage', (e) => {
    try {
      if (!e) return;
      const k = String(e.key || '');
      if (k.includes('workspace::state') || k.includes('workspace::leagueSettings')) render();
    } catch {}
  });
  // Also listen to in-app custom events fired by Draft widget
  window.addEventListener('workspace:state-changed', render);
  window.addEventListener('workspace:players-changed', render);
}


