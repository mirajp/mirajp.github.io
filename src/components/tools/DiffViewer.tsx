import { useMemo, useState } from "react";
import { diffLines, diffWordsWithSpace, type Change } from "diff";

type LineSide = {
  text: string;
  lineNo: number;
  kind: "common" | "removed" | "added";
  wordDiff?: Change[];
};

type Row =
  | { type: "common"; left: LineSide; right: LineSide }
  | { type: "change"; left: LineSide | null; right: LineSide | null };

type UnifiedLine = {
  kind: "common" | "removed" | "added";
  text: string;
  leftNo: number | null;
  rightNo: number | null;
  wordDiff?: Change[];
};

function toLines(value: string): string[] {
  const lines = value.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function buildRows(
  oldStr: string,
  newStr: string,
): { rows: Row[]; additions: number; deletions: number } {
  const parts = diffLines(oldStr, newStr);
  const rows: Row[] = [];
  let leftNo = 1;
  let rightNo = 1;
  let additions = 0;
  let deletions = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (!part.added && !part.removed) {
      for (const line of toLines(part.value)) {
        rows.push({
          type: "common",
          left: { text: line, lineNo: leftNo++, kind: "common" },
          right: { text: line, lineNo: rightNo++, kind: "common" },
        });
      }
      continue;
    }

    if (part.removed) {
      const removedLines = toLines(part.value);
      deletions += removedLines.length;
      const next = parts[i + 1];

      if (next?.added) {
        const addedLines = toLines(next.value);
        additions += addedLines.length;
        const max = Math.max(removedLines.length, addedLines.length);

        for (let j = 0; j < max; j++) {
          const oldLine = removedLines[j];
          const newLine = addedLines[j];

          if (oldLine !== undefined && newLine !== undefined) {
            const wordDiff = diffWordsWithSpace(oldLine, newLine);
            rows.push({
              type: "change",
              left: {
                text: oldLine,
                lineNo: leftNo++,
                kind: "removed",
                wordDiff,
              },
              right: {
                text: newLine,
                lineNo: rightNo++,
                kind: "added",
                wordDiff,
              },
            });
          } else if (oldLine !== undefined) {
            rows.push({
              type: "change",
              left: { text: oldLine, lineNo: leftNo++, kind: "removed" },
              right: null,
            });
          } else {
            rows.push({
              type: "change",
              left: null,
              right: { text: newLine, lineNo: rightNo++, kind: "added" },
            });
          }
        }
        i++; // consumed the paired "added" part
      } else {
        for (const line of removedLines) {
          rows.push({
            type: "change",
            left: { text: line, lineNo: leftNo++, kind: "removed" },
            right: null,
          });
        }
      }
      continue;
    }

    if (part.added) {
      const addedLines = toLines(part.value);
      additions += addedLines.length;
      for (const line of addedLines) {
        rows.push({
          type: "change",
          left: null,
          right: { text: line, lineNo: rightNo++, kind: "added" },
        });
      }
    }
  }

  return { rows, additions, deletions };
}

function flattenForUnified(rows: Row[]): UnifiedLine[] {
  const out: UnifiedLine[] = [];
  for (const row of rows) {
    if (row.type === "common") {
      out.push({
        kind: "common",
        text: row.left.text,
        leftNo: row.left.lineNo,
        rightNo: row.right.lineNo,
      });
      continue;
    }
    if (row.left) {
      out.push({
        kind: "removed",
        text: row.left.text,
        leftNo: row.left.lineNo,
        rightNo: null,
        wordDiff: row.left.wordDiff,
      });
    }
    if (row.right) {
      out.push({
        kind: "added",
        text: row.right.text,
        leftNo: null,
        rightNo: row.right.lineNo,
        wordDiff: row.right.wordDiff,
      });
    }
  }
  return out;
}

function WordDiff({
  segments,
  side,
}: {
  segments: Change[];
  side: "left" | "right";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (side === "left" && seg.added) return null;
        if (side === "right" && seg.removed) return null;
        const highlight = side === "left" ? seg.removed : seg.added;
        return (
          <span
            key={i}
            className={
              highlight
                ? side === "left"
                  ? "bg-error/25"
                  : "bg-success/25"
                : undefined
            }
          >
            {seg.value}
          </span>
        );
      })}
    </>
  );
}

const EXAMPLE_ORIGINAL = `function greet(name) {
  console.log("Hello " + name);
  return true;
}

const retries = 3;
`;

const EXAMPLE_MODIFIED = `function greet(name, punctuation) {
  console.log("Hello " + name + punctuation);
  return true;
}

const retries = 5;
const timeoutMs = 2000;
`;

