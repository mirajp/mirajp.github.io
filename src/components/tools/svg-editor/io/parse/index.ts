import { Map as ImmutableMap } from "immutable";
import type {
  CommentNode,
  Decl,
  DomParserAdapter,
  ElementNode,
  NodeId,
  Parser,
  PersistentMap as PersistentMapContract,
  ProcessingInstructionNode,
  SourceMetadata,
  SvgDocument,
  SvgNode,
  TextNode,
} from "../../contracts";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export class SvgParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SvgParseError";
  }
}

class PersistentNodeMap implements PersistentMapContract<NodeId, SvgNode> {
  constructor(
    private readonly values: ImmutableMap<string, SvgNode> = ImmutableMap(),
  ) {}

  get size(): number {
    return this.values.size;
  }

  get(key: string): SvgNode | undefined {
    return this.values.get(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  set(key: string, value: SvgNode): PersistentNodeMap {
    return new PersistentNodeMap(this.values.set(key, value));
  }

  delete(key: string): PersistentNodeMap {
    return new PersistentNodeMap(this.values.delete(key));
  }

  entries(): IterableIterator<[string, SvgNode]> {
    return this.values.entries();
  }
}

export interface ParseResult {
  doc: SvgDocument;
  metadata: SourceMetadata;
}

function splitDeclarations(source: string): string[] {
  const declarations: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (char === ";" && depth === 0) {
      declarations.push(source.slice(start, index));
      start = index + 1;
    }
  }
  declarations.push(source.slice(start));
  return declarations;
}

function declarationColon(source: string): number {
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
    } else if (quote) {
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth = Math.max(0, depth - 1);
    } else if (char === ":" && depth === 0) {
      return index;
    }
  }
  return -1;
}

function parseInlineStyle(source: string): Record<string, Decl> {
  const declarations: Record<string, Decl> = {};

  for (const rawDeclaration of splitDeclarations(source)) {
    const colon = declarationColon(rawDeclaration);
    if (colon < 1) continue;
    const rawProperty = rawDeclaration.slice(0, colon).trim();
    let value = rawDeclaration.slice(colon + 1).trim();
    if (!/^--[^\s:]+$|^-?[a-z][a-z0-9-]*$/i.test(rawProperty) || !value) {
      continue;
    }

    const important = /\s*!important\s*$/i.test(value);
    if (important) value = value.replace(/\s*!important\s*$/i, "").trim();
    const property = rawProperty.startsWith("--")
      ? rawProperty
      : rawProperty.toLowerCase();
    declarations[property] = { value, important };
  }
  return declarations;
}

function parserErrorMessage(document: XMLDocument): string {
  const parserError = Array.from(document.getElementsByTagName("*")).find(
    (element) =>
      element.localName.toLowerCase() === "parsererror" ||
      element.namespaceURI ===
        "http://www.mozilla.org/newlayout/xml/parsererror.xml",
  );
  return (
    parserError?.textContent?.trim() ||
    "The XML parser reported malformed input"
  );
}

export function parse(
  source: string,
  adapter: DomParserAdapter,
  originalSource = source,
): ParseResult {
  const xml = source.replace(/^\uFEFF/, "");
  const parsed = adapter.parseFromString(xml, "image/svg+xml");
  if (
    parsed.documentElement?.localName.toLowerCase() === "parsererror" ||
    Array.from(parsed.getElementsByTagName("*")).some(
      (element) =>
        element.localName.toLowerCase() === "parsererror" ||
        element.namespaceURI ===
          "http://www.mozilla.org/newlayout/xml/parsererror.xml",
    )
  ) {
    throw new SvgParseError(parserErrorMessage(parsed));
  }
  if (
    !parsed.documentElement ||
    parsed.documentElement.localName.toLowerCase() !== "svg" ||
    parsed.documentElement.namespaceURI !== SVG_NAMESPACE
  ) {
    throw new SvgParseError(
      "SVG input must have an SVG namespace root element",
    );
  }

  let nodes = new PersistentNodeMap();
  let nextId = 0;
  let hasStylesheet = false;
  const createId = (): string => `n${nextId++}`;

  const visit = (node: Node, parent: string | null): string | null => {
    if (node.nodeType === 1) {
      const element = node as Element;
      const id = createId();
      const attrs: Record<string, string> = {};
      for (const attribute of Array.from(element.attributes)) {
        attrs[attribute.name] = attribute.value;
      }
      const style = parseInlineStyle(element.getAttribute("style") ?? "");
      const children: string[] = [];
      const elementNode: ElementNode = {
        kind: "element",
        id,
        tag: element.localName,
        attrs,
        style,
        children,
        parent,
      };
      nodes = nodes.set(id, elementNode);
      if (element.localName.toLowerCase() === "style") hasStylesheet = true;
      for (const child of Array.from(element.childNodes)) {
        const childId = visit(child, id);
        if (childId) children.push(childId);
      }
      return id;
    }

    if (node.nodeType === 3 || node.nodeType === 4) {
      if (parent === null) return null;
      const textNode: TextNode = {
        kind: "text",
        id: createId(),
        value: node.nodeValue ?? "",
        parent,
      };
      nodes = nodes.set(textNode.id, textNode);
      return textNode.id;
    }

    if (node.nodeType === 8) {
      const commentNode: CommentNode = {
        kind: "comment",
        id: createId(),
        value: node.nodeValue ?? "",
        parent,
      };
      nodes = nodes.set(commentNode.id, commentNode);
      return commentNode.id;
    }

    if (node.nodeType === 7) {
      const instruction = node as ProcessingInstruction;
      const instructionNode: ProcessingInstructionNode = {
        kind: "processing-instruction",
        id: createId(),
        target: instruction.target,
        data: instruction.data,
        parent,
      };
      nodes = nodes.set(instructionNode.id, instructionNode);
      return instructionNode.id;
    }

    return null;
  };

  const rootId = visit(parsed.documentElement, null);
  if (!rootId) throw new SvgParseError("The SVG document has no root element");

  for (const child of Array.from(parsed.childNodes)) {
    if (
      child !== parsed.documentElement &&
      (child.nodeType === 7 || child.nodeType === 8)
    ) {
      visit(child, null);
    }
  }

  const unsupported = hasStylesheet
    ? [
        {
          kind: "stylesheet",
          message: "Stylesheets not yet processed",
        },
      ]
    : [];
  const doc: SvgDocument = {
    root: rootId,
    nodes,
    retainedSheets: [],
    unsupported,
    version: 0,
  };
  const metadata: SourceMetadata = {
    originalSource: originalSource.replace(/^\uFEFF/, ""),
    sanitizedSource: xml,
    originalVersion: 0,
    sanitizationReport: { findings: [] },
  };

  return { doc, metadata };
}

export const parseDocument: Parser = (source, adapter) =>
  parse(source, adapter).doc;
