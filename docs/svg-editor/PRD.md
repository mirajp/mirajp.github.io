# SVG Editor: Product Requirements Document

**Status:** Draft v1 | **Platform:** Web (desktop first, tablet usable)

## 1. Summary

A browser-based SVG editor. Users upload an SVG, edit it visually, compare the result against the original side by side, and export. All processing runs client-side; files never leave the user's machine.

## 2. Problem

Small SVG fixes (recolor a logo, crop whitespace, resize for a layout, fix a broken viewBox) currently require a full vector suite or hand-editing XML. Lightweight tools handle one task each and break on real-world files from Illustrator, Figma, and Inkscape because of CSS classes, inherited fills, and odd units.

## 3. Goals and non-goals

**Goals**

- Make the common edits fast and correct on real-world files.
- Show exactly what changed via a synced before/after view.
- Export clean, valid SVG, optionally optimized.

**Non-goals (v1)**

- Drawing new shapes from scratch, bezier point editing, animation (SMIL/CSS), accounts, cloud storage, collaboration.

## 4. Users

| Persona            | Need                                                 |
| ------------------ | ---------------------------------------------------- |
| Frontend developer | Recolor icons, fix viewBox, shrink file size         |
| Designer           | Quick crop and resize without opening a design suite |
| Content/marketing  | Swap brand colors on supplied assets                 |

## 5. Functional requirements

Priority: **P0** ships in v1, **P1** fast follow, **P2** later.

### Upload and parsing

- P0: Upload via picker, drag and drop, or paste of SVG source. Reject non-SVG and files over a configurable limit (default 10 MB).
- P0: Sanitize on load (scripts, event handlers, `foreignObject`, external references removed) and tell the user what was stripped.
- P0: Clear errors for malformed XML.

### Canvas and compare

- P0: Two panes: Original (read-only) and Edited.
- P0: Zoom (wheel at cursor, buttons, fit, 100%) and pan (drag, space+drag). Panes are linked by default, with an unlink toggle.
- P1: Swipe-divider comparison mode.
- P1: Transparency checkerboard and background color toggle.

### Document sizing

- P0: Edit root `width` and `height` with unit support (px, pt, mm, cm, in, %, unitless). Aspect ratio lock. If width/height are absent, derive from the viewBox.
- P0: Edit `viewBox` through numeric fields and by dragging a rectangle on the canvas. Edit `preserveAspectRatio` with a plain-language explanation.
- P0: Crop tool: draw a rectangle, and the viewBox is updated. Label this "Crop (visible area)".
- P2: "Crop and remove hidden geometry" (destructive clipping).

### Color

- P0: Palette panel listing every distinct fill and stroke, including those from attributes, inline styles, and `<style>` classes, with usage counts.
- P0: Changing a palette swatch updates all elements that use it.
- P0: Color picker with hex, RGB, HSL, and alpha. Support `none` and `currentColor`.
- P1: Gradient stop editing. P1: Replace color with tolerance (merge near-duplicates).

### Element editing

- P0: Click to select, shift-click for multi-select. Selection outline and bounding box.
- P0: Layer tree panel with select, hover highlight, hide/show, rename, and reorder.
- P0: Inspector for the selection: fill, stroke, stroke width, opacity, transform (translate, scale, rotate), and ID.
- P1: Move, scale, rotate with on-canvas handles. P1: Group and ungroup. P1: Delete and duplicate.
- P2: Path point editing.

### History

- P0: Undo and redo (keyboard shortcuts included), unlimited within a session. P0: Reset to original.

### Export

- P0: Download SVG. P0: Copy SVG source.
- P1: Optimization (SVGO) with a live before/after byte count. P1: PNG export at chosen scale.
- P1: Code view with two-way sync.

## 6. Non-functional requirements

- **Performance:** a 2 MB, 5,000-element file loads and stays interactive (pan/zoom at 60 fps, edit latency under 100 ms). 50,000 elements degrades gracefully.
- **Security:** no uploaded script ever executes. No network requests triggered by uploaded content.
- **Privacy:** no upload to a server. No file contents in analytics.
- **Accessibility:** keyboard operable panels, visible focus, labeled controls, WCAG AA contrast in the UI.
- **Browsers:** current Chrome, Firefox, Safari, Edge.
- **Fidelity:** export of an unedited file renders identically to the original.

## 7. Edge cases that must be handled

CSS-class fills, inherited fills from `<g>`, `currentColor`, CSS variables, `<use>` references, nested `<svg>`, missing or percentage dimensions, missing viewBox, embedded raster images, embedded fonts and text, clipPath and mask content, and non-UTF-8 or BOM-prefixed files.

## 8. Success metrics

- 90% of test-corpus files (see TDD) load with no visible rendering difference from a reference renderer.
- Median time from upload to first export under 60 seconds in usability testing.
- Fewer than 1% of sessions end in an error state.
- Round-trip fidelity: zero pixel diffs on unedited export across the corpus.

## 9. Milestones

1. **M1:** parse, sanitize, side-by-side with synced zoom, export.
2. **M2:** sizing, viewBox, crop.
3. **M3:** palette and color resolution, selection, inspector, layer tree.
4. **M4:** undo/redo hardening, accessibility, performance pass. Ship v1.
5. **M5:** P1 items.

## 10. Open questions

- Should "crop" default to viewBox-only, with destructive clip as an explicit second option?
- Do we need text-to-outline for fonts, and if so is a client-side font library acceptable?
- Is a shareable link (state in URL) in scope, given the no-upload stance?
- Free tool or gated features?
