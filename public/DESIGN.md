---
version: "2.0"
name: "Crisp Forest"
themeId: "crisp-forest"
defaultTheme: "crisp-forest"
defaultMode: "system"
description: "Warm editorial design system for miraj.dev with Crisp Forest as the default theme and Swiss Drafting and Press & Darkroom as user-selectable themes."
colors:
  status-success: "#15803D"
  on-status-success: "#FFFFFF"
  status-warning: "#B45309"
  on-status-warning: "#FFFFFF"
  status-error: "#B91C1C"
  on-status-error: "#FFFFFF"
  light:
    background: "#FAF9F5"
    surface: "#F0EEE6"
    surface-hover: "#E6E2D6"
    surface-sunken: "#E8E5DA"
    foreground: "#182220"
    foreground-muted: "#4E5B58"
    border-subtle: "#DCD5C7"
    border-control: "#737067"
    primary: "#0D6B58"
    primary-hover: "#095243"
    on-primary: "#FFFFFF"
    primary-soft: "#E3F2EE"
    on-primary-soft: "#083D32"
    accent: "#B34125"
    accent-hover: "#96341C"
    on-accent: "#FFFFFF"
    accent-soft: "#F7DFD6"
    on-accent-soft: "#7A2814"
  dark:
    background: "#111716"
    surface: "#192220"
    surface-hover: "#222E2B"
    surface-sunken: "#0C1110"
    foreground: "#F2F0E8"
    foreground-muted: "#9BA8A4"
    border-subtle: "#283431"
    border-control: "#6D7E7A"
    primary: "#47C4A5"
    primary-hover: "#63D2B6"
    on-primary: "#06231C"
    primary-soft: "#13352D"
    on-primary-soft: "#A8EBD9"
    accent: "#EB8468"
    accent-hover: "#F29B83"
    on-accent: "#290C05"
    accent-soft: "#381B14"
    on-accent-soft: "#FAD0C4"
typography:
  display:
    fontFamily: "Bricolage Grotesque"
    fontSize: 56px
    fontWeight: 700
    lineHeight: 60px
    letterSpacing: -0.025em
  display-mobile:
    fontFamily: "Bricolage Grotesque"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 46px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: "Bricolage Grotesque"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: "Bricolage Grotesque"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: "Bricolage Grotesque"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 30px
    letterSpacing: -0.01em
  title-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 30px
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  label-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  label-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.02em
  code:
    fontFamily: "JetBrains Mono"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  code-sm:
    fontFamily: "JetBrains Mono"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 18px
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  int-xs: 4px
  int-sm: 8px
  int-md: 12px
  int-lg: 16px
  int-xl: 24px
  ext-sm: 32px
  ext-md: 48px
  ext-lg: 64px
  ext-xl: 96px
  ext-2xl: 128px
  control-default: 44px
  control-compact: 32px
  content-sm: 640px
  content-md: 768px
  content-lg: 1024px
  content-xl: 1280px
  content-2xl: 1440px
motion:
  control-hover:
    duration: 150ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 240ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 160ms
    delay: 0ms
    timingFunction: cubic-bezier(0.4, 0, 1, 1)
