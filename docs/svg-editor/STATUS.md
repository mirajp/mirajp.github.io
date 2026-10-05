# SVG Editor Status

## Host project notes

- Package manager: Yarn Classic 1.22.22 (`yarn.lock`); WSL Node: v24.19.0.
- Installed baseline versions: Astro 7.2.4, React 19.2.8, @astrojs/react 6.0.4, Tailwind 4.3.3, Vite 8.2.2.
- `astro.config.mjs`: static output; React, MDX, and sitemap integrations; `@tailwindcss/vite`; site `https://miraj.dev`, no configured base.
- Tools are in `src/components/tools/`, with pages in `src/pages/tools/`; routes use `/tools/<name>/`.
- Contrast Checker uses `BaseLayout`, imports a React component, and hydrates it with `client:load`.
- `BaseLayout` initializes `data-theme` from local storage or OS preference; ThemeToggle changes the attribute and persists the choice.
- Semantic CSS variables and Tailwind v4 setup are in `src/styles/global.css`; dark mode is selected by `[data-theme="dark"]`.
- CommandPalette is mounted by Header; an inline script registers a document-level Ctrl/Cmd+K shortcut. ThemeToggle uses an inline click handler, not a keyboard shortcut.
- `.github/workflows/deploy.yml` builds and deploys to GitHub Pages; that static host cannot configure custom response headers.
- No project ESLint, Prettier, Vitest, or Playwright configuration exists; Prettier is not a declared project dependency.
- Baseline build hashes for all files in `dist/` are recorded in `baseline-build.txt`.
- WSL: install Chromium and its system dependencies with `yarn playwright install --with-deps chromium` (requires sudo).

## Task 0.1

- Status: blocked on two acceptance gaps; implementation and scoped checks are complete.
- Changed: editor layer placeholders, `/tools/svg-editor/`, isolated Vitest/ESLint/Prettier/Playwright tooling, CI, and the clean 136-file baseline hash list.
- Historical note: those 0.1 placeholders were replaced by later IO, renderer, command/state, benchmark, and size implementations; see the M1 report for the remaining gaps.
- Decisions: retained Yarn Classic and its lockfile; pinned tools compatible with Vite 8; added TypeScript 5.9.3 for strict editor checking.
- Validation: editor Astro check, lint, Node/browser tests, E2E, visual, build, preview route, and benchmark passed. Core's no-DOM probe failed as intended.
- Baseline full-site `pnpm check` already reports 188 errors in existing site files; scoped editor Astro check reports 0 errors. Existing scripts/configs are intentionally unchanged.
- Surprise: Astro/Vite rehashed shared React island assets; output adds 12 files, removes 9 old hashed assets, and changes 6 existing HTML pages plus `sitemap-0.xml`. No existing source page was changed.
- Remaining: satisfy the output-hash requirement without changing out-of-scope build config, and clear the baseline full-site check errors. Then proceed with task 0.2.

## Contract notes

- Task 0.2: added type-only interfaces and their compile-time implementation examples under `contracts/`.
- The TDD names PersistentMap but does not prescribe methods; selected immutable `get`, `has`, `set`, `delete`, `size`, and `entries`.
- History.push accepts a Command; undo/redo/current return a document or null before one is available.
- ModelDiff carries previous/next document snapshots and changed/structural node IDs; preview patch carries node-local attributes/styles.
- SanitizationReport uses a findings array; retained parsed sheets contain ordered selector/declaration rules.
- EditorStore.load takes the parsed document and source metadata; pane view transforms are keyed as original and edited.
- Validation: editor TypeScript and scoped ESLint pass. Full `pnpm check` remains blocked by the existing 188 site errors noted above.

## Task 1.B1

- Status: Complete; frozen contracts remain unchanged.
- Changed: added XML DOM allowlist sanitizer with CSS/SMIL, href, event, data-URL, entity, and processing-instruction passes; findings include kind, location, and snippet.
- Compatibility: returns both `sanitizedSource` (contract) and `output` (task API); malformed XML throws `MalformedSvgError` with findings and trusts no partial tree.
- Decision: the referenced 0.4b record is absent. A DOMPurify XML-mode probe wrapped SVG in HTML and dropped `viewBox`, comments, and processing instructions, so followed TDD §4.2's parsed-DOM allowlist fallback.
- Test setup: added jsdom and its type declarations for Node IO tests; no production dependency or script/config change.
- Validation: `corepack pnpm test:io` passed (2 files, 7 tests); `yarn lint` passed. pnpm emitted an ignored-esbuild-build warning during dependency sync, but tests completed successfully.
- Stubbed/incomplete: none. Suggested next task: 1.B2, parser.

