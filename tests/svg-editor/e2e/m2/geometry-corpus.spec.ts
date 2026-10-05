import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "playwright/test";

interface M2Fixture {
  path: string;
  m2: { viewBox: [number, number, number, number] };
}

interface Fixture {
  path: string;
  m2?: M2Fixture["m2"];
}

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../../../..");
const fixtureRoot = path.join(repositoryRoot, "tests/svg-editor/fixtures");
const manifest = JSON.parse(
  readFileSync(path.join(fixtureRoot, "manifest.json"), "utf8"),
) as { fixtures: Fixture[] };
const geometryFixtures = manifest.fixtures.filter(
  (fixture): fixture is M2Fixture =>
    fixture.path.startsWith("corpus/") && fixture.m2 !== undefined,
);

async function installM2TestHook(
  page: import("playwright/test").Page,
  originalSource: string,
  expectedAttrs: Record<string, string>,
) {
  await page.evaluate(
    ({ source, attrs }) => {
      const editor = document.querySelector<HTMLElement>("[data-svg-editor]");
      if (!editor) throw new Error("Editor root was not mounted");
      const fiberKey = Object.keys(editor).find((key) =>
        key.startsWith("__reactFiber$"),
      );
      if (!fiberKey)
        throw new Error("React fiber was not found on editor root");

      let fiber = (editor as HTMLElement & Record<string, unknown>)[
        fiberKey
      ] as {
        return?: unknown;
        memoizedProps?: {
          store?: { dispatch: (command: unknown) => void };
        };
      } | null;
      let store: { dispatch: (command: unknown) => void } | undefined;
      while (fiber) {
        if (fiber.memoizedProps?.store) {
          store = fiber.memoizedProps.store;
          break;
        }
        fiber = fiber.return as typeof fiber;
      }
      if (!store) throw new Error("Editor store was not found in React fibers");

      const setRootAttributes = (nextAttrs: Record<string, string>) => {
        store!.dispatch({
          id: "m2-set-root-geometry",
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
                attrs: { ...root.attrs, ...nextAttrs },
              }),
            };
          },
        });
      };

      let swapReference: ((show: boolean) => void) | null = null;
      Object.assign(window, {
        __m2GeometryTest: {
          setRootAttributes,
          installReference() {
            const editedRoot = document
              .querySelector<HTMLElement>('[data-pane-host="edited"]')
              ?.shadowRoot?.querySelector<SVGSVGElement>("svg");
            const paneHost = document.querySelector<HTMLElement>(
              '[data-pane-host="edited"]',
            );
            const container = paneHost?.shadowRoot?.querySelector<HTMLElement>(
              "[data-pane-container]",
            );
            if (!editedRoot || !container) {
              throw new Error("The edited SVG renderer is not mounted");
            }

            const parsed = new DOMParser().parseFromString(
              source,
              "image/svg+xml",
            );
            const referenceSvg =
              parsed.documentElement as unknown as SVGSVGElement;
            for (const [name, value] of Object.entries(attrs)) {
              referenceSvg.setAttribute(name, value);
            }
            referenceSvg.setAttribute("data-reference-svg", "");
            referenceSvg.style.transform = editedRoot.style.transform;
            referenceSvg.style.transformOrigin =
              editedRoot.style.transformOrigin;
            referenceSvg.style.transformBox = editedRoot.style.transformBox;
            const importedReference = document.importNode(referenceSvg, true);
            swapReference = (show) => {
              if (show) editedRoot.replaceWith(importedReference);
              else importedReference.replaceWith(editedRoot);
            };
          },
          showReference(show: boolean) {
            if (!swapReference) {
              throw new Error("Install the reference SVG before swapping it.");
            }
            swapReference(show);
          },
        },
      });
    },
    { source: originalSource, attrs: expectedAttrs },
  );
}

async function compareRenderedSvg(
  page: import("playwright/test").Page,
  viewport: import("playwright/test").Locator,
) {
  const clip = await viewport.boundingBox();
  if (!clip) throw new Error("The edited viewport has no layout box.");
  const actualPng = await page.screenshot({ clip });
  await page.evaluate(() => {
    (
      window as typeof window & {
        __m2GeometryTest: { showReference(show: boolean): void };
      }
    ).__m2GeometryTest.showReference(true);
  });
  let referencePng: Buffer;
  try {
    referencePng = await page.screenshot({ clip });
  } finally {
    await page.evaluate(() => {
      (
        window as typeof window & {
          __m2GeometryTest: { showReference(show: boolean): void };
        }
      ).__m2GeometryTest.showReference(false);
    });
  }
  expect(actualPng.equals(referencePng)).toBe(true);
}

