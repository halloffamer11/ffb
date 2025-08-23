// Dashboard Grid Engine (4x8) with edit mode, drag, resize, gravity packing
// Spec-aligned MVP. Keeps state in workspace storage under dashboard key.

import { createStorageAdapter } from '../adapters/storage.js';

const GRID_ROWS = 6;
const GRID_COLS = 12;
const SAVE_DEBOUNCE_MS = 50;
const INTERACT_CLASS = 'dash-interacting';

export const WidgetRegistry = {
  search: { name: 'Search & Select', minW: 2, minH: 1, maxW: 8, maxH: 12, defaultW: 8, defaultH: 2 },
  draft: { name: 'Draft Entry', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  vbdScatter: { name: 'VBD Charts', minW: 4, minH: 3, maxW: 12, maxH: 6, defaultW: 8, defaultH: 4 },
  roster: { name: 'My Roster', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  budget: { name: 'Budget Tracker', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  ledger: { name: 'Draft Ledger', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 },
  analysis: { name: 'Player Analysis', minW: 2, minH: 1, maxW: 8, maxH: 4, defaultW: 4, defaultH: 2 }
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
      { id: 'w_vbdScatter', type: 'vbdScatter', row: 3, col: 1, w: 8, h: 4, config: {} },
      { id: 'w_roster', type: 'roster', row: 3, col: 9, w: 4, h: 2, config: {} },
      { id: 'w_budget', type: 'budget', row: 5, col: 9, w: 4, h: 2, config: {} }
    ],
    layouts: { presets: {}, custom: {} }
  };
}

let saveTimer = null;
  function saveDashboard(dash) {
  clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      // Skip autosave while drag is active to avoid iframe reloads/refresh loops
      if (document.body.classList.contains('dash-drag-active') || document.body.classList.contains(INTERACT_CLASS)) return;
      store.set('dashboard', dash);
    }, SAVE_DEBOUNCE_MS);
}

