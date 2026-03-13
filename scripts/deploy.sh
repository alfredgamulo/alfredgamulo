#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SITE_BUCKET:-}" ]; then
  echo "SITE_BUCKET not set. Export SITE_BUCKET and try again."
  exit 1
fi

if [ -d public ]; then DIR=public; elif [ -d dist ]; then DIR=dist; elif [ -d build ]; then DIR=build; else DIR=dist; fi

if [ ! -d "$DIR" ]; then
  echo "Build output directory '$DIR' not found. Run 'just build' first."
  exit 1
fi

echo "Syncing $DIR -> s3://$SITE_BUCKET"
aws s3 sync "$DIR" "s3://$SITE_BUCKET" --delete --acl public-read

if [ -n "${CLOUDFRONT_DIST_ID:-}" ]; then
  echo "Creating CloudFront invalidation for $CLOUDFRONT_DIST_ID"
  aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*"
fi

echo "Deploy complete."
