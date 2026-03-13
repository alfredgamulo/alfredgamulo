# Research: Digital Garden MVP

**Phase**: 0 — Outline & Research
**Feature**: 001-digital-garden-mvp
**Date**: 2026-03-13

---

## Decision 1: Static Site Generator

**Decision**: Astro (v4+)

**Rationale**:
- **Island architecture**: partial hydration means the interactive mind-map and Python editor ship as isolated JS islands (`client:only`) while the rest of each page is zero-JS static HTML. This is exactly the right model for a site that mixes static write-ups with interactive canvases.
- **Content Collections + MDX**: built-in typed schema validation of frontmatter (slug, title, date, page-type, tags, cvss, etc.) enforced at build time. MDX allows embedding Astro/React components inside Markdown pages without adding a build step.
- **Zero-JS by default**: pages are SSG by default; opt-in JS islands only where needed. This maximises Lighthouse SEO scores and minimises delivery cost.
- **TypeScript native**: the full project compiles with strict typing, reducing runtime surprises.
- **Ecosystem**: `@astrojs/sitemap`, `@astrojs/rss`, `@astrojs/mdx`, Shiki for syntax highlighting, `astro-seo` or head slot for meta management — all production-ready.

**Alternatives considered**:
- **Hugo**: fastest build times but lacks island architecture and MDX. Embedding a Pyodide editor cleanly inside a Hugo page requires awkward shortcodes or iframe hacks. Cannot share typed data schemas between the build and client JS. Rejected.
- **Next.js**: React-based, supports SSG, but overkill for a solo-creator static site. Adds React bundle weight to every page. CloudFront + S3 deployment is straightforward only for fully static output; `next export` exists but is limited. Rejected.
- **Eleventy**: Very flexible, no opinion on JS, excellent DX. Lacks native TypeScript, MDX, or island architecture. Would require more manual wiring. Could revisit if Astro ever becomes a burden.

---

## Decision 2: Mind Map Animation Library

**Decision**: D3.js v7 — force simulation + SVG rendering, loaded as an Astro `client:only` island

**Rationale**:
- **Force simulation**: `d3-force` provides a spring-physics engine (link force + many-body repulsion + center + collision) that exactly matches the "nodes drift gently" requirement. The physics loop runs in a Web Worker-compatible `requestAnimationFrame` tick.
- **SVG control**: rendering to SVG (not Canvas) makes nodes accessible (aria labels), hoverable via CSS, and individually addressable for tooltip attachment. SVG also scales perfectly at any zoom level.
- **Tag-edge rendering**: edges in D3 force graphs are `<line>` or `<path>` SVG elements, easily styled differently per shared-tag type (color-coded edges by primary tag).
- **Data pipeline**: at build time, Astro collects all page frontmatter into a JSON blob and injects it as a script tag. The D3 island reads this JSON, constructs nodes/links, and renders — no client-side API call needed.
- **Pan/zoom**: `d3-zoom` wraps the SVG `<g>` with a transform, providing mouse wheel, trackpad pinch, and touch drag support with a single call.

**Alternatives considered**:
- **vis-network**: heavy (>500 KB minified), designed for network/graph databases, not creative gardens. Harder to customize aesthetics. Rejected.
- **Cytoscape.js**: similarly heavy and node-graph-database oriented. Rejected.
- **Custom Canvas (WebGL/2D)**: maximum performance, but no free accessibility, no CSS hover states, no easy tooltip. Would require writing the physics engine from scratch. Rejected for MVP.
- **Three.js**: too complex for 2D force graph. Rejected.

**Node coloring strategy**: nodes are colored by their primary (first-listed) tag. Tags are assigned colors from a deterministic palette based on tag name hash. Edges are semi-transparent lines; thickness can encode the number of shared tags between two nodes.

---

## Decision 3: Python Runtime (Client-Side Execution)

**Decision**: Pyodide v0.27+ via CDN, integrated with CodeMirror 6 for the editor UI

**Rationale**:
- **Full Python stdlib**: Pyodide ships CPython compiled to WebAssembly, giving access to the full standard library and most pure-Python packages from PyPI via `micropip`. This allows interesting demos (regex, json, base64, hashlib, etc.) without restriction.
- **Fine-grained JS API**: Pyodide exposes `pyodide.runPythonAsync(code)`, `pyodide.setStdout({batched: fn})`, and `pyodide.setStderr({batched: fn})` — exactly the hooks needed for a LeetCode-style output panel.
- **CodeMirror 6 editor**: pairs naturally with Pyodide. Provides syntax highlighting (Python grammar), line numbers, bracket matching, and dark-mode theme support. CodeMirror 6 is modular; only the Python grammar and a minimal extension set are needed (< 80 KB extra).
- **Loading strategy**: use `pyodide.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/" })` in a Web Worker to avoid blocking the main thread during the ~5s initial load. The editor is interactive immediately; the Run button activates once the Worker signals ready.

