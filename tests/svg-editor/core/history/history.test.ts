import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type {
  ClockAdapter,
  Command,
  ElementNode,
  History,
  PersistentMap,
  SvgDocument,
  SvgNode,
} from "../../../../src/components/tools/svg-editor/contracts";
import { HistoryImpl } from "../../../../src/components/tools/svg-editor/core/history";

class TestPersistentMap<K, V> implements PersistentMap<K, V> {
  constructor(private readonly values: ReadonlyMap<K, V> = new Map()) {}

  get size(): number {
    return this.values.size;
  }

  get(key: K): V | undefined {
    return this.values.get(key);
  }

  has(key: K): boolean {
    return this.values.has(key);
  }

  set(key: K, value: V): PersistentMap<K, V> {
    const next = new Map(this.values);
    next.set(key, value);
    return new TestPersistentMap(next);
  }

  delete(key: K): PersistentMap<K, V> {
    const next = new Map(this.values);
    next.delete(key);
    return new TestPersistentMap(next);
  }

  *entries(): IterableIterator<[K, V]> {
    yield* this.values.entries();
  }
}

class FakeClock implements ClockAdapter {
  value = 0;

  now(): number {
    return this.value;
  }
}

function makeDocument(): SvgDocument {
  const root: ElementNode = {
    kind: "element",
    id: "root",
    tag: "svg",
    attrs: { width: "10", height: "10" },
    style: {},
    children: [],
    parent: null,
  };
  return {
    root: root.id,
    nodes: new TestPersistentMap<NodeId, SvgNode>().set(root.id, root),
    retainedSheets: [],
    unsupported: [],
    version: 0,
  };
}

type NodeId = string;

function freezeDeep<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freezeDeep(child);
  }
  return value;
}

function updateRoot(
  id: string,
  update: (node: ElementNode) => ElementNode,
  mergeKey?: string,
): Command {
  return {
    id,
    label: id,
    mergeKey,
    apply(doc) {
      const node = doc.nodes.get(doc.root);
      if (!node || node.kind !== "element") {
        throw new Error("Test document root is not an element.");
      }
      return {
        ...doc,
        nodes: doc.nodes.set(doc.root, update(node)),
        version: doc.version + 1,
      };
    },
  };
}

function docSnapshot(doc: SvgDocument | null): unknown {
  if (!doc) return null;
  return {
    root: doc.root,
    version: doc.version,
    nodes: [...doc.nodes.entries()].sort(([a], [b]) => a.localeCompare(b)),
    retainedSheets: doc.retainedSheets,
    unsupported: doc.unsupported,
  };
}

