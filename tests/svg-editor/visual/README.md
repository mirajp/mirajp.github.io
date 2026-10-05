# SVG editor visual baselines

Visual snapshots are Chromium-only and must be generated on Linux so their
pixels match the GitHub Actions runner. From Linux or WSL, install Chromium if
needed and run:

```sh
pnpm exec playwright install chromium
pnpm exec playwright test --config scripts/svg-editor/playwright.config.mjs --project=visual --update-snapshots
```

Review every changed PNG under `tests/svg-editor/visual/baselines/` before
accepting it. Do not update snapshots to hide a rendering regression. CI runs
`pnpm visual` without update mode and requires zero differing pixels for the
corpus round trips.
