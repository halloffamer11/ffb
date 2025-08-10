Vision (MVP)

Deliver a bare‑bones, offline‑capable web app that replicates the core math and views of a fantasy auction draft helper for QB/RB/WR/TE only, using user‑provided public datasets. Priorities: correct ingest → correct scoring → correct VBD with Flex → simple table UI → HITL validation.

Key Personas

Solo Manager (primary): drafting on a laptop during a live auction; may go offline; wants trustworthy numbers and simple controls.

User Stories & Acceptance Criteria (MVP)

1) Configure my league

As a manager I want to set league size, auction budget, min bid, roster slots, and scoring so that points/VBD reflect my league.

Accept:

Form fields for: teams, budget, min bid, roster slots per position, Flex slots, scoring weights for passing/rushing/receiving/misc.

Client‑side validation and inline help.

Persist to browser (autosave) and Save/Load a .nfcdraft.json workspace file.

Works offline (PWA) after first load.

2) Ingest data and review it

As a manager I want to import CSV/XLSX projections/metadata/AAV so that I can view and edit raw rows before any calculations.

Accept:

Upload CSV/XLSX; mapping UI to canonical fields; preview table.

Sort/filter/search; manual edits per cell; revert change.

If a required column is missing, row/column warnings appear and details show in Debug.

Optional AAV column is displayed when present; otherwise shows “—”.

3) See computed values (Dashboard)

As a manager I want a simple, fast table of computed values so that I can compare players quickly.

Accept:

Columns: Name | Pos | Team | ProjPts | VBD | Tier | Rookie | AAV | Injury | Bye | Age | Notes.

Injury color: Green=Healthy, Yellow=Q, Red=D/O/IR/PUP, Gray=NA.

Position switcher; quick filters (Hide drafted, by position, rookies only, injury filter).

Tiers: delta‑based by ProjPts with a sensible default threshold.

Export visible table as CSV.

4) Compute VBD correctly with Flex

As a manager I want VBD that respects Flex so that cross‑position value is realistic.

Accept:

Greedy fill algorithm: fill required slots by position (top projections), then fill Flex with best remaining RB/WR/TE; the next remaining at each position defines replacement level; VBD = ProjPts − ReplacementPts(pos).

Replacement and VBD recalc instantly when league settings change.

5) Validate against goldens

As a manager I want to compare results to my golden datasets so that I trust the math.

Accept:

Debug tab: load a golden set and show per‑player diffs (ProjPts, VBD), MAE, % within tolerance.

Configurable tolerances; default: ProjPts ±0.5; VBD ±0.5.

Missing/derived fields listed explicitly.

6) Persist and work offline

As a manager I want my work to persist and function without internet so that I never lose progress mid‑draft.

Accept:

Autosave to IndexedDB; manual Save/Load file.

PWA installable; runs offline after first load.

Non‑Goals (MVP)

K/DST/IDP; scraping or paid API pulls; live nomination/bid guidance; budget/team tracking; mobile polish; advanced blending/weighting; user accounts/cloud sync.

Constraints & Policies

Licensing: user‑provided public data only; no scraping in MVP.

Privacy: no server; no analytics; everything local.

Performance: recompute ≤ 200 ms for 1–2k players on modern laptops.

Browser support: latest Chrome/Edge/Firefox; Safari best‑effort.

Definition of Done (MVP)

All acceptance criteria above pass on at least one 10–12 team league and one 14+ team league using provided goldens; table export works; PWA works; no runtime errors in console during normal use.