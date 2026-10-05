// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import type {
  DomParserAdapter,
  SourceMetadata,
  SvgDocument,
} from "../../../../src/components/tools/svg-editor/contracts";
import { parse } from "../../../../src/components/tools/svg-editor/io/parse";
import {
  exportSvg,
  serialize,
} from "../../../../src/components/tools/svg-editor/io/serialize";
import { fixtureManifest, getFixtureSource } from "../../corpus/loader";

const adapter: DomParserAdapter = {
  parseFromString(source, mimeType) {
    return new DOMParser().parseFromString(source, mimeType) as XMLDocument;
  },
};

function metadataFor(
  originalSource: string,
  sanitizedSource = originalSource,
  findings: SourceMetadata["sanitizationReport"]["findings"] = [],
): SourceMetadata {
  return {
    originalSource,
    sanitizedSource,
    originalVersion: 0,
    sanitizationReport: { findings },
  };
}

function semanticSignature(doc: SvgDocument): unknown {
  const orderedChildren = (id: string): unknown => {
    const node = doc.nodes.get(id);
    if (!node) throw new Error(`Missing node ${id}`);
    if (node.kind === "element") {
      const spacePreserved =
        node.attrs["xml:space"] === "preserve" ||
        (node.parent !== null && inheritedXmlSpace(node.parent));
      const children = node.children
        .map((childId) => doc.nodes.get(childId))
        .filter((child) => {
          if (!child || child.kind !== "text" || spacePreserved) return true;
          const parent = doc.nodes.get(child.parent);
          return !(
            parent?.kind === "element" &&
            parent.tag.toLowerCase() !== "text" &&
            parent.children.some((siblingId) => {
              const sibling = doc.nodes.get(siblingId);
              return sibling?.kind === "element";
            }) &&
            /^\s*$/.test(child.value)
          );
        })
        .map((child) => orderedChildren(child!.id));
      return {
        kind: node.kind,
        tag: node.tag,
        attrs: Object.fromEntries(
          Object.entries(node.attrs).filter(([name]) => name !== "style"),
        ),
        style: node.style,
        children,
      };
    }
    if (node.kind === "processing-instruction") {
      return { kind: node.kind, target: node.target, data: node.data };
    }
    return { kind: node.kind, value: node.value };
  };

  function inheritedXmlSpace(id: string): boolean {
    const node = doc.nodes.get(id);
    if (!node || node.kind !== "element") return false;
    if (node.attrs["xml:space"] === "preserve") return true;
    if (node.attrs["xml:space"] === "default") return false;
    return node.parent ? inheritedXmlSpace(node.parent) : false;
  }

  return {
    root: orderedChildren(doc.root),
    outsideRoot: Array.from(doc.nodes.entries())
      .map(([, node]) => node)
      .filter(
        (node) =>
          node.kind === "processing-instruction" && node.parent === null,
      )
      .map((node) =>
        node.kind === "processing-instruction"
          ? { target: node.target, data: node.data }
          : null,
      ),
  };
}

describe("SVG serializer and fidelity export", () => {
  it("exports every clean untouched corpus fixture byte-for-byte after BOM handling", () => {
    const entries = fixtureManifest.fixtures.filter(
      (entry) => entry.path.startsWith("corpus/") && !entry.malformed,
    );

    for (const entry of entries) {
      const source = getFixtureSource(entry);
      const { doc, metadata } = parse(source, adapter);
      const expected = source.replace(/^\uFEFF/, "");

      expect(
        exportSvg(doc, metadata, metadata.originalVersion),
        entry.path,
      ).toEqual({
        svg: expected,
        sanitized: false,
      });
    }
  });

  it("exports sanitized untouched input canonically and marks the result sanitized", () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>bad()</script><rect/></svg>';
    const { doc } = parse(
      '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>',
      adapter,
    );
    const metadata = metadataFor(source, serialize(doc), [
      { kind: "script", message: "Removed script element" },
    ]);

    expect(exportSvg(doc, metadata, metadata.originalVersion)).toEqual({
      svg: serialize(doc),
      sanitized: true,
    });
  });

  it("always uses canonical serialization after an edit", () => {
    const source = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const { doc } = parse(source, adapter);
    const metadata = metadataFor(source);
    expect(exportSvg(doc, metadata, metadata.originalVersion + 1)).toEqual({
      svg: serialize(doc),
      sanitized: false,
    });
  });

  it("preserves text whitespace and inherited xml:space preserve whitespace", () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg"><g xml:space="preserve"><rect/>\n  <text>  A \n B </text></g><text>\n  C\tD  </text></svg>';
    const { doc } = parse(source, adapter);
    const output = serialize(doc);

    expect(output).toContain(
      '<g xml:space="preserve"><rect/>\n  <text>  A \n B </text></g>',
    );
    expect(output).toContain("<text>\n  C\tD  </text>");
  });

  it("escapes text and attributes while retaining namespace-qualified attributes", () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><text data-note="A &amp; &quot;B&quot;" xlink:href="#shape">A &amp; B &lt; C</text></svg>';
    const first = parse(source, adapter).doc;
    const output = serialize(first);
    const second = parse(output, adapter).doc;

    expect(output).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(output).toContain('xlink:href="#shape"');
    expect(output).toContain('data-note="A &amp; &quot;B&quot;"');
    expect(semanticSignature(second)).toEqual(semanticSignature(first));
  });

  it("round-trips every well-formed corpus fixture to an equivalent model", () => {
    const entries = fixtureManifest.fixtures.filter(
      (entry) => entry.path.startsWith("corpus/") && !entry.malformed,
    );

    for (const entry of entries) {
      const source = getFixtureSource(entry).replace(/^\uFEFF/, "");
      const first = parse(source, adapter).doc;
      const canonical = serialize(first);
      const second = parse(canonical, adapter).doc;

      expect(semanticSignature(second), entry.path).toEqual(
        semanticSignature(first),
      );
    }
  });
});
