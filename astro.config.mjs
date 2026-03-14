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
