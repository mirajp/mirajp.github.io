import { expect, test } from "playwright/test";

const SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect id="target" width="120" height="80" fill="tomato"/></svg>';

async function installGeometryTestHook(page: import("playwright/test").Page) {
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
      __svgGeometryTest: {
        setRootAttributes(attrs: Record<string, string>) {
          store?.dispatch({
            id: "e2e-set-root-geometry",
            label: "Set root geometry",
            apply(document: {
              root: string;
              nodes: {
                get(
                  id: string,
                ): { kind: string; attrs?: Record<string, string> } | undefined;
                set(id: string, node: unknown): typeof document.nodes;
              };
            }) {
              const root = document.nodes.get(document.root);
              if (!root || root.kind !== "element" || !root.attrs) {
                throw new Error("SVG root is not an element");
              }
              return {
                ...document,
                nodes: document.nodes.set(document.root, {
                  ...root,
                  attrs: { ...root.attrs, ...attrs },
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

test("root size and viewBox changes render and support undo and redo", async ({
  page,
}) => {
  await page.goto("/tools/svg-editor/");
  await page.getByLabel("Choose an SVG file").setInputFiles({
    name: "geometry.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SOURCE),
  });
  await expect(page.getByRole("status")).toContainText("SVG loaded.");
  await installGeometryTestHook(page);

  await page.evaluate(() => {
    (
      window as typeof window & {
        __svgGeometryTest: {
          setRootAttributes(attrs: Record<string, string>): void;
        };
      }
    ).__svgGeometryTest.setRootAttributes({
      width: "240",
      height: "160",
      viewBox: "10 20 240 160",
      preserveAspectRatio: "xMaxYMax slice",
    });
  });

  const editedRoot = page.locator('[data-pane-host="edited"] svg');
  const originalRoot = page.locator('[data-pane-host="original"] svg');
  await expect(editedRoot).toHaveAttribute("width", "240");
  await expect(editedRoot).toHaveAttribute("viewBox", "10 20 240 160");
  await expect(editedRoot).toHaveAttribute(
    "preserveAspectRatio",
    "xMaxYMax slice",
  );
  await expect(originalRoot).toHaveAttribute("width", "120");

  await page.evaluate(() => {
    (
      window as typeof window & { __svgGeometryTest: { undo(): void } }
    ).__svgGeometryTest.undo();
  });
  await expect(editedRoot).toHaveAttribute("width", "120");

  await page.evaluate(() => {
    (
      window as typeof window & { __svgGeometryTest: { redo(): void } }
    ).__svgGeometryTest.redo();
  });
  await expect(editedRoot).toHaveAttribute("width", "240");
});
