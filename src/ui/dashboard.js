// Dashboard Grid Engine (4x8) with edit mode, drag, resize, gravity packing
// Spec-aligned MVP. Keeps state in workspace storage under dashboard key.

import { createStorageAdapter } from '../adapters/storage.js';

const GRID_ROWS = 4;
const GRID_COLS = 8;
const SAVE_DEBOUNCE_MS = 500;

export const WidgetRegistry = {
  search: { name: 'Search & Select', minW: 2, minH: 2, maxW: 8, maxH: 4, defaultW: 8, defaultH: 2 },
  tiers: { name: 'Position Tiers', minW: 2, minH: 2, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  roster: { name: 'My Roster', minW: 2, minH: 2, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  budget: { name: 'Budget Tracker', minW: 2, minH: 2, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 }
};

const store = createStorageAdapter({ namespace: 'workspace', version: '1.0.0' });

function loadDashboard() {
  const dash = store.get('dashboard');
  if (dash && dash.widgets && Array.isArray(dash.widgets)) return dash;
  // seed
  return {
    activeLayout: 'default',
    widgets: [
      { id: 'w_search', type: 'search', row: 1, col: 1, w: 8, h: 2, config: {} },
      { id: 'w_tiers', type: 'tiers', row: 3, col: 1, w: 4, h: 2, config: {} },
      { id: 'w_roster', type: 'roster', row: 3, col: 5, w: 4, h: 2, config: {} }
    ],
    layouts: { presets: {}, custom: {} }
  };
}

let saveTimer = null;
function saveDashboard(dash) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { store.set('dashboard', dash); }, SAVE_DEBOUNCE_MS);
}

