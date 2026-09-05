---
title: "I Put My Design System in a DESIGN.md"
description: "I started documenting the design system for my portfolio as a DESIGN.md file. It turned out to be more useful than I expected."
publishDate: 2026-09-05
tags: ["design-systems", "frontend", "architecture"]
---

---

I have a design system for this website.

Not a component library. Not a Figma file. A Markdown file.

It's called `DESIGN.md`.

Google recently open-sourced the specification for `DESIGN.md`, a format for describing a visual identity in a way that both humans and coding agents can understand. It combines machine-readable design tokens with Markdown that explains the reasoning behind them.

That last part is what I find interesting.

### Meet Crisp Forest

My design system is called **Crisp Forest**, which is admittedly a much better name than `portfolio-v3-final`.

The goal is pretty simple: make the site feel like a technical publication rather than a SaaS landing page.

So the system defines things like:

- warm paper instead of pure white
- deep teal as the primary color
- coral as a restrained accent
- Bricolage Grotesque for headings
- Inter for everything else
- JetBrains Mono for code and technical metadata
- generous whitespace and roughly 72 characters for long-form reading
- borders and surfaces before shadows
- animation only when it actually adds something

It also documents the less glamorous stuff: keyboard navigation, focus states, reduced motion, image optimization, dark mode, print behavior, SEO, and performance.

### Why not just use Figma?

Figma is great at showing what something **looks like**. That's its superpower.

A Figma file can give an engineer measurements, variables, component states, assets, annotations, and even generated code through Dev Mode.

But a Figma file is still fundamentally a visual workspace.

`DESIGN.md` is a specification.

It's plain text, so it can live directly beside the code, go through Git, be diffed in a pull request, linted, and consumed by tools without needing someone to interpret a canvas. Google's tooling can even validate token references and contrast, compare versions, and export the tokens to formats like Tailwind and the W3C Design Token format.

More importantly, it can describe **why** something exists.

```yaml
colors:
  primary: "#0f6e5c"

typography:
  display:
    fontFamily: '"Bricolage Grotesque", "Inter", sans-serif'

spacing:
  md: 16px
```

The YAML tells you what the values are. The Markdown tells you what they mean.

Teal isn't just `#0f6e5c`; it's the primary interaction color. Coral is for secondary emphasis. Cards should have a semantic purpose. Don't invent another spacing value because 18px "looks about right."

That's information a screenshot can't really capture.

And this becomes more interesting as coding agents become part of the development workflow. Instead of asking an agent to infer the design system from screenshots, CSS, or a Figma canvas, I can give it an explicit source of truth. Google describes this as giving agents a persistent, structured understanding of a design system.

I'm not getting rid of Figma. For visual exploration, prototyping, and communicating a design, I'd still reach for it.

But for this site, `DESIGN.md` is a better **contract** between the design intent and the implementation.

It's a living document, versioned alongside the code.

The browser gets CSS. The engineers get documentation. And the robots get `DESIGN.md`.

Honestly, that feels about right.
