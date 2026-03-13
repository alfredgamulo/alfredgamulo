# Implementation Plan: Digital Garden MVP

**Branch**: `001-digital-garden-mvp` | **Date**: 2026-03-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-digital-garden-mvp/spec.md`

---

## Summary

Build the initial MVP of a personal digital garden website for a security engineer and builder. The home page renders an animated, physics-based mind map (D3.js force simulation on SVG) where nodes represent published pages and edges connect nodes sharing metadata tags. Two sample content pages ship with the MVP: a CVE-style security write-up with full structured sections and SEO metadata, and an in-browser Python code editor powered by Pyodide and CodeMirror 6. All pages are statically generated with Astro, served from S3 + CloudFront on the AWS free tier, and managed exclusively via `just` commands.

---

## Technical Context

**Language/Version**: TypeScript 5 / Node.js 20 LTS (Astro compile-time); client JavaScript (ES2022 target)
**Primary Dependencies**: Astro 4, D3.js v7 (force + zoom + SVG), Pyodide 0.27, CodeMirror 6, Shiki (syntax highlighting via Astro built-in), `@astrojs/mdx`, `@astrojs/sitemap`
**Storage**: File system only — Astro Content Collections (`.mdx` files). No database. No server runtime.
**Testing**: Playwright (e2e: mind map interactivity, CVE page structure, Python editor execution); Node.js script for SEO smoke-checks (meta tag assertions on built HTML)
**Target Platform**: Static HTML/JS/CSS delivered via AWS CloudFront + S3; any modern browser (Chrome 100+, Firefox 100+, Safari 15+, Edge 100+). Pyodide requires WebAssembly.
**Project Type**: Static site (SSG) — no server runtime, no API routes
**Performance Goals**: Mind map interactive within 3 s on 10 Mbps (SC-001); Python editor executes 10-line script within 5 s post-load (SC-003); Lighthouse SEO ≥ 90 for all pages (SC-002)
**Constraints**: Zero hosting cost at zero traffic; <$1/month at 10k page views (SC-006). No backend server. No authentication. No database. Pyodide CSP: `wasm-unsafe-eval` required for editor page only.
**Scale/Scope**: MVP = 1 home page + 1 sample CVE page + 1 Python editor page. Solo creator; adding content must take <10 min per page following `docs/authoring.md`.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

| Principle | Gate | Status | Notes |
|---|---|---|---|
| **Security-First** | No secrets in source; CSP defined; third-party scripts reviewed | ✅ PASS | Pyodide CSP (`wasm-unsafe-eval`) scoped to editor page only. SRI hashes on D3 CDN load. No auth, no user data, no secrets. Sample CVE uses fictional details only. |
| **Content Flexibility** | Three independent page types; adding a 4th type must not require modifying existing templates | ✅ PASS | `BaseLayout` → `WriteupLayout` / `InteractiveLayout` / `NoteLayout` share no page-type-specific code. New types add a new layout file only. |
| **Cost-Efficiency** | Static S3 + CloudFront only; estimated cost documented | ✅ PASS | At zero traffic: $0 (AWS free tier). At 10k page views: <$0.10/month. No Lambda, no RDS, no EC2. |
| **Simplicity & Maintainability** | New page authoring documented; `docs/authoring.md` with worked examples | ✅ PASS | Adding a page = create one `.mdx` file + frontmatter. Appears in mind map automatically at build time. |
| **SEO & Discoverability** | All pages: `<title>`, `<meta description>`, `<link canonical>`, OG tags, JSON-LD for CVE pages | ✅ PASS | Enforced via `SEOHead.astro` contract; smoke-checked in `just test`. |
| **Developer Experience (Justfile)** | `just build`, `just dev`, `just test`, `just deploy` exist and work | ✅ PASS | Justfile exists from prior commit. Targets will be updated to call `npx astro` commands. |

**Post-Phase-1 re-check**: All gates still pass after design. Pyodide CSP clarification added (scoped to editor page only). No violations requiring Complexity Tracking.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-digital-garden-mvp/
├── plan.md              # This file
├── research.md          # Phase 0: SSG, D3, Pyodide, AWS, SEO decisions
├── data-model.md        # Phase 1: Page, CVERecord, Tag, MindMapGraph, EditorSession
├── quickstart.md        # Phase 1: Install → dev → build → deploy guide
├── contracts/
│   ├── page-schema.ts           # Astro content collection schema (source of truth)
│   ├── mind-map-graph.ts        # MindMapGraph/Node/Link TypeScript interfaces
│   ├── seo-head-props.ts        # SEOHead component props interface
│   └── python-worker-protocol.ts # Pyodide Web Worker message protocol
├── checklists/
│   └── requirements.md  # Spec quality checklist (Phase from /speckit.specify)
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── content/
│   ├── config.ts                         # Content Collection schema (from contracts/page-schema.ts)
│   └── garden/
│       ├── writing/
│       │   └── cve-2024-example.mdx      # Sample CVE write-up (fictional)
│       └── playground/
│           └── python-editor.mdx         # Python editor page
├── layouts/
│   ├── BaseLayout.astro                  # HTML shell: SEOHead + global CSS + nav
│   ├── WriteupLayout.astro               # CVE/essay layout: structured sections, JSON-LD
│   ├── InteractiveLayout.astro           # Canvas/editor layout: full-viewport, minimal chrome
│   └── NoteLayout.astro                 # Short-form note layout (for future notes)
├── components/
│   ├── SEOHead.astro                     # Meta tags, OG, canonical, JSON-LD injection
│   ├── MindMap.astro                     # D3 force simulation island (client:only)
│   ├── PythonEditor.astro                # Pyodide + CodeMirror 6 island (client:only)
│   ├── CVSSBadge.astro                   # CVSS score + severity label badge
│   ├── Timeline.astro                    # Disclosure timeline component for CVE pages
│   └── NodePreviewCard.astro             # Tooltip/preview card shown on mind map node hover
├── pages/
│   ├── index.astro                       # Home page: builds MindMapGraph, renders MindMap island
│   ├── writing/
│   │   └── [slug].astro                  # Dynamic route for write-up pages
│   └── playground/
│       └── [slug].astro                  # Dynamic route for interactive pages
├── workers/
│   └── pyodide.worker.ts                 # Web Worker: loads Pyodide, executes code, relays I/O
└── styles/
    └── global.css                        # CSS custom properties, dark mode, typography reset

public/
├── favicon.svg
└── og-default.png                        # Default OG image

tests/
├── e2e/
│   ├── mind-map.spec.ts                  # Playwright: node render, hover, click, zoom
│   ├── cve-page.spec.ts                  # Playwright: section presence, CVSS badge, meta tags
│   └── python-editor.spec.ts             # Playwright: load, run, reset, error handling
└── seo/
    └── smoke-check.mjs                   # Node.js: assert meta tags on all built HTML files

docs/
└── authoring.md                          # Authoring guide (already created)

scripts/
└── deploy.sh                             # S3 sync + CloudFront invalidation (already created)

Justfile                                  # just build / dev / test / deploy (already created — needs Astro targets)
astro.config.mjs                          # Astro config: MDX, sitemap, Shiki, output: static
package.json
tsconfig.json
```

