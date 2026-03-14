# Feature Specification: AWS Deployment with Justfile Targets

**Feature Branch**: `002-aws-deploy`
**Created**: 2026-03-14
**Status**: Draft
**Input**: User description: "deploy to aws and wrap the commands to build the infra and deploy the website with justfile targets"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Provision AWS Infrastructure (Priority: P1)

A developer setting up the site for the first time runs a single command to create all required AWS resources (S3 bucket, CloudFront distribution, ACM certificate, Route53 records, and CloudWatch dashboard) without manually clicking through the AWS console.

**Why this priority**: Nothing can be deployed until the infrastructure exists. This is a one-time prerequisite for all other deployment work.

**Independent Test**: Running `just infra` on a fresh AWS account produces a working S3 bucket and CloudFront distribution. The outputs (bucket name, distribution ID, domain) are written to a local `.env.deploy` file. This can be verified by inspecting AWS console or CLI without deploying any content.

**Acceptance Scenarios**:

1. **Given** valid AWS credentials are configured and no infrastructure exists, **When** `just infra` is run, **Then** an S3 bucket and CloudFront distribution are created and their identifiers are saved to `.env.deploy`.
2. **Given** infrastructure already exists, **When** `just infra` is run again, **Then** the command detects existing resources and exits without duplicating or overwriting them.
3. **Given** AWS credentials are missing or invalid, **When** `just infra` is run, **Then** an informative error is shown before any resources are created.

---

### User Story 2 — Deploy the Site (Priority: P1)

A developer with provisioned infrastructure runs a single command to build the static site and publish it to the live CloudFront URL.

**Why this priority**: Deploying the site is the primary delivery step. It must be fast, repeatable, and require no manual steps after initial setup.

**Independent Test**: Running `just deploy` after `just infra` has been completed successfully publishes the current build output to S3 and issues a CloudFront cache invalidation. The live CloudFront URL reflects the updated content within a reasonable propagation window.

**Acceptance Scenarios**:

1. **Given** infrastructure is provisioned and `.env.deploy` contains the required identifiers, **When** `just deploy` is run, **Then** the site is built, synced to S3, and a full CloudFront invalidation is issued.
2. **Given** the S3 sync completes but CloudFront invalidation fails, **When** `just deploy` is run, **Then** the deployment fails with a clear error message and a non-zero exit code so CI catches it.
3. **Given** `.env.deploy` does not exist and environment variables are not set, **When** `just deploy` is run, **Then** the command prints an actionable error instructing the user to run `just infra` first.

---

### User Story 3 — Tear Down Infrastructure (Priority: P3)

A developer who no longer needs the site can remove all provisioned AWS resources cleanly to avoid ongoing costs.

**Why this priority**: Teardown is a safety valve for cost control, not a day-to-day workflow.

**Independent Test**: Running `just infra-destroy` removes the S3 bucket (after emptying it) and CloudFront distribution. AWS console confirms no billable resources remain.

**Acceptance Scenarios**:

1. **Given** infrastructure exists and the S3 bucket contains content, **When** `just infra-destroy` is run, **Then** the bucket is emptied and deleted and the CloudFront distribution is disabled and deleted.
2. **Given** no infrastructure exists, **When** `just infra-destroy` is run, **Then** the command exits cleanly with a message confirming nothing to remove.

---

### Edge Cases

- What happens when the S3 bucket name conflicts with a globally existing bucket? → Infra script must detect the conflict and exit with a clear error suggesting an alternative name.
- What happens if the build output directory is absent when `just deploy` is run? → Deployment must abort with a message instructing the user to run `just build` first.
- What happens if partial infra exists (e.g., bucket present but no CloudFront distribution)? → Infra script must detect and create only the missing components, keeping the run idempotent.
- How are secrets handled? → All credentials and identifiers are sourced from environment variables or a `.env.deploy` file that is `.gitignore`d; no credentials may be committed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST expose a `just infra` target that provisions all required AWS resources (S3 bucket, CloudFront distribution, ACM certificate, Route53 records, CloudWatch dashboard) for first-time setup.
- **FR-002**: The `just infra` target MUST be idempotent — running it multiple times must not create duplicate resources or overwrite existing configuration.
- **FR-003**: The `just deploy` target MUST build the static site, sync assets to S3, and issue a CloudFront cache invalidation in a single command.
- **FR-004**: The `just deploy` target MUST load deployment configuration (bucket name, distribution ID) from a git-ignored `.env.deploy` file or environment variables automatically, without requiring manual exports each session.
- **FR-005**: The repository MUST expose a `just infra-destroy` target that removes all provisioned AWS resources, including emptying the S3 bucket before deletion.
- **FR-006**: All Justfile targets MUST produce clear, human-readable progress output and exit non-zero on failure.
- **FR-007**: The `.env.deploy` file MUST be listed in `.gitignore`; no deployment credentials or infrastructure identifiers may be committed.
- **FR-008**: The S3 bucket MUST NOT be publicly accessible directly; all traffic MUST route through CloudFront using an Origin Access Control (OAC) policy.
- **FR-009**: The CloudFront distribution MUST serve the site over HTTPS using an AWS-managed certificate.
- **FR-010**: The infra provisioning approach MUST use Terraform (with AWS CLI for bootstrap and deploy steps), consistent with the project's zero-runtime-cost preference, and the approach must be documented in `docs/authoring.md`.

### Key Entities

- **Deployment Config** (`.env.deploy`): A local git-ignored file storing `SITE_BUCKET`, `CLOUDFRONT_DIST_ID`, and any other infra outputs needed by `just deploy`.
- **S3 Bucket**: Stores the static build output; private, accessible only via CloudFront OAC.
- **CloudFront Distribution**: Serves the site over HTTPS; issues cache invalidations on each deploy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer with no prior AWS setup can run `just infra && just deploy` and have the live site accessible at the CloudFront domain within 15 minutes.
- **SC-002**: Running `just deploy` on an already-provisioned environment completes in under 3 minutes for a typical site build.
- **SC-003**: Running `just infra` twice in succession produces no errors and no duplicate resources.
- **SC-004**: The `.env.deploy` file is the only manual artifact a developer needs to retain between sessions; no other out-of-band configuration is required.
- **SC-005**: The monthly AWS cost for a low-traffic personal site remains within AWS Free Tier or under $1/month at typical personal blog traffic levels.

## Constitution Alignment

- **Security-First**: `SITE_BUCKET` and `CLOUDFRONT_DIST_ID` are loaded from a git-ignored `.env.deploy` file. S3 bucket is private; all access via CloudFront OAC. AWS access is gated by the `core` profile. No credentials or infra identifiers in source.
- **Content Flexibility**: This feature introduces no new page types or content schemas. It is purely a delivery and infra layer.
- **Cost-Efficiency**: Architecture follows the constitution's recommended S3 + CloudFront static pattern. Both services are free-tier eligible at personal blog traffic. Expected monthly cost is ~$0; documented in script comments and `docs/authoring.md`.
- **SEO**: No impact on SEO metadata. CloudFront HTTPS delivery is required for canonical URL integrity.
- **Developer Experience**: Adds `just infra` and `just infra-destroy` targets. Enhances existing `just deploy` to auto-load `.env.deploy`. All commands follow the existing Justfile style (`set shell` with `bash -euxo pipefail`).

