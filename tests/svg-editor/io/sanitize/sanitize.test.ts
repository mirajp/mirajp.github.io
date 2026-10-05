import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { fixtureManifest, getFixtureSource } from "../../corpus/loader";
import {
  MalformedSvgError,
  sanitize,
} from "../../../../src/components/tools/svg-editor/io/sanitize";

const testWindow = new JSDOM("").window;
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: testWindow,
});

const expectedSecurityRemovals: Record<string, RegExp[]> = {
  "security/script-element.svg": [/script/i],
  "security/event-attributes.svg": [/onload/i, /onclick/i, /onbegin/i],
  "security/javascript-href.svg": [/javascript/i],
  "security/external-xlink.svg": [/external or unsafe href/i],
  "security/foreign-object.svg": [/foreignobject/i, /<script/i],
  "security/css-import.svg": [/@import/i],
  "security/css-external-url.svg": [/url\(/i],
  "security/smil-animate-href.svg": [/animate.*href/i],
  "security/smil-set-xlink.svg": [/set.*href/i],
  "security/entity-expansion.svg": [/doctype/i],
  "security/malformed.svg": [/unsafe script content/i],
  "security/odd-data-svg.svg": [/data:image\/svg\+xml/i],
  "security/odd-data-font-context.svg": [/data:image\/png/i],
  "security/data-url-whitespace.svg": [/data:image\/png/i],
  "security/css-inline-external.svg": [/url\(/i],
  "security/href-protocol-relative.svg": [/external or unsafe href/i],
  "security/javascript-xlink.svg": [/javascript/i],
};

const expectedSecurityPreservation: Record<string, RegExp[]> = {
  "security/script-element.svg": [/<rect\b/i],
  "security/event-attributes.svg": [/<rect\b[^>]*width="1"/i],
  "security/javascript-href.svg": [/click/i],
  "security/external-xlink.svg": [/<image\b[^>]*width="1"/i],
  "security/foreign-object.svg": [/<circle\b/i],
  "security/css-import.svg": [/\.x\s*\{\s*fill:red/i, /<rect\b/i],
  "security/css-external-url.svg": [/<rect\b/i],
  "security/smil-animate-href.svg": [/<a\b[^>]*id="link"[^>]*>.*safe label/is],
  "security/smil-set-xlink.svg": [/<svg\b/i],
  "security/entity-expansion.svg": [/<text\b/i],
  "security/odd-data-svg.svg": [/<image\b[^>]*width="1"/i],
  "security/odd-data-font-context.svg": [/@font-face/i, /<text\b/i],
  "security/data-url-whitespace.svg": [/<image\b[^>]*width="1"/i],
  "security/css-inline-external.svg": [/<rect\b[^>]*width="1"/i],
  "security/href-protocol-relative.svg": [/<image\b[^>]*width="1"/i],
  "security/javascript-xlink.svg": [/open/i],
  "security/malformed.svg": [/parser error/i],
};

function xmlSignature(source: string): string {
  const { window } = new JSDOM("");
  const document = new window.DOMParser().parseFromString(
    source,
    "image/svg+xml",
  );
  if (document.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Cannot compare malformed SVG fixtures");
  }

  function signature(node: Node): unknown {
    return {
      type: node.nodeType,
      name: node.nodeName,
      value: node.nodeValue,
      attributes:
        node instanceof window.Element
          ? Array.from(node.attributes)
              .map((attribute) => [
                attribute.name,
                attribute.namespaceURI,
                attribute.value,
              ])
              .sort(([a], [b]) => String(a).localeCompare(String(b)))
          : [],
      children: Array.from(node.childNodes, signature),
    };
  }

  return JSON.stringify(signature(document));
}

describe("SVG sanitizer fixture corpus", () => {
  it("returns an empty report and preserves the XML tree for every clean fixture", () => {
    const cleanEntries = fixtureManifest.fixtures.filter(
      (entry) => entry.path.startsWith("corpus/") && !entry.malformed,
    );

    for (const entry of cleanEntries) {
      const source = getFixtureSource(entry).replace(/^\uFEFF/, "");
      const result = sanitize(source);

      expect(result.report.findings, entry.path).toEqual([]);
      expect(result.output, entry.path).toBe(result.sanitizedSource);
      expect(xmlSignature(result.output), entry.path).toEqual(
        xmlSignature(source),
      );
    }
  });

  it("rejects malformed corpus XML rather than trusting a parser recovery tree", () => {
    const entry = fixtureManifest.fixtures.find(
      (fixture) => fixture.path === "corpus/malformed-xml.svg",
    );
    expect(entry).toBeDefined();
    let error: unknown;
    try {
      sanitize(getFixtureSource(entry!));
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(MalformedSvgError);
  });

  it("checks every security fixture against the manifest removal expectations", () => {
    const entries = fixtureManifest.fixtures.filter((entry) =>
      entry.path.startsWith("security/"),
    );

    for (const entry of entries) {
      const source = getFixtureSource(entry).replace(/^\uFEFF/, "");

      if (entry.path === "security/entity-expansion.svg") {
        const result = sanitize(source);
        const reported = result.report.findings
          .map(
            (finding) =>
              `${finding.kind} ${finding.message} ${finding.snippet}`,
          )
          .join("\n");
        expect(expectedSecurityRemovals[entry.path]).toHaveLength(
          entry.sanitization.remove.length,
        );
        for (const expected of expectedSecurityRemovals[entry.path]) {
          expect(reported, entry.path).toMatch(expected);
        }
        expect(result.output).not.toMatch(
          /<!DOCTYPE|&(?:lol|test);|1234567890/,
        );
        expect(result.output).toContain("<text");
        continue;
      }

      if (entry.malformed) {
        const expected = expectedSecurityRemovals[entry.path];
        expect(expected).toHaveLength(entry.sanitization.remove.length);
        let error: unknown;
        try {
          sanitize(source);
        } catch (caught) {
          error = caught;
        }
        expect(error, entry.path).toBeInstanceOf(MalformedSvgError);
        if (!(error instanceof MalformedSvgError)) continue;
        const reported = error.report.findings
          .map(
            (finding) =>
              `${finding.kind} ${finding.message} ${finding.snippet}`,
          )
          .join("\n");
        for (const pattern of expected) {
          expect(reported, entry.path).toMatch(pattern);
        }
        expect(expectedSecurityPreservation[entry.path]).toHaveLength(
          entry.sanitization.preserve.length,
        );
        expect(error.message, entry.path).toMatch(
          expectedSecurityPreservation[entry.path][0],
        );
        continue;
      }

      let result: ReturnType<typeof sanitize>;
      try {
        result = sanitize(source);
      } catch (error) {
        throw new Error(
          `${entry.path}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      const removalChecks = expectedSecurityRemovals[entry.path];
      const preservationChecks = expectedSecurityPreservation[entry.path];
      expect(removalChecks, entry.path).toHaveLength(
        entry.sanitization.remove.length,
      );
      expect(preservationChecks, entry.path).toHaveLength(
        entry.sanitization.preserve.length,
      );
      const reported = result.report.findings
        .map(
          (finding) => `${finding.kind} ${finding.message} ${finding.snippet}`,
        )
        .join("\n");
      for (const expected of removalChecks) {
        expect(reported, entry.path).toMatch(expected);
      }
      for (const expected of preservationChecks) {
        expect(result.output, entry.path).toMatch(expected);
      }
      expect(
        result.report.findings.every((finding) => finding.snippet.length > 0),
        entry.path,
      ).toBe(true);
      expect(result.output, entry.path).not.toMatch(
        /<script\b|<foreignObject\b|\bon(?:load|click|begin)\s*=|javascript\s*:|https?:\/\/attacker/i,
      );
    }
  });

  it("allows only approved raster and font data URLs in their respective contexts", () => {
    const embeddedFont = fixtureManifest.fixtures.find(
      (entry) => entry.path === "corpus/embedded-font.svg",
    );
    const rejectedFont = fixtureManifest.fixtures.find(
      (entry) => entry.path === "security/odd-data-font-context.svg",
    );
    const rejectedSvg = fixtureManifest.fixtures.find(
      (entry) => entry.path === "security/odd-data-svg.svg",
    );

    expect(embeddedFont).toBeDefined();
    expect(rejectedFont).toBeDefined();
    expect(rejectedSvg).toBeDefined();
    expect(sanitize(getFixtureSource(embeddedFont!)).output).toMatch(
      /data:font\/woff2/i,
    );
    expect(sanitize(getFixtureSource(rejectedFont!)).output).not.toMatch(
      /data:image\/png/i,
    );
    expect(sanitize(getFixtureSource(rejectedSvg!)).output).not.toMatch(
      /data:image\/svg\+xml/i,
    );

    const safeRaster = sanitize(
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,AAAA" width="1"/></svg>',
    );
    expect(safeRaster.output).toMatch(/data:image\/png;base64,AAAA/i);
    expect(safeRaster.report.findings).toEqual([]);

    for (const mime of ["png", "jpeg", "webp", "gif"]) {
      const result = sanitize(
        `<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/${mime};base64,AAAA"/></svg>`,
      );
      expect(result.output, mime).toContain(`data:image/${mime};base64,AAAA`);
      expect(result.report.findings, mime).toEqual([]);
    }

    for (const mime of ["woff2", "woff", "ttf", "otf"]) {
      const result = sanitize(
        `<svg xmlns="http://www.w3.org/2000/svg"><style>@font-face{font-family:x;src:url(data:font/${mime};base64,AAAA)}</style><text font-family="x"/></svg>`,
      );
      expect(result.output, mime).toContain(`data:font/${mime};base64,AAAA`);
      expect(result.report.findings, mime).toEqual([]);
    }
  });

  it("sanitizes CSS tokens split across CDATA boundaries and external stylesheet PIs", () => {
    const splitCss = sanitize(
      '<svg xmlns="http://www.w3.org/2000/svg"><?xml-stylesheet href="https://example.invalid/theme.css"?><style><![CDATA[.x{fill:url(]]>https://example.invalid/pixel)</style><rect class="x"/></svg>',
    );

    expect(splitCss.output).not.toMatch(/https:\/\/example\.invalid/);
    expect(splitCss.report.findings.map((finding) => finding.kind)).toEqual(
      expect.arrayContaining(["css-url", "processing-instruction"]),
    );
  });

  it("enforces maxFileBytes and reports a location and snippet for removals", () => {
    const payload = fixtureManifest.fixtures.find(
      (entry) => entry.path === "security/script-element.svg",
    );
    expect(payload).toBeDefined();
    const source = getFixtureSource(payload!);

    expect(() => sanitize(source, 1)).toThrow(/maximum.*bytes/i);
    const result = sanitize(source);
    expect(result.report.findings[0]).toMatchObject({
      kind: expect.any(String),
      message: expect.any(String),
      location: expect.any(String),
      snippet: expect.any(String),
    });
  });
});
