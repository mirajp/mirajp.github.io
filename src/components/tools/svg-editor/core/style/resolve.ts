import { compile } from "css-select";
import {
  compare as compareSpecificity,
  selectorSpecificity,
  type Specificity,
} from "@csstools/selector-specificity";
import selectorParser from "postcss-selector-parser";
import type {
  Decl,
  ElementNode,
  ResolveStyle,
  ResolvedStyle,
  SvgDocument,
  SvgNode,
} from "../../contracts";
import { createModelAdapter } from "./adapter";
import {
  collectStyleRules,
  recordUnsupportedStyle,
  type StyleRule,
} from "./rules";

interface Candidate {
  declaration: Decl;
  source: "inline" | "stylesheet" | "presentation";
  declaredOn: string;
  specificity: Specificity;
  sourceOrder: number;
}

const INITIAL_VALUES: Readonly<Record<string, string>> = {
  color: "black",
  fill: "black",
  "fill-opacity": "1",
  "fill-rule": "nonzero",
  opacity: "1",
  stroke: "none",
  "stroke-dasharray": "none",
  "stroke-dashoffset": "0",
  "stroke-linecap": "butt",
  "stroke-linejoin": "miter",
  "stroke-miterlimit": "4",
  "stroke-opacity": "1",
  "stroke-width": "1",
  visibility: "visible",
};

const INHERITED_PROPERTIES = new Set([
  "color",
  "cursor",
  "direction",
  "fill",
  "fill-opacity",
  "fill-rule",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "marker-end",
  "marker-mid",
  "marker-start",
  "paint-order",
  "pointer-events",
  "shape-rendering",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-rendering",
  "visibility",
  "word-spacing",
]);

const PRESENTATION_PROPERTIES = new Set([
  ...Object.keys(INITIAL_VALUES),
  ...INHERITED_PROPERTIES,
  "clip-path",
  "clip-rule",
  "display",
  "filter",
  "mask",
  "mix-blend-mode",
  "overflow",
  "stop-color",
  "stop-opacity",
  "transform",
]);

function normalizedProperty(property: string): string {
  return property.startsWith("--") ? property : property.toLowerCase();
}

function findDeclaration(
  declarations: Record<string, Decl>,
  property: string,
): Decl | undefined {
  const key = normalizedProperty(property);
  if (key.startsWith("--")) return declarations[key];
  const foundKey = Object.keys(declarations).find(
    (candidate) => candidate.toLowerCase() === key,
  );
  return foundKey ? declarations[foundKey] : undefined;
}

function supportedSelector(selector: selectorParser.Selector): boolean {
  return selector.nodes.every((node) => {
    if (node.type === "combinator") {
      return node.value.trim() === "" || node.value === ">";
    }
    if (node.type === "comment") return true;
    if (
      node.type === "tag" ||
      node.type === "universal" ||
      node.type === "id" ||
      node.type === "class" ||
      node.type === "attribute"
    ) {
      return !("namespace" in node) || node.namespace === undefined;
    }
    return false;
  });
}

