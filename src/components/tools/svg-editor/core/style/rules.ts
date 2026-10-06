import { generate, parse, type CssTreeNode } from "css-tree";
import type {
  Decl,
  ParsedStyleRule,
  SvgDocument,
  SvgNode,
  UnsupportedRecord,
} from "../../contracts";

export interface StyleRule {
  selector: string;
  declarations: Record<string, Decl>;
  sourceOrder: number;
  source: string;
}

function childNodes(node: CssTreeNode | undefined): CssTreeNode[] {
  const result: CssTreeNode[] = [];
  node?.children?.forEach((child) => result.push(child));
  return result;
}

function addUnsupported(
  document: SvgDocument,
  record: UnsupportedRecord,
): void {
  const alreadyRecorded = document.unsupported.some(
    (item) =>
      item.kind === record.kind &&
      item.message === record.message &&
      item.source === record.source,
  );
  if (!alreadyRecorded) document.unsupported.push(record);
}

function collectText(document: SvgDocument, node: SvgNode): string {
  if (node.kind === "text") return node.value;
  if (node.kind !== "element") return "";
  return node.children
    .map((id) => {
      const child = document.nodes.get(id);
      if (!child) throw new Error(`SVG model references missing node "${id}".`);
      return collectText(document, child);
    })
    .join("");
}

function collectElements(document: SvgDocument): SvgNode[] {
  const result: SvgNode[] = [];
  const visit = (id: string): void => {
    const node = document.nodes.get(id);
    if (!node) throw new Error(`SVG model references missing node "${id}".`);
    result.push(node);
    if (node.kind === "element") node.children.forEach(visit);
  };
  visit(document.root);
  return result;
}

function parsedDeclarations(block: CssTreeNode): Record<string, Decl> {
  const declarations: Record<string, Decl> = {};
  for (const child of childNodes(block)) {
    if (
      child.type !== "Declaration" ||
      !child.property ||
      typeof child.value !== "object" ||
      child.value === null
    ) {
      continue;
    }
    declarations[child.property] = {
      value: generate(child.value).trim(),
      important: child.important === true,
    };
  }
  return declarations;
}

function appendParsedSheet(
  document: SvgDocument,
  cssText: string,
  source: string,
  rules: StyleRule[],
): void {
  if (!cssText.trim()) return;

  let parseError: Error | undefined;
  let ast: CssTreeNode;
  try {
    ast = parse(cssText, {
      positions: false,
      onParseError: (error) => {
        parseError ??= error;
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "CSS could not be parsed.";
    addUnsupported(document, {
      kind: "style-parse",
      message,
      source,
    });
    return;
  }
  if (parseError) {
    addUnsupported(document, {
      kind: "style-parse",
      message: parseError.message,
      source,
    });
  }

  for (const child of childNodes(ast)) {
    if (child.type === "Atrule") {
      addUnsupported(document, {
        kind: "style-construct",
        message: `Unsupported CSS at-rule @${child.name ?? "unknown"}.`,
        source,
      });
      continue;
    }
    if (child.type !== "Rule" || !child.prelude || !child.block) {
      addUnsupported(document, {
        kind: "style-construct",
        message: `Unsupported CSS node "${child.type}".`,
        source,
      });
      continue;
    }

    const declarations = parsedDeclarations(child.block);
    if (Object.keys(declarations).length === 0) continue;
    for (const selector of childNodes(child.prelude)) {
      if (selector.type !== "Selector") {
        addUnsupported(document, {
          kind: "style-selector",
          message: `Unsupported selector node "${selector.type}".`,
          source,
        });
        continue;
      }
      rules.push({
        selector: generate(selector).trim(),
        declarations,
        sourceOrder: rules.length,
        source,
      });
    }
  }
}

function appendRetainedRules(
  document: SvgDocument,
  parsedRules: readonly ParsedStyleRule[],
  source: string,
  rules: StyleRule[],
): void {
  const ordered = [...parsedRules].sort(
    (left, right) => left.sourceOrder - right.sourceOrder,
  );
  for (const rule of ordered) {
    rules.push({
      selector: rule.selector,
      declarations: rule.declarations,
      sourceOrder: rules.length,
      source,
    });
  }
}

export function collectStyleRules(document: SvgDocument): StyleRule[] {
  const rules: StyleRule[] = [];
  for (const node of collectElements(document)) {
    if (node.kind === "element" && node.tag === "style") {
      appendParsedSheet(
        document,
        collectText(document, node),
        `style element ${node.id}`,
        rules,
      );
    }
  }

  document.retainedSheets.forEach((sheet, index) => {
    appendRetainedRules(
      document,
      sheet.rules,
      `retained stylesheet ${index + 1}`,
      rules,
    );
  });
  return rules;
}

export function recordUnsupportedStyle(
  document: SvgDocument,
  record: UnsupportedRecord,
): void {
  addUnsupported(document, record);
}
