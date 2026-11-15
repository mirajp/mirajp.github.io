# AGENTS.md

Repository instructions for `mirajp.github.io`
(`https://www.miraj.dev`), a static Astro 7 portfolio, technical blog,
and six-app browser tool suite. `public/DESIGN.md` (v2.0) is the
authoritative design specification.

## Commands and Verification

Requires **Node.js >= 22.12** and **npm >= 9.6**.

```bash
npm run dev         # Start local dev server at http://localhost:4321
npm run check       # Run Astro and TypeScript diagnostics (.astro, .ts, .tsx)
npm run build       # Build static site into dist/
npm run preview     # Preview production build locally
npm run generate:og # Regenerate public/og-image.png
```

- Run `npm run check && npm run build` after every code, style, or
  content change. Fix all errors, warnings, and hints before completion.
- Do not run `astro check` or `astro build` while `astro dev` is active.
  Concurrent runs corrupt Vite's `.vite/deps` cache.

## Architecture and Islands

- Keep `output: "static"` in `astro.config.mjs`. The site deploys to
  GitHub Pages with no server or database.
- Ship zero framework JavaScript on content routes (`/about/`,
  `/blog/*`, `/colophon/`, `/photos/`, `/projects/`, `/resume/`).
- Keep the command palette (`<dialog id="cmdk-dialog">`, `⌘K`), `<head>`
  initializer (`src/components/ThemeInit.astro`), and header switcher
  (`src/components/ThemeToggle.astro`) in plain JavaScript.
- Restrict React 19 islands to `<NycHero>`
  (`src/components/NycBackground/`) and the six `/tools/*` apps
  (`src/components/tools/*.tsx`).
- Edit structured data in `src/data/` (`site.ts`, `experience.ts`,
  `projects.ts`, `photos.ts`) and posts in `src/content/blog/`. Do not
  hardcode resume or project entries in `.astro` pages.

## Design System (`public/DESIGN.md` v2.0)

Read `public/DESIGN.md` before you change colors, typography, spacing,
radii, or shared UI components. Keep `public/DESIGN.md` and
`src/styles/global.css` synchronized.

### Theme and Mode State

- Control theme identity and polarity with two orthogonal attributes on
  `<html>`:
  - `data-theme`: `"crisp-forest"` (default) | `"swiss-drafting"` |
    `"press-darkroom"`, stored in `localStorage["miraj_theme"]`.
  - `data-mode`: `"light"` | `"dark"`, stored in
    `localStorage["miraj_mode"]` with `prefers-color-scheme` fallback.
- Point `@custom-variant dark` in `src/styles/global.css` at
  `[data-mode="dark"]`, never `[data-theme="dark"]`.
- Dispatch
  `window.dispatchEvent(new CustomEvent("miraj:themechange", { detail: { theme, mode } }))`
  on every theme or mode update.

### Semantic Color Tokens (WCAG 2.2 AA)

- Bind semantic tokens from `src/styles/global.css` (`@theme inline`) in
  all Astro templates and React islands.
- Never hardcode hex literals or raw Tailwind palette utilities such as
  `text-white`, `bg-teal-50`, `bg-gray-900`, or `text-red-600`.
- Pair every `primary` fill with `on-primary`, `accent` with
  `on-accent`, `primary-soft` with `on-primary-soft`, and `accent-soft`
  with `on-accent-soft`.
- Use `border-border-control` (`>= 3.0:1`) on inputs, sliders, color
  wells, and segmented or compact buttons. Use `border-border-subtle` on
  hairline card and section dividers.

### Typography and Lazy Font Loading

- Preload only Crisp Forest `.woff2` fonts (`Bricolage Grotesque`,
  `Plus Jakarta Sans`, `JetBrains Mono`) in `<head>`.
- Keep alternate theme `@font-face` rules in
  `src/styles/theme-swiss-drafting.css` and
  `src/styles/theme-press-darkroom.css`, served via
  `src/pages/themes/*.css.ts`. Inject `<link rel="stylesheet">` tags
  only when the theme menu opens or an alternate theme is active.
