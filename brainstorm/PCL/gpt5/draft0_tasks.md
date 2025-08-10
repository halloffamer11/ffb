Milestones

M1 – Project shell & storage (Day 1)

Next.js + TS scaffold; tabs; Zustand/Context store.

IndexedDB autosave; Save/Load .nfcdraft.json.

PWA manifest + service worker.

M2 – Ingest & mapping (Day 2)

CSV/XLSX parsing; field mapper; normalization; grid view with sort/filter/edit.

Missing‑field warnings.

M3 – Scoring engine (Day 3)

Canonical scoring; unit tests; live recompute.

M4 – VBD + Flex (Day 4)

Greedy fill; replacement levels; VBD column.

M5 – Dashboard polish (Day 5)

Delta‑based tiers; injury color chips; column chooser; CSV export.

Team Needs sidebar stub (hidden by default).

M6 – Debug & validation (Day 6)

Golden loader; per‑player diffs; MAE/% within tolerance; missing fields report.

M7 – QA & deploy (Day 7)

Cross‑browser checks; offline checks; small docs page; deploy to Vercel/Firebase Hosting.

Work Breakdown

Foundation: project setup, state store, routing, error boundary.

Storage: IndexedDB service; file serializer/deserializer; workspace schema.

League Settings: forms, presets, validation, autosave.

Ingest: parsers, mapper UI, normalizer (positions/teams/injury), grid with edit history.

Compute: scoring engine (pure), VBD greedy algorithm, tiers calc, memoization.

UI: Dashboard table (virtualized), filters, position switcher, chips, exporter.

Debug: golden load, diff engine, metrics view.

PWA: manifest, service worker, cache strategy.

QA: golden tests, performance profiling, accessibility basics.

Risks & Mitigations

Header mismatch / messy inputs → robust mapper + saved templates; clear warnings.

Flex baseline correctness → deterministic greedy implementation + unit tests with synthetic rosters.

Offline edge cases → conservative cache updates; explicit Save/Load file always available.

Performance → virtualized tables; memoized computations.

Out of Scope (now)

K/DST/IDP; scraping/API; accounts/cloud sync; mobile layout polish; live bidding guidance; suggested bids.

Deliverables

Running PWA, repo with tests, short README, sample workspace + example golden validation report.