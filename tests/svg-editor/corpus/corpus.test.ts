import { describe, expect, it } from "vitest";
import {
  fixtureManifest,
  fixtureModulePath,
  fixtureModules,
  getFixtureSource,
  validateFixtureManifest,
} from "./loader";

describe("SVG fixture corpus manifest", () => {
  it("references an existing fixture for every entry", () => {
    expect(
      validateFixtureManifest(fixtureManifest, Object.keys(fixtureModules)),
    ).toEqual([]);
    expect(
      fixtureManifest.fixtures.filter((entry) =>
        entry.path.startsWith("corpus/"),
      ),
    ).toHaveLength(35);
    expect(
      fixtureManifest.fixtures.filter((entry) =>
        entry.path.startsWith("security/"),
      ),
    ).toHaveLength(17);
  });

  it("parses each well-formed fixture as XML and marks malformed inputs", () => {
    for (const entry of fixtureManifest.fixtures) {
      const source = getFixtureSource(entry).replace(/^\uFEFF/, "");
      const document = new DOMParser().parseFromString(source, "image/svg+xml");
      const hasParserError =
        document.getElementsByTagName("parsererror").length > 0;

      if (entry.malformed) {
        expect(hasParserError, `${entry.path} should be malformed`).toBe(true);
      } else {
        expect(hasParserError, `${entry.path} should parse as XML`).toBe(false);
        expect(document.documentElement.localName, entry.path).toBe("svg");
        expect(document.documentElement.namespaceURI, entry.path).toBe(
          "http://www.w3.org/2000/svg",
        );
      }
      expect(fixtureModulePath(entry)).toContain("../fixtures/");
    }
  });
});
