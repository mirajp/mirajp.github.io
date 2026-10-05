import { useCallback, useEffect, useRef, useState } from "react";
import type { EditorState, SvgEditorProps } from "../contracts";
import { parse } from "../io/parse";
import { sanitize } from "../io/sanitize";
import { exportSvg } from "../io/serialize";
import { fit } from "../render/coords";
import { createEditorStore } from "../state/createEditorStore";
import { PaneView } from "./PaneView";
import { Toolbar } from "./Toolbar";
import { UploadZone } from "./UploadZone";
import { useEditorStore } from "./useEditorStore";

const domParserAdapter = {
  parseFromString(source: string, mimeType: "image/svg+xml") {
    return new DOMParser().parseFromString(source, mimeType);
  },
};

function selectDocument(state: EditorState) {
  return state.document;
}

function selectMetadata(state: EditorState) {
  return state.metadata;
}

function selectFindingCount(state: EditorState) {
  return state.metadata?.sanitizationReport.findings.length ?? 0;
}

interface SvgEditorWorkspaceProps extends SvgEditorProps {
  store: ReturnType<typeof createEditorStore>;
}

function SvgEditorWorkspace({
  maxFileBytes,
  initialSvg,
  onExport,
  store,
}: SvgEditorWorkspaceProps) {
  const rootRef = useRef<HTMLElement>(null);
  const editedViewportRef = useRef<HTMLDivElement | null>(null);
  const blobUrlsRef = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [paneError, setPaneError] = useState<Error | null>(null);
  const document = useEditorStore(store, selectDocument);
  const metadata = useEditorStore(store, selectMetadata);
  const findingCount = useEditorStore(store, selectFindingCount);
  const zoomReadoutRef = useRef<HTMLSpanElement>(null);

  const loadSource = useCallback(
    (source: string) => {
      setBusy(true);
      setErrorMessage("");
      setNotice("");
      setPaneError(null);
      try {
        const sanitized = sanitize(source, maxFileBytes);
        const parsed = parse(
          sanitized.sanitizedSource,
          domParserAdapter,
          source,
        );
        const nextMetadata = {
          ...parsed.metadata,
          sanitizedSource: sanitized.sanitizedSource,
          sanitizationReport: sanitized.report,
        };
        store.load(parsed.doc, nextMetadata);
        setNotice(
          sanitized.report.findings.length > 0
            ? `${sanitized.report.findings.length} unsafe item${sanitized.report.findings.length === 1 ? "" : "s"} removed.`
            : "SVG loaded.",
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load this SVG.",
        );
      } finally {
        setBusy(false);
      }
    },
    [maxFileBytes, store],
  );

  useEffect(() => {
    if (initialSvg && !store.getSnapshot().document) loadSource(initialSvg);
  }, [initialSvg, loadSource, store]);

  useEffect(
    () => () => {
      for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
      blobUrlsRef.current.clear();
    },
    [],
  );

  const onEditorKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.stopPropagation();
    }
    if (event.code === "Space" && !isEditableTarget(event.target)) {
      event.preventDefault();
      rootRef.current?.setAttribute("data-space-pan", "");
    }
  };

  const onEditorKeyUp = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.code === "Space")
      rootRef.current?.removeAttribute("data-space-pan");
  };

  const onEditorBlur = (): void => {
    rootRef.current?.removeAttribute("data-space-pan");
  };

  function onPaste(event: React.ClipboardEvent<HTMLElement>): void {
    if (
      isEditableTarget(event.target) ||
      (event.target instanceof Element &&
        event.target.closest('[data-testid="upload-zone"]'))
    ) {
      return;
    }
    const text = event.clipboardData.getData("text/plain");
    if (!/<svg(?:\s|>)/i.test(text)) return;
    event.preventDefault();
    loadSource(text);
  }

  function onExportClick(): void {
    const state = store.getSnapshot();
    if (!state.document || !state.metadata) return;
    const result = exportSvg(
      state.document,
      state.metadata,
      state.document.version,
    );
    onExport?.(result.svg, { sanitized: result.sanitized });
    const blob = new Blob([result.svg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    blobUrlsRef.current.add(url);
    const link = globalThis.document.createElement("a");
    link.href = url;
    link.download = "edited.svg";
    link.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
    }, 1000);
    setNotice(
      result.sanitized
        ? "Exported. Unsafe content was removed."
        : "SVG exported.",
    );
  }

  async function onCopyClick(): Promise<void> {
    const state = store.getSnapshot();
    if (!state.document || !state.metadata) return;
    const result = exportSvg(
      state.document,
      state.metadata,
      state.document.version,
    );
    try {
      await navigator.clipboard.writeText(result.svg);
      setNotice("SVG source copied.");
    } catch {
      setErrorMessage(
        "Clipboard access is unavailable. Use Export SVG instead.",
      );
    }
  }

  function fitView(): void {
    if (!document) return;
    const rootNode = document.nodes.get(document.root);
    if (!rootNode || rootNode.kind !== "element") return;
    const viewBox = rootNode.attrs.viewBox
      ?.trim()
      .split(/[,\s]+/)
      .map(Number);
    const width = Number.parseFloat(rootNode.attrs.width ?? "");
    const height = Number.parseFloat(rootNode.attrs.height ?? "");
    const content =
      viewBox?.length === 4 && viewBox.every(Number.isFinite)
        ? {
            x: viewBox[0],
            y: viewBox[1],
            width: viewBox[2],
            height: viewBox[3],
          }
        : {
            x: 0,
            y: 0,
            width: Number.isFinite(width) && width > 0 ? width : 100,
            height: Number.isFinite(height) && height > 0 ? height : 100,
          };
    const viewport = editedViewportRef.current;
    if (!viewport) return;
    const bounds = viewport.getBoundingClientRect();
    try {
      store.setViewTransform(
        "edited",
        fit(content, { width: bounds.width, height: bounds.height }),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to fit the SVG.",
      );
    }
  }

  function viewportSize(): { width: number; height: number } {
    const rect = editedViewportRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }

  const onPaneError = useCallback((error: Error) => setPaneError(error), []);

  return (
    <section
      ref={rootRef}
      className="mt-8 space-y-4 rounded-xl border border-border bg-surface p-4 text-foreground sm:p-6"
      aria-label="SVG editor"
      data-svg-editor
      onKeyDown={onEditorKeyDown}
      onKeyUp={onEditorKeyUp}
      onBlur={onEditorBlur}
      onPaste={onPaste}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-semibold">SVG editor</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Work with a safe, local copy. Your file stays in this browser.
          </p>
        </div>
        <span className="font-mono text-xs text-foreground-muted">
          {document ? `${document.nodes.size} nodes` : "No file loaded"}
        </span>
      </header>

      <UploadZone
        onSource={loadSource}
        onError={setErrorMessage}
        maxFileBytes={maxFileBytes}
        busy={busy}
      />

      <Toolbar
        store={store}
        onFit={fitView}
        onExport={onExportClick}
        onCopy={() => void onCopyClick()}
        viewportSize={viewportSize}
        zoomReadoutRef={zoomReadoutRef}
      />

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <PaneView
          store={store}
          pane="original"
          rootRef={rootRef}
          onError={onPaneError}
        />
        <PaneView
          store={store}
          pane="edited"
          rootRef={rootRef}
          viewportRef={(element) => {
            editedViewportRef.current = element;
          }}
          onError={onPaneError}
        />
      </div>

      {findingCount > 0 && metadata && (
        <details className="rounded-md border border-warning/40 bg-background p-3 text-sm">
          <summary className="cursor-pointer font-medium">
            {findingCount} unsafe item{findingCount === 1 ? "" : "s"} removed
            before loading
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-foreground-muted">
            {metadata.sanitizationReport.findings.map((finding, index) => (
              <li key={`${finding.kind}-${index}`}>
                {finding.message}
                {finding.location ? ` (${finding.location})` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      {(errorMessage || paneError) && (
        <p
          className="rounded-md border border-error/40 bg-background px-3 py-2 text-sm text-error"
          role="alert"
        >
          {errorMessage || `Unable to render SVG: ${paneError?.message}`}
        </p>
      )}
      {notice && !errorMessage && (
        <p className="text-sm text-foreground-muted" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.matches("input, textarea, select, [role='textbox']"))
  );
}

export function SvgEditor(props: SvgEditorProps) {
  const [store] = useState(() => createEditorStore());
  return <SvgEditorWorkspace {...props} store={store} />;
}

export default SvgEditor;
