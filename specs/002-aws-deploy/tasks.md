# Tasks: AWS Deployment with Justfile Targets

**Input**: Design documents from `/specs/002-aws-deploy/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks are grouped by user story. US1 (Provision) must complete before US2 (Deploy) or US3 (Destroy) are useful; all three are independently executable after the foundational phase.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths are included in every description

---

## Phase 1: Setup

**Purpose**: Safety guards and shared Justfile settings required before any infra work.

- [X] T001 Add `.env.deploy` to `.gitignore` in `.gitignore` (FR-007)
- [X] T002 Add `export AWS_PROFILE := "core"` at top of `Justfile` so all targets and child processes inherit the AWS profile (research decision 10)

**Checkpoint**: Repo is safe to commit — `.env.deploy` is git-ignored and the AWS profile is pinned.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Terraform backend bootstrap and shared HCL files that every infra resource depends on. MUST complete before any user story can be implemented.

**⚠️ CRITICAL**: All Phase 3–5 tasks depend on these files existing.

- [X] T003 Create `infra/bootstrap.sh` — idempotent shell script that creates the Terraform state bucket `alfredgamulo.com-infra` via `aws s3api create-bucket` (skip if already exists), enables versioning on the bucket, and prints the bucket name on success (research decision 3)
- [X] T004 Create `infra/versions.tf` — `terraform { required_version = ">= 1.10" }` block, `required_providers { aws = { source = "hashicorp/aws", version = "~> 5.0" } }` block, and S3 backend config: `bucket = "alfredgamulo.com-infra"`, `key = "alfredgamulo.com/terraform.tfstate"`, `region = "us-east-1"`, `use_lockfile = true` (research decisions 2, 3)
- [X] T005 [P] Create `infra/providers.tf` — primary `provider "aws" { profile = var.aws_profile, region = var.aws_region }` and alias `provider "aws" { alias = "us_east_1", profile = var.aws_profile, region = "us-east-1" }` for ACM (research decision 6)
- [X] T006 [P] Create `infra/variables.tf` — declare `var.domain_name` (default `"alfredgamulo.com"`), `var.aws_profile` (default `"core"`), `var.aws_region` (default `"us-east-1"`)
- [X] T007 [P] Create `infra/locals.tf` — `local.bucket_name = var.domain_name`, `local.tags = { project = "alfredgamulo", managed_by = "terraform" }` (research decision 4)
- [X] T008 [P] Create `infra/data.tf` — `data "aws_route53_zone" "primary" { name = var.domain_name, private_zone = false }` (data-model.md; research decision 7 pre-condition)

**Checkpoint**: All shared HCL is in place — `terraform init` (with backend) can now be run against the `infra/` directory.

---

## Phase 3: User Story 1 — Provision AWS Infrastructure (Priority: P1) 🎯 MVP

**Goal**: A single `just infra` command creates all AWS resources from scratch (S3, CloudFront, ACM, Route53, CloudWatch) and writes `.env.deploy` with the output values.

**Independent Test**: Running `just infra` on a clean AWS account (with the `core` profile and an existing Route53 hosted zone) produces a provisioned CloudFront distribution accessible at the CloudFront domain. Running it a second time exits with no changes (idempotent). Inspect `.env.deploy` for `SITE_BUCKET`, `CLOUDFRONT_DIST_ID`, `CLOUDFRONT_DOMAIN`.

### Implementation for User Story 1

- [X] T009 [US1] Create `infra/s3.tf` with three resources: (1) `aws_s3_bucket "site"` named `local.bucket_name` and tagged `local.tags`; (2) `aws_s3_bucket_public_access_block "site"` — block all public access; (3) `aws_s3_bucket_policy "site"` granting `s3:GetObject` to `cloudfront.amazonaws.com` with condition `aws:SourceArn = aws_cloudfront_distribution.site.arn` (OAC policy; research decision 5, data-model.md `S3SiteBucket`)
- [X] T010 [P] [US1] Create `infra/acm.tf` with: `aws_acm_certificate "site"` (`provider = aws.us_east_1`, `domain_name = var.domain_name`, `subject_alternative_names = ["www.${var.domain_name}"]`, `validation_method = "DNS"`); `aws_acm_certificate_validation "site"` waiting on Route53 validation records (research decision 6, data-model.md `AcmCertificate`)
- [X] T011 [P] [US1] Create `infra/cloudfront.tf` with: `aws_cloudfront_origin_access_control "site"` (`origin_access_control_origin_type = "s3"`, `signing_behavior = "always"`, `signing_protocol = "sigv4"`); `aws_cloudfront_distribution "site"` with S3 origin using the OAC, `price_class = "PriceClass_100"`, `aliases = [var.domain_name, "www.${var.domain_name}"]`, `default_root_object = "index.html"`, `viewer_protocol_policy = "redirect-to-https"`, `http_version = "http2and3"`, ACM certificate via `aws_acm_certificate_validation.site`, and custom error responses for 403→404 and 404→404 pointing to `/404.html` (research decisions 1, 5; data-model.md `CloudFrontDistribution`, `CloudFrontOAC`)
- [X] T012 [US1] Create `infra/route53.tf` with: ACM validation CNAMEs (`for_each = aws_acm_certificate.site.domain_validation_options`); apex `A` record as `ALIAS` to CloudFront domain with hosted zone ID `Z2FDTNDATAQYW2`; `CNAME` record for `www.${var.domain_name}` pointing to CloudFront domain (depends on T010, T011; research decision 7; data-model.md `Route53Records`)
- [X] T013 [P] [US1] Create `infra/cloudwatch.tf` with: `aws_cloudwatch_log_group "cloudfront"` named `/cloudfront/alfredgamulo` with `retention_in_days = 30`; `aws_cloudwatch_dashboard "site"` whose `dashboard_body` JSON widget sets `"region": "us-east-1"` and includes metrics `Requests` (Sum), `BytesDownloaded` (Sum), `4xxErrorRate` (Average), `5xxErrorRate` (Average), `TotalErrorRate` (Average) from `AWS/CloudFront` with dimension `DistributionId = aws_cloudfront_distribution.site.id` (research decision 8; data-model.md `CloudWatchDashboard`)
- [X] T014 [US1] Create `infra/outputs.tf` — output `bucket_name = aws_s3_bucket.site.bucket`, `distribution_id = aws_cloudfront_distribution.site.id`, `cloudfront_domain = aws_cloudfront_distribution.site.domain_name` (contracts/terraform-outputs.ts `TerraformOutputs`; data-model.md `DeployConfig`)
- [X] T015 [US1] Add `infra` recipe to `Justfile`: (1) run `bash infra/bootstrap.sh`; (2) run `terraform -chdir=infra init` with backend config; (3) run `terraform -chdir=infra plan`; (4) run `terraform -chdir=infra apply -auto-approve`; (5) write `.env.deploy` at repo root using `terraform -chdir=infra output -json | jq -r` to produce `SITE_BUCKET=...`, `CLOUDFRONT_DIST_ID=...`, `CLOUDFRONT_DOMAIN=...`; fail fast on any step (contracts/iam-deploy-policy.ts `infra` target; spec.md FR-001, FR-002, FR-006)

**Checkpoint**: `just infra` provisions the full AWS stack and writes `.env.deploy`. Running it twice produces no errors and no duplicate resources.

---

## Phase 4: User Story 2 — Deploy the Site (Priority: P1)

**Goal**: A single `just deploy` command builds the static site, syncs assets to the private S3 bucket via OAC, and issues a full CloudFront cache invalidation — loading deployment config automatically from `.env.deploy`.

**Independent Test**: After `just infra` has been completed, running `just deploy` syncs `dist/` to the S3 bucket and creates a CloudFront invalidation. `curl -I https://alfredgamulo.com/` returns `200` within propagation window. Running it a second time completes successfully (idempotent sync).

