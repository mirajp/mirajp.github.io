import { describe, expect, it } from "vitest";
import type {
  ElementNode,
  PersistentMap,
  SvgDocument,
  SvgNode,
} from "../../../../src/components/tools/svg-editor/contracts";
import { HistoryImpl } from "../../../../src/components/tools/svg-editor/core/history";
import {
  effectiveSize,
  effectiveViewBox,
  setPreserveAspectRatio,
  setSize,
  setViewBox,
} from "../../../../src/components/tools/svg-editor/core/commands/geometry";

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

function documentWithRoot(attrs: Record<string, string> = {}): SvgDocument {
  const root: ElementNode = {
    kind: "element",
    id: "root",
    tag: "svg",
    attrs,
    style: {},
    children: [],
    parent: null,
  };
  return {
    root: "root",
    nodes: new NodeMap().set(root.id, root),
    retainedSheets: [],
    unsupported: [],
    version: 0,
  };
}

function rootAttrs(document: SvgDocument): Record<string, string> {
  const root = document.nodes.get(document.root);
  if (!root || root.kind !== "element") throw new Error("Missing SVG root.");
  return root.attrs;
}

describe("effective root geometry", () => {
  it("uses viewBox dimensions when width or height is missing", () => {
    expect(
      effectiveSize(documentWithRoot({ height: "80", viewBox: "0 0 120 60" })),
    ).toEqual({ kind: "known", width: 120, height: 80 });
    expect(
      effectiveSize(documentWithRoot({ width: "240", viewBox: "0 0 120 60" })),
    ).toEqual({ kind: "known", width: 240, height: 60 });
  });

  it("uses caller-provided bounds without a viewBox, otherwise reports that bounds are needed", () => {
    const document = documentWithRoot({ width: "200" });
    expect(effectiveViewBox(document)).toEqual({
      kind: "unknown",
      reason: "needs-bounds",
    });
    expect(
      effectiveViewBox(document, { x: 5, y: 7, width: 80, height: 40 }),
    ).toEqual({
      kind: "known",
      x: 5,
      y: 7,
      width: 80,
      height: 40,
    });
    expect(effectiveSize(document)).toEqual({
      kind: "unknown",
      reason: "needs-bounds",
    });
    expect(
      effectiveSize(document, {
        bounds: { x: 0, y: 0, width: 80, height: 40 },
      }),
    ).toEqual({ kind: "known", width: 200, height: 40 });
  });

  it("resolves percentages against viewBox dimensions", () => {
    expect(
      effectiveSize(
        documentWithRoot({
          width: "50%",
          height: "50%",
          viewBox: "0 0 200 100",
        }),
      ),
    ).toEqual({ kind: "known", width: 100, height: 50 });
  });

  it("returns typed errors for malformed dimensions and viewBoxes", () => {
    expect(
      effectiveSize(documentWithRoot({ width: "wide", height: "20" })),
    ).toEqual({
      kind: "error",
      reason: "invalid-length",
      attribute: "width",
    });
    expect(effectiveViewBox(documentWithRoot({ viewBox: "0 0 0 -1" }))).toEqual(
      {
        kind: "error",
        reason: "invalid-viewBox",
      },
    );
  });
});

