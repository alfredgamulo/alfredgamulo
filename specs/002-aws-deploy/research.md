# Phase 0 Research: AWS Deployment

**Feature**: `002-aws-deploy`
**Date**: 2026-03-14
**Status**: Complete

---

## Decision Log

### 1. CloudFront "Free $0 Tier" vs. PriceClass_100

**Decision**: Use `price_class = "PriceClass_100"` in Terraform. Do NOT attempt to enroll the flat-rate free plan via Terraform.

**Rationale**: AWS launched a new CloudFront "Free Tier" flat-rate billing plan in November 2025 (~$0/month for 1M requests + 100GB transfer). This plan is a billing-level enrollment, not a distribution-level attribute. As of early 2026, the Terraform AWS provider (`hashicorp/aws`) has no resource or attribute for enrolling in this flat-rate plan. Attempting to automate the enrollment requires unsupported API calls outside the Terraform lifecycle.

`PriceClass_100` limits edge locations to US, Canada, and Europe — the intended audience — which reduces PAYG costs to the minimum available via Terraform. At personal blog traffic levels this effectively means ~$0/month.

**Alternatives considered**:
- `PriceClass_All`: More edge locations, higher PAYG cost. Rejected.
- Manual console enrollment of flat-rate plan: post-apply manual step. Document as optional follow-up, not automated.

**Post-apply note**: After `just infra`, the developer may optionally enroll the distribution in the flat-rate plan via AWS Console → CloudFront → Savings Bundle. This is not automated.

---

### 2. S3 Backend for Terraform Remote State (No DynamoDB)

**Decision**: Use Terraform S3 backend with `use_lockfile = true`. No DynamoDB table.

**Rationale**: Terraform ≥ 1.10 supports native S3-based state locking via a `.tflock` object in the same bucket. This eliminates the DynamoDB dependency for lock management, reducing cost and infra surface. The installed Terraform version supports this.

`use_lockfile = true` stores lock files as S3 objects with the key `<state_key>.tflock`. Concurrent applies fail fast when a lock exists.

**Alternatives considered**:
- DynamoDB lock table: additional resource, monthly cost. Rejected in favour of native S3 locking.

---

### 3. Bootstrap Strategy (Chicken-and-Egg State Bucket)

**Decision**: Ship a `infra/bootstrap.sh` script that creates the Terraform state bucket (`alfredgamulo.com-infra`) via AWS CLI before `terraform init`. This runs once on first setup.

**Rationale**: Terraform cannot use an S3 backend that doesn't yet exist. The state bucket must be created out-of-band. A shell script using `aws s3api create-bucket` with `--no-fail-on-existing-bucket` semantics (using `--ignore-existing` or conditional creation) is the simplest, dependency-free solution consistent with the project's zero-runtime preference.

The `just infra` Justfile target calls `bootstrap.sh` before `terraform init` to ensure idempotency.

**Bootstrap bucket name**: `alfredgamulo.com-infra` (fixed, not hashed — this bucket stores Terraform state and is not user-facing).

---

### 4. Site Bucket Naming

**Decision**: Site bucket name = `alfredgamulo.com` (the registered domain, no hash suffix).

**Rationale**: The domain name `alfredgamulo.com` is globally unique by definition — it is a registered domain owned by this account. Using the plain domain name is the simplest, most readable approach and avoids hash computation entirely. No account-ID hash suffix is required.

**Implementation**:
- Terraform: `local.bucket_name = var.domain_name`

---

### 5. CloudFront Origin Access Control (OAC)

**Decision**: Use `aws_cloudfront_origin_access_control` (OAC), NOT the legacy Origin Access Identity (OAI).

**Rationale**: OAC is the current AWS recommendation. It uses SigV4 signing and supports all S3 APIs. OAI is deprecated and cannot sign certain S3 requests.

**Key configuration**:
- `signing_behavior = "always"`
- `signing_protocol = "sigv4"`
- S3 bucket policy grants `s3:GetObject` to `cloudfront.amazonaws.com` with condition `aws:SourceArn = CloudFront distribution ARN`
- S3 bucket uses `aws_s3_bucket_public_access_block` to block all public access.

