// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fixtureManifest, getFixtureSource } from "../../corpus/loader";
import type { DomParserAdapter } from "../../../../src/components/tools/svg-editor/contracts";
import {
  SvgParseError,
  parse,
  parseDocument,
} from "../../../../src/components/tools/svg-editor/io/parse";

const domParserAdapter: DomParserAdapter = {
  parseFromString(source, mimeType) {
    return new DOMParser().parseFromString(source, mimeType) as XMLDocument;
  },
};

describe("SVG parser and normalizer", () => {
  it("loads every well-formed corpus fixture into a connected document model", () => {
    const entries = fixtureManifest.fixtures.filter(
      (entry) => entry.path.startsWith("corpus/") && !entry.malformed,
    );

    for (const entry of entries) {
      const source = getFixtureSource(entry).replace(/^\uFEFF/, "");
      const { doc, metadata } = parse(source, domParserAdapter);
      const root = doc.nodes.get(doc.root);

      expect(root?.kind, entry.path).toBe("element");
      expect(root?.kind === "element" && root.tag, entry.path).toBe("svg");
      expect(doc.nodes.size, entry.path).toBeGreaterThan(1);
      expect(doc.nodes.size, entry.path).toBeLessThan(source.length + 1);
      expect(metadata.originalSource, entry.path).toBe(source);
      expect(metadata.sanitizedSource, entry.path).toBe(source);
      expect(metadata.originalVersion, entry.path).toBe(0);
    }
  });

  it("preserves element attribute order and parses inline declarations with importance", () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect id="r" width="3" fill="purple" style="fill: red; stroke: rgb(1, 2, 3) !important; --tone: blue"/></svg>';
    const { doc } = parse(source, domParserAdapter);
    const rect = Array.from(doc.nodes.entries())
      .map(([, node]) => node)
      .find((node) => node.kind === "element" && node.tag === "rect");

    expect(rect?.kind).toBe("element");
    if (rect?.kind !== "element") return;
    expect(Object.keys(rect.attrs)).toEqual(["id", "width", "fill", "style"]);
    expect(rect.attrs.fill).toBe("purple");
    expect(rect.style).toEqual({
      fill: { value: "red", important: false },
      stroke: { value: "rgb(1, 2, 3)", important: true },
      "--tone": { value: "blue", important: false },
    });
  });

  it("preserves comments and processing instructions as model nodes", () => {
    const source = getFixtureSource(
      fixtureManifest.fixtures.find(
        (entry) => entry.path === "corpus/icon-license-comment.svg",
      )!,
    );
    const { doc } = parse(source, domParserAdapter);
    const nodes = Array.from(doc.nodes.entries()).map(([, node]) => node);

    expect(
      nodes.some(
        (node) => node.kind === "comment" && /license/i.test(node.value),
      ),
    ).toBe(true);
    const piSource =
      '<?xml-stylesheet type="text/css" href="#embedded"?><svg xmlns="http://www.w3.org/2000/svg"><text>words</text></svg>';
    const { doc: piDoc } = parse(piSource, domParserAdapter);
    const piNodes = Array.from(piDoc.nodes.entries()).map(([, node]) => node);
    expect(piNodes).toContainEqual(
      expect.objectContaining({
        kind: "processing-instruction",
        target: "xml-stylesheet",
        data: 'type="text/css" href="#embedded"',
        parent: null,
      }),
    );
  });

  it("preserves style elements without parsing them and records one unsupported entry", () => {
    const { doc } = parse(
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.x{fill:red}</style><rect class="x"/></svg>',
      domParserAdapter,
    );
    const stylesheets = doc.unsupported.filter(
      (entry) => entry.kind === "stylesheet",
    );

    expect(stylesheets).toHaveLength(1);
    expect(stylesheets[0].message).toMatch(/not yet processed/i);
    expect(doc.retainedSheets).toEqual([]);
    expect(
      Array.from(doc.nodes.entries()).some(
        ([, node]) => node.kind === "element" && node.tag === "style",
      ),
    ).toBe(true);
  });

  it("surfaces malformed corpus XML as a typed error", () => {
    const malformed = fixtureManifest.fixtures.find(
      (entry) => entry.path === "corpus/malformed-xml.svg",
    );
    expect(malformed).toBeDefined();
    expect(() => parse(getFixtureSource(malformed!), domParserAdapter)).toThrow(
      SvgParseError,
    );
  });

  it("records original and sanitized source independently", () => {
    const original = '\uFEFF<svg xmlns="http://www.w3.org/2000/svg"/>';
    const sanitized = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const { metadata } = parse(sanitized, domParserAdapter, original);

    expect(metadata.originalSource).toBe(sanitized);
    expect(metadata.sanitizedSource).toBe(sanitized);
  });

  it("exposes the frozen Parser contract as a document-only adapter", () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg"/>';
    const doc = parseDocument(source, domParserAdapter);

    expect(doc.root).toBeDefined();
    expect(doc.nodes.get(doc.root)?.kind).toBe("element");
  });
});
