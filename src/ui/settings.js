import { createStorageAdapter } from '../adapters/storage.js';

const store = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

const DEFAULT_SETTINGS = {
  teams: 12,
  budget: 200,
  roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 0, K: 0, DST: 0, BENCH: 6 },
  scoringPreset: 'PPR',
  keeperMode: false,
  owners: []
};

export function loadSettings() {
  const saved = store.get('leagueSettings');
  return saved && typeof saved === 'object' ? saved : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  return store.set('leagueSettings', settings);
}

export function attachSettingsForm(formId, summaryId, errorsId) {
  const form = document.getElementById(formId);
  const summary = document.getElementById(summaryId);
  const errors = document.getElementById(errorsId);
  if (!form) return;
  const current = loadSettings();
  hydrateForm(form, current);
  renderSummary(summary, current);
  syncOwnersGrid(form, current);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = readForm(form);
    const validation = validateSettings(data);
    if (!validation.ok) {
      errors.textContent = validation.errors.join('\n');
      return;
    }
    errors.textContent = '';
    saveSettings(data);
    const saved = loadSettings();
    hydrateForm(form, saved);
    renderSummary(summary, saved);
    syncOwnersTable(form, saved);
  });

  // Keep owners list aligned as teams changes
  form.teams.addEventListener('input', () => {
    const t = Number(form.teams.value || 12);
    regenerateOwnersGrid(form, t);
  });
}

export function generateOwnerNames(teams) {
  const list = [];
  for (let i = 1; i <= teams; i += 1) list.push({ id: i, name: `Team ${i}` });
  return list;
}

function hydrateForm(form, s) {
  form.teams.value = s.teams;
  form.budget.value = s.budget;
  for (const key of Object.keys(s.roster)) {
    if (form[`r_${key}`]) form[`r_${key}`].value = s.roster[key];
  }
  form.scoringPreset.value = s.scoringPreset;
  if (form.keeperMode) form.keeperMode.checked = !!s.keeperMode;
  // Owners grid will be synced below
}

function readForm(form) {
  const roster = {};
  for (const key of ['QB','RB','WR','TE','FLEX','K','DST','BENCH']) {
    roster[key] = Number(form[`r_${key}`].value || 0);
  }
  return {
    teams: Number(form.teams.value || 12),
    budget: Number(form.budget.value || 200),
    roster,
    scoringPreset: form.scoringPreset.value || 'PPR',
    keeperMode: !!form.keeperMode?.checked,
    owners: String(form.owners?.value || '')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({ id: idx + 1, name }))
  };
}

function validateSettings(s) {
  const errors = [];
  const starters = s.roster.QB + s.roster.RB + s.roster.WR + s.roster.TE + s.roster.FLEX + s.roster.K + s.roster.DST;
  if (s.teams < 8 || s.teams > 14) errors.push('Teams must be between 8 and 14');
  if (s.budget < 50 || s.budget > 1000) errors.push('Budget must be between 50 and 1000');
  if (s.roster.QB < 1) errors.push('At least 1 QB required');
  if (!Array.isArray(s.owners) || s.owners.length !== s.teams) errors.push('Owners count must equal number of teams');
  if (starters <= 0) errors.push('Total starters must be > 0');
  if (errors.length) return { ok: false, errors };
  return { ok: true };
}

function renderSummary(el, s) {
  if (!el) return;
  el.textContent = JSON.stringify(s, null, 2);
}

function syncOwnersGrid(form, settings) {
  const grid = document.getElementById('ownersGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const owners = coerceOwners(settings, Number(form.teams.value || 12));
  owners.forEach((o, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 border-t"><input type="text" value="${o.team || `Team ${idx+1}`}" class="border p-1 w-full" data-field="team" data-idx="${idx}" /></td>
      <td class="p-2 border-t"><input type="text" value="${o.name || `Owner ${idx+1}`}" class="border p-1 w-full" data-field="name" data-idx="${idx}" /></td>
      <td class="p-2 border-t"><input type="number" min="1" class="border p-1 w-20" value="${idx + 1}" data-field="order" data-idx="${idx}" /></td>`;
    grid.appendChild(tr);
  });

  grid.querySelectorAll('input').forEach(inp => inp.addEventListener('input', () => {
    const rows = readOwnersGrid(grid);
    const sorted = rows.sort((a, b) => a.order - b.order);
    // Update grid display and persist to form through saveSettings on submit
    persistOwnersToStorage(form, sorted);
  }));
}

function readOwnersGrid(grid) {
  const rows = [];
  const idxs = new Set(Array.from(grid.querySelectorAll('input[data-idx]')).map(i => i.dataset.idx));
  idxs.forEach(i => {
    const team = grid.querySelector(`input[data-idx="${i}"][data-field="team"]`)?.value?.trim() || `Team ${Number(i)+1}`;
    const name = grid.querySelector(`input[data-idx="${i}"][data-field="name"]`)?.value?.trim() || `Owner ${Number(i)+1}`;
    const order = Number(grid.querySelector(`input[data-idx="${i}"][data-field="order"]`)?.value || (Number(i)+1));
    rows.push({ id: Number(i)+1, team, name, order });
  });
  return rows;
}

function coerceOwners(settings, teams) {
  let owners = Array.isArray(settings.owners) ? settings.owners.slice() : [];
  while (owners.length < teams) owners.push({ id: owners.length + 1, team: `Team ${owners.length + 1}`, name: `Owner ${owners.length + 1}`, order: owners.length + 1 });
  while (owners.length > teams) owners.pop();
  owners.forEach((o, idx) => { if (o.order == null) o.order = idx + 1; if (!o.team) o.team = `Team ${idx+1}`; });
  return owners;
}

export function regenerateOwnersGrid(form, teams) {
  const settings = { ...readForm(form) };
  settings.owners = coerceOwners(settings, teams);
  syncOwnersGrid(form, settings);
}

function persistOwnersToStorage(form, owners) {
  const s = readForm(form);
  s.owners = owners.map((o, idx) => ({ id: idx + 1, team: o.team, name: o.name, order: o.order }));
  saveSettings(s);
  const summary = document.getElementById('summary');
  renderSummary(summary, s);
}

// Export for UI to call
export { regenerateOwnersGrid };


