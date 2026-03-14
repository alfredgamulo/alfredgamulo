set shell := ["/bin/bash", "-euxo", "pipefail", "-c"]

export AWS_PROFILE := "core"

# Build the static site with Astro
build:
    npm run build

# Run local Astro development server (hot-reload at localhost:4321)
dev: build
    npm run dev -- --host 0.0.0.0

# Run all checks: audit, lint, e2e tests, SEO smoke-check
test:
    npm audit --audit-level=high
    npx eslint src/
    npx playwright test
    node tests/seo/smoke-check.mjs

# Deploy to S3 and invalidate CloudFront
deploy: build
    if [ ! -d dist ]; then echo "dist/ not found — run 'just build' first"; exit 1; fi
    bash scripts/deploy.sh

# Provision all AWS infrastructure (idempotent)
infra:
    #!/usr/bin/env bash
    set -euo pipefail
    bash infra/bootstrap.sh
    terraform -chdir=infra init
    terraform -chdir=infra plan
    terraform -chdir=infra apply
    echo "Writing .env.deploy..."
    terraform -chdir=infra output -json | jq -r \
      '"SITE_BUCKET=" + .bucket_name.value,
       "CLOUDFRONT_DIST_ID=" + .distribution_id.value,
       "CLOUDFRONT_DOMAIN=" + .cloudfront_domain.value' > .env.deploy
    echo "Done. .env.deploy written."
    cat .env.deploy

# Tear down all AWS infrastructure
infra-destroy:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -f .env.deploy ]; then
      # shellcheck source=/dev/null
      source .env.deploy
    fi
    if [ -z "${SITE_BUCKET:-}" ]; then
      SITE_BUCKET=$(terraform -chdir=infra output -raw bucket_name 2>/dev/null || true)
    fi
    if [ -n "${SITE_BUCKET:-}" ]; then
      echo "Emptying S3 bucket: s3://$SITE_BUCKET"
      aws s3 rm "s3://$SITE_BUCKET" --recursive || true
    else
      echo "No SITE_BUCKET found — skipping bucket empty step."
    fi
    terraform -chdir=infra destroy -auto-approve
    echo "All resources destroyed."

# Run Lighthouse CI against production build
lighthouse:
    npm run build
    npx lhci autorun