- Pair every heading above `32px` (`display`, `headline-lg`) with its
  mobile token (`<= 32px`).
- Apply `tabular-nums` (`font-variant-numeric: tabular-nums`) to dates,
  reading times, counters, sliders, and coordinates.
- Keep `/tools/*` control bars in `--font-sans` and `--font-mono` across
  all three themes.

### Layout Density and Editorial Motifs

- Use `44px` (`min-h-11`) controls, `65ch–72ch` prose measure
  (`.measure`), and `64px` (`py-16`) section spacing on editorial
  routes.
- Use `32px` (`h-8`) compact buttons, `8px` bar padding,
  `surface-sunken` canvas wells, and `border-border-control` outlines on
  `/tools/*` routes.
- Bind section rules to `var(--section-rule)`, photo tilt to
  `var(--photo-tilt)`, and hero word emphasis to `.squiggle`.
- On `/projects/`, style technology stack chips with neutral `tag` and
  use at most one `tag-accent` badge per project for its headline
  metric. Never commit placeholder strings such as `$X00M+` or `$XM+`.

## Home Hero (`NycHero.astro` and `NycBackground/`)

- Keep `season="auto"` holiday windows (`stPatricks`, `easter`,
  `july4th`, `halloween`, `diwali`, `thanksgiving`, `christmas`) active
  from 4 days before through 3 days after each holiday (`[-4, +3]`
  calendar days).
- Keep manual season selection hidden inside `SeasonSpinner.tsx` (opened
  only by clicking the Empire State Building). Do not add a visible
  season selector bar to `<header>`.
- Preserve hero pointer-event stacking so the Empire State trigger stays
  clickable:
  - `#nyc-hero-bg-layer`: `pointer-events-none absolute inset-0` (no
    `z-0` stacking context).
  - Skyline `<canvas>` and scene `<svg>`: `z-0`.
  - Hero text container: `z-10 pointer-events-none` with
    `w-fit pointer-events-auto` on text children.
  - Empire State `<button>` trigger: `z-20 pointer-events-auto`.
  - Hero CTA wrapper: `z-30 pointer-events-auto`.
  - Portaled `SeasonSpinner` dialog: `z-150`.
- Re-tint skyline ink, SVG strokes, and paper-mask fills from
  `THEME_INK_PALETTES` across all six theme-and-mode combinations.
- Maintain strict three-layer SVG depth ordering in `systems.tsx`:
  `city-and-waterfront` (back), `sky-and-aerial` (mid), and
  `harbor-forefront` (front, sorted ascending by hull-bottom
  `waterlineY` with opaque `var(--background)` silhouette backing).
- Honor `prefers-reduced-motion: reduce` across CSS transitions,
  `.nyc-ink-path` animations, and the `requestAnimationFrame` loop.

## Tools, Accessibility, SEO, and Print

- List all six browser tools (`contrast`, `diff`, `paint`, `pomodoro`,
  `scratchpad`, `svg-editor`) on `/tools/` in a 3×2 grid.
- Keep all `/tools/*` apps 100% client-side with zero network telemetry.
  Degrade cleanly to in-memory session state when `localStorage` or
  notifications are unavailable.
- Render exactly one `<h1>` per route (including `/tools/scratchpad/`),
  preserve `:focus-visible` rings (`2px solid var(--primary)`, `2px`
  offset), and provide programmatic labels for all inputs and icon
  buttons.
- Keep canonical URL `https://www.miraj.dev` synchronized across
  `astro.config.mjs`, `src/data/site.ts`, `public/robots.txt`, and
  JSON-LD (`Person`, `WebSite`, `BlogPosting`). Omit `email` from
  `Person` JSON-LD when no public address exists.
- Keep `public/.nojekyll` in place so GitHub Pages serves `/_astro/*`
  assets.
- In `@media print`, force `#FFFFFF` paper and `#000000` ink, hide
  navigation and toolbars, wrap `<pre>` blocks without clipping, and
  scope scratchpad visibility isolation to `body:has(.scratchpad-shell)`
  so `/resume/` prints normally.
