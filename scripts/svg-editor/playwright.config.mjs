import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  fullyParallel: true,
  reporter: "list",
  snapshotPathTemplate: "{testDir}/baselines/{arg}{ext}",
  projects: [
    {
      name: "e2e",
      testDir: "../../tests/svg-editor/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "visual",
      testDir: "../../tests/svg-editor/visual",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:4321",
    headless: true,
  },
  webServer: {
    command:
      'yarn build && node --input-type=module -e \'import fs from "node:fs"; if (fs.existsSync("dist/__e2e")) throw new Error("E2E pages leaked into a normal build")\' && SVG_EDITOR_E2E=1 yarn build && yarn preview --host 127.0.0.1',
    url: "http://127.0.0.1:4321/tools/svg-editor/",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
