# SVG Editor: Technical Design Document

**Status:** Draft v1.3.1
**Companion to:** SVG Editor PRD (milestone changes in section 21 require a PRD update)

---

## 1. Overview

A client-side TypeScript application for inspecting and editing SVG files.

The document is parsed into an immutable, normalized model. Edits are pure commands that produce new model versions. The interactive renderer derives and patches an SVG DOM from the model. Serialization is a separate concern used for export and clipboard.

Nothing mutates the source SVG DOM directly.

### Hosting and scope

The editor is a single React component, `<SvgEditor />`, rendered as a client-only island in an Astro site. Astro owns the page, layout, and routing. The editor owns nothing outside its root element.

- No backend, accounts, or network calls. Files are processed in the browser.
- Static output. It works on any static host.
- Proposed public surface, kept deliberately small:

```tsx
interface SvgEditorProps {
  maxFileBytes?: number; // default 10 MB
  initialSvg?: string; // goes through the normal load pipeline
  onExport?: (svg: string, meta: { sanitized: boolean }) => void;
}
```

### Host project

The editor is added to an existing personal site, not a new project.

- Stack already in place: Astro 7 (static output), React 19 with `@astrojs/react`, Tailwind CSS v4 via `@tailwindcss/vite`, and a semantic-variable design system with `[data-theme="dark"]` switching. No new framework is introduced.
- Editor code lives under `src/components/tools/svg-editor/`, with a subfolder per layer in section 2. The page is a tool page that uses the site's existing layout.
- Existing scripts and dependencies are not changed. New tooling (Vitest, Playwright, ESLint, Prettier) is added as dev dependencies and scoped to editor paths only, so existing files are never reformatted.
- The editor must not change how any existing page builds or behaves. M1 includes a build-output comparison for existing pages.
- Deployment is GitHub Pages with a custom domain, so there are no custom response headers (section 15).
- Development happens on Windows with WSL. Visual baselines are generated on Linux so they match CI.

Priorities, in order:

1. **Correctness:** transforms, styles, inheritance, and round-tripping are predictable.
2. **Security:** uploaded SVG is hostile input.
3. **Performance:** editing stays responsive on reasonably large files.
4. **Maintainability:** behavior lives in pure model operations, not UI mutations.

```text
Upload -> Sanitize -> Parse -> Normalize -> DocumentModel
                                               |
                          Commands -> History
                                               |
                  Renderer -> Original pane / Edited pane
                                               |
                       Serializer -> Optimize -> Export
```

The sanitized original source is retained separately.

---

## 2. Architecture

All editor code lives under `src/components/tools/svg-editor/` in the host site, and the layers below are its subfolders.

