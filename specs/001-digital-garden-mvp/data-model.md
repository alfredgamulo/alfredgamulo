# Data Model: Digital Garden MVP

**Phase**: 1 — Design
**Feature**: 001-digital-garden-mvp
**Date**: 2026-03-13

---

## Entities

### 1. Page (Content Collection Entry)

The fundamental unit of content in the garden. Stored as an `.mdx` file inside a Content Collection. Frontmatter is validated at build time by Astro's Content Collections schema.

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Human-readable page title (used in mind map node label, `<title>`, OG) |
| `slug` | string | computed | Derived from file path by Astro; becomes the URL path |
| `date` | date | ✅ | Publication date (ISO 8601). Used in mind map preview card and JSON-LD |
| `description` | string | ✅ | Short summary (≤ 160 chars). Used in `<meta name="description">` and OG |
| `pageType` | enum | ✅ | `"writeup"` \| `"interactive"` \| `"note"`. Drives layout selection |
| `tags` | string[] | ✅ | Ordered list of tags; first tag is "primary". Min 1 tag required |
| `draft` | boolean | ✗ | Default `false`. Draft pages are excluded from build output and mind map |
| `ogImage` | string | ✗ | Relative path to OG image asset. Falls back to site-default if omitted |
| `canonical` | string | ✗ | Override canonical URL if page is mirrored elsewhere. Defaults to page URL |

**Validation rules**:
- `title` max 80 characters
- `description` max 160 characters
- `pageType` must be one of three enum values
- `tags` must be a non-empty array of non-empty strings
- `date` must be a valid date not in the future (build-time warning)

---

### 2. CVE Record (Page Subtype)

A `Page` with `pageType: "writeup"` MAY include additional CVE-specific frontmatter fields. If `cveId` is present, the `WriteupLayout` renders the CVE-specific sections.

| Field | Type | Required | Description |
|---|---|---|---|
| `cveId` | string | context | CVE identifier (e.g., `"CVE-2024-12345"`). Triggers CVE-mode layout |
| `cvssScore` | number | if cveId | CVSS v3.1 base score (0.0–10.0) |
| `cvssSeverity` | enum | if cveId | `"CRITICAL"` \| `"HIGH"` \| `"MEDIUM"` \| `"LOW"` \| `"NONE"` |
| `affectedVersions` | string[] | if cveId | List of affected software version strings |
| `disclosureDate` | date | if cveId | Date of public disclosure |
| `patchDate` | date | ✗ | Date a patch became available |
| `vendor` | string | if cveId | Affected software vendor/project name |

**Validation rules**:
- `cvssScore` must be 0.0–10.0 when present
- `cvssSeverity` must match the enum
- `cveId` must match regex `/^CVE-\d{4}-\d{4,}$/`

**Disclosure Timeline**: rendered from the MDX body via a `<Timeline>` component. Timeline events are authored inline in MDX, not in frontmatter.

---

### 3. Tag

Tags are not stored as a separate entity; they are derived at build time by collecting all unique `tags` values across all non-draft Pages. The tag graph is computed in one pass.

| Property | Type | Description |
|---|---|---|
| `name` | string | Tag label (display and key) |
| `slug` | string | URL-safe slug (lowercase, hyphenated) |
| `color` | string | Deterministic hex color from `hashCode(name) % palette.length` |
| `pageCount` | number | Number of non-draft Pages with this tag |

---

### 4. Mind Map Graph (Build-Time Computed)

Computed at build time inside `index.astro` and serialized as an inline JSON `<script type="application/json">` block. The D3 island on the client reads this JSON — no runtime API call.

**Node**:

| Field | Type | Description |
|---|---|---|
| `id` | string | Page slug (unique) |
| `label` | string | Page title |
| `url` | string | Absolute page URL path |
| `date` | string | ISO date string |
| `description` | string | Short description |
| `tags` | string[] | Ordered tag list |
| `primaryTag` | string | First tag (drives node color) |
| `pageType` | string | Layout type (drives node shape: circle / diamond / hexagon) |

**Link**:

| Field | Type | Description |
|---|---|---|
| `source` | string | Source node `id` (slug) |
| `target` | string | Target node `id` (slug) |
| `sharedTags` | string[] | Tags both nodes share (drives edge label / thickness) |
| `strength` | number | Number of shared tags (1–N). Used as D3 link strength multiplier |

---

### 5. Python Editor Session (Client-Only, Ephemeral)

The Python editor holds no server-side state. All state is ephemeral in the browser tab.

| Field | Type | Description |
|---|---|---|
| `sourceCode` | string | Current editor contents (in-memory, reset via Reset button) |
| `stdout` | string | Captured standard output from last run |
| `stderr` | string | Captured standard error / traceback from last run |
| `runtimeState` | enum | `"loading"` \| `"ready"` \| `"running"` \| `"error"` |
| `workerRef` | Worker | Reference to the Pyodide Web Worker (held in client component) |

---

## State Transitions

### Pyodide Runtime State Machine

```text
           ┌──────────┐
    init   │          │ worker ready
  ────────►│ loading  │────────────► ready
           │          │
           └──────────┘
                              ┌─────────────────────┐
                run click     │                     │ output received
           ready ─────────►  │      running        │──────────────► ready
                              │                     │
                              └─────────────────────┘
                                         │ uncaught error
                                         ▼
                                       error ──── (user retries) ──► loading
```

### Mind Map Node Interaction States

```text
idle ──(hover)──► hovered [show preview card]
hovered ──(mouseout)──► idle
hovered ──(click)──► navigating [browser follows href]
idle ──(zoom/pan)──► idle  [canvas transform updates, no state change]
```

---

## Content Relationships

```text
Page ──has many──► Tag (via tags[])
Tag ──connects──► Page (via reverse lookup)
Tag ──connects──► Tag (implicitly, when two Tags share a Page)
CVERecord ──extends──► Page (pageType: "writeup" + cveId present)
MindMapGraph ──built from──► Page[] + Tag[]
MindMapNode ──represents──► Page (1:1)
MindMapLink ──represents──► shared Tag membership between two Pages
```
