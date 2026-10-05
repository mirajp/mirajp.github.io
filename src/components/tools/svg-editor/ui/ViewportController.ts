import type { Pane, ViewTransform } from "../contracts";
import { pan, zoomAt } from "../render/coords";
import type { EditorStoreWithLink } from "../state/createEditorStore";

export interface ViewportControllerOptions {
  root: HTMLElement;
  viewport: HTMLElement;
  store: EditorStoreWithLink;
  pane: Pane;
  getZoomReadout?: () => HTMLElement | null;
}

export function mountViewportController({
  root,
  viewport,
  store,
  pane,
  getZoomReadout,
}: ViewportControllerOptions): () => void {
  let currentTransform = store.getSnapshot().view[pane];
  let svgRoot: SVGElement | null = null;
  let frame = 0;
  let drag: {
    pointerId: number;
    x: number;
    y: number;
    transform: ViewTransform;
  } | null = null;

  const applyTransform = (): void => {
    const paneHost = viewport.querySelector<HTMLElement>("[data-pane-host]");
    const svg = paneHost?.shadowRoot?.querySelector<SVGElement>("svg") ?? null;
    if (svg !== svgRoot) {
      svgRoot = svg;
      if (svgRoot) {
        svgRoot.style.transformOrigin = "0 0";
        svgRoot.style.transformBox = "border-box";
      }
    }
    if (svgRoot) {
      svgRoot.style.transform = `translate(${currentTransform.tx}px, ${currentTransform.ty}px) scale(${currentTransform.scale})`;
    }
    const zoomReadout = getZoomReadout?.();
    if (zoomReadout) {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        zoomReadout.textContent = `${Math.round(currentTransform.scale * 100)}%`;
        frame = 0;
      });
    }
  };

  const unsubscribe = store.subscribeSelector(
    (state) => state.view[pane],
    (transform) => {
      currentTransform = transform;
      applyTransform();
    },
  );
  applyTransform();

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    const factor = Math.exp(-event.deltaY * 0.001);
    store.setViewTransform(
      pane,
      zoomAt(
        currentTransform,
        event.clientX - bounds.left,
        event.clientY - bounds.top,
        factor,
      ),
    );
  };

  const stopDrag = (): void => {
    if (!drag) return;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);
    drag = null;
    viewport.removeAttribute("data-panning");
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    store.setViewTransform(
      pane,
      pan(drag.transform, event.clientX - drag.x, event.clientY - drag.y),
    );
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (drag && event.pointerId === drag.pointerId) stopDrag();
  };

  const onPointerDown = (event: PointerEvent): void => {
    const spacePan = root.hasAttribute("data-space-pan");
    if (event.button !== 1 && !spacePan) return;
    event.preventDefault();
    drag = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      transform: currentTransform,
    };
    viewport.setAttribute("data-panning", "");
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
  };

  viewport.addEventListener("wheel", onWheel, { passive: false });
  viewport.addEventListener("pointerdown", onPointerDown);

  return () => {
    stopDrag();
    viewport.removeEventListener("wheel", onWheel);
    viewport.removeEventListener("pointerdown", onPointerDown);
    unsubscribe();
    if (frame) cancelAnimationFrame(frame);
    if (svgRoot) svgRoot.style.transform = "";
  };
}
