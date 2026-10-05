# M1 integration report

## Acceptance

| Acceptance item | Result | Evidence |
| --- | --- | --- |
| Upload representative corpus and render both panes | Pass | `pnpm visual`: 34 clean corpus fixtures load, render, export, and re-import in Chromium; `pnpm e2e`: both panes render. |
| Keep zoom and pan linked across panes | Pass | `tests/svg-editor/e2e/view-sync.spec.ts` simulates wheel zoom and middle-button drag; both pane transforms remain equal. |
| Apply `SetAttr` and `SetStyle` through commands with undo/redo | Pass | `tests/svg-editor/core/commands/commands.test.ts` and `tests/svg-editor/state/store.test.ts` use the command constructors and verify immutable updates and undo/redo. |
| Export and re-import | Pass | `tests/svg-editor/e2e/round-trip.spec.ts` applies an edit, undoes/redoes, exports, and uploads the export again. |
| Preserve unsupported but safe constructs | Pass | `pnpm test` passes corpus parse/serialize round trips, including stylesheets retained as unsupported, comments, processing instructions, namespaces, and XML whitespace. |
| Block scripts and external loads | Pass | `pnpm e2e` security test runs every security fixture with request interception and an execution canary; no unexpected request or execution was observed. |
| Avoid full serialization during pointer-driven interaction | Pass | `tests/svg-editor/ui/no-serialization.test.tsx` spies on the serializer during simulated wheel zoom and drag pan; zero calls. |
| Keep the 50,000-node command benchmark within frame budget | Pass | `pnpm bench`: 4 ms p95 budget; latest SetStyle p95 0.203 ms and SetAttr p95 0.144 ms. |

## M1 deliverables 11–13

| Deliverable | Result | Evidence |
| --- | --- | --- |
| 11. Client-only island on the tool page with fallback | Pass | Normal `pnpm build` output contains `<astro-island` and “Loading SVG editor…”; built-page E2E confirms hydration. |
| 12. Bundle-size report and budget in CI | Implemented; check currently fails | The `size` CI job runs `yarn size`. Reported editor entry: 98.38 KiB raw / 28.73 KiB gzip. The protected contrast/diff HTML checks fail against their stored first-measurement baselines; their JS checks pass. No budget was rebaselined. |
| 13. CSP decision and build application | Pass | [0.4c decision](./0.4c-csp-delivery.md); `pnpm build` injects a page-local CSP with 10 inline-script hashes. The production E2E loads the hydrated island under that policy. |

## Remaining gaps

- `pnpm check` still fails with 188 diagnostics in pre-existing site files (for example [CommandPalette.astro](../../src/components/CommandPalette.astro) and [Paint.tsx](../../src/components/tools/Paint.tsx)). No diagnostic points to the new E2E route. `pnpm lint` passes the editor-scoped TypeScript and lint checks.
- `pnpm size` exits 1 because the existing contrast and diff HTML differ from the stored initial budget hashes. Their measured JavaScript is unchanged. The original build manifest also records changed HTML for 16 existing pages and renamed shared React chunks from earlier editor integration; this report does not mask or rebaseline those differences.

## Validation summary

| Command | Result |
| --- | --- |
| `pnpm build` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass: 32 Node tests and 26 browser tests |
| `pnpm bench` | Pass |
| `pnpm visual` | Pass: 34 tests |
| `pnpm e2e` | Pass: 8 tests |
| `pnpm check` | Fail: 188 pre-existing whole-site diagnostics |
| `pnpm size` | Fail: protected contrast/diff HTML baselines described above |

## Files changed for this integration

- Build, hosting, CSP: [`package.json`](../../package.json), [`src/pages/[...svgEditorE2e].astro`](../../src/pages/%5B...svgEditorE2e%5D.astro), [`scripts/svg-editor/csp/postprocess.mjs`](../../scripts/svg-editor/csp/postprocess.mjs), [`scripts/svg-editor/playwright.config.mjs`](../../scripts/svg-editor/playwright.config.mjs), [`.github/workflows/svg-editor-ci.yml`](../../.github/workflows/svg-editor-ci.yml), [0.4c decision](./0.4c-csp-delivery.md).
- Commands and state: [`src/components/tools/svg-editor/core/index.ts`](../../src/components/tools/svg-editor/core/index.ts), [`core/commands/index.ts`](../../src/components/tools/svg-editor/core/commands/index.ts), [`state/createEditorStore.ts`](../../src/components/tools/svg-editor/state/createEditorStore.ts).
- UI wiring: [`ui/SvgEditor.tsx`](../../src/components/tools/svg-editor/ui/SvgEditor.tsx), [`ui/PaneView.tsx`](../../src/components/tools/svg-editor/ui/PaneView.tsx), [`ui/Toolbar.tsx`](../../src/components/tools/svg-editor/ui/Toolbar.tsx), [`ui/ViewportController.ts`](../../src/components/tools/svg-editor/ui/ViewportController.ts), [`ui/useEditorStore.ts`](../../src/components/tools/svg-editor/ui/useEditorStore.ts).
- Isolation and performance checks: [`render/pane/index.ts`](../../src/components/tools/svg-editor/render/pane/index.ts), [`tests/svg-editor/bench/history-bench.test.ts`](../../tests/svg-editor/bench/history-bench.test.ts), [`tests/svg-editor/ui/no-serialization.test.tsx`](../../tests/svg-editor/ui/no-serialization.test.tsx).
- Tests: [`tests/svg-editor/core/commands/commands.test.ts`](../../tests/svg-editor/core/commands/commands.test.ts), [`tests/svg-editor/state/store.test.ts`](../../tests/svg-editor/state/store.test.ts), [`tests/svg-editor/e2e/editor.spec.ts`](../../tests/svg-editor/e2e/editor.spec.ts), [`tests/svg-editor/e2e/host-and-lifecycle.spec.ts`](../../tests/svg-editor/e2e/host-and-lifecycle.spec.ts), [`tests/svg-editor/e2e/view-sync.spec.ts`](../../tests/svg-editor/e2e/view-sync.spec.ts).
- Removed superseded placeholders: `src/components/tools/svg-editor/SvgEditor.tsx`, `src/components/tools/svg-editor/ui/storeAdapter.ts`, `scripts/svg-editor/bench.mjs`, `scripts/svg-editor/size.mjs`, `tests/svg-editor/io/io-placeholder.test.ts`, `tests/svg-editor/render/render-placeholder.test.ts`, and obsolete `.gitkeep` files in now-populated directories. Replaced the ignored `src/pages/__e2e/[name].astro` route source with the Astro-supported catch-all route and removed `src/pages/__e2e__/.gitkeep`.
- Updated [`docs/svg-editor/STATUS.md`](../STATUS.md); the frozen `contracts/` directory was not changed.
