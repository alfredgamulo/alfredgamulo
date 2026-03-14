# Feature Specification: Digital Garden MVP

**Feature Branch**: `001-digital-garden-mvp`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Build the initial MVP of our digital garden. Make sample pages that show an example CVE writeup. Another example page could show an in-browser code editor like leetcode that lets you run python with pyiodide or pyscript. I was thinking that for the UI of the home page, it could look like a mind map where pages are circles connected to common metadata tags. Perhaps this is done in an animated javascript way. Be creative!"

## User Scenarios & Testing *(mandatory)*

<!--
  User stories are ordered by priority. Each is independently testable and delivers standalone value.
-->

### User Story 1 — Animated Mind Map Home Page (Priority: P1)

A first-time visitor lands on the site and sees an animated mind map rendered on a full-viewport canvas. Each node represents a published page; edges connect nodes that share metadata tags. Nodes drift gently (physics-based or spring simulation) to feel alive. The visitor hovers a node to see a preview card with title, date, and tags, then clicks to navigate to that page.

**Why this priority**: This is the defining UX of the digital garden — the first impression and the sole navigation mechanism. All content discovery flows through it. Delivery of any other page is only useful once visitors can find it.

**Independent Test**: Deploy the home page alone with three hardcoded node stubs. A tester should see an animated canvas with labelled nodes and connecting edges, hover a node for a preview tooltip, click to follow a link — all without the CVE or editor pages existing.

**Acceptance Scenarios**:

1. **Given** a visitor opens the site root, **When** the page loads, **Then** an animated mind map renders within 3 seconds on a 10 Mbps connection showing all published pages as labelled nodes connected by shared tags.
2. **Given** the mind map is rendered, **When** the visitor hovers (or long-presses on mobile) a node, **Then** a preview card appears showing: page title, publication date, and associated tags.
3. **Given** the mind map is rendered, **When** the visitor clicks or taps a node, **Then** they are navigated to the corresponding page URL.
4. **Given** the site is opened on a mobile device, **When** the visitor pinches or drags the canvas, **Then** the mind map pans and zooms fluidly.
5. **Given** no pages exist, **When** the home page loads, **Then** a welcoming empty-state message is shown instead of a blank or broken canvas.

---

### User Story 2 — CVE-Style Security Write-Up Page (Priority: P2)

A security researcher or hiring manager navigates to a CVE write-up page. The page presents a structured, readable security finding: summary, affected versions, CVSS severity badge, reproduction steps (with syntax-highlighted code), impact analysis, remediation, and disclosure timeline. The layout is professional, shareable, and fully indexed by search engines.

**Why this priority**: Security write-ups are the primary authoritative content type. A strong CVE page demonstrates expertise, is highly shareable, and is a direct signal to professional audiences.

**Independent Test**: Navigate to the CVE page URL directly. A tester confirms all required sections are present, meta tags are in the source, code blocks are syntax-highlighted, and an Open Graph preview card is generated when the URL is pasted into a chat or social platform.

**Acceptance Scenarios**:

1. **Given** a visitor opens a CVE write-up URL, **When** the page loads, **Then** they can read all required sections: Summary, Affected Versions, Severity (with CVSS score badge), Reproduction Steps, Impact, Remediation, and Disclosure Timeline.
2. **Given** the page is crawled by a search engine, **When** the engine reads the source, **Then** the page includes a unique `<title>`, `<meta name="description">`, canonical `<link>`, and JSON-LD Article structured data.
3. **Given** the page contains a code block in Reproduction Steps, **When** the visitor views it, **Then** the code is syntax-highlighted and horizontally scrollable for long lines.
4. **Given** a visitor pastes the page URL into a social platform, **When** the platform generates a link preview, **Then** an Open Graph card displays the CVE identifier, summary text, and severity.
5. **Given** the visitor's OS is set to dark mode, **When** the page loads, **Then** all content areas adapt to a dark colour scheme without losing readability.

---

### User Story 3 — In-Browser Python Code Editor (Priority: P3)

A visitor opens the Python playground page and sees a two-panel layout: a code editor on the left and an output panel on the right. Starter Python code is pre-loaded. The visitor edits the code and clicks Run; output appears in the right panel with no server round-trip. The entire execution happens client-side via Pyodide.

**Why this priority**: This interactive page is the most technically ambitious format and the strongest demonstration of content-format flexibility. It is high-value but the site is fully functional without it.

**Independent Test**: Navigate to the editor page. Write `print("hello")`, click Run, and verify `hello` appears in the output panel — entirely offline, no backend request.

**Acceptance Scenarios**:

1. **Given** a visitor opens the Python editor page, **When** Pyodide is loading, **Then** a visible loading indicator (spinner or progress text) is shown until the runtime is ready.
2. **Given** the runtime is ready and the visitor clicks Run, **When** the code completes, **Then** stdout output appears in the output panel within 5 seconds for typical short scripts.
3. **Given** the visitor runs code that raises a Python exception, **When** the error occurs, **Then** a formatted traceback is shown in the output panel; the page does not crash or freeze.
4. **Given** the visitor clicks Reset, **When** the action triggers, **Then** the editor restores the original starter code and the output panel clears.
5. **Given** the page is indexed by a search engine, **When** the engine reads the source, **Then** the page has pre-rendered `<title>`, `<meta name="description">`, and canonical URL, even though the interactive element requires JavaScript.

---

### Edge Cases

