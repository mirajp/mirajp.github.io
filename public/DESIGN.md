---
version: 1.0
name: Crisp Forest
description: A warm editorial design system for a fast, accessible, technical portfolio and blog.
colors:
  background: "#faf9f6"
  surface: "#f0eee7"
  surface-hover: "#e8e4d8"
  foreground: "#1c2624"
  foreground-muted: "#576360"
  border: "#dcd5c8"
  primary: "#0f6e5c"
  primary-hover: "#0b5645"
  primary-soft: "#e6f3f0"
  primary-dark: "#000000"
  accent: "#c14e32"
  accent-hover: "#a83e27"
  accent-soft: "#f6dcd2"
  accent-soft-text: "#8a3620"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
  white: "#ffffff"
typography:
  display:
    fontFamily: '"Bricolage Grotesque", "Inter", ui-sans-serif, sans-serif'
    fontSize: 60px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: '"Bricolage Grotesque", "Inter", ui-sans-serif, sans-serif'
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.01em
  headline-md:
    fontFamily: '"Bricolage Grotesque", "Inter", ui-sans-serif, sans-serif'
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: '"Bricolage Grotesque", "Inter", ui-sans-serif, sans-serif'
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  body-lg:
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  label-sm:
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif'
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
  code:
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace'
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.6
  code-sm:
    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace'
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.5
rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md-sm: 12px
  md: 16px
  lg-sm: 20px
  lg: 24px
  xl-sm: 32px
  xl: 40px
  2xl: 48px
  3xl: 64px
  4xl: 80px
  5xl: 96px
  6xl: 128px
  content-sm: 640px
  content-md: 768px
  content-lg: 1024px
  content-xl: 1280px
  content-2xl: 1440px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md-sm}"
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
  button-primary-disabled:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.foreground-muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: 44px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md-sm}"
    height: 44px
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md-sm}"
    height: 44px
  button-accent-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
  link:
    textColor: "{colors.primary}"
    typography: "{typography.body-md}"
  link-hover:
    textColor: "{colors.primary-dark}"
    typography: "{typography.body-md}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-hover:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md-sm}"
    height: 44px
  input-placeholder:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground-muted}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
  divider:
    backgroundColor: "{colors.border}"
    height: 1px
  code-inline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.sm}"
    padding: "{spacing.xs}"
  code-block:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  blockquote:
    textColor: "{colors.foreground-muted}"
    typography: "{typography.body-lg}"
    padding: "{spacing.md}"
  callout-primary:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-dark}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  callout-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-soft-text}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  status-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.primary-dark}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  status-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.primary-dark}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  status-error:
    backgroundColor: "{colors.error}"
    textColor: "{colors.primary-dark}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  tag-accent:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-soft-text}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs}"
  skip-link:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.md-sm}"
---

# Overview

Crisp Forest is a framework-agnostic design system for a personal software-engineering portfolio and technical blog. It is designed to communicate technical credibility without feeling sterile or corporate.

The visual direction is **Editorial Teal**: warm paper neutrals, deep pine and teal, restrained coral accents, strong typographic hierarchy, and small human imperfections used selectively. The system should feel authored rather than generated.

Crisp Forest is optimized for:

- **Content first:** Content → Interaction → Visual Design → Animation.
- **Technical credibility:** Clear, deliberate, engineered, trustworthy.
- **Fast by default:** Prefer static HTML, minimal JavaScript, optimized images, and platform-native browser behavior.
- **Long-form readability:** Comfortable measure, generous line height, clear hierarchy, and restrained decoration.
- **Accessibility:** Target WCAG 2.2 AA, with keyboard access, visible focus, sufficient contrast, semantic HTML, and reduced-motion support.
- **Maintainability:** Primitive values map to semantic roles, and components consume semantic tokens rather than raw values.
- **Restraint:** Personality comes from typography, color, photography, and small editorial details—not from visual noise.

## Design language

The design should feel like a thoughtfully made technical publication rather than a SaaS dashboard.

Use:

- Warm, slightly off-white paper backgrounds.
- Deep teal/pine for primary actions and links.
- Coral as a secondary accent and editorial highlight.
- Bricolage Grotesque for display typography.
- Inter for body copy and interface text.
- JetBrains Mono for code and technical metadata.
- Cards and surfaces with quiet separation rather than heavy shadows.
- Occasional tilted photos/stickers and hand-drawn accents.
- Dense information only when the content benefits from it.

