---
description: "Task list for Digital Garden MVP (001-digital-garden-mvp)"
---

# Tasks: Digital Garden MVP

**Input**: Design documents from `/specs/001-digital-garden-mvp/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story. Each phase is independently testable and deployable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared in-progress dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

All source at repository root. Astro project layout: `src/`, `public/`, `tests/`, `dist/` (build output).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the Astro project, install all dependencies, and wire up the Justfile and config files. No user story work begins until this phase is complete.

- [ ] T001 Initialize Astro 4 project at repository root with `npm create astro@latest . -- --template minimal --no-install --typescript strict`; add `package.json` scripts: `"dev": "astro dev"`, `"build": "astro build"`, `"preview": "astro preview"` in `package.json`
- [ ] T002 Install all dependencies: `npm install astro @astrojs/mdx @astrojs/sitemap d3 @types/d3 @codemirror/state @codemirror/view @codemirror/lang-python @codemirror/theme-one-dark shiki && npm install -D typescript @types/node prettier eslint playwright @playwright/test`
- [ ] T003 [P] Write `astro.config.mjs`: enable `@astrojs/mdx`, `@astrojs/sitemap`; set `output: "static"`; configure Shiki as code highlighter with `one-dark-pro` theme in `astro.config.mjs`
- [ ] T004 [P] Write `tsconfig.json` extending `astro/tsconfigs/strict`; set `baseUrl: "."` and path aliases (`@components`, `@layouts`, `@content`) in `tsconfig.json`
- [ ] T005 [P] Update `Justfile` to replace generic shell detection with Astro-specific targets: `build` → `npm run build`, `dev` → `npm run dev`, `test` → `npx playwright test && node tests/seo/smoke-check.mjs`, `deploy` → `bash scripts/deploy.sh` in `Justfile`
- [ ] T006 [P] Create `public/favicon.svg` (simple SVG icon — terminal prompt `>_` symbol) and `public/og-default.png` (1200×630 dark card with site name) in `public/`

**Checkpoint**: `just dev` starts the Astro dev server at `localhost:4321` without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure all three user stories depend on. MUST be complete before any US phase begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Copy `specs/001-digital-garden-mvp/contracts/page-schema.ts` content into `src/content/config.ts` as the Astro Content Collection definition; remove the contracts import header and replace with Astro-native imports in `src/content/config.ts`
- [ ] T008 [P] Create `src/styles/global.css`: CSS custom properties for color palette (12 tag colors), typography scale, dark mode via `@media (prefers-color-scheme: dark)`, and base reset in `src/styles/global.css`
- [ ] T009 Create `src/components/SEOHead.astro` implementing the `SEOHeadProps` interface from `specs/001-digital-garden-mvp/contracts/seo-head-props.ts`; emit `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<meta name="viewport">`, Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`), `twitter:card`, and optional `<script type="application/ld+json">` for JSON-LD in `src/components/SEOHead.astro`
- [ ] T010 Create `src/layouts/BaseLayout.astro`: full HTML shell importing `SEOHead.astro`, `global.css`, and a minimal nav bar; accept `SEOHeadProps` as props and forward them to `SEOHead`; render `<slot />` for page content in `src/layouts/BaseLayout.astro`
- [ ] T011 [P] Create `tests/seo/smoke-check.mjs`: Node.js script that reads all `dist/**/*.html` files after build and asserts each has `<title>`, `<meta name="description">`, `<link rel="canonical">`, and `<meta name="viewport">`; exits non-zero on any failure in `tests/seo/smoke-check.mjs`
- [ ] T012 [P] Create `playwright.config.ts` targeting `localhost:4321` for development and `dist/` via `npx astro preview` for production; configure `webServer` to auto-start `just dev` in `playwright.config.ts`

**Checkpoint**: Foundation ready. `src/content/config.ts` schema validates, `BaseLayout.astro` renders, `SEOHead.astro` emits all required tags.

---

## Phase 3: User Story 1 — Animated Mind Map Home Page (Priority: P1) 🎯 MVP

**Goal**: Full-viewport animated D3 force-graph home page. Nodes = published pages. Edges = shared tags. Hover = preview card. Click = navigate. Pan/zoom supported. Zero-JS fallback for no pages.

