import type { EditorState } from "../contracts";
import { zoomAt } from "../render/coords";
import type { EditorStoreWithLink } from "../state/createEditorStore";
import { useEditorStore } from "./useEditorStore";

interface ToolbarProps {
  store: EditorStoreWithLink;
  onFit(): void;
  onExport(): void;
  onCopy(): void;
  viewportSize(): { width: number; height: number };
  zoomReadoutRef: React.RefObject<HTMLSpanElement | null>;
}

function selectDocument(state: EditorState) {
  return state.document;
}

function selectLinked(state: EditorState) {
  return state.view.linked;
}

export function Toolbar({
  store,
  onFit,
  onExport,
  onCopy,
  viewportSize,
  zoomReadoutRef,
}: ToolbarProps) {
  const linked = useEditorStore(store, selectLinked);
  const document = useEditorStore(store, selectDocument);

  function zoom(factor: number): void {
    const { width, height } = viewportSize();
    const current = store.getSnapshot().view.edited;
    store.setViewTransform(
      "edited",
      zoomAt(current, width / 2, height / 2, factor),
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="toolbar"
      aria-label="SVG view and export tools"
    >
      <button
        type="button"
        onClick={onFit}
        disabled={!document}
        className={buttonClass}
      >
        Fit
      </button>
      <button
        type="button"
        onClick={() =>
          store.setViewTransform("edited", { scale: 1, tx: 0, ty: 0 })
        }
        disabled={!document}
        className={buttonClass}
      >
        100%
      </button>
      <button
        type="button"
        onClick={() => zoom(1.1)}
        disabled={!document}
        className={buttonClass}
        aria-label="Zoom in"
      >
        +
      </button>
      <span
        ref={zoomReadoutRef}
        className="min-w-12 px-1 text-center font-mono text-xs tabular-nums text-foreground-muted"
        aria-label="Zoom level"
        data-testid="zoom-level"
      >
        100%
      </span>
      <button
        type="button"
        onClick={() => zoom(1 / 1.1)}
        disabled={!document}
        className={buttonClass}
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <button
        type="button"
        onClick={() => store.setLinked(!linked)}
        aria-pressed={linked}
        className={buttonClass}
      >
        Link views
      </button>
      <span className="flex-1" />
      <button
        type="button"
        onClick={onCopy}
        disabled={!document}
        className={buttonClass}
      >
        Copy source
      </button>
      <button
        type="button"
        onClick={onExport}
        disabled={!document}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        Export SVG
      </button>
    </div>
  );
}

const buttonClass =
  "min-h-9 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
