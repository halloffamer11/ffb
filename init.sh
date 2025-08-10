#!/usr/bin/env bash
set -euo pipefail

# safety
if [ -e ".gsl" ] || [ -e "pcl" ] || [ -e "src" ]; then
  echo "This folder is not empty or already initialized. Aborting."; exit 1
fi

mkdir -p .gsl pcl src/core src/adapters src/app tests/unit tests/contract tests/e2e contracts/schemas testdata/golden/v1 demos/ui demos/data scripts

# .gitignore
cat > .gitignore <<'EOF'
# general
.DS_Store
*.swp
.env
.env.*
# node
node_modules/
dist/
# python
.venv/
__pycache__/
# misc
coverage/
EOF

# README
cat > README.md <<'EOF'
# Project

This repo follows USDAD with a three-layer context:
- .gsl = Global Steering Layer
- pcl  = Project Context Layer
- src  = Product code (pure core, impure edges)

Start here:
1) Fill .gsl files from your master docs.
2) Copy finalized PCL (requirements.md, design.md, tasks.md).
3) Commit and push.
4) Begin execution with the top task in pcl/tasks.md.
EOF

# GSL files
cat > .gsl/agent-roles.md <<'EOF'
# Agent Roles (fill from PCL Agents)
- Planner
- Tech Adversary (role_techadversary)
- Architect
- Implementer
Add short responsibilities and handoff triggers for each.
EOF

cat > .gsl/rules.md <<'EOF'
# Global Rules (high level)
Axioms: KISS, YAGNI, DRY, simplest-thing-first, make illegal states unrepresentable.
Source of Truth: PRD + PCL. If conflict, stop and reconcile.
Workflow: Plan → Think → Execute. Small diffs. Tests required. Human-readable validation.
Quality: Single responsibility. Pure core, impure edges. Composition over inheritance.
Contracts: Validate API/data schemas. Keep golden datasets small and versioned.
Security: No secrets in code. Least privilege. Validate all inputs.
EOF

cat > .gsl/USDAD.md <<'EOF'
# USDAD Summary (paste your short summary here)
- What USDAD is, phase gates, and how GSL/PCL feed execution.
- Link to the master USDAD doc outside the repo.
EOF

# PCL placeholders
cat > pcl/requirements.md <<'EOF'
# Requirements (finalized copy only)
[Paste the approved requirements from Draft1 here. No Draft0/1 history.]
EOF

cat > pcl/design.md <<'EOF'
# Design (finalized copy only)
[Architecture, data contracts, interfaces, decisions with rationale.]
EOF

cat > pcl/tasks.md <<'EOF'
# Ordered Task List (finalized copy only)
For each task:
- Intent
- Acceptance criteria
- Test: unit + human-readable check path
- Blast radius notes
EOF

cat > pcl/context.md <<'EOF'
# Execution Context Ledger
- Date, actor, decision, rationale, links
EOF

# Contracts + tests skeletons
cat > contracts/openapi.yaml <<'EOF'
openapi: 3.0.3
info: { title: API, version: 0.1.0 }
paths: {}
components: { schemas: {} }
EOF

cat > tests/contract/README.md <<'EOF'
Contract tests go here. Validate responses against OpenAPI/JSON schemas.
EOF

cat > testdata/golden/v1/README.md <<'EOF'
Golden datasets: tiny, curated inputs and expected outputs. Versioned here.
EOF

# demos
cat > demos/ui/README.md <<'EOF'
Minimal pages or notebooks used for human validation paths.
EOF

# scripts
cat > scripts/usdadsync.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "Stub: bidirectional sync between PCL and code notes.
- Pull new decisions from pcl/context.md into code comments or docs
- Extract public interfaces from src into contracts/schemas"
EOF
chmod +x scripts/usdadsync.sh

# Cursor rules (tight starter set)
cat > .cursorrules <<'EOF'
# GLOBAL RULES
## Axioms
- KISS. Prefer boring solutions and standard libraries.
- YAGNI. No speculative abstractions.
- DRY. Extract duplication only after it is proven.
- Do the simplest thing that could possibly work.
- Make illegal states unrepresentable.

## Source of Truth
- PCL is authoritative. If conflicts arise, stop and reconcile before editing.

## Workflow
- Before any edit: output a short plan (scope, files, acceptance criteria).
- Keep changes small. If >200 lines or >3 files, pause and request confirmation.
- After each step, run tests and provide a human-readable check path.

## Code Quality
- Single responsibility per module/function.
- Pure core in src/core. Impure edges in src/adapters. Compose in src/app.
- Prefer composition over inheritance.

## Contracts & Data
- Validate external boundaries against contracts/*.
- Maintain small, versioned golden datasets in testdata/golden.

## Security & Ops
- No secrets in code. Use env vars.
- Timeouts and retries for I/O.

## Docs
- Keep README run/test/build instructions current.
- Log decisions in pcl/context.md and brief notes in DECISIONS.md if created.
EOF

echo "Scaffold complete."