export function initDashboard(root) {
  const dash = loadDashboard();
  const state = { dash, edit: false, dragging: null, resizing: null };

  const toolbar = root.querySelector('[data-action="toolbar"]');
  const grid = root.querySelector('[data-grid]');

  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;

  function render() {
    grid.classList.toggle('edit', state.edit);
    grid.innerHTML = '';
    // draw subtle grid lines (stronger in edit mode)
    const lineOpacity = state.edit ? 0.35 : 0.12;
    grid.style.backgroundImage = `linear-gradient(rgba(148,163,184,${lineOpacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,${lineOpacity}) 1px, transparent 1px)`;
    grid.style.backgroundSize = `${100/GRID_COLS}% ${100/GRID_ROWS}%`;

    for (const w of state.dash.widgets) {
      const def = WidgetRegistry[w.type] || WidgetRegistry.search;
      const el = document.createElement('div');
      el.className = `widget rounded border bg-white transition-all duration-300 ${state.edit ? 'shadow-2xl shadow-black/30 ring-1 ring-slate-300' : 'shadow-sm'}`;
      el.style.gridColumn = `${w.col} / span ${w.w}`;
      el.style.gridRow = `${w.row} / span ${w.h}`;
      el.dataset.id = w.id;
      el.innerHTML = `
        <div class="w-full h-full flex flex-col relative">
          <div class="flex items-center gap-2 px-2 py-1 border-b bg-slate-50 ${state.edit ? 'cursor-grab' : ''}">
            <span class="text-sm font-medium mr-auto select-none">${def.name}</span>
            ${state.edit ? `
              <div class=\"flex items-center gap-1 text-xs select-none\">
                <span class=\"text-slate-500\">W</span>
                <button class=\"btn-w-dec px-2 py-1 border rounded\">−</button>
                <button class=\"btn-w-inc px-2 py-1 border rounded\">+</button>
                <span class=\"text-slate-500 ml-2\">H</span>
                <button class=\"btn-h-dec px-2 py-1 border rounded\">−</button>
                <button class=\"btn-h-inc px-2 py-1 border rounded\">+</button>
              </div>
              <button class=\"btn-del text-xs px-2 py-1 border rounded\">Delete</button>
            ` : '<button class=\"btn-expand text-xs px-2 py-1 border rounded\">Expand</button>'}
          </div>
          <div class="grow p-0 text-xs text-slate-600 overflow-hidden">
            ${renderWidgetContents(w.type)}
          </div>
          ${state.edit ? `
            <div class=\"edge-right absolute right-[-6px] top-1/2 -translate-y-1/2 w-2 h-10 bg-slate-500/70 rounded cursor-ew-resize\" title=\"Resize horizontal\"></div>
            <div class=\"edge-bottom absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-500/70 rounded cursor-ns-resize\" title=\"Resize vertical\"></div>
          ` : ''}
        </div>`;

      // Events
      if (state.edit) {
        const header = el.querySelector('div');
        header.addEventListener('pointerdown', (e) => startDrag(e, w.id));
        el.querySelector('.btn-del')?.addEventListener('click', (e) => { e.stopPropagation(); delWidget(w.id); });
        el.querySelector('.btn-w-dec')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, -1, 0); });
        el.querySelector('.btn-w-inc')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, +1, 0); });
        el.querySelector('.btn-h-dec')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, 0, -1); });
        el.querySelector('.btn-h-inc')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, 0, +1); });
        el.querySelector('.edge-right')?.addEventListener('pointerdown', (e) => startResize(e, w.id, 'right'));
        el.querySelector('.edge-bottom')?.addEventListener('pointerdown', (e) => startResize(e, w.id, 'bottom'));
      } else {
        el.querySelector('.btn-expand')?.addEventListener('click', () => expandWidget(w.id));
      }
      grid.appendChild(el);
    }
  }

  function expandWidget(id) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/30 z-[2000] flex items-center justify-center';
    const card = document.createElement('div');
    card.className = 'bg-white w-[95vw] h-[95vh] rounded shadow-xl p-2 relative overflow-hidden';
    const w = state.dash.widgets.find(x => x.id === id);
    const def = WidgetRegistry[w?.type] || { name: 'Widget' };
    card.innerHTML = `<button class=\"absolute top-2 right-2 px-3 py-1 border rounded\">Close</button>
      <div class=\"w-full h-full pt-8\">
        <div class=\"absolute top-2 left-3 text-sm font-medium text-slate-700\">${def.name}</div>
        <div class=\"w-full h-full overflow-hidden\">${renderWidgetContents(w?.type, true)}</div>
      </div>`;
    card.querySelector('button').addEventListener('click', () => overlay.remove());
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function addWidget(type) {
    const def = WidgetRegistry[type];
    if (!def) return;
    const size = { w: def.defaultW, h: def.defaultH };
    const pos = findFirstFit(state.dash.widgets, size.w, size.h);
    if (!pos) { alert('No space available'); return; }
    const id = `w_${type}_${Date.now()}`;
    state.dash.widgets.push({ id, type, row: pos.row, col: pos.col, w: size.w, h: size.h, config: {} });
    saveDashboard(state.dash);
    render();
  }

  function delWidget(id) {
    state.dash.widgets = state.dash.widgets.filter(w => w.id !== id);
    saveDashboard(state.dash);
    render();
  }

  function startDrag(e, id) {
    e.preventDefault();
    const start = pointerCell(e, grid);
    const w = state.dash.widgets.find(x => x.id === id);
    if (!w) return;
    const offset = { dCol: start.col - w.col, dRow: start.row - w.row };
    state.dragging = { id, offset };
    window.addEventListener('pointermove', onDrag);
    window.addEventListener('pointerup', endDrag, { once: true });
  }
  function onDrag(e) {
    const d = state.dragging; if (!d) return;
    const w = state.dash.widgets.find(x => x.id === d.id); if (!w) return;
    const cell = pointerCell(e, grid);
    const newCol = clamp(1, GRID_COLS - w.w + 1, cell.col - d.offset.dCol);
    const newRow = clamp(1, GRID_ROWS - w.h + 1, cell.row - d.offset.dRow);
    const prev = { ...w };
    w.col = newCol; w.row = newRow;
    if (collidesAny(state.dash.widgets, w.id)) {
      // gravity pack others
      gravityPack(state.dash.widgets, w.id);
    }
    render();
    // restore visual position if still colliding
    const cur = state.dash.widgets.find(x => x.id === d.id);
    if (collidesAny(state.dash.widgets, cur.id)) Object.assign(cur, prev);
  }
  function endDrag() {
    state.dragging = null;
    window.removeEventListener('pointermove', onDrag);
    saveDashboard(state.dash);
    render();
  }

  function startResize(e, id, edge) {
    e.stopPropagation(); e.preventDefault();
    const w = state.dash.widgets.find(x => x.id === id); if (!w) return;
    state.resizing = { id, edge };
    window.addEventListener('pointermove', onResize);
    window.addEventListener('pointerup', endResize, { once: true });
  }
  function onResize(e) {
    const r = state.resizing; if (!r) return;
    const w = state.dash.widgets.find(x => x.id === r.id); if (!w) return;
    const def = WidgetRegistry[w.type];
    const cell = pointerCell(e, grid);
    if (r.edge === 'right' || r.edge === 'corner') {
      const newW = clamp(def.minW, Math.min(def.maxW, GRID_COLS - w.col + 1), cell.col - w.col + 1);
      w.w = newW;
    }
    if (r.edge === 'bottom' || r.edge === 'corner') {
      const newH = clamp(def.minH, Math.min(def.maxH, GRID_ROWS - w.row + 1), cell.row - w.row + 1);
      w.h = newH;
    }
    if (collidesAny(state.dash.widgets, w.id)) {
      // prevent overlap by reverting size step (coarse)
      const defW = Math.min(w.w, def.maxW); const defH = Math.min(w.h, def.maxH);
      w.w = defW; w.h = defH;
      gravityPack(state.dash.widgets, w.id);
    }
    render();
  }
  function endResize() {
    state.resizing = null;
    window.removeEventListener('pointermove', onResize);
    saveDashboard(state.dash);
  }

  function adjustSizeButtons(id, dW, dH) {
    const w = state.dash.widgets.find(x => x.id === id); if (!w) return;
    const def = WidgetRegistry[w.type];
    const newW = clamp(def.minW, def.maxW, w.w + dW);
    const newH = clamp(def.minH, def.maxH, w.h + dH);
    w.w = clamp(def.minW, Math.min(def.maxW, GRID_COLS - w.col + 1), newW);
    w.h = clamp(def.minH, Math.min(def.maxH, GRID_ROWS - w.row + 1), newH);
    if (collidesAny(state.dash.widgets, w.id)) { // revert on overlap
      w.w = clamp(def.minW, def.maxW, w.w - dW);
      w.h = clamp(def.minH, def.maxH, w.h - dH);
    }
    saveDashboard(state.dash);
    render();
  }

  function pointerCell(e, container) {
    const rect = container.getBoundingClientRect();
    const x = clamp(0, rect.width, e.clientX - rect.left);
    const y = clamp(0, rect.height, e.clientY - rect.top);
    const col = clamp(1, GRID_COLS, Math.ceil((x / rect.width) * GRID_COLS));
    const row = clamp(1, GRID_ROWS, Math.ceil((y / rect.height) * GRID_ROWS));
    return { col, row };
  }

  function collides(a, b) {
    return !(a.col + a.w - 1 < b.col || b.col + b.w - 1 < a.col || a.row + a.h - 1 < b.row || b.row + b.h - 1 < a.row);
  }
  function collidesAny(widgets, id) {
    const self = widgets.find(w => w.id === id);
    return widgets.some(w => w.id !== id && collides(self, w));
  }
  function findFirstFit(widgets, w, h) {
    for (let r = 1; r <= GRID_ROWS - h + 1; r++) {
      for (let c = 1; c <= GRID_COLS - w + 1; c++) {
        const test = { row: r, col: c, w, h, id: '__test' };
        if (!widgets.some(x => collides(test, x))) return { row: r, col: c };
      }
    }
    return null;
  }
  function gravityPack(widgets, ignoreId) {
    // Simple pass: for any collision chain, scan for nearest free slot row-major
    for (const w of widgets) {
      if (w.id === ignoreId) continue;
      if (widgets.some(x => x.id !== w.id && collides(w, x))) {
        const pos = findFirstFit(widgets.filter(x => x.id !== w.id), w.w, w.h);
        if (pos) { w.row = pos.row; w.col = pos.col; }
      }
    }
  }

  // toolbar wiring
  toolbar.querySelector('[data-btn="edit"]')?.addEventListener('click', () => {
    state.edit = !state.edit; render();
  });
  toolbar.querySelector('[data-btn="add"]')?.addEventListener('click', () => {
    const sel = root.querySelector('[data-select="widget"]');
    addWidget(sel?.value || 'tiers');
  });

  render();
}

function clamp(min, max, v) { return Math.max(min, Math.min(max, v)); }

// Map widget type to embedded content
function renderWidgetContents(type, expanded = false) {
  if (type === 'search') {
    const url = '/demos/ui/T-009c_search.html?hud=0';
    return `<iframe src="${url}" class="w-full h-full border-0" loading="lazy"></iframe>`;
  }
  if (type === 'tiers') {
    // Placeholder until dedicated tiers UI exists
    return `<div class="w-full h-full p-3 overflow-auto text-slate-700">Tiers widget (coming soon)</div>`;
  }
  if (type === 'roster') {
    return `<div class="w-full h-full p-3 text-slate-700">My Roster widget (coming soon)</div>`;
  }
  if (type === 'budget') {
    return `<div class="w-full h-full p-3 text-slate-700">Budget Tracker widget (coming soon)</div>`;
  }
  return `<div class="w-full h-full p-3">${type || ''}</div>`;
}