export default function DiffViewer() {
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const { rows, additions, deletions } = useMemo(
    () => buildRows(original, modified),
    [original, modified],
  );
  const unifiedLines = useMemo(() => flattenForUnified(rows), [rows]);
  const hasContent = original.length > 0 || modified.length > 0;
  const isIdentical = hasContent && additions === 0 && deletions === 0;

  function loadExample() {
    setOriginal(EXAMPLE_ORIGINAL);
    setModified(EXAMPLE_MODIFIED);
  }

  function swap() {
    setOriginal(modified);
    setModified(original);
  }

  function clear() {
    setOriginal("");
    setModified("");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="diff-original"
            className="text-sm font-semibold text-foreground"
          >
            Original
          </label>
          <textarea
            id="diff-original"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            spellCheck={false}
            rows={10}
            placeholder="Paste the original text or code here…"
            className="w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="diff-modified"
            className="text-sm font-semibold text-foreground"
          >
            Modified
          </label>
          <textarea
            id="diff-modified"
            value={modified}
            onChange={(e) => setModified(e.target.value)}
            spellCheck={false}
            rows={10}
            placeholder="Paste the modified text or code here…"
            className="w-full resize-y rounded-md border border-border bg-background p-3 font-mono text-sm text-foreground placeholder:text-foreground-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="View mode"
        >
          <button
            type="button"
            aria-pressed={viewMode === "split"}
            onClick={() => setViewMode("split")}
            className={`h-11 rounded-md px-4 text-sm font-semibold transition-colors ${
              viewMode === "split"
                ? "bg-primary text-white"
                : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            Side by side
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "unified"}
            onClick={() => setViewMode("unified")}
            className={`h-11 rounded-md px-4 text-sm font-semibold transition-colors ${
              viewMode === "unified"
                ? "bg-primary text-white"
                : "bg-surface text-foreground hover:bg-surface-hover"
            }`}
          >
            Unified
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="sr-only" aria-live="polite">
            {hasContent ? `${additions} additions, ${deletions} deletions` : ""}
          </span>
          {hasContent && (
            <>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-foreground">
                +{additions}
              </span>
              <span className="rounded-full bg-error/15 px-3 py-1 text-xs font-semibold text-foreground">
                −{deletions}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={loadExample}
            className="h-11 rounded-md bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover"
          >
            Load example
          </button>
          <button
            type="button"
            onClick={swap}
            disabled={!hasContent}
            className="h-11 rounded-md bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-foreground-muted"
          >
            Swap
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!hasContent}
            className="h-11 rounded-md bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-foreground-muted"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Result */}
      {!hasContent ? (
        <div className="rounded-lg border border-dashed border-border bg-surface p-8 text-center text-sm text-foreground-muted">
          Paste text into both fields above to see a diff, or load the example.
        </div>
      ) : isIdentical ? (
        <div className="rounded-lg bg-primary-soft p-4 text-sm text-foreground">
          No differences found — the two inputs are identical.
        </div>
      ) : viewMode === "unified" ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full border-collapse font-mono text-sm">
            <tbody>
              {unifiedLines.map((line, i) => (
                <tr
                  key={i}
                  className={
                    line.kind === "added"
                      ? "bg-success/10"
                      : line.kind === "removed"
                        ? "bg-error/10"
                        : undefined
                  }
                >
                  <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-foreground-muted">
                    {line.leftNo ?? ""}
                  </td>
                  <td className="w-12 select-none border-r border-border px-2 py-0.5 text-right text-foreground-muted">
                    {line.rightNo ?? ""}
                  </td>
                  <td className="w-6 select-none px-2 py-0.5 text-center text-foreground-muted">
                    {line.kind === "added"
                      ? "+"
                      : line.kind === "removed"
                        ? "−"
                        : ""}
                  </td>
                  <td className="whitespace-pre-wrap px-2 py-0.5 text-foreground">
                    {line.wordDiff ? (
                      <WordDiff
                        segments={line.wordDiff}
                        side={line.kind === "removed" ? "left" : "right"}
                      />
                    ) : (
                      line.text
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full border-collapse font-mono text-sm">
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="w-10 select-none border-r border-border px-2 py-0.5 text-right text-foreground-muted">
                    {row.left?.lineNo ?? ""}
                  </td>
                  <td
                    className={`whitespace-pre-wrap border-r border-border px-2 py-0.5 text-foreground ${
                      row.left?.kind === "removed" ? "bg-error/10" : ""
                    }`}
                  >
                    {row.left ? (
                      row.left.wordDiff ? (
                        <WordDiff segments={row.left.wordDiff} side="left" />
                      ) : (
                        row.left.text
                      )
                    ) : (
                      ""
                    )}
                  </td>
                  <td className="w-10 select-none border-r border-border px-2 py-0.5 text-right text-foreground-muted">
                    {row.right?.lineNo ?? ""}
                  </td>
                  <td
                    className={`whitespace-pre-wrap px-2 py-0.5 text-foreground ${
                      row.right?.kind === "added" ? "bg-success/10" : ""
                    }`}
                  >
                    {row.right ? (
                      row.right.wordDiff ? (
                        <WordDiff segments={row.right.wordDiff} side="right" />
                      ) : (
                        row.right.text
                      )
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
