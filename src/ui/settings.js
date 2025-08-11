import { createStorageAdapter } from '../adapters/storage.js';
import { getPreset } from '../core/scoring.js';

const store = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

const DEFAULT_SETTINGS = {
  teams: 12,
  budget: 200,
  roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 0, K: 0, DST: 0, BENCH: 6 },
  rosterFlex: [],
  scoringPreset: 'PPR',
  keeperMode: false,
  owners: [],
  minBid: 1,
  rounds: 16,
  draftType: 'SNAKE', // or 'LINEAR'
  idpEnabled: false,
  scoringOverrides: {
    passYdsPerPt: '',
    passTds: '',
    passInt: '',
    rushYdsPerPt: '',
    rushTds: '',
    rec: '',
    recYdsPerPt: '',
    recTds: '',
    fumbles: ''
  }
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
  syncFlexUI(form, current);

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
    syncOwnersGrid(form, saved);
  });

  // Keep owners list aligned as teams changes
  form.teams.addEventListener('input', () => {
    const t = Number(form.teams.value || 12);
    regenerateOwnersGrid(form, t);
  });

  // Preset selection applies defaults to overrides
  if (form.scoringPreset) {
    form.scoringPreset.addEventListener('change', () => {
      const preset = String(form.scoringPreset.value || 'PPR').toUpperCase();
      if (preset === 'CUSTOM') return;
      const p = getPreset(preset);
      applyPresetToOverrideInputs(form, p);
    });
  }

  // Any manual change to overrides marks preset as CUSTOM (deferred save on submit)
  const overrideNames = ['s_passYdsPerPt','s_passTds','s_passInt','s_rushYdsPerPt','s_rushTds','s_rec','s_recYdsPerPt','s_recTds','s_fumbles'];
  overrideNames.forEach(name => {
    const input = form[name];
    if (input) input.addEventListener('input', () => { if (form.scoringPreset) form.scoringPreset.value = 'CUSTOM'; });
  });

  // Flex presets
  form.querySelectorAll('[data-flex-preset]')?.forEach(btn => btn.addEventListener('click', () => {
    const p = btn.getAttribute('data-flex-preset');
    applyFlexPreset(form, p);
  }));

  // Add flex slot
  const addFlexBtn = form.querySelector('#addFlexSlot');
  if (addFlexBtn) addFlexBtn.addEventListener('click', () => addFlexSlot(form));
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
  if (form.minBid) form.minBid.value = s.minBid ?? 1;
  if (form.rounds) form.rounds.value = s.rounds ?? 16;
  if (form.draftType) form.draftType.value = s.draftType || 'SNAKE';
  if (form.idpEnabled) form.idpEnabled.checked = !!s.idpEnabled;
  const o = s.scoringOverrides || {};
  setIfPresent(form, 's_passYdsPerPt', o.passYdsPerPt);
  setIfPresent(form, 's_passTds', o.passTds);
  setIfPresent(form, 's_passInt', o.passInt);
  setIfPresent(form, 's_rushYdsPerPt', o.rushYdsPerPt);
  setIfPresent(form, 's_rushTds', o.rushTds);
  setIfPresent(form, 's_rec', o.rec);
  setIfPresent(form, 's_recYdsPerPt', o.recYdsPerPt);
  setIfPresent(form, 's_recTds', o.recTds);
  setIfPresent(form, 's_fumbles', o.fumbles);
  // Owners grid will be synced below
}

