Architecture Overview (client‑only MVP)

Framework: Next.js + TypeScript (static export or SSR disabled features), React 18.

State: lightweight store (Zustand or Context + reducers) for league settings, datasets, and derived caches.

Storage: IndexedDB (via idb) for autosave; File Save/Load of a single .nfcdraft.json workspace; optional File System Access API when available.

PWA: manifest + service worker for offline cache; cache app shell + last workspace snapshot.

Parsing: CSV/XLSX parsed client‑side (Papa Parse / SheetJS) with no uploads.

UI Composition (Tabs)

League Settings – forms for teams/budget/min bid, roster slots, scoring weights; preset templates; live validation.

Data – file import, field mapper, read‑only grid with per‑cell edit, filter/sort; warnings for missing fields.

Dashboard – computed table; position switcher; quick filters; export; Team Needs sidebar (stub) hidden by default.

Debug – golden load, diffs, MAE/% within tolerance, missing fields report.

Canonical Data Model

PlayerIdentity: { id, player_name, pos, team, age?, bye?, rookie?, injury_status?, aav? }
Stats:
  Passing: { pass_att?, pass_cmp?, pass_yds?, pass_td?, pass_int?, pass_2pt? }
  Rushing: { rush_att?, rush_yds?, rush_td? }
  Receiving: { tgt?, rec?, rec_yds?, rec_td?, rec_2pt? }
  Misc: { fumbles_lost? }
LeagueSettings:
  teams, budget, min_bid, roster: {QB,RB,WR,TE,Flex}, scoring: {passYd,passTD,INT,pass2pt,rushYd,rushTD,rec,recYd,recTD,rec2pt,fumbles}
Workspace:
  datasets: { projections, player_master, aav, rankings, adp, teams, depth_charts }, mappings, notes

Ingest & Mapping Flow

Load CSV/XLSX → sniff headers → user maps to canonical fields → validate types → normalize positions/teams/injury enums → store raw + normalized.

Missing fields: mark and continue; populate with neutral defaults when safe (e.g., missing tgt = 0) but never invent values.

Scoring Engine (deterministic)

Compute ProjPts per player as the linear combination of canonical stats and league scoring weights. Examples:

passYd: yards/25 (or weight entered) × coefficient

passTD: count × TD weight; INT: count × INT penalty

rushYd, rushTD; rec, recYd, recTD; fumbles_lost penalty; 2pt bonuses

Engine is pure and unit‑tested; re‑runs on dataset or settings change; memoize results.

VBD with Flex (Greedy Fill)

Sort players by ProjPts within each position.

Compute starters: for each position, take the top teams × roster[pos].

Compute Flex: from remaining RB/WR/TE, take the top teams × roster.Flex and assign them to Flex (no double counting).

Replacement level per position = next remaining player after steps 2–3.

VBD(player) = ProjPts(player) − ReplacementPts(position).

Recompute instantly when league settings or dataset change.

Tiers (delta‑based)

Sort by ProjPts within position; compute adjacent deltas; start a new tier when delta exceeds a threshold (default sensible constant; later make it a slider).

AAV Handling

Imported only in MVP (aav column). If absent, show “—”.

Optional scaling to league budget using free‑cap ratio: scaled = aav × (your_free_cap / source_free_cap); toggle in League Settings.

Injury Status (visual semantics)

Normalize to: Healthy / Q / D / O / IR / PUP / NA.

Color: Green=Healthy, Yellow=Q, Red=D/O/IR/PUP, Gray=NA. Provide icons + accessible labels.

Team Needs Sidebar (stub)

Hidden by default. Data contract: for each team → remaining slots per position and inferred pressure (e.g., many WRs left to fill).

MVP hook only; UI shows placeholder counts if provided; full logic deferred.

Error Handling & Debug

Hard parse errors: show banner with file + line.

Soft missing fields: per‑column chips + Debug detail; still compute with available inputs.

Debug outputs: per‑player diffs for ProjPts and VBD; MAE; % within tolerance.

Performance & Caching

Compute in ≤ 200 ms for up to ~2k players; memoize intermediate lists; virtualized table rendering.

Security/Privacy

No network calls in MVP; everything local; optional PWA caching.

Future Hooks (post‑MVP)

Firestore mirror + auth; live draft tracker; Suggested Bid; projection blending by stat with weights; mobile polish; scraping/API ingestion (server); LLM assist.