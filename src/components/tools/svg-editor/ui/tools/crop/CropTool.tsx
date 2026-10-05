import { useEffect, useRef, useState } from "react";
import type { EditorStoreWithLink } from "../../../state/createEditorStore";
import { mountCropOverlay } from "../../../render/overlay/crop";
import type { CropOverlay } from "../../../render/overlay/crop";

export interface CropToolProps {
  store: EditorStoreWithLink;
  viewport: HTMLElement | null;
}

export function CropTool({ store, viewport }: CropToolProps) {
  const [active, setActive] = useState(false);
  const [keepDisplaySize, setKeepDisplaySize] = useState(false);
  const [error, setError] = useState("");
  const overlayRef = useRef<CropOverlay | null>(null);
  const keepDisplaySizeRef = useRef(keepDisplaySize);
  keepDisplaySizeRef.current = keepDisplaySize;

  useEffect(() => {
    if (!active || !viewport) return;
    const paneHost = viewport.querySelector<HTMLElement>("[data-pane-host]");
    const svgRoot =
      paneHost?.shadowRoot?.querySelector<SVGSVGElement>("svg") ?? null;
    if (!svgRoot) {
      setError("Load an SVG before using the crop tool.");
      setActive(false);
      return;
    }

    try {
      overlayRef.current = mountCropOverlay({
        viewport,
        svgRoot,
        store,
        keepDisplaySize: () => keepDisplaySizeRef.current,
        onFinish: () => setActive(false),
        onError: (nextError) => setError(nextError.message),
      });
      setError("");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to start the crop tool.",
      );
      setActive(false);
    }

    return () => {
      overlayRef.current?.destroy();
      overlayRef.current = null;
    };
  }, [active, store, viewport]);

  function toggleTool() {
    setError("");
    setActive((current) => !current);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-pressed={active}
        aria-describedby="crop-tool-help"
        title="Changes the viewBox; it does not delete any SVG geometry."
        onClick={toggleTool}
        className="min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {active ? "Cancel crop" : "Crop (visible area)"}
      </button>
      <label className="flex min-h-10 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={keepDisplaySize}
          onChange={(event) => setKeepDisplaySize(event.currentTarget.checked)}
          className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        Keep display size
      </label>
      <span id="crop-tool-help" className="text-xs text-foreground-muted">
        Cropping changes the viewBox. It does not delete geometry.
      </span>
      {active && (
        <button
          type="button"
          onClick={() => overlayRef.current?.confirm()}
          className="min-h-10 rounded-md bg-primary px-3 py-2 text-sm font-medium text-background hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Apply crop
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default CropTool;
