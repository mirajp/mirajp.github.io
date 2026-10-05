import { createHash } from "node:crypto";
import { appendFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const budgetPath = path.join(
  projectRoot,
  "scripts/svg-editor/bundle-budget.json",
);
const writeBudget = process.argv.includes("--write-budget");
const toleranceOverride = process.argv
  .find((argument) => argument.startsWith("--tolerance="))
  ?.slice("--tolerance=".length);

const files = await walk(distRoot);
const htmlPaths = files.filter((file) => file.endsWith(".html"));
const jsPaths = files.filter((file) => file.endsWith(".js"));
const jsByName = new Map(jsPaths.map((file) => [path.basename(file), file]));
const scriptContents = new Map(
  await Promise.all(jsPaths.map(async (file) => [file, await readText(file)])),
);

const editorPage = "tools/svg-editor/index.html";
const noIslandPage = "about/index.html";
const protectedPages = ["tools/contrast/index.html", "tools/diff/index.html"];

for (const relativePath of [editorPage, noIslandPage, ...protectedPages]) {
  if (!files.includes(path.join(distRoot, relativePath))) {
    throw new Error(`Required built page is missing: dist/${relativePath}`);
  }
}

const editorHtml = await readText(path.join(distRoot, editorPage));
const directEditorScripts = findScripts(editorHtml);
const editorEntries = directEditorScripts.filter(
  (file) => !/^client(?:\.|$)/i.test(path.basename(file)),
);
if (editorEntries.length === 0) {
  throw new Error(`No editor entry script found in dist/${editorPage}`);
}

const editorFiles = await collectScriptGraph(editorEntries);
const runtimeChunks = editorFiles.filter((file) =>
  /^(?:client|jsx-runtime|react|rolldown-runtime)(?:\.|$)/i.test(
    path.basename(file),
  ),
);
const editorChunks = editorFiles.filter(
  (file) => !runtimeChunks.includes(file),
);
if (editorChunks.length === 0) {
  throw new Error("Unable to identify any editor-specific output chunks.");
}
const workerFiles = editorFiles.filter((file) =>
  /(?:worker|\.worker)\./i.test(path.basename(file)),
);
const editorMainFiles = editorChunks.filter(
  (file) => !workerFiles.includes(file),
);
const noIslandFiles = await collectPageScripts(noIslandPage);

for (const htmlPath of htmlPaths) {
  if (htmlPath === path.join(distRoot, editorPage)) continue;
  const pageScripts = await collectScriptGraph(
    findScripts(await readText(htmlPath)),
  );
  if (pageScripts.some((file) => editorChunks.includes(file))) {
    throw new Error(
      `The non-editor page dist/${path.relative(distRoot, htmlPath)} references an editor script`,
    );
  }
}

if (
  editorMainFiles.some((file) =>
    /\bsvgo\b(?!\.worker)/i.test(readTextSync(file)),
  )
) {
  throw new Error("SVGO must not be imported into the main editor chunk");
}

const metrics = {
  editor: await measureFiles(editorMainFiles),
  worker: workerFiles.length ? await measureFiles(workerFiles) : null,
  noIsland: await measurePageScripts(noIslandPage, noIslandFiles),
  protectedPages: {},
};

for (const relativePath of protectedPages) {
  const htmlPath = path.join(distRoot, relativePath);
  const html = await readText(htmlPath);
  const scripts = await collectScriptGraph(findScripts(html));
  metrics.protectedPages[relativePath] = {
    html: await measureFile(htmlPath),
    js: await measurePageScripts(relativePath, scripts),
  };
}

if (writeBudget) {
  const budget = {
    version: 1,
    tolerancePercent: Number.isFinite(Number(toleranceOverride))
      ? Number(toleranceOverride)
      : 10,
    editor: metrics.editor,
    worker: metrics.worker,
    noIsland: {
      page: noIslandPage,
      ...metrics.noIsland,
    },
    protectedPages: Object.fromEntries(
      Object.entries(metrics.protectedPages).map(([page, value]) => [
        page,
        {
          html: value.html,
          js: value.js,
        },
      ]),
    ),
  };
  await writeFile(budgetPath, `${JSON.stringify(budget, null, 2)}\n`);
  console.log(
    `Wrote first-measurement budget to ${path.relative(projectRoot, budgetPath)}`,
  );
} else {
  const budget = JSON.parse(await readFile(budgetPath, "utf8"));
  const tolerance =
    Number.isFinite(Number(toleranceOverride)) &&
    toleranceOverride !== undefined
      ? Number(toleranceOverride)
      : budget.tolerancePercent;
  const rows = [];
  const failures = [];

  compareBudget(
    "Editor JS",
    metrics.editor,
    budget.editor,
    tolerance,
    rows,
    failures,
  );
  if (metrics.worker) {
    if (budget.worker) {
      compareBudget(
        "Worker JS",
        metrics.worker,
        budget.worker,
        tolerance,
        rows,
        failures,
      );
    } else {
      rows.push([
        "Worker JS",
        formatSize(metrics.worker.raw),
        formatSize(metrics.worker.gzip),
        "new",
      ]);
      failures.push(
        "A worker chunk appeared without a recorded first-measurement budget.",
      );
    }
  } else {
    rows.push(["Worker JS", "—", "—", "not emitted"]);
  }

  rows.push([
    `No-island page JS (${noIslandPage})`,
    formatSize(metrics.noIsland.raw),
    formatSize(metrics.noIsland.gzip),
    "measured",
  ]);
  if (noIslandFiles.some((file) => editorChunks.includes(file))) {
    failures.push(
      `The no-island page dist/${noIslandPage} loads an editor chunk.`,
    );
  }

  for (const relativePath of protectedPages) {
    const actual = metrics.protectedPages[relativePath];
    const expected = budget.protectedPages[relativePath];
    const htmlChanged = actual.html.sha256 !== expected?.html.sha256;
    const jsChanged =
      actual.js.sha256 !== expected?.js.sha256 ||
      JSON.stringify(actual.js.assets) !== JSON.stringify(expected?.js.assets);
    rows.push([
      `Existing ${relativePath} HTML`,
      formatSize(actual.html.raw),
      formatSize(actual.html.gzip),
      htmlChanged ? "CHANGED" : "unchanged",
    ]);
    rows.push([
      `Existing ${relativePath} JS`,
      formatSize(actual.js.raw),
      formatSize(actual.js.gzip),
      jsChanged ? "CHANGED" : "unchanged",
    ]);
    if (htmlChanged)
      failures.push(`HTML output changed for dist/${relativePath}.`);
    if (jsChanged)
      failures.push(`JavaScript output changed for dist/${relativePath}.`);
  }

  await printTable(rows);
  if (failures.length > 0) {
    console.error("\nBundle budget failures:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(`\nBundle budgets passed (maximum growth: ${tolerance}%).`);
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(target) : [target];
    }),
  );
  return nested.flat();
}

