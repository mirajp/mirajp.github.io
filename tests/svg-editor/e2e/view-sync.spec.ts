import { expect, test } from "playwright/test";

const SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="tomato"/></svg>';

test("uploads both panes and keeps zoom and pan linked", async ({ page }) => {
  await page.goto("/tools/svg-editor/");
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "linked-view.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");

  const viewports = [
    page.getByTestId("original-viewport"),
    page.getByTestId("edited-viewport"),
  ];
  for (const viewport of viewports) {
    await expect(
      viewport.locator(
        'svg[data-pane-svg="original"], svg[data-pane-svg="edited"]',
      ),
    ).toHaveCount(1);
  }

  const originalBounds = await viewports[0].boundingBox();
  if (!originalBounds) throw new Error("The original pane has no layout box.");
  const cursor = {
    x: originalBounds.x + originalBounds.width / 2,
    y: originalBounds.y + originalBounds.height / 2,
  };
  await viewports[0].dispatchEvent("wheel", {
    deltaY: -180,
    clientX: cursor.x,
    clientY: cursor.y,
  });
  await expect
    .poll(async () =>
      (await paneTransforms(page)).map((transform) =>
        transform.endsWith("scale(1)"),
      ),
    )
    .toEqual([false, false]);
  const zoomedTransforms = await paneTransforms(page);
  expect(zoomedTransforms[0]).toBe(zoomedTransforms[1]);

  await viewports[0].dispatchEvent("pointerdown", {
    button: 1,
    pointerId: 19,
    clientX: cursor.x,
    clientY: cursor.y,
  });
  await page.evaluate(({ x, y }) => {
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        pointerId: 19,
        clientX: x + 36,
        clientY: y + 22,
      }),
    );
    document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 19 }));
  }, cursor);
  await expect
    .poll(async () => (await paneTransforms(page))[0])
    .not.toBe(zoomedTransforms[0]);
  const pannedTransforms = await paneTransforms(page);
  expect(pannedTransforms[0]).toBe(pannedTransforms[1]);
  expect(pannedTransforms[0]).not.toBe(zoomedTransforms[0]);
});

async function paneTransforms(page: import("playwright/test").Page) {
  return page.evaluate(() =>
    ["original", "edited"].map((pane) => {
      const host = document.querySelector<HTMLElement>(
        `[data-testid="${pane}-viewport"] [data-pane-host]`,
      );
      const svg = host?.shadowRoot?.querySelector<SVGElement>("svg");
      if (!svg) throw new Error(`The ${pane} SVG did not render.`);
      return svg.style.transform;
    }),
  );
}
