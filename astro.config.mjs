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
      format: "es",
      rollupOptions: {
        // /pyodide/pyodide.mjs lives in public/ and is only available at runtime.
        // Marking it external prevents Rollup from trying to bundle it.
        external: ["/pyodide/pyodide.mjs"],
      },
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