**Structure Decision**: Single flat project at repository root (Option 1 adapted). No backend directory needed — zero server runtime. All source under `src/`, static assets under `public/`, build output to `dist/`. This matches Astro's default project layout and minimises configuration overhead for a solo creator.

---

## Phase 0: Research Summary

All NEEDS CLARIFICATION items from Technical Context resolved. See [research.md](research.md) for full rationale.

| Unknown | Resolution |
|---|---|
| Static site generator | **Astro 4** — island architecture, MDX, typed content collections |
| Mind map library | **D3.js v7** (force simulation + SVG + d3-zoom) — physics sim, accessible, interactive |
| Python runtime | **Pyodide 0.27** + **CodeMirror 6** — full stdlib, fine-grained I/O hooks, polished UX |
| Deployment architecture | **S3 (OAC) + CloudFront** — free tier, $0 at zero traffic, <$1/month at 10k views |
| SEO implementation | **SEOHead.astro** component + `@astrojs/sitemap` + JSON-LD in WriteupLayout |

---

## Phase 1: Design Summary

See [data-model.md](data-model.md), [contracts/](contracts/), and [quickstart.md](quickstart.md) for full design artifacts.

### Key Design Decisions

**Mind map data pipeline**: Astro builds a `MindMapGraph` JSON object at compile time from all non-draft content collection entries. This JSON is injected as an inline `<script type="application/json" id="garden-graph">` in `index.astro`. The D3 island reads it with `JSON.parse(document.getElementById('garden-graph').textContent)` — no fetch request, instant data availability.

**Pyodide in a Web Worker**: Pyodide's WASM initialization (~5 MB) is moved off the main thread into `pyodide.worker.ts`. The main thread shows the editor (CodeMirror 6) immediately. When the worker signals `{type: "ready"}`, the Run button activates. This ensures the editor is interactive during load, not frozen.

**Per-page CSP via CloudFront Response Headers Policy**: Two CSP policies — a strict one that applies site-wide, and a more permissive one (adds `wasm-unsafe-eval` to `script-src`) applied only to `/playground/*` paths via a second CloudFront behavior. This minimizes the security surface of the strict policy.

**Tag color palette**: 12 distinct colors (accessible contrast on both light and dark backgrounds). A tag's color is derived as `tagColors[hashCode(tagName) % 12]`. The same tag always gets the same color, regardless of page order — deterministic and consistent.

**Node shapes by page type**: Astro's `pageType` field drives the D3 node shape. `writeup` → circle, `interactive` → diamond (rotated 45°), `note` → hexagon. Shapes are rendered as SVG `<path>` elements computed by D3 arc/line generators.

---

## Complexity Tracking

> No Constitution Check violations. This section is intentionally left minimal.

No unjustified complexity added. The Pyodide CSP relaxation (`wasm-unsafe-eval`) is scoped to `/playground/*` only and is a documented, unavoidable requirement of the Pyodide runtime.

---

## Justfile Update (Required)

The existing `Justfile` targets need to be updated to call Astro-specific commands. The updated targets (to be applied during implementation):

```just
build:
    npm run build

dev:
    npm run dev

test:
    npx playwright test && node tests/seo/smoke-check.mjs

deploy:
    bash scripts/deploy.sh
```

The `package.json` scripts section will wire `build` → `astro build`, `dev` → `astro dev`.
