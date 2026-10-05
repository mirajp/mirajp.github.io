import type { EditorStoreWithLink } from "../../../state/createEditorStore";
import { setViewBox } from "../../../core/commands/geometry";
import { clientToSvg, elementBBoxInRoot } from "../../coords";

export interface CropRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropOverlayOptions {
  viewport: HTMLElement;
  svgRoot: SVGSVGElement;
  store: EditorStoreWithLink;
  keepDisplaySize: () => boolean;
  onFinish: () => void;
  onError: (error: Error) => void;
}

interface CropPreview {
  rectangle: CropRectangle | null;
  active: boolean;
}

const HANDLE_SIZE = 5;
const MIN_RECT_SIZE = 3;
const SVG_NS = "http://www.w3.org/2000/svg";

function browserGeometryAdapter() {
  return {
    getScreenCTM(element: SVGGraphicsElement) {
      return element.getScreenCTM();
    },
    getBBox(element: SVGGraphicsElement) {
      const box = element.getBBox();
      return new DOMRect(box.x, box.y, box.width, box.height);
    },
  };
}

function normalizeRect(
  first: { x: number; y: number },
  second: { x: number; y: number },
): CropRectangle {
  return {
    x: Math.min(first.x, second.x),
    y: Math.min(first.y, second.y),
    width: Math.abs(second.x - first.x),
    height: Math.abs(second.y - first.y),
  };
}

function resizeFromHandle(
  start: CropRectangle,
  handle: number,
  point: { x: number; y: number },
): CropRectangle {
  const right = start.x + start.width;
  const bottom = start.y + start.height;
  const corners = [
    { x: start.x, y: start.y },
    { x: right, y: start.y },
    { x: start.x, y: bottom },
    { x: right, y: bottom },
  ];
  const fixed = corners[3 - handle]!;
  return normalizeRect(fixed, point);
}

function rootBounds(
  svgRoot: SVGSVGElement,
  viewport: HTMLElement,
): CropRectangle {
  const box = elementBBoxInRoot(svgRoot, browserGeometryAdapter());
  if (box.width > 0 && box.height > 0) return box;
  const rect = viewport.getBoundingClientRect();
  const topLeft = clientToSvg(
    svgRoot,
    rect.left,
    rect.top,
    browserGeometryAdapter(),
  );
  const bottomRight = clientToSvg(
    svgRoot,
    rect.right,
    rect.bottom,
    browserGeometryAdapter(),
  );
  return normalizeRect(topLeft, bottomRight);
}

/**
 * Owns an imperative viewport-space crop overlay. preview() only changes overlay
 * DOM; the SVG model and history remain untouched until confirm().
 */
export class CropOverlay {
  private readonly svg: SVGSVGElement;
  private readonly rectangleElement: SVGRectElement;
  private readonly handleElements: SVGCircleElement[];
  private readonly readout: HTMLOutputElement;
  private readonly resizeObserver: ResizeObserver;
  private readonly previousPosition: string;
  private readonly returnFocus: HTMLElement | null;
  private rectangle: CropRectangle | null = null;
  private active = true;
  private drag: {
    pointerId: number;
    start: { x: number; y: number };
    initial: CropRectangle | null;
    handle: number | null;
  } | null = null;
  private readonly adapter = browserGeometryAdapter();

  constructor(private readonly options: CropOverlayOptions) {
    const { viewport } = options;
    const ownerDocument = viewport.ownerDocument;
    const computedPosition =
      ownerDocument.defaultView?.getComputedStyle(viewport).position;
    this.previousPosition = viewport.style.position;
    this.returnFocus =
      ownerDocument.activeElement instanceof HTMLElement
        ? ownerDocument.activeElement
        : null;
    if (!computedPosition || computedPosition === "static") {
      viewport.style.position = "relative";
    }

    this.svg = ownerDocument.createElementNS(SVG_NS, "svg");
    this.svg.setAttribute("aria-hidden", "true");
    this.svg.setAttribute("data-crop-overlay", "");
    this.svg.setAttribute("preserveAspectRatio", "none");
    this.svg.setAttribute("width", String(viewport.clientWidth));
    this.svg.setAttribute("height", String(viewport.clientHeight));
    this.svg.setAttribute(
      "viewBox",
      `0 0 ${viewport.clientWidth} ${viewport.clientHeight}`,
    );
    Object.assign(this.svg.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      touchAction: "none",
      cursor: "crosshair",
      pointerEvents: "all",
      zIndex: "2",
    });
    this.svg.tabIndex = -1;

