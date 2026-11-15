# Miraj Patel — Portfolio (`miraj.dev`)

Personal engineering site at [www.miraj.dev](https://www.miraj.dev):
portfolio, technical blog, photography, and a seven-app browser tool
suite. Built with [Astro](https://astro.build) (islands architecture),
TypeScript, Tailwind CSS v4, and MDX. Astro builds static HTML with no
server or database, so the site deploys directly to GitHub Pages.

## Stack notes

- **Astro 7**, `output: "static"`.
- **Tailwind CSS v4** via `@tailwindcss/vite`. Semantic design tokens,
  responsive typography, per-theme corner radii, and print resets live
  in `src/styles/global.css` (`@theme inline`) and follow
  `public/DESIGN.md` (v2.0). Tailwind's `dark:` variant binds
  `[data-mode="dark"]`.
- **React 19 islands** only on routes that need stateful client
  rendering:
  - `<NycHero>` (`src/components/NycBackground/`, `client:only="react"`)
    renders 10 seasonal and holiday SVG scenes (`[-4, +3]` day windows).
    Clicking the Empire State Building opens a hidden 3D season spinner.
  - Seven `/tools/` apps use React islands:
    - Contrast (`/tools/contrast/`), Diff (`/tools/diff/`), and Paint
      (`/tools/paint/`).
    - Photo Editor (`/tools/photo-editor/`), Pomodoro
      (`/tools/pomodoro/`), Scratchpad (`/tools/scratchpad/`), and SVG
      Editor (`/tools/svg-editor/`).
  - Content pages ship zero framework JavaScript. Both the command
    palette (`⌘K` on a native `<dialog id="cmdk-dialog">`) and the
    `[Theme ▾ | ☀/☾]` header switcher (`ThemeToggle.astro`) use plain
    JavaScript.
- **Design system (`DESIGN.md` v2.0)** — ships three user-selectable
  themes across light and dark modes, verified against WCAG 2.2 AA
  across all six theme-and-mode combinations:
  1. **Crisp Forest (`crisp-forest`, default):** Warm alabaster paper
     and pine teal with vermilion accents, set in `Bricolage Grotesque`,
     `Plus Jakarta Sans`, and `JetBrains Mono`.
  2. **Swiss Drafting (`swiss-drafting`):** Architectural vellum and
     cobalt with `2px–4px` corners and `[word]` bracket emphasis, set in
     `Space Grotesk`, `Public Sans`, and `Azeret Mono`.
  3. **Press & Darkroom (`press-darkroom`):** Cotton newsprint and
     claret ink with `3px` double masthead rules and italic display
     stress, set in `Newsreader`, `Plus Jakarta Sans`, and
     `JetBrains Mono`.
  - Filled controls pair `primary` with `on-primary` and `accent` with
    `on-accent`. Interactive inputs and compact `32px` studio toolbars
    use `border-control` (`>= 3.0:1`).
  - Only Crisp Forest `.woff2` fonts preload in `<head>`. Static
    endpoints `/themes/swiss-drafting.css` and
    `/themes/press-darkroom.css` load on demand when a user opens the
    theme menu or picks an alternate theme.
- **Orthogonal theme & mode state** on
  `<html data-theme="crisp-forest" data-mode="light">`:
  - `data-theme` persists in `localStorage["miraj_theme"]`.
  - `data-mode` persists in `localStorage["miraj_mode"]` and falls back
    to OS `prefers-color-scheme`.
  - Every change dispatches
    `CustomEvent("miraj:themechange", { detail: { theme, mode } })` so
    `/tools/contrast/`, `/tools/paint/`, `<NycHero>`, and Shiki code
    blocks update immediately.
- **Content collections** (`src/content/blog/`) for Markdown and MDX
  articles.

## Requirements

Astro 7 requires **Node.js ≥ 22.12** and **npm ≥ 9.6**. Check your
version:

```bash
node -v
```

If needed, install Node 22+ with [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
```

## Getting started

```bash
npm install
npm run dev         # http://localhost:4321
```

Other scripts:

```bash
npm run build       # production build -> dist/
npm run preview     # serve the production build locally
npm run check       # type-check .astro, .ts, and .tsx files
npm run generate:og # regenerate public/og-image.png
```

## Project structure

```text
src/
  content/blog/       Blog posts (.md / .mdx)
  data/               Structured site data: experience.ts, projects.ts,
                      site.ts, photos.ts
  components/         Shared .astro UI, NycBackground/ hero island, and
                      tools/*.tsx React islands (plus tools/photo-editor/)
  layouts/            BaseLayout (SEO, ThemeInit, header/footer), BlogPostLayout
  pages/              File-based routes (/, /about, /blog, /colophon, /photos,
                      /projects, /resume, /tools/*) + themes/*.css.ts endpoints
  styles/             global.css + lazy theme font bundles
public/               Static assets copied as-is (DESIGN.md, skyline.png,
                      favicon, resume.pdf, robots.txt, .nojekyll)
```

### Adding a blog post

Add a `.md` or `.mdx` file in `src/content/blog/` with this frontmatter:

```yaml
---
title: "Post title"
description: "One or two sentences for cards and meta tags."
publishDate: 2026-08-01
tags: ["frontend", "typescript"]
---
```

New posts appear automatically on `/blog/`, in tag filters, and in the
sitemap. Reading time comes from word count automatically.

### Editing resume-based content

Update `src/data/experience.ts`, `src/data/projects.ts`, and
`src/data/site.ts` directly rather than editing `.astro` page templates.

## Deploying to GitHub Pages

### 1. Push to GitHub

The workflow in `.github/workflows/deploy.yml` builds and deploys
automatically on every push to `main`.

### 2. Keep the canonical site URL in sync

`astro.config.mjs`, `src/data/site.ts` (`url`), and `public/robots.txt`
(`Sitemap:`) must share the same origin:

- **Custom domain (`https://www.miraj.dev`) or user site
  (`mirajp.github.io`)**: keep `site: "https://www.miraj.dev"` with no
  `base` path.
- **Project site subpath (for example, `/portfolio`)**: set both `site`
  and `base` in `astro.config.mjs`:

  ```js
  export default defineConfig({
    site: "https://mirajp.github.io",
    base: "/portfolio",
    // ...
  });
  ```

### 3. Enable GitHub Actions Pages deployment

Open **Settings → Pages** and set **Source** to **GitHub Actions** once
per repository.

### GitHub Pages underscore folder rule

GitHub Pages runs Jekyll by default and ignores `_astro/` asset
directories unless `.nojekyll` exists. `public/.nojekyll` disables
Jekyll processing so built CSS, JS, and font chunks load properly.

## Browser support and privacy for `/tools/*`

All seven tools under `/tools/` run 100% client-side and send zero user
data over the network. Photo Editor decodes images locally and preserves
JPEG EXIF, GPS, XMP, IPTC, and ICC metadata on export. It falls back
from Display P3 to sRGB when needed. Pomodoro notifications stay off
unless granted, and Scratchpad autosave falls back to in-memory session
state when `localStorage` is unavailable.
