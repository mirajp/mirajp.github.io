import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "playwright/test";

interface CorpusManifest {
  fixtures: Array<{
    path: string;
    malformed?: boolean;
  }>;
}

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../../..");
const fixtureRoot = path.join(repositoryRoot, "tests/svg-editor/fixtures");
const manifest = JSON.parse(
  readFileSync(path.join(fixtureRoot, "manifest.json"), "utf8"),
) as CorpusManifest;
const visualFixtures = manifest.fixtures.filter(
  (fixture) =>
    fixture.path.startsWith("corpus/") &&
    fixture.path.endsWith(".svg") &&
    !fixture.malformed,
);

test.describe("SVG corpus round-trip visual regression", () => {
  for (const fixture of visualFixtures) {
    const fixtureName = path.basename(fixture.path, ".svg");
    test(fixtureName, async ({ page }, testInfo) => {
      await page.goto("/tools/svg-editor/");
      const svgPath = path.join(fixtureRoot, fixture.path);
      await page.getByLabel("Choose an SVG file").setInputFiles(svgPath);
      await expect(page.getByRole("status")).toContainText("SVG loaded.");

      const originalViewport = page.getByTestId("original-viewport");
      const editedViewport = page.getByTestId("edited-viewport");
      await expect(
        originalViewport.locator('svg[data-pane-svg="original"]'),
      ).toHaveCount(1);
      await expect(
        editedViewport.locator('svg[data-pane-svg="edited"]'),
      ).toHaveCount(1);

      const baseline = `corpus-${fixtureName}.png`;
      await expect(originalViewport).toHaveScreenshot(baseline, {
        animations: "disabled",
        maxDiffPixels: 0,
      });

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export SVG" }).click();
      const download = await downloadPromise;
      const exportedFile = testInfo.outputPath(`round-trip-${fixtureName}.svg`);
      await download.saveAs(exportedFile);
      await page.getByLabel("Choose an SVG file").setInputFiles(exportedFile);
      await expect(page.getByRole("status")).toContainText("SVG loaded.");
      await expect(
        editedViewport.locator('svg[data-pane-svg="edited"]'),
      ).toHaveCount(1);
      await expect(editedViewport).toHaveScreenshot(baseline, {
        animations: "disabled",
        maxDiffPixels: 0,
      });
    });
  }
});