    this.rectangleElement = ownerDocument.createElementNS(SVG_NS, "rect");
    this.rectangleElement.setAttribute("data-crop-rectangle", "");
    this.rectangleElement.setAttribute("fill", "var(--color-primary)");
    this.rectangleElement.setAttribute("fill-opacity", "0.12");
    this.rectangleElement.setAttribute("stroke", "var(--color-primary)");
    this.rectangleElement.setAttribute("stroke-width", "2");
    this.rectangleElement.setAttribute("vector-effect", "non-scaling-stroke");
    this.rectangleElement.setAttribute("pointer-events", "all");
    this.svg.appendChild(this.rectangleElement);

    this.handleElements = Array.from({ length: 4 }, (_, index) => {
      const handle = ownerDocument.createElementNS(SVG_NS, "circle");
      handle.setAttribute("data-crop-handle", String(index));
      handle.setAttribute("r", String(HANDLE_SIZE));
      handle.setAttribute("fill", "var(--color-background)");
      handle.setAttribute("stroke", "var(--color-primary)");
      handle.setAttribute("stroke-width", "2");
      handle.setAttribute("vector-effect", "non-scaling-stroke");
      handle.setAttribute("pointer-events", "all");
      this.svg.appendChild(handle);
      return handle;
    });

    this.readout = ownerDocument.createElement("output");
    this.readout.setAttribute("aria-live", "polite");
    this.readout.setAttribute("data-crop-readout", "");
    Object.assign(this.readout.style, {
      position: "absolute",
      left: "0.75rem",
      bottom: "0.75rem",
      zIndex: "3",
      padding: "0.25rem 0.5rem",
      borderRadius: "0.25rem",
      background: "var(--color-background)",
      color: "var(--color-foreground)",
      font: "12px ui-monospace, monospace",
      pointerEvents: "none",
    });

