# Prompt: Recreate a “Robinhood Legend”-style trading desktop layout (web)

**Overall vibe**
- Modern, minimalist trading workstation for desktop browsers.
- Dark theme UI with high-contrast neutral grays and a vivid lime/neon accent for focus states, highlights, and primary actions (akin to “Robin Neon,” approx `#CCFF00`). Keep the accent sparse and purposeful.
- Real-time/active feel: subtle motion on hover/focus, crisp 1px borders, thin dividers, and dense data tables.
- Grid of **widgets** that the user can arrange into a **custom layout** with drag-to-reposition and drag-to-resize behavior; layouts are saveable/restorable from presets.

**Layout system**
- Use a **full-viewport app shell**:
  - Fixed **top app bar** (56–64px high).
  - Optional **left rail** (collapsible to 56–64px) for global nav / watchlists / layout switcher.
  - **Main canvas**: a responsive, multi-column widget grid.
- Implement the grid with **CSS Grid** using named areas or auto-placement:
  - Example container:  
    ```css
    .grid {
      display: grid;
      grid-auto-flow: dense;
      grid-template-columns: repeat(24, minmax(0, 1fr));
      grid-auto-rows: 12px; /* base row unit for fine-grained resize */
      gap: 8px;
    }
    ```
  - Each widget card declares its own span via inline style or CSS class, e.g. `grid-column: span 8; grid-row: span 20;`.
  - Provide **snap-to-grid** resizing and keyboard nudging (arrow keys move by 1 column/row unit).
- Support **multi-monitor / large desktop** sizes gracefully; content density scales up to show more rows/columns (no arbitrary max width).

**Top app bar**
- Left: product logo (monochrome), **Layout selector** (dropdown with presets + “New layout”), Undo/Redo for layout edits.
- Center: **Global search** input (tickers/symbols), stretch to fill remaining space.
- Right: Connection status (live data dot), Notifications (bell), Settings (cog), Account avatar.
- Style: translucent dark surface (backdrop-filter: blur 6px), 1px bottom border using a lighter gray.

**Left rail (optional)**
- Width 280–320px expanded; 64px collapsed.
- Sections: **Watchlists**, **Layouts**, **Linked groups** (for widget linking by color/letter).
- Scrolling column with sticky section headers and subtle separators.
- Collapse/expand chevron; tooltips for icons in collapsed state.

**Widget cards**
- Card container with:
  - Rounded corners (8–10px), dark surface (`--surface-1`), 1px hairline border (`--border-1`), inner padding 8–12px.
  - **Title bar**: left-aligned title, small meta controls (timeframe, filters), right-aligned actions: link toggle (link icon with colored dot when active), pop-out, settings (kebab), close (×).
  - **Resize handle** in the bottom-right corner (visible on hover/focus).
  - **Drag handle** on the title bar (cursor: grab; grabbing on drag).
- Widgets to include (stubs with realistic structure):
  1) **Chart**: canvas area + toolbar for interval, chart type (candles, line, Heikin Ashi), indicators (MA, Bollinger, VWAP, etc.), drawing tools. Place **buy/sell** buttons near chart edge, disabled by default.  
  2) **Watchlist**: table with columns Symbol | Last | Chg | % | Volume; row hover highlights; right-click row opens quick actions.  
  3) **Options chain**: sticky header with expiration selector; table with Calls/Puts split, strikes in center; greeks columns; row hover state.  
  4) **Positions / Orders**: compact, zebra-striped rows, numeric alignment right, monospace figures.  
  5) **News / Alerts**: list with timestamps; unread badge dot using accent color.  
  6) **Order ticket**: side panel variant (see “Panels” below).

**Widget linking (cross-highlighting)**
- Enable **link groups**: clicking a link icon cycles through group colors (A/B/C…). Widgets in the same group **synchronize symbol/timeframe/selection**. Show a small colored pill next to the widget title when linked.