**Independent Test**: Run `just dev`, open `localhost:4321`. Confirm animated nodes render, hover shows preview card, click navigates, pinch/scroll zooms.

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement tag color palette utility in `src/lib/tagColors.ts`: export a `TAG_PALETTE` array of 12 accessible hex colors and a `getTagColor(name: string): string` function using `hashCode(name) % 12` for deterministic, consistent coloring in `src/lib/tagColors.ts`
- [ ] T014 [P] [US1] Implement `buildMindMapGraph` function in `src/lib/buildGraph.ts`: accepts `CollectionEntry<"garden">[]`, filters out drafts, constructs `MindMapGraph` (nodes + links + tags) per the interface in `specs/001-digital-garden-mvp/contracts/mind-map-graph.ts`; links share `sharedTags` and `strength = sharedTags.length` in `src/lib/buildGraph.ts`
- [ ] T015 [P] [US1] Create `src/components/NodePreviewCard.astro`: a floating card component that receives `node: MindMapNode` and renders title, date, and tags as colored chips; positioned by CSS `transform` driven by D3 pointer coordinates; hidden by default, shown via a `.visible` class in `src/components/NodePreviewCard.astro`
- [ ] T016 [US1] Create `src/components/MindMap.astro` as a `client:only="solid-js"` — or pure vanilla JS — island: reads inline JSON from `<script id="garden-graph" type="application/json">`, initializes a D3 force simulation (`forceLink` + `forceManyBody` + `forceCenter` + `forceCollide`), renders nodes as SVG `<g>` elements (shape by `pageType`: circle/diamond/hexagon), renders edges as `<line>` elements colored by primary shared tag, attaches `d3-zoom` for pan/zoom, shows `NodePreviewCard` on node hover, navigates on node click in `src/components/MindMap.astro`
- [ ] T017 [US1] Create `src/pages/index.astro`: import `getCollection`, run `buildMindMapGraph`, serialize graph to JSON, inject as `<script id="garden-graph" type="application/json">` in the page head, render a full-viewport `<svg>` container, mount `MindMap` island with `client:only`, include SEO head (title: "Alfred Gamulo", description: site tagline, canonical: site root) in `src/pages/index.astro`
- [ ] T018 [US1] Add empty-state: when `graph.nodes.length === 0`, render a centered `<p>` welcome message inside the SVG instead of the force simulation in `src/components/MindMap.astro`
- [ ] T019 [P] [US1] Write Playwright e2e test: start dev server, navigate to `/`, assert SVG contains at least one `<g class="node">`, hover a node and assert preview card becomes visible, click a node and assert URL changes in `tests/e2e/mind-map.spec.ts`

**Checkpoint**: Home page fully functional and independently testable. Mind map animates with sample nodes, hover cards work, click navigates.

---

## Phase 4: User Story 2 — CVE-Style Security Write-Up Page (Priority: P2)

**Goal**: A professional CVE write-up page with all required sections, CVSS badge, syntax-highlighted code blocks, JSON-LD Article structured data, Open Graph preview, and dark-mode support.

**Independent Test**: Navigate directly to `/writing/cve-2024-example`. Confirm all sections present, CVSS badge rendered, view-source shows JSON-LD and OG tags.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create `src/components/CVSSBadge.astro`: accepts `score: number` and `severity: CvssSeverity`; renders a colored badge (red for CRITICAL/HIGH, orange for MEDIUM, green for LOW/NONE) with the numeric score and severity label in `src/components/CVSSBadge.astro`
- [ ] T021 [P] [US2] Create `src/components/Timeline.astro`: accepts an array of `{ date: string; event: string }` props (or uses a `<slot>` with MDX children); renders a vertical timeline with date markers and event descriptions in `src/components/Timeline.astro`
- [ ] T022 [US2] Create `src/layouts/WriteupLayout.astro`: extends `BaseLayout`; renders structured sections (Summary, Affected Versions, Severity with `CVSSBadge`, Reproduction Steps, Impact, Remediation, Disclosure Timeline with `Timeline`); builds and injects JSON-LD Article schema from frontmatter fields (`headline`, `datePublished`, `author: "Alfred Gamulo"`) into `SEOHead`; applies article typography styles in `src/layouts/WriteupLayout.astro`
- [ ] T023 [US2] Create `src/pages/writing/[slug].astro`: dynamic route using `getStaticPaths` + `getCollection("garden")`; filter for `pageType === "writeup"`; render entry with `WriteupLayout`; pass SEO props (title, description, canonical, JSON-LD, ogImage) in `src/pages/writing/[slug].astro`
- [ ] T024 [US2] Create sample CVE write-up `src/content/garden/writing/cve-2024-example.mdx`: use fictional CVE-2024-99999 (e.g., a path traversal in a fictional Python web framework); populate all frontmatter fields (`cveId`, `cvssScore: 8.1`, `cvssSeverity: "HIGH"`, `affectedVersions`, `disclosureDate`, `vendor`, `tags: ["vulnerability-research", "python", "web"]`); write all body sections with realistic but fictional details; include a reproduction code block in `src/content/garden/writing/cve-2024-example.mdx`
- [ ] T025 [P] [US2] Write Playwright e2e test: navigate to `/writing/cve-2024-example`; assert presence of CVSS badge element, each required section heading, a `<code>` block, JSON-LD script tag in `<head>`, and `og:title` meta tag in `tests/e2e/cve-page.spec.ts`