describe("SetSize", () => {
  it("derives a missing dimension from viewBox and writes both dimensions", () => {
    const original = documentWithRoot({
      width: "240px",
      viewBox: "0 0 120 60",
    });
    const updated = setSize({ height: 120 }).apply(original);
    expect(rootAttrs(updated)).toMatchObject({ width: "240px", height: "120" });
    expect(rootAttrs(original)).toEqual({
      width: "240px",
      viewBox: "0 0 120 60",
    });
  });

  it("preserves mixed absolute units by default and converts when requested", () => {
    const original = documentWithRoot({
      width: "100px",
      height: "2in",
      viewBox: "0 0 100 192",
    });
    const preserved = setSize({ width: 192, height: 96 }).apply(original);
    expect(rootAttrs(preserved)).toMatchObject({
      width: "192px",
      height: "1in",
    });

    const converted = setSize({
      width: 96,
      height: 48,
      unit: "cm",
    }).apply(original);
    expect(rootAttrs(converted)).toMatchObject({
      width: `${(96 / 96) * 2.54}cm`,
      height: `${(48 / 96) * 2.54}cm`,
    });
  });

  it("preserves percentage units when a parent-size context is supplied", () => {
    const original = documentWithRoot({
      width: "50%",
      height: "25%",
      viewBox: "0 0 200 100",
    });
    const updated = setSize({
      width: 300,
      height: 75,
      parent: { width: 600, height: 300 },
    }).apply(original);
    expect(rootAttrs(updated)).toMatchObject({ width: "50%", height: "25%" });
  });

  it("locks aspect ratio using existing size or viewBox and rejects invalid dimensions", () => {
    const original = documentWithRoot({
      width: "200",
      height: "100",
      viewBox: "0 0 200 100",
    });
    expect(
      rootAttrs(setSize({ width: 300, lockAspect: true }).apply(original)),
    ).toMatchObject({ width: "300", height: "150" });
    expect(() => setSize({ width: -1 }).apply(original)).toThrow(RangeError);
  });
});

describe("SetViewBox and preserveAspectRatio", () => {
  it("writes viewBox and preserves display size by adjusting dimensions proportionally", () => {
    const original = documentWithRoot({
      width: "200px",
      height: "100px",
      viewBox: "0 0 100 50",
    });
    const updated = setViewBox({
      minX: 10,
      minY: 5,
      width: 50,
      height: 25,
      keepDisplaySize: true,
    }).apply(original);
    expect(rootAttrs(updated)).toMatchObject({
      viewBox: "10 5 50 25",
      width: "100px",
      height: "50px",
    });
  });

  it.each([
    "none",
    "xMinYMin",
    "xMidYMin",
    "xMaxYMin",
    "xMinYMid",
    "xMidYMid",
    "xMaxYMid",
    "xMinYMax",
    "xMidYMax",
    "xMaxYMax",
  ])("accepts each alignment with the default meet behavior: %s", (align) => {
    expect(
      rootAttrs(setPreserveAspectRatio(align).apply(documentWithRoot())),
    ).toHaveProperty("preserveAspectRatio", align);
  });

  it.each([
    ...[
      "xMinYMin",
      "xMidYMin",
      "xMaxYMin",
      "xMinYMid",
      "xMidYMid",
      "xMaxYMid",
      "xMinYMax",
      "xMidYMax",
      "xMaxYMax",
    ].flatMap((align) => [`${align} meet`, `${align} slice`]),
  ])("accepts valid meetOrSlice form %s", (value) => {
    expect(
      rootAttrs(setPreserveAspectRatio(value).apply(documentWithRoot())),
    ).toHaveProperty("preserveAspectRatio", value);
  });

  it.each([
    "",
    "xFooYBar",
    "xMidYMid stretch",
    "none meet",
    "xMinYMin meet slice",
  ])("rejects invalid preserveAspectRatio value %j", (value) => {
    expect(() =>
      setPreserveAspectRatio(value).apply(documentWithRoot()),
    ).toThrow(/preserveAspectRatio/i);
  });

  it("undo restores the prior root exactly and the command does not mutate input", () => {
    const original = documentWithRoot({
      width: "2in",
      height: "1in",
      viewBox: "0 0 192 96",
    });
    const history = new HistoryImpl(original, { now: () => 1000 });
    history.push(setSize({ width: 288 }));
    const edited = history.current();
    expect(edited).not.toBe(original);
    expect(rootAttrs(original)).toEqual({
      width: "2in",
      height: "1in",
      viewBox: "0 0 192 96",
    });
    expect(history.undo()).toBe(original);
    expect(history.redo()).toBe(edited);
  });
});
