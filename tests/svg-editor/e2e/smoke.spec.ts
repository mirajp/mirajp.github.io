import { expect, test } from "playwright/test";

test("uploads, views, zooms, and exports an SVG from the production build", async ({
  page,
}) => {
  await page.goto("/tools/svg-editor/");
  await expect(page.getByRole("region", { name: "SVG editor" })).toBeVisible();

  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="tomato"/></svg>';
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "smoke.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(source),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");
  await expect(
    page.getByRole("region", { name: "Original SVG pane" }).locator("svg"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("region", { name: "Edited SVG pane" }).locator("svg"),
  ).toHaveCount(1);

  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByTestId("zoom-level")).not.toHaveText("100%");
  const originalTransform = await page
    .getByRole("region", { name: "Original SVG pane" })
    .locator("svg")
    .getAttribute("style");
  const editedTransform = await page
    .getByRole("region", { name: "Edited SVG pane" })
    .locator("svg")
    .getAttribute("style");
  expect(originalTransform).toContain("scale(1.1)");
  expect(editedTransform).toContain("scale(1.1)");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export SVG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("edited.svg");

  await page.getByLabel("Choose an SVG file").focus();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("h1").click();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
});
