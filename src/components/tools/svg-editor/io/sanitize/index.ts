import type {
  SanitizationFinding,
  SanitizationReport,
  SanitizationResult,
} from "../../contracts";

export interface DetailedSanitizationFinding extends SanitizationFinding {
  snippet: string;
}

export interface DetailedSanitizationReport extends Omit<
  SanitizationReport,
  "findings"
> {
  findings: DetailedSanitizationFinding[];
}

export interface SanitizedSvg extends SanitizationResult {
  output: string;
  report: DetailedSanitizationReport;
}

export class MalformedSvgError extends Error {
  constructor(
    message: string,
    readonly report: SanitizedSvg["report"],
  ) {
    super(message);
    this.name = "MalformedSvgError";
  }
}

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
const IMAGE_DATA_URL =
  /^data:image\/(?:png|jpeg|webp|gif)(?:;base64)?,(?:[a-z0-9+/=%._~-]+={0,2})$/i;
const FONT_DATA_URL =
  /^data:font\/(?:woff2?|ttf|otf)(?:;base64)?,(?:[a-z0-9+/=%._~-]+={0,2})$/i;
const ENTITY_REFERENCE = /&([a-z][a-z0-9]*);/gi;
const SAFE_SVG_ELEMENTS = new Set(
  [
    "a",
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animate",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "circle",
    "clipPath",
    "color-profile",
    "cursor",
    "defs",
    "desc",
    "discard",
    "ellipse",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "filter",
    "font",
    "font-face",
    "font-face-format",
    "font-face-name",
    "font-face-src",
    "font-face-uri",
    "g",
    "glyph",
    "glyphRef",
    "hkern",
    "image",
    "line",
    "linearGradient",
    "marker",
    "mask",
    "metadata",
    "missing-glyph",
    "mpath",
    "path",
    "pattern",
    "polygon",
    "polyline",
    "radialGradient",
    "rect",
    "set",
    "stop",
    "style",
    "svg",
    "switch",
    "symbol",
    "text",
    "textPath",
    "title",
    "tref",
    "tspan",
    "use",
    "view",
    "vkern",
  ].map((tag) => tag.trim().toLowerCase()),
);

interface RemovedDoctype {
  source: string;
  declaration: string;
}

function snippet(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 160);
}

function pathFor(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current) {
    const siblings = current.parentElement
      ? Array.from(current.parentElement.children).filter(
          (child) => child.localName === current?.localName,
        )
      : [];
    const index = siblings.indexOf(current);
    parts.unshift(`${current.localName}${index > 0 ? `[${index + 1}]` : ""}`);
    current = current.parentElement;
  }

  return `/${parts.join("/")}`;
}

function addFinding(
  findings: DetailedSanitizationFinding[],
  kind: string,
  message: string,
  location: string,
  removed: string,
): void {
  findings.push({ kind, message, location, snippet: snippet(removed) });
}

function removeDoctype(source: string): RemovedDoctype | null {
  const match = /<!DOCTYPE\b/i.exec(source);
  if (!match) return null;

  let quote = "";
  let subsetDepth = 0;
  let end = match.index + match[0].length;
  for (; end < source.length; end += 1) {
    const char = source[end];
    if (quote) {
      if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "[") {
      subsetDepth += 1;
    } else if (char === "]") {
      subsetDepth = Math.max(0, subsetDepth - 1);
    } else if (char === ">" && subsetDepth === 0) {
      end += 1;
      break;
    }
  }

  const declaration = source.slice(match.index, end);
  return {
    source: `${source.slice(0, match.index)}${source.slice(end)}`,
    declaration,
  };
}

function decodeCssEscapes(
  value: string,
  location: string,
  findings: DetailedSanitizationFinding[],
): string {
  return value
    .replace(/\/\*[\s\S]*?\*\//g, (comment) => {
      addFinding(
        findings,
        "css-comment",
        "Removed CSS comment during token normalization",
        location,
        comment,
      );
      return " ";
    })
    .replace(/\\([a-f\d]{1,6})(?:\s)?|\\([^\r\n])/gi, (_all, hex, char) => {
      if (hex) {
        const codePoint = Number.parseInt(hex, 16);
        return String.fromCodePoint(
          codePoint === 0 || codePoint > 0x10ffff ? 0xfffd : codePoint,
        );
      }
      return char ?? "";
    });
}

function isAllowedDataUrl(value: string, context: "image" | "font"): boolean {
  if (/\s|[\u0000-\u001f]/.test(value)) return false;
  return context === "image"
    ? IMAGE_DATA_URL.test(value)
    : FONT_DATA_URL.test(value);
}

