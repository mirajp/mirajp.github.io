import { describe, expect, it } from "vitest";
import type {
  ElementNode,
  ModelDiff,
  NodeId,
  PersistentMap,
  RendererPatch,
  SvgDocument,
  SvgNode,
} from "../../../../src/components/tools/svg-editor/contracts";
import {
  SvgRenderer,
  diff,
} from "../../../../src/components/tools/svg-editor/render/renderer";

class NodeMap implements PersistentMap<NodeId, SvgNode> {
  constructor(private readonly nodes: ReadonlyMap<NodeId, SvgNode>) {}

  get size(): number {
    return this.nodes.size;
  }

  get(id: NodeId): SvgNode | undefined {
    return this.nodes.get(id);
  }

  has(id: NodeId): boolean {
    return this.nodes.has(id);
  }

  set(id: NodeId, node: SvgNode): PersistentMap<NodeId, SvgNode> {
    const next = new Map(this.nodes);
    next.set(id, node);
    return new NodeMap(next);
  }

  delete(id: NodeId): PersistentMap<NodeId, SvgNode> {
    const next = new Map(this.nodes);
    next.delete(id);
    return new NodeMap(next);
  }

  entries(): IterableIterator<[NodeId, SvgNode]> {
    return this.nodes.entries();
  }
}

function element(
  id: NodeId,
  tag: string,
  parent: NodeId | null,
  children: NodeId[] = [],
  attrs: Record<string, string> = {},
  style: ElementNode["style"] = {},
): ElementNode {
  return { kind: "element", id, tag, parent, children, attrs, style };
}

function documentOf(entries: SvgNode[], version = 0): SvgDocument {
  return {
    root: "root",
    nodes: new NodeMap(new Map(entries.map((node) => [node.id, node]))),
    retainedSheets: [],
    unsupported: [],
    version,
  };
}

function initialDocument(): SvgDocument {
  return documentOf([
    element("root", "svg", null, ["left", "right"], {
      xmlns: "http://www.w3.org/2000/svg",
    }),
    element("left", "g", "root", ["shape"]),
    element(
      "shape",
      "rect",
      "left",
      [],
      { x: "1", width: "5" },
      {
        fill: { value: "red", important: false },
      },
    ),
    element("right", "g", "root", ["circle"]),
    element("circle", "circle", "right", [], { r: "2" }),
  ]);
}

function changedAttribute(previous: SvgDocument): SvgDocument {
  const changed = previous.nodes.get("shape");
  if (!changed || changed.kind !== "element") throw new Error("missing shape");
  return {
    ...previous,
    version: previous.version + 1,
    nodes: previous.nodes.set("shape", {
      ...changed,
      attrs: { ...changed.attrs, x: "9" },
    }),
  };
}

function changedStyle(previous: SvgDocument): SvgDocument {
  const changed = previous.nodes.get("shape");
  if (!changed || changed.kind !== "element") throw new Error("missing shape");
  return {
    ...previous,
    version: previous.version + 1,
    nodes: previous.nodes.set("shape", {
      ...changed,
      style: { fill: { value: "blue", important: true } },
    }),
  };
}

function changedStructure(previous: SvgDocument): SvgDocument {
  const parent = previous.nodes.get("left");
  if (!parent || parent.kind !== "element") throw new Error("missing left");
  return {
    ...previous,
    version: previous.version + 1,
    nodes: previous.nodes
      .set("left", { ...parent, children: ["shape", "added"] })
      .set("added", element("added", "circle", "left", [], { r: "3" })),
  };
}

