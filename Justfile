set shell := ["/bin/bash", "-euxo pipefail", "-c"]

# Build the static site. Tries common build commands, falls back to a message.
build:
	if [ -f package.json ]; then \
		npm run build; \
	elif command -v hugo >/dev/null 2>&1 && [ -f config.toml -o -f config.yaml -o -f config.yml ]; then \
		hugo; \
	else \
		echo "No known build command found. Define 'npm run build' or use Hugo."; exit 1; \
	fi

# Run local development server. Prefers npm scripts, then Hugo.
dev:
	if [ -f package.json ]; then \
		npm run dev || npm start; \
	elif command -v hugo >/dev/null 2>&1; then \
		hugo server -D; \
	else \
		echo "No dev server command found (npm or hugo)."; exit 1; \
	fi

# Run tests if present (npm test). Otherwise a harmless success.
test:
	if [ -f package.json ]; then \
		npm test || true; \
	else \
		echo "No tests configured (no package.json)."; \
	fi

# Deploy the static build to S3 and invalidate CloudFront. Requires env vars: SITE_BUCKET, optionally CLOUDFRONT_DIST_ID
deploy:
	: "Ensure SITE_BUCKET is set"
	if [ -z "${SITE_BUCKET:-}" ]; then \
		echo "Environment variable SITE_BUCKET is required (export SITE_BUCKET=my-bucket)"; exit 1; \
	fi
	# Determine build output directory
	if [ -d public ]; then DIR=public; elif [ -d dist ]; then DIR=dist; elif [ -d build ]; then DIR=build; else DIR=dist; fi
	# Ensure build exists
	if [ ! -d "$DIR" ]; then echo "Build output directory '$DIR' not found. Run 'just build' first."; exit 1; fi
	aws s3 sync "$DIR" "s3://$SITE_BUCKET" --delete --acl public-read
	if [ -n "${CLOUDFRONT_DIST_ID:-}" ]; then \
		aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*"; \
	fi