**Checkpoint**: CVE write-up page independently functional. All sections render, OG/JSON-LD present in source, dark mode adapts via CSS.

---

## Phase 5: User Story 3 — In-Browser Python Code Editor (Priority: P3)

**Goal**: Two-panel Python editor (CodeMirror 6 left, output right) powered by Pyodide in a Web Worker. Starter code pre-loaded. Run/Reset controls. Loading indicator. No backend.

**Independent Test**: Navigate to `/playground/python-editor`. Type `print("hello")` and click Run. Verify `hello` appears in output panel with no network request to a server.

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create `src/workers/pyodide.worker.ts`: load Pyodide from CDN inside the Worker using `importScripts`; implement the `WorkerRequest`/`WorkerResponse` message protocol from `specs/001-digital-garden-mvp/contracts/python-worker-protocol.ts`; redirect `pyodide.setStdout` and `pyodide.setStderr` to post `{ type: "stdout" }` / `{ type: "stderr" }` messages; post `{ type: "ready" }` when loaded; post `{ type: "done" }` after each run in `src/workers/pyodide.worker.ts`
- [ ] T027 [US3] Create `src/layouts/InteractiveLayout.astro`: extends `BaseLayout` with full-viewport body, minimal nav chrome, and a `<slot />` for the interactive content; passes SEO props through to `SEOHead`; does not impose a content width constraint in `src/layouts/InteractiveLayout.astro`
- [ ] T028 [US3] Create `src/components/PythonEditor.astro` as a `client:only` Vanilla JS island: initialize CodeMirror 6 with Python grammar, `oneDark` theme, line numbers, bracket-matching; instantiate `pyodide.worker.ts` via `new Worker`; show loading overlay until `{ type: "ready" }` received; on Run click send `{ type: "run", code }` to Worker append stdout/stderr to output panel, clear on new run; on Reset restore starter code from a `data-starter` attribute and clear output; handle `{ type: "error" }` by displaying traceback in output panel; detect `typeof WebAssembly === "undefined"` and show browser-incompatibility notice in `src/components/PythonEditor.astro`
- [ ] T029 [US3] Create `src/pages/playground/[slug].astro`: dynamic route for `pageType === "interactive"` entries; render with `InteractiveLayout`; mount `PythonEditor` island passing `starter-code` from frontmatter in `src/pages/playground/[slug].astro`
- [ ] T030 [US3] Create `src/content/garden/playground/python-editor.mdx`: frontmatter with `title: "Python Playground"`, `description`, `pageType: "interactive"`, `tags: ["python", "tools"]`; body includes a fenced code block (pre-rendered description) and a `<PythonEditor>` component call with multi-line starter code (a Caesar cipher demo using `hashlib`, `print` output) in `src/content/garden/playground/python-editor.mdx`
- [ ] T031 [P] [US3] Write Playwright e2e test: navigate to `/playground/python-editor`; wait for loading overlay to disappear (timeout 15 s); type `print("hello")` into CodeMirror editor; click Run; assert output panel contains `hello`; click Reset; assert editor content restored; attempt broken code `1/0` and assert traceback appears in `tests/e2e/python-editor.spec.ts`

