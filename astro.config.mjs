// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://alfredgamulo.com",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file", // outputs slug.html instead of slug/index.html — required for S3/CloudFront OAC
  },
  vite: {
    worker: {
      // Output workers as ES modules to match `new Worker(..., { type: "module" })`.
      // IIFE format (the Vite default) can't handle top-level CDN ESM imports —
      // it emits a broken `pyodide_mjs` global reference that is undefined at runtime.
      format: "es",
    },
  },
  integrations: [
    mdx(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: false,
    },
  },
});
