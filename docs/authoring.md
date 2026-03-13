# Authoring Guide

This document shows how to add new content to the digital garden.
Adding a page takes **< 10 minutes** following the examples below.

---

## Quick Start

1. Create a `.mdx` file in `src/content/garden/` under the appropriate subfolder
2. Add required frontmatter (see examples below)
3. Write your content in MDX (Markdown + JSX components)
4. Run `just dev` and navigate to your page — it will appear in the mind map automatically

---

## Page Types

### 1. CVE-Style Security Write-Up (`pageType: "writeup"`)

Place in: `src/content/garden/writing/your-slug.mdx`

**Frontmatter example:**

```yaml
---
title: "CVE-2024-12345: Vulnerability Title (max 80 chars)"
date: 2024-11-15
description: "One-paragraph summary. Max 160 chars. Used in meta description and social cards."
pageType: writeup
tags: ["vulnerability-research", "python", "web"]     # First tag = primary (mind map color)
cveId: "CVE-2024-12345"                               # Must match CVE-YYYY-NNNNN format
cvssScore: 8.1                                         # 0.0 – 10.0
cvssSeverity: "HIGH"                                   # CRITICAL | HIGH | MEDIUM | LOW | NONE
affectedVersions:
  - "AcmeSoft 2.0.0 – 2.3.4"
disclosureDate: 2024-11-15
patchDate: 2024-10-28
vendor: "AcmeSoft Inc."
---
```

**Required body sections:**

```markdown
## Summary
...

## Affected Versions
...

## Reproduction Steps
```python
# Your PoC code here
```

## Impact
...

## Remediation
...
```

The timeline is generated automatically from `disclosureDate` and `patchDate`.
JSON-LD Article structured data is injected automatically by `WriteupLayout`.

---

### 2. Interactive Page (`pageType: "interactive"`)

Place in: `src/content/garden/playground/your-slug.mdx`

**Frontmatter example:**

```yaml
---
title: "Python Playground"
date: 2024-11-15
description: "An in-browser Python editor powered by Pyodide. No installation required."
pageType: interactive
tags: ["python", "tools"]
---
```

**Body example** — `starterCode` is a prop on the component call, NOT frontmatter:

```mdx
import PythonEditor from "@components/PythonEditor.astro";

Your description here...

<PythonEditor starterCode={`print("Hello, World!")`} />
```

---

### 3. Note (`pageType: "note"`)

Place in: `src/content/garden/notes/your-slug.mdx`

**Frontmatter example:**

```yaml
---
title: "Quick Thought on TLS Handshakes"
date: 2024-11-15
description: "A short note on TLS 1.3 handshake improvements."
pageType: note
tags: ["security", "networking"]
---
```

Body is plain MDX content — no special components required.

---

## SEO Checklist (required for all public pages)

- [ ] `title` is at most 80 characters and descriptive
- [ ] `description` is at most 160 characters and written for humans (not keyword stuffing)
- [ ] `draft: false` (or field omitted) before publishing
- [ ] For write-ups: `cveId`, `cvssScore`, `cvssSeverity`, `affectedVersions`, `disclosureDate`, `vendor` all present
- [ ] Slug is human-readable (e.g., `cve-2024-99999-path-traversal`) — no UUIDs

Run after build to verify all pages:

```bash
just build
node tests/seo/smoke-check.mjs
```

---

## Security Checklist (required for all public pages)

- [ ] No real API keys, secrets, or credentials in content or code samples
- [ ] CVE PoC code uses **fictional** product names only — never real exploits for unpatched software
- [ ] Any embedded third-party scripts have `integrity` (SRI) attributes if loaded from CDN
- [ ] `draft: true` is set during research/drafting; set to `false` only when ready to publish

---

## Developer Commands

Use the `Justfile` at the repository root:

| Command | Description |
|---|---|
| `just dev` | Start local dev server at `http://localhost:4321` |
| `just build` | Build static site to `dist/` |
| `just test` | Run npm audit + lint + Playwright e2e + SEO smoke-check |
| `just deploy` | Deploy to S3 + CloudFront (requires `SITE_BUCKET` env var) |
| `just lighthouse` | Build + run Lighthouse CI assertions |

---

## CloudFront Custom 404 Page

After deploying, configure CloudFront to serve the custom 404 page:

1. Open the CloudFront console → your distribution → **Error Pages**
2. Click **Create custom error response**
3. Set:
   - HTTP error code: `404`
   - Response page path: `/404.html`
   - HTTP response code: `404`
4. Save changes (propagation takes ~5 minutes)
- `just deploy` — upload build to S3 and invalidate CloudFront (requires `SITE_BUCKET` and optional `CLOUDFRONT_DIST_ID`).

Authoring example

1. Create `content/posts/2026-03-13-my-note.md` with front-matter:

```yaml
title: "My Note"
description: "Short summary"
canonical: "/posts/my-note"
date: 2026-03-13

```

2. Add body content.
3. Run `just build` and `just dev` to preview.

If adding a new page template or presentation style, include an authoring example in `docs/authoring.md` and a brief maintenance note in the PR.
