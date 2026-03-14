#!/usr/bin/env bash
set -euo pipefail

# Load deployment config from .env.deploy if present (written by `just infra`)
if [ -f .env.deploy ]; then
  # shellcheck source=/dev/null
  source .env.deploy
fi

if [ -z "${SITE_BUCKET:-}" ]; then
  echo "SITE_BUCKET not set. Run 'just infra' first to create .env.deploy, or export SITE_BUCKET manually."
  exit 1
fi

if [ -z "${CLOUDFRONT_DIST_ID:-}" ]; then
  echo "CLOUDFRONT_DIST_ID not set. Run 'just infra' first to create .env.deploy, or export CLOUDFRONT_DIST_ID manually."
  exit 1
fi

DIR=dist

if [ ! -d "$DIR" ]; then
  echo "Build output directory '$DIR' not found. Run 'just build' first."
  exit 1
fi

echo "Syncing $DIR -> s3://$SITE_BUCKET"
aws s3 sync "$DIR" "s3://$SITE_BUCKET" --delete

echo "Creating CloudFront invalidation for $CLOUDFRONT_DIST_ID"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*"

echo "Deploy complete."
