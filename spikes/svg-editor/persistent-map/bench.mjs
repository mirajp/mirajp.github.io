import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import os from "node:os";

if (typeof global.gc !== "function") {
  throw new Error(
    "Run with --expose-gc: node --expose-gc spikes/svg-editor/persistent-map/bench.mjs",
  );
}

const temporaryInstall = mkdtempSync(
  path.join(tmpdir(), "svg-editor-map-bench-"),
);
execFileSync(
  "npm",
  [
    "install",
    "--prefix",
    temporaryInstall,
    "--no-save",
    "--no-package-lock",
    "--ignore-scripts",
    "--silent",
    "immutable@5.1.9",
    "hamt_plus@1.0.2",
  ],
  { stdio: "inherit" },
);

const requireFromTemporaryInstall = createRequire(
  path.join(temporaryInstall, "package.json"),
);
const { Map: ImmutableMap } = requireFromTemporaryInstall("immutable");
const hamt = requireFromTemporaryInstall("hamt_plus");

const sampleCounts = {
  single: 31,
  sequential: 25,
  iteration: 21,
  lookup: 31,
  memory: 9,
};
const lookupOperations = 10_000;
const retainedVersions = 200;
const formats = [
  {
    name: "Record spread",
    build(nodes) {
      const record = Object.create(null);
      for (const node of nodes) record[node.id] = node;
      return record;
    },
    get(map, id) {
      return map[id];
    },
    set(map, id, node) {
      return { ...map, [id]: node };
    },
    *entries(map) {
      yield* Object.entries(map);
    },
  },
  {
    name: "Immutable Map",
    build(nodes) {
      return ImmutableMap(nodes.map((node) => [node.id, node]));
    },
    get(map, id) {
      return map.get(id);
    },
    set(map, id, node) {
      return map.set(id, node);
    },
    *entries(map) {
      yield* map.entries();
    },
  },
  {
    name: "hamt_plus",
    build(nodes) {
      let map = hamt.make();
      for (const node of nodes) map = hamt.set(node.id, node, map);
      return map;
    },
    get(map, id) {
      return hamt.get(id, map);
    },
    set(map, id, node) {
      return hamt.set(id, node, map);
    },
    *entries(map) {
      yield* hamt.entries(map);
    },
  },
];

function makeNode(index, revision = 0) {
  const id = `n${index}`;
  return {
    kind: "element",
    id,
    tag: index % 2 === 0 ? "path" : "rect",
    attrs: { fill: revision === 0 ? "#123456" : `#1234${revision % 10}` },
    style: {},
    children: [],
    parent: index === 0 ? null : `n${Math.floor((index - 1) / 4)}`,
  };
}

function summarize(samples) {
  const sorted = samples.toSorted((a, b) => a - b);
  const percentile = (fraction) =>
    sorted[
      Math.min(sorted.length - 1, Math.ceil(fraction * sorted.length) - 1)
    ];
  return {
    median: percentile(0.5),
    p95: percentile(0.95),
  };
}

function timeSamples(count, operation) {
  const samples = [];
  for (let i = 0; i < count; i += 1) {
    const start = performance.now();
    const result = operation(i);
    samples.push(
      typeof result === "number" ? result : performance.now() - start,
    );
  }
  return summarize(samples);
}

function updateNode(format, map, index, revision) {
  const previous = format.get(map, `n${index}`);
  return format.set(map, previous.id, makeNode(index, revision));
}

function runMemorySample(format, base, nodeCount) {
  global.gc();
  const before = process.memoryUsage().heapUsed;
  const versions = new Array(retainedVersions);
  let current = base;
  for (let version = 0; version < retainedVersions; version += 1) {
    current = updateNode(format, current, version % nodeCount, version + 1);
    versions[version] = current;
  }
  global.gc();
  const retainedBytes = process.memoryUsage().heapUsed - before;
  return { retainedBytes, versions };
}

function benchmark(format, nodeCount, nodes) {
  const base = format.build(nodes);
  const targetId = `n${Math.floor(nodeCount / 2)}`;
  let sink;

  const single = timeSamples(sampleCounts.single, (sample) => {
    const previous = format.get(base, targetId);
    const start = performance.now();
    sink = format.set(
      base,
      targetId,
      makeNode(previous.id.slice(1), sample + 1),
    );
    return performance.now() - start;
  });

  const sequential = timeSamples(sampleCounts.sequential, (sample) => {
    let current = base;
    const start = performance.now();
    for (let update = 0; update < 100; update += 1) {
      const index = (sample * 100 + update) % nodeCount;
      current = updateNode(format, current, index, update + 1);
    }
    sink = current;
    return performance.now() - start;
  });

  const iteration = timeSamples(sampleCounts.iteration, () => {
    const start = performance.now();
    let count = 0;
    for (const [, node] of format.entries(base)) count += node.id.length > 0;
    if (count !== nodeCount)
      throw new Error(`${format.name} iteration count ${count}`);
    sink = count;
    return performance.now() - start;
  });

  const lookup = timeSamples(sampleCounts.lookup, (sample) => {
    let checksum = 0;
    const start = performance.now();
    for (let index = 0; index < lookupOperations; index += 1) {
      const key = `n${(index * 7919 + sample) % nodeCount}`;
      if (format.get(base, key)) checksum += 1;
    }
    sink = checksum;
    return (performance.now() - start) / lookupOperations;
  });

  const memorySamples = [];
  for (let sample = 0; sample < sampleCounts.memory; sample += 1) {
    const result = runMemorySample(format, base, nodeCount);
    memorySamples.push(result.retainedBytes / (1024 * 1024));
    sink = result.versions.at(-1);
  }

  return {
    name: format.name,
    nodeCount,
    singleMs: single,
    sequential100Ms: sequential,
    retained200MiB: summarize(memorySamples),
    iterationMs: iteration,
    lookupUs: {
      median: lookup.median * 1_000,
      p95: lookup.p95 * 1_000,
    },
    sink,
  };
}

function printMetric(metric, unit, digits = 3) {
  return `${metric.median.toFixed(digits)}/${metric.p95.toFixed(digits)} ${unit}`;
}

try {
  console.log(
    `Node ${process.version}; ${os.platform()} ${os.release()} ${os.arch()}; ${os.cpus()[0]?.model}; ${os.cpus().length} logical CPUs`,
  );
  console.log(
    `Samples: single ${sampleCounts.single}, 100-update batch ${sampleCounts.sequential}, iteration ${sampleCounts.iteration}, ${lookupOperations.toLocaleString()} lookups ${sampleCounts.lookup}, retained versions ${sampleCounts.memory} x ${retainedVersions}`,
  );
  console.log("Rows are median/p95. Times per operation/batch as labeled.");
  console.log(
    "| Node count | Structure | Single update ms | 100 updates ms | 200-version heap MiB | Iterate all ms | Lookup us/op |",
  );
  console.log("|---:|---|---:|---:|---:|---:|---:|");

  for (const nodeCount of [5_000, 50_000]) {
    const nodes = Array.from({ length: nodeCount }, (_, index) =>
      makeNode(index),
    );
    for (const format of formats) {
      const result = benchmark(format, nodeCount, nodes);
      console.log(
        `| ${nodeCount.toLocaleString()} | ${result.name} | ${printMetric(result.singleMs, "ms")} | ${printMetric(result.sequential100Ms, "ms")} | ${printMetric(result.retained200MiB, "MiB")} | ${printMetric(result.iterationMs, "ms")} | ${printMetric(result.lookupUs, "µs")} |`,
      );
    }
  }
} finally {
  rmSync(temporaryInstall, { recursive: true, force: true });
}
