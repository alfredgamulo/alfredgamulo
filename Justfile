set shell := ["/bin/bash", "-euxo", "pipefail", "-c"]

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
deploy:
    bash scripts/deploy.sh

# Run Lighthouse CI against production build
lighthouse:
    npm run build
    npx lhci autorun