## Task 1.D1

- Status: Complete; the original UI store adapter was temporary and was replaced by the framework-free state store in task 1.Z.
- Changed: added the React editor, file/paste/drop load flow, dual sanitized panes, linked view controls, export/copy, accessibility and smoke/component tests.
- Stubbed/incomplete: no attribute/style inspector is exposed; the M1 command layer and history are headless.
- Validation: `pnpm lint` passed; `pnpm test:ui` passed (7 tests); `pnpm e2e` passed (2 tests). `pnpm check` remains at the 188 pre-existing site errors; none report in changed editor paths.
- Suggested next task: implement 1.S1 and replace the UI store adapter.

## Task 1.D2

- Status: Complete; measured report and budgets are in `scripts/svg-editor/size/`.
- Changed: `pnpm size` reports editor, optional worker, no-island page JS, and two protected existing tool pages; default growth tolerance is 10%.
- Guardrails: all non-editor page HTML/JS graphs are checked for editor-chunk references; SVGO text is rejected from the main editor chunk.
- Decision: Astro already emits the `client:only` editor as a lazy, page-specific JS entry; no manual chunk config was needed, avoiding collateral asset changes.
- CI: added an independent `size` job; the script writes its comparison table to `$GITHUB_STEP_SUMMARY`.
- Measurements: editor entry 96.20 KiB raw / 28.15 KiB gzip; worker not emitted; `/about/` local JS 5.98 KiB / 2.56 KiB gzip.
- Validation: `pnpm build && pnpm size` passed; `pnpm lint` passed; CI-summary output and over-budget failure were verified. Existing contrast/diff HTML and JS remain unchanged from this task's starting build.
- Rebaseline intentionally with `pnpm size -- --write-budget`; ordinary CI runs only enforce the committed budget.
- Suggested next task: task 5.1, when the SVGO worker exists.

## Task 1.E1

- Status: Complete after integration fixes in task 1.Z.
- Changed: added manifest-driven visual round trips, 34 Linux Chromium baselines, security payload checks, edit/undo/redo/export/re-import, shortcut, and lifecycle E2E coverage.
- Validation: final `pnpm visual` passed (34); `pnpm e2e` passed (8); `pnpm lint` passed.
- The round-trip assertion uses rendered geometry instead of parser node IDs, which shift when serialized XML declarations are parsed.
- Astro excludes underscore-prefixed source directories, so flagged-only hosts are generated by the gated catch-all route `src/pages/[...svgEditorE2e].astro` at `/__e2e/*`; normal builds contain no such output.
- Fixed host-style leakage by applying explicit important resets to the pane host in [pane host](../../src/components/tools/svg-editor/render/pane/index.ts).
- Suggested next task: M2 sizing/viewBox/crop, while tracking the existing full-site check and output-baseline gaps.

## Task 1.Z

- Status: M1 integration complete; the full acceptance table and evidence are in [M1 report](decisions/M1-report.md).
- Changed: replaced `ui/storeAdapter.ts` with a framework-free command/history store and `SetAttr`/`SetStyle`; added command/store tests and a serializer spy during simulated pointer interactions.
- Integration: fixed host CSS isolation, gated `/__e2e/*` routes, added build-time editor-only CSP hash injection and the 0.4c decision record, and removed superseded placeholders.
- Validation: `pnpm build`, `pnpm lint`, `pnpm test` (32 Node + 26 browser), `pnpm bench`, `pnpm visual` (34), and `pnpm e2e` (8) passed.
- Benchmark: 50k SetStyle p95 0.203 ms; SetAttr p95 0.144 ms against a 4 ms budget.
- Remaining: `pnpm check` has 188 pre-existing whole-site diagnostics; `pnpm size` exits 1 on the existing contrast/diff HTML baseline checks. Neither was suppressed or rebaselined.
- Build check: the normal output has no E2E routes and the editor fallback/CSP are present; initial editor integration already changed existing-page HTML/shared React chunk hashes, as detailed in the report.
- Contracts stayed frozen. The file-by-file change list is in the M1 report.
- Suggested next task: decide whether to repair/rebaseline the pre-existing site-check and existing-page output gaps before M2.