function readForm(form) {
  const roster = {};
  for (const key of ['QB','RB','WR','TE','FLEX','K','DST','BENCH']) {
    roster[key] = Number(form[`r_${key}`].value || 0);
  }
  // Read owners from grid if present
  let owners = [];
  const grid = document.getElementById('ownersGrid');
  if (grid) {
    owners = readOwnersGrid(grid).sort((a, b) => a.order - b.order);
  }
  return {
    teams: Number(form.teams.value || 12),
    budget: Number(form.budget.value || 200),
    roster,
    scoringPreset: form.scoringPreset.value || 'PPR',
    keeperMode: !!form.keeperMode?.checked,
    owners,
    minBid: Math.max(1, Number(form.minBid?.value || 1)),
    rounds: Math.max(1, Number(form.rounds?.value || 16)),
    draftType: (form.draftType?.value || 'SNAKE').toUpperCase(),
    idpEnabled: !!form.idpEnabled?.checked,
    scoringOverrides: {
      passYdsPerPt: getNumOrEmpty(form.s_passYdsPerPt?.value),
      passTds: getNumOrEmpty(form.s_passTds?.value),
      passInt: getNumOrEmpty(form.s_passInt?.value),
      rushYdsPerPt: getNumOrEmpty(form.s_rushYdsPerPt?.value),
      rushTds: getNumOrEmpty(form.s_rushTds?.value),
      rec: getNumOrEmpty(form.s_rec?.value),
      recYdsPerPt: getNumOrEmpty(form.s_recYdsPerPt?.value),
      recTds: getNumOrEmpty(form.s_recTds?.value),
      fumbles: getNumOrEmpty(form.s_fumbles?.value)
    }
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
  if (!Number.isFinite(s.minBid) || s.minBid < 1) errors.push('Minimum bid must be >= 1');
  if (!Number.isFinite(s.rounds) || s.rounds < 1) errors.push('Number of rounds must be >= 1');
  if (!['SNAKE','LINEAR'].includes(String(s.draftType || 'SNAKE').toUpperCase())) errors.push('Draft type must be Snake or Linear');
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
      <td class="p-2 border-t text-slate-600">${idx + 1}</td>
      <td class="p-2 border-t"><input type="text" value="${o.team || `Team ${idx+1}`}" class="border p-1 w-full" data-field="team" data-idx="${idx}" /></td>
      <td class="p-2 border-t"><input type="text" value="${o.name || `Owner ${idx+1}`}" class="border p-1 w-full" data-field="name" data-idx="${idx}" /></td>`;
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
    const order = Number(i) + 1;
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

export function regenerateOwnersGrid(form, teams, reset = false) {
  const currentSettings = loadSettings();
  const grid = document.getElementById('ownersGrid');
  const existing = grid ? readOwnersGrid(grid).sort((a,b) => a.order - b.order) : (currentSettings.owners || []);

  let owners;
  if (reset) {
    owners = [];
  } else {
    owners = existing.slice(0, Math.min(existing.length, teams));
  }

  // Extend or trim to target size while preserving existing names
  while (owners.length < teams) {
    const idx = owners.length;
    owners.push({ id: idx + 1, team: `Team ${idx + 1}`, name: `Owner ${idx + 1}`, order: idx + 1 });
  }
  owners = owners.slice(0, teams);
  owners.forEach((o, idx) => { o.id = idx + 1; o.order = idx + 1; if (!o.team) o.team = `Team ${idx + 1}`; if (!o.name) o.name = `Owner ${idx + 1}`; });

  // Preserve all other settings from storage; update only owners and teams
  const s = { ...currentSettings, owners, teams };
  saveSettings(s);
  syncOwnersGrid(form, s);
  const summary = document.getElementById('summary');
  renderSummary(summary, s);
}

function persistOwnersToStorage(form, owners) {
  const s = readForm(form);
  s.owners = owners.map((o, idx) => ({ id: idx + 1, team: o.team, name: o.name, order: o.order }));
  saveSettings(s);
  const summary = document.getElementById('summary');
  renderSummary(summary, s);
}

// nothing else to export here (regenerateOwnersGrid already exported above)

function setIfPresent(form, name, value) {
  if (form[name] != null && value !== undefined && value !== '') form[name].value = value;
}

function getNumOrEmpty(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}

function applyPresetToOverrideInputs(form, preset) {
  if (!preset) return;
  const map = {
    s_passYdsPerPt: preset.passYdsPerPt,
    s_passTds: preset.passTds,
    s_passInt: preset.passInt,
    s_rushYdsPerPt: preset.rushYdsPerPt,
    s_rushTds: preset.rushTds,
    s_rec: preset.rec,
    s_recYdsPerPt: preset.recYdsPerPt,
    s_recTds: preset.recTds,
    s_fumbles: preset.fumbles
  };
  for (const [name, value] of Object.entries(map)) {
    if (form[name]) form[name].value = value;
  }
}

// ===== Flex Builder =====
function syncFlexUI(form, settings) {
  const container = document.getElementById('flexSlots');
  if (!container) return;
  container.innerHTML = '';
  const slots = Array.isArray(settings.rosterFlex) ? settings.rosterFlex : [];
  slots.forEach((slot, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-4 py-1';
    row.innerHTML = `
      <div class="w-28 text-slate-700">${slot.label || `FLEX ${idx+1}`}</div>
      <label class="inline-flex items-center gap-1"><input type="checkbox" data-flex="${idx}" data-pos="QB" ${slot.allowed?.includes('QB') ? 'checked' : ''}/> QB</label>
      <label class="inline-flex items-center gap-1"><input type="checkbox" data-flex="${idx}" data-pos="RB" ${slot.allowed?.includes('RB') ? 'checked' : ''}/> RB</label>
      <label class="inline-flex items-center gap-1"><input type="checkbox" data-flex="${idx}" data-pos="WR" ${slot.allowed?.includes('WR') ? 'checked' : ''}/> WR</label>
      <label class="inline-flex items-center gap-1"><input type="checkbox" data-flex="${idx}" data-pos="TE" ${slot.allowed?.includes('TE') ? 'checked' : ''}/> TE</label>
      <button type="button" class="ml-auto px-2 py-1 border rounded text-slate-600" data-remove="${idx}">Remove</button>
    `;
    container.appendChild(row);
  });

  // Checkbox changes
  container.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('input', () => {
    const idx = Number(cb.getAttribute('data-flex'));
    const pos = cb.getAttribute('data-pos');
    const s = loadSettings();
    const slots2 = Array.isArray(s.rosterFlex) ? s.rosterFlex : [];
    const slot = slots2[idx] || { label: `FLEX ${idx+1}`, allowed: [] };
    const set = new Set(slot.allowed || []);
    if (cb.checked) set.add(pos); else set.delete(pos);
    slot.allowed = Array.from(set);
    slots2[idx] = slot;
    s.rosterFlex = slots2;
    saveSettings(s);
    renderSummary(document.getElementById('summary'), s);
  }));

  // Remove slot
  container.querySelectorAll('button[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    const idx = Number(btn.getAttribute('data-remove'));
    const s = loadSettings();
    const slots2 = (s.rosterFlex || []).slice();
    slots2.splice(idx, 1);
    s.rosterFlex = slots2.map((slot, i) => ({ ...slot, label: slot.label || `FLEX ${i+1}` }));
    saveSettings(s);
    syncFlexUI(form, s);
    renderSummary(document.getElementById('summary'), s);
  }));
}

function applyFlexPreset(form, preset) {
  const s = loadSettings();
  let slots = [];
  switch (String(preset || '').toUpperCase()) {
    case 'NONE':
      slots = [];
      break;
    case 'WR_TE':
      slots = [{ label: 'FLEX 1', allowed: ['WR','TE'] }];
      break;
    case 'RB_WR':
      slots = [{ label: 'FLEX 1', allowed: ['RB','WR'] }];
      break;
    case 'RB_WR_TE':
      slots = [{ label: 'FLEX 1', allowed: ['RB','WR','TE'] }];
      break;
    case 'SUPERFLEX':
      slots = [{ label: 'SUPERFLEX', allowed: ['QB','RB','WR','TE'] }];
      break;
    default:
      slots = s.rosterFlex || [];
  }
  s.rosterFlex = slots;
  saveSettings(s);
  syncFlexUI(form, s);
  renderSummary(document.getElementById('summary'), s);
}

function addFlexSlot(form) {
  const s = loadSettings();
  const slots = (s.rosterFlex || []).slice();
  const nextIdx = slots.length;
  const defaultAllowed = slots.length ? (slots[slots.length - 1].allowed || ['RB','WR','TE']) : ['RB','WR','TE'];
  slots.push({ label: `FLEX ${nextIdx + 1}`, allowed: defaultAllowed.slice() });
  s.rosterFlex = slots;
  saveSettings(s);
  syncFlexUI(form, s);
  renderSummary(document.getElementById('summary'), s);
}


