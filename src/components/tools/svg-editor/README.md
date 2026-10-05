# SVG editor developer guide

The SVG editor is a client-side React island hosted by the Astro page at
`/tools/svg-editor/`. It treats uploaded SVG as untrusted input, keeps document
edits in an immutable model, and renders the two panes imperatively in isolated
shadow roots.

## Development and test commands

This repository uses Yarn Classic (`yarn.lock`). Run commands from the project
root.

### Local site and production build

```sh
yarn dev
yarn check
yarn build
yarn preview
```

- `yarn dev` starts the Astro development server.
- `yarn check` runs Astro's project diagnostics. It currently includes
  pre-existing site diagnostics outside the editor as well.
- `yarn build` creates the static site and runs the SVG editor CSP postprocessor.
- `yarn preview` serves the existing `dist/` build. Build first when validating
  production output.

### Editor lint and type checks

```sh
yarn lint
```

This runs ESLint over editor source, tests, and editor scripts; checks the
strict editor TypeScript projects (`tsconfig.svg-editor.json` and
`tsconfig.svg-editor.core.json`); and checks formatting with Prettier.

### Unit and component tests

```sh
yarn test
yarn test:core
yarn test:io
yarn test:render
yarn test:ui
```

- `yarn test` runs the Node-based tests and browser-mode tests.
- `yarn test:core` covers pure model, command, unit, and history logic.
- `yarn test:io` covers sanitizer, parser, serializer, and corpus expectations.
- `yarn test:render` runs browser-dependent renderer, coordinate, pane, and
  overlay tests.
- `yarn test:ui` runs React component tests in Vitest's Chromium browser mode.

### End-to-end and visual tests

```sh
yarn e2e
yarn e2e tests/svg-editor/e2e/m2/geometry-corpus.spec.ts
yarn visual
yarn visual --update-snapshots
yarn bench
yarn size
```

- `yarn e2e` runs Playwright's `e2e` project. The Playwright configuration
  builds the site, verifies test-only routes do not leak into a normal build,
  builds with the E2E flag, then tests through Astro preview (not the dev
  server).
- Pass a test file after `yarn e2e` to run a focused spec. The M2 geometry
  corpus spec covers resize, viewBox changes, crop math, export/re-import, and
  rendered output against a separately constructed reference.
- `yarn visual` compares corpus round-trip screenshots against Linux Chromium
  baselines with zero pixel tolerance.
- `yarn visual --update-snapshots` regenerates the regular corpus visual
  baselines. Review every changed image; do not use updates to hide regressions.
- `yarn bench` runs the command-layer benchmark.
- `yarn size` checks editor bundle budgets and that non-editor pages do not load
  the editor chunk. It expects a current build.

Install the Playwright browser and system dependencies on a new Linux/WSL
machine with:

```sh
yarn playwright install --with-deps chromium
```

Updating the task-specific resized/cropped M2 reference images is explicit and
separate from the regular visual snapshots:

```sh
UPDATE_M2_BASELINES=1 yarn e2e tests/svg-editor/e2e/m2/geometry-corpus.spec.ts
yarn e2e tests/svg-editor/e2e/m2/geometry-corpus.spec.ts
```

The first command writes baselines beneath
`tests/svg-editor/e2e/m2/baselines/`; the second verifies them. Generate and
review these images on Linux so Chromium output matches CI.

## Subsystems

### Contracts

`contracts/` defines the model and adapter boundaries shared by the editor:
SVG node/document types, metadata and sanitization findings, commands, store,
renderer, and geometry interfaces. Treat these contracts as stable; change
them only through the project's explicit contract-update process.

### Core model, units, commands, and history

`core/` is framework-free and has no browser DOM dependency. `core/units/`
parses and converts SVG dimensions. `core/commands/geometry/` calculates
effective root dimensions/viewBox and creates immutable size, viewBox, and
preserveAspectRatio commands. `core/history/` stores command versions and
supports undo, redo, and merge keys.

Commands are the document-edit boundary. Interactive pointer motion should
remain a preview; commit one command when the user confirms an operation.

### State

`state/createEditorStore.ts` owns the current document, source metadata,
selection, history flags, and original/edited viewport transforms. UI reads
state through `useEditorStore` selectors backed by
`useSyncExternalStore`; renderer subscriptions use the store directly.

### SVG input and output

`io/sanitize/` processes uploaded source before it is parsed and reports removed
unsafe content. `io/parse/` uses the DOM parser adapter to normalize XML into
the persistent node model. `io/serialize/` writes deterministic SVG and applies
the clean/modified/sanitized export fidelity rules. Never render uploaded source
through React or an HTML injection sink.

### Rendering and coordinates

`render/renderer/` builds and diffs SVG DOM with `createElementNS`, preserving
element identity for ordinary edits. Its `preview()` API applies transient
visual patches without changing model state. `render/pane/` creates an isolated
shadow-root host for each pane. `render/coords/` is the shared boundary for
client, local, and root-SVG coordinate conversion and view transforms.

`render/overlay/` contains imperative viewport overlays. The crop overlay draws,
resizes, and nudges a rectangle without changing the SVG model; confirmation
converts its corners to root SVG coordinates and dispatches one viewBox
command, while Escape cancels.

### User interface

`ui/` contains the Astro island's React chrome, upload flow, toolbar, pane
mounting, and non-React viewport controller. Panes render into empty React
containers; uploaded SVG and overlay DOM remain imperative.

`ui/panels/size-viewbox/SizeViewBoxPanel.tsx` and
`ui/tools/crop/CropTool.tsx` are standalone size/viewBox and crop controls.
They are not currently composed into `ui/SvgEditor.tsx`, so the production page
does not yet expose those controls. The M2 corpus E2E spec exercises the
geometry commands through a test-only store hook and compares resulting
rendering; the separate crop UI spec requires crop-tool composition before it
can pass.

### Tests and fixture data

Tests mirror the implementation boundaries under `tests/svg-editor/`. SVG
fixtures live in `tests/svg-editor/fixtures/`; `manifest.json` records each
fixture's expected safety/preservation characteristics and its M2 geometry
reference. Unit tests do not need a browser; DOM geometry, shadow-root rendering,
component browser tests, E2E, and visual tests run in Chromium.

The M2 corpus includes files with missing root dimensions/viewBox, percentages,
physical units, non-zero viewBox origins, preserveAspectRatio modes, and nested
SVG viewports. Keep each new fixture described in the manifest so corpus tests
can discover it consistently.
