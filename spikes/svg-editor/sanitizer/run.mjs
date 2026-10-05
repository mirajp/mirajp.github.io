import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureRoot = path.join(repoRoot, "tests/svg-editor/fixtures");
const manifest = JSON.parse(
  readFileSync(path.join(fixtureRoot, "manifest.json"), "utf8"),
);
const require = createRequire(path.join(repoRoot, "package.json"));
const { chromium } = require("playwright");
const temporaryInstall = mkdtempSync(path.join(tmpdir(), "svg-editor-dompurify-"));

const safeProbes = {
  "corpus/illustrator-st0.svg": (doc) => doc.querySelector(".st0"),
  "corpus/figma-export.svg": (doc) => doc.querySelector("path, circle"),
  "corpus/inkscape-namespaces.svg": (doc) =>
    doc.documentElement.hasAttributeNS(
      "http://www.inkscape.org/namespaces/inkscape",
      "label",
    ) &&
    doc.documentElement.hasAttributeNS(
      "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd",
      "docname",
    ),
  "corpus/sketch-export.svg": (doc) => doc.getElementById("Page-1"),
  "corpus/icon-license-comment.svg": (doc) =>
    [...doc.childNodes].some((node) => node.nodeType === Node.COMMENT_NODE),
  "corpus/nested-svg.svg": (doc) => doc.querySelector("svg svg"),
  "corpus/use-symbol.svg": (doc) =>
    doc.querySelector("symbol") && doc.querySelector('use[href="#mark"]'),
  "corpus/linear-gradient.svg": (doc) =>
    doc.querySelector("linearGradient") &&
    doc.querySelector('[fill="url(#paint)"]'),
  "corpus/radial-gradient.svg": (doc) => doc.querySelector("radialGradient"),
  "corpus/clip-path.svg": (doc) => doc.querySelector("clipPath"),
  "corpus/mask.svg": (doc) => doc.querySelector("mask"),
  "corpus/filter.svg": (doc) => doc.querySelector("filter feGaussianBlur"),
  "corpus/missing-viewbox.svg": (doc) =>
    doc.documentElement.getAttribute("width") === "64",
  "corpus/percentage-dimensions.svg": (doc) =>
    doc.documentElement.getAttribute("width") === "100%",
  "corpus/bom.svg": (doc) => doc.querySelector("path"),
  "corpus/embedded-font.svg": (doc) =>
    /@font-face/i.test(doc.querySelector("style")?.textContent ?? "") &&
    /data:font\/woff2/i.test(doc.querySelector("style")?.textContent ?? ""),
  "corpus/cdata-style.svg": (doc) =>
    /\\.shape\\s*\\{\\s*fill:\\s*#369/i.test(
      doc.querySelector("style")?.textContent ?? "",
    ),
  "corpus/custom-properties.svg": (doc) =>
    (doc.documentElement.getAttribute("style") ?? "").includes("--ink"),
  "corpus/inherited-fill.svg": (doc) =>
    doc.documentElement.getAttribute("fill") === "tomato",
  "corpus/important-cascade.svg": (doc) =>
    /!important/.test(doc.querySelector("style")?.textContent ?? ""),
  "corpus/transform-group.svg": (doc) =>
    doc.querySelector('g[transform*="translate"]'),
  "corpus/href-reference.svg": (doc) => doc.querySelector('use[href="#shape"]'),
  "corpus/xml-space-preserve.svg": (doc) =>
    doc.documentElement.getAttributeNS(
      "http://www.w3.org/XML/1998/namespace",
      "space",
    ) === "preserve",
  "corpus/namespaced-attributes.svg": (doc) =>
    doc.querySelector("image")?.getAttributeNS(
      "http://www.w3.org/1999/xlink",
      "href",
    ) === "#image-data",
  "corpus/defs-and-use.svg": (doc) => doc.querySelector("defs g#unit"),
  "corpus/opacity-and-stroke.svg": (doc) =>
    doc.querySelector('path[stroke="#246"]'),
  "corpus/markers.svg": (doc) => doc.querySelector("marker"),
  "corpus/pattern.svg": (doc) => doc.querySelector("pattern"),
  "corpus/text-tspan.svg": (doc) => doc.querySelector("text tspan"),
  "corpus/use-xlink.svg": (doc) =>
    doc.querySelector("use")?.getAttributeNS(
      "http://www.w3.org/1999/xlink",
      "href",
    ) === "#dot",
  "corpus/processing-instruction.svg": (doc) =>
    [...doc.childNodes].some(
      (node) => node.nodeType === Node.PROCESSING_INSTRUCTION_NODE,
    ),
  "corpus/rounded-rect.svg": (doc) =>
    doc.querySelector('rect[rx="4"][ry="4"]'),
  "corpus/percentage-coordinates.svg": (doc) =>
    doc.querySelector('circle[cx="50%"][r="25%"]'),
  "corpus/multiple-stylesheets.svg": (doc) =>
    doc.querySelectorAll("style").length === 2,
  "security/script-element.svg": (doc) => doc.querySelector("rect"),
  "security/event-attributes.svg": (doc) => doc.querySelector("rect"),
  "security/javascript-href.svg": (doc) => doc.querySelector("a text"),
  "security/external-xlink.svg": (doc) => doc.querySelector("image"),
  "security/foreign-object.svg": (doc) => doc.querySelector("circle"),
  "security/css-import.svg": (doc) =>
    doc.querySelector("rect") &&
    /\\.x\\s*\\{\\s*fill:\\s*red/i.test(
      doc.querySelector("style")?.textContent ?? "",
    ),
  "security/css-external-url.svg": (doc) => doc.querySelector("rect"),
  "security/smil-animate-href.svg": (doc) => doc.querySelector("a text"),
  "security/smil-set-xlink.svg": (doc) => doc.documentElement.localName === "svg",
  "security/entity-expansion.svg": (doc) =>
    doc.querySelector("text") && !doc.querySelector("parsererror"),
  "security/malformed.svg": (doc) => !doc.querySelector("parsererror"),
  "security/odd-data-svg.svg": (doc) => doc.querySelector("image"),
  "security/odd-data-font-context.svg": (doc) => doc.querySelector("text"),
  "security/data-url-whitespace.svg": (doc) => doc.querySelector("image"),
  "security/css-inline-external.svg": (doc) => doc.querySelector("rect"),
  "security/href-protocol-relative.svg": (doc) => doc.querySelector("image"),
  "security/javascript-xlink.svg": (doc) => doc.querySelector("a text"),
};

const riskPatterns = [
  /<\s*script\b/i,
  /\son[a-z][\w:-]*\s*=/i,
  /javascript\s*:/i,
  /xlink:href\s*=\s*["']\s*(?:https?:|\/\/)/i,
  /<\s*foreignObject\b/i,
  /@import\b/i,
  /url\(\s*["']?(?:https?:|\/\/)/i,
  /<\s*(?:animate|set)\b[^>]*attributeName\s*=\s*["'](?:xlink:)?href/i,
  /<!DOCTYPE\b/i,
  /data:image\/svg\+xml/i,
  /data:image\/png[^}]*@font-face/i,
  /data:image\/png\s*;/i,
  /href\s*=\s*["']\s*\/\//i,
];

function containsRisk(source) {
  return riskPatterns.some((pattern) => pattern.test(source));
}

function compact(value) {
  return JSON.stringify(value);
}

async function main() {
  execFileSync(
    "npm",
    [
      "install",
      "--prefix",
      temporaryInstall,
      "--no-save",
      "--no-package-lock",
      "--ignore-scripts",
      "--silent",
      "dompurify@3.3.1",
    ],
    { stdio: "inherit" },
  );
  const domPurifyScript = path.join(
    temporaryInstall,
    "node_modules/dompurify/dist/purify.min.js",
  );
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><html><body></body></html>");
    await page.addScriptTag({ path: domPurifyScript });

    const inputs = manifest.fixtures.map((entry) => ({
      path: entry.path,
      source: readFileSync(path.join(fixtureRoot, entry.path), "utf8"),
      malformed: Boolean(entry.malformed),
      risky: containsRisk(
        readFileSync(path.join(fixtureRoot, entry.path), "utf8"),
      ),
    }));
    const results = await page.evaluate(async (fixtures) => {
      function hasParserError(document) {
        return (
          document.documentElement.localName === "parsererror" ||
          document.getElementsByTagName("parsererror").length > 0
        );
      }

      function hasDanger(document) {
        const elements = [...document.querySelectorAll("*")];
        const eventAttribute = elements.some((element) =>
          [...element.attributes].some((attribute) =>
            /^on/i.test(attribute.name),
          ),
        );
        const dangerousHref = elements.some((element) =>
          ["href", "xlink:href"].some((name) =>
            /^(?:javascript:|https?:|\/\/)/i.test(
              element.getAttribute(name)?.trim() ?? "",
            ),
          ),
        );
        const css = [...document.querySelectorAll("style")]
          .map((style) => style.textContent ?? "")
          .join("\n");
        const inlineCss = elements
          .map((element) => element.getAttribute("style") ?? "")
          .join("\n");
        const smilHref = elements.some(
          (element) =>
            ["animate", "set"].includes(element.localName.toLowerCase()) &&
            /^(?:xlink:)?href$/i.test(
              element.getAttribute("attributeName") ?? "",
            ),
        );
        return {
          script: Boolean(document.querySelector("script")),
          eventAttribute,
          dangerousHref,
          foreignObject: Boolean(
            [...elements].find(
              (element) => element.localName.toLowerCase() === "foreignobject",
            ),
          ),
          cssImport: /@import\b/i.test(css),
          externalCssUrl: /url\(\s*["']?(?:https?:|\/\/)/i.test(
            `${css}\n${inlineCss}`,
          ),
          smilHref,
          doctype: Boolean(document.doctype),
          svgData: /data:image\/svg\+xml/i.test(
            [...elements]
              .map((element) => element.getAttribute("href") ?? "")
              .join("\n"),
          ),
        };
      }

      function preserveSafe(source, document, path) {
        const parserFailed = hasParserError(document);
        if (
          path === "corpus/malformed-xml.svg" ||
          path === "security/malformed.svg" ||
          path === "security/entity-expansion.svg"
        ) {
          return parserFailed;
        }
        if (parserFailed) return false;
        const root = document.documentElement;
        if (root.localName.toLowerCase() !== "svg") return false;
        const checks = {
          "corpus/illustrator-st0.svg": () => document.querySelector(".st0"),
          "corpus/figma-export.svg": () => document.querySelector("path, circle"),
          "corpus/inkscape-namespaces.svg": () =>
            [...root.attributes].some((attribute) =>
              attribute.name.startsWith("inkscape:"),
            ) &&
            [...root.attributes].some((attribute) =>
              attribute.name.startsWith("sodipodi:"),
            ),
          "corpus/sketch-export.svg": () => document.getElementById("Page-1"),
          "corpus/icon-license-comment.svg": () =>
            [...document.childNodes].some((node) => node.nodeType === 8),
          "corpus/nested-svg.svg": () => document.querySelector("svg svg"),
          "corpus/use-symbol.svg": () =>
            document.querySelector("symbol") && document.querySelector("use"),
          "corpus/linear-gradient.svg": () => document.querySelector("linearGradient"),
          "corpus/radial-gradient.svg": () => document.querySelector("radialGradient"),
          "corpus/clip-path.svg": () => document.querySelector("clipPath"),
          "corpus/mask.svg": () => document.querySelector("mask"),
          "corpus/filter.svg": () => document.querySelector("filter"),
          "corpus/missing-viewbox.svg": () => root.getAttribute("width") === "64",
          "corpus/percentage-dimensions.svg": () => root.getAttribute("width") === "100%",
          "corpus/bom.svg": () => document.querySelector("path"),
          "corpus/embedded-font.svg": () =>
            /@font-face/i.test(document.querySelector("style")?.textContent ?? "") &&
            /data:font\/woff2/i.test(document.querySelector("style")?.textContent ?? ""),
          "corpus/cdata-style.svg": () =>
            /\\.shape\\s*\\{/i.test(document.querySelector("style")?.textContent ?? ""),
          "corpus/custom-properties.svg": () =>
            (root.getAttribute("style") ?? "").includes("--ink"),
          "corpus/inherited-fill.svg": () => root.getAttribute("fill") === "tomato",
          "corpus/important-cascade.svg": () =>
            /!important/.test(document.querySelector("style")?.textContent ?? ""),
          "corpus/transform-group.svg": () => document.querySelector("g[transform]"),
          "corpus/href-reference.svg": () => document.querySelector("use[href='#shape']"),
          "corpus/xml-space-preserve.svg": () => root.hasAttribute("xml:space"),
          "corpus/namespaced-attributes.svg": () =>
            Boolean(document.querySelector("image")?.getAttribute("xlink:href")),
          "corpus/defs-and-use.svg": () => document.querySelector("defs g#unit"),
          "corpus/opacity-and-stroke.svg": () => document.querySelector("path[stroke]"),
          "corpus/markers.svg": () => document.querySelector("marker"),
          "corpus/pattern.svg": () => document.querySelector("pattern"),
          "corpus/text-tspan.svg": () => document.querySelector("text tspan"),
          "corpus/use-xlink.svg": () => Boolean(document.querySelector("use")?.getAttribute("xlink:href")),
          "corpus/processing-instruction.svg": () =>
            [...document.childNodes].some((node) => node.nodeType === 7),
          "corpus/rounded-rect.svg": () => document.querySelector("rect[rx='4']"),
          "corpus/percentage-coordinates.svg": () => document.querySelector("circle[cx='50%']"),
          "corpus/multiple-stylesheets.svg": () =>
            document.querySelectorAll("style").length === 2,
          "security/script-element.svg": () => document.querySelector("rect"),
          "security/event-attributes.svg": () => document.querySelector("rect"),
          "security/javascript-href.svg": () => document.querySelector("a text"),
          "security/external-xlink.svg": () => document.querySelector("image"),
          "security/foreign-object.svg": () => document.querySelector("circle"),
          "security/css-import.svg": () =>
            document.querySelector("rect") &&
            /\\.x\\s*\\{\\s*fill:\\s*red/i.test(document.querySelector("style")?.textContent ?? ""),
          "security/css-external-url.svg": () => document.querySelector("rect"),
          "security/smil-animate-href.svg": () => document.querySelector("a text"),
          "security/smil-set-xlink.svg": () => root.localName === "svg",
          "security/odd-data-svg.svg": () => document.querySelector("image"),
          "security/odd-data-font-context.svg": () => document.querySelector("text"),
          "security/data-url-whitespace.svg": () => document.querySelector("image"),
          "security/css-inline-external.svg": () => document.querySelector("rect"),
          "security/href-protocol-relative.svg": () => document.querySelector("image"),
          "security/javascript-xlink.svg": () => document.querySelector("a text"),
        };
        return Boolean(checks[path]?.());
      }

      return fixtures.map(({ path, source, malformed, risky }) => {
        const sourceWithoutBom = source.replace(/^\uFEFF/, "");
        return ["default", "xml"].map((mode) => {
          const config = {
            USE_PROFILES: { svg: true },
            RETURN_DOM: true,
            ...(mode === "xml"
              ? { PARSER_MEDIA_TYPE: "application/xhtml+xml" }
              : {}),
          };
          let sanitized;
          try {
            sanitized = DOMPurify.sanitize(sourceWithoutBom, config);
          } catch (error) {
            return {
              path,
              mode,
              error: String(error),
              dangerousRemoved: risky ? "no" : "n/a",
              safePreserved: "no",
              wellFormedXml: "no",
            };
          }
          const serialized = new XMLSerializer().serializeToString(sanitized);
          const parsed = new DOMParser().parseFromString(
            serialized,
            "application/xml",
          );
          const parseError = hasParserError(parsed);
          const dangers = hasDanger(sanitized);
          return {
            path,
            mode,
            dangerousRemoved: risky
              ? dangers.script ||
                dangers.eventAttribute ||
                dangers.dangerousHref ||
                dangers.foreignObject ||
                dangers.cssImport ||
                dangers.externalCssUrl ||
                dangers.smilHref ||
                dangers.doctype ||
                dangers.svgData
                ? "no"
                : "yes"
              : "n/a",
            safePreserved: preserveSafe(source, sanitized, path) ? "yes" : "no",
            wellFormedXml:
              !parseError && parsed.documentElement.localName === "svg"
                ? "yes"
                : "no",
            remainingDangerous: Object.entries(dangers)
              .filter(([, found]) => found)
              .map(([name]) => name),
          };
        });
      }).flat();
    }, inputs);

    console.log(`DOMPurify ${require(path.join(temporaryInstall, "node_modules/dompurify/package.json")).version}`);
    console.log(`Fixtures: ${manifest.fixtures.length}; each run in default and XML parser modes.`);
    for (const result of results) {
      console.log(
        `${result.path}\t${result.mode}\tdangerousRemoved=${result.dangerousRemoved}\tsafePreserved=${result.safePreserved}\twellFormedXML=${result.wellFormedXml}${result.remainingDangerous?.length ? `\tremaining=${result.remainingDangerous.join(",")}` : ""}${result.error ? `\terror=${result.error}` : ""}`,
      );
    }
  } finally {
    await browser.close();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    rmSync(temporaryInstall, { recursive: true, force: true });
  });