### Implementation for User Story 2

- [X] T016 [US2] Enhance `scripts/deploy.sh`: (1) at the top, source `.env.deploy` if the file exists (`[ -f .env.deploy ] && source .env.deploy`); (2) add guard — if `SITE_BUCKET` is still unset after sourcing, print `"Run 'just infra' first to create .env.deploy"` and exit 1; (3) remove `--acl public-read` from the `aws s3 sync` call (bucket is private — OAC enforces access; the flag would cause an error on a bucket with BlockPublicAcls); (4) make CloudFront invalidation required — if `CLOUDFRONT_DIST_ID` is unset, exit 1 with a clear message; (5) ensure `aws cloudfront create-invalidation` exit code is checked (spec.md FR-003, FR-004, FR-006; acceptance scenario 2 and 3)
- [X] T017 [US2] Update `deploy` recipe in `Justfile` to: add a guard that checks for `dist/` directory before proceeding and errors with `"Run 'just build' first"` if missing; then call `bash scripts/deploy.sh`; the recipe inherits `AWS_PROFILE=core` from the top-level export (spec.md FR-003, FR-004; edge case: build dir absent)

**Checkpoint**: `just deploy` completes in under 3 minutes and the live CloudFront URL reflects the latest build.

---

## Phase 5: User Story 3 — Tear Down Infrastructure (Priority: P3)