async function readText(file) {
  return readFile(file, "utf8");
}

function readTextSync(file) {
  return scriptContents.get(file) ?? "";
}

function findScripts(content) {
  const names = new Set();
  for (const match of content.matchAll(/\/_astro\/([^"'?#\s]+\.js)/g)) {
    const target = jsByName.get(path.basename(match[1]));
    if (target) names.add(target);
  }
  return [...names];
}

async function collectScriptGraph(entries) {
  const found = new Set();
  const pending = [...entries];
  while (pending.length > 0) {
    const current = pending.pop();
    if (found.has(current)) continue;
    found.add(current);
    const source = scriptContents.get(current) ?? "";
    for (const match of source.matchAll(
      /(?:\/_astro\/|\.\/|\.\.\/)([^"'`?#\s)]+\.js)/g,
    )) {
      const imported = jsByName.get(path.basename(match[1]));
      if (imported && !found.has(imported)) pending.push(imported);
    }
  }
  return [...found].sort();
}

async function collectPageScripts(relativePath) {
  const html = await readText(path.join(distRoot, relativePath));
  return collectScriptGraph(findScripts(html));
}

async function measurePageScripts(relativePath, scripts) {
  const html = await readText(path.join(distRoot, relativePath));
  const inline = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(([, attributes]) => {
      if (/\bsrc\s*=/.test(attributes)) return false;
      const type = attributes.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1];
      return (
        !type ||
        /^(?:text|application)\/(?:java|ecma)script$/i.test(type) ||
        /^module$/i.test(type)
      );
    })
    .map(([, , content], index) => ({
      name: `inline-${index + 1}`,
      data: Buffer.from(content),
    }))
    .filter(({ data }) => data.byteLength > 0);
  const measuredFiles = await measureFiles(scripts);
  const buffers = await Promise.all(scripts.map((file) => readFile(file)));
  for (const { name, data } of inline) {
    buffers.push(data);
    measuredFiles.raw += data.byteLength;
    measuredFiles.gzip += gzipSync(data, { level: 9 }).byteLength;
    measuredFiles.assets.push({
      name,
      raw: data.byteLength,
      gzip: gzipSync(data, { level: 9 }).byteLength,
      sha256: createHash("sha256").update(data).digest("hex"),
    });
  }
  measuredFiles.assets.sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  measuredFiles.sha256 = createHash("sha256")
    .update(Buffer.concat(buffers))
    .digest("hex");
  return measuredFiles;
}

async function measureFile(file) {
  const data = await readFile(file);
  return {
    raw: data.byteLength,
    gzip: gzipSync(data, { level: 9 }).byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
  };
}

async function measureFiles(targets) {
  const assets = [];
  let raw = 0;
  let gzip = 0;
  for (const file of [...targets].sort()) {
    const measured = await measureFile(file);
    const name = path.relative(distRoot, file).split(path.sep).join("/");
    raw += measured.raw;
    gzip += measured.gzip;
    assets.push({ name, ...measured });
  }
  const combined = Buffer.concat(
    await Promise.all(targets.map((file) => readFile(file))),
  );
  return {
    raw,
    gzip,
    sha256: createHash("sha256").update(combined).digest("hex"),
    assets,
  };
}

function compareBudget(name, actual, expected, tolerance, rows, failures) {
  const rawAllowed = expected.raw * (1 + tolerance / 100);
  const gzipAllowed = expected.gzip * (1 + tolerance / 100);
  const rawGrowth = growth(actual.raw, expected.raw);
  const gzipGrowth = growth(actual.gzip, expected.gzip);
  rows.push([
    name,
    formatSize(actual.raw),
    formatSize(actual.gzip),
    `raw ${formatGrowth(rawGrowth)}, gzip ${formatGrowth(gzipGrowth)}`,
  ]);
  if (actual.raw > rawAllowed || actual.gzip > gzipAllowed) {
    failures.push(
      `${name} exceeds ${tolerance}% growth (raw ${formatGrowth(rawGrowth)}, gzip ${formatGrowth(gzipGrowth)}).`,
    );
  }
}

function growth(actual, baseline) {
  if (baseline === 0) return actual === 0 ? 0 : Infinity;
  return ((actual - baseline) / baseline) * 100;
}

function formatGrowth(value) {
  return Number.isFinite(value)
    ? `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
    : "new";
}

function formatSize(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

async function printTable(rows) {
  const headers = ["Output", "Raw", "Gzip", "Change / status"];
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index].length)),
  );
  const line = (row) =>
    `| ${row.map((cell, i) => cell.padEnd(widths[i])).join(" | ")} |`;
  const markdown = [
    line(headers),
    `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`,
    ...rows.map(line),
  ].join("\n");
  console.log(markdown);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `## SVG editor bundle sizes\n\n${markdown}\n\n`,
    );
  }
}
