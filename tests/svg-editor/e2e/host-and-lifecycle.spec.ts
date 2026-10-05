import { expect, test } from "playwright/test";

const SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><text x="2" y="30" fill="currentColor">isolated text</text></svg>';

test("host CSS does not change styles inside the pane shadow root", async ({
  page,
}) => {
  await page.goto("/__e2e/isolation/");
  const editor = page.getByRole("region", { name: "SVG editor" });
  await expect(editor).toBeVisible();

  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "isolation.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");

  const paneStyle = await page
    .getByTestId("edited-viewport")
    .evaluate((viewport) => {
      const svg = viewport
        .querySelector<HTMLElement>("[data-pane-host]")
        ?.shadowRoot?.querySelector<SVGElement>("svg");
      const text = svg?.querySelector("text");
      if (!svg || !text) throw new Error("Isolated SVG text did not render");
      const shadowRoot = svg.getRootNode() as ShadowRoot;
      return {
        font: getComputedStyle(text).fontFamily,
        fill: getComputedStyle(text).fill,
        hostColor: getComputedStyle(shadowRoot.host).color,
      };
    });
  expect(paneStyle.font).not.toContain("monospace");
  expect(paneStyle.fill).not.toBe("rgb(208, 0, 128)");
  expect(paneStyle.hostColor).not.toBe("rgb(208, 0, 128)");
});

test("editor keystrokes do not open the CommandPalette, but host keystrokes do", async ({
  page,
}) => {
  await page.goto("/__e2e/isolation/");
  const editor = page.getByRole("region", { name: "SVG editor" });
  await expect(editor).toBeVisible();

  await page.getByLabel("Choose an SVG file").focus();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Quick navigation" }),
  ).toBeHidden();

  await page.locator("h1").click();
  await page.keyboard.press("Control+k");
  await expect(
    page.getByRole("dialog", { name: "Quick navigation" }),
  ).toBeVisible();
});

test("unmounting and remounting leaves no duplicate listeners or Blob URLs", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const listeners: Array<{
      target: EventTarget;
      type: string;
      listener: EventListenerOrEventListenerObject;
      capture: boolean;
    }> = [];
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (listener) {
        const capture =
          typeof options === "boolean" ? options : Boolean(options?.capture);
        if (
          !listeners.some(
            (entry) =>
              entry.target === this &&
              entry.type === type &&
              entry.listener === listener &&
              entry.capture === capture,
          )
        ) {
          listeners.push({ target: this, type, listener, capture });
        }
      }
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      const capture =
        typeof options === "boolean" ? options : Boolean(options?.capture);
      const index = listeners.findIndex(
        (entry) =>
          entry.target === this &&
          entry.type === type &&
          entry.listener === listener &&
          entry.capture === capture,
      );
      if (index >= 0) listeners.splice(index, 1);
      return remove.call(this, type, listener, options);
    };

    const createObjectURL = URL.createObjectURL.bind(URL);
    const revokeObjectURL = URL.revokeObjectURL.bind(URL);
    const created: string[] = [];
    const revoked: string[] = [];
    URL.createObjectURL = (object) => {
      const url = createObjectURL(object);
      created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url) => {
      revoked.push(url);
      revokeObjectURL(url);
    };
    Object.assign(window, {
      __svgLifecycleCounts: () => {
        const host = document.getElementById("editor-host");
        return {
          active: listeners.filter(
            ({ target }) => target instanceof Node && host?.contains(target),
          ).length,
          created: [...created],
          revoked: [...revoked],
        };
      },
    });
  });
  await page.goto("/__e2e/lifecycle/");
  await expect(page.getByRole("region", { name: "SVG editor" })).toBeVisible();
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "lifecycle.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export SVG" }).click();
  await downloadPromise;
  const before = await getLifecycleCounts(page);
  expect(before.created.length).toBeGreaterThan(0);
  expect(before.active).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Unmount editor" }).click();
  await expect(page.locator("#editor-host astro-island")).toHaveCount(0);
  const unmounted = await getLifecycleCounts(page);
  expect(unmounted.active).toBe(0);
  expect(unmounted.revoked).toEqual(expect.arrayContaining(before.created));

  await page.getByRole("button", { name: "Remount editor" }).click();
  await expect(page.getByRole("region", { name: "SVG editor" })).toBeVisible();
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "lifecycle.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");
  const remounted = await getLifecycleCounts(page);
  expect(remounted.active).toBe(before.active);
  await expect(page.locator("#editor-host astro-island")).toHaveCount(1);
});

async function getLifecycleCounts(page: import("playwright/test").Page) {
  return page.evaluate(() =>
    (
      window as typeof window & {
        __svgLifecycleCounts: () => {
          active: number;
          created: string[];
          revoked: string[];
        };
      }
    ).__svgLifecycleCounts(),
  );
}
