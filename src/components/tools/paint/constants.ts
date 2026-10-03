import type { ColorPalette, FontEntry } from "./types";

// ─── Cursor ─────────────────────────────────────────────────────────────────

/** Data-URI cursor for the eyedropper tool — hotspot at the dropper tip. */
export const EYEDROPPER_CURSOR: string = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16" fill="black" stroke="white" stroke-width="0.5">
    <path d="M15 1c-1.8-1.8-3.7-0.7-4.6 0.1-0.4 0.4-0.7 0.9-0.7 1.5v0c0 1.1-1.1 1.8-2.1 1.5l-0.1-0.1-0.7 0.8 0.7 0.7-6 6-0.8 2.3-0.7 0.7 1.5 1.5 0.8-0.8 2.3-0.8 6-6 0.7 0.7 0.7-0.6-0.1-0.2c-0.3-1 0.4-2.1 1.5-2.1v0c0.6 0 1.1-0.2 1.4-0.6 0.9-0.9 2-2.8 0.2-4.6zM3.9 13.6l-2 0.7-0.2 0.1 0.1-0.2 0.7-2 5.8-5.8 1.5 1.5-5.9 5.7z" />
  </svg>`;
  const encoded = encodeURIComponent(svg);
  return `url("data:image/svg+xml;utf8,${encoded}") 2 22, crosshair`;
})();

// ─── Color palettes ─────────────────────────────────────────────────────────

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: "Editorial Teal & Coral",
    colors: [
      "#0f6e5c", "#083d33", "#2a9d8f", "#00ff66", "#0000ff",
      "#000080", "#00f5d4", "#00b4d8", "#f94a29", "#c14e32",
      "#e0785c", "#b58900", "#ffdf00", "#1c2624", "#faf9f6",
    ],
  },
  {
    name: "Warm Paper & Amber",
    colors: [
      "#2a332f", "#454f4c", "#7a7267", "#c2b9a8",
      "#d97706", "#f59e0b", "#fbbf24", "#f0eee7",
    ],
  },
  {
    name: "Emerald & Indigo",
    colors: [
      "#059669", "#10b981", "#34d399", "#4f46e5",
      "#6366f1", "#818cf8", "#0f172a", "#f8fafc",
    ],
  },
  {
    name: "Monochrome Studio",
    colors: [
      "#000000", "#18181b", "#3f3f46", "#71717a",
      "#a1a1aa", "#d4d4d8", "#e4e4e7", "#ffffff",
    ],
  },
];

// ─── Fonts ──────────────────────────────────────────────────────────────────

export const FONTS: FontEntry[] = [
  { id: "sans", name: "Inter Sans", family: "Inter, sans-serif" },
  { id: "display", name: "Bricolage Grotesque", family: "'Bricolage Grotesque', sans-serif" },
  { id: "mono", name: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
  { id: "serif", name: "Georgia Serif", family: "Georgia, serif" },
  { id: "hand", name: "Comic / Hand drawn", family: "'Comic Sans MS', 'Chalkboard SE', cursive" },
];

// ─── Autosave ───────────────────────────────────────────────────────────────

export const AUTOSAVE_STORAGE_KEY = "paint-studio:autosave:v1";

// ─── Selection geometry ─────────────────────────────────────────────────────

/** Padding between an artifact and its selection bounding box. */
export const HANDLE_PAD = 6;

/** Stem length above the selection box for the rotate handle. */
export const ROTATE_HANDLE_OFFSET = 24;

// ─── Default values ─────────────────────────────────────────────────────────

export const DEFAULTS = {
  canvasWidth: 800,
  canvasHeight: 600,
  bgColor: "#faf9f6",
  primaryColor: "#0f6e5c",
  fillColor: "#c14e32",
  strokeWidth: 4,
  fontSize: 28,
  font: "Inter, sans-serif",
  brushOpacity: 1,
  lineCap: "round" as const,

  /** Toast display duration in ms. */
  toastDuration: 3_000,
  /** Autosave debounce delay in ms. */
  autosaveDebounce: 800,
  /** Min font size for text resize. */
  minFontSize: 6,
  /** Max font size for text resize. */
  maxFontSize: 400,
  /** Hit-test padding around artifacts. */
  hitPadding: 5,
  /** Hit-test padding for path artifacts (looser). */
  pathHitPadding: 10,
  /** Minimum drag distance for a shape to be committed. */
  minShapeSize: 2,
  /** Minimum resize size. */
  minResizeSize: 8,
  /** Snap rotation increment (degrees) when Shift is held. */
  rotationSnap: 15,
  /** Duplicate offset in pixels. */
  duplicateOffset: 16,
} as const;

// ─── Selection accent colours ───────────────────────────────────────────────

export const SELECTION_COLORS = {
  primary: "#c14e32",
  marquee: {
    fill: "rgba(15, 110, 92, 0.08)",
    stroke: "#0f6e5c",
  },
  handle: {
    fill: "#ffffff",
    rotateFill: "#c14e32",
    rotateStroke: "#ffffff",
  },
} as const;