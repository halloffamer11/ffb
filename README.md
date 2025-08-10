# FFB Draft Helper (MVP skeleton)

This repo follows USDAD with a three-layer context:
- `.gsl` = Global Steering Layer
- `pcl`  = Project Context Layer
- `src`  = Product code (pure core, impure edges)

## Development

Prereqs: Node 20+

Install and run dev server:

```
npm install
npm run dev
```

Open `http://localhost:5173` and verify:
- Tailwind styles applied (inspect classes)
- CSP header present
- No console errors

Build for production:

```
npm run build
npm run preview
```

## Workspace Schema
Draft workspace format lives at `contracts/schemas/workspace.schema.json` and describes `.ffdraft` files per `pcl/design.md`.