**Goal**: `just infra-destroy` removes all provisioned AWS resources cleanly and exits with a clear confirmation when nothing exists.

**Independent Test**: After `just infra` and optionally `just deploy`, running `just infra-destroy` empties the S3 site bucket and removes the CloudFront distribution, ACM certificate, and Route53 records. AWS console shows no billable resources. Running again exits cleanly with no errors.

### Implementation for User Story 3

- [X] T018 [US3] Add `infra-destroy` recipe to `Justfile`: (1) source `.env.deploy` if present to get `SITE_BUCKET`; (2) if `SITE_BUCKET` is set, empty the bucket with `aws s3 rm s3://$SITE_BUCKET --recursive` before Terraform can delete it; (3) run `terraform -chdir=infra destroy -auto-approve`; (4) print `"All resources destroyed."` on success; handle missing state gracefully (spec.md FR-005, FR-006; acceptance scenarios 1 and 2)

**Checkpoint**: All three Justfile targets (`just infra`, `just deploy`, `just infra-destroy`) form a complete lifecycle.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, FR-010 compliance, and end-to-end validation.

- [X] T019 Update `docs/authoring.md` — add a "Deployment Architecture" section describing: S3 + CloudFront + OAC pattern, cost profile (~$0/month for personal traffic, PriceClass_100), available Justfile targets (`just infra`, `just deploy`, `just infra-destroy`), and the optional CloudFront flat-rate free tier enrollment step via AWS Console (FR-010; research decision 1 open item)
- [ ] T020 [P] Run end-to-end quickstart validation *(requires live AWS credentials — run manually after `just infra`)*

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)       → No dependencies — start immediately
Phase 2 (Foundational)→ Depends on Phase 1 — BLOCKS all user stories
Phase 3 (US1)         → Depends on Phase 2 — delivers MVP
Phase 4 (US2)         → Depends on Phase 3 (needs .env.deploy written by just infra)
Phase 5 (US3)         → Depends on Phase 2 — independent of Phase 4
Phase 6 (Polish)      → Depends on Phases 3–5
```

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 — Provision | Phase 2 complete | Delivers the S3 bucket, CloudFront dist, and `.env.deploy` |
| US2 — Deploy | US1 complete (`.env.deploy` must exist) | Requires provisioned infra |
| US3 — Destroy | Phase 2 complete | Can run without US2; empties bucket before destroy |

### Parallel Opportunities Per Story

**Phase 2 (Foundational)** — after T003/T004 exist (bootstrap + backend), T005–T008 can all run in parallel (separate files, no cross-deps):
```
T003 → T004 → [T005 ‖ T006 ‖ T007 ‖ T008]
```

**Phase 3 (US1)** — T010, T011, T013 are independent of each other; T009 can start in parallel; T012 and T014 depend on their predecessors; T015 is last:
```
[T009 ‖ T010 ‖ T011 ‖ T013] → T012 → T014 → T015
```

**Phase 4 (US2)** — T016 and T017 touch different files and can run in parallel:
```
[T016 ‖ T017]
```

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

Complete **Phase 1 + Phase 2 + Phase 3** (T001–T015) to deliver a fully provisioned AWS environment via `just infra`. This is the hardest part and unblocks everything else.

### Incremental Delivery

1. **Sprint 1**: Phase 1 + Phase 2 — safe repo, Terraform backend wired up, `terraform plan` succeeds.
2. **Sprint 2**: Phase 3 — `just infra` provisions full AWS stack end-to-end.
3. **Sprint 3**: Phase 4 — `just deploy` works with fixed `scripts/deploy.sh`.
4. **Sprint 4**: Phase 5 + Phase 6 — teardown target + docs.

### Key Risks

| Risk | Mitigation |
|------|-----------|
| ACM DNS validation can take 15–30 min (slow Route53 propagation) | `aws_acm_certificate_validation` waits; `just infra` is idempotent — re-run resumes |
| Bootstrap state bucket name conflict (`alfredgamulo.com-infra`) | `bootstrap.sh` checks for existing bucket before creating; exit with clear error if name is taken globally |
| `--acl public-read` in existing `scripts/deploy.sh` fails on private OAC bucket | T016 removes this flag |
| Partial infra state (e.g. bucket exists, no CloudFront) | Terraform detects and creates only missing resources (idempotent plan) |
