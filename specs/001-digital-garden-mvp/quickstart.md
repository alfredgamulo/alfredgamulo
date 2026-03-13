# Quickstart: Digital Garden MVP

**Date**: 2026-03-13
**Branch**: `001-digital-garden-mvp`

This guide gets a developer from zero to a running local site in under 10 minutes, and from local to deployed in under 30 minutes.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS | `nvm install 20` |
| npm | 10+ | bundled with Node 20 |
| just | any | `brew install just` or `cargo install just` |
| AWS CLI | v2 | https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html |
| Git | any | system package manager |

---

## 1. Clone and Install

```bash
git clone https://github.com/alfredgamulo/alfredgamulo.git
cd alfredgamulo
npm install
```

---

## 2. Run Local Dev Server

```bash
just dev
```

Opens at http://localhost:4321 with hot-reload.

The mind map home page renders immediately with the two sample pages (CVE write-up and Python editor). Adding a new `.mdx` file to `src/content/garden/` triggers a hot-reload and the new node appears in the mind map automatically.

---

## 3. Build for Production

```bash
just build
```

Output goes to `dist/`. Inspect it with:

```bash
ls dist/
```

You should see `index.html`, `writing/`, `playground/`, `_astro/` (hashed JS/CSS), and `sitemap.xml`.

---

## 4. Preview the Production Build Locally

```bash
npx astro preview
# or
npx serve dist
```

Verify the following before deploying:
- Home page mind map renders and nodes are clickable.
- CVE write-up page shows all sections and the CVSS badge.
- Python editor page loads Pyodide and executes `print("hello")`.

---

## 5. Deploy to AWS

### One-time AWS Setup (do this once)

1. Create an S3 bucket (e.g., `alfredgamulo-site`). Do not enable public access.
2. Create a CloudFront distribution with the S3 bucket as origin using **Origin Access Control (OAC)**.
3. Set the default root object to `index.html`.
4. Set a custom error page: 404 → `/404.html`, 404 response code.
5. Copy the CloudFront distribution ID.

### Per-Deploy Steps

```bash
export SITE_BUCKET=alfredgamulo-site
export CLOUDFRONT_DIST_ID=E1234EXAMPLE

just build
just deploy
```

`just deploy` will:
1. Sync `dist/` to S3 (delete removed files, skip unchanged files based on ETag).
2. Create a CloudFront invalidation for `/*` to flush stale HTML.

### Verify Deploy

1. Wait 30–60 seconds for the CloudFront invalidation to complete.
2. Visit the CloudFront distribution URL (e.g., `https://d1234.cloudfront.net`).
3. Confirm home page, CVE page, and Python editor all load correctly.

---

## 6. Add a New Page (Authoring Workflow)

See `docs/authoring.md` for full examples per page type. Quick summary:

```bash
# Create a new write-up
touch src/content/garden/writing/my-new-post.mdx
```

Add frontmatter:

```yaml
---
title: "My New Post"
date: 2026-03-13
description: "Short summary under 160 chars"
pageType: writeup
tags: ["security", "cloud"]
---
```

Run `just dev` — the new node appears in the mind map immediately.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Build fails with schema error | Frontmatter field missing or wrong type | Check error message; fix frontmatter in the `.mdx` file |
| Mind map is blank | No non-draft pages | Add at least one page or set `draft: false` |
| Pyodide never loads | CDN blocked or no internet | Check browser console; ensure `cdn.jsdelivr.net` is reachable |
| Deploy fails: no credentials | AWS CLI not configured | Run `aws configure` or set `AWS_PROFILE` |
| CloudFront returns 403 | OAC bucket policy not applied | Re-save the CloudFront distribution to regenerate the bucket policy |
