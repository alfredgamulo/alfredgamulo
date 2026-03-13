// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://alfredgamulo.com",
  output: "static",
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