components:
  button-primary:
    backgroundColor: "{colors.light.primary}"
    textColor: "{colors.light.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-md}"
    height: "{spacing.control-default}"
  button-primary-hover:
    backgroundColor: "{colors.light.primary-hover}"
    textColor: "{colors.light.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.light.surface}"
    textColor: "{colors.light.foreground}"
    borderColor: "{colors.light.border-control}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-md}"
    height: "{spacing.control-default}"
  button-accent:
    backgroundColor: "{colors.light.accent}"
    textColor: "{colors.light.on-accent}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-md}"
    height: "{spacing.control-default}"
  button-studio-compact:
    backgroundColor: "{colors.light.surface}"
    textColor: "{colors.light.foreground}"
    borderColor: "{colors.light.border-control}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.int-sm}"
    height: "{spacing.control-compact}"
  card:
    backgroundColor: "{colors.light.surface}"
    textColor: "{colors.light.foreground}"
    borderColor: "{colors.light.border-subtle}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.int-xl}"
  input:
    backgroundColor: "{colors.light.background}"
    textColor: "{colors.light.foreground}"
    borderColor: "{colors.light.border-control}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-md}"
    height: "{spacing.control-default}"
  callout-primary:
    backgroundColor: "{colors.light.primary-soft}"
    textColor: "{colors.light.on-primary-soft}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-xl}"
  callout-accent:
    backgroundColor: "{colors.light.accent-soft}"
    textColor: "{colors.light.on-accent-soft}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-xl}"
  tag:
    backgroundColor: "{colors.light.surface}"
    textColor: "{colors.light.foreground}"
    borderColor: "{colors.light.border-subtle}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.int-xs}"
  tag-accent:
    backgroundColor: "{colors.light.accent-soft}"
    textColor: "{colors.light.on-accent-soft}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.int-xs}"
  skip-link:
    backgroundColor: "{colors.light.primary}"
    textColor: "{colors.light.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.int-md}"
themes:
  crisp-forest:
    name: "Crisp Forest"
    subtitle: "Field Monograph (Default)"
    dials: { energy: 2, rhythm: 2, motion: 1 }
    fonts:
      display: "Bricolage Grotesque"
      sans: "Plus Jakarta Sans"
      mono: "JetBrains Mono"
    radii: { sm: 6px, md: 10px, lg: 14px, pill: 9999px }
    motif: { heroAccent: "squiggle", photoTilt: "-1.5deg", sectionRule: "1px solid var(--border-subtle)" }
    colors:
      light:
        background: "#FAF9F5"
        surface: "#F0EEE6"
        surface-hover: "#E6E2D6"
        surface-sunken: "#E8E5DA"
        foreground: "#182220"
        foreground-muted: "#4E5B58"
        border-subtle: "#DCD5C7"
        border-control: "#737067"
        primary: "#0D6B58"
        primary-hover: "#095243"
        on-primary: "#FFFFFF"
        primary-soft: "#E3F2EE"
        on-primary-soft: "#083D32"
        accent: "#B34125"
        accent-hover: "#96341C"
        on-accent: "#FFFFFF"
        accent-soft: "#F7DFD6"
        on-accent-soft: "#7A2814"
      dark:
        background: "#111716"
        surface: "#192220"
        surface-hover: "#222E2B"
        surface-sunken: "#0C1110"
        foreground: "#F2F0E8"
        foreground-muted: "#9BA8A4"
        border-subtle: "#283431"
        border-control: "#6D7E7A"
        primary: "#47C4A5"
        primary-hover: "#63D2B6"
        on-primary: "#06231C"
        primary-soft: "#13352D"
        on-primary-soft: "#A8EBD9"
        accent: "#EB8468"
        accent-hover: "#F29B83"
        on-accent: "#290C05"
        accent-soft: "#381B14"
        on-accent-soft: "#FAD0C4"
  swiss-drafting:
    name: "Swiss Drafting"
    subtitle: "Architectural Blueprint"
    dials: { energy: 2, rhythm: 3, motion: 1 }
    fonts:
      display: "Space Grotesk"
      sans: "Public Sans"
      mono: "Azeret Mono"
    radii: { sm: 2px, md: 4px, lg: 4px, pill: 4px }
    motif: { heroAccent: "index-bracket", photoTilt: "0deg", sectionRule: "1px solid var(--border-control)" }
    colors:
      light:
        background: "#F5F6F8"
        surface: "#ECEEF2"
        surface-hover: "#E0E4EB"
        surface-sunken: "#E3E6EC"
        foreground: "#11161F"
        foreground-muted: "#4A5362"
        border-subtle: "#CFD5DF"
        border-control: "#687282"
        primary: "#1849A9"
        primary-hover: "#123885"
        on-primary: "#FFFFFF"
        primary-soft: "#E0EAFF"
        on-primary-soft: "#102A63"
        accent: "#C4321A"
        accent-hover: "#A32712"
        on-accent: "#FFFFFF"
        accent-soft: "#FCE4DF"
        on-accent-soft: "#7D1D0D"
      dark:
        background: "#0E1218"
        surface: "#151B24"
        surface-hover: "#1E2633"
        surface-sunken: "#090C10"
        foreground: "#EDF0F5"
        foreground-muted: "#96A1B3"
        border-subtle: "#252E3D"
        border-control: "#6B788D"
        primary: "#7EB2FF"
        primary-hover: "#9EC5FF"
        on-primary: "#081730"
        primary-soft: "#13294B"
        on-primary-soft: "#CFE2FF"
        accent: "#FF8B73"
        accent-hover: "#FFA38F"
        on-accent: "#2B0903"
        accent-soft: "#3B1610"
        on-accent-soft: "#FFD2C9"
  press-darkroom:
    name: "Press & Darkroom"
    subtitle: "Editorial Broadsheet"
    dials: { energy: 2, rhythm: 2, motion: 1 }
    fonts:
      display: "Newsreader"
      sans: "Plus Jakarta Sans"
      mono: "JetBrains Mono"
    radii: { sm: 2px, md: 6px, lg: 6px, pill: 9999px }
    motif: { heroAccent: "italic-stress", photoTilt: "0deg", sectionRule: "3px double var(--foreground)" }
    colors:
      light:
        background: "#FCFBF8"
        surface: "#F3F0EA"
        surface-hover: "#E8E3DA"
        surface-sunken: "#ECE8E0"
        foreground: "#161514"
        foreground-muted: "#57524E"
        border-subtle: "#D8D2C7"
        border-control: "#756E66"
        primary: "#8E1B2C"
        primary-hover: "#6E1321"
        on-primary: "#FFFFFF"
        primary-soft: "#FAE5E8"
        on-primary-soft: "#590E1A"
        accent: "#1D4E6B"
        accent-hover: "#153A50"
        on-accent: "#FFFFFF"
        accent-soft: "#E1EEF5"
        on-accent-soft: "#103145"
      dark:
        background: "#131214"
        surface: "#1C1A1E"
        surface-hover: "#262329"
        surface-sunken: "#0D0C0E"
        foreground: "#F4F1EC"
        foreground-muted: "#A8A19B"
        border-subtle: "#2E2A32"
        border-control: "#7D7582"
        primary: "#F2949F"
        primary-hover: "#F7ADB6"
        on-primary: "#29070C"
        primary-soft: "#3D141B"
        on-primary-soft: "#FCD6DB"
        accent: "#7CC2E8"
        accent-hover: "#9AD1F0"
        on-accent: "#07202E"
        accent-soft: "#122E3F"
        on-accent-soft: "#CBE9FA"
