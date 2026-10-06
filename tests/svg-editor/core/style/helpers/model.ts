import type {
  Decl,
  ElementNode,
  ParsedStyleRule,
  PersistentMap,
  SvgDocument,
  SvgNode,
} from "../../../../../src/components/tools/svg-editor/contracts";

export interface ElementSpec {
  id: string;
  tag: string;
  parent?: string | null;
  attrs?: Record<string, string>;
  style?: Record<string, Decl>;
}

class NodeMap implements PersistentMap<string, SvgNode> {
  constructor(private readonly values = new Map<string, SvgNode>()) {}

  get size(): number {
    return this.values.size;
  }

  get(key: string): SvgNode | undefined {
    return this.values.get(key);
  }

  has(key: string): boolean {
    return this.values.has(key);
  }

  set(key: string, value: SvgNode): PersistentMap<string, SvgNode> {
    const next = new Map(this.values);
    next.set(key, value);
    return new NodeMap(next);
  }

  delete(key: string): PersistentMap<string, SvgNode> {
    const next = new Map(this.values);
    next.delete(key);
    return new NodeMap(next);
  }

  *entries(): IterableIterator<[string, SvgNode]> {
    yield* this.values.entries();
  }
}

export function declaration(value: string, important = false): Decl {
  return { value, important };
}

export function element(
  id: string,
  tag: string,
  options: Omit<ElementSpec, "id" | "tag"> = {},
): ElementSpec {
  return { id, tag, ...options };
}

export function styleRule(
  selector: string,
  declarations: Record<string, Decl>,
  sourceOrder: number,
): ParsedStyleRule {
  return { selector, declarations, sourceOrder };
}

export function buildDocument(
  elements: readonly ElementSpec[],
  rules: readonly ParsedStyleRule[] = [],
): SvgDocument {
  const roots = elements.filter(
    ({ parent }) => parent === undefined || parent === null,
  );
  const root = roots[0];
  if (roots.length !== 1 || !root) {
    throw new Error(`Expected one root element, received ${roots.length}.`);
  }

  const elementsById = new Map(elements.map((item) => [item.id, item]));
  if (elementsById.size !== elements.length) {
    throw new Error("Element IDs must be unique.");
  }

  const nodes = elements.reduce<PersistentMap<string, SvgNode>>(
    (current, spec) => {
      const parent = spec.parent ?? null;
      const node: ElementNode = {
        kind: "element",
        id: spec.id,
        tag: spec.tag,
        attrs: spec.attrs ?? {},
        style: spec.style ?? {},
        children: elements
          .filter((child) => child.parent === spec.id)
          .map(({ id }) => id),
        parent,
      };
      return current.set(spec.id, node);
    },
    new NodeMap(),
  );

  for (const { id, parent } of elements) {
    if (parent != null && !elementsById.has(parent)) {
      throw new Error(`Element "${id}" has missing parent "${parent}".`);
    }
  }

  return {
    root: root.id,
    nodes,
    retainedSheets: rules.length > 0 ? [{ rules: [...rules] }] : [],
    unsupported: [],
    version: 0,
  };
}

export function withStyleElement(
  document: SvgDocument,
  cssText: string,
): SvgDocument {
  const root = document.nodes.get(document.root);
  if (!root || root.kind !== "element") {
    throw new Error("Cannot add a style element without an SVG root.");
  }

  const styleId = `style-${document.nodes.size}`;
  const textId = `${styleId}-text`;
  const style: ElementNode = {
    kind: "element",
    id: styleId,
    tag: "style",
    attrs: {},
    style: {},
    children: [textId],
    parent: root.id,
  };
  const text: SvgNode = {
    kind: "text",
    id: textId,
    value: cssText,
    parent: styleId,
  };
  const updatedRoot: ElementNode = {
    ...root,
    children: [...root.children, styleId],
  };

  return {
    ...document,
    nodes: document.nodes
      .set(root.id, updatedRoot)
      .set(styleId, style)
      .set(textId, text),
  };
}
