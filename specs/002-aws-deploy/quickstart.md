# Quickstart: AWS Deployment

**Feature**: `002-aws-deploy`
**Updated**: 2026-03-14

This guide covers setting up and using the deployment toolchain for `alfredgamulo.com` on AWS. All commands use `just` targets.

---

## Prerequisites

| Tool | Min Version | Check |
|------|-------------|-------|
| AWS CLI | v2 | `aws --version` |
| Terraform | 1.10+ | `terraform version` |
| just | any | `just --version` |
| jq | any | `jq --version` |

**AWS credentials**: You must have the `core` AWS profile configured locally.

```bash
aws configure --profile core
# or: add [core] block to ~/.aws/credentials
```

Verify access: `aws sts get-caller-identity --profile core`

**Route53 precondition**: A hosted zone for `alfredgamulo.com` must already exist in the `core` account. The infra scripts read the zone automatically — no manual input required.

---

## First-Time Setup: Provision Infrastructure

```bash
just infra
```

This single command:
1. Creates the Terraform state bucket (`alfredgamulo.com-infra`) if it doesn't exist.
2. Runs `terraform init -backend-config=...`
3. Runs `terraform plan` then `terraform apply -auto-approve`
4. Writes `.env.deploy` at repo root with `SITE_BUCKET`, `CLOUDFRONT_DIST_ID`, `CLOUDFRONT_DOMAIN`

**Expected duration**: 15–25 minutes (ACM DNS validation can take up to 15 minutes).

**What gets created**:
- S3 site bucket (private, OAC-only access)
- CloudFront distribution (PriceClass_100, HTTPS, custom domain aliases)
- ACM certificate for `alfredgamulo.com` + `www.alfredgamulo.com`
- Route53 records: A ALIAS at apex, CNAME for www, CNAME validation records
- CloudFront OAC
- CloudWatch dashboard (visitor traffic metrics)

After success, inspect `.env.deploy`:

```bash
cat .env.deploy
# SITE_BUCKET=alfredgamulo.com
# CLOUDFRONT_DIST_ID=E1XXXXXXXXXX
# CLOUDFRONT_DOMAIN=d1example.cloudfront.net
```

---

## Deploy the Site

```bash
just deploy
```

This:
1. Sources `.env.deploy` (or reads env vars `SITE_BUCKET`, `CLOUDFRONT_DIST_ID`)
2. Runs `just build` to produce `dist/`
3. Syncs `dist/` to S3 with `--delete` (removes stale files)
4. Issues a `/*` CloudFront cache invalidation

**Expected duration**: under 3 minutes for a typical build + sync.

Verify the site is live:

```bash
# CloudFront domain (immediate)
curl -I https://$(grep CLOUDFRONT_DOMAIN .env.deploy | cut -d= -f2)/

# Custom domain (after DNS propagates, usually < 5 min)
curl -I https://alfredgamulo.com/
```

---

## Subsequent Deploys

Run `just deploy` again at any time. It is idempotent. `.env.deploy` must exist (or env vars must be set).

---

## Optional: Enroll in CloudFront Free Tier Flat-Rate Plan

`just infra` uses `PriceClass_100` which minimises PAYG cost to ~$0 for personal traffic, but does not enrol the distribution in the newer flat-rate free plan (launched Nov 2025). To optionally enrol:

1. Open AWS Console → CloudFront → your distribution → `Savings`
2. Enrol in the **CloudFront Free Tier** flat-rate billing plan
3. No Terraform changes required

---

## Tear Down Infrastructure

> **Warning**: This permanently deletes all AWS resources for this site.

```bash
just infra-destroy
```

This:
1. Empties the S3 site bucket (required before Terraform can delete it)
2. Runs `terraform destroy -auto-approve`
3. Deletes all provisioned resources

The Terraform state bucket (`alfredgamulo.com-infra`) is **not** deleted by this command — it must be removed manually if needed (`aws s3 rb s3://alfredgamulo.com-infra --force`).

---

## Troubleshooting

### `.env.deploy` not found when running `just deploy`

Run `just infra` first to provision infrastructure and generate the file.

### `just infra` fails on ACM certificate validation timeout

ACM DNS validation can take up to 30 minutes if Route53 propagation is slow. Re-run `just infra` — Terraform is idempotent and will pick up where it left off.

### CloudFront returns 403 for all requests

Check that the S3 bucket policy was applied correctly:
```bash
aws s3api get-bucket-policy --bucket $(grep SITE_BUCKET .env.deploy | cut -d= -f2) --profile core
```
The policy should allow `cloudfront.amazonaws.com` with a `SourceArn` condition.

### Terraform state bucket already exists in another account

The bootstrap script uses `alfredgamulo.com-infra` as the state bucket name. If this name is taken (globally), edit `infra/bootstrap.sh` to use a different name and update `infra/versions.tf` backend config accordingly.

---

## Reference

| Command | What it does |
|---------|-------------|
| `just infra` | Provision all AWS resources |
| `just deploy` | Build + sync + invalidate |
| `just infra-destroy` | Tear down all resources |
| `just build` | Build static site to `dist/` |
| `just dev` | Start local dev server |
| `just test` | Run e2e + unit tests |
