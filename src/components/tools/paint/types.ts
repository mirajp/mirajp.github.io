// ─── Core domain types ──────────────────────────────────────────────────────

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type ElementType = "path" | "shape" | "text" | "image";
export type StrokeType = "brush" | "pencil" | "eraser";
export type ShapeType =
  | "rectangle"
  | "rounded-rect"
  | "circle"
  | "line"
  | "arrow"
  | "star";
export type LineCap = "round" | "butt" | "square";

export type ToolId =
  | "select"
  | "brush"
  | "pencil"
  | "eraser"
  | "eyedropper"
  | "shape"
  | "text"
  | "pan";

export type ZOrderAction = "front" | "back" | "forward" | "backward";

/**
 * A single drawable artifact on a layer.
 *
 * Every property that _can_ be missing gets a sensible default wherever it's
 * consumed, but marking them optional here keeps element construction concise
 * (a freshly drawn path doesn't need `width` / `height`, and a shape doesn't
 * need `points` / `text`).
 */
export interface PaintElement {
  id: string;
  type: ElementType;

  // Position & dimensions (shape, image, text)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;

  // Stroke
  strokeColor?: string;
  strokeWidth?: number;
  strokeType?: StrokeType;
  lineCap?: LineCap;

  // Fill (shapes only)
  fillColor?: string;
  fillEnabled?: boolean;

  // Path points (brush / pencil / eraser strokes)
  points?: Point[];

  // Text
  text?: string;
  font?: string;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;

  // Image
  src?: string;
  /** Cached HTMLImageElement — never serialised. */
  _imgObj?: HTMLImageElement;

  // Meta
  visible?: boolean;
  locked?: boolean;
  opacity?: number;
  shapeType?: ShapeType;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  elements: PaintElement[];
}

// ─── Drawing-in-progress state (stored in a ref, never in React state) ──────

export type DrawingMode =
  | "draw_path"
  | "draw_shape"
  | "drag_element"
  | "resize_element"
  | "rotate_element"
  | "drag_group"
  | "marquee_select";

export interface DrawingState {
  mode: DrawingMode;

  // draw_path
  currentPath?: PaintElement;

  // draw_shape
  shape?: PaintElement;
  startX?: number;
  startY?: number;

  // drag_element
  element?: PaintElement;
  origX?: number;
  origY?: number;
  draggedElement?: PaintElement;

  // resize_element
  origBounds?: Bounds;
  anchor?: Point;

  // rotate_element
  center?: Point;
  startAngle?: number;
  origRotation?: number;

  // drag_group
  originals?: Record<string, PaintElement>;

  // marquee_select
  additive?: boolean;
  baseSelection?: string[];
  marqueeRect?: Bounds;

  // Shared preview fields used by renderAllLayers
  activePreviewElement?: PaintElement;
  previewOverrides?: Record<string, PaintElement>;
}

// ─── Serialisation (for share URL / autosave) ───────────────────────────────

export interface CanvasState {
  width: number;
  height: number;
  bgColor: string;
  layers: Layer[];
}

export interface AutosavePayload extends CanvasState {
  version: number;
  savedAt: number;
}

// ─── Font entry ─────────────────────────────────────────────────────────────

export interface FontEntry {
  id: string;
  name: string;
  family: string;
}

// ─── Color palette ──────────────────────────────────────────────────────────

export interface ColorPalette {
  name: string;
  colors: string[];
}

// ─── Tool definition (for the sidebar button list) ──────────────────────────

export interface ToolDef {
  id: ToolId;
  icon: React.FC;
  label: string;
}
