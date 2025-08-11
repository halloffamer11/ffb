# Coding Conventions

## Single, Persistent Source of Truth
- Prime Directive: The **Global Steering Layer** and **Project Context Layer** are the bible. If these references conflict with code or a prompt, stop and ask to reconcile before editing.
- Decision logging. When a nontrival choice is made, add it to `context.md`
## Axioms
- **KISS** keep it simple, stupid. Prefer boring solutions and standard libs.
- **YAGNI** you aren’t gonna need it. No speculative abstractions.
- **DRY** don’t repeat yourself. Extract shared code once duplication is proven.
- **Do the simplest thing that could possibly work** before optimizing.
- **Make illegal states unrepresentable** through types, schema, and guards.
## Ambiguity & Guardrails
- Ask clarifying questions when requirements or contracts are unclear.
- No silent refactors. Announce intent and provide rollback steps.
- If interfaces change, propose a migration plan.
## Code Quality
- **Single responsibility.** One reason to change per module or function.
- **Pure core, impure edges.** Keep business logic pure and testable, isolate I/O.
- **Composition over inheritance.**
- **Determinism and idempotency** for agent steps. Re-running should not corrupt state.
- **Observability first.** Add structured logs for inputs, decisions, and outputs.
## Testing & Validation
- Tests are required. Add or update unit tests covering edge conditions and expected behavior.
- Rule: human-in-the-loop validation. All new features must include a human validation step for acceptance. Provide a short "how to check" script and sample inputs and expected outputs.
- **Contract tests** for public APIs and data schemas. Fail fast on contract drift.
- **Golden data sets** for key pipelines. Keep fixtures small and versioned.
## Version Control Rules
- **Use Git universally**: All USDAD projects must use Git for version control and change tracking
- **Work in isolation**: Use feature branches for all development work
- **Track progress systematically**: Commit after every completed task and validation
- **Maintain human oversight**: Require approval commits before feature integration
- **Write meaningful history**: Use descriptive commit messages that explain intent

# USDAD
- see [[USDAD Methodology]]
- Ask first when unsure. If requirements or edge cases.