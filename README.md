# FFB: Fantasy Football Auction Draft Helper

A React/TypeScript draft-day decision support system built between June and August 2025 using Claude 3.5/3.7 Sonnet, then Opus 4/4.1. Finished a few minutes before my auction draft. Used to win two fantasy leagues that season — by someone who watched two football games all year.

This repo is the August 31, 2025 snapshot — the version that ran the auction. `main` has been frozen since.

## What it does

A live-draft tool for fantasy football auction and snake formats:

- Loads custom Monte Carlo projections from [FFB_projections](https://github.com/halloffamer11/ffb_calcs)
- Calculates VBD (value-based drafting) baselines per position with FLEX-aware logic; supports 2QB / Superflex
- Surfaces real-time over/undervalue indicators by comparing my custom projections against published consensus
- Tracks per-team budget, max bid, roster construction, and bye-week conflicts as picks come in
- Workspace persistence with SHA-256 checksumming and rolling 3-backup retention
- 50-level undo history for live-draft mistakes

## Architecture

- **Pure core** (`src/core/`) — VBD math, projection scoring, budget calculations. Pure functions, no I/O.
- **Impure adapters** (`src/adapters/`) — workspace I/O, projection import, schema validation.
- **State** — Zustand unified store with subscribe-with-selector middleware, action logging, undo stack.
- **UI** — draggable widget grid, Recharts visualizations, Playwright E2E coverage.

The pure-core / impure-adapter split came from the [USDAD](https://github.com/halloffamer11/USDAD) methodology and turned out to be the single most useful architectural decision in the project. All the math is unit-testable without filesystem mocking.

## Build & run

Prereqs: Node 20+

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Build for production with `npm run build`.

## Methodology

Built using [USDAD](https://github.com/halloffamer11/USDAD) — Unified Spec-Driven Agentic Development. 38 tasks tracked in `pcl/tasks.md` with HITL validation gates per task. Six specialized Claude agent roles in `.claude/agents/` (lead architect, auction draft modeler, dead code surgeon, quant UI designer, etc.).

## Status

This is an artifact, not active work. `main` is the version that won the leagues — frozen at commit `56a4409` (Sep 2, 2025). Local-only branches like `feat/advanced-data-analytics` contain post-draft experimentation that I haven't published; the public artifact is the draft-day code.

## License

MIT — see [LICENSE](./LICENSE).