Avoid:

- Generic blue/violet SaaS gradients.
- Excessive glassmorphism.
- Giant decorative blobs.
- Overuse of rounded cards.
- Animation that competes with content.
- Decorative illustrations that add no information.
- Every section looking like a separate marketing landing page.

# Colors

## Semantic color roles

Semantic colors are the public API of the design system. Components should consume these roles instead of directly selecting primitive palette values.

| Token                       | Value     | Role                             |
| --------------------------- | --------- | -------------------------------- |
| `{colors.background}`       | `#faf9f6` | Page background / warm paper     |
| `{colors.surface}`          | `#f0eee7` | Cards, code, secondary surfaces  |
| `{colors.surface-hover}`    | `#e8e4d8` | Hover and selected surface state |
| `{colors.foreground}`       | `#1c2624` | Primary text                     |
| `{colors.foreground-muted}` | `#576360` | Secondary text, metadata         |
| `{colors.border}`           | `#dcd5c8` | Dividers and boundaries          |
| `{colors.primary}`          | `#0f6e5c` | Primary actions, links, focus    |
| `{colors.primary-hover}`    | `#0b5645` | Primary interactive hover state  |
| `{colors.primary-soft}`     | `#e6f3f0` | Soft teal background             |
| `{colors.primary-dark}`     | `#000000` | High-contrast text on soft teal  |
| `{colors.accent}`           | `#c14e32` | Coral editorial accent           |
| `{colors.accent-hover}`     | `#a83e27` | Coral interactive hover state    |
| `{colors.accent-soft}`      | `#f6dcd2` | Soft coral background            |
| `{colors.accent-soft-text}` | `#8a3620` | Text on soft coral               |
| `{colors.success}`          | `#22c55e` | Success state                    |
| `{colors.warning}`          | `#f59e0b` | Warning state                    |
| `{colors.error}`            | `#ef4444` | Error state                      |
| `{colors.white}`            | `#ffffff` | Text on dark/filled controls     |

The neutral and brand primitives used by the implementation may remain in CSS/Tailwind as implementation tokens. The formal DESIGN.md contract intentionally exposes the semantic palette above rather than requiring every primitive shade to be used by a component.

## Dark mode

Dark mode is a theme mapping of the same semantic roles rather than a separate design system. The implementation uses `[data-theme="dark"]` to remap the semantic CSS variables.

Dark theme values currently map to:

- background: `#121817`
- surface: `#1c2624`
- surface-hover: `#232e2b`
- foreground: `#f3f1ea`
- foreground-muted: `#9aa6a2`
- border: `#2a332f`
- primary: `#3fbf9f`
- primary-hover: `#5ad1b3`
- accent: `#e0785c`
- accent-hover: `#e8917a`

The semantic component contract remains unchanged across themes. Components must not contain separate light/dark markup merely to accommodate color changes.

## Color accessibility

Normal text and controls should meet WCAG 2.2 AA contrast requirements. Do not use muted text for essential information when its contrast becomes insufficient.

Focus indicators use the primary color and must remain visibly distinct from adjacent surfaces.

Selection styling uses a light teal tint in the light theme and a deeper teal tint in dark mode.

# Typography

Crisp Forest uses three typefaces with distinct responsibilities.

### Bricolage Grotesque

Use Bricolage Grotesque for display headings (`h1`–`h4`) and other moments where typography carries editorial personality.

- `display`: 60px / 800 / 1.05
- `headline-lg`: 48px / 700 / 1.10
- `headline-md`: 36px / 700 / 1.20
- `headline-sm`: 30px / 600 / 1.30

Headings use approximately `-0.01em` letter spacing and `text-wrap: balance` where supported.

### Inter

Use Inter for paragraphs, navigation, labels, controls, metadata, and general UI.

- `body-lg`: 18px / 400 / 1.70
- `body-md`: 16px / 400 / 1.70
- `body-sm`: 14px / 400 / 1.50
- `label-md`: 14px / 600 / 1.40
- `label-sm`: 12px / 600 / 1.40

Blog prose may increase body text to 17px with a 1.75 line height for sustained reading.

### JetBrains Mono

Use JetBrains Mono for code, keyboard shortcuts, technical metadata, and small developer-oriented labels.

- `code`: 14px / 400 / 1.60
- `code-sm`: 12px / 500 / 1.50

Do not use monospace for ordinary prose merely to signal that a page is technical.

