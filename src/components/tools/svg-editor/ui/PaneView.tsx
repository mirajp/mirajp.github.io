import { useEffect, useRef } from "react";
import type { EditorState, Pane, SvgDocument } from "../contracts";
import { parse } from "../io/parse";
import { createPaneHost } from "../render/pane";
import { diff, SvgRenderer } from "../render/renderer";
import type { EditorStoreWithLink } from "../state/createEditorStore";
import { mountViewportController } from "./ViewportController";
import { useEditorStore } from "./useEditorStore";

const domParserAdapter = {
  parseFromString(source: string, mimeType: "image/svg+xml") {
    return new DOMParser().parseFromString(source, mimeType);
  },
};

interface PaneViewProps {
  store: EditorStoreWithLink;
  pane: Pane;
  rootRef: React.RefObject<HTMLElement | null>;
  viewportRef?: (element: HTMLDivElement | null) => void;
  onError(error: Error): void;
}

function selectMetadata(state: EditorState) {
  return state.metadata;
}

export function PaneView({
  store,
  pane,
  rootRef,
  viewportRef,
  onError,
}: PaneViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const metadata = useEditorStore(store, selectMetadata);

  useEffect(() => {
    const mount = mountRef.current;
    const rootElement = rootRef.current;
    if (!mount || !metadata || !rootElement) return;

    const paneHost = createPaneHost(mount.ownerDocument);
    paneHost.dataset.paneHost = pane;
    mount.appendChild(paneHost);

    const renderer = new SvgRenderer();
    renderer.mount(paneHost.rendererContainer);
    let initialDocument: SvgDocument | null = null;

    try {
      initialDocument =
        pane === "original"
          ? parse(metadata.sanitizedSource, domParserAdapter).doc
          : store.getSnapshot().document;
      if (initialDocument) {
        renderer.render(initialDocument);
        renderer
          .nodeToElement(initialDocument.root)
          ?.setAttribute("data-pane-svg", pane);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error(String(error)));
    }

    const unsubscribe = store.subscribeSelector(
      (state) => state.document,
      (next, previous) => {
        if (pane === "original" || !next || !previous) return;
        renderer.patch(diff(previous, next));
        renderer.nodeToElement(next.root)?.setAttribute("data-pane-svg", pane);
      },
    );
    const removeViewportController = mountViewportController({
      root: rootElement,
      viewport: mount,
      store,
      pane,
      getZoomReadout:
        pane === "edited"
          ? () => rootElement.querySelector('[data-testid="zoom-level"]')
          : undefined,
    });

    return () => {
      unsubscribe();
      removeViewportController();
      renderer.destroy();
      paneHost.remove();
    };
  }, [metadata, onError, pane, rootRef, store]);

  return (
    <section
      className="min-w-0"
      role="region"
      aria-label={pane === "original" ? "Original SVG pane" : "Edited SVG pane"}
      data-pane={pane}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          {pane === "original" ? "Original" : "Edited"}
        </h3>
        {pane === "original" ? (
          <span className="text-xs text-foreground-muted">
            Sanitized source
          </span>
        ) : (
          <span className="text-xs text-foreground-muted">Working copy</span>
        )}
      </div>
      <div
        ref={(element) => {
          mountRef.current = element;
          viewportRef?.(element);
        }}
        className="h-80 overflow-hidden rounded-md border border-border bg-background sm:h-[28rem]"
        data-testid={`${pane}-viewport`}
      />
    </section>
  );
}
