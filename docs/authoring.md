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
| `just infra` | Provision all AWS infrastructure (first-time or idempotent re-run) |
| `just deploy` | Build + sync `dist/` to S3 + CloudFront cache invalidation (auto-loads `.env.deploy`) |
| `just infra-destroy` | Tear down all AWS infrastructure (empties S3 bucket first) |
| `just lighthouse` | Build + run Lighthouse CI assertions |

---

## CloudFront Custom 404 Page

The custom 404 error response is configured automatically by Terraform (`infra/cloudfront.tf`) — no manual console steps required. Both HTTP 403 (S3 access denied) and 404 responses are mapped to `/404.html` with a `404` response code.

Authoring example

1. Create a new `.mdx` file under `src/content/garden/` in the appropriate subfolder (see **Page Types** above for location and schema).
2. Add the required frontmatter using the matching example from the **Page Types** section.
3. Add body content in MDX.
4. Run `just build` and `just dev` to preview.

If adding a new page template or presentation style, include an updated authoring example in `docs/authoring.md` and a brief maintenance note in the PR.

---

## Deployment Architecture

The site is delivered via **S3 + CloudFront** — a zero-runtime, ~$0/month stack at personal blog traffic levels.

### How it works

```
browser → Route53 (A ALIAS / CNAME) → CloudFront (PriceClass_100)
                                              ↓ OAC SigV4
                                         S3 bucket (private)
```

- **S3 bucket** (`alfredgamulo.com`): stores `dist/` build output; no public access; readable only by CloudFront via OAC.
- **CloudFront distribution**: HTTPS-only (`redirect-to-https`), `http2and3`, custom domain aliases, `PriceClass_100` (US/CA/EU edges).
- **ACM certificate**: DNS-validated, covers apex and `www` subdomain; provisioned automatically by Terraform.
- **Route53**: apex `A ALIAS` and `www CNAME` both point to the CloudFront domain.
- **CloudWatch dashboard**: visitor traffic metrics (Requests, BytesDownloaded, 4xx/5xx error rates).

### Cost profile

Expected monthly cost at personal blog traffic: **~$0/month** (S3 and CloudFront both have free-tier allowances that comfortably cover a personal site).

Optional: after `just infra`, you may enroll the CloudFront distribution in the flat-rate free tier billing plan (launched Nov 2025) via AWS Console → CloudFront → your distribution → **Savings**. This is not automated.

### Lifecycle commands

| Command | When to use |
|---------|-------------|
| `just infra` | First-time setup, or after any Terraform change. Idempotent. |
| `just deploy` | Every content publish. Builds, syncs, and invalidates cache. |
| `just infra-destroy` | Permanent teardown only. Deletes all AWS resources. |

After `just infra` completes, a `.env.deploy` file is written at the repo root containing `SITE_BUCKET`, `CLOUDFRONT_DIST_ID`, and `CLOUDFRONT_DOMAIN`. This file is git-ignored. Keep it between sessions — it is the only artifact `just deploy` needs.