- **core/**: document model, commands, history, style resolution, unit and transform math. No DOM dependency.
- **io/**: sanitize, parse, normalize, serialize, optimize, export.
- **render/**: model-to-DOM rendering, patching, hit testing, overlays.
- **state/**: framework-free store holding the current document, history, selection, and view transform. Exposes `subscribe` and `getSnapshot` so React can read it with `useSyncExternalStore`.
- **ui/**: React components for chrome (inspector, layer tree, palette, toolbar, dialogs) and the `<SvgEditor />` root, plus the hooks that adapt the store to React.
- **tests/**: unit, property, security, corpus, visual, E2E.

Browser-dependent behavior (`getScreenCTM()`, `getBBox()`, computed CSS, `DOMParser`) sits behind explicit adapters so core runs under plain Node in tests.

Selector matching uses `css-select` with a custom adapter that walks the model, not a DOM. This keeps the style resolver in core.

### Astro integration

- **Hydration mode:** mount with `<SvgEditor client:only="react" />`, not `client:load`. The editor depends on `DOMParser`, DOMPurify, shadow roots, and geometry APIs, none of which exist during Astro's server render. Provide a static placeholder in the `fallback` slot so the page does not shift when the island loads.
- **Bundling:** Astro builds with Vite. The editor and its dependencies (DOMPurify, css-tree, css-select, the persistent map library) load as a lazy chunk, only on pages that use the island. SVGO loads as a separate worker chunk on first optimize, using `new Worker(new URL("./svgo.worker.ts", import.meta.url), { type: "module" })`. M1 sets a gzip size budget from the first measurement and CI reports it.
- **Style scoping:** the chrome is part of the site and should look native. It uses Tailwind v4 utilities with the site's semantic CSS variables and follows the existing `[data-theme="dark"]` switching, with no new global CSS, fonts, or colors. Panes are the exception: they render uploaded SVG inside shadow roots (section 6), which Tailwind and site styles do not reach.
- **Keyboard scoping:** shortcuts are handled by a `keydown` listener on the editor root and only fire when focus is inside it. No document-level listeners except during an active pointer drag, attached on pointerdown and removed on pointerup. The site's own shortcuts keep working outside the editor, notably the CommandPalette shortcut (verify how it is registered in task 0.1), and editor keystrokes must not trigger it while focus is inside the editor.
- **Navigation and cleanup:** unmounting must destroy the renderer, listeners, worker, and Blob URLs. This matters if the site uses Astro view transitions, where islands can be unmounted and remounted. Session state is not persisted, so warn with `beforeunload` when there are unexported edits.
- **Content never passes through Astro templates.** Uploaded SVG goes only through the sanitizer and the renderer.

---

## 3. Document model

```ts
type NodeId = string;

type SvgNode = ElementNode | TextNode | CommentNode | ProcessingInstructionNode;

interface ElementNode {
  kind: "element";
  id: NodeId; // internal, independent of the SVG id attribute
  tag: string;
  attrs: Record<string, string>; // insertion order preserved
  style: Record<string, Decl>; // parsed inline style, with !important flag
  children: NodeId[];
  parent: NodeId | null;
}

interface Decl {
  value: string;
  important: boolean;
}

interface SvgDocument {
  root: NodeId;
  nodes: PersistentMap<NodeId, SvgNode>; // HAMT, not a plain object
  retainedSheets: ParsedSheet[]; // only unflattenable rules, see 4.4
  unsupported: UnsupportedRecord[]; // selectors and constructs we could not model
  version: number;
}
```

### Why a persistent map

Updating a plain `Record` immutably copies every key. At 50,000 nodes that is a multi-millisecond cost per command. A HAMT (for example `immutable`'s `Map`, or an equivalent) makes a one-node update O(log n) and gives real structural sharing for history.

### Source metadata

```ts
interface SourceMetadata {
  originalSource: string; // exactly what was read, after BOM handling
  sanitizedSource: string; // sanitizer output
  originalVersion: number;
  sanitizationReport: SanitizationReport;
}
```

### Internal IDs

`NodeId` is stable across non-structural edits and independent of the SVG `id` attribute, which users and the optimizer may change.

---

## 4. Load pipeline

### 4.1 Read

1. Read as text, strip a UTF-8 BOM, detect encoding where practical.
2. Reject malformed or unsupported input with a user-visible error.
3. Above 5 MB, warn that loading may be slow (see 4.5).

### 4.2 Sanitize

Sanitize before parsing and again before any serialization that leaves the app.

DOMPurify with an SVG-specific configuration. It defaults to HTML parsing, which can mishandle CDATA sections and entity declarations, so **run it in its XML parser mode and verify against the corpus**. If XML mode proves inadequate, sanitize at the parsed-DOM level with an allowlist walker instead.

The sanitizer:

- Removes `script`, `foreignObject`, and event-handler attributes.
- Removes external `href` / `xlink:href`. Allows `#fragment` and the data URLs in section 15.
- Records every removed construct in the sanitization report, shown to the user when non-empty.

CSS and animation have their own passes (section 15).

### 4.3 Parse

```ts
new DOMParser().parseFromString(source, "image/svg+xml");
```

`parsererror` results are surfaced as errors, never as an empty document.

### 4.4 Normalize

Normalization preserves SVG semantics. It does not copy inherited values onto descendants.

1. Parse presentation attributes and inline styles into the node.
2. Parse `<style>` blocks with `css-tree`.
3. **Flatten** rules whose selectors are fully supported: type, class, id, attribute, descendant, child, and combinations. Matching uses the model adapter.
4. **Merge by cascade, not by blind copy.** An existing inline declaration still wins over a flattened normal rule. A flattened `!important` rule beats a non-important inline declaration. An inline `!important` beats everything. Among flattened rules, specificity and source order decide.
5. **Retain** only rules that cannot be flattened (pseudo-classes such as `:hover`, `@media`, `@keyframes`, `@font-face`) in `retainedSheets`, and record them in `unsupported`.
6. Preserve definitions (gradients, clip paths, masks, filters, symbols, markers) and references (`<use>`, `url(#id)`).
7. Preserve comments and processing instructions as model nodes.

Flattening removes most of the ambiguity from `ReplaceColor` for files like Illustrator exports with `.st0` classes, since the declaration source becomes the element.

### 4.5 Threading

`DOMParser` and DOMPurify are not available in workers. In v1, read, sanitize, parse, and normalize run on the main thread behind a progress indicator. Revisit only if profiling shows unacceptable blocking, and then with a worker-safe XML parser and an allowlist sanitizer, not by porting the DOM.

---

## 5. Style resolution

A dedicated subsystem in core.

### Cascade order

Highest precedence first:

| Rank | Source                                                            |
| ---- | ----------------------------------------------------------------- |
| 1    | `!important` in inline `style`                                    |
| 2    | `!important` in stylesheet rules (specificity, then source order) |
| 3    | Normal inline `style`                                             |
| 4    | Normal stylesheet rules (specificity, then source order)          |
| 5    | Presentation attributes                                           |
| 6    | Inherited value (for inherited properties)                        |
| 7    | Initial value                                                     |

Presentation attributes act as author rules with zero specificity placed before all other author CSS, so any stylesheet rule or inline declaration beats them. This table becomes a test table before any resolver code is written.

### API

```ts
interface ResolvedStyle {
  value: string;
  source: "inline" | "stylesheet" | "presentation" | "inherited" | "default";
  important?: boolean;
  declaredOn?: NodeId;     // node that holds the winning declaration
}

resolveStyle(doc: SvgDocument, nodeId: NodeId, property: string): ResolvedStyle;
```

Handles: class, id, and type selectors, specificity (`@csstools/selector-specificity`), `!important`, inheritance, resolvable custom properties, `currentColor`, presentation attributes.

Unsupported selectors or constructs are recorded in `doc.unsupported` and never treated as equivalent to supported ones.

---

## 6. Rendering

Interactive rendering and serialization are separate.

### React boundary

- React renders the chrome and one empty container element per pane. It never renders uploaded SVG as JSX or through `dangerouslySetInnerHTML`.
- The renderer mounts into the container from an effect and destroys itself in the cleanup. Mount and destroy must be idempotent, because React StrictMode and hot reload run effects twice in development.
- Document, history, selection, and `ViewTransform` live in the framework-free store (`state/`). Components read it with `useSyncExternalStore` and narrow selectors. The renderer subscribes to the same store directly, not through React.
- Pointer-rate data never goes through React state. The viewport controller applies `ViewTransform` to the DOM, and the zoom percentage readout updates at most once per animation frame.
- Scrubbable inputs hold local state during interaction and dispatch commands (with `mergeKey`) at a throttled rate.

The renderer keeps a `NodeId -> SVGElement` map. Initial render builds the tree. Later model changes arrive as diffs and become attribute and style updates on existing nodes. Structural changes (insert, delete, reparent, group) rebuild only the affected subtree. Ordinary attribute and style edits never rebuild the document.

### Transient previews

During a pointer drag, the tool calls `renderer.preview(patch)` to update the DOM directly with no model change. On pointerup, the tool dispatches **one** command, and the renderer reconciles to the new model. This avoids creating a document version on every pointermove and removes most of the need for `mergeKey` coalescing.

### Panes

- **Original pane:** renders the sanitized source once. Never touched by commands.
- **Edited pane:** renders the current model.

### Isolation (required)

Each pane renders in its own shadow root.

- Both panes contain the same SVG `id`s. Separate trees stop `url(#grad)` and `clip-path` references from resolving against the other pane.
- Inherited properties such as `color`, `font-*`, `direction`, and `visibility` cross shadow boundaries. Each host sets `:host { all: initial; display: block; }` plus explicit `color` and font defaults, so `currentColor` and text render the same in both panes and never pick up app styles.
- Uploaded CSS is scoped to its shadow root.

---

## 7. Zoom and pan

```ts
interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}
```

Applied to the viewport wrapper, never to document geometry. Panes share one transform by default, and unlinking gives each its own.

Cursor-anchored wheel zoom:

```ts
tx' = cx - (cx - tx) * (s' / s)
ty' = cy - (cy - ty) * (s' / s)
```

Scale is clamped to 2% to 6400%. Zoom and pan never create history entries.

---

## 8. Coordinate handling

All pointer and viewport math goes through one utility.

```ts
function clientToSvg(el: SVGGraphicsElement, x: number, y: number): DOMPoint {
  const m = el.getScreenCTM();
  if (!m) throw new Error("SVG element has no screen CTM");
  return new DOMPoint(x, y).matrixTransform(m.inverse());
}
```

Bounding boxes use `getBBox()` mapped to root space through the cumulative CTM. For transformed groups, evaluate the four transformed corners and take the extent.

Keep four spaces distinct: local, parent, root SVG, and client. No tool does its own conversion.

`parseLength(value, ctx)` supports px, pt, pc, mm, cm, in, `%`, em, ex. Percentages resolve against the applicable SVG context. `em`/`ex` use effective font metrics.

When width or height is missing, use viewBox dimensions. With no viewBox, the app can synthesize one from root content bounds when the user requests a geometry-dependent operation.

---

## 9. Commands and history

All document changes go through commands.

```ts
interface Command {
  id: string;
  label: string;
  apply(doc: SvgDocument): SvgDocument; // pure, never mutates input
  mergeKey?: string; // for non-pointer inputs that fire repeatedly
}
```

### Command set

`SetAttr`, `SetStyle`, `SetStyleRule`, `SetViewBox`, `SetSize`, `Crop`, `ReplaceColor`, `Reparent`, `Delete`, `Duplicate`, `Group`, `Ungroup`, `Transform`.

`SetStyleRule` edits a retained stylesheet rule. It is needed because `ReplaceColor` must handle colors that remain declared in a retained sheet.

### Commands that change inheritance or IDs

| Command     | Required behavior                                                                                                                                                                                                                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Group`     | Wrap nodes in a `<g>`. Preserve paint order. No style change needed unless an ancestor's inherited values would now differ.                                                                                                                                                                                            |
| `Ungroup`   | Bake the group's `transform` into each child (compose matrices), and copy any inherited style the group declared onto each child so appearance is unchanged. Group-level `opacity`, `filter`, `clip-path`, and `mask` cannot be baked per child, so the command refuses and explains why, or offers to keep the group. |
| `Reparent`  | Recompute and apply the compensating transform and any inherited style so the node's rendered appearance is unchanged by default.                                                                                                                                                                                      |
| `Duplicate` | Generate new SVG `id`s for every duplicated node that has one. Rewrite internal references (`url(#...)`, `href="#..."`) that point inside the duplicated subtree. References to nodes outside the subtree are left as they are.                                                                                        |

### History

History holds immutable document references with a pointer. Undo moves the pointer back and redo moves it forward. Storage strategy is not exposed to UI code.

- Default cap: 200 entries, plus a memory budget as a secondary limit.
- `mergeKey` commands within 500 ms collapse into one entry. Intended for slider and color-picker inputs, not pointer drags (see section 6).
- Memory use is instrumented so checkpointing is only considered if measurements demand it.

---

## 10. Color system

```ts
resolveFill(doc, nodeId): { value: string; source: ResolvedStyle["source"] }
```

```ts
collectPalette(doc): Map<string, Set<{ nodeId: NodeId; property: string }>>
```

Colors are normalized consistently. Supported syntax: 3/4/6/8-digit hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, named colors, `currentColor`, resolvable `var()`, `none`. Gradients are separate palette entries that reference their stops.

### Replace color

`ReplaceColor(from, to)` edits each usage at its `declaredOn` node. Because flattening (4.4) moves class-based declarations onto elements, this is almost always the element itself. For colors still declared in a retained sheet, it issues `SetStyleRule`. For inherited colors, the declaring ancestor is edited by default, and "this element only" writes a local override instead. The command must not change unrelated descendants.

Palette updates are incremental: only nodes touched by a command are rescanned.

---

## 11. Selection and hit testing

```ts
interface SelectionState {
  nodeIds: NodeId[];
}
```

Canvas selection resolves the closest element carrying `data-nid`. Default selects the topmost selectable ancestor. Double-click drills into a group.

- `<use>` selects the `<use>` node. "Edit source" navigates to the referenced element. Instance and source stay distinct in model and UI.
- Elements inside `<defs>`, `<clipPath>`, and `<mask>` appear in the layer tree under a Definitions section and are not hit-testable on canvas. Clip paths and masks are edited through the inspector of the element that references them, via a "Go to definition" action.
- Selection outlines and handles render in a separate overlay in viewport space, so handles keep constant size at any zoom.

---

## 12. Crop

### Non-destructive crop (v1)

1. User draws a rectangle in viewport space.
2. Convert corners to root SVG coordinates.
3. Dispatch `SetViewBox(minX, minY, width, height)`.
4. If "keep display size" is on, adjust width and height to preserve rendered scale.

It is a normal, undoable command.

### Destructive crop (P2)

Generate a `clipPath` for the region first. Remove elements fully outside using bounding-box rejection. Partially intersecting geometry stays and is clipped.

---

## 13. SVG capability matrix

"Yes" means covered by the v1 test suite. "Limited" means preserved and displayed but not fully editable. "No" means no direct editing.

| Feature                                                                          | Load       | Display    | Select  | Edit                              | Export     |
| -------------------------------------------------------------------------------- | ---------- | ---------- | ------- | --------------------------------- | ---------- |
| `<path>`, `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<polyline>`, `<polygon>` | Yes        | Yes        | Yes     | Yes                               | Yes        |
| `<g>`                                                                            | Yes        | Yes        | Yes     | Yes                               | Yes        |
| `<text>`                                                                         | Yes        | Yes        | Yes     | Limited                           | Yes        |
| `<tspan>`                                                                        | Yes        | Yes        | Limited | No                                | Yes        |
| `<use>`                                                                          | Yes        | Yes        | Yes     | Limited                           | Yes        |
| `<symbol>`                                                                       | Yes        | Yes        | Limited | Limited                           | Yes        |
| `<image>` (data URL)                                                             | Yes        | Yes        | Yes     | Limited                           | Yes        |
| nested `<svg>`                                                                   | Yes        | Yes        | Limited | Limited                           | Yes        |
| `<a>`                                                                            | Yes        | Yes        | Yes     | Limited                           | Yes        |
| `<switch>`                                                                       | Yes        | Yes        | Limited | No                                | Yes        |
| `<marker>`                                                                       | Yes        | Yes        | No      | Limited                           | Yes        |
| `<style>`                                                                        | Yes        | Yes        | No      | Limited (via `SetStyleRule`)      | Yes        |
| gradients, patterns                                                              | Yes        | Yes        | Limited | Limited                           | Yes        |
| clip paths, masks                                                                | Yes        | Yes        | No      | Limited (via referencing element) | Yes        |
| filters                                                                          | Yes        | Yes        | No      | No                                | Yes        |
| animations (SMIL, CSS)                                                           | Preserve   | Limited    | No      | No                                | Preserve   |
| `<foreignObject>`                                                                | Stripped   | No         | No      | No                                | No         |
| external resources                                                               | Restricted | Restricted | n/a     | n/a                               | Restricted |

Unsupported features are preserved whenever safely possible, never silently dropped.

---

## 14. Export

### Serialization

The serializer rebuilds an SVG document from the model with `XMLSerializer` or an equivalent deterministic serializer. It handles namespaces, attributes, styles, definitions, references, text, dimensions, viewBox, IDs, and escaping. Attribute order is preserved. Comments and processing instructions are preserved.

### Fidelity guarantees

- **Untouched and clean:** if the document is at its original version **and** the sanitization report is empty, export is `originalSource`, byte for byte after documented BOM and encoding handling.
- **Untouched but sanitized:** if the report is non-empty, export is the sanitized serialization, and the UI says content was removed.
- **Edited:** export is canonical serialization. Attribute order and comments are preserved. Inter-element whitespace and indentation are normalized. Whitespace inside `<text>` and anywhere `xml:space="preserve"` applies is never changed.

The guarantee is conditional because DOMPurify output is a re-serialization of a parsed tree and will not match the source byte for byte even for clean files.

### Optimization (P1)

SVGO runs in a Web Worker (it is pure JS on strings, so this is safe). It runs only at export and never mutates the working model. Plugins that break editing round-trips are disabled or conservative (`removeViewBox`, aggressive ID cleanup, semantic-changing transforms). Comment stripping is an export option. The UI shows the byte delta.

### PNG (P1)

Main thread, not a worker (workers have no `Image`). Serialize to a Blob URL, load into an `<img>`, draw to a canvas at the requested scale. SVG loaded through `<img>` blocks external resources and script, which is the desired behavior here. Warn that fonts, external resources, and browser differences can affect output.

---

## 15. Security

Uploaded SVG is untrusted at every boundary.

```text
File -> Sanitize -> CSS/SMIL pass -> Parse -> Normalize -> Model
     -> Sanitize -> Serialize -> Export / Clipboard
```

### Rules

- Uploaded content never reaches `innerHTML` unsanitized.
- **Data URLs:** `image/png`, `image/jpeg`, `image/webp`, `image/gif` in image contexts. `font/woff2`, `font/woff`, `font/ttf`, `font/otf` only inside `@font-face` `src`, so embedded fonts survive. Everything else is rejected.
- **CSS pass:** strip `@import`, and strip any `url()` that is not a `#fragment` or an allowed data URL. Without this, retained or inline CSS can trigger network requests.
- **SMIL pass:** strip `animate` and `set` elements that target `href` or `xlink:href`, since they can introduce dangerous URLs after sanitization. Other animation is preserved.
- External network resources are disabled.
- Strict CSP: no remote origins for images, fonts, or `connect-src`. Astro emits small inline scripts for island hydration, so `script-src` cannot simply forbid inline script. Allow them with hashes, using Astro's CSP support if the installed version provides it, otherwise computed at build time. Static hosts often cannot set headers, so a `<meta http-equiv>` policy may be the only option, and it cannot express every directive (for example `frame-ancestors`). Settle this in an M1 spike (section 22). Because the site deploys to GitHub Pages, which cannot set custom headers, the policy is delivered as a `<meta>` tag or injected at build time, and it applies to the editor page only, never site-wide. Uploaded SVG relies on inline `style` attributes and `<style>` blocks inside the panes, so the spike also decides the `style-src` policy. Inline styles are likely required, which weakens that directive. Record the exfiltration risk and how the sanitizer's CSS pass and strict `img-src` and `connect-src` mitigate it.

### Security test corpus

M1 includes known SVG attack cases: script elements, event attributes, `javascript:` URLs, malicious `href` and `xlink:href`, `foreignObject`, external resources, CSS `@import` and `url()`, SMIL `href` animation, malformed SVG, data URL edge cases, entity expansion.

Tests assert both that dangerous constructs are removed and that no script runs and no unexpected network request is made (via request interception).

---

## 16. Performance

Goal: responsive pan, zoom, selection, and ordinary edits.

### Tiers

Thresholds live in a config object. Each tier has defined behavior.

| Tier    | Trigger                                             | Behavior                                                                                                                                                            |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full    | up to 5,000 elements and under 1 MB total path-data | Everything on: hover highlight, live bounding boxes, live palette.                                                                                                  |
| Reduced | 5,000 to 50,000 elements, or 1 to 5 MB path-data    | Hover highlight on click only. Bounding boxes computed on selection, not hover. Layer tree virtualized with collapsed groups by default. Palette updates debounced. |
| Minimal | over 50,000 elements, or over 5 MB path-data        | No hover highlight. Bounding boxes only for selected nodes. Preview pane updates on pointerup, not during drag. Banner explains the mode.                           |

Total path-data bytes is a second trigger because a few multi-megabyte paths can cost more than 50,000 rects.

**Adaptive guard:** if p95 pointermove handler time exceeds about 16 ms over a rolling window, drop to the next tier for the session and tell the user.

### Strategies

- Persistent map and structural sharing for versions.
- Transient previews for drags (section 6).
- Incremental DOM patching. No full serialization during normal editing.
- Virtualized layer tree and incremental palette updates.
- SVGO in a worker.
- Throttle or batch geometry work during continuous interaction.
- Keep pointer-rate state out of React: store plus imperative DOM updates, with render-count tests on panels (a drag must not re-render the inspector more than once per frame).

### CI benchmark

M1 adds a 50,000-node benchmark. A single command (`SetStyle`, `SetAttr`) applied to that document must complete within a frame budget, and CI fails on regression.

---

## 17. Accessibility

Keyboard-first wherever the interaction is meaningful.

- Visible focus indicators.
- Keyboard navigation through the layer tree.
- Accessible names on toolbar controls, and real button semantics.
- Keyboard-accessible selection, deletion, undo, and redo.
- Accessible inspector controls and reduced-motion support.
- Sufficient contrast for selection outlines and UI.
- Screen-reader announcements for important state changes.
- Every canvas-only interaction has an inspector or layer-tree equivalent where practical.
- The editor root is a labeled region. Opening and closing panels and dialogs moves focus predictably and restores it. Nothing autofocuses on load, so the host page's focus order is not hijacked.

axe checks are necessary but not sufficient. Keyboard-only E2E flows are required.

---

## 18. Tech stack

- Existing host site: Astro 7 (static output), React 19, Tailwind CSS v4, TypeScript. No existing dependency is upgraded. Vitest and Playwright versions must be compatible with the installed Vite and Astro.
- **React** for `<SvgEditor />` and all UI chrome (inspector, layer tree, palette, toolbar, dialogs), mounted as an Astro island
- **Imperative** canvas renderer outside React reconciliation (it patches by `NodeId`)
- Framework-free state store, read through `useSyncExternalStore`
- `@tanstack/react-virtual` (or equivalent) for the virtualized layer tree
- DOMPurify (XML mode, verified), `css-tree`, `css-select`, `@csstools/selector-specificity`
- A persistent map library (for example `immutable`)
- SVGO (worker)
- Vitest, Playwright

Core and the state store must not depend on React or Astro. Core must also not depend on the DOM.

---

## 19. Testing strategy

### Unit (Vitest)

Normalization, **the cascade table in section 5 as a parameterized test**, flatten-merge precedence cases, color parsing and resolution, unit conversion, transforms, command purity, composition and `Ungroup`/`Reparent`/`Duplicate` appearance preservation, history and merge behavior, viewBox and crop math, serializer behavior, sanitizer rules.

### Property tests

```text
random commands -> apply N -> undo N -> equals original model
serialize(parse(source)) -> parse -> equivalent model
```

### Corpus

At least 100 real SVGs from Illustrator, Figma, Inkscape, Sketch, common icon sets, and hand-written edge cases. Required coverage: CSS classes, conflicting selectors, `!important`, inheritance, `<use>`, nested `<svg>`, gradients, clip paths, masks, filters, missing viewBox, percentage dimensions, transforms, BOM, huge paths, custom properties, embedded fonts, license comments, malformed input, CDATA and entity cases (to validate DOMPurify XML mode).

### Visual regression (Playwright)

Chromium only through M2, then Chromium, Firefox, WebKit. Original and normalized renderings are compared. Zero tolerance for deterministic round-trip fixtures. Cross-browser differences use a documented tolerance.

### Security

No script execution, no unexpected network requests, unsafe constructs stripped, safe internal references still work.

### Component tests

Vitest in browser mode with React Testing Library for panels and the root component. jsdom has no layout or geometry, so anything touching `getBBox` or `getScreenCTM` runs in a real browser. Include render-count tests: a simulated drag must not re-render the inspector more than once per frame.

### E2E

Upload, inspect, select, recolor, transform, crop, undo, redo, export, re-import, verify.

Run Playwright against `astro build` plus `astro preview`, not the dev server, so production hydration and bundling are what gets tested. Also test:

- A development-mode double mount (StrictMode) leaves exactly one renderer, one set of panes, and no duplicate listeners.
- Unmounting and remounting the island leaves no leaked workers, Blob URLs, or listeners (relevant if the site uses view transitions).
- Site-level styles and shortcuts neither alter the editor nor are swallowed by it.

### Accessibility

axe, keyboard-only walkthroughs, layer-tree navigation, inspector interaction, undo/redo, focus restoration after dialogs.

### Performance

The 50,000-node command benchmark (section 16) runs in CI.

---

## 20. Risks and mitigations

| Risk                                                 | Mitigation                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Style resolution misses real-world cases             | Dedicated cascade engine, cascade table as tests, corpus-driven development, explicit unsupported-selector handling |
| Wrong cascade order ships                            | Table in section 5 is the spec, tested before implementation                                                        |
| DOMPurify mishandles XML specifics                   | XML mode verified on CDATA and entity corpus, fallback allowlist walker                                             |
| Immutable updates too slow at scale                  | Persistent map, transient drag previews, CI benchmark                                                               |
| Pane styles or IDs leak between panes                | Required shadow roots, `all: initial` host resets                                                                   |
| Rendering differs between browsers                   | WebKit and Firefox visual tests from M3                                                                             |
| Optimizer breaks editability                         | Conservative SVGO config, export-only                                                                               |
| Serialization loses formatting                       | Original preserved when clean, canonical output defined otherwise                                                   |
| `<use>` and definitions cause incorrect edits        | References and sources kept distinct                                                                                |
| Ungroup or reparent changes appearance               | Commands bake transform and inherited style, refuse when impossible                                                 |
| Transform math produces bad selections               | Central coordinate utilities, property tests                                                                        |
| Large SVGs block main thread                         | Defined performance tiers, adaptive guard, throttling                                                               |
| CSS or SMIL introduces network or script paths       | CSS and SMIL passes, strict CSP, security corpus                                                                    |
| Unsupported features silently lost                   | Capability matrix, preservation-first serialization                                                                 |
| React re-renders on pointer-rate data                | Store outside React, `useSyncExternalStore` selectors, no pointer-rate React state, render-count tests              |
| StrictMode or hot reload double-mounts the renderer  | Idempotent mount and destroy, dev-mode double-mount test                                                            |
| Host site CSS or shortcuts interfere with the editor | CSS Modules and theme variables for chrome, shadow roots for panes, shortcuts scoped to the editor root             |
| Island server-render or hydration mismatch           | `client:only="react"` with a static fallback                                                                        |
| Editor work regresses the existing site              | Scoped tooling, no edits to existing files outside a listed few, build-output comparison in CI                      |
| Inline-style CSP weakness for uploaded SVG           | Sanitizer CSS pass, strict `img-src` and `connect-src`, decision record from the CSP spike                          |

---

## 21. Milestones

M1 is a vertical slice that matches the PRD's M1 and adds only the parts that are expensive to retrofit.

### M1 deliverables

1. `SvgDocument` model on a persistent map.
2. Sanitization (including CSS and SMIL passes) and parser.
3. Normalizer limited to presentation attributes and inline style. Stylesheet flattening is **not** in M1.
4. Command abstraction, `SetAttr` and `SetStyle`, and history with undo and redo (headless, tested).
5. Interactive renderer with transient preview support.
6. Original and edited panes with **synced zoom and pan**.
7. Deterministic serializer and export of SVG.
8. Security corpus and an initial compatibility corpus.
9. 50,000-node command benchmark in CI.
10. Chromium visual regression.
11. `<SvgEditor />` mounted as a `client:only="react"` island on a tool page in the existing site, using its layout, with a placeholder fallback.
12. Bundle size report in CI, with a budget set from the first measurement.
13. CSP delivery spike for the static Astro host, ending in a decision record.
14. Build-output check: the HTML and JS of existing pages are unchanged by the editor work, compared before and after.

### M1 acceptance

- Upload a representative corpus and render both panes.
- Zoom and pan linked across panes.
- Apply `SetAttr` and `SetStyle` through the command layer, with working undo and redo.
- Export, and re-import the result.
- Preserve unsupported-but-safe constructs.
- Block scripts and external resource loading.
- No full serialization during ordinary pointer-driven editing.
- Benchmark within frame budget.

### Later milestones

- **M2:** sizing, viewBox, crop.
- **M3:** cascade engine and stylesheet flattening, palette and color resolution, selection, inspector, layer tree, `SetStyleRule`, `Group`/`Ungroup`/`Reparent`/`Duplicate`. Add Firefox and WebKit visual tests.
- **M4:** undo/redo hardening, accessibility pass, performance tiers and adaptive guard.

### PRD changes required

- Move the undo/redo **core** (commands, history, `SetAttr`, `SetStyle`) from M4 to M1. Hardening and UI polish stay in M4.
- Keep synced zoom and pan in M1 (already there).
- Move selection, inspector, and the style resolver to M3 (already there). They are no longer part of M1.

Each milestone ships behind a feature flag. The corpus and security suites gate every milestone. A feature is not complete because it works on hand-authored SVGs. It must pass the corpus where applicable.

---

## 22. Decisions on v1.1 open questions

| Question                         | Decision                                                                                                                                                                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UI framework                     | React for chrome, hosted in Astro as a `client:only` island. Imperative canvas renderer outside React. Framework-free state store.                                                                                                                                             |
| Stylesheet parser                | `css-tree` for parsing, `css-select` with a model adapter for matching, `@csstools/selector-specificity` for specificity. Flatten supported selectors with cascade-aware merging. Retain only unflattenable rules and record them as unsupported.                              |
| Original formatting and comments | Preserve attribute order. Keep comments and processing instructions as model nodes (icon sets often carry license attribution). Normalize inter-element whitespace. Never touch whitespace in `<text>` or under `xml:space`. SVGO may strip comments only as an export option. |
| Text editing in v1               | Inspector-only. Content editable when the `<text>` has a single text node. Font family, size, weight, anchor, fill editable. Tspan-heavy text is read-only with a note. No on-canvas text editing.                                                                             |
| Font subsetting and outlining    | Not in v1. Browsers cannot read system font files (Local Font Access is Chromium-only), so outlining works only with user-supplied or embedded fonts. Warn when text uses fonts that may not render elsewhere. Preserve embedded fonts.                                        |
| History checkpoints              | Not needed. The persistent map and transient previews address the cost. The CI benchmark catches regressions.                                                                                                                                                                  |
| Large-document thresholds        | Config object with defined per-tier behavior (section 16), path-data bytes as a second trigger, and an adaptive p95 pointermove guard.                                                                                                                                         |

### Remaining open questions

- Exact `immutable` (or alternative) library choice, pending a spike against the 50,000-node benchmark.
- Whether DOMPurify XML mode is sufficient or the allowlist walker is needed (decided by the corpus in M1).
- Whether `Ungroup` should offer to keep the group or refuse outright when it carries `filter`, `mask`, or group-level `opacity` (needs a short UX review).
- Whether a shareable state link is in scope, given the no-upload stance (carried over from the PRD).
- CSP delivery on a static Astro host (hashes versus meta tag), per section 15.
- Whether the site uses Astro view transitions, which affects unmount behavior and session-state handling.

---

## 23. Design principles

- **Model first.** UI components dispatch commands, they do not own SVG semantics.
- **Commands are the mutation boundary.** No UI code mutates document nodes.
- **Rendering is derived state.** The SVG DOM is an artifact, not the source of truth.
- **Serialization is separate.** The editor does not serialize on every interaction.
- **Preserve when possible.** Unsupported constructs are kept, not destroyed.
- **Security before convenience.** Uploaded SVG is untrusted at every boundary.
- **Accessibility is architecture.** Canvas interactions have accessible equivalents where practical.
- **Measure before optimizing.** Add complexity only when profiling shows the need, and keep a CI benchmark so regressions are visible.