---

### 6. ACM Certificate in us-east-1

**Decision**: Issue ACM certificate using a `provider` alias `aws.us_east_1`. Terraform uses DNS validation with Route53.

**Rationale**: CloudFront distributions require ACM certificates to be in `us-east-1` regardless of the S3 bucket region. A provider alias with `region = "us-east-1"` handles this without manual cross-region steps.

**DNS validation**: `for_each = aws_acm_certificate.site.domain_validation_options` creates Route53 validation records automatically. `aws_acm_certificate_validation` resource ensures the cert is validated before the CloudFront distribution references it. Certificate covers both `alfredgamulo.com` and `www.alfredgamulo.com` as SANs.

---

### 7. Route53 Apex and WWW Routing

**Decision**:
- Apex (`alfredgamulo.com`): Route53 `A` record as ALIAS to CloudFront domain.
- WWW (`www.alfredgamulo.com`): Route53 `CNAME` to CloudFront domain.
- Both hostnames included in CloudFront `aliases` and ACM certificate SANs.

**Rationale**: Route53 supports ALIAS records for apex domains to CloudFront distributions. ALIAS `A` records have no TTL cost and route correctly at the apex. CloudFront `hosted_zone_id` for ALIAS is always `Z2FDTNDATAQYW2` (AWS constant).

**Alternatives considered**:
- CNAME at apex: Not valid per DNS spec. Rejected.
- www redirect at CloudFront function level: Unnecessary — both apex and www serve identical content.

---

### 8. CloudWatch Visitor Metrics

**Decision**: Use a `aws_cloudwatch_dashboard` with metrics from the `AWS/CloudFront` namespace. Dimension is `Region = "Global"` (string literal). Dashboard widget must set `"region": "us-east-1"` in its JSON configuration since CloudFront metrics are only available in us-east-1.

**Metrics to include**: `Requests` (Sum), `BytesDownloaded` (Sum), `4xxErrorRate` (Average), `5xxErrorRate` (Average), `TotalErrorRate` (Average).

**Log group**: `aws_cloudwatch_log_group` named `/cloudfront/${var.domain_name}` with a `retention_in_days = 30` to control cost. No S3 access log bucket — CloudWatch metrics from `AWS/CloudFront` namespace are sufficient for a personal site.

**Alternatives considered**:
- CloudWatch Logs Insights: requires CloudFront real-time logs → Kinesis → Lambda pipeline. Too complex for personal site. Rejected.
- Third-party analytics: not infrastructure-as-code friendly. Rejected.

---

### 9. Terraform Outputs and .env.deploy

**Decision**: Terraform `outputs.tf` emits `bucket_name`, `distribution_id`, and `cloudfront_domain`. The `just infra` target runs `terraform output -json | jq` and writes a `.env.deploy` file at repo root.

**File format** (`.env.deploy`):
```
SITE_BUCKET=alfredgamulo.com-a1b2c3d4
CLOUDFRONT_DIST_ID=E1XXXXXXXXXX
CLOUDFRONT_DOMAIN=d1example.cloudfront.net
```

**Rationale**: The existing `scripts/deploy.sh` already reads `SITE_BUCKET` and `CLOUDFRONT_DIST_ID`. Emitting `.env.deploy` from `just infra` ensures zero manual copy-paste between infra and deploy steps.

---

### 10. AWS Profile

**Decision**: All Terraform and AWS CLI invocations use `AWS_PROFILE=core`.

**Rationale**: User-specified. The Terraform providers include `profile = "core"`. The Justfile sets `export AWS_PROFILE := "core"` at the top so AWS CLI calls in bootstrap scripts and deploy targets pick it up automatically.

---

## Open Items (post-plan)

| # | Item | Resolution Path |
|---|------|-----------------|
| 1 | CloudFront flat-rate free plan enrollment | Manual step via AWS Console after `just infra`; check provider changelog for automation in future |
| 2 | Route53 zone must already exist | Assumption: hosted zone for `alfredgamulo.com` exists in the `core` account. Bootstrap script validates this. |
