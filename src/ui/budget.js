/**
 * Budget Tracker UI (T-017)
 * Depends on pure helpers from src/core/budget.js
 */

import { computeAllTeamBudgets, budgetAlerts } from '../core/budget.js';
import { createStorageAdapter } from '../adapters/storage.js';

const storage = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadSettings() { return storage.get('leagueSettings') || { teams: 12, budget: 200, minBid: 1, roster: { QB:1, RB:2, WR:2, TE:1, FLEX:1, K:0, DST:0, BENCH:6 }, owners: [] }; }
function loadPicks() { const s = storage.get('state'); return s?.draft?.picks || []; }

/**
 * Render the budget table
 * @param {HTMLElement} tableEl
 */
export function renderBudgetTable(tableEl) {
  if (!tableEl) return;
  const settings = loadSettings();
  const picks = loadPicks();
  const rows = computeAllTeamBudgets(settings, picks);
  const minBid = Number(settings.minBid ?? 1);

  const thead = tableEl.querySelector('thead');
  const tbody = tableEl.querySelector('tbody');
  if (thead) thead.innerHTML = `<tr>
    <th class="text-left p-2">Team</th>
    <th class="text-right p-2">Remaining</th>
    <th class="text-right p-2">Spent</th>
    <th class="text-right p-2">Spots</th>
    <th class="text-right p-2">Max Bid</th>
    <th class="text-right p-2">Avg $/Spot</th>
    <th class="text-left p-2">Alerts</th>
  </tr>`;
  if (tbody) {
    tbody.innerHTML = '';
    for (const r of rows) {
      const tr = document.createElement('tr');
      const alerts = budgetAlerts(r, minBid);
      tr.innerHTML = `
        <td class="p-2 border-t">${r.teamName}</td>
        <td class="p-2 border-t text-right">$${r.remaining}</td>
        <td class="p-2 border-t text-right">$${r.spent}</td>
        <td class="p-2 border-t text-right">${r.spotsRemaining}/${r.rosterTotal}</td>
        <td class="p-2 border-t text-right font-medium">$${r.maxBid}</td>
        <td class="p-2 border-t text-right">$${r.avgPerSpot.toFixed(1)}</td>
        <td class="p-2 border-t text-xs ${alerts.length ? 'text-amber-700' : 'text-slate-500'}">${alerts.join('; ')}</td>`;
      tbody.appendChild(tr);
    }
  }
}

/**
 * Attach automatic refresh on storage-backed state changes
 */
export function attachBudgetAutoRefresh(tableEl, intervalMs = 1000) {
  let timer = null;
  function tick() { renderBudgetTable(tableEl); }
  function start() { if (timer) return; timer = setInterval(tick, intervalMs); }
  function stop() { if (!timer) return; clearInterval(timer); timer = null; }
  // Initial render + start
  renderBudgetTable(tableEl);
  start();
  return { start, stop };
}


