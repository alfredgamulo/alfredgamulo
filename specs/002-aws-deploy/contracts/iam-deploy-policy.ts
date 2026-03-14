/**
 * Contract: Justfile Targets
 *
 * Defines the expected behaviour of each Justfile target introduced by this feature.
 * These are not enforced by the type system at runtime — they document intent for
 * the implementation task phase.
 */
export interface JustfileTarget {
  /** The `just <name>` command string */
  name: string;
  /** Human-readable description */
  description: string;
  /** Must exit 0 only on full success, non-zero on any failure */
  failFast: boolean;
  /** Can be run more than once without side-effects */
  idempotent: boolean;
  /** Env vars / files required before running */
  requires: string[];
  /** Env vars / files produced after running */
  produces: string[];
}

export const JUSTFILE_TARGETS: JustfileTarget[] = [
  {
    name: "infra",
    description:
      "Bootstrap state bucket (idempotent), run terraform init + plan + apply, write .env.deploy",
    failFast: true,
    idempotent: true,
    requires: ["AWS_PROFILE=core (or ~/.aws/credentials [core] profile)"],
    produces: [".env.deploy"],
  },
  {
    name: "infra-destroy",
    description:
      "Empty S3 site bucket, then run terraform destroy to remove all provisioned resources",
    failFast: true,
    idempotent: true,
    requires: [".env.deploy or equivalent env vars"],
    produces: [],
  },
  {
    name: "deploy",
    description:
      "Build static site, sync to S3, issue CloudFront cache invalidation",
    failFast: true,
    idempotent: true,
    requires: [".env.deploy (SITE_BUCKET + CLOUDFRONT_DIST_ID)"],
    produces: [],
  },
];