function sanitizeCss(
  original: string,
  location: string,
  findings: DetailedSanitizationFinding[],
): string {
  let css = decodeCssEscapes(original, location, findings);
  css = css.replace(/@import\b[^;]*(?:;|$)/gi, (removed) => {
    addFinding(
      findings,
      "css-import",
      "Removed CSS @import rule",
      location,
      removed,
    );
    return "";
  });

  const cleanUrls = (
    value: string,
    context: "image" | "font" | "font-face" | "none",
  ): string =>
    value.replace(
      /url\(\s*(?:(["'])(.*?)\1|([^)]*?))\s*\)/gis,
      (whole, _quote, quotedValue, bareValue, offset: number) => {
        const url = String(quotedValue ?? bareValue ?? "").trim();
        const propertyPrefix = value.slice(0, offset).split(";").at(-1) ?? "";
        const urlContext =
          context === "font-face"
            ? /\bsrc\s*:\s*$/i.test(propertyPrefix)
              ? "font"
              : "none"
            : context;
        const fragment = /^#[^\s]*$/.test(url);
        const permittedData =
          urlContext !== "none" &&
          url.toLowerCase().startsWith("data:") &&
          isAllowedDataUrl(url, urlContext);
        if (fragment || permittedData) return whole;
        addFinding(
          findings,
          "css-url",
          "Removed unsafe CSS url() value",
          location,
          whole,
        );
        return "";
      },
    );

  const preservedFontFaces: string[] = [];
  css = css.replace(/@font-face\s*\{([^{}]*)\}/gi, (_whole, body: string) => {
    const marker = `__SVG_SAFE_FONT_SOURCE_${preservedFontFaces.length}__`;
    preservedFontFaces.push(`@font-face{${cleanUrls(body, "font-face")}}`);
    return marker;
  });

  return cleanUrls(css, "image").replace(
    /__SVG_SAFE_FONT_SOURCE_(\d+)__/g,
    (_marker, index: string) => preservedFontFaces[Number(index)] ?? "",
  );
}

function removeUnsafeConstructs(
  document: Document,
  findings: DetailedSanitizationFinding[],
): void {
  const elements = Array.from(document.getElementsByTagName("*"));

  for (const element of elements) {
    if (!element.parentNode) continue;
    const location = pathFor(element);
    const tag = element.localName.toLowerCase();
    if (tag === "script" || tag === "foreignobject") {
      addFinding(
        findings,
        tag,
        `Removed unsafe <${element.localName}> subtree`,
        location,
        element.outerHTML || element.localName,
      );
      element.remove();
      continue;
    }

    if (
      (tag === "animate" || tag === "set") &&
      (Array.from(element.attributes).some(
        (attribute) =>
          attribute.localName.toLowerCase() === "href" &&
          (attribute.namespaceURI === XLINK_NAMESPACE ||
            attribute.namespaceURI === null ||
            attribute.prefix === "xlink"),
      ) ||
        ["href", "xlink:href"].includes(
          element.getAttribute("attributeName")?.toLowerCase() ?? "",
        ))
    ) {
      addFinding(
        findings,
        "smil-href",
        `Removed <${element.localName}> targeting href`,
        location,
        element.outerHTML || element.localName,
      );
      element.remove();
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on")) {
        addFinding(
          findings,
          "event-handler",
          `Removed event-handler attribute ${attribute.name}`,
          `${location}/@${attribute.name}`,
          attribute.value,
        );
        element.removeAttributeNode(attribute);
        continue;
      }

      if (
        attribute.localName.toLowerCase() === "href" &&
        (attribute.namespaceURI === XLINK_NAMESPACE ||
          attribute.namespaceURI === null ||
          attribute.prefix === "xlink")
      ) {
        const href = attribute.value.trim();
        const imageContext =
          tag === "image" && element.namespaceURI === SVG_NAMESPACE;
        const safe =
          /^#[^\s]*$/.test(href) ||
          (imageContext && isAllowedDataUrl(href, "image"));
        if (!safe) {
          addFinding(
            findings,
            "href",
            "Removed external or unsafe href",
            `${location}/@${attribute.name}`,
            attribute.value,
          );
          element.removeAttributeNode(attribute);
        }
      }

      if (attribute.name.toLowerCase() === "style") {
        const cleaned = sanitizeCss(
          attribute.value,
          `${location}/@style`,
          findings,
        );
        if (cleaned !== attribute.value) {
          attribute.value = cleaned;
        }
      }
    }

    if (tag === "style") {
      const textNodes = Array.from(element.childNodes).filter(
        (child) => child.nodeType === 3 || child.nodeType === 4,
      );
      if (textNodes.length > 0) {
        const originalCss = textNodes
          .map((child) => child.nodeValue ?? "")
          .join("");
        const cleaned = sanitizeCss(
          originalCss,
          `${location}/text()`,
          findings,
        );
        if (cleaned !== originalCss) {
          const replacement = document.createTextNode(cleaned);
          element.replaceChild(replacement, textNodes[0]);
          for (const child of textNodes.slice(1)) child.remove();
        }
      }
    }
  }

  const visitProcessingInstructions = (node: Node): void => {
    for (const child of Array.from(node.childNodes)) {
      if (
        child.nodeType === 7 &&
        child.nodeName.toLowerCase() === "xml-stylesheet"
      ) {
        const href = /\bhref\s*=\s*(["'])(.*?)\1/i.exec(
          child.nodeValue ?? "",
        )?.[2];
        if (href && !/^#[^\s]*$/.test(href)) {
          addFinding(
            findings,
            "processing-instruction",
            "Removed external xml-stylesheet processing instruction",
            "/xml-stylesheet",
            child.nodeValue ?? child.nodeName,
          );
          child.remove();
          continue;
        }
      }
      visitProcessingInstructions(child);
    }
  };
  visitProcessingInstructions(document);

  for (const element of Array.from(document.getElementsByTagName("*"))) {
    if (!element.parentNode || element === document.documentElement) continue;
    if (
      element.namespaceURI !== SVG_NAMESPACE ||
      !SAFE_SVG_ELEMENTS.has(element.localName.toLowerCase())
    ) {
      addFinding(
        findings,
        "unsupported-element",
        `Removed unsupported element <${element.localName}>`,
        pathFor(element),
        element.outerHTML || element.localName,
      );
      element.remove();
    }
  }
}

export function sanitize(source: string, maxFileBytes?: number): SanitizedSvg {
  if (maxFileBytes !== undefined) {
    if (!Number.isFinite(maxFileBytes) || maxFileBytes < 0) {
      throw new RangeError("maxFileBytes must be a non-negative finite number");
    }
    if (new TextEncoder().encode(source).byteLength > maxFileBytes) {
      throw new RangeError(`SVG exceeds maximum of ${maxFileBytes} bytes`);
    }
  }

  const view = globalThis.window;
  if (!view || typeof view.DOMParser !== "function") {
    throw new Error(
      "SVG sanitization requires a browser-compatible DOM window",
    );
  }

  const findings: DetailedSanitizationFinding[] = [];
  let xml = source.replace(/^\uFEFF/, "");
  const doctype = removeDoctype(xml);
  if (doctype) {
    xml = doctype.source;
    addFinding(
      findings,
      "doctype",
      "Removed document type and entity declarations",
      "/",
      doctype.declaration,
    );
    xml = xml.replace(ENTITY_REFERENCE, (whole, name: string) => {
      if (["amp", "apos", "gt", "lt", "quot"].includes(name)) return whole;
      addFinding(
        findings,
        "entity-reference",
        `Removed custom entity reference &${name};`,
        "/",
        whole,
      );
      return "";
    });
  }

  const document = new view.DOMParser().parseFromString(xml, "image/svg+xml");
  if (
    document.getElementsByTagName("parsererror").length > 0 ||
    document.documentElement.localName.toLowerCase() === "parsererror"
  ) {
    const parserFindings: DetailedSanitizationFinding[] = [...findings];
    const unsafeScript = /<script\b[^>]*>[\s\S]*?(?=<\/svg\b|$)/i.exec(xml);
    if (unsafeScript) {
      addFinding(
        parserFindings,
        "script",
        "Rejected unsafe script content in malformed SVG input",
        "/svg/script",
        unsafeScript[0],
      );
    }
    addFinding(
      parserFindings,
      "malformed-xml",
      "Parser error; no partial document was trusted",
      "/",
      document.documentElement.textContent ?? "parsererror",
    );
    throw new MalformedSvgError(
      "Malformed XML in SVG input; parser error, no document trusted",
      { findings: parserFindings },
    );
  }
  if (
    document.documentElement.localName.toLowerCase() !== "svg" ||
    document.documentElement.namespaceURI !== SVG_NAMESPACE
  ) {
    throw new Error("SVG input must have an SVG namespace root element");
  }

  removeUnsafeConstructs(document, findings);
  const output = new view.XMLSerializer().serializeToString(document);
  return {
    output,
    sanitizedSource: output,
    report: { findings },
  };
}