---

## Overview

Crisp Forest is the default design system for `miraj.dev`, a software engineering portfolio, technical publication, and six-app browser tool suite.

- **Design Read:** Personal engineering publication and interactive tool workbench for technical peers and hiring leaders, in a warm botanical monograph voice.
- **Calibration Dials:** `ENERGY 2` (Focused) / `RHYTHM 2` (Generous) / `MOTION 1` (Functional).
- **Default Theme:** `crisp-forest` (warm alabaster paper, pine teal, vermilion accents, Bricolage Grotesque + Plus Jakarta Sans + JetBrains Mono).
- **Alternate User-Selectable Themes:** `swiss-drafting` (architectural vellum, cobalt, Space Grotesk + Public Sans + Azeret Mono) and `press-darkroom` (cotton newsprint, claret ink, Newsreader + Plus Jakarta Sans).

## Colors

Semantic color roles form the public API of the design system. Components bind semantic roles rather than raw hex literals.

| Semantic Token | Default Light (`crisp-forest`) | Default Dark (`crisp-forest`) | Role |
| :--- | :--- | :--- | :--- |
| `background` | `#FAF9F5` | `#111716` | Page canvas |
| `surface` | `#F0EEE6` | `#192220` | Cards, code blocks, secondary containers |
| `surface-hover` | `#E6E2D6` | `#222E2B` | Interactive surface hover state |
| `surface-sunken` | `#E8E5DA` | `#0C1110` | Studio canvas wells and recessed tool trays |
| `foreground` | `#182220` | `#F2F0E8` | Primary text (`15.47:1` light / `15.89:1` dark) |
| `foreground-muted` | `#4E5B58` | `#9BA8A4` | Secondary metadata (`5.62:1`+ on sunken wells) |
| `border-subtle` | `#DCD5C7` | `#283431` | Hairline section and card dividers |
| `border-control` | `#737067` | `#6D7E7A` | Form inputs, sliders, toolbars (`>= 3.81:1` SC 1.4.11) |
| `primary` | `#0D6B58` | `#47C4A5` | Primary actions, active indicators, focus rings |
| `on-primary` | `#FFFFFF` | `#06231C` | Text on primary buttons (`6.44:1` light / `7.67:1` dark) |
| `primary-soft` | `#E3F2EE` | `#13352D` | Soft primary callout and badge fill |
| `on-primary-soft` | `#083D32` | `#A8EBD9` | Text on soft primary surfaces (`>= 9.87:1`) |
| `accent` | `#B34125` | `#EB8468` | Editorial highlights and featured metric badges |
| `on-accent` | `#FFFFFF` | `#290C05` | Text on filled accent controls (`>= 5.68:1`) |
| `accent-soft` | `#F7DFD6` | `#381B14` | Soft accent callout and badge fill |
| `on-accent-soft` | `#7A2814` | `#FAD0C4` | Text on soft accent surfaces (`>= 7.70:1`) |

