# Synthesized Development Framework

The **Unified Spec-Driven Agentic Development (USDAD)** methodology is a spec-first, agentic workflow that utilizes upfront planning to define a product specification and a persistent, shared context to this "north star" production vision thereby unlocking frictionless use of multiple agents and ensuring a persistent, shared set of context, vision and rules. The "spec-as-truth" model ensures all agents are working together regardless of the context and model being used. Quality and testability are built from the ground-up with robust testing and human validation tests for each task and feature.

## Core Architecture 
*Three-Layer Context System:*
### Global Steering Layer (`.gsl/`)
*Development operating system*
- `agent-roles.md`: Defines AI agent personas with their specific responsibilities and interaction patterns.
- `rules.md`: Language-agnostic coding standards, documentation requirements, and code organization principles.
- `USDAD.md`: The USDAD methodology - workflow phases, specification formats, and process enforcement rules.
### Project Context Layer (`pcl/`)
*Project North Star*
- `requirements.md`: User stories with EARS notation and acceptance criteria.
- `design.md`: Technical architecture and system design decisions.
- `tasks.md`: Work breakdown implementation plan with progress tracking, dependencies, and validation & verification defined.
- `context.md`: Shared agent memory acts as a living log file during task execution. Initialized with `requirements.md` and `design.md` during planning phases and dynamically updated during the execution phase. Accumulates learning as agents discover new constraints, dependencies, or insights during task completion. Provides continuity across sessions and tool-switches.
### Human Interface Layer (HIL)
*Human-AI communication bridge*
#### Planning Phase Interactions
Train-of-thought capture during initial requirement gathering, conversational exploration of product vision, iterative refinement of specifications through natural dialog with PCT agents: [[role_planner]], [[role_techadversary]], and [[role_techadversary]].
#### Implementation Phase Interactions
Primary engagement is directing the coding agents through completion of `tasks.md` and human-in-the-loop (HITL) validation of each feature. Interacts with Project Context Layer when major changes are desired.

## Core Workflow

### Phase 1: Planning
- 1.1 Brainstorming
	- The user prompts chat to take on the [[role_planner]] persona and uses train of thought natural language interactions to develop the **project context layer**.
	- Output of this phase:
		- `draft0_requirements.md` 
		- `draft0_design.md`
		- `draft0_tasks.md` 
- 1.2 Requirements refinement
	- AI chat will take on the [[role_techadversary]] persona to challenge assumptions, question feasibility, and pressure-test the design until 95% certainty is achieved.
	-  Output of this phase:
		- `draft1_requirements.md` 
		- `draft1_design.md`
		- `draft1_tasks.md` 
- 1.3 Requirements formalized
	- AI chat will take on the [[role_architect]] persona to synthesize the final version of the **project context layer**. This finalization process ensures alignment with the **global steering layer** and refines the breakdown of tasks planning the expected do-loop of execution, verification & validation, and feedback from the user. Each task has clearly defined dependencies and placeholder test data descriptions to allow the user to pre-define test inputs if desired.
	- Output of this phase:
		- `requirements.md`
		- `design.md`
		- `tasks.md`
- 1.4 Project Initialization [[USDAD New Project]]
### Phase 2: Implementation
- 2.1 User initiates development environment with GSL and PCL
- 2.2 User initiates implementation phase
- 2.3 Agent enters `tasks.md` execution workflow until all tasks are complete
	- 2.3.1 User selects desired execution agent (e.g. claude code vs. cursor & model) and loads [[role_executor]] agent context
	- 2.3.2 Pull next task from tasks.md
	- 2.3.3 Load GSL, relevant PCL, and `context.md`
	- 2.3.4 Human-in-the-loop validation step
	- 2.3.5 Maintain bidirectional sync between code and PCL
	- 2.3.6 Maintain `context.md` ledger

## Project Folder Structure
```
<repo-root>/
├─ .gsl/                      # Global Steering Layer (development OS)
│  ├─ agent-roles.md          # Personas: planner, tech adversary, architect
│  ├─ rules.md                # Coding conventions, guardrails, axioms
│  └─ USDAD.md                # Methodology summary & phase gates
├─ pcl/                       # Project Context Layer (project north star)
│  ├─ requirements.md         # EARS stories + acceptance criteria
│  ├─ design.md               # Architecture & decisions
│  ├─ tasks.md                # Ordered work plan w/ validation per-task
│  └─ context.md              # Running log + shared memory during execution
├─ src/                       # Product code
│  ├─ core/                   # Pure domain logic (no I/O)
│  ├─ adapters/               # Impure edges: http/db/fs/clock/rng
│  └─ app/                    # Composition, orchestration, CLIs
├─ tests/
│  ├─ unit/                   # Pure, fast tests over src/core
│  ├─ contract/               # Boundary contracts (OpenAPI/JSON schema)
│  └─ e2e/                    # Thin end-to-end paths
├─ contracts/                 # API & data schemas used by contract tests
│  ├─ openapi.yaml
│  └─ schemas/
├─ testdata/
│  └─ golden/
│     └─ v1/                  # Curated input + expected outputs (small, versioned)
├─ demos/                     # Human-in-the-loop validation artifacts
│  ├─ ui/                     # Minimal HTML pages for visual checks
│  └─ data/                   # Human-readable outputs for processing tasks
├─ scripts/
│  ├─ usdadsync.sh            # Helper to sync PCL ↔ code notes
│  └─ ci_contract_check.sh    # CI hook for contract/golden gates
├─ .cursorrules               # Agentic working rules (keep it simple, plan/think/execute)
├─ .clawed                    # Claude policy block (optional)
├─ .gitignore
└─ README.md
```