function matchingRules(
  document: SvgDocument,
  node: ElementNode,
  property: string,
  rules: readonly StyleRule[],
): Candidate[] {
  const adapter = createModelAdapter(document);
  const candidates: Candidate[] = [];

  for (const rule of rules) {
    let parsed: ReturnType<ReturnType<typeof selectorParser>["astSync"]>;
    try {
      parsed = selectorParser().astSync(rule.selector);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Selector could not be parsed.";
      recordUnsupportedStyle(document, {
        kind: "style-selector",
        message,
        nodeId: node.id,
        source: rule.source,
      });
      continue;
    }

    for (const selector of parsed.nodes) {
      if (!supportedSelector(selector)) {
        recordUnsupportedStyle(document, {
          kind: "style-selector",
          message: `Unsupported selector "${selector.toString()}".`,
          nodeId: node.id,
          source: rule.source,
        });
        continue;
      }

      let matches: (element: ElementNode) => boolean;
      try {
        matches = compile<SvgNode, ElementNode>(selector.toString(), {
          adapter,
          xmlMode: true,
          lowerCaseAttributeNames: false,
          lowerCaseTags: false,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Selector could not compile.";
        recordUnsupportedStyle(document, {
          kind: "style-selector",
          message,
          nodeId: node.id,
          source: rule.source,
        });
        continue;
      }
      if (!matches(node)) continue;
      const declaration = findDeclaration(rule.declarations, property);
      if (!declaration) continue;

      candidates.push({
        declaration,
        source: "stylesheet",
        declaredOn: node.id,
        specificity: selectorSpecificity(selector),
        sourceOrder: rule.sourceOrder,
      });
    }
  }

  return candidates;
}

function chooseWinner(candidates: readonly Candidate[]): Candidate | undefined {
  return [...candidates]
    .sort((left, right) => {
      if (left.declaration.important !== right.declaration.important) {
        return left.declaration.important ? 1 : -1;
      }
      const sourceRank = (candidate: Candidate): number =>
        candidate.source === "inline"
          ? 2
          : candidate.source === "stylesheet"
            ? 1
            : 0;
      const origin = sourceRank(left) - sourceRank(right);
      if (origin !== 0) return origin;
      const specificity = compareSpecificity(
        left.specificity,
        right.specificity,
      );
      if (left.source !== "stylesheet" || right.source !== "stylesheet") {
        return specificity;
      }
      if (specificity !== 0) return specificity;
      return left.sourceOrder - right.sourceOrder;
    })
    .at(-1);
}

function candidateForProperty(
  document: SvgDocument,
  node: ElementNode,
  property: string,
  rules: readonly StyleRule[],
): Candidate | undefined {
  const key = normalizedProperty(property);
  const inline = findDeclaration(node.style, key);
  const candidates: Candidate[] = [];

  if (inline) {
    candidates.push({
      declaration: inline,
      source: "inline",
      declaredOn: node.id,
      specificity: { a: 0, b: 0, c: 0 },
      sourceOrder: Number.MAX_SAFE_INTEGER,
    });
  }

  if (!key.startsWith("--") && PRESENTATION_PROPERTIES.has(key)) {
    const attribute = node.attrs[key];
    if (attribute !== undefined) {
      candidates.push({
        declaration: { value: attribute, important: false },
        source: "presentation",
        declaredOn: node.id,
        specificity: { a: 0, b: 0, c: 0 },
        sourceOrder: -1,
      });
    }
  }

  const stylesheetCandidates = matchingRules(document, node, key, rules);
  candidates.push(...stylesheetCandidates);

  return chooseWinner(candidates);
}

function parseVarFunction(
  value: string,
  start: number,
): {
  body: string;
  end: number;
} | null {
  let depth = 1;
  for (let index = start + 4; index < value.length; index += 1) {
    if (value[index] === "(") depth += 1;
    if (value[index] === ")") depth -= 1;
    if (depth === 0) {
      return { body: value.slice(start + 4, index), end: index + 1 };
    }
  }
  return null;
}

function splitFallback(body: string): [string, string | undefined] {
  let depth = 0;
  for (let index = 0; index < body.length; index += 1) {
    if (body[index] === "(") depth += 1;
    if (body[index] === ")") depth -= 1;
    if (body[index] === "," && depth === 0) {
      return [body.slice(0, index).trim(), body.slice(index + 1).trim()];
    }
  }
  return [body.trim(), undefined];
}

function expandVariables(
  value: string,
  document: SvgDocument,
  nodeId: string,
  rules: readonly StyleRule[],
  resolving: Set<string>,
): string | null {
  let result = "";
  let cursor = 0;
  while (cursor < value.length) {
    const match = /var\s*\(/iy;
    match.lastIndex = cursor;
    const found = match.exec(value);
    if (!found) {
      result += value[cursor];
      cursor += 1;
      continue;
    }

    const start = found.index;
    const parsed = parseVarFunction(value, start + found[0].length - 4);
    if (!parsed) return null;
    result += value.slice(cursor, start);

    const [name, fallback] = splitFallback(parsed.body);
    let replacement: string | null = null;
    if (name.startsWith("--")) {
      const resolved = resolveAtNode(document, nodeId, name, rules, resolving);
      if (resolved) {
        replacement = expandVariables(
          resolved.value,
          document,
          resolved.declaredOn ?? nodeId,
          rules,
          resolving,
        );
      }
    }
    if (replacement === null && fallback !== undefined) {
      replacement = expandVariables(
        fallback,
        document,
        nodeId,
        rules,
        resolving,
      );
    }
    if (replacement === null) return null;
    result += replacement;
    cursor = parsed.end;
  }
  return result;
}

function resolveAtNode(
  document: SvgDocument,
  nodeId: string,
  property: string,
  rules: readonly StyleRule[],
  resolving: Set<string>,
): ResolvedStyle | undefined {
  const node = document.nodes.get(nodeId);
  if (!node || node.kind !== "element") return undefined;
  const normalized = normalizedProperty(property);
  const key = `${nodeId}\u0000${normalized}`;
  if (resolving.has(key)) return undefined;
  resolving.add(key);

  const direct = candidateForProperty(document, node, normalized, rules);
  if (direct) {
    let value = direct.declaration.value;
    const expanded = expandVariables(value, document, nodeId, rules, resolving);
    if (expanded !== null) value = expanded;

    if (
      value.trim().toLowerCase() === "currentcolor" &&
      normalized !== "color"
    ) {
      const color = resolveAtNode(document, nodeId, "color", rules, resolving);
      if (color) value = color.value;
    }

    if (expanded !== null) {
      resolving.delete(key);
      return {
        value,
        source: direct.source,
        important: direct.declaration.important,
        declaredOn: direct.declaredOn,
      };
    }
    recordUnsupportedStyle(document, {
      kind: "style-value",
      message: `Unresolvable custom property in "${normalized}".`,
      nodeId,
    });
  }

  if (normalized.startsWith("--") || INHERITED_PROPERTIES.has(normalized)) {
    const parentId = node.parent;
    if (parentId !== null) {
      const inherited = resolveAtNode(
        document,
        parentId,
        normalized,
        rules,
        resolving,
      );
      if (inherited && inherited.source !== "default") {
        resolving.delete(key);
        return {
          ...inherited,
          source: "inherited",
          declaredOn: inherited.declaredOn ?? parentId,
        };
      }
    }
  }

  resolving.delete(key);
  const initial = INITIAL_VALUES[normalized];
  return initial === undefined
    ? undefined
    : { value: initial, source: "default" };
}

export const resolveStyle: ResolveStyle = (document, nodeId, property) => {
  const node = document.nodes.get(nodeId);
  if (!node || node.kind !== "element") {
    throw new Error(
      `Cannot resolve style for missing SVG element "${nodeId}".`,
    );
  }
  const rules = collectStyleRules(document);
  return (
    resolveAtNode(document, nodeId, property, rules, new Set()) ?? {
      value: "",
      source: "default",
    }
  );
};