Never bind hardcoded `{colors.white}` onto `button-primary`, `button-accent`, or `.skip-link`. Always pair `primary` with `on-primary` and `accent` with `on-accent` so dark mode passes WCAG 2.2 AA.

## Typography

Each theme defines a 3-font triad mapped to `--font-display`, `--font-sans`, and `--font-mono`:

1. **Crisp Forest (Default):** `Bricolage Grotesque` (display), `Plus Jakarta Sans` (body and UI), and `JetBrains Mono` (code and tabular metrics).
2. **Swiss Drafting:** `Space Grotesk` (display), `Public Sans` (body and UI), and `Azeret Mono` (coordinates and code).
3. **Press & Darkroom:** `Newsreader` (optical-size `6..72` editorial display), `Plus Jakarta Sans` (body and UI), and `JetBrains Mono` (code).

Rules:

- Every heading token above `32px` (`display`, `headline-lg`) pairs with a `<level>-mobile` token (`<= 32px`).
- Apply `font-variant-numeric: tabular-nums` to all dates, reading times, counters, sliders, and coordinate readouts.
- Keep `/tools/*` control bars in `--font-sans` and `--font-mono` across all three themes.

## Layout & Spacing

Spacing separates internal component padding (`int-*`: `4, 8, 12, 16, 24px`) from external section cadence (`ext-*`: `32, 48, 64, 96, 128px`).

`miraj.dev` uses two layout density modes:

1. **Editorial Mode (`/`, `/about/`, `/blog/*`, `/projects/`, `/resume/`, `/colophon/`, `/photos/`):** Uses `44px` (`control-default`) touch targets, `65ch–72ch` prose measure, and `ext-lg` (`64px`) section rhythm.
2. **Studio Workspace Mode (`/tools/*`):** Uses `32px` (`control-compact`) toolbar buttons, `int-sm` (`8px`) bar padding, `surface-sunken` canvas wells, and `border-control` outlines.

## Elevation & Depth

Differentiate surfaces through background luminance steps (`background` -> `surface` -> `surface-sunken`) and `1px` borders before adding drop shadows. Reserve shadows for floating menus and `<dialog id="cmdk-dialog">`.

## Shapes

