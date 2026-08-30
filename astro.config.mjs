// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// ---------------------------------------------------------------------------
// Deployment target
// ---------------------------------------------------------------------------
// `site` must point at the real, published URL for correct canonical tags,
// the sitemap, and RSS (removed). The defaults below assume a GitHub *user*
// Pages repo named `mirajp.github.io`, which publishes at the domain root
// (no `base`).
//
// If you instead deploy this as a *project* page (e.g. a repo named
// `portfolio` published at mirajp.github.io/portfolio), update BOTH values:
//   site: "https://mirajp.github.io",
//   base: "/portfolio",
export default defineConfig({
  site: "https://mirajp.github.io",
  // base: "/portfolio", // uncomment + set if deploying as a project page

  output: "static", // GitHub Pages only serves static files, no SSR adapter

  integrations: [react(), mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false, // let our own CSS drive light/dark via [data-theme]
    },
  },
});