**Panels and modals**
- **Right dockable panel** pattern for **Order Ticket**:
  - 360–420px width, resizable, overlaid on the grid at the right edge; slide-in/out animation.
  - Sections: Symbol + price, Order type selector, Quantity, Time in force, Est. cost; **Primary CTA** uses accent color with high contrast.
- **Settings modal**: centered, 720–960px max-width, segmented controls/tabs; dimmed scrim.

**Theming & tokens (CSS variables)**
```css
:root {
  --accent: #ccff00;        /* neon-like accent */
  --bg: #0b0b0c;            /* app background */
  --surface-1: #121214;     /* card surface */
  --surface-2: #18181b;     /* elevated surface */
  --text-1: #f5f5f6;        /* primary text */
  --text-2: #b3b3b8;        /* secondary text */
  --text-muted: #8a8a90;
  --border-1: #2a2a2f;
  --border-2: #3a3a40;
  --positive: #3ddc84;      /* up moves */
  --negative: #ff5a5f;      /* down moves */
  --focus: 0 0 0 2px var(--accent);
}
```
- Prefer **system fonts** or a clean geometric sans; use **tabular/lining numerals** for market data.
- Use **color-safe** combinations for accessibility; all interactive elements must meet contrast ratios.

**States & interactions**
- **Hover**: cards elevate slightly (shadow + subtle scale 0.998→1.0); buttons/text links brighten.
- **Focus**: focus ring using `box-shadow: var(--focus)`; no default outlines.
- **Active/drag**: card drops shadow and shows a dashed outline of its grid footprint while dragging.
- **Loading**: use animated skeleton lines or shimmer in tables and charts.
- **Live data**: show a tiny pulsing dot next to “LIVE” in the app bar; do not over-animate.

**Tables**
- Dense, compact rows (28–32px), tight cell padding (6–8px).
- Right-align numeric columns; monospaced numbers; use subtle **green/red** text for price change; colorblind-safe icons as secondary indicators.
- Sticky headers; column resizing; column visibility menu; infinite scroll with virtualization.
- Row hover background `rgba(255,255,255,0.04)`; selection uses accent-tinted overlay.

**Charts (visual spec)**
- Dark plot area with thin gridlines; price axis on right, time axis bottom.
- Chart types: candlestick, OHLC, line, Heikin Ashi; configurable intervals.
- Indicators: SMA/EMA, Bollinger Bands, VWAP, Ichimoku, volume overlay; indicator legend chips above the plot; draggable drawing tools.

**Layout management**
- **Presets**: “Chart-centric,” “Chain-centric,” “Multi-chart (up to 8),” etc. Users can save, rename, duplicate, delete layouts.
- **Undo/Redo** for grid edits; show a toast “Layout saved” with timestamp.
- **Responsive behavior**: minimum card size enforces readability; when viewport shrinks, widgets wrap to new rows; no horizontal page scroll.

**Performance considerations**
- Virtualize long lists; throttle chart redraw; debounce resize.
- Lazy-load widgets outside viewport; maintain real-time only for visible/linked widgets.

**Microcopy & help**
- Tooltips on controls; a **Layouts** help link opens a support doc in a new tab.

**Pages & routes**
- Single-page app feel; layout state in URL (querystring or hash) to enable sharing/restoring.
- Deep links open specific widgets/symbols.

**Accessibility**
- All controls keyboard reachable; reorder via keyboard: `Enter` to pick up widget, arrows to move by grid unit, `Enter` to drop.
- Live regions for price updates with polite announcements.

**Deliverables**
- HTML structure with app shell (`header`, `aside`, `main`), a 24-column CSS Grid, and 4–6 sample widgets (Chart, Watchlist, Options Chain, Orders, News, Order Ticket panel).
- SCSS/CSS modules implementing tokens, dark theme, and states above.
- Minimal TypeScript to wire drag-resize, link groups, and a mock data stream; keep data layer abstract.
