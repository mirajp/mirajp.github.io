import { describe, expect, it } from "vitest";
import type {
  ElementNode,
  PersistentMap,
  SourceMetadata,
  SvgDocument,
  SvgNode,
} from "../../../src/components/tools/svg-editor/contracts";
import {
  setAttr,
  setStyle,
} from "../../../src/components/tools/svg-editor/core/commands";
import { createEditorStore } from "../../../src/components/tools/svg-editor/state/createEditorStore";

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

function fixture(): { doc: SvgDocument; metadata: SourceMetadata } {
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
    doc: {
      root: "root",
      nodes: new NodeMap().set("root", root).set("rect", rect),
      retainedSheets: [],
      unsupported: [],
      version: 0,
    },
    metadata: {
      originalSource: "<svg/>",
      sanitizedSource: "<svg/>",
      originalVersion: 0,
      sanitizationReport: { findings: [] },
    },
  };
}

describe("framework-free editor store", () => {
  it("dispatches SetAttr and SetStyle through undo and redo", () => {
    const store = createEditorStore({ now: () => 1000 });
    const { doc, metadata } = fixture();
    store.load(doc, metadata);

    store.dispatch(setAttr("rect", "fill", "blue"));
    store.dispatch(setStyle("rect", "stroke", "green"));
    const edited = store.getSnapshot().document;
    expect(edited?.version).toBe(2);
    expect((edited?.nodes.get("rect") as ElementNode).attrs.fill).toBe("blue");
    expect((edited?.nodes.get("rect") as ElementNode).style.stroke?.value).toBe(
      "green",
    );

    store.undo();
    expect(
      (store.getSnapshot().document?.nodes.get("rect") as ElementNode).style,
    ).toEqual({});
    store.undo();
    expect(
      (store.getSnapshot().document?.nodes.get("rect") as ElementNode).attrs
        .fill,
    ).toBe("red");
    store.redo();
    store.redo();
    expect(
      (store.getSnapshot().document?.nodes.get("rect") as ElementNode).style
        .stroke?.value,
    ).toBe("green");
    expect(store.getSnapshot().canUndo).toBe(true);
    expect(store.getSnapshot().canRedo).toBe(false);
  });

  it("links view changes and notifies selectors only for selected values", () => {
    const store = createEditorStore();
    let notifications = 0;
    store.subscribeSelector(
      (state) => state.document,
      () => {
        notifications += 1;
      },
    );
    const { doc, metadata } = fixture();
    store.load(doc, metadata);
    store.setViewTransform("edited", { scale: 2, tx: 5, ty: 8 });
    expect(store.getSnapshot().view.original).toEqual({
      scale: 2,
      tx: 5,
      ty: 8,
    });
    expect(notifications).toBe(1);
  });
});