    viewport.append(this.svg, this.readout);
    this.svg.addEventListener("pointerdown", this.onPointerDown);
    this.svg.addEventListener("keydown", this.onKeyDown);
    ownerDocument.addEventListener("pointermove", this.onDocumentPointerMove);
    ownerDocument.addEventListener("pointerup", this.onDocumentPointerUp);
    ownerDocument.addEventListener("pointercancel", this.onDocumentPointerUp);
    this.resizeObserver = new ResizeObserver(() => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      this.svg.setAttribute("width", String(width));
      this.svg.setAttribute("height", String(height));
      this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    });
    this.resizeObserver.observe(viewport);
    this.svg.focus({ preventScroll: true });
    this.preview({ rectangle: null, active: true });
  }

  preview(preview: CropPreview): void {
    this.active = preview.active;
    this.rectangle = preview.rectangle;
    this.svg.style.display = preview.active ? "block" : "none";
    this.readout.style.display = preview.active ? "block" : "none";
    const rectangle = preview.rectangle;
    if (!rectangle) {
      this.rectangleElement.setAttribute("visibility", "hidden");
      for (const handle of this.handleElements)
        handle.setAttribute("visibility", "hidden");
      this.readout.value = "Drag to define the visible area";
      this.readout.textContent = this.readout.value;
      return;
    }

    this.rectangleElement.setAttribute("visibility", "visible");
    this.rectangleElement.setAttribute("x", String(rectangle.x));
    this.rectangleElement.setAttribute("y", String(rectangle.y));
    this.rectangleElement.setAttribute("width", String(rectangle.width));
    this.rectangleElement.setAttribute("height", String(rectangle.height));
    const corners = [
      { x: rectangle.x, y: rectangle.y },
      { x: rectangle.x + rectangle.width, y: rectangle.y },
      { x: rectangle.x, y: rectangle.y + rectangle.height },
      { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height },
    ];
    this.handleElements.forEach((handle, index) => {
      handle.setAttribute("visibility", "visible");
      handle.setAttribute("cx", String(corners[index]!.x));
      handle.setAttribute("cy", String(corners[index]!.y));
    });
    this.readout.value = `${rectangle.width.toFixed(1)} × ${rectangle.height.toFixed(1)} viewport px`;
    this.readout.textContent = this.readout.value;
  }

  confirm(): void {
    if (!this.rectangle || !this.active) return;
    if (
      this.rectangle.width < MIN_RECT_SIZE ||
      this.rectangle.height < MIN_RECT_SIZE
    ) {
      this.options.onError(
        new RangeError("Draw a crop area at least 3 pixels wide and high."),
      );
      return;
    }
    try {
      const viewportBounds = this.options.viewport.getBoundingClientRect();
      const left =
        viewportBounds.left +
        this.options.viewport.clientLeft +
        this.rectangle.x;
      const top =
        viewportBounds.top + this.options.viewport.clientTop + this.rectangle.y;
      const right = left + this.rectangle.width;
      const bottom = top + this.rectangle.height;
      const corners = [
        clientToSvg(this.options.svgRoot, left, top, this.adapter),
        clientToSvg(this.options.svgRoot, right, top, this.adapter),
        clientToSvg(this.options.svgRoot, left, bottom, this.adapter),
        clientToSvg(this.options.svgRoot, right, bottom, this.adapter),
      ];
      const xs = corners.map((point) => point.x);
      const ys = corners.map((point) => point.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);

      this.options.store.dispatch(
        setViewBox({
          minX,
          minY,
          width: maxX - minX,
          height: maxY - minY,
          keepDisplaySize: this.options.keepDisplaySize(),
          bounds: rootBounds(this.options.svgRoot, this.options.viewport),
        }),
      );
      this.options.onFinish();
    } catch (error) {
      this.options.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  cancel(): void {
    this.rectangle = null;
    this.preview({ rectangle: null, active: false });
    this.options.onFinish();
  }

  destroy(): void {
    this.svg.removeEventListener("pointerdown", this.onPointerDown);
    this.svg.removeEventListener("keydown", this.onKeyDown);
    this.resizeObserver.disconnect();
    this.options.viewport.ownerDocument.removeEventListener(
      "pointermove",
      this.onDocumentPointerMove,
    );
    this.options.viewport.ownerDocument.removeEventListener(
      "pointerup",
      this.onDocumentPointerUp,
    );
    this.options.viewport.ownerDocument.removeEventListener(
      "pointercancel",
      this.onDocumentPointerUp,
    );
    this.svg.remove();
    this.readout.remove();
    this.options.viewport.style.position = this.previousPosition;
    if (this.returnFocus?.isConnected) this.returnFocus.focus();
    this.drag = null;
  }

  private point(event: PointerEvent): { x: number; y: number } {
    const rect = this.options.viewport.getBoundingClientRect();
    return {
      x: event.clientX - rect.left - this.options.viewport.clientLeft,
      y: event.clientY - rect.top - this.options.viewport.clientTop,
    };
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.active || event.button !== 0) return;
    const target = event.target;
    const handle =
      target instanceof Element
        ? target.closest<SVGCircleElement>("[data-crop-handle]")
        : null;
    const handleIndex = handle
      ? Number(handle.getAttribute("data-crop-handle"))
      : null;
    const start = this.point(event);
    this.drag = {
      pointerId: event.pointerId,
      start,
      initial: this.rectangle,
      handle: Number.isInteger(handleIndex) ? handleIndex : null,
    };
    if (this.drag.handle === null) {
      this.rectangle = { x: start.x, y: start.y, width: 0, height: 0 };
      this.preview({ rectangle: this.rectangle, active: true });
    }
    this.svg.focus({ preventScroll: true });
    event.preventDefault();
    event.stopPropagation();
  };

  private onDocumentPointerMove = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.updateFromPointer(event);
  };

  private onDocumentPointerUp = (event: PointerEvent): void => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.updateFromPointer(event);
    this.drag = null;
  };

  private updateFromPointer(event: PointerEvent): void {
    if (!this.drag) return;
    const point = this.point(event);
    this.rectangle =
      this.drag.handle === null
        ? normalizeRect(this.drag.start, point)
        : resizeFromHandle(this.drag.initial!, this.drag.handle, point);
    this.preview({ rectangle: this.rectangle, active: true });
    event.preventDefault();
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (!this.active) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.cancel();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.confirm();
      return;
    }
    if (
      !this.rectangle ||
      !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 10 : 1;
    const dx =
      event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const dy =
      event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    this.rectangle = {
      ...this.rectangle,
      x: this.rectangle.x + dx,
      y: this.rectangle.y + dy,
    };
    this.preview({ rectangle: this.rectangle, active: true });
  };
}

export function mountCropOverlay(options: CropOverlayOptions): CropOverlay {
  return new CropOverlay(options);
}
