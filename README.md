# Miraj Patel — Portfolio

Personal site: portfolio, technical blog, and a couple of small client-side
productivity tools. Built with [Astro](https://astro.build) (islands
architecture — static by default, React only where something is genuinely
interactive), TypeScript, Tailwind CSS v4, and MDX. Fully static output —
no server, no database — so it deploys straight to GitHub Pages.

## Stack notes

- **Astro 7**, output: `static`.
- **Tailwind v4** via the `@tailwindcss/vite` plugin, _not_ the `tailwind.config.ts` +
  `@astrojs/tailwind` setup shown in `design_system.md` — that integration doesn't
  support Astro 7's peer range. All the same tokens (colors, spacing, radius,
  shadows, type scale) are ported 1:1, just defined in `src/styles/global.css`
  under `@theme` instead of a `.ts` config file.
- **React 19** islands (`client:load`) for the 4 places that need real
  interactivity: the contact form, the Pomodoro timer, the Markdown
  scratchpad, and the contrast checker under `/tools`. Every other page
  ships **zero** JavaScript framework code. The command palette (`⌘K`) is
  deliberately _not_ React, even though it's interactive and site-wide —
  it's plain JS on a native `<dialog>`, so pages with no other island still
  ship zero component JS just to get search.
- **Type & color (v2 redesign)** — headlines in Bricolage Grotesque, body in
  Inter, code in JetBrains Mono. Palette is "Editorial teal": warm paper
  neutrals instead of stark white/black, deep pine teal primary + coral
  secondary instead of the generic blue every AI-scaffolded site defaults
  to. Every foreground/background pairing — including white-on-button in
  both themes — is contrast-checked against WCAG AA computationally (see
  `/colophon` for the reasoning, or `src/styles/global.css` for the actual
  token values).
- **Content collections** (`src/content/blog/`) for blog posts, in Markdown
  or MDX.
- **Dark mode** via a `data-theme` attribute (not the OS-only media query),
  toggled by the header button and persisted to `localStorage`.

## Requirements

Astro 7 requires **Node.js ≥ 22.12** and npm ≥ 9.6. Check what you have in WSL:

```bash
node -v
```

If you're below that, install a current Node via [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
```

## Getting started

```bash
npm install
npm run dev       # http://localhost:4321
```

Other scripts:

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm run check      # type-check .astro/.ts/.tsx files
npm run generate:og # regenerate public/og-image.png
```

## Project structure

```
src/
  content/blog/       Blog posts (.md / .mdx)
  data/                Resume-derived + editable content: experience.ts,
                       projects.ts, site.ts, photos.ts, etc.
  components/          Shared .astro components + tools/*.tsx (React islands)
  layouts/             BaseLayout (SEO/head/shell), BlogPostLayout
  pages/               File-based routes — includes /uses and /colophon,
                       linked from the footer rather than primary nav
public/                Static files copied as-is (favicon, resume.pdf, robots.txt)
```

### Adding a blog post

Drop a `.md` (or `.mdx`, if it needs a component) file into `src/content/blog/`
with this frontmatter:

```yaml
---
title: "Post title"
description: "One or two sentences — used in cards and meta tags."
publishDate: 2026-08-01
tags: ["frontend", "typescript"]
---
```

It'll automatically show up in `/blog/`, the tag filter, and the sitemap.
Reading time is computed from word count — no field to fill in.

### Editing resume-based content

`src/data/experience.ts`, `projects.ts`, and `site.ts` hold everything pulled
from your resume — edit the data, not the `.astro` page files.

## Deploying to GitHub Pages

### 1. Push this to a GitHub repo

The included workflow (`.github/workflows/deploy.yml`) builds and deploys
automatically on every push to `main` — no manual `git` steps needed beyond
creating the repo and pushing.

### 2. Set the deployment URL correctly

This matters — get it wrong and the CSS/JS won't load. In `astro.config.mjs`:

- **Repo named exactly `mirajp.github.io`** (a GitHub _user_ site, publishes
  at the domain root): no change needed, this is what's already configured.
- **Any other repo name** (a _project_ site, e.g. `portfolio`): uncomment
  and set the `base` line, and update `site` to match:

  ```js
  export default defineConfig({
    site: "https://mirajp.github.io",
    base: "/portfolio", // ← your repo name
    ...
  ```

  Also update the two matching spots: `public/robots.txt` (the `Sitemap:`
  line) and `src/data/site.ts` (the `url` field).

### 3. Turn on Pages in the repo settings

**Settings → Pages → Source: "GitHub Actions."** (It defaults to "Deploy
from a branch," which will _not_ use the included workflow.) This is a
one-time setting per repo.

Push to `main` and the Actions tab will show the build/deploy run.

### GitHub Pages gotcha already handled

Pages runs Jekyll by default, which ignores any folder starting with an
underscore — including Astro's `_astro/` asset folder, which would silently
break all CSS and JS. `public/.nojekyll` is already in place to disable
that.

## Browser support for the tools

The Pomodoro timer's notification prompt and the scratchpad's autosave both
degrade gracefully — notifications just stay off, and the scratchpad falls
back to session-only (no persistence) if `localStorage` is unavailable
(e.g. private browsing in some browsers). Nothing in either tool sends data
anywhere; both are 100% client-side.