describe("interactive SVG renderer", () => {
  it("mounts and destroys idempotently, with one root tree and no stale node references", () => {
    const container = document.createElement("div");
    const renderer = new SvgRenderer();
    const model = initialDocument();

    renderer.mount(container);
    renderer.mount(container);
    renderer.render(model);
    renderer.render(model);

    expect(container.querySelectorAll(":scope > svg")).toHaveLength(1);
    expect(renderer.nodeToElement("shape")).toBeInstanceOf(SVGElement);
    expect(renderer.nodeToElement("shape")?.getAttribute("data-nid")).toBe(
      "shape",
    );

    renderer.destroy();
    renderer.destroy();
    expect(container.childElementCount).toBe(0);
    expect(renderer.nodeToElement("shape")).toBeNull();
  });

  it("renders top-level comments and processing instructions before the SVG root", () => {
    const container = document.createElement("div");
    const renderer = new SvgRenderer();
    const model = documentOf([
      element("root", "svg", null, [], {
        xmlns: "http://www.w3.org/2000/svg",
      }),
      {
        kind: "processing-instruction",
        id: "pi",
        target: "xml-stylesheet",
        data: 'href="#embedded"',
        parent: null,
      },
      { kind: "comment", id: "comment", value: "license", parent: null },
    ]);
    renderer.mount(container);
    renderer.render(model);

    expect(container.childNodes[0].nodeType).toBe(
      Node.PROCESSING_INSTRUCTION_NODE,
    );
    expect(container.childNodes[1].nodeType).toBe(Node.COMMENT_NODE);
    expect((container.childNodes[1] as Comment).data).toBe("license");
    expect((container.childNodes[2] as SVGElement).tagName).toBe("svg");
  });

  it("patches ordinary attributes and styles without recreating elements", () => {
    const container = document.createElement("div");
    const renderer = new SvgRenderer();
    const before = initialDocument();
    renderer.mount(container);
    renderer.render(before);

    const root = renderer.nodeToElement("root");
    const left = renderer.nodeToElement("left");
    const shape = renderer.nodeToElement("shape");
    const next = changedStyle(changedAttribute(before));
    const modelDiff: ModelDiff = diff(before, next);
    renderer.patch(modelDiff);

    expect(renderer.nodeToElement("root")).toBe(root);
    expect(renderer.nodeToElement("left")).toBe(left);
    expect(renderer.nodeToElement("shape")).toBe(shape);
    expect(shape?.getAttribute("x")).toBe("9");
    expect(
      (shape as SVGRectElement | null)?.style.getPropertyValue("fill"),
    ).toBe("blue");
    expect(
      (shape as SVGRectElement | null)?.style.getPropertyPriority("fill"),
    ).toBe("important");
  });

  it("rebuilds only the structurally changed branch", () => {
    const container = document.createElement("div");
    const renderer = new SvgRenderer();
    const before = initialDocument();
    renderer.mount(container);
    renderer.render(before);
    const root = renderer.nodeToElement("root");
    const left = renderer.nodeToElement("left");
    const oldShape = renderer.nodeToElement("shape");
    const right = renderer.nodeToElement("right");
    const oldCircle = renderer.nodeToElement("circle");

    const next = changedStructure(before);
    renderer.patch(diff(before, next));

    expect(renderer.nodeToElement("root")).toBe(root);
    expect(renderer.nodeToElement("left")).toBe(left);
    expect(renderer.nodeToElement("right")).toBe(right);
    expect(renderer.nodeToElement("circle")).toBe(oldCircle);
    expect(renderer.nodeToElement("shape")).not.toBe(oldShape);
    expect(renderer.nodeToElement("added")?.parentElement).toBe(left);
  });

  it("commits preview values when a model render follows", () => {
    const container = document.createElement("div");
    const renderer = new SvgRenderer();
    const before = initialDocument();
    renderer.mount(container);
    renderer.render(before);
    const preview: RendererPatch = {
      nodeId: "shape",
      attributes: { x: "20" },
      styles: { fill: "green" },
    };
    renderer.preview(preview);
    expect(renderer.nodeToElement("shape")?.getAttribute("x")).toBe("20");
    const committed = changedAttribute(before);
    renderer.patch(diff(before, committed));
    expect(renderer.nodeToElement("shape")?.getAttribute("x")).toBe("9");
    expect((renderer.nodeToElement("shape") as SVGElement).style.fill).toBe(
      "red",
    );
  });

  it("cancels a preview by rendering the unchanged model", () => {
    const container = document.createElement("div");
    const renderer = new SvgRenderer();
    const before = initialDocument();
    renderer.mount(container);
    renderer.render(before);
    renderer.preview({
      nodeId: "shape",
      attributes: { x: "20" },
      styles: { fill: "green" },
    });
    renderer.render(before);

    expect(renderer.nodeToElement("shape")?.getAttribute("x")).toBe("1");
    expect((renderer.nodeToElement("shape") as SVGElement).style.fill).toBe(
      "red",
    );
  });

  it("computes a diff with changed nodes and structural parents", () => {
    const before = initialDocument();
    const next = changedStructure(before);
    const modelDiff = diff(before, next);

    expect(modelDiff.previous).toBe(before);
    expect(modelDiff.next).toBe(next);
    expect(modelDiff.structuralNodeIds).toContain("left");
    expect(modelDiff.changedNodeIds).toContain("added");
  });
});