**Checkpoint**: Python editor is fully functional independently. Run/Reset work, loading state transitions correctly, no backend requests for code execution.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect all user stories; run after all story checkpoints pass.

- [ ] T032 [P] Create `src/layouts/NoteLayout.astro`: minimal single-column layout for short-form notes; extends `BaseLayout`; applies tighter line-height typography in `src/layouts/NoteLayout.astro`
- [ ] T033 Update `docs/authoring.md` with complete worked examples for all three page types (write-up MDX frontmatter, interactive MDX with component invocation, note MDX); include the SEO checklist and security checklist per page type in `docs/authoring.md`
- [ ] T034 [P] Create `src/pages/404.astro`: custom 404 page with a brief message and link to home; configure CloudFront custom error page to serve it (document step in `quickstart.md`) in `src/pages/404.astro`
- [ ] T035 [P] Add `robots.txt` and verify `sitemap.xml` is generated by `@astrojs/sitemap` after `just build` in `public/robots.txt`
- [ ] T036 Run `just build && node tests/seo/smoke-check.mjs` and confirm all pages pass; fix any failing meta tags before marking complete
- [ ] T037 Run `just build && npx playwright test` and confirm all e2e tests pass
- [ ] T038 [P] Run quickstart.md validation: follow every step in `quickstart.md` in a clean shell; confirm `just dev`, `just build`, and dry-run of `just deploy` (with a test bucket) all succeed without undocumented steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Phase 2. No dependency on US2 or US3.
- **US2 (Phase 4)**: Depends on Phase 2. No dependency on US1 or US3 (share only `BaseLayout` and `SEOHead` from foundational).
- **US3 (Phase 5)**: Depends on Phase 2. No dependency on US1 or US2.
- **Polish (Phase 6)**: Depends on all desired story phases being verified.

### User Story Dependencies (Within Each Story)

- T013 (tagColors) and T014 (buildGraph) are parallel prerequisites for T016 (MindMap island)
- T020 (CVSSBadge) and T021 (Timeline) are parallel prerequisites for T022 (WriteupLayout)
- T026 (Worker) is a prerequisite for T028 (PythonEditor island)
- T027 (InteractiveLayout) is a prerequisite for T029 (playground route)
- All e2e tests (T019, T025, T031) can run in parallel against the same dev server once their story's implementation tasks are complete

### Parallel Opportunities (Per Story)

**US1**: T013 ∥ T014 ∥ T015 → T016 → T017 → T018; T019 after T017  
**US2**: T020 ∥ T021 → T022 → T023 → T024; T025 after T024  
**US3**: T026 ∥ T027 → T028 → T029 → T030; T031 after T030

---

## Parallel Example: User Story 1

```bash
# Phase 3 parallel start (after Phase 2 complete):
Task: "Implement tag color palette in src/lib/tagColors.ts"           # T013
Task: "Implement buildMindMapGraph in src/lib/buildGraph.ts"          # T014
Task: "Create NodePreviewCard.astro"                                   # T015

# Then sequentially:
Task: "Create MindMap.astro island (D3 force simulation)"             # T016
Task: "Create index.astro with graph injection and MindMap mount"     # T017
Task: "Add empty-state to MindMap.astro"                              # T018
Task: "Write Playwright tests for mind map"                           # T019
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (T013–T019)
4. **STOP and VALIDATE**: `just dev` → confirm mind map loads, nodes hover/click
5. Optional early deploy to CloudFront for live preview

### Incremental Delivery

1. Setup + Foundational → project boots at `localhost:4321`
2. Add US1 → animated home page is live (MVP!)
3. Add US2 → CVE write-up discoverable from mind map
4. Add US3 → Python editor discoverable from mind map
5. Polish → site ready for public launch

### Task Counts

| Phase | Tasks | Parallelizable |
|---|---|---|
| Setup | 6 (T001–T006) | 4 of 6 |
| Foundational | 6 (T007–T012) | 4 of 6 |
| US1 (P1) | 7 (T013–T019) | 4 of 7 |
| US2 (P2) | 6 (T020–T025) | 3 of 6 |
| US3 (P3) | 6 (T026–T031) | 2 of 6 |
| Polish | 7 (T032–T038) | 4 of 7 |
| **Total** | **38** | **21 of 38** |

---

## Format Validation

All tasks follow the required checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`. ✅
