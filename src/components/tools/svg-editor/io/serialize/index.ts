import type {
  CommentNode,
  ElementNode,
  ProcessingInstructionNode,
  SourceMetadata,
  SvgDocument,
  SvgNode,
  TextNode,
} from "../../contracts";

export interface SvgExport {
  svg: string;
  sanitized: boolean;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value)
    .replace(/"/g, "&quot;")
    .replace(/\r/g, "&#13;")
    .replace(/\n/g, "&#10;")
    .replace(/\t/g, "&#9;");
}

function styleValue(node: ElementNode): string {
  return Object.entries(node.style)
    .map(
      ([property, declaration]) =>
        `${property}: ${declaration.value}${declaration.important ? " !important" : ""}`,
    )
    .join("; ");
}

function escapedStyleAttribute(node: ElementNode): string {
  return escapeAttribute(styleValue(node));
}

function serializeText(node: TextNode): string {
  return escapeText(node.value);
}

function serializeComment(node: CommentNode): string {
  if (node.value.includes("--") || node.value.endsWith("-")) {
    throw new TypeError(`Invalid XML comment content in node ${node.id}`);
  }
  return `<!--${node.value}-->`;
}

function serializeProcessingInstruction(
  node: ProcessingInstructionNode,
): string {
  if (!/^[A-Za-z_][\w.:-]*$/.test(node.target) || node.data.includes("?>")) {
    throw new TypeError(`Invalid processing instruction in node ${node.id}`);
  }
  return `<?${node.target}${node.data ? ` ${node.data}` : ""}?>`;
}

function serializeLeaf(node: SvgNode): string {
  switch (node.kind) {
    case "text":
      return serializeText(node);
    case "comment":
      return serializeComment(node);
    case "processing-instruction":
      return serializeProcessingInstruction(node);
    case "element":
      return "";
  }
}

function serializeElement(
  node: ElementNode,
  document: SvgDocument,
  depth: number,
  inheritedPreserve: boolean,
): string {
  const preserve =
    node.attrs["xml:space"] === "preserve"
      ? true
      : node.attrs["xml:space"] === "default"
        ? false
        : inheritedPreserve;
  const indent = "  ".repeat(depth);
  const attributes: string[] = [];
  let emittedStyle = false;

  for (const [name, value] of Object.entries(node.attrs)) {
    if (name === "style") {
      emittedStyle = true;
      const inlineStyle = styleValue(node);
      if (inlineStyle) {
        attributes.push(`${name}="${escapeAttribute(inlineStyle)}"`);
      }
    } else {
      attributes.push(`${name}="${escapeAttribute(value)}"`);
    }
  }
  if (!emittedStyle && Object.keys(node.style).length > 0) {
    attributes.push(`style="${escapedStyleAttribute(node)}"`);
  }

  const openTag = `${indent}<${node.tag}${attributes.length ? ` ${attributes.join(" ")}` : ""}`;
  const children = node.children.map((id) => {
    const child = document.nodes.get(id);
    if (!child) throw new Error(`SVG document references missing node ${id}`);
    return child;
  });
  if (children.length === 0) return `${openTag}/>`;

  const hasElementChild = children.some((child) => child.kind === "element");
  const onlyStructuralContent = children.every(
    (child) =>
      child.kind === "element" ||
      child.kind === "comment" ||
      child.kind === "processing-instruction" ||
      (child.kind === "text" && /^\s*$/.test(child.value)),
  );
  const blockLayout =
    !preserve &&
    node.tag.toLowerCase() !== "text" &&
    hasElementChild &&
    onlyStructuralContent;

  if (blockLayout) {
    const serializedChildren = children
      .filter((child) => child.kind !== "text")
      .map((child) =>
        child.kind === "element"
          ? serializeElement(child, document, depth + 1, preserve)
          : `${"  ".repeat(depth + 1)}${serializeLeaf(child)}`,
      );
    return `${openTag}>\n${serializedChildren.join("\n")}\n${indent}</${node.tag}>`;
  }

  const serializedChildren = children
    .map((child) =>
      child.kind === "element"
        ? serializeElement(child, document, 0, preserve)
        : serializeLeaf(child),
    )
    .join("");
  return `${openTag}>${serializedChildren}</${node.tag}>`;
}

export function serialize(document: SvgDocument): string {
  const root = document.nodes.get(document.root);
  if (!root || root.kind !== "element" || root.parent !== null) {
    throw new TypeError("SVG document root must reference a root element node");
  }

  const topLevel = Array.from(document.nodes.entries())
    .map(([, node]) => node)
    .filter(
      (node) =>
        node.kind !== "element" &&
        node.parent === null &&
        node.id !== document.root,
    );
  const outsideRoot = topLevel.map((node) => serializeLeaf(node)).join("\n");
  const serializedRoot = serializeElement(root, document, 0, false);
  return outsideRoot ? `${outsideRoot}\n${serializedRoot}` : serializedRoot;
}

export function exportSvg(
  document: SvgDocument,
  metadata: SourceMetadata,
  currentVersion: number,
): SvgExport {
  const untouched = currentVersion === metadata.originalVersion;
  const reportIsEmpty = metadata.sanitizationReport.findings.length === 0;
  if (untouched && reportIsEmpty) {
    return { svg: metadata.originalSource, sanitized: false };
  }
  if (untouched) {
    return { svg: serialize(document), sanitized: true };
  }
  return { svg: serialize(document), sanitized: false };
}
