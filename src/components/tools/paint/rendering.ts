/**
 * Canvas rendering logic — factored out of PaintStudio so that each drawing
 * sub-task (path, shape variant, text, image, selection UI) is its own small
 * function with a clear signature.
 *
 * Every function takes an explicit `ctx` and the pieces of data it needs,
 * making them unit-testable without instantiating a React component.
 */

import type { PaintElement, Bounds, Point, Layer } from "./types";
import { getElementBounds, getSelectionHandles, buildFontString } from "./utils";
import { DEFAULTS, SELECTION_COLORS, HANDLE_PAD } from "./constants";

// ─── Per-element drawing ────────────────────────────────────────────────────

/** Draw a path (brush / pencil / eraser stroke). */
const drawPath = (ctx: CanvasRenderingContext2D, el: PaintElement): void => {
  const points = el.points || [];
  if (points.length < 1) return;

  ctx.beginPath();
  ctx.strokeStyle = el.strokeColor || DEFAULTS.primaryColor;
  ctx.lineWidth = el.strokeWidth || DEFAULTS.strokeWidth;
  ctx.lineCap = el.lineCap || DEFAULTS.lineCap;
  ctx.lineJoin = "round";

  if (el.strokeType === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  }

  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
};

/** Draw a rectangle shape path — no fill/stroke yet. */
const traceRectangle = (ctx: CanvasRenderingContext2D, el: PaintElement) => {
  ctx.rect(el.x!, el.y!, el.width!, el.height!);
};

/** Draw a rounded rectangle shape path. */
const traceRoundedRect = (ctx: CanvasRenderingContext2D, el: PaintElement) => {
  const r = Math.min(16, Math.abs(el.width!) / 4, Math.abs(el.height!) / 4);
  ctx.roundRect(el.x!, el.y!, el.width!, el.height!, r);
};

/** Draw a circle/ellipse shape path. */
const traceCircle = (ctx: CanvasRenderingContext2D, el: PaintElement) => {
  const rx = Math.abs(el.width! / 2);
  const ry = Math.abs(el.height! / 2);
  const cx = el.x! + el.width! / 2;
  const cy = el.y! + el.height! / 2;
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
};

/** Draw a line shape path. */
const traceLine = (ctx: CanvasRenderingContext2D, el: PaintElement) => {
  ctx.moveTo(el.x!, el.y!);
  ctx.lineTo(el.x! + el.width!, el.y! + el.height!);
};

/** Draw an arrow shape path. */
const traceArrow = (ctx: CanvasRenderingContext2D, el: PaintElement) => {
  const fromX = el.x!;
  const fromY = el.y!;
  const toX = el.x! + el.width!;
  const toY = el.y! + el.height!;
  const headlen = 14;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);

  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle - Math.PI / 6),
    toY - headlen * Math.sin(angle - Math.PI / 6),
  );
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headlen * Math.cos(angle + Math.PI / 6),
    toY - headlen * Math.sin(angle + Math.PI / 6),
  );
};

/** Draw a star shape path. */
const traceStar = (
  ctx: CanvasRenderingContext2D,
  el: PaintElement,
  spikes = 5,
) => {
  const cx = el.x! + el.width! / 2;
  const cy = el.y! + el.height! / 2;
  const outerR = Math.min(Math.abs(el.width!), Math.abs(el.height!)) / 2;
  const innerR = outerR / 2;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;

  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
};

/** Map of shape type → trace function. */
const SHAPE_TRACERS: Record<string, (ctx: CanvasRenderingContext2D, el: PaintElement) => void> = {
  rectangle: traceRectangle,
  "rounded-rect": traceRoundedRect,
  circle: traceCircle,
  line: traceLine,
  arrow: traceArrow,
  star: traceStar,
};

/** Draw a shape element. */
const drawShape = (ctx: CanvasRenderingContext2D, el: PaintElement): void => {
  ctx.strokeStyle = el.strokeColor || DEFAULTS.primaryColor;
  ctx.lineWidth = el.strokeWidth || DEFAULTS.strokeWidth;
  ctx.fillStyle = el.fillColor || "transparent";

  ctx.beginPath();
  const tracer = SHAPE_TRACERS[el.shapeType || "rectangle"];
  if (tracer) tracer(ctx, el);

  if (el.fillEnabled && el.shapeType !== "line" && el.shapeType !== "arrow") {
    ctx.fill();
  }
  ctx.stroke();
};

