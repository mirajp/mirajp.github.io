import { describe, expect, it } from "vitest";
import type {
  ElementNode,
  PersistentMap,
  SvgDocument,
  SvgNode,
} from "../../../../src/components/tools/svg-editor/contracts";
import {
  setAttr,
  setStyle,
} from "../../../../src/components/tools/svg-editor/core/commands";

class NodeMap implements PersistentMap<string, SvgNode> {
  constructor(private readonly entriesMap = new Map<string, SvgNode>()) {}

  get size(): number {
    return this.entriesMap.size;
  }

  get(key: string): SvgNode | undefined {
    return this.entriesMap.get(key);
  }

  has(key: string): boolean {
    return this.entriesMap.has(key);
  }

  set(key: string, value: SvgNode): PersistentMap<string, SvgNode> {
    const next = new Map(this.entriesMap);
    next.set(key, value);
    return new NodeMap(next);
  }

  delete(key: string): PersistentMap<string, SvgNode> {
    const next = new Map(this.entriesMap);
    next.delete(key);
    return new NodeMap(next);
  }

  *entries(): IterableIterator<[string, SvgNode]> {
    yield* this.entriesMap.entries();
  }
}

function fixture(): SvgDocument {
  const root: ElementNode = {
    kind: "element",
    id: "root",
    tag: "svg",
    attrs: {},
    style: {},
    children: [],
    parent: null,
  };
  const rect: ElementNode = {
    kind: "element",
    id: "rect",
    tag: "rect",
    attrs: { fill: "red" },
    style: {},
    children: [],
    parent: "root",
  };
  return {
    root: "root",
    nodes: new NodeMap().set("root", root).set("rect", rect),
    retainedSheets: [],
    unsupported: [],
    version: 0,
  };
}

describe("SVG commands", () => {
  it("applies and removes attributes immutably", () => {
    const original = fixture();
    const updated = setAttr("rect", "fill", "blue").apply(original);
    expect((updated.nodes.get("rect") as ElementNode).attrs.fill).toBe("blue");
    expect((original.nodes.get("rect") as ElementNode).attrs.fill).toBe("red");

    const removed = setAttr("rect", "fill", null).apply(updated);
    expect((removed.nodes.get("rect") as ElementNode).attrs).not.toHaveProperty(
      "fill",
    );
  });

  it("applies style declarations including !important and removes them", () => {
    const original = fixture();
    const updated = setStyle("rect", "fill", "blue", true).apply(original);
    expect((updated.nodes.get("rect") as ElementNode).style.fill).toEqual({
      value: "blue",
      important: true,
    });

    const removed = setStyle("rect", "fill", null).apply(updated);
    expect((removed.nodes.get("rect") as ElementNode).style).not.toHaveProperty(
      "fill",
    );
  });

  it("throws explicitly for a missing or non-element target", () => {
    expect(() => setAttr("missing", "fill", "blue").apply(fixture())).toThrow(
      /not an SVG element/,
    );
  });
});
