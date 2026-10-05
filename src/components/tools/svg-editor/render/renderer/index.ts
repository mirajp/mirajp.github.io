import type {
  ElementNode,
  ModelDiff,
  NodeId,
  Renderer,
  RendererPatch,
  SvgDocument,
  SvgNode,
} from "../../contracts";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XML_NAMESPACE = "http://www.w3.org/XML/1998/namespace";
const XMLNS_NAMESPACE = "http://www.w3.org/2000/xmlns/";
const XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";

function sameNode(
  left: SvgNode | undefined,
  right: SvgNode | undefined,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function parentId(node: SvgNode | undefined): NodeId | null {
  return node?.parent ?? null;
}

function removeNode(node: Node | undefined): void {
  if (node?.parentNode) node.parentNode.removeChild(node);
}

/**
 * Compares model snapshots and identifies nodes requiring updates or subtree reconstruction.
 */
export function diff(previous: SvgDocument, next: SvgDocument): ModelDiff {
  const previousNodes = new Map(previous.nodes.entries());
  const nextNodes = new Map(next.nodes.entries());
  const ids = new Set([...previousNodes.keys(), ...nextNodes.keys()]);
  const changedNodeIds: NodeId[] = [];
  const structuralNodeIds = new Set<NodeId>();

  for (const id of ids) {
    const before = previousNodes.get(id);
    const after = nextNodes.get(id);
    if (sameNode(before, after)) continue;
    changedNodeIds.push(id);

    if (!before || !after) {
      structuralNodeIds.add(id);
      const beforeParent = parentId(before);
      const afterParent = parentId(after);
      if (beforeParent) structuralNodeIds.add(beforeParent);
      if (afterParent) structuralNodeIds.add(afterParent);
      continue;
    }

    const nodeStructureChanged =
      before.kind !== after.kind ||
      (before.kind === "element" &&
        after.kind === "element" &&
        (before.tag !== after.tag || before.parent !== after.parent));
    if (nodeStructureChanged) {
      structuralNodeIds.add(id);
      const beforeParent = parentId(before);
      const afterParent = parentId(after);
      if (beforeParent) structuralNodeIds.add(beforeParent);
      if (afterParent) structuralNodeIds.add(afterParent);
    } else if (
      before.kind === "element" &&
      after.kind === "element" &&
      (before.children.length !== after.children.length ||
        before.children.some((child, index) => child !== after.children[index]))
    ) {
      structuralNodeIds.add(id);
    }
  }

  return {
    previous,
    next,
    changedNodeIds,
    structuralNodeIds: Array.from(structuralNodeIds),
  };
}

function styleAttribute(node: ElementNode): string {
  return Object.entries(node.style)
    .map(
      ([property, declaration]) =>
        `${property}: ${declaration.value}${declaration.important ? " !important" : ""}`,
    )
    .join("; ");
}

function attributeNamespace(name: string): string | null {
  if (name === "xmlns" || name.startsWith("xmlns:")) return XMLNS_NAMESPACE;
  if (name.startsWith("xml:")) return XML_NAMESPACE;
  if (name.startsWith("xlink:")) return XLINK_NAMESPACE;
  return null;
}

function writeAttribute(element: Element, name: string, value: string): void {
  const namespace = attributeNamespace(name);
  if (namespace) element.setAttributeNS(namespace, name, value);
  else element.setAttribute(name, value);
}

export class SvgRenderer implements Renderer {
  private container: Element | null = null;
  private rootElement: SVGElement | null = null;
  private currentDocument: SvgDocument | null = null;
  private readonly elements = new Map<NodeId, SVGElement>();
  private readonly domNodes = new Map<NodeId, Node>();

  mount(container: Element): void {
    if (
      this.container === container &&
      this.rootElement?.parentNode === container
    ) {
      return;
    }
    if (this.container && this.container !== container) {
      this.detach();
    }
    this.container = container;
    if (this.currentDocument) {
      this.renderDocument(this.currentDocument, new Set());
    }
  }

  render(document: SvgDocument): void {
    const structural = this.currentDocument
      ? new Set(diff(this.currentDocument, document).structuralNodeIds)
      : new Set<NodeId>();
    if (this.container) this.renderDocument(document, structural);
    this.currentDocument = document;
  }

  patch(modelDiff: ModelDiff): void {
    if (this.container) {
      this.renderDocument(modelDiff.next, new Set(modelDiff.structuralNodeIds));
    }
    this.currentDocument = modelDiff.next;
  }

  preview(patch: RendererPatch): void {
    const element = this.elements.get(patch.nodeId);
    if (!element) return;

    for (const [name, value] of Object.entries(patch.attributes ?? {})) {
      if (value === null) element.removeAttribute(name);
      else writeAttribute(element, name, value);
    }
    for (const [name, value] of Object.entries(patch.styles ?? {})) {
      if (value === null) element.style.removeProperty(name);
      else element.style.setProperty(name, value);
    }
  }

  nodeToElement(id: NodeId): SVGElement | null {
    return this.elements.get(id) ?? null;
  }

  destroy(): void {
    this.detach();
    this.currentDocument = null;
    this.elements.clear();
    this.domNodes.clear();
  }

  private detach(): void {
    removeNode(this.rootElement ?? undefined);
    this.rootElement = null;
    this.container = null;
    this.elements.clear();
    this.domNodes.clear();
  }

  private renderDocument(
    document: SvgDocument,
    structuralNodeIds: Set<NodeId>,
  ): void {
    if (!this.container) return;
    const rootNode = document.nodes.get(document.root);
    if (!rootNode || rootNode.kind !== "element" || rootNode.parent !== null) {
      throw new TypeError("Renderer requires a root element node");
    }

    const rootElement = this.elements.get(rootNode.id);
    if (
      !rootElement ||
      rootElement.localName !== rootNode.tag ||
      rootElement.parentNode !== this.container
    ) {
      this.clearMappedNodes();
      this.rootElement = this.createElement(rootNode);
      this.container.appendChild(this.rootElement);
      this.elements.set(rootNode.id, this.rootElement);
      this.domNodes.set(rootNode.id, this.rootElement);
    }

    const root = this.elements.get(rootNode.id);
    if (!root) throw new Error("Failed to create the SVG root element");
    this.rootElement = root;
    this.reconcileElement(rootNode, document, structuralNodeIds);

    for (const [, modelNode] of document.nodes.entries()) {
      if (
        (modelNode.kind !== "processing-instruction" &&
          modelNode.kind !== "comment") ||
        modelNode.parent !== null
      ) {
        continue;
      }
      this.reconcileTopLevelInstruction(modelNode);
      if (!this.rootElement.parentNode)
        this.container.appendChild(this.rootElement);
    }

    const retained = new Set(
      Array.from(document.nodes.entries(), ([id]) => id),
    );
    for (const id of this.elements.keys()) {
      if (!retained.has(id)) {
        removeNode(this.elements.get(id));
        this.elements.delete(id);
      }
    }
    for (const id of this.domNodes.keys()) {
      if (!retained.has(id)) {
        removeNode(this.domNodes.get(id));
        this.domNodes.delete(id);
      }
    }
  }

  private clearMappedNodes(): void {
    this.elements.clear();
    this.domNodes.clear();
    removeNode(this.rootElement ?? undefined);
    this.rootElement = null;
  }

  private createElement(node: ElementNode): SVGElement {
    const element = this.container!.ownerDocument.createElementNS(
      SVG_NAMESPACE,
      node.tag,
    );
    element.setAttribute("data-nid", node.id);
    return element;
  }

  private applyAttributes(element: SVGElement, node: ElementNode): void {
    const expected = new Set([...Object.keys(node.attrs), "data-nid"]);
    for (const attribute of Array.from(element.attributes)) {
      if (!expected.has(attribute.name)) {
        if (attribute.namespaceURI) {
          element.removeAttributeNS(
            attribute.namespaceURI,
            attribute.localName,
          );
        } else {
          element.removeAttribute(attribute.name);
        }
      }
    }

    let wroteStyle = false;
    for (const [name, rawValue] of Object.entries(node.attrs)) {
      const value = name === "style" ? styleAttribute(node) : rawValue;
      writeAttribute(element, name, value);
      if (name === "style") wroteStyle = true;
    }
    if (!wroteStyle && Object.keys(node.style).length > 0) {
      element.setAttribute("style", styleAttribute(node));
    }
    element.setAttribute("data-nid", node.id);
  }

  private removeMappedSubtree(id: NodeId, document: SvgDocument): void {
    const node = document.nodes.get(id);
    if (node?.kind === "element") {
      for (const childId of node.children) {
        this.removeMappedSubtree(childId, document);
      }
    }
    this.elements.delete(id);
    this.domNodes.delete(id);
  }

  private reconcileElement(
    model: ElementNode,
    document: SvgDocument,
    structuralNodeIds: Set<NodeId>,
  ): SVGElement {
    let element = this.elements.get(model.id);
    if (element && element.localName !== model.tag) {
      removeNode(element);
      this.removeMappedSubtree(model.id, this.currentDocument ?? document);
      element = undefined;
    }
    if (!element) {
      element = this.createElement(model);
      this.elements.set(model.id, element);
      this.domNodes.set(model.id, element);
    }
    this.applyAttributes(element, model);

    const forceChildren = structuralNodeIds.has(model.id);
    if (forceChildren) {
      const previous = this.currentDocument;
      if (previous) {
        const oldModel = previous.nodes.get(model.id);
        if (oldModel?.kind === "element") {
          for (const oldChild of oldModel.children) {
            this.removeMappedSubtree(oldChild, previous);
          }
        }
      }
      element.replaceChildren();
    }

    let insertionPoint: ChildNode | null = element.firstChild;
    for (const childId of model.children) {
      const child = document.nodes.get(childId);
      if (!child)
        throw new Error(`SVG document references missing node ${childId}`);
      const childDom = this.reconcileNode(
        child,
        element,
        document,
        structuralNodeIds,
      );
      if (childDom !== insertionPoint) {
        element.insertBefore(childDom, insertionPoint);
      } else {
        insertionPoint = insertionPoint?.nextSibling ?? null;
      }
    }
    while (insertionPoint) {
      const next = insertionPoint.nextSibling;
      removeNode(insertionPoint);
      insertionPoint = next;
    }
    return element;
  }

  private reconcileNode(
    model: SvgNode,
    parentElement: SVGElement,
    document: SvgDocument,
    structuralNodeIds: Set<NodeId>,
  ): Node {
    if (model.kind === "element") {
      const existing = this.elements.get(model.id);
      if (existing?.parentNode && existing.parentNode !== parentElement) {
        removeNode(existing);
      }
      const element = this.reconcileElement(model, document, structuralNodeIds);
      return element;
    }

    let domNode = this.domNodes.get(model.id);
    if (
      model.kind === "text" &&
      (!domNode || domNode.nodeType !== Node.TEXT_NODE)
    ) {
      removeNode(domNode ?? undefined);
      domNode = parentElement.ownerDocument.createTextNode(model.value);
      this.domNodes.set(model.id, domNode);
    } else if (
      model.kind === "comment" &&
      (!domNode || domNode.nodeType !== Node.COMMENT_NODE)
    ) {
      removeNode(domNode ?? undefined);
      domNode = parentElement.ownerDocument.createComment(model.value);
      this.domNodes.set(model.id, domNode);
    } else if (
      model.kind === "processing-instruction" &&
      (!domNode || domNode.nodeType !== Node.PROCESSING_INSTRUCTION_NODE)
    ) {
      removeNode(domNode ?? undefined);
      domNode = parentElement.ownerDocument.createProcessingInstruction(
        model.target,
        model.data,
      );
      this.domNodes.set(model.id, domNode);
    }
    if (!domNode) throw new Error(`Unable to create SVG node ${model.id}`);

    if (model.kind === "text") domNode.nodeValue = model.value;
    else if (model.kind === "comment") domNode.nodeValue = model.value;
    else if (model.kind === "processing-instruction") {
      if (
        domNode.nodeName !== model.target ||
        domNode.nodeValue !== model.data
      ) {
        const replacement =
          parentElement.ownerDocument.createProcessingInstruction(
            model.target,
            model.data,
          );
        domNode.parentNode?.replaceChild(replacement, domNode);
        domNode = replacement;
        this.domNodes.set(model.id, domNode);
      }
    }
    return domNode;
  }

  private reconcileTopLevelInstruction(
    model:
      | Extract<SvgNode, { kind: "processing-instruction" }>
      | Extract<SvgNode, { kind: "comment" }>,
  ): void {
    const ownerDocument = this.container!.ownerDocument;
    let instruction = this.domNodes.get(model.id);
    if (model.kind === "comment") {
      if (!instruction || instruction.nodeType !== Node.COMMENT_NODE) {
        removeNode(instruction ?? undefined);
        instruction = ownerDocument.createComment(model.value);
        this.domNodes.set(model.id, instruction);
      } else if (instruction.nodeValue !== model.value) {
        instruction.nodeValue = model.value;
      }
    } else if (
      !instruction ||
      instruction.nodeType !== Node.PROCESSING_INSTRUCTION_NODE ||
      instruction.nodeName !== model.target
    ) {
      removeNode(instruction ?? undefined);
      instruction = ownerDocument.createProcessingInstruction(
        model.target,
        model.data,
      );
      this.domNodes.set(model.id, instruction);
    } else if (instruction.nodeValue !== model.data) {
      const replacement = ownerDocument.createProcessingInstruction(
        model.target,
        model.data,
      );
      instruction.parentNode?.replaceChild(replacement, instruction);
      instruction = replacement;
      this.domNodes.set(model.id, instruction);
    }
    const reference = this.rootElement;
    if (instruction.parentNode !== this.container) {
      this.container!.insertBefore(instruction, reference);
    }
  }
}
