import { performance } from "node:perf_hooks";
import { Map as ImmutableMap } from "immutable";
import { describe, expect, it } from "vitest";
import type {
  ClockAdapter,
  ElementNode,
  PersistentMap,
  SvgDocument,
  SvgNode,
} from "../../../src/components/tools/svg-editor/contracts";
import {
  setAttr,
  setStyle,
} from "../../../src/components/tools/svg-editor/core/commands";
import { HistoryImpl } from "../../../src/components/tools/svg-editor/core/history";

class ImmutableNodeMap implements PersistentMap<string, SvgNode> {
  constructor(
    private readonly map: ImmutableMap<string, SvgNode> = ImmutableMap(),
  ) {}

  get size(): number {
    return this.map.size;
  }

  get(key: string): SvgNode | undefined {
    return this.map.get(key);
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  set(key: string, value: SvgNode): PersistentMap<string, SvgNode> {
    return new ImmutableNodeMap(this.map.set(key, value));
  }

  delete(key: string): PersistentMap<string, SvgNode> {
    return new ImmutableNodeMap(this.map.delete(key));
  }

  *entries(): IterableIterator<[string, SvgNode]> {
    yield* this.map.entries();
  }

  static from(entries: Iterable<[string, SvgNode]>): ImmutableNodeMap {
    return new ImmutableNodeMap(ImmutableMap(entries));
  }
}

class BenchClock implements ClockAdapter {
  now(): number {
    return performance.now();
  }
}

const NODE_COUNT = 50_000;
const SAMPLE_COUNT = 101;
const DEFAULT_BUDGET_MS = 4;
const budgetMs = Number(
  process.env.SVG_EDITOR_BENCH_BUDGET_MS ?? DEFAULT_BUDGET_MS,
);

function makeDocument(): SvgDocument {
  const nodes: [string, SvgNode][] = [];
  const root: ElementNode = {
    kind: "element",
    id: "root",
    tag: "svg",
    attrs: { viewBox: "0 0 50000 1" },
    style: {},
    children: [],
    parent: null,
  };
  nodes.push([root.id, root]);

  for (let index = 0; index < NODE_COUNT - 1; index += 1) {
    const node: ElementNode = {
      kind: "element",
      id: `node-${index}`,
      tag: "path",
      attrs: { d: `M${index} 0h1`, fill: "#123456" },
      style: {},
      children: [],
      parent: root.id,
    };
    nodes.push([node.id, node]);
    root.children.push(node.id);
  }

  return {
    root: root.id,
    nodes: ImmutableNodeMap.from(nodes),
    retainedSheets: [],
    unsupported: [],
    version: 0,
  };
}

function percentile(values: number[], ratio: number): number {
  const sorted = values.toSorted((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * ratio) - 1];
}

describe("50,000-node history benchmark", () => {
  it(`keeps SetStyle and SetAttr p95 within ${budgetMs} ms`, () => {
    if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
      throw new RangeError(
        "SVG_EDITOR_BENCH_BUDGET_MS must be a positive number.",
      );
    }

    const document = makeDocument();
    const targetId = `node-${NODE_COUNT - 2}`;
    const commands = [
      setStyle(targetId, "fill", "#345678"),
      setAttr(targetId, "fill", "#234567"),
    ];
    const results = commands.map((command) => {
      const samples: number[] = [];
      for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
        const history = new HistoryImpl(document, new BenchClock());
        const start = performance.now();
        history.push(command);
        samples.push(performance.now() - start);
      }
      return {
        label: command.id,
        median: percentile(samples, 0.5),
        p95: percentile(samples, 0.95),
      };
    });

    for (const result of results) {
      console.log(
        `${result.label} 50k history push: median ${result.median.toFixed(3)} ms; p95 ${result.p95.toFixed(3)} ms`,
      );
      expect(
        result.p95,
        `${result.label} p95 should not exceed the ${budgetMs} ms budget`,
      ).toBeLessThanOrEqual(budgetMs);
    }
  });
});
