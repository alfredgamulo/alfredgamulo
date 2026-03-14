# alfredgamulo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-13

## Active Technologies
- Terraform HCL (≥ 1.10); Bash (helper scripts) + `hashicorp/aws ~> 5.0` (primary region + `aws.us_east_1` alias for ACM); AWS CLI v2; `jq` (002-aws-deploy)
- Terraform S3 backend (`alfredgamulo.com-infra` bucket, key `alfredgamulo.com/terraform.tfstate`, `use_lockfile = true` — no DynamoDB required) (002-aws-deploy)

- TypeScript 5 / Node.js 20 LTS (Astro compile-time); client JavaScript (ES2022 target) + Astro 4, D3.js v7 (force + zoom + SVG), Pyodide 0.27, CodeMirror 6, Shiki (syntax highlighting via Astro built-in), `@astrojs/mdx`, `@astrojs/sitemap` (001-digital-garden-mvp)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5 / Node.js 20 LTS (Astro compile-time); client JavaScript (ES2022 target): Follow standard conventions

## Recent Changes
- 002-aws-deploy: Added Terraform HCL (≥ 1.10); Bash (helper scripts) + `hashicorp/aws ~> 5.0` (primary region + `aws.us_east_1` alias for ACM); AWS CLI v2; `jq`

- 001-digital-garden-mvp: Added TypeScript 5 / Node.js 20 LTS (Astro compile-time); client JavaScript (ES2022 target) + Astro 4, D3.js v7 (force + zoom + SVG), Pyodide 0.27, CodeMirror 6, Shiki (syntax highlighting via Astro built-in), `@astrojs/mdx`, `@astrojs/sitemap`

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