/** Draw a text element. */
const drawText = (ctx: CanvasRenderingContext2D, el: PaintElement): void => {
  ctx.fillStyle = el.strokeColor || DEFAULTS.primaryColor;
  ctx.font = buildFontString(el);
  ctx.textBaseline = "top";
  ctx.fillText(el.text || "", el.x || 0, el.y || 0);
};

/** Draw an image element. Returns true if the image is cached and drawn. */
const drawImage = (
  ctx: CanvasRenderingContext2D,
  el: PaintElement,
  onImageLoaded: () => void,
): void => {
  if (el._imgObj) {
    ctx.drawImage(el._imgObj, el.x!, el.y!, el.width!, el.height!);
  } else if (el.src) {
    const img = new Image();
    img.onload = () => {
      el._imgObj = img;
      onImageLoaded();
    };
    img.src = el.src;
  }
};

/**
 * Entry point: draws a single element to a context, handling rotation and
 * per-element opacity uniformly across types.
 *
 * `onImageLoaded` is called when an image finishes loading so the caller
 * can trigger a re-render.
 */
export const drawElementToContext = (
  ctx: CanvasRenderingContext2D,
  el: PaintElement,
  onImageLoaded: () => void,
): void => {
  if (el.visible === false) return;

  ctx.save();
  ctx.globalAlpha = el.opacity ?? 1;

  // Uniform rotation around bounding-box center
  const rotation = el.rotation || 0;
  if (rotation) {
    const bounds = getElementBounds(el, ctx);
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  switch (el.type) {
    case "path":
      drawPath(ctx, el);
      break;
    case "shape":
      drawShape(ctx, el);
      break;
    case "text":
      drawText(ctx, el);
      break;
    case "image":
      drawImage(ctx, el, onImageLoaded);
      break;
  }

  ctx.restore();
};

// ─── Selection UI drawing ───────────────────────────────────────────────────

/** Draw selection overlay for a single artifact (bounding box + handles). */
export const drawSingleSelection = (
  ctx: CanvasRenderingContext2D,
  element: PaintElement,
): void => {
  const bounds = getElementBounds(element, ctx);
  const { x, y, w, h } = bounds;
  const { corners, rotate } = getSelectionHandles(bounds);

  ctx.save();
  ctx.strokeStyle = SELECTION_COLORS.primary;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - HANDLE_PAD, y - HANDLE_PAD, w + HANDLE_PAD * 2, h + HANDLE_PAD * 2);

  // Stem to rotate handle
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y - HANDLE_PAD);
  ctx.lineTo(rotate.x, rotate.y);
  ctx.stroke();

  // Corner resize handles
  ctx.fillStyle = SELECTION_COLORS.handle.fill;
  ctx.setLineDash([]);
  corners.forEach((hnd) => {
    ctx.beginPath();
    ctx.arc(hnd.x, hnd.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Rotate handle
  ctx.beginPath();
  ctx.arc(rotate.x, rotate.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = SELECTION_COLORS.handle.rotateFill;
  ctx.fill();
  ctx.strokeStyle = SELECTION_COLORS.handle.rotateStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
};

/** Draw dashed selection outlines for multi-selected artifacts. */
export const drawMultiSelection = (
  ctx: CanvasRenderingContext2D,
  elements: PaintElement[],
): void => {
  ctx.save();
  ctx.strokeStyle = SELECTION_COLORS.primary;
  ctx.lineWidth = 1.25;
  ctx.setLineDash([3, 3]);
  elements.forEach((el) => {
    const b = getElementBounds(el, ctx);
    ctx.strokeRect(b.x - HANDLE_PAD, b.y - HANDLE_PAD, b.w + HANDLE_PAD * 2, b.h + HANDLE_PAD * 2);
  });
  ctx.restore();
};

/** Draw a live marquee (rubber-band) selection rectangle. */
export const drawMarquee = (ctx: CanvasRenderingContext2D, rect: Bounds): void => {
  ctx.save();
  ctx.fillStyle = SELECTION_COLORS.marquee.fill;
  ctx.strokeStyle = SELECTION_COLORS.marquee.stroke;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
};
