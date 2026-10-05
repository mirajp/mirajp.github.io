import { expect, test } from "playwright/test";

const SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><rect width="160" height="100" fill="tomato"/></svg>';

test("crop changes only the visible viewBox and is keyboard adjustable", async ({
  page,
}) => {
  await page.goto("/tools/svg-editor/");
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "crop.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");

  const cropButton = page.getByRole("button", {
    name: "Crop (visible area)",
  });
  await expect(cropButton).toHaveAttribute(
    "title",
    "Changes the viewBox; it does not delete any SVG geometry.",
  );
  await cropButton.click();

  const viewport = page.getByTestId("edited-viewport");
  const bounds = await viewport.boundingBox();
  if (!bounds) throw new Error("The edited pane has no layout box.");
  const start = { x: bounds.x + 60, y: bounds.y + 50 };
  const end = { x: bounds.x + 210, y: bounds.y + 170 };
  const overlay = page.locator(
    '[data-testid="edited-viewport"] [data-crop-overlay]',
  );

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
  await expect(page.locator("[data-crop-readout]")).toContainText(
    "viewport px",
  );
  const beforeNudge = await overlay
    .locator("[data-crop-rectangle]")
    .getAttribute("x");
  const beforeResize = await overlay
    .locator("[data-crop-rectangle]")
    .getAttribute("width");
  const handle = overlay.locator('[data-crop-handle="3"]');
  const handleBounds = await handle.boundingBox();
  if (!handleBounds) throw new Error("The crop resize handle is not visible.");
  await page.mouse.move(
    handleBounds.x + handleBounds.width / 2,
    handleBounds.y + handleBounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBounds.x + handleBounds.width / 2 - 12,
    handleBounds.y + handleBounds.height / 2 - 8,
  );
  await page.mouse.up();
  const afterResize = await overlay
    .locator("[data-crop-rectangle]")
    .getAttribute("width");
  expect(Number(afterResize)).toBe(Number(beforeResize) - 12);
  await overlay.focus();
  await page.keyboard.press("ArrowRight");
  const afterNudge = await overlay
    .locator("[data-crop-rectangle]")
    .getAttribute("x");
  expect(Number(afterNudge)).toBe(Number(beforeNudge) + 1);

  const original = page.locator('[data-pane-host="original"] svg');
  const edited = page.locator('[data-pane-host="edited"] svg');
  await page.getByRole("button", { name: "Apply crop" }).click();
  await expect(edited).not.toHaveAttribute("viewBox", "0 0 160 100");
  await expect(original).toHaveAttribute("viewBox", "0 0 160 100");
  await expect(edited.locator("rect")).toHaveCount(1);
});

test("Escape cancels a crop without changing the document", async ({
  page,
}) => {
  await page.goto("/tools/svg-editor/");
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "cancel-crop.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");
  await page.getByRole("button", { name: "Crop (visible area)" }).click();

  const viewport = page.getByTestId("edited-viewport");
  const bounds = await viewport.boundingBox();
  if (!bounds) throw new Error("The edited pane has no layout box.");
  await page.mouse.move(bounds.x + 50, bounds.y + 40);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 180, bounds.y + 140);
  await page.mouse.up();
  await expect(page.locator("[data-crop-overlay]")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.locator("[data-crop-overlay]")).toHaveCount(0);
  await expect(page.locator('[data-pane-host="edited"] svg')).toHaveAttribute(
    "viewBox",
    "0 0 160 100",
  );
});
