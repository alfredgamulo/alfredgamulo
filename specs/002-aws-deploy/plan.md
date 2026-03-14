# Implementation Plan: AWS Deployment with Justfile Targets

**Branch**: `002-aws-deploy` | **Date**: 2026-03-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-aws-deploy/spec.md`

## Summary

Provision fully automated AWS infrastructure (S3 + CloudFront + ACM + Route53 + CloudWatch) for `alfredgamulo.com` using Terraform with an S3 remote backend. Expose `just infra`, `just deploy`, and `just infra-destroy` Justfile targets that cover the full lifecycle with no manual steps or console interaction. Remote Terraform state lives in a separate `alfredgamulo.com-infra` bucket; the site bucket is named `alfredgamulo.com` (the registered domain, which is globally unique by definition). CloudFront uses `PriceClass_100` with Origin Access Control (OAC) to keep S3 private. ACM and Route53 handle HTTPS and custom domain automatically. CloudWatch provides a visitor traffic dashboard.

## Technical Context

**Language/Version**: Terraform HCL (≥ 1.10); Bash (helper scripts)
**Primary Dependencies**: `hashicorp/aws ~> 5.0` (primary region + `aws.us_east_1` alias for ACM); AWS CLI v2; `jq`
**Storage**: Terraform S3 backend (`alfredgamulo.com-infra` bucket, key `alfredgamulo.com/terraform.tfstate`, `use_lockfile = true` — no DynamoDB required)
**Testing**: `terraform plan` review; post-apply smoke `curl -I https://alfredgamulo.com/`; existing Playwright suite validates site content is correct after deploy
**Target Platform**: AWS us-east-1 (CloudFront + ACM require us-east-1; S3 in same region)
**Project Type**: Infrastructure-as-code + shell deploy scripts
**Performance Goals**: `just deploy` completes < 3 min for typical build + S3 sync + CloudFront invalidation (SC-002)
**Constraints**: ~$0/month at personal blog traffic (PriceClass_100; free-tier eligible S3); no DynamoDB; no Lambda; no running processes
**Scale/Scope**: Single static site; solo developer; one AWS account (profile: `core`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **Security-First** | ✅ PASS | S3 private; OAC enforced; ACM HTTPS only; `.env.deploy` git-ignored; `core` AWS profile used for all operations; no secrets in source |
| **Content Flexibility** | ✅ N/A | Infra-only layer — no change to content schema or page templates |
| **Cost-Efficiency** | ✅ PASS | S3 + CloudFront PriceClass_100; ~$0/month at personal traffic; no runtime services; S3 state backend replaces DynamoDB |
| **Simplicity & Maintainability** | ✅ PASS | Flat `infra/` directory, no modules; bootstrap is the only one-time step; < 10 Terraform files |
| **SEO & Discoverability** | ✅ N/A | HTTPS enforced (`redirect-to-https`); canonical URL intact; no SEO content changes |
| **Developer Experience (Justfile)** | ✅ PASS | Adds `just infra`, `just infra-destroy`; enhances `just deploy` to auto-load `.env.deploy` |

**Post-design re-check**: No new violations introduced in Phase 1 design. Flat single-directory structure upholds simplicity principle.

## Project Structure

### Documentation (this feature)

```text
specs/002-aws-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 findings (research agents)
├── data-model.md        # Infrastructure entities + configuration state
├── quickstart.md        # Developer setup and usage guide
├── contracts/
│   ├── terraform-outputs.ts   # TerraformOutputs + DeployConfig interfaces
│   └── iam-deploy-policy.ts   # Justfile target contracts
└── tasks.md             # Phase 2 output (not yet created — /speckit.tasks)
```

### Source Code (repository root)

```text
infra/
├── bootstrap.sh          # One-time: create alfredgamulo.com-infra state bucket + terraform init
├── versions.tf           # terraform { required_version, required_providers }
├── providers.tf          # provider "aws" { profile="core", region="us-east-1" }
│                         # provider "aws" alias "us_east_1" { region="us-east-1" } (for ACM)
├── variables.tf          # var.domain_name, var.aws_profile, var.aws_region
├── locals.tf             # local.bucket_name, local.tags
├── data.tf               # data.aws_route53_zone
├── s3.tf                 # Site bucket (OAC policy) + public access block
├── cloudfront.tf         # aws_cloudfront_origin_access_control + aws_cloudfront_distribution
├── acm.tf                # aws_acm_certificate (provider=aws.us_east_1) + validation
├── route53.tf            # Apex A ALIAS + www CNAME + ACM validation CNAMEs
├── cloudwatch.tf         # aws_cloudwatch_log_group + aws_cloudwatch_dashboard
└── outputs.tf            # bucket_name, distribution_id, cloudfront_domain

scripts/
└── deploy.sh             # Enhanced: source .env.deploy; existing S3 sync + CF invalidation

Justfile                  # +infra recipe (bootstrap → tf apply → write .env.deploy)
                          # +infra-destroy recipe (empty bucket → tf destroy)
                          # ~deploy recipe (source .env.deploy → build → sync → invalidate)
.gitignore                # +.env.deploy entry
```

**Structure Decision**: Flat `infra/` directory — no Terraform modules. The infra is simple (one account, one region + one alias, one distribution). Modules add indirection without benefit at this scale. Each concern (`s3`, `cloudfront`, `acm`, `route53`, `cloudwatch`) has its own `.tf` file for readability. `bootstrap.sh` is co-located with Terraform files.

## Complexity Tracking

No constitution violations. No complexity justification required.