describe("HistoryImpl", () => {
  it("implements the frozen History contract", () => {
    const implementation: History = new HistoryImpl<SvgDocument>(
      makeDocument(),
      new FakeClock(),
    );
    expect(implementation.current()?.version).toBe(0);
  });

  it("undoes and redoes immutable command results", () => {
    const clock = new FakeClock();
    const history = new HistoryImpl(makeDocument(), clock);
    const original = history.current();

    history.push(
      updateRoot("set-width", (node) => ({
        ...node,
        attrs: { ...node.attrs, width: "20" },
      })),
    );
    const edited = history.current();

    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
    expect(history.undo()?.nodes.get("root")).not.toBe(
      edited?.nodes.get("root"),
    );
    expect(history.current()?.nodes.get("root")).toEqual(
      original?.nodes.get("root"),
    );
    expect(history.canRedo()).toBe(true);
    expect(history.redo()?.nodes.get("root")).toEqual(
      edited?.nodes.get("root"),
    );
    expect(history.current()).toEqual(edited);
  });

  it("clears redo after a new push", () => {
    const history = new HistoryImpl(makeDocument(), new FakeClock());
    history.push(
      updateRoot("one", (node) => ({
        ...node,
        attrs: { ...node.attrs, width: "20" },
      })),
    );
    history.undo();

    history.push(
      updateRoot("two", (node) => ({
        ...node,
        attrs: { ...node.attrs, height: "30" },
      })),
    );

    expect(history.canRedo()).toBe(false);
  });

  it("coalesces only matching merge keys within 500 milliseconds", () => {
    const clock = new FakeClock();
    const history = new HistoryImpl(makeDocument(), clock);

    history.push(
      updateRoot(
        "first-color",
        (node) => ({
          ...node,
          style: { ...node.style, fill: { value: "red", important: false } },
        }),
        "fill",
      ),
    );
    clock.value = 499;
    history.push(
      updateRoot(
        "second-color",
        (node) => ({
          ...node,
          style: { ...node.style, fill: { value: "blue", important: false } },
        }),
        "fill",
      ),
    );
    expect(history.current()?.version).toBe(2);
    expect(history.undo()?.version).toBe(0);
    expect(history.redo()?.nodes.get("root")).toMatchObject({
      style: { fill: { value: "blue" } },
    });

    history.push(
      updateRoot("discrete", (node) => ({
        ...node,
        style: { ...node.style, stroke: { value: "black", important: false } },
      })),
    );
    expect(history.canUndo()).toBe(true);
    expect(history.undo()?.nodes.get("root")).toMatchObject({
      style: { fill: { value: "blue" } },
    });
    expect(history.undo()?.version).toBe(0);
  });

  it("does not coalesce a matching merge key after the time window", () => {
    const clock = new FakeClock();
    const history = new HistoryImpl(makeDocument(), clock);

    history.push(updateRoot("first", (node) => node, "width"));
    clock.value = 501;
    history.push(updateRoot("second", (node) => node, "width"));

    history.undo();
    expect(history.current()?.version).toBe(1);
    history.undo();
    expect(history.current()?.version).toBe(0);
  });

  it("caps undoable command entries and supports a memory-budget trim hook", () => {
    const clock = new FakeClock();
    const history = new HistoryImpl(makeDocument(), clock, {
      maxEntries: 8,
      shouldTrim: (versions) => versions.length > 3,
    });
    for (let index = 0; index < 5; index += 1) {
      history.push(
        updateRoot(`command-${index}`, (node) => ({
          ...node,
          attrs: { ...node.attrs, width: String(index) },
        })),
      );
      clock.value += 1_000;
    }

    expect(history.current()?.nodes.get("root")).toMatchObject({
      attrs: { width: "4" },
    });
    expect(history.undo()?.nodes.get("root")).toMatchObject({
      attrs: { width: "3" },
    });
    expect(history.undo()?.nodes.get("root")).toMatchObject({
      attrs: { width: "2" },
    });
    expect(history.canUndo()).toBe(false);

    const capped = new HistoryImpl(makeDocument(), clock, { maxEntries: 2 });
    for (let index = 0; index < 5; index += 1) {
      capped.push(
        updateRoot(`capped-${index}`, (node) => ({
          ...node,
          attrs: { ...node.attrs, width: String(index) },
        })),
      );
      clock.value += 1_000;
    }
    capped.undo();
    capped.undo();
    expect(capped.canUndo()).toBe(false);
  });

  it("never mutates earlier versions for random attribute and style commands", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            kind: fc.constantFrom("attr", "style"),
            key: fc.constantFrom("fill", "stroke", "opacity", "width"),
            value: fc.string({ maxLength: 12 }),
          }),
          { minLength: 1, maxLength: 40 },
        ),
        (operations) => {
          const clock = new FakeClock();
          const initial = freezeDeep(makeDocument());
          const initialSnapshot = docSnapshot(initial);
          const history = new HistoryImpl(initial, clock);

          operations.forEach((operation, index) => {
            const key = operation.key;
            const value = operation.value;
            history.push(
              updateRoot(`random-${index}`, (node) =>
                operation.kind === "attr"
                  ? {
                      ...node,
                      attrs: { ...node.attrs, [key]: value },
                    }
                  : {
                      ...node,
                      style: {
                        ...node.style,
                        [key]: { value, important: index % 2 === 0 },
                      },
                    },
              ),
            );
            clock.value += 1_000;
          });

          expect(docSnapshot(initial)).toEqual(initialSnapshot);
          for (let index = 0; index < operations.length; index += 1) {
            history.undo();
          }
          expect(docSnapshot(history.current())).toEqual(initialSnapshot);
        },
      ),
    );
  });

  it("accepts deep-frozen documents and preserves their original node references", () => {
    const initial = freezeDeep(makeDocument());
    const initialRoot = initial.nodes.get("root");
    const history = new HistoryImpl(initial, new FakeClock());
    history.push(
      updateRoot("change-width", (node) => ({
        ...node,
        attrs: { ...node.attrs, width: "25" },
      })),
    );

    expect(initial.nodes.get("root")).toBe(initialRoot);
    expect((initial.nodes.get("root") as ElementNode).attrs.width).toBe("10");
    expect(history.current()?.nodes.get("root")).not.toBe(initialRoot);
  });
});
