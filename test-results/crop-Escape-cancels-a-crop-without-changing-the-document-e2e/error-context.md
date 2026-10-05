# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ../../tests/svg-editor/e2e/crop.spec.ts >> Escape cancels a crop without changing the document
- Location: tests/svg-editor/e2e/crop.spec.ts:80:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Crop (visible area)' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link "Miraj Patel" [ref=e5] [cursor=pointer]:
        - /url: /
      - navigation "Primary" [ref=e6]:
        - link "About" [ref=e7] [cursor=pointer]:
          - /url: /about/
        - link "Blog" [ref=e8] [cursor=pointer]:
          - /url: /blog/
        - link "Photos" [ref=e9] [cursor=pointer]:
          - /url: /photos/
        - link "Projects" [ref=e10] [cursor=pointer]:
          - /url: /projects/
        - link "Resume" [ref=e11] [cursor=pointer]:
          - /url: /resume/
        - link "Tools" [ref=e12] [cursor=pointer]:
          - /url: /tools/
      - generic [ref=e13]:
        - button "Search Ctrl + K" [ref=e14]:
          - generic [ref=e18]: Search
          - generic [ref=e19]: Ctrl + K
        - button "Toggle color theme" [ref=e20]
  - main [ref=e24]:
    - generic [ref=e25]:
      - link "← All tools" [ref=e26] [cursor=pointer]:
        - /url: /tools/
      - paragraph [ref=e27]: Tools
      - heading "SVG Editor" [level=1] [ref=e28]
      - paragraph [ref=e29]: Inspect and edit SVG files in your browser.
      - region "SVG editor" [ref=e31]:
        - generic [ref=e32]:
          - generic [ref=e33]:
            - heading "SVG editor" [level=2] [ref=e34]
            - paragraph [ref=e35]: Work with a safe, local copy. Your file stays in this browser.
          - generic [ref=e36]: 2 nodes
        - generic [ref=e37]:
          - button "Choose an SVG file" [ref=e38]
          - button "Choose SVG" [ref=e39]
          - generic [ref=e40]: cancel-crop.svg
        - toolbar "SVG view and export tools" [ref=e41]:
          - button "Fit" [ref=e42]
          - button "100%" [ref=e43]
          - button "Zoom in" [ref=e44]: +
          - generic "Zoom level" [ref=e45]: 100%
          - button "Zoom out" [ref=e46]: −
          - button "Link views" [pressed] [ref=e48]
          - button "Copy source" [ref=e49]
          - button "Export SVG" [ref=e50]
        - generic [ref=e51]:
          - region "Original SVG pane" [ref=e52]:
            - generic [ref=e53]:
              - heading "Original" [level=3] [ref=e54]
              - generic [ref=e55]: Sanitized source
          - region "Edited SVG pane" [ref=e61]:
            - generic [ref=e62]:
              - heading "Edited" [level=3] [ref=e63]
              - generic [ref=e64]: Working copy
        - status [ref=e70]: SVG loaded.
  - contentinfo [ref=e71]:
    - generic [ref=e73]:
      - generic [ref=e74]:
        - paragraph [ref=e75]: Miraj Patel
        - paragraph [ref=e76]: Hello, world.
        - paragraph [ref=e77]: © 2026 Miraj Patel. Built with Astro (and Claude).
      - generic [ref=e78]:
        - paragraph [ref=e79]:
          - link "GitHub" [ref=e80] [cursor=pointer]:
            - /url: https://github.com/mirajp
          - link "LinkedIn" [ref=e81] [cursor=pointer]:
            - /url: https://www.linkedin.com/in/mirajp
        - paragraph [ref=e82]:
          - link "Colophon" [ref=e83] [cursor=pointer]:
            - /url: /colophon/
