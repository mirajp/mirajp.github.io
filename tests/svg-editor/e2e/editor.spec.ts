import { expect, test } from "playwright/test";

test("serves the SVG editor page from the production build", async ({
  page,
}) => {
  const response = await page.goto("/tools/svg-editor/");
  if (!response) throw new Error("The built SVG editor page did not respond.");
  const source = await response.text();
  expect(source).toContain("Loading SVG editor…");
  expect(source).toContain("<astro-island");
  await expect(
    page.getByRole("heading", { level: 1, name: "SVG Editor" }),
  ).toBeVisible();
  const policy = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute("content");
  expect(policy).toContain("script-src 'self' 'sha256-");
  expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
  expect(policy).toContain("connect-src 'none'");
  expect(policy).toContain("img-src 'self' data: blob:");
});
