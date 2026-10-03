import { HANDLE_PAD, ROTATE_HANDLE_OFFSET, DEFAULTS } from "./constants";
import type { PaintElement, Bounds, Point, CanvasState, Layer } from "./types";

// ─── Geometry ───────────────────────────────────────────────────────────────

/** True axis-aligned overlap test for marquee/rubber-band selection. */
export const boxesOverlap = (a: Bounds, b: Bounds): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/**
 * The artifact's own local (unrotated) bounding box.
 *
 * Path/text bounds are derived (points extent / measured text); shape and
 * image carry x/y/width/height directly.
 *
 * `ctx` is only used to measureText and can be any live 2D context.
 */
export const getElementBounds = (
  el: PaintElement,
  ctx?: CanvasRenderingContext2D | null,
): Bounds => {
  let x = el.x || 0,
    y = el.y || 0,
    w = el.width || 0,
    h = el.height || 0;

  if (el.type === "path") {
    if (!el.points || el.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
    const xs = el.points.map((pt) => pt.x);
    const ys = el.points.map((pt) => pt.y);
    x = Math.min(...xs);
    y = Math.min(...ys);
    w = Math.max(...xs) - x;
    h = Math.max(...ys) - y;
  } else if (el.type === "text") {
    let textWidth = 100;
    if (ctx) {
      ctx.font = buildFontString(el);
      textWidth = ctx.measureText(el.text || "").width;
    }
    w = Math.max(20, textWidth);
    h = (el.fontSize || DEFAULTS.fontSize) * 1.2;
  }

  return { x, y, w, h };
};

/**
 * The 4 corner (resize) handle positions and the 1 rotate handle position,
 * for a given local bounding box.
 */
export const getSelectionHandles = (bounds: Bounds) => {
  const { x, y, w, h } = bounds;
  const corners = [
    { corner: "tl" as const, x: x - HANDLE_PAD, y: y - HANDLE_PAD },
    { corner: "tr" as const, x: x + w + HANDLE_PAD, y: y - HANDLE_PAD },
    { corner: "br" as const, x: x + w + HANDLE_PAD, y: y + h + HANDLE_PAD },
    { corner: "bl" as const, x: x - HANDLE_PAD, y: y + h + HANDLE_PAD },
  ];
  const rotate: Point = {
    x: x + w / 2,
    y: y - HANDLE_PAD - ROTATE_HANDLE_OFFSET,
  };
  return { corners, rotate };
};

/**
 * Given an artifact's original bounds and a new dragged bounds (with the
 * opposite corner held fixed), return a patched copy of the element.
 */
export const computeResizedElement = (
  el: PaintElement,
  origBounds: Bounds,
  newBounds: Bounds,
): PaintElement => {
  if (el.type === "shape" || el.type === "image") {
    return { ...el, x: newBounds.x, y: newBounds.y, width: newBounds.w, height: newBounds.h };
  }

  if (el.type === "path") {
    const scaleX = origBounds.w > 0 ? newBounds.w / origBounds.w : 1;
    const scaleY = origBounds.h > 0 ? newBounds.h / origBounds.h : 1;
    return {
      ...el,
      points: (el.points || []).map((pt) => ({
        x: newBounds.x + (pt.x - origBounds.x) * scaleX,
        y: newBounds.y + (pt.y - origBounds.y) * scaleY,
      })),
    };
  }

  if (el.type === "text") {
    const scaleX = origBounds.w > 0 ? newBounds.w / origBounds.w : 1;
    const scaleY = origBounds.h > 0 ? newBounds.h / origBounds.h : 1;
    const scale = Math.max(scaleX, scaleY);
    const newFontSize = Math.min(
      DEFAULTS.maxFontSize,
      Math.max(DEFAULTS.minFontSize, Math.round((el.fontSize || DEFAULTS.fontSize) * scale)),
    );
    return { ...el, fontSize: newFontSize };
  }

  return el;
};

// ─── Canvas CSS font string ─────────────────────────────────────────────────

/** Build a CSS font shorthand from an element's text properties. */
export const buildFontString = (el: PaintElement): string => {
  const style = el.italic ? "italic " : "";
  const weight = el.bold ? "bold " : "";
  const size = el.fontSize || DEFAULTS.fontSize;
  const family = el.font || DEFAULTS.font;
  return `${style}${weight}${size}px ${family}`;
};

// ─── Human-readable element label ───────────────────────────────────────────

/** Short label for the layers panel artifact list. */
export const getElementLabel = (el: PaintElement): string => {
  if (el.type === "text") {
    const preview = (el.text || "").trim();
    return preview ? `Text: "${preview.slice(0, 14)}"` : "Text";
  }
  if (el.type === "path") {
    if (el.strokeType === "eraser") return "Eraser Stroke";
    if (el.strokeType === "pencil") return "Pencil Stroke";
    return "Brush Stroke";
  }
  if (el.type === "shape") {
    return `Shape: ${(el.shapeType || "").replace("-", " ")}`;
  }
  if (el.type === "image") return "Image";
  return el.type;
};

// ─── ID generation ──────────────────────────────────────────────────────────

let _counter = 0;
/** Generate a unique element id. */
export const makeElementId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${++_counter}`;

// ─── Serialisation helpers (share URL + autosave) ───────────────────────────

export const encodeCanvasState = (state: CanvasState): string | null => {
  try {
    const compact = {
      w: state.width,
      h: state.height,
      bg: state.bgColor,
      layers: state.layers.map((l) => ({
        id: l.id,
        name: l.name,
        v: l.visible ? 1 : 0,
        o: l.opacity,
        elements: l.elements.map((e) => ({
          id: e.id,
          t: e.type,
          st: e.shapeType,
          sT: e.strokeType,
          x: Math.round(e.x || 0),
          y: Math.round(e.y || 0),
          w: Math.round(e.width || 0),
          h: Math.round(e.height || 0),
          r: Math.round(e.rotation || 0),
          c: e.strokeColor,
          sw: e.strokeWidth,
          f: e.fillColor,
          fe: e.fillEnabled ? 1 : 0,
          p: e.points
            ? e.points.map((pt) => [Math.round(pt.x), Math.round(pt.y)])
            : undefined,
          txt: e.text,
          fn: e.font,
          fs: e.fontSize,
          b: e.bold ? 1 : 0,
          i: e.italic ? 1 : 0,
          src: e.src && e.src.length < 50_000 ? e.src : undefined,
          v: e.visible === false ? 0 : 1,
          lk: e.locked ? 1 : 0,
          op: e.opacity ?? 1,
        })),
      })),
    };
    const jsonStr = JSON.stringify(compact);
    return btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );
  } catch (err) {
    console.error("Encoding error:", err);
    return null;
  }
};

export const decodeCanvasState = (base64: string): CanvasState | null => {
  try {
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(
          atob(base64),
          (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(""),
    );
    const compact = JSON.parse(jsonStr);
    return {
      width: compact.w,
      height: compact.h,
      bgColor: compact.bg,
      layers: compact.layers.map((l: any) => ({
        id: l.id,
        name: l.name,
        visible: l.v === 1,
        locked: false,
        opacity: l.o ?? 1,
        elements: l.elements.map((e: any, idx: number) => ({
          id: e.id || "el_" + Date.now() + "_" + idx,
          type: e.t,
          shapeType: e.st,
          strokeType: e.sT,
          x: e.x,
          y: e.y,
          width: e.w,
          height: e.h,
          rotation: e.r || 0,
          strokeColor: e.c || DEFAULTS.primaryColor,
          strokeWidth: e.sw || 3,
          fillColor: e.f || "transparent",
          fillEnabled: e.fe === 1,
          points: e.p ? e.p.map((pt: number[]) => ({ x: pt[0], y: pt[1] })) : [],
          text: e.txt || "",
          font: e.fn || DEFAULTS.font,
          fontSize: e.fs || DEFAULTS.fontSize,
          bold: e.b === 1,
          italic: e.i === 1,
          src: e.src,
          visible: e.v === undefined ? true : e.v === 1,
          locked: e.lk === 1,
          opacity: e.op ?? 1,
        })),
      })),
    };
  } catch (err) {
    console.error("Decoding error:", err);
    return null;
  }
};

// ─── Cursor generation ──────────────────────────────────────────────────────

/**
 * Generate a custom circle cursor SVG data-URI that scales with brush
 * size & zoom level.
 *
 * @param size    Brush strokeWidth
 * @param zoom    Current canvas zoom factor
 * @param _color  Unused atm — kept for possible future tinting
 */
export const buildBrushCursor = (
  size: number,
  zoom: number,
  _color = "#000000",
): string => {
  const scaledDiameter = Math.max(4, Math.min(size * zoom, 128));
  const radius = scaledDiameter / 2;
  const padding = 2;
  const svgSize = scaledDiameter + padding * 2;
  const center = svgSize / 2;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1" />
  </svg>`;

  const encodedSvg = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encodedSvg}") ${center} ${center}, crosshair`;
};