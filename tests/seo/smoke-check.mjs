#!/usr/bin/env node
/**
 * tests/seo/smoke-check.mjs
 *
 * Node.js script that reads all dist/**&#47;*.html files after build and asserts
 * each has required SEO meta tags. Exits non-zero on any failure.
 *
 * Usage: node tests/seo/smoke-check.mjs
 * Run after: npm run build
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const DIST_DIR = new URL("../../dist", import.meta.url).pathname;

/** Recursively collect all .html files in a directory */
function collectHtmlFiles(dir) {
  const results = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results.push(...collectHtmlFiles(fullPath));
      } else if (entry.endsWith(".html")) {
        results.push(fullPath);
      }
    }
  } catch {
    // Dir doesn't exist — handled below
  }
  return results;
}

const REQUIRED_PATTERNS = [
  { name: "<title>", test: (html) => /<title>[^<]+<\/title>/.test(html) },
  {
    name: '<meta name="description">',
    test: (html) => /<meta\s+name="description"\s+content="[^"]{1,}"/.test(html),
  },
  {
    name: '<link rel="canonical">',
    test: (html) => /<link\s+rel="canonical"\s+href="https?:\/\/[^"]+">/.test(html),
  },
  {
    name: '<meta name="viewport">',
    test: (html) =>
      /<meta\s+name="viewport"\s+content="[^"]+"/.test(html),
  },
];

const htmlFiles = collectHtmlFiles(DIST_DIR);

if (htmlFiles.length === 0) {
  console.error(`❌ No HTML files found in ${DIST_DIR}`);
  console.error("   Did you run `npm run build` first?");
  process.exit(1);
}

console.log(`🔍 Checking ${htmlFiles.length} HTML file(s) for required SEO tags...\n`);

let failed = 0;
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf-8");
  const relativePath = file.replace(DIST_DIR, "dist");
  const failures = REQUIRED_PATTERNS.filter((p) => !p.test(html));

  if (failures.length > 0) {
    console.error(`❌ ${relativePath}`);
    for (const f of failures) {
      console.error(`   Missing: ${f.name}`);
    }
    failed++;
  } else {
    console.log(`✅ ${relativePath}`);
  }
}

console.log("");
if (failed > 0) {
  console.error(`❌ ${failed} file(s) failed SEO checks.`);
  process.exit(1);
} else {
  console.log(`✅ All ${htmlFiles.length} file(s) passed SEO checks.`);
}