**Alternatives considered**:
- **PyScript**: wraps Pyodide in HTML custom elements (`<py-script>`, `<py-config>`). Simpler to embed but opinionated about the editor UI; does not support CodeMirror natively. Also adds its own loader overhead. Would deliver lower UX fidelity for the LeetCode-style layout. Rejected for MVP; note it could be used for simpler embedded code snippets in write-up pages if desired.
- **Brython**: Python-to-JS transpiler, not full CPython. Missing stdlib modules. Rejected.
- **Skulpt**: similar to Brython, limited stdlib. Rejected.

**CSP impact**: Pyodide requires `wasm-unsafe-eval` in the `script-src` CSP directive. This is an accepted requirement documented in Pyodide's security guidance. The production CloudFront distribution uses a Response Headers Policy that sets the CSP; the editor page's CSP header is more permissive than write-up pages.

---

## Decision 4: AWS Deployment — S3 + CloudFront

**Decision**: S3 static website hosting (private bucket) → CloudFront OAC (Origin Access Control) distribution

**Rationale**:
- **Cost**: CloudFront Always Free tier includes 1 TB data transfer out and 10M HTTP requests/month, indefinitely. A personal blog will never approach these limits. S3 storage for a small static site (~10–50 MB including assets) costs < $0.01/month. Effective cost: $0.
- **OAC over OAI**: OAC is the current AWS-recommended method for restricting S3 bucket access to only CloudFront. The S3 bucket policy is auto-generated by CloudFront; the bucket does not need public access enabled. This is more secure than a public S3 bucket used as a static website host.
- **CloudFront cache control**: build assets hashed by filename (Astro does this by default) so `Cache-Control: max-age=31536000, immutable` for `/_astro/*` and `Cache-Control: no-cache` for `index.html` and page HTML files. This enables instant invalidations for HTML while assets cache indefinitely.
- **CloudFront invalidation on deploy**: `scripts/deploy.sh` calls `aws cloudfront create-invalidation --paths "/*"` only for HTML and manifest files, not for hashed assets. The Justfile's `just deploy` target wraps this.
- **Custom domain (future)**: Route 53 hosted zone + ACM certificate in `us-east-1` (required by CloudFront). Not in scope for MVP but architecture supports it.

**Deployment smoke test**: after `just deploy`, visit the CloudFront distribution domain. Confirm `index.html` returns 200, assets return 200 with long cache headers, and a nonexistent path returns the custom 404 page.

---

## Decision 5: SEO Implementation in Astro

**Decision**: `SEOHead.astro` shared component + `@astrojs/sitemap` + `@astrojs/mdx` with Content Collections schema enforcement

**Rationale**:
- Astro's `<head>` slot in layouts makes it simple to inject per-page SEO metadata. A shared `SEOHead.astro` component receives `title`, `description`, `canonical`, `ogImage` and emits all required tags in one place.
- `@astrojs/sitemap` auto-generates `sitemap.xml` from all Astro pages at build time — no manual maintenance.
- JSON-LD for CVE write-ups is generated inside the `WriteupLayout.astro` using the frontmatter CVE fields. The article schema includes `headline`, `datePublished`, `dateModified`, `author`, and `description`.
- Dark mode: CSS custom properties with `@media (prefers-color-scheme: dark)` in `global.css`. No JS required, no flash of wrong theme.

**Smoke-check gate**: `just test` runs a small Node.js script that builds the site, loads each HTML file, and asserts presence of `<title>`, `<meta name="description">`, `<link rel="canonical">`, and `<meta name="viewport">`. This is the SEO gate in CI.

---

## Summary Table

| Decision | Chosen | Key Reason |
|---|---|---|
| Static site generator | Astro v4 | Island architecture, MDX, typed content collections |
| Mind map library | D3.js v7 (force + SVG) | Physics simulation, accessible SVG, d3-zoom, lightweight |
| Python runtime | Pyodide v0.27 + CodeMirror 6 | Full stdlib, fine-grained stdout/stderr hooks, good UX |
| Deployment | S3 (OAC) + CloudFront | Free tier, $0 at zero traffic, < $1/month at 10k views |
| SEO | SEOHead component + sitemap | Centralized, enforced at schema level, auditable |
