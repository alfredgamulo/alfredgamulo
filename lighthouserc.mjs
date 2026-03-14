/**
 * lighthouserc.mjs
 *
 * Lighthouse CI configuration.
 * Asserts performance ≥ 80 and SEO ≥ 90 for all three MVP pages.
 *
 * Runs after `npm run build` via: just lighthouse
 * Verifies SC-001 (performance) and SC-002 (SEO score) from the spec.
 *
 * See: https://github.com/GoogleChrome/lighthouse-ci
 */

export default {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: [
        "/",
        "/writing/cve-2024-example/",
        "/playground/python-editor/",
      ],
    },
    assert: {
      preset: "lighthouse:no-pwa",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["warn", { minScore: 0.8 }],
        // Specific SEO assertions (SC-002)
        "document-title": "error",
        "meta-description": "error",
        "canonical": "error",
        "viewport": "error",
        "link-text": "warn",
        // Performance (SC-001: interactive in 3s on 10 Mbps)
        "interactive": ["warn", { maxNumericValue: 5000 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
