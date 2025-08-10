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
  syncOwnersTable(form, current);

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
    const owners = String(form.owners?.value || '')
      .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    while (owners.length < t) owners.push(`Team ${owners.length + 1}`);
    while (owners.length > t) owners.pop();
    form.owners.value = owners.join('\n');
    syncOwnersTable(form, { ...readForm(form), owners: owners.map((name, idx) => ({ id: idx + 1, name })) });
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
  if (form.owners) {
    const owners = (s.owners || []).map(o => o.name || '');
    if (!owners.length) {
      const t = Number(form.teams.value || 12);
      form.owners.value = generateOwnerNames(t).map(o => o.name).join('\n');
    } else {
      form.owners.value = owners.join('\n');
    }
  }
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

function syncOwnersTable(form, settings) {
  const table = document.getElementById('ownersTable');
  if (!table) return;
  table.innerHTML = '';
  const owners = settings.owners && settings.owners.length
    ? settings.owners
    : generateOwnerNames(Number(form.teams.value || 12));
  owners.forEach((o, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="p-2 border-t text-slate-500">${idx + 1}</td>
      <td class="p-2 border-t"><input type="text" value="${o.name}" class="border p-1 w-full" data-idx="${idx}" /></td>
      <td class="p-2 border-t">
        <button type="button" data-up="${idx}" class="px-2 py-1 border rounded mr-1">↑</button>
        <button type="button" data-down="${idx}" class="px-2 py-1 border rounded">↓</button>
      </td>`;
    table.appendChild(tr);
  });

  // Input edits
  table.querySelectorAll('input[type="text"]').forEach(inp => {
    inp.addEventListener('input', () => {
      const idx = Number(inp.dataset.idx);
      const lines = Array.from(table.querySelectorAll('input[type="text"]').values()).map(i => i.value.trim());
      form.owners.value = lines.join('\n');
    });
  });

  // Reorder
  table.querySelectorAll('button[data-up]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.up);
      if (i <= 0) return;
      reorderOwnerRows(table, i, i - 1, form);
    });
  });
  table.querySelectorAll('button[data-down]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.down);
      reorderOwnerRows(table, i, i + 1, form);
    });
  });
}

function reorderOwnerRows(table, from, to, form) {
  const inputs = Array.from(table.querySelectorAll('input[type="text"]').values());
  if (to < 0 || to >= inputs.length) return;
  const names = inputs.map(i => i.value.trim());
  const [moved] = names.splice(from, 1);
  names.splice(to, 0, moved);
  form.owners.value = names.join('\n');
  // Re-render
  const owners = names.map((name, idx) => ({ id: idx + 1, name }));
  syncOwnersTable(form, { ...readForm(form), owners });
}


