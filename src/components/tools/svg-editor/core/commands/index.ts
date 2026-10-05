import type {
  Command,
  Decl,
  ElementNode,
  NodeId,
  SvgDocument,
} from "../../contracts";

export function setAttr(
  nodeId: NodeId,
  name: string,
  value: string | null,
): Command {
  return {
    id: `SetAttr:${nodeId}:${name}`,
    label: `Set ${name}`,
    apply(document) {
      const node = getElement(document, nodeId);
      const attrs = { ...node.attrs };
      if (value === null) delete attrs[name];
      else attrs[name] = value;
      return {
        ...document,
        nodes: document.nodes.set(nodeId, { ...node, attrs }),
      };
    },
  };
}

export function setStyle(
  nodeId: NodeId,
  property: string,
  value: string | null,
  important = false,
): Command {
  return {
    id: `SetStyle:${nodeId}:${property}`,
    label: `Set ${property}`,
    apply(document) {
      const node = getElement(document, nodeId);
      const style: Record<string, Decl> = { ...node.style };
      if (value === null) delete style[property];
      else style[property] = { value, important };
      return {
        ...document,
        nodes: document.nodes.set(nodeId, { ...node, style }),
      };
    },
  };
}

function getElement(document: SvgDocument, nodeId: NodeId): ElementNode {
  const node = document.nodes.get(nodeId);
  if (!node || node.kind !== "element") {
    throw new Error(`Node ${nodeId} is not an SVG element.`);
  }
  return node;
}