Corner geometry adapts per theme through CSS custom properties (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`):

- **Crisp Forest (Default):** `6px` compact controls, `10px` standard controls, `14px` cards, `9999px` tags.
- **Swiss Drafting:** `2px` compact controls, `4px` cards and tags, exposed `1px` shared grid borders.
- **Press & Darkroom:** `2px` tags, `6px` controls, zero-box editorial sections separated by `3px + 1px` masthead rules.

## Components

- **Navigation & Theme Switcher:** Expose primary routes, `#cmdk-trigger` (`⌘K`), and the `[Theme ▾ | ☀/☾]` switcher in `<header>`.
- **Buttons:** Bind primary CTAs to `bg-primary text-on-primary` (`height: 44px` in editorial views, `32px` in `/tools/*` toolbars).
- **Project Rows:** Lead with project title, verified outcome metric, architecture summary, and a destination link. Use neutral `tag` chips for technology stacks and at most one `tag-accent` badge per project for the headline metric.
- **Photos:** Bind frame rotation to `var(--photo-tilt)` (`-1.5deg` in Crisp Forest, `0deg` contact sheets in Swiss Drafting, `0deg` archival mounts in Press & Darkroom).

## Do's and Don'ts

### Do

- Do keep `crisp-forest` as the default theme and lazy-load alternate theme fonts only when selected.
- Do pair every `primary` and `accent` fill with `on-primary` and `on-accent`.
- Do use `border-control` (`>= 3.0:1`) on inputs, sliders, color wells, and segmented buttons.
- Do keep all six browser tools listed on `/tools/` in a balanced 3x2 grid.

### Don't

- Don't hardcode `text-white`, `bg-teal-50`, `bg-gray-900`, or `text-red-600` in Astro templates or React islands.
- Don't style every technology tag on `/projects/` with `tag-accent`.
- Don't render multiple `<h1>` elements on `/tools/scratchpad/`.
- Don't display literal `$X00M+` or `$XM+` redaction strings in production cards.

## Interaction & Motion

Keep motion functional (`150ms–240ms`, `cubic-bezier(0.2, 0, 0, 1)`). Honor `prefers-reduced-motion: reduce` across all CSS transitions and `<NycHero>` SVG line-drawing animations.

## Accessibility

Target WCAG 2.2 AA across all 6 theme-and-mode combinations (`>= 4.5:1` normal text, `>= 3.0:1` large text and UI controls, `:focus-visible` `2px` primary outline with `2px` offset, and programmatic form labels).

## Performance

Preload only Crisp Forest `.woff2` fonts in `<head>`. Inject `<link rel="stylesheet">` tags for `swiss-drafting` or `press-darkroom` fonts on demand when the user opens the theme menu or selects an alternate theme.

## SEO & Content

Provide unique titles, canonical URLs, Open Graph tags, and valid `Person`, `WebSite`, and `BlogPosting` JSON-LD on indexable routes. Omit `email` from `Person` JSON-LD when the site defines no public address, and set `"url": "https://www.miraj.dev"`.

## Theme Implementation

Control theme identity and light/dark polarity through two orthogonal attributes on `<html>`:

```html
<html lang="en" data-theme="crisp-forest" data-mode="light">
```

1. **`data-theme`:** `"crisp-forest"` (default) | `"swiss-drafting"` | `"press-darkroom"`. Stored in `localStorage.getItem("miraj_theme")`.
2. **`data-mode`:** `"light"` | `"dark"`. Stored in `localStorage.getItem("miraj_mode")` with `"system"` fallback via `prefers-color-scheme`.
3. **Custom Event:** Dispatch `window.dispatchEvent(new CustomEvent("miraj:themechange", { detail: { theme, mode } }))` on every toggle so `/tools/contrast`, `/tools/paint`, and Shiki syntax blocks update immediately.

## Print & PDF

Reset print output (`@media print`) to white paper (`#FFFFFF`), dark text (`#000000`), hidden navigation/toolbars, and unclipped code blocks on `/resume/` and `/tools/scratchpad/`.
