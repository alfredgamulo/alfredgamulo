/**
 * Contract: Terraform Output Schema
 *
 * These are the values emitted by `terraform output -json` after `just infra`.
 * The `just infra` target writes these to `.env.deploy` at repo root.
 *
 * Source: infra/outputs.tf
 */
export interface TerraformOutputs {
  /**
   * The name of the private S3 bucket hosting static build output.
   * Value: "alfredgamulo.com" (the registered domain, globally unique by definition)
   * Consumed by: scripts/deploy.sh as SITE_BUCKET
   */
  bucket_name: string;

  /**
   * The CloudFront distribution ID (e.g. "E1XXXXXXXXXX").
   * Used to issue cache invalidations on deploy.
   * Consumed by: scripts/deploy.sh as CLOUDFRONT_DIST_ID
   */
  distribution_id: string;

  /**
   * The CloudFront-assigned domain name (e.g. "d1example.cloudfront.net").
   * The site is accessible here before custom DNS propagates.
   * Consumed by: scripts/deploy.sh as CLOUDFRONT_DOMAIN (informational)
   */
  cloudfront_domain: string;
}

/**
 * Contract: Deploy Configuration File (.env.deploy)
 *
 * Written by `just infra` to repo root. Git-ignored.
 * Read by `just deploy` to locate infra resources.
 *
 * File format (shell-compatible KEY=VALUE, no quoting):
 *   SITE_BUCKET=alfredgamulo.com
 *   CLOUDFRONT_DIST_ID=E1XXXXXXXXXX
 *   CLOUDFRONT_DOMAIN=d1example.cloudfront.net
 */
export interface DeployConfig {
  /** Maps from TerraformOutputs.bucket_name */
  SITE_BUCKET: string;
  /** Maps from TerraformOutputs.distribution_id */
  CLOUDFRONT_DIST_ID: string;
  /** Maps from TerraformOutputs.cloudfront_domain */
  CLOUDFRONT_DOMAIN: string;
}