test.describe("M2 geometry against awkward corpus fixtures", () => {
  for (const fixture of geometryFixtures) {
    const id = path.basename(fixture.path, ".svg");
    test(`${id}: resize, set viewBox, crop, export and re-import`, async ({
      page,
    }, testInfo) => {
      const sourcePath = path.join(fixtureRoot, fixture.path);
      const originalSource = readFileSync(sourcePath, "utf8");
      const [x, y, width, height] = fixture.m2.viewBox;
      const expanded = [x - 5, y - 4, width + 10, height + 8] as const;
      const cropped = [
        expanded[0] + expanded[2] * 0.2,
        expanded[1] + expanded[3] * 0.15,
        expanded[2] * 0.65,
        expanded[3] * 0.7,
      ] as const;
      const expectedAttrs = {
        width: "240",
        height: "160",
        viewBox: cropped.map((value) => Number(value.toFixed(6))).join(" "),
      };

      await page.goto("/tools/svg-editor/");
      await page.getByLabel("Choose an SVG file").setInputFiles(sourcePath);
      await expect(page.getByRole("status")).toContainText("SVG loaded.");
      await installM2TestHook(page, originalSource, expectedAttrs);

      const setRootAttributes = async (attrs: Record<string, string>) =>
        page.evaluate((values) => {
          (
            window as typeof window & {
              __m2GeometryTest: {
                setRootAttributes(next: Record<string, string>): void;
              };
            }
          ).__m2GeometryTest.setRootAttributes(values);
        }, attrs);

      await setRootAttributes({ width: "240", height: "160" });
      await setRootAttributes({
        viewBox: expanded.map((value) => Number(value.toFixed(6))).join(" "),
      });
      await setRootAttributes({ viewBox: expectedAttrs.viewBox });

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export SVG" }).click();
      const download = await downloadPromise;
      const exportedPath = testInfo.outputPath(`m2-${id}.svg`);
      await download.saveAs(exportedPath);
      const exportedSource = readFileSync(exportedPath, "utf8");
      const exportedAttrs = await page.evaluate((serialized) => {
        const parsed = new DOMParser().parseFromString(
          serialized,
          "image/svg+xml",
        );
        const root = parsed.documentElement;
        return {
          width: root.getAttribute("width"),
          height: root.getAttribute("height"),
          viewBox: root.getAttribute("viewBox"),
          parserError: root.localName === "parsererror",
        };
      }, exportedSource);
      expect(exportedAttrs).toEqual({
        ...expectedAttrs,
        parserError: false,
      });

      await page.getByLabel("Choose an SVG file").setInputFiles(exportedPath);
      await expect(page.getByRole("status")).toContainText("SVG loaded.");
      const editedSvg = page.locator(
        '[data-pane-host="edited"] svg[data-pane-svg="edited"]',
      );
      await expect(editedSvg).toHaveAttribute("width", expectedAttrs.width);
      await expect(editedSvg).toHaveAttribute("height", expectedAttrs.height);
      await expect(editedSvg).toHaveAttribute("viewBox", expectedAttrs.viewBox);

      await page.evaluate(() => {
        (
          window as typeof window & {
            __m2GeometryTest: {
              installReference(): unknown;
              showReference(show: boolean): void;
            };
          }
        ).__m2GeometryTest.installReference();
      });
      await compareRenderedSvg(page, page.getByTestId("edited-viewport"));

      const resizedCropScreenshot = await editedSvg.screenshot({
        animations: "disabled",
      });
      const baselinePath = path.join(
        testDirectory,
        "baselines",
        `${id}-resized-cropped.png`,
      );
      if (process.env.UPDATE_M2_BASELINES === "1") {
        mkdirSync(path.dirname(baselinePath), { recursive: true });
        writeFileSync(baselinePath, resizedCropScreenshot);
      } else {
        if (!existsSync(baselinePath)) {
          throw new Error(
            `Missing M2 visual baseline ${baselinePath}. Run UPDATE_M2_BASELINES=1 yarn e2e tests/svg-editor/e2e/m2/geometry-corpus.spec.ts on Linux to update it.`,
          );
        }
        expect(resizedCropScreenshot.equals(readFileSync(baselinePath))).toBe(
          true,
        );
      }
    });
  }
});