```

# Test source

```ts
  1   | import { expect, test } from "playwright/test";
  2   | 
  3   | const SOURCE =
  4   |   '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="100" viewBox="0 0 160 100"><rect width="160" height="100" fill="tomato"/></svg>';
  5   | 
  6   | test("crop changes only the visible viewBox and is keyboard adjustable", async ({
  7   |   page,
  8   | }) => {
  9   |   await page.goto("/tools/svg-editor/");
  10  |   await page.getByLabel("Choose an SVG file").setInputFiles({
  11  |     name: "crop.svg",
  12  |     mimeType: "image/svg+xml",
  13  |     buffer: Buffer.from(SOURCE),
  14  |   });
  15  |   await expect(page.getByRole("status")).toContainText("SVG loaded.");
  16  | 
  17  |   const cropButton = page.getByRole("button", {
  18  |     name: "Crop (visible area)",
  19  |   });
  20  |   await expect(cropButton).toHaveAttribute(
  21  |     "title",
  22  |     "Changes the viewBox; it does not delete any SVG geometry.",
  23  |   );
  24  |   await cropButton.click();
  25  | 
  26  |   const viewport = page.getByTestId("edited-viewport");
  27  |   const bounds = await viewport.boundingBox();
  28  |   if (!bounds) throw new Error("The edited pane has no layout box.");
  29  |   const start = { x: bounds.x + 60, y: bounds.y + 50 };
  30  |   const end = { x: bounds.x + 210, y: bounds.y + 170 };
  31  |   const overlay = page.locator(
  32  |     '[data-testid="edited-viewport"] [data-crop-overlay]',
  33  |   );
  34  | 
  35  |   await page.mouse.move(start.x, start.y);
  36  |   await page.mouse.down();
  37  |   await page.mouse.move(end.x, end.y);
  38  |   await page.mouse.up();
  39  |   await expect(page.locator("[data-crop-readout]")).toContainText(
  40  |     "viewport px",
  41  |   );
  42  |   const beforeNudge = await overlay
  43  |     .locator("[data-crop-rectangle]")
  44  |     .getAttribute("x");
  45  |   const beforeResize = await overlay
  46  |     .locator("[data-crop-rectangle]")
  47  |     .getAttribute("width");
  48  |   const handle = overlay.locator('[data-crop-handle="3"]');
  49  |   const handleBounds = await handle.boundingBox();
  50  |   if (!handleBounds) throw new Error("The crop resize handle is not visible.");
  51  |   await page.mouse.move(
  52  |     handleBounds.x + handleBounds.width / 2,
  53  |     handleBounds.y + handleBounds.height / 2,
  54  |   );
  55  |   await page.mouse.down();
  56  |   await page.mouse.move(
  57  |     handleBounds.x + handleBounds.width / 2 - 12,
  58  |     handleBounds.y + handleBounds.height / 2 - 8,
  59  |   );
  60  |   await page.mouse.up();
  61  |   const afterResize = await overlay
  62  |     .locator("[data-crop-rectangle]")
  63  |     .getAttribute("width");
  64  |   expect(Number(afterResize)).toBe(Number(beforeResize) - 12);
  65  |   await overlay.focus();
  66  |   await page.keyboard.press("ArrowRight");
  67  |   const afterNudge = await overlay
  68  |     .locator("[data-crop-rectangle]")
  69  |     .getAttribute("x");
  70  |   expect(Number(afterNudge)).toBe(Number(beforeNudge) + 1);
  71  | 
  72  |   const original = page.locator('[data-pane-host="original"] svg');
  73  |   const edited = page.locator('[data-pane-host="edited"] svg');
  74  |   await page.getByRole("button", { name: "Apply crop" }).click();
  75  |   await expect(edited).not.toHaveAttribute("viewBox", "0 0 160 100");
  76  |   await expect(original).toHaveAttribute("viewBox", "0 0 160 100");
  77  |   await expect(edited.locator("rect")).toHaveCount(1);
  78  | });
  79  | 
  80  | test("Escape cancels a crop without changing the document", async ({
  81  |   page,
  82  | }) => {
  83  |   await page.goto("/tools/svg-editor/");
  84  |   await page.getByLabel("Choose an SVG file").setInputFiles({
  85  |     name: "cancel-crop.svg",
  86  |     mimeType: "image/svg+xml",
  87  |     buffer: Buffer.from(SOURCE),
  88  |   });
  89  |   await expect(page.getByRole("status")).toContainText("SVG loaded.");
> 90  |   await page.getByRole("button", { name: "Crop (visible area)" }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  91  | 
  92  |   const viewport = page.getByTestId("edited-viewport");
  93  |   const bounds = await viewport.boundingBox();
  94  |   if (!bounds) throw new Error("The edited pane has no layout box.");
  95  |   await page.mouse.move(bounds.x + 50, bounds.y + 40);
  96  |   await page.mouse.down();
  97  |   await page.mouse.move(bounds.x + 180, bounds.y + 140);
  98  |   await page.mouse.up();
  99  |   await expect(page.locator("[data-crop-overlay]")).toBeVisible();
  100 |   await page.keyboard.press("Escape");
  101 | 
  102 |   await expect(page.locator("[data-crop-overlay]")).toHaveCount(0);
  103 |   await expect(page.locator('[data-pane-host="edited"] svg')).toHaveAttribute(
  104 |     "viewBox",
  105 |     "0 0 160 100",
  106 |   );
  107 | });
  108 | 
```