# Layout & Spacing

## Content widths

| Token                   |  Width | Use                                           |
| ----------------------- | -----: | --------------------------------------------- |
| `{spacing.content-sm}`  |  640px | Narrow content / compact layouts              |
| `{spacing.content-md}`  |  768px | Standard reading and article-adjacent content |
| `{spacing.content-lg}`  | 1024px | Wide content and two-column layouts           |
| `{spacing.content-xl}`  | 1280px | Primary desktop shell                         |
| `{spacing.content-2xl}` | 1440px | Large editorial compositions                  |

Long-form text should generally use a maximum measure of **72ch**. Do not stretch prose simply because the viewport has available space.

## Grid

Use a responsive grid appropriate to the content:

- Mobile: 4 columns.
- Tablet: 8 columns.
- Desktop: 12 columns.

Grid gaps should generally come from the spacing scale rather than arbitrary values.

## Spacing scale

The base spacing scale is:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128px`

Use smaller values for related elements and larger values to establish section hierarchy. Avoid introducing one-off spacing values unless the layout has a documented reason.

## Responsive behavior

Design mobile-first. Prefer fluid layout and natural wrapping over breakpoint-specific hacks.

At smaller widths:

- Reduce heading sizes before reducing readability.
- Preserve comfortable horizontal padding.
- Stack multi-column content when the content order is meaningful.
- Keep controls comfortably tappable.
- Avoid horizontal scrolling except for genuinely wide content such as code.

# Elevation & Depth

Crisp Forest uses depth sparingly. Surfaces should primarily be differentiated through background color and borders.

Available shadows:

- Small: `0 1px 2px rgb(0 0 0 / 0.05)`
- Medium: `0 4px 12px rgb(0 0 0 / 0.08)`
- Large: `0 10px 30px rgb(0 0 0 / 0.12)`

Use:

- Small shadows for subtle controls or floating elements.
- Medium shadows for elevated cards or menus when necessary.
- Large shadows only for prominent overlays or modal-like surfaces.

Do not use shadows as decoration on every card. The editorial aesthetic benefits from quiet surfaces.

# Shapes

Corner radii:

- `none`: 0px
- `sm`: 6px
- `md`: 10px
- `lg`: 16px
- `xl`: 24px
- `full`: 9999px

Use `md` for controls and inputs, `lg` for cards, and `full` for tags/pills.

Rounded corners should reinforce hierarchy. Avoid making every element maximally rounded.

# Components

## Navigation

The primary navigation should expose the site's major destinations without competing with the page content.

Typical destinations:

- Home / logo
- Projects
- Blog
- Resume
- About
- Theme toggle
- GitHub
- LinkedIn

Behavior:

- Use semantic `<nav>` markup.
- Provide a visible current-page state.
- Support keyboard navigation.
- Collapse into a compact mobile navigation when needed.
- Keep the theme toggle available without requiring a settings page.
- Preserve a clear skip link before the main content.

## Buttons

Primary buttons use `{colors.primary}` with `{colors.white}` text. Hover uses `{colors.primary-hover}`.

Secondary buttons use `{colors.surface}` and `{colors.foreground}`.

Coral buttons are reserved for secondary emphasis, invitations, or editorial calls to action; they should not compete with the primary action on every page.

Controls should have at least a 44px target height where practical.

Never communicate disabled state through color alone.

## Links

Links use `{colors.primary}` and should remain visually identifiable in prose through underlining.

Hover/focus may use `{colors.primary-dark}` where contrast remains appropriate.

Do not remove underlines from long-form body links merely for visual cleanliness.

## Cards

Cards use `{colors.surface}` over `{colors.background}` and `{rounded.lg}`.

A card should have a clear semantic purpose: project, article, experience item, photo, callout, or grouped controls.

Avoid nesting cards inside cards unless the hierarchy is genuinely necessary.

## Project cards

A project card should prioritize:

1. Project name.
2. Short description.
3. Evidence of impact.
4. Technology or role metadata.
5. A clear destination or action.

Metrics should be concrete when available. Prefer outcomes over technology lists.

## Blog cards

A blog card may include:

- Cover image or editorial thumbnail.
- Title.
- Short description.
- Tags.
- Publication date.
- Reading time.

The title should remain the strongest visual element.

## Inputs

Inputs use `{colors.background}` with `{colors.foreground}` and `{rounded.md}`.

Placeholder text uses `{colors.foreground-muted}` but should never contain essential information.

Inputs require:

- Visible labels.
- Programmatic label association.
- Clear focus state.
- Useful error messaging.
- Keyboard and screen-reader support.

## Tags

Tags use `{rounded.full}` and compact label typography.

Use neutral tags for taxonomy such as `frontend`, `architecture`, or `career`.

Use the coral tag treatment sparingly for featured or especially relevant metadata.

## Callouts

Use teal callouts for explanatory or positive emphasis and coral callouts for editorial emphasis or caution.

Callouts should not become substitutes for ordinary paragraph hierarchy.

## Status

Success, warning, and error treatments are semantic states rather than decorative colors.

Always pair status color with text or an icon/label so meaning is not dependent on color alone.

## Code

Inline code uses the surface color and JetBrains Mono.

Code blocks:

- Use JetBrains Mono.
- Allow horizontal scrolling for genuinely wide code.
- Preserve syntax highlighting.
- Maintain readable line height.
- Use a visible border when the surrounding surface does not sufficiently distinguish the block.
- Do not make syntax colors the only way to distinguish code semantics.

The implementation uses Shiki with dual light/dark themes.

## Blockquotes

Blockquotes use muted text and a primary-colored leading rule.

Keep blockquotes visually quieter than headings but more distinct than ordinary body text.

## Images and photography

Photography and project imagery should feel editorial rather than overly polished.

Images should:

- Use meaningful `alt` text when informative.
- Use empty `alt` text when purely decorative.
- Be optimized and sized appropriately.
- Avoid layout shift by reserving dimensions.
- Use subtle tilts selectively.

Crisp Forest supports two tilt helpers:

- `tilt-left`: approximately `-2deg`
- `tilt-right`: approximately `1.5deg`

On hover, tilted elements may return to `0deg`.

Never tilt an entire grid of cards. The effect works because it is used sparingly.

## Editorial accents

A hand-drawn coral squiggle may emphasize one or two words per page.

The squiggle is an accent, not a general-purpose underline replacement. Avoid applying it to navigation, every heading, or every link.

# Do's and Don'ts

## Do

- Do lead with content and evidence.
- Do use Bricolage Grotesque to establish personality.
- Do keep body text in Inter.
- Do use teal as the primary interaction color.
- Do use coral as a deliberate secondary accent.
- Do preserve a 72ch-ish reading measure for long-form writing.
- Do use borders and surfaces before reaching for shadows.
- Do respect reduced-motion preferences.
- Do make keyboard focus obvious.
- Do optimize images and avoid unnecessary client-side JavaScript.
- Do use semantic HTML and meaningful landmarks.
- Do let typography, spacing, and content hierarchy carry most of the visual design.
- Do treat dark mode as a semantic theme mapping.

## Don't

- Don't turn every section into a card.
- Don't use gradients as a default background treatment.
- Don't use excessive blur or glass effects.
- Don't use giant decorative graphics behind important content.
- Don't rely on color alone for status, interaction, or meaning.
- Don't use tiny low-contrast metadata for important information.
- Don't animate page content simply because CSS allows it.
- Don't ship avoidable layout shift from images or fonts.
- Don't add a new token when an existing semantic role already describes the intent.
- Don't reference raw primitive colors from components when a semantic token exists.

# Interaction & Motion

Motion is functional and restrained.

Preferred easing:

- Standard: `cubic-bezier(0.2, 0, 0, 1)`
- Decelerate: `cubic-bezier(0, 0, 0.2, 1)`
- Accelerate: `cubic-bezier(0.4, 0, 1, 1)`

Typical durations:

- Fast: ~150ms
- Base: ~250ms
- Slow: ~400ms

Use motion for:

- Hover state transitions.
- Theme changes.
- Opening/closing navigation.
- Focus or selection feedback.
- Small editorial interactions.

Avoid:

- Decorative perpetual animation.
- Large transforms on essential content.
- Motion that delays access to information.

Honor `prefers-reduced-motion: reduce` globally. Reduced motion should remove nonessential animation rather than merely slowing it down.

# Accessibility

Crisp Forest targets WCAG 2.2 AA.

Requirements:

- Use semantic HTML before ARIA.
- Maintain a logical heading hierarchy.
- Provide a skip link.
- Make all interactive controls keyboard accessible.
- Use `:focus-visible` with a 2px primary outline and 2px offset.
- Maintain sufficient contrast for text and meaningful UI.
- Do not rely on color alone.
- Provide accessible names for icon-only controls.
- Ensure touch targets are comfortably sized.
- Respect reduced motion.
- Preserve readable text zoom/reflow.
- Keep form errors associated with their controls.
- Provide meaningful alternative text for informative images.

# Performance

Crisp Forest is optimized for a static-first architecture.

Prefer:

- Astro/SSG output where content permits.
- Minimal client-side JavaScript.
- Native browser APIs over large dependencies.
- Responsive images and modern image formats.
- Explicit image dimensions to reduce layout shift.
- Systematic lazy loading below the fold.
- Preloading only truly critical resources.
- Font loading that avoids prolonged invisible text.
- Browser-native print/PDF behavior where possible.

Avoid:

- Hydrating components that do not need interactivity.
- Large animation libraries for small effects.
- Client-side rendering of content that can be generated at build time.
- Unoptimized full-resolution images.
- Third-party scripts without a clear benefit.

# SEO & Content

Every indexable page should have:

- A unique title.
- A useful meta description.
- A canonical URL.
- Appropriate Open Graph metadata.
- Appropriate social sharing metadata.
- Semantic headings.
- Descriptive links.
- Structured data where appropriate.

Recommended structured data includes:

- `Person` for the portfolio owner.
- `WebSite` for the site.
- `BlogPosting` for articles.
- `BreadcrumbList` where hierarchical navigation exists.

Content should be written for humans first. SEO metadata should clarify the content rather than stuff keywords.

# Theme Implementation

The production implementation uses CSS custom properties and Tailwind CSS v4.

Theme switching is controlled by:

`[data-theme="dark"]`

Tailwind's `dark:` variant is mapped to that attribute rather than `prefers-color-scheme`.

The semantic CSS variables are exposed to Tailwind through `@theme`, including:

- `background`
- `surface`
- `surface-hover`
- `foreground`
- `foreground-muted`
- `border`
- `primary`
- `primary-hover`
- `accent`
- `accent-hover`
- `success`
- `warning`
- `error`

The formal DESIGN.md token contract intentionally remains framework-agnostic even though the current implementation uses Tailwind.

# Print & PDF

The Markdown scratchpad supports browser-native PDF export.

Print output should:

- Use white paper.
- Use dark readable text.
- Hide site chrome and interactive controls.
- Remove theme backgrounds.
- Preserve real selectable text.
- Keep headings with following content where possible.
- Avoid splitting common content blocks across pages.
- Keep images within the printable area.
- Preserve readable code blocks.
- Remove interactive focus styling.

Browser print headers/footers such as title, URL, date, and page numbers are controlled by the browser's print dialog rather than CSS. Users should disable them when a clean document is required.

# Content Patterns

## Hero

A hero should quickly communicate:

1. Who this is.
2. What they build or specialize in.
3. Why the visitor should care.
4. What to do next.

Keep the headline short. Let supporting copy carry nuance.

## Metrics

Metrics should be evidence, not decoration.

Good examples:

- Revenue impact.
- Users reached.
- Conversion or acquisition lift.
- Performance improvements.
- Scope of systems owned.
- Team or project scale.

Use a short label with a strong number or phrase. Avoid presenting arbitrary counts simply because they look impressive.

## Experience timeline

Experience entries should emphasize:

- Role.
- Organization.
- Dates.
- Scope.
- Outcomes.
- Selected technologies where useful.

Lead with what changed because of the work, not an exhaustive task list.

## Article layout

A technical article should generally contain:

- Title.
- Description or deck.
- Publication date.
- Reading time when available.
- Optional tags.
- Optional table of contents.
- Article body.
- Related articles or next steps.

Article prose should use the `.measure` reading width or an equivalent 72ch maximum.

# Engineering Contract

Crisp Forest is a design system specification, not a component implementation. The implementation may use Astro, Tailwind CSS, TypeScript, React islands, or other technologies without changing the visual contract.

When implementing a component:

1. Start from a semantic token.
2. Use the component token when one exists.
3. Preserve accessibility behavior.
4. Preserve responsive behavior.
5. Preserve dark-theme semantic mapping.
6. Avoid introducing arbitrary values.
7. Add a new semantic token only when the intent is genuinely new.
8. Keep JavaScript optional unless the interaction requires it.

The source of truth is:

**Primitive values → semantic tokens → component tokens → implementation.**

A component implementation should never become the source of truth for the design language.