- What happens when a visitor's browser does not support WebAssembly (required by Pyodide)? Display a graceful unsupported-browser notice with a link to a compatible browser.
- What happens when the mind map has more nodes than comfortably fit on screen? Cluster or collapse dense groups and provide zoom controls so no node is permanently unreachable.
- What happens on very slow connections when Pyodide CDN is slow or unavailable? Show a timeout error message with a retry option rather than an indefinite spinner.
- What happens when a CVE write-up code block contains very long lines? Use horizontal scrolling within the code block without breaking the page layout. If possible, use word wrap with line numbers without breaking page layout.
- What happens if the site is viewed with JavaScript disabled? All pages should serve readable static HTML; only the mind map animation and Python editor will gracefully degrade with an appropriate message.
- What happens when two tags connect more than 15 nodes? Throttle node repulsion forces and consider grouping visually to keep the canvas legible. Nodes might have a priority list of tags (the order they are listed), so group intelligently with priority tags.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The home page MUST render an animated mind map where each node represents a published page and edges connect nodes sharing at least one metadata tag.
- **FR-002**: Mind map nodes MUST show a preview card (title, date, tags) on hover or long-press without navigating away.
- **FR-003**: Clicking or tapping a node MUST navigate to that page's URL.
- **FR-004**: The mind map canvas MUST support pan and zoom via mouse scroll, trackpad pinch, and touch pinch/drag.
- **FR-005**: Each CVE write-up MUST contain sections: Summary, Affected Versions, Severity (CVSS score + label badge), Reproduction Steps, Impact, Remediation, and Disclosure Timeline.
- **FR-006**: CVE write-up pages MUST include `title`, `description`, `canonical`, Open Graph (`og:title`, `og:description`, `og:url`), and `twitter:card` meta tags.
- **FR-007**: CVE write-up pages MUST include JSON-LD structured data (Article schema) covering headline, datePublished, and author.
- **FR-008**: Code blocks in write-up pages MUST render with syntax highlighting and support horizontal scroll for long lines.
- **FR-009**: The Python editor page MUST execute submitted code entirely client-side using Pyodide — no backend server required.
- **FR-010**: The Python editor MUST display a loading indicator while the runtime initialises and hide it when ready.
- **FR-011**: The Python editor MUST capture stdout and stderr and display them in the output panel after code execution.
- **FR-012**: The Python editor MUST provide a Reset button that restores starter code and clears the output panel.
- **FR-013**: All pages MUST be statically generated (or pre-rendered) and produce a deployable output directory via `just build`.
- **FR-014**: `just deploy` MUST sync the build output to S3 and issue a CloudFront invalidation when `CLOUDFRONT_DIST_ID` is set.
- **FR-015**: Every public page MUST pass a basic SEO check: unique `<title>`, `<meta name="description">`, canonical `<link>`, and viewport meta tag.

### Key Entities

- **Page**: A unit of content with slug, title, date, page-type (write-up | interactive | note), and a list of tags. Page-type determines the rendering template.
- **Tag**: A short label attached to one or more Pages. Tags form the edges of the mind map.
- **CVE Record**: A Page subtype with additional structured fields: CVE identifier, CVSS score, affected-versions list, reproduction steps, impact description, remediation steps, and disclosure timeline events.
- **Mind Map Node**: A visual representation of a Page on the home page canvas, storing layout position, velocity (for physics), and connection references to sibling nodes sharing tags.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The home page mind map is interactive (hoverable, clickable nodes) within 3 seconds on a 10 Mbps connection.
- **SC-002**: The CVE write-up page and Python editor page each score 90 or above on Lighthouse for SEO.
- **SC-003**: The Python editor executes a 10-line print-heavy script and displays output within 5 seconds of clicking Run (after runtime has loaded).
- **SC-004**: A new page (any type) can be added and appear in the mind map by following `docs/authoring.md` in under 10 minutes, verified by a first-time reader of the guide.
- **SC-005**: `just build` completes without errors and `just deploy` successfully uploads to S3 with a working CloudFront invalidation.
- **SC-006**: Hosting cost at zero traffic is $0 (AWS free-tier S3 + CloudFront); at 10,000 page views per month cost remains under $1.

## Assumptions

- Static site generator selection (Astro is the recommended candidate for its island architecture and MDX support; Hugo is an alternative) is a planning-phase decision. This spec is technology-agnostic.
- Mind map animation library (D3.js force simulation, vis-network, or custom canvas with spring physics) is a planning-phase decision.
- Pyodide 0.27 is the selected Python runtime (decided in Phase 0 research — see plan.md). Client-side only; no backend required.
- Dark mode is implemented via CSS `prefers-color-scheme` only — no user toggle is required for MVP.
- MVP ships exactly one CVE sample page and one Python editor page; additional content is out of scope.
- CVSS score is displayed as a static badge (label + numeric value). No interactive CVSS calculator is required for MVP.
- The site is read-only for visitors. No authentication or user accounts are needed.

## Constitution Alignment

- **Security-First**: No secrets or credentials in source. The Python editor must run inside a strict Content Security Policy with `sandbox` restrictions. Third-party CDN scripts (Pyodide, any JS library) must be reviewed for data exfiltration risk; prefer subresource integrity (SRI) hashes. CVE write-ups must not include live credentials or unredacted sensitive reproduction details.
- **Content Flexibility**: Three distinct page types (animated mind map, structured write-up, interactive code editor) prove the format-agnostic system. Each page type uses a separate template. Adding a fourth type must not require modifying existing templates.
- **Cost-Efficiency**: Static S3 + CloudFront deployment with no backend server. Pyodide runs fully client-side. Estimated cost at zero traffic: $0.
- **SEO**: Each page requires `title`, `description`, canonical URL, Open Graph tags, and JSON-LD where applicable. The Python editor page must deliver these in pre-rendered HTML even though the interactive element requires JavaScript.
- **Developer Experience**: `just build`, `just dev`, `just test`, `just deploy` are the only commands a developer needs. Creating a new page is documented in `docs/authoring.md` with a worked example per page type.
