import { expect, test } from "playwright/test";

const SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect id="target" width="120" height="80" fill="tomato"/></svg>';

async function installStoreTestHook(page: import("playwright/test").Page) {
  await page.evaluate(() => {
    const editor = document.querySelector<HTMLElement>("[data-svg-editor]");
    if (!editor) throw new Error("Editor root was not mounted");
    const fiberKey = Object.keys(editor).find((key) =>
      key.startsWith("__reactFiber$"),
    );
    if (!fiberKey) throw new Error("React fiber was not found on editor root");

    let fiber = (editor as HTMLElement & Record<string, unknown>)[fiberKey] as {
      return?: unknown;
      memoizedProps?: {
        store?: {
          dispatch: (command: unknown) => void;
          undo: () => void;
          redo: () => void;
        };
      };
    } | null;
    let store:
      | {
          dispatch: (command: unknown) => void;
          undo: () => void;
          redo: () => void;
        }
      | undefined;
    while (fiber) {
      if (fiber.memoizedProps?.store) {
        store = fiber.memoizedProps.store;
        break;
      }
      fiber = fiber.return as typeof fiber;
    }
    if (!store) throw new Error("Editor store was not found in React fibers");

    Object.assign(window, {
      __svgEditorTest: {
        setAttr(nodeId: string, name: string, value: string) {
          store?.dispatch({
            id: "e2e-set-attr",
            label: `Set ${name}`,
            apply(document: {
              nodes: {
                get(
                  id: string,
                ): { kind: string; attrs?: Record<string, string> } | undefined;
                set(id: string, node: unknown): typeof document.nodes;
              };
            }) {
              const node = document.nodes.get(nodeId);
              if (!node || node.kind !== "element" || !node.attrs) {
                throw new Error(`Node ${nodeId} is not an SVG element`);
              }
              return {
                ...document,
                nodes: document.nodes.set(nodeId, {
                  ...node,
                  attrs: { ...node.attrs, [name]: value },
                }),
              };
            },
          });
        },
        undo: () => store?.undo(),
        redo: () => store?.redo(),
      },
    });
  });
}

test("SetAttr, undo, redo, export, and re-import preserve the edited result", async ({
  page,
}) => {
  await page.goto("/tools/svg-editor/");
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "round-trip.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");
  await installStoreTestHook(page);

  const getFill = () =>
    page
      .getByTestId("edited-viewport")
      .locator("svg")
      .locator("rect")
      .getAttribute("fill");
  await page.evaluate(() => {
    (
      window as typeof window & {
        __svgEditorTest: {
          setAttr: (id: string, name: string, value: string) => void;
        };
      }
    ).__svgEditorTest.setAttr("n1", "fill", "#2357d8");
  });
  await expect.poll(getFill).toBe("#2357d8");

  await page.evaluate(() => {
    (
      window as typeof window & {
        __svgEditorTest: { undo: () => void };
      }
    ).__svgEditorTest.undo();
  });
  await expect.poll(getFill).toBe("tomato");

  await page.evaluate(() => {
    (
      window as typeof window & {
        __svgEditorTest: { redo: () => void };
      }
    ).__svgEditorTest.redo();
  });
  await expect.poll(getFill).toBe("#2357d8");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export SVG" }).click();
  const download = await downloadPromise;
  const exported = await download.createReadStream();
  if (!exported) throw new Error("Export did not produce a readable file");
  let serialized = "";
  for await (const chunk of exported) serialized += chunk.toString();
  expect(serialized).toContain('fill="#2357d8"');

  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "re-imported.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(serialized),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");
  await expect(page.getByTestId("edited-viewport").locator("svg")).toHaveCount(
    1,
  );
  await expect(
    page.getByTestId("edited-viewport").locator('rect[fill="#2357d8"]'),
  ).toHaveAttribute("fill", "#2357d8");
  await expect.poll(getFill).toBe("#2357d8");
});
