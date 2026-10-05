import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "playwright/test";

interface SecurityManifest {
  fixtures: Array<{
    path: string;
    malformed?: boolean;
    tags: string[];
  }>;
}

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../../..");
const fixtureRoot = path.join(repositoryRoot, "tests/svg-editor/fixtures");
const manifest = JSON.parse(
  readFileSync(path.join(fixtureRoot, "manifest.json"), "utf8"),
) as SecurityManifest;
const securityFixtures = manifest.fixtures.filter((fixture) =>
  fixture.path.startsWith("security/"),
);

test("every security fixture is inert and causes no unexpected network request", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { __svgEditorSecurityCanary: 0 });
    window.alert = () => {
      (
        window as typeof window & { __svgEditorSecurityCanary: number }
      ).__svgEditorSecurityCanary += 1;
    };
  });
  await page.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === "http://127.0.0.1:4321") {
      await route.continue();
      return;
    }
    await route.abort();
  });
  page.on("dialog", (dialog) => void dialog.dismiss());
  await page.goto("/tools/svg-editor/");

  const unexpectedRequests: string[] = [];
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (requestUrl.origin !== "http://127.0.0.1:4321") {
      unexpectedRequests.push(request.url());
    }
  });

  for (const fixture of securityFixtures) {
    const fixturePath = path.join(fixtureRoot, fixture.path);
    await page.getByLabel("Choose an SVG file").setInputFiles(fixturePath);
    if (fixture.malformed && fixture.path.endsWith("/malformed.svg")) {
      await expect(page.getByRole("alert")).toBeVisible();
    } else {
      await expect(page.getByRole("status")).toContainText(
        /SVG loaded|unsafe item/i,
      );
    }

    await page.evaluate(() => {
      window.dispatchEvent(new Event("load"));
      document
        .querySelector("[data-svg-editor]")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(
      await page.evaluate(
        () =>
          (
            window as typeof window & {
              __svgEditorSecurityCanary: number;
            }
          ).__svgEditorSecurityCanary,
      ),
      fixture.path,
    ).toBe(0);
    expect(unexpectedRequests, fixture.path).toEqual([]);
  }
});
