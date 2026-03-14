#!/usr/bin/env bash
# bootstrap.sh — Create the Terraform remote state bucket (idempotent).
# Run once before `terraform init`. Safe to re-run at any time.
set -euo pipefail

AWS_PROFILE="core"
STATE_BUCKET="alfredgamulo.com-infra"
REGION="us-east-1"

echo "==> Bootstrapping Terraform state bucket: $STATE_BUCKET"

# Check if bucket already exists (head-bucket returns 0 if accessible, non-zero otherwise)
if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
  echo "    State bucket already exists — skipping creation."
else
  echo "    Creating state bucket in $REGION..."
  # us-east-1 does NOT accept --create-bucket-configuration (AWS quirk)
  aws s3api create-bucket \
    --bucket "$STATE_BUCKET" \
    --region "$REGION"

  echo "    Enabling versioning..."
  aws s3api put-bucket-versioning \
    --bucket "$STATE_BUCKET" \
    --versioning-configuration Status=Enabled

  echo "    Blocking all public access on state bucket..."
  aws s3api put-public-access-block \
    --bucket "$STATE_BUCKET" \
    --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

  echo "    State bucket created."
fi

echo "==> Bootstrap complete. State bucket: $STATE_BUCKET"
