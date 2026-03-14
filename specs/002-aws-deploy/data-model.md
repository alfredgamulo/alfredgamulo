# Data Model: AWS Deployment

**Feature**: `002-aws-deploy`
**Date**: 2026-03-14

This feature is a delivery/infrastructure layer. It has no application data model. Instead, this file documents the **infrastructure entities** managed by Terraform and the **configuration state** passed between the `infra` and `deploy` steps.

---

## Infrastructure Entities

### TerraformState
Stored in the remote S3 backend. Not directly referenced by application code.

| Field | Type | Notes |
|-------|------|-------|
| bucket | string | Fixed: `alfredgamulo.com-infra` |
| key | string | Fixed: `alfredgamulo.com/terraform.tfstate` |
| region | string | `us-east-1` |
| use_lockfile | bool | `true` — native S3 lock, no DynamoDB |

---

### S3SiteBucket
The private S3 bucket hosting built static output.

| Field | Type | Notes |
|-------|------|-------|
| bucket_name | string | `alfredgamulo.com` |
| public_access | bool | Always `false` — block all public access |
| versioning | bool | `false` — not needed for static hosting |
| tags | map\<string\> | `{ project = "alfredgamulo", managed_by = "terraform" }` |

**Constraints**:
- Name must be globally unique across AWS.
- Name must remain stable after initial creation (changing it tears down CloudFront).
- `GetObject` permitted only to CloudFront OAC principal via bucket policy.

---

### CloudFrontOAC
Origin Access Control — authorizes CloudFront to read from the private S3 bucket.

| Field | Type | Notes |
|-------|------|-------|
| name | string | `alfredgamulo-oac` |
| origin_access_control_origin_type | string | `s3` |
| signing_behavior | string | `always` |
| signing_protocol | string | `sigv4` |

---

### CloudFrontDistribution
Serves the site over HTTPS from S3.

| Field | Type | Notes |
|-------|------|-------|
| distribution_id | string | AWS-assigned, e.g. `E1XXXXXXXXXX` |
| domain_name | string | AWS-assigned, e.g. `d1example.cloudfront.net` |
| aliases | string[] | `["alfredgamulo.com", "www.alfredgamulo.com"]` |
| price_class | string | `PriceClass_100` (US/CA/EU edges) |
| default_root_object | string | `index.html` |
| http_version | string | `http2and3` |
| viewer_protocol_policy | string | `redirect-to-https` |
| oac_id | string | Reference to `CloudFrontOAC` |
| acm_certificate_arn | string | Reference to `AcmCertificate` |

**Custom error responses** (4xx SPA-style fallback):

| error_code | response_code | response_page_path |
|------------|---------------|-------------------|
| 403 | 404 | `/404.html` |
| 404 | 404 | `/404.html` |

---

### AcmCertificate
Managed TLS certificate, must be in `us-east-1`.

| Field | Type | Notes |
|-------|------|-------|
| domain_name | string | `alfredgamulo.com` |
| subject_alternative_names | string[] | `["www.alfredgamulo.com"]` |
| validation_method | string | `DNS` |
| provider | string | `aws.us_east_1` (provider alias) |

---

### Route53Records

| Record | Type | Value |
|--------|------|-------|
| `alfredgamulo.com` (apex) | A (ALIAS) | CloudFront distribution domain, zone `Z2FDTNDATAQYW2` |
| `www.alfredgamulo.com` | CNAME | CloudFront distribution domain |
| ACM validation records | CNAME | Auto-generated from `domain_validation_options` |

**Assumption**: Route53 hosted zone for `alfredgamulo.com` already exists in the `core` AWS account. Terraform reads it via `data.aws_route53_zone`.

---

### CloudWatchDashboard
Visualises visitor traffic metrics.

| Metric | Namespace | Stat | Dimension |
|--------|-----------|------|-----------|
| Requests | AWS/CloudFront | Sum | `Region=Global`, `DistributionId=<id>` |
| BytesDownloaded | AWS/CloudFront | Sum | same |
| 4xxErrorRate | AWS/CloudFront | Average | same |
| 5xxErrorRate | AWS/CloudFront | Average | same |
| TotalErrorRate | AWS/CloudFront | Average | same |

**Note**: CloudFront metrics for `Region=Global` are only available in `us-east-1`. Dashboard JSON must set `"region": "us-east-1"`.

---

## Configuration State

### DeployConfig (`.env.deploy`)
Written by `just infra` after `terraform apply`. Consumed by `just deploy`.

| Variable | Source | Example |
|----------|--------|---------|
| `SITE_BUCKET` | `terraform output -raw bucket_name` | `alfredgamulo.com-a1b2c3d4` |
| `CLOUDFRONT_DIST_ID` | `terraform output -raw distribution_id` | `E1XXXXXXXXXX` |
| `CLOUDFRONT_DOMAIN` | `terraform output -raw cloudfront_domain` | `d1example.cloudfront.net` |

**Security**: `.env.deploy` is listed in `.gitignore`. It contains infrastructure identifiers (not secrets), but should not be committed to avoid exposing infra details.

---

## State Transitions

```
(nothing) ──[just infra]──► PROVISIONED
                             │
                         [just deploy]
                             │
                             ▼
                           LIVE ◄──[just deploy]── (redeploy)
                             │
                     [just infra-destroy]
                             │
                             ▼
                          (nothing)
```

| State | Invariant |
|-------|-----------|
| PROVISIONED | S3 bucket + CloudFront distribution exist; `.env.deploy` written |
| LIVE | All PROVISIONED invariants hold; S3 contains build output; CloudFront serves site |
