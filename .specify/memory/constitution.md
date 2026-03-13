<!--
Sync Impact Report

- Version change: 0.1.0 → 0.2.0
- Modified principles:
  - Security-First (kept)
  - Test-First → Content Flexibility (re-prioritized for creative formats)
  - Observability & Auditability → Simplicity & Maintainability (merged emphasis)
  - Versioning & Change Management → Developer Experience & Deployability (added Justfile requirement)
  - Added: Cost-Efficiency, SEO & Discoverability
- Added sections:
  - Deployment & Cost Constraints (AWS free-tier recommendation)
  - Developer Experience (Justfile + local/dev commands)
- Removed sections: none
- Templates updated / requiring review:
  - .specify/templates/plan-template.md ✅ updated (Constitution Check wording)
  - .specify/templates/spec-template.md ⚠ updated (Constitution Alignment added)
  - .specify/templates/tasks-template.md ⚠ updated (Setup tasks: Justfile, cost constraints)
  - .specify/templates/constitution-template.md ✅ aligned
- Follow-up TODOs:
  - TODO(RATIFICATION_DATE): Confirm original ratification date for historical record
  - Verify CI uses `just` wrappers for build/test/deploy steps
-->

# Alfred Gamulo — Digital Garden Constitution

This project is a personal digital garden and creative website for a security engineer and builder. Content will be heterogeneous: long-form write-ups (including CVE-style findings), exploratory pages with embedded canvases/iframes, and small notes. The site MUST enable flexible presentation without locking future creative formats, while maintaining a cohesive, high-quality UI/UX and modern visualizations.

## Core Principles

### Security-First
Security is non-negotiable. All components, build pipelines, and deploy targets MUST follow secure defaults: secrets out of source, least privilege, supply-chain scanning, and encrypted transports. Public-facing pages that expose code or artifacts MUST be reviewed for leakage or sensitive metadata.

### Content Flexibility (Creative Formats Allowed)
Content creators MUST be free to present ideas in diverse formats. The project MUST support per-page presentation freedom (static write-ups, embedded canvases/iframes, interactive visualizations) without imposing a rigid content schema that prevents future formats. New page templates MUST not block alternative presentation styles.

### Cost-Efficiency & Minimal Runtime
Hosting and delivery MUST prioritize low-cost, serverless, and free-tier-friendly architectures. The recommended default is static hosting in S3 with an AWS-managed CloudFront distribution (prefer zero-cost or minimal-cost configurations and maximize caching). Runtime services (server processes, databases) are permitted only with explicit justification and a documented maintenance and cost plan.

### Simplicity & Maintainability
The site MUST be simple to author and maintain for a solo creator. Creating a new page or asset months later MUST be straightforward and documented. Tooling, conventions, and templates MUST reduce cognitive load for authors and avoid fragile build steps.

### SEO & Discoverability (Mandatory)
All public pages MUST be optimized for search discoverability: canonical URLs, meta tags, structured data where appropriate, human-readable slugs, and server-side rendering or prerendering for critical content to ensure search engines index pages reliably.

### Developer Experience & Automation (Justfile requirement)
The repository MUST expose a `Justfile` with standard targets: `just build`, `just dev` (local dev server), `just test`, and `just deploy`. CI and local workflows MUST invoke these targets rather than calling build scripts directly. This ensures reproducible developer commands and lowers onboarding friction.

## Deployment & Cost Constraints
- Prefer static-first deployments: build static assets, upload to S3, and serve via CloudFront with aggressive caching and low-cost edge options.
- Use AWS Free Tier patterns where feasible; minimize Lambda or other recurring-cost services. Any architecture with recurring costs MUST include a documented expected monthly cost and a budget cap.
- Use infrastructure-as-code or scripts for deployment that are invoked via `just deploy`.

## Development Workflow & Quality Gates
- `Justfile` MUST provide `just build`, `just dev`, `just test`, `just deploy` commands. CI pipelines MUST call these targets.
- Pull requests that add new page types or runtime services MUST include a short migration/maintenance note explaining authoring steps and expected maintenance burden.
- Every PR touching content or code MUST pass linting, tests (where applicable), SEO smoke checks (meta tags present), and a basic security scan.
- Documentation: a `docs/authoring.md` MUST explain how to create new page types (static write-up, canvas/iframe, CVE-like report) with examples and include a checklist for SEO and security checks.

## Governance
Amendments to this constitution MUST follow the process below:

1. Proposal: create a documented amendment in the repository (PR) describing the change, rationale, and migration plan if applicable.
2. Review: obtain at least two approvals, one of which MUST be a project security or engineering lead for security-related amendments.
3. Ratification: after approvals and CI checks, merge the PR. The `Last Amended` date will be set to the merge date.

Versioning policy for the constitution:
- MAJOR: Backwards-incompatible governance or principle removals/definitions.
- MINOR: New principle or materially expanded guidance (this change: added content-format flexibility, cost-efficiency, SEO and Justfile requirements).
- PATCH: Wording clarifications, typos, or non-semantic refinements.

**Version**: 0.2.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm initial adoption date | **Last Amended**: 2026-03-13
