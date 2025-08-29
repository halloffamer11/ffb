# Demos and Validation

This directory contains demo pages and HITL validation interfaces.

## Directory Structure

- `ui/` - Task validation pages (T-XXX format)
- `data/` - Demo datasets and sample files
- `validation/` - Manual validation HTML pages

## HITL Validation Protocol

Every task requires Human-In-The-Loop validation:

1. Implementation creates validation page in `ui/T-XXX_validation.html`
2. Manual testing performed by human reviewer
3. Pass/fail confirmation required before task completion

## Accessing Validation Pages

Start the dev server and access validation pages:

```bash
npm run dev
# Then open http://localhost:5173/demos/ui/T-XXX_validation.html
```

These demo files are essential for the project's quality assurance process.