export function initDashboard(root) {
  if (!root) { console.warn('[dashboard] initDashboard: root not found'); return; }
  const dash = loadDashboard();
  let isDragging = false; // drag/resize guard to avoid mid-drag saves/renders
  const state = { dash, edit: false, dragging: null, resizing: null, selectedId: null };

  const toolbar = root.querySelector('[data-action="toolbar"]');
  const grid = root.querySelector('[data-grid]');
  if (!grid) { console.warn('[dashboard] initDashboard: grid not found'); return; }
  let dragShield = null;
  let previewBox = null;
  let previewLabel = null;
  let resizeCaptureEl = null;

  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
  grid.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;
  // Performance containment to avoid expensive reflow outside grid during interactions
  try { grid.style.contain = 'layout paint size'; } catch {}
  try { grid.style.position = 'relative'; } catch {}

  function ensurePreview() {
    if (!previewBox) {
      previewBox = document.createElement('div');
      previewBox.style.position = 'fixed';
      previewBox.style.pointerEvents = 'none';
      previewBox.style.border = '2px solid rgba(16,185,129,0.9)';
      previewBox.style.background = 'rgba(16,185,129,0.08)';
      previewBox.style.zIndex = '3500';
      document.body.appendChild(previewBox);
    }
    if (!previewLabel) {
      previewLabel = document.createElement('div');
      previewLabel.style.position = 'fixed';
      previewLabel.style.pointerEvents = 'none';
      previewLabel.style.zIndex = '3501';
      previewLabel.style.background = 'rgba(15,23,42,0.7)';
      previewLabel.style.color = '#fff';
      previewLabel.style.fontSize = '11px';
      previewLabel.style.padding = '2px 6px';
      previewLabel.style.borderRadius = '4px';
      document.body.appendChild(previewLabel);
    }
  }
  function hidePreview() {
    if (previewBox && previewBox.parentNode) previewBox.parentNode.removeChild(previewBox);
    if (previewLabel && previewLabel.parentNode) previewLabel.parentNode.removeChild(previewLabel);
    previewBox = null; previewLabel = null;
  }
  function updatePreview(col, row, wSpan, hSpan, intent) {
    ensurePreview();
    const rect = grid.getBoundingClientRect();
    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;
    const left = rect.left + (col - 1) * cellW;
    const top = rect.top + (row - 1) * cellH;
    const width = wSpan * cellW;
    const height = hSpan * cellH;
    previewBox.style.left = `${left}px`;
    previewBox.style.top = `${top}px`;
    previewBox.style.width = `${width}px`;
    previewBox.style.height = `${height}px`;
    // Color by intent
    if (intent === 'swap') {
      previewBox.style.borderColor = 'rgba(245,158,11,0.95)';
      previewBox.style.background = 'rgba(245,158,11,0.08)';
    } else if (intent === 'invalid') {
      previewBox.style.borderColor = 'rgba(239,68,68,0.95)';
      previewBox.style.background = 'rgba(239,68,68,0.08)';
    } else {
      previewBox.style.borderColor = 'rgba(16,185,129,0.95)';
      previewBox.style.background = 'rgba(16,185,129,0.08)';
    }
    previewLabel.style.left = `${left + 6}px`;
    previewLabel.style.top = `${Math.max(0, top - 22)}px`;
    previewLabel.textContent = `C${col} R${row} · W${wSpan} H${hSpan}${intent ? ' · ' + intent : ''}`;
  }

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
      if (state.selectedId === w.id && state.edit) {
        el.classList.add('ring-2', 'ring-emerald-500');
      }
      const typeSelectMarkup = state.edit ? `<select class="widget-type px-2 py-1 border rounded text-xs">
            ${Object.entries(WidgetRegistry).map(([k,def2]) => `<option value="${k}" ${w.type===k?'selected':''}>${def2.name}</option>`).join('')}
          </select>` : '';
      el.innerHTML = `
        <div class="w-full h-full flex flex-col relative">
          <div class="widget-header flex items-center gap-2 px-2 py-1 border-b ${state.edit ? 'bg-slate-50/80 backdrop-blur-sm' : 'bg-slate-50'}">
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
        // selection
        el.addEventListener('click', (evt) => {
          // ignore clicks on controls
          const t = /** @type {HTMLElement} */ (evt.target);
          if (t && (t.closest('.widget-header select') || t.closest('button'))) return;
          state.selectedId = w.id; saveDashboard(state.dash); render();
        });
        const handle = el.querySelector('.drag-handle');
        handle?.addEventListener('pointerdown', (e) => {
          if (handle.setPointerCapture) { try { handle.setPointerCapture(e.pointerId); } catch {} }
          startDrag(e, w.id);
        });
        el.querySelector('.btn-del')?.addEventListener('click', (e) => { e.stopPropagation(); delWidget(w.id); });
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
    document.body.classList.add(INTERACT_CLASS);
    const start = pointerCell(e, grid);
    const w = state.dash.widgets.find(x => x.id === id);
    if (!w) return;
    const offset = { dCol: start.col - w.col, dRow: start.row - w.row };
    // Precompute cell size for transform-based preview
    const rect = grid.getBoundingClientRect();
    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;
    const el = grid.querySelector(`[data-id="${id}"]`);
    state.dragging = {
      id,
      offset,
      startCol: w.col,
      startRow: w.row,
      targetCol: w.col,
      targetRow: w.row,
      cellW,
      cellH,
      el,
      raf: 0,
      dx: 0,
      dy: 0
    };
    if (el) {
      try { el.style.willChange = 'transform'; } catch {}
    }
    // initial preview
    updatePreview(w.col, w.row, w.w, w.h, undefined);
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
    // Recompute grid bounds each frame to handle zoom/resize
    const cell = pointerCell(e, grid);
    const targetCol = clamp(1, GRID_COLS - w.w + 1, cell.col - d.offset.dCol);
    const targetRow = clamp(1, GRID_ROWS - w.h + 1, cell.row - d.offset.dRow);
    d.targetCol = targetCol;
    d.targetRow = targetRow;
    d.dx = (targetCol - d.startCol) * d.cellW;
    d.dy = (targetRow - d.startRow) * d.cellH;
    // intent: evaluate swap strictly per policy
    const testA = { id: w.id, row: targetRow, col: targetCol, w: w.w, h: w.h };
    const valid = rectInBounds(testA) && !anyCollisionExcept(testA, [w.id]);
    // cache last valid target for exact commit; do not mutate layout here
    d.lastValidTarget = valid ? { row: targetRow, col: targetCol } : null;
    updatePreview(targetCol, targetRow, w.w, w.h, valid ? 'place' : 'invalid');
    if (!d.raf) {
      d.raf = requestAnimationFrame(() => {
        const dd = state.dragging; if (!dd) return;
        if (dd.el) dd.el.style.transform = `translate3d(${Math.round(dd.dx)}px, ${Math.round(dd.dy)}px, 0)`;
        dd.raf = 0;
      });
    }
  }
  function endDrag(e) {
    const d = state.dragging;
    if (dragShield) {
      dragShield.removeEventListener('pointermove', onDrag);
      try { dragShield.remove(); } catch {}
      dragShield = null;
    }
    // resume saves now
    document.body.classList.remove('dash-drag-active');
    document.body.classList.remove(INTERACT_CLASS);
    if (!d) { render(); return; }
    const w = state.dash.widgets.find(x => x.id === d.id); if (!w) { render(); return; }
    // Final target from last preview (fallback to pointer)
    let newCol = d.targetCol;
    let newRow = d.targetRow;
    if (e && e.clientX != null) {
      const cell = pointerCell(e, grid);
      newCol = clamp(1, GRID_COLS - w.w + 1, cell.col - d.offset.dCol);
      newRow = clamp(1, GRID_ROWS - w.h + 1, cell.row - d.offset.dRow);
    }
    // Clear preview transform
    if (d.el) {
      try { d.el.style.transform = ''; } catch {}
      try { d.el.style.willChange = 'auto'; } catch {}
    }
    hidePreview();
    // Place only into empty, in-bounds cells (no swap)
    let commitTarget = d && d.lastValidTarget ? { row: d.lastValidTarget.row, col: d.lastValidTarget.col } : { row: newRow, col: newCol };
    const testA = { id: w.id, row: commitTarget.row, col: commitTarget.col, w: w.w, h: w.h };
    if (rectInBounds(testA) && !anyCollisionExcept(testA, [w.id])) {
      w.row = commitTarget.row; w.col = commitTarget.col;
    } else {
      try { console.debug('[dashboard] commit blocked', 'invalid_target'); } catch {}
    }
    state.dragging = null;
    saveDashboard(state.dash);
    render();
  }

  // Align overlay on resize/zoom: recompute preview and any ongoing drag coords
  let resizeRaf = 0;
  function onResizeAlign() {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      // If dragging, update preview box based on fresh cell geometry
      const d = state.dragging;
      if (d) {
        const w = state.dash.widgets.find(x => x.id === d.id);
        if (w) updatePreview(d.targetCol, d.targetRow, w.w, w.h, 'place');
      }
    });
  }
  window.addEventListener('resize', onResizeAlign);

  function startResize(e, id, edge) {
    e.stopPropagation(); e.preventDefault();
    const w = state.dash.widgets.find(x => x.id === id); if (!w) return;
    state.resizing = { id, edge };
    document.body.classList.add('dash-drag-active');
    // guard to avoid mid-drag saves/renders
    try { /* isDragging */ isDragging = true; } catch {}
    // Capture pointer on the edge element to prevent loss to iframes
    resizeCaptureEl = /** @type {HTMLElement} */ (e.target);
    try { resizeCaptureEl?.setPointerCapture?.(e.pointerId); } catch {}
    // Use a full-screen shield to gate events from iframes during resize
    dragShield = document.createElement('div');
    dragShield.className = 'fixed inset-0 z-[3000]';
    dragShield.style.background = 'transparent';
    dragShield.style.pointerEvents = 'auto';
    document.body.appendChild(dragShield);
    dragShield.addEventListener('pointermove', onResize);
    dragShield.addEventListener('pointerup', endResize, { once: true });
    dragShield.addEventListener('pointercancel', endResize, { once: true });
    // initial preview
    updatePreview(w.col, w.row, w.w, w.h, undefined);
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
    // Inline update only to avoid full re-render mid-resize
    const el = grid.querySelector(`[data-id="${r.id}"]`);
    if (el) {
      el.style.gridColumn = `${w.col} / span ${w.w}`;
      el.style.gridRow = `${w.row} / span ${w.h}`;
    }
    updatePreview(w.col, w.row, w.w, w.h, 'resize');
  }
  function endResize() {
    state.resizing = null;
    // Remove shield and release capture
    if (dragShield) {
      dragShield.removeEventListener('pointermove', onResize);
      try { dragShield.remove(); } catch {}
      dragShield = null;
    }
    try { resizeCaptureEl?.releasePointerCapture?.(/** @type any */ (0)); } catch {}
    resizeCaptureEl = null;
    document.body.classList.remove('dash-drag-active');
    try { isDragging = false; } catch {}
    hidePreview();
    saveDashboard(state.dash);
    render();
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
  function rectInBounds(rect) {
    if (!rect) return false;
    if (rect.col < 1 || rect.row < 1) return false;
    if (rect.col + rect.w - 1 > GRID_COLS) return false;
    if (rect.row + rect.h - 1 > GRID_ROWS) return false;
    return true;
  }
  function anyCollisionExcept(rect, exceptIds) {
    const except = new Set(exceptIds || []);
    for (const ow of state.dash.widgets) {
      if (except.has(ow.id)) continue;
      const orect = { id: ow.id, row: ow.row, col: ow.col, w: ow.w, h: ow.h };
      if (collides(rect, orect)) return true;
    }
    return false;
  }
  function canSwap(a, targetRectA, b, targetRectB) {
    if (a.w !== b.w || a.h !== b.h) return false;
    if (!rectInBounds(targetRectA) || !rectInBounds(targetRectB)) return false;
    const exceptIds = [a.id, b.id];
    if (anyCollisionExcept(targetRectA, exceptIds)) return false;
    if (anyCollisionExcept(targetRectB, exceptIds)) return false;
    return true;
  }

  // Vacancy-first park-and-swap utilities
  function findVacancy(size, startRow, startCol, exceptIds) {
    const { w, h } = size;
    // Row-major scan beginning at (startRow,startCol), then wrap
    const rows = [];
    for (let r = startRow; r <= GRID_ROWS; r += 1) rows.push(r);
    for (let r = 1; r < startRow; r += 1) rows.push(r);
    for (const r of rows) {
      const cols = [];
      if (r === startRow) {
        for (let c = startCol; c <= GRID_COLS; c += 1) cols.push(c);
        for (let c = 1; c < startCol; c += 1) cols.push(c);
      } else {
        for (let c = 1; c <= GRID_COLS; c += 1) cols.push(c);
      }
      for (const c of cols) {
        // Do not consider B's current origin a vacancy
        if (r === startRow && c === startCol) continue;
        const rect = { row: r, col: c, w, h };
        if (!rectInBounds(rect)) continue;
        if (!anyCollisionExcept({ id: '__test__', ...rect }, exceptIds)) return rect;
      }
    }
    return null;
  }

  // Propose & Commit helpers (swap-free)
  function proposeMove(widget, toRow, toCol) {
    const a = widget;
    const proposedA = { id: a.id, row: toRow, col: toCol, w: a.w, h: a.h };
    if (!rectInBounds(proposedA)) return { ok: false, reason: 'oob' };
    if (anyCollisionExcept(proposedA, [a.id])) return { ok: false, reason: 'collision' };
    return { ok: true, positions: new Map([[a.id, { row: toRow, col: toCol }]]) };
  }

  function commitPositions(positions, opLabel) {
    if (!positions || positions.size === 0) return false;
    for (const [id, pos] of positions.entries()) {
      const item = state.dash.widgets.find(w => w.id === id);
      if (!item) continue;
      item.row = pos.row; item.col = pos.col;
    }
    try { console.debug('[dashboard] commit', opLabel || 'move', Array.from(positions.entries())); } catch {}
    return true;
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
  const editBtn = toolbar.querySelector('[data-btn="edit"]');
  if (editBtn) {
    editBtn.textContent = 'Toggle Edit (E)';
    editBtn.addEventListener('click', () => { state.edit = !state.edit; render(); });
  }
  toolbar.querySelector('[data-btn="add"]')?.addEventListener('click', () => {
    const sel = root.querySelector('[data-select="widget"]');
    addWidget(sel?.value || 'tiers');
  });

  render();

  // Global hotkey: E toggles edit when dashboard root is in view and not typing
  window.addEventListener('keydown', (ev) => {
    const key = String(ev.key || '').toLowerCase();
    if (key !== 'e') return;
    const ae = document.activeElement;
    const tag = (ae && ae.tagName) ? ae.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'select' || tag === 'textarea' || (ae && ae.isContentEditable)) return;
    // Minimal scope check: ensure grid exists (dashboard visible)
    if (!grid || !grid.isConnected) return;
    ev.preventDefault();
    state.edit = !state.edit; render();
  });

  // Keyboard shortcuts (edit mode): arrows move, Shift+arrows resize, Delete removes
  let kbCommitTimer = null;
  function commitKeyboardInteraction() {
    document.body.classList.remove(INTERACT_CLASS);
    // Nothing else here; state has already been updated inline or via proposal
    saveDashboard(state.dash);
    render();
  }
  window.addEventListener('keydown', (e) => {
    if (!state.edit) return;
    // Ignore when typing in inputs/selects
    const ae = document.activeElement;
    const tag = (ae && ae.tagName) ? ae.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    const id = state.selectedId; if (!id) return;
    const w = state.dash.widgets.find(x => x.id === id); if (!w) return;
    const step = 1;
    let changed = false;
    if (e.key === 'ArrowLeft' && !e.shiftKey) { w.col = clamp(1, GRID_COLS - w.w + 1, w.col - step); changed = true; }
    if (e.key === 'ArrowRight' && !e.shiftKey) { w.col = clamp(1, GRID_COLS - w.w + 1, w.col + step); changed = true; }
    if (e.key === 'ArrowUp' && !e.shiftKey) { w.row = clamp(1, GRID_ROWS - w.h + 1, w.row - step); changed = true; }
    if (e.key === 'ArrowDown' && !e.shiftKey) { w.row = clamp(1, GRID_ROWS - w.h + 1, w.row + step); changed = true; }
    if (e.key === 'ArrowLeft' && e.shiftKey) { w.w = clamp(WidgetRegistry[w.type].minW, Math.min(WidgetRegistry[w.type].maxW, GRID_COLS - w.col + 1), w.w - step); changed = true; }
    if (e.key === 'ArrowRight' && e.shiftKey) { w.w = clamp(WidgetRegistry[w.type].minW, Math.min(WidgetRegistry[w.type].maxW, GRID_COLS - w.col + 1), w.w + step); changed = true; }
    if (e.key === 'ArrowUp' && e.shiftKey) { w.h = clamp(WidgetRegistry[w.type].minH, Math.min(WidgetRegistry[w.type].maxH, GRID_ROWS - w.row + 1), w.h - step); changed = true; }
    if (e.key === 'ArrowDown' && e.shiftKey) { w.h = clamp(WidgetRegistry[w.type].minH, Math.min(WidgetRegistry[w.type].maxH, GRID_ROWS - w.row + 1), w.h + step); changed = true; }
    if (e.key === 'Delete') { delWidget(w.id); e.preventDefault(); return; }
    if (!changed) return;
    document.body.classList.add(INTERACT_CLASS);
    // No swap behavior: if move causes overlap, revert immediately
    if (!e.shiftKey) {
      const testA = { id: w.id, row: w.row, col: w.col, w: w.w, h: w.h };
      const overlap = state.dash.widgets.find(o => o.id !== w.id && collides(testA, { id: o.id, row: o.row, col: o.col, w: o.w, h: o.h }));
      if (overlap) {
        if (e.key === 'ArrowLeft') w.col += step;
        if (e.key === 'ArrowRight') w.col -= step;
        if (e.key === 'ArrowUp') w.row += step;
        if (e.key === 'ArrowDown') w.row -= step;
      }
    }
    // Reflect state after keyboard move without full re-render
    for (const ww of state.dash.widgets) {
      const node = grid.querySelector(`[data-id="${ww.id}"]`);
      if (node) {
        node.style.gridColumn = `${ww.col} / span ${ww.w}`;
        node.style.gridRow = `${ww.row} / span ${ww.h}`;
      }
    }
    clearTimeout(kbCommitTimer);
    kbCommitTimer = setTimeout(commitKeyboardInteraction, 250);
    e.preventDefault();
  });
  window.addEventListener('keyup', () => {
    if (!document.body.classList.contains(INTERACT_CLASS)) return;
    clearTimeout(kbCommitTimer);
    kbCommitTimer = setTimeout(commitKeyboardInteraction, 100);
  });

  // Layout preset helpers (optional UI wiring)
  function savePreset(name) {
    if (!name) return;
    state.dash.layouts = state.dash.layouts || { presets: {}, custom: {} };
    const snapshot = state.dash.widgets.map(w => ({ ...w }));
    state.dash.layouts.custom[name] = { widgets: snapshot, ts: Date.now() };
    saveDashboard(state.dash);
    refreshPresetDropdown();
  }
  function loadPreset(name) {
    const src = state.dash.layouts?.custom?.[name] || state.dash.layouts?.presets?.[name];
    if (!src || !Array.isArray(src.widgets)) return;
    state.dash.widgets = src.widgets.map(w => ({ ...w }));
    saveDashboard(state.dash);
    render();
  }
  function wipePresets() {
    state.dash.layouts = state.dash.layouts || { presets: {}, custom: {} };
    state.dash.layouts.custom = {};
    saveDashboard(state.dash);
    refreshPresetDropdown();
  }
  function refreshPresetDropdown() {
    const sel = toolbar?.querySelector('[data-select="presetList"]');
    if (!sel) return;
    const custom = state.dash.layouts?.custom || {};
    const options = ['<option value="">Load Preset…</option>']
      .concat(Object.keys(custom).sort().map(k => `<option value="${k}">${k}</option>`));
    sel.innerHTML = options.join('');
  }
  toolbar?.querySelector('[data-btn="savePreset"]')?.addEventListener('click', () => {
    const name = String(toolbar.querySelector('[data-input="presetName"]')?.value || '').trim();
    if (!name) { alert('Enter a preset name'); return; }
    savePreset(name);
  });
  toolbar?.querySelector('[data-btn="loadPreset"]')?.addEventListener('click', () => {
    const name = String(toolbar.querySelector('[data-input="presetName"]')?.value || '').trim();
    if (!name) { alert('Enter a preset name'); return; }
    loadPreset(name);
  });
  toolbar?.querySelector('[data-select="presetList"]')?.addEventListener('change', (e) => {
    const val = String(e.target.value || '').trim();
    if (!val) return;
    loadPreset(val);
    e.target.value = '';
  });
  toolbar?.querySelector('[data-btn="wipePresets"]')?.addEventListener('click', () => {
    if (!confirm('Remove all custom dashboard presets? This cannot be undone.')) return;
    wipePresets();
  });
  // initial populate
  refreshPresetDropdown();
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
  if (type === 'vbdScatter') {
    setTimeout(async () => {
      try {
        const mod = await import('./vbdScatter.js');
        const container = document.getElementById(`vbdScatter-${widgetId}`);
        if (container && mod.initVBDScatterWidget) mod.initVBDScatterWidget(container);
      } catch {}
    }, 0);
    return `<div class="w-full h-full"><div id="vbdScatter-${widgetId}" class="w-full h-full"></div></div>`;
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
    setTimeout(async () => {
      try {
        const mod = await import('./budget.js');
        const container = document.getElementById(`budget-${widgetId}`);
        const table = container ? container.querySelector('table') : null;
        if (table && mod.attachBudgetAutoRefresh) mod.attachBudgetAutoRefresh(table, 1000);
      } catch {}
    }, 0);
    return `<div class="w-full h-full p-2 overflow-auto"><div id="budget-${widgetId}" class="w-full h-full">
      <table class="min-w-full text-sm">
        <thead></thead>
        <tbody></tbody>
      </table>
    </div></div>`;
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
  if (type === 'analysis') {
    setTimeout(async () => {
      try {
        const mod = await import('./analysis.js');
        const container = document.getElementById(`analysis-${widgetId}`);
        if (container && mod.initAnalysisWidget) mod.initAnalysisWidget(container);
      } catch {}
    }, 0);
    return `<div class="w-full h-full"><div id="analysis-${widgetId}" class="w-full h-full p-2 overflow-auto"></div></div>`;
  }
  return `<div class="w-full h-full p-3">${type || ''}</div>`;
}


