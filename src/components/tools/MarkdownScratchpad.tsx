import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: true });

const STORAGE_KEY = "scratchpad:content";

const DEFAULT_CONTENT = `# Scratchpad

Write Markdown on the left, see it rendered on the right.

- Autosaves to **this browser** as you type (nothing leaves your device)
- Supports GFM: **bold**, _italics_, \`inline code\`, links, images, and task lists

- [x] Try editing this text
- [ ] Refresh the page — your notes are still here
`;

export default function MarkdownScratchpad() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copyLabel, setCopyLabel] = useState("Copy as HTML");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  // Load any previously-saved note once, on mount (client only).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setContent(stored);
    } catch {
      setStorageAvailable(false);
    }
    setLoaded(true);
  }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!loaded || !storageAvailable) return;
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, content);
        setLastSaved(new Date());
      } catch {
        setStorageAvailable(false);
      }
    }, 400);
    return () => window.clearTimeout(saveTimeoutRef.current);
  }, [content, loaded, storageAvailable]);

  // Rendered client-side, from content the visitor typed into their own
  // browser and that never leaves localStorage — there's no separate trust
  // boundary here to sanitize against, unlike rendering someone else's input.
  const html = useMemo(() => marked.parse(content) as string, [content]);

  function handleClear() {
    if (!window.confirm("Clear the scratchpad? This can't be undone.")) return;
    setContent("");
  }

  async function handleCopyHtml() {
    try {
      await navigator.clipboard.writeText(html);
      setCopyLabel("Copied!");
      window.setTimeout(() => setCopyLabel("Copy as HTML"), 1800);
    } catch {
      setCopyLabel("Couldn't copy");
      window.setTimeout(() => setCopyLabel("Copy as HTML"), 1800);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <p className="text-xs text-foreground-muted">
          {storageAvailable
            ? lastSaved
              ? `Saved to this browser · ${lastSaved.toLocaleTimeString()}`
              : "Autosaves as you type"
            : "Storage unavailable in this browser — notes won't persist on reload"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopyHtml}
            className="min-h-9 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-surface-hover"
          >
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="min-h-9 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-surface-hover"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="flex flex-col">
          <label htmlFor="scratchpad-input" className="sr-only">
            Markdown input
          </label>
          <textarea
            id="scratchpad-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            spellCheck={false}
            className="min-h-[420px] flex-1 resize-none bg-transparent p-5 font-mono text-sm leading-relaxed text-foreground outline-none"
          />
        </div>

        <div className="min-h-[420px] flex-1 overflow-auto p-5">
          <div className="sr-only" aria-live="polite">
            Preview updates as you type.
          </div>
          {content.trim() === "" ? (
            <p className="text-sm text-foreground-muted">
              Nothing to preview yet — start typing on the left.
            </p>
          ) : (
            // eslint-disable-next-line react/no-danger
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
