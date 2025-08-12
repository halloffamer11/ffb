// Dashboard Grid Engine (4x8) with edit mode, drag, resize, gravity packing
// Spec-aligned MVP. Keeps state in workspace storage under dashboard key.

import { createStorageAdapter } from '../adapters/storage.js';

const GRID_ROWS = 4;
const GRID_COLS = 8;
const SAVE_DEBOUNCE_MS = 500;

export const WidgetRegistry = {
  search: { name: 'Search & Select', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 8, defaultH: 2 },
  draft: { name: 'Draft Entry', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  tiers: { name: 'Position Tiers', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  roster: { name: 'My Roster', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  budget: { name: 'Budget Tracker', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  ledger: { name: 'Draft Ledger', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 }
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
    saveTimer = setTimeout(() => {
      // Skip autosave while drag is active to avoid iframe reloads/refresh loops
      if (document.body.classList.contains('dash-drag-active')) return;
      store.set('dashboard', dash);
    }, SAVE_DEBOUNCE_MS);
}

export function initDashboard(root) {
  const dash = loadDashboard();
  const state = { dash, edit: false, dragging: null, resizing: null };

  const toolbar = root.querySelector('[data-action="toolbar"]');
  const grid = root.querySelector('[data-grid]');
  let dragShield = null;

  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;

  function render() {
    grid.classList.toggle('edit', state.edit);
    // Preserve any existing iframes to avoid reloads during layout changes
    const preservedIframes = new Map();
    for (const child of Array.from(grid.children)) {
      const id = child.getAttribute('data-id');
      const iframe = child.querySelector('iframe');
      if (id && iframe) preservedIframes.set(id, iframe);
    }
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
      const typeSelectMarkup = state.edit ? `<select class="widget-type px-2 py-1 border rounded text-xs">
            ${Object.entries(WidgetRegistry).map(([k,def2]) => `<option value="${k}" ${w.type===k?'selected':''}>${def2.name}</option>`).join('')}
          </select>` : '';
      el.innerHTML = `
        <div class="w-full h-full flex flex-col relative">
          <div class="widget-header flex items-center gap-2 px-2 py-1 border-b bg-slate-50">
            ${state.edit ? `
              <button class=\"drag-handle p-1 rounded cursor-grab hover:bg-slate-200\" title=\"Move widget\" aria-label=\"Move widget\">
                <svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"#64748b\" xmlns=\"http://www.w3.org/2000/svg\">
                  <circle cx=\"4\" cy=\"4\" r=\"1.6\"/>
                  <circle cx=\"12\" cy=\"4\" r=\"1.6\"/>
                  <circle cx=\"8\" cy=\"8\" r=\"1.6\"/>
                  <circle cx=\"4\" cy=\"12\" r=\"1.6\"/>
                  <circle cx=\"12\" cy=\"12\" r=\"1.6\"/>
                </svg>
              </button>
            ` : ''}
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
              ${typeSelectMarkup}
              <button class=\"btn-del text-xs px-2 py-1 border rounded\">Delete</button>
            ` : '<button class=\"btn-expand text-xs px-2 py-1 border rounded\">Expand</button>'}
          </div>
          <div class="grow p-0 text-xs text-slate-600 overflow-hidden">
            ${renderWidgetContents(w.type, w.id)}
          </div>
          ${state.edit ? `
            <div class=\"edge-right absolute right-[-6px] top-1/2 -translate-y-1/2 w-2 h-10 bg-slate-500/70 rounded cursor-ew-resize\" title=\"Resize horizontal\"></div>
            <div class=\"edge-bottom absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-10 h-2 bg-slate-500/70 rounded cursor-ns-resize\" title=\"Resize vertical\"></div>
          ` : ''}
        </div>`;

      // Reattach preserved iframe (if exists) to prevent content reload flicker
      const bodyEl = el.querySelector('.grow');
      const preserved = preservedIframes.get(w.id);
      if (bodyEl && preserved) {
        bodyEl.innerHTML = '';
        bodyEl.appendChild(preserved);
      }

      // Events
      if (state.edit) {
        const handle = el.querySelector('.drag-handle');
        handle?.addEventListener('pointerdown', (e) => {
          if (handle.setPointerCapture) { try { handle.setPointerCapture(e.pointerId); } catch {} }
          startDrag(e, w.id);
        });
        el.querySelector('.btn-del')?.addEventListener('click', (e) => { e.stopPropagation(); delWidget(w.id); });
        el.querySelector('.btn-w-dec')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, -1, 0); });
        el.querySelector('.btn-w-inc')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, +1, 0); });
        el.querySelector('.btn-h-dec')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, 0, -1); });
        el.querySelector('.btn-h-inc')?.addEventListener('click', (e) => { e.stopPropagation(); adjustSizeButtons(w.id, 0, +1); });
        el.querySelector('.edge-right')?.addEventListener('pointerdown', (e) => startResize(e, w.id, 'right'));
        el.querySelector('.edge-bottom')?.addEventListener('pointerdown', (e) => startResize(e, w.id, 'bottom'));
        // Switch widget type via dropdown
        el.querySelector('.widget-type')?.addEventListener('change', (e) => {
          const val = e.target.value;
          if (!WidgetRegistry[val]) return;
          const ww = state.dash.widgets.find(x => x.id === w.id);
          if (!ww) return;
          ww.type = val;
          // Reset config if any future widgets have configs
          ww.config = {};
          saveDashboard(state.dash);
          render();
        });
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
    // Suspend dashboard saves during drag to avoid iframe refresh or layout rebinds
    document.body.classList.add('dash-drag-active');
    const start = pointerCell(e, grid);
    const w = state.dash.widgets.find(x => x.id === id);
    if (!w) return;
    const offset = { dCol: start.col - w.col, dRow: start.row - w.row };
    state.dragging = { id, offset };
    // Create a transparent overlay to reliably capture pointer events above iframes
    dragShield = document.createElement('div');
    dragShield.className = 'fixed inset-0 z-[3000] cursor-grabbing';
    dragShield.style.background = 'transparent';
    dragShield.style.pointerEvents = 'auto';
    document.body.appendChild(dragShield);
    dragShield.addEventListener('pointermove', onDrag);
    dragShield.addEventListener('pointerup', endDrag, { once: true });
    dragShield.addEventListener('pointercancel', endDrag, { once: true });
  }
  function onDrag(e) {
    const d = state.dragging; if (!d) return;
    const w = state.dash.widgets.find(x => x.id === d.id); if (!w) return;
    const cell = pointerCell(e, grid);
    const newCol = clamp(1, GRID_COLS - w.w + 1, cell.col - d.offset.dCol);
    const newRow = clamp(1, GRID_ROWS - w.h + 1, cell.row - d.offset.dRow);
    // Update state
    w.col = newCol;
    w.row = newRow;
    // Move only the dragged element's DOM node to avoid re-rendering iframes
    const el = grid.querySelector(`[data-id="${d.id}"]`);
    if (el) {
      el.style.gridColumn = `${w.col} / span ${w.w}`;
      el.style.gridRow = `${w.row} / span ${w.h}`;
    }
  }
  function endDrag() {
    state.dragging = null;
    if (dragShield) {
      dragShield.removeEventListener('pointermove', onDrag);
      try { dragShield.remove(); } catch {}
      dragShield = null;
    }
    // resume saves now
    document.body.classList.remove('dash-drag-active');
    // Resolve collisions only once at drop time
    gravityPack(state.dash.widgets, null);
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
    const prev = { w: w.w, h: w.h };
    if (r.edge === 'right') {
      const newW = clamp(def.minW, Math.min(def.maxW, GRID_COLS - w.col + 1), cell.col - w.col + 1);
      w.w = newW;
    }
    if (r.edge === 'bottom') {
      let newH = clamp(def.minH, Math.min(def.maxH, GRID_ROWS - w.row + 1), cell.row - w.row + 1);
      // If increasing height causes collision, try decreasing stepwise to nearest fit
      if (newH > prev.h) {
        while (newH > prev.h) {
          w.h = newH;
          if (!collidesAny(state.dash.widgets, w.id)) break;
          newH -= 1;
        }
      }
      w.h = newH;
    }
    if (collidesAny(state.dash.widgets, w.id)) { w.w = prev.w; w.h = prev.h; }
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
    const prev = { w: w.w, h: w.h };
    let newW = clamp(def.minW, Math.min(def.maxW, GRID_COLS - w.col + 1), w.w + dW);
    let newH = clamp(def.minH, Math.min(def.maxH, GRID_ROWS - w.row + 1), w.h + dH);
    // For vertical increase, try step-down fit to avoid instant revert
    if (newH > prev.h) {
      let testH = newH;
      while (testH > prev.h) {
        w.h = testH; w.w = prev.w;
        if (!collidesAny(state.dash.widgets, w.id)) { newH = testH; break; }
        testH -= 1;
      }
    }
    w.w = newW; w.h = newH;
    if (collidesAny(state.dash.widgets, w.id)) { w.w = prev.w; w.h = prev.h; }
    render(); // reflect immediately
    saveDashboard(state.dash);
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
function renderWidgetContents(type, widgetId, expanded = false) {
  if (type === 'search') {
    const url = '/demos/ui/T-009c_search.html?hud=0';
    return `<iframe src="${url}" class="w-full h-full border-0" loading="lazy"></iframe>`;
  }
  if (type === 'draft') {
    // Inline draft form; load module to initialize after mount
    setTimeout(async () => {
      try {
        const mod = await import('./draft.js');
        const container = document.getElementById(`draft-${widgetId}`);
        if (container) mod.initDraftWidget(container);
      } catch {}
    }, 0);
    return `<div class="w-full h-full"><div id="draft-${widgetId}" class="w-full h-full"></div></div>`;
  }
  if (type === 'tiers') {
    return `<div class="w-full h-full p-3 overflow-auto text-slate-700">Tiers widget (coming soon)</div>`;
  }
  if (type === 'roster') {
    setTimeout(async () => {
      try {
        const mod = await import('./roster.js');
        const container = document.getElementById(`roster-${widgetId}`);
        if (container && mod.attachRosterAutoRefresh) mod.attachRosterAutoRefresh(container, 1000);
      } catch {}
    }, 0);
    return `<div class="w-full h-full"><div id="roster-${widgetId}" class="w-full h-full p-2 overflow-auto"></div></div>`;
  }
  if (type === 'budget') {
    return `<div class="w-full h-full p-3 text-slate-700">Budget Tracker widget (coming soon)</div>`;
  }
  if (type === 'ledger') {
    setTimeout(async () => {
      try {
        const mod = await import('./ledger.js');
        const container = document.getElementById(`ledger-${widgetId}`);
        if (container) mod.initLedgerWidget(container);
      } catch {}
    }, 0);
    return `<div class="w-full h-full"><div id="ledger-${widgetId}" class="w-full h-full"></div></div>`;
  }
  return `<div class="w-full h-full p-3">${type || ''}</div>`;
}


