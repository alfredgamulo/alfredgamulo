# Authoring Guide

This document shows how to add new content to the digital garden and the checks required by the project constitution.

Page types

- Static write-up: a Markdown or MDX page rendered as HTML. Use human-readable slugs and add front-matter with `title`, `description`, `canonical`, and `date`.
- CVE-style report: long-form write-up; include `summary`, `impact`, `reproduction` sections and an explicit `disclosure` field in front-matter.
- Canvas / iframe page: use an embed block or a small HTML/JS bundle. Keep embeds sandboxed and review any external scripts for data leakage.

SEO checklist (required for public pages)

- `title` and `description` meta tags present.
- `canonical` URL specified in front-matter.
- Structured data (JSON-LD) included for long-form content when appropriate.
- Human-readable slug; avoid UUIDs in public URLs.

Security checklist (required for public pages)

- Remove secrets and API keys from content and assets.
- Review embedded iframes or third-party scripts for data exfiltration risk.
- For code samples that include sensitive details, redact or link to sanitized artifacts.

Developer commands

Use the `Justfile` at the repository root for standard tasks:

- `just build` — build static assets for deployment.
- `just dev` — run the local dev server.
- `just test` — run tests (if configured).
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
