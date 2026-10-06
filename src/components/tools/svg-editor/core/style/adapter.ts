import type { Options } from "css-select";
import type { ElementNode, SvgDocument, SvgNode } from "../../contracts";

type ModelAdapter = NonNullable<Options<SvgNode, ElementNode>["adapter"]>;

export function createModelAdapter(document: SvgDocument): ModelAdapter {
  const requireNode = (id: string): SvgNode => {
    const node = document.nodes.get(id);
    if (!node) throw new Error(`SVG model references missing node "${id}".`);
    return node;
  };

  const descendants = (node: SvgNode): SvgNode[] =>
    node.kind === "element" ? node.children.map(requireNode) : [];

  const siblings = (node: SvgNode): SvgNode[] => {
    const parentId = node.parent;
    return parentId === null ? [node] : descendants(requireNode(parentId));
  };

  const parent = (node: SvgNode): SvgNode | null =>
    node.parent === null ? null : requireNode(node.parent);

  const textContent = (node: SvgNode): string =>
    node.kind === "text"
      ? node.value
      : node.kind === "element"
        ? node.children.map((id) => textContent(requireNode(id))).join("")
        : "";

  const isElement = (node: SvgNode): node is ElementNode =>
    node.kind === "element";
  const existsOne = (
    test: (element: ElementNode) => boolean,
    nodes: SvgNode[],
  ): boolean =>
    nodes.some(
      (node) =>
        (isElement(node) && test(node)) || existsOne(test, descendants(node)),
    );

  return {
    isTag: isElement,
    existsOne,
    getAttributeValue: (node, name) => node.attrs[name],
    getChildren: descendants,
    getName: (node) => node.tag,
    getParent: parent,
    getSiblings: siblings,
    getText: textContent,
    hasAttrib: (node, name) => Object.hasOwn(node.attrs, name),
    removeSubsets(nodes) {
      const included = new Set(nodes);
      return nodes.filter((node) => {
        for (
          let ancestor = parent(node);
          ancestor !== null;
          ancestor = parent(ancestor)
        ) {
          if (included.has(ancestor)) return false;
        }
        return true;
      });
    },
    findAll(test, nodes) {
      const results: ElementNode[] = [];
      const visit = (node: SvgNode): void => {
        if (isElement(node)) {
          if (test(node)) results.push(node);
          descendants(node).forEach(visit);
        }
      };
      nodes.forEach(visit);
      return results;
    },
    findOne(test, nodes) {
      const visit = (node: SvgNode): ElementNode | null => {
        if (isElement(node)) {
          if (test(node)) return node;
          for (const child of descendants(node)) {
            const found = visit(child);
            if (found) return found;
          }
        }
        return null;
      };
      for (const node of nodes) {
        const found = visit(node);
        if (found) return found;
      }
      return null;
    },
    prevElementSibling(node) {
      const siblingsOfNode = siblings(node);
      const index = siblingsOfNode.indexOf(node);
      for (let siblingIndex = index - 1; siblingIndex >= 0; siblingIndex -= 1) {
        const sibling = siblingsOfNode[siblingIndex];
        if (sibling && isElement(sibling)) return sibling;
      }
      return null;
    },
  };
}
