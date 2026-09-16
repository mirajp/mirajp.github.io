import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Inline SVG Icon components for reliable, dependency-free rendering
const Icons = {
  Select: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l7 18 3-7 7-3L3 3z"
      />
    </svg>
  ),
  Brush: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 32 28">
      <path d="M31.132 0.827 C29.975 -0.315 28.099 -0.315 26.942 0.827 L14.336 13.277 L18.499 17.44 L31.132 4.964 C32.289 3.821 32.289 1.969 31.132 0.827 Z M11.461 24.385 C10.477 25.298 6.08 27.333 3.491 25.36 C3.491 25.36 4.392 24.657 5.074 23.246 C6.703 18.919 10.763 19.56 10.763 19.56 L12.159 20.938 C12.173 20.952 13.202 22.771 11.461 24.385 Z M12.913 14.683 L9.764 17.788 C7.661 17.74 4.748 18.485 3.491 22.603 C2.53 24.781 0 24.671 0 24.671 C5.253 30.498 11.444 27.196 12.857 25.764 C14.1 24.506 14.279 22.966 14.146 21.734 L17.076 18.846 L12.913 14.683 Z" />
    </svg>
  ),
  Pencil: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.17 3.03a2.5 2.5 0 0 0-3.54 0L3.8 16.85 2 22l5.15-1.8 13.82-13.82a2.5 2.5 0 0 0 0-3.35z" />
      <path d="M15.5 5.5l3 3" />
      <path d="M5.5 15.5l3 3" />
    </svg>
  ),
  Eraser: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 21L2.5 16.5a2.12 2.12 0 0 1 0-3L14 2l7.5 7.5a2.12 2.12 0 0 1 0 3L11 21H7z" />
      <path d="M9.5 6.5l7 7" />
      <path d="M9 21h12" />
    </svg>
  ),
  Eyedropper: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
      <path d="M15 1c-1.8-1.8-3.7-0.7-4.6 0.1-0.4 0.4-0.7 0.9-0.7 1.5v0c0 1.1-1.1 1.8-2.1 1.5l-0.1-0.1-0.7 0.8 0.7 0.7-6 6-0.8 2.3-0.7 0.7 1.5 1.5 0.8-0.8 2.3-0.8 6-6 0.7 0.7 0.7-0.6-0.1-0.2c-0.3-1 0.4-2.1 1.5-2.1v0c0.6 0 1.1-0.2 1.4-0.6 0.9-0.9 2-2.8 0.2-4.6zM3.9 13.6l-2 0.7-0.2 0.1 0.1-0.2 0.7-2 5.8-5.8 1.5 1.5-5.9 5.7z" />
    </svg>
  ),
  Shapes: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.5 5a6.5 6.5 0 1 0 -4.5 10" />
      <rect x="11" y="6" width="11" height="11" />
      <polygon points="10,12 2,22 18,22" />
    </svg>
  ),
  Text: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Square boundary frame without gaps */}
      <rect x="4" y="4" width="16" height="16" rx="1" />

      {/* Corner anchor points */}
      <circle cx="4" cy="4" r="1.5" fill="currentColor" />
      <circle cx="20" cy="4" r="1.5" fill="currentColor" />
      <circle cx="4" cy="20" r="1.5" fill="currentColor" />
      <circle cx="20" cy="20" r="1.5" fill="currentColor" />

      {/* Central "T" text character */}
      <path d="M9 9h6" />
      <path d="M12 9v6" />
    </svg>
  ),
  Pan: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l4 4h-3v4h-2V6H8l4-4z" />
      <path d="M12 22l-4-4h3v-4h2v4h3l-4 4z" />
      <path d="M2 12l4-4v3h4v2H6v3l-4-4z" />
      <path d="M22 12l-4 4v-3h-4v-2h4V8l4 4z" />
    </svg>
  ),
  Undo: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  ),
  Redo: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
      />
    </svg>
  ),
  ZoomIn: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
      />
    </svg>
  ),
  ZoomOut: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM7 10h6"
      />
    </svg>
  ),
  Layers: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  ),
  Eye: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  EyeOff: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.007 10.007 0 012.122-.363c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18"
      />
    </svg>
  ),
  Lock: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  Unlock: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
      />
    </svg>
  ),
  Trash: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
  Download: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  ),
  Upload: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  ),
  Share: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  ),
  Plus: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  ChevronUp: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  Settings: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Help: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const COLOR_PALETTES = [
  {
    name: "Editorial Teal & Coral",
    colors: [
      "#0f6e5c",
      "#083d33",
      "#2a9d8f",
      "#00ff66",
      "#0000ff",
      "#000080",
      "#00f5d4",
      "#00b4d8",
      "#f94a29",
      "#c14e32",
      "#e0785c",
      "#b58900",
      "#ffdf00",
      "#1c2624",
      "#faf9f6",
    ],
  },
  {
    name: "Warm Paper & Amber",
    colors: [
      "#2a332f",
      "#454f4c",
      "#7a7267",
      "#c2b9a8",
      "#d97706",
      "#f59e0b",
      "#fbbf24",
      "#f0eee7",
    ],
  },
  {
    name: "Emerald & Indigo",
    colors: [
      "#059669",
      "#10b981",
      "#34d399",
      "#4f46e5",
      "#6366f1",
      "#818cf8",
      "#0f172a",
      "#f8fafc",
    ],
  },
  {
    name: "Monochrome Studio",
    colors: [
      "#000000",
      "#18181b",
      "#3f3f46",
      "#71717a",
      "#a1a1aa",
      "#d4d4d8",
      "#e4e4e7",
      "#ffffff",
    ],
  },
];

const FONTS = [
  { id: "sans", name: "Inter Sans", family: "Inter, sans-serif" },
  {
    id: "display",
    name: "Bricolage Grotesque",
    family: "'Bricolage Grotesque', sans-serif",
  },
  { id: "mono", name: "JetBrains Mono", family: "'JetBrains Mono', monospace" },
  { id: "serif", name: "Georgia Serif", family: "Georgia, serif" },
  {
    id: "hand",
    name: "Comic / Hand drawn",
    family: "'Comic Sans MS', 'Chalkboard SE', cursive",
  },
];

const encodeCanvasState = (state) => {
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
          x: Math.round(e.x),
          y: Math.round(e.y),
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
          src: e.src && e.src.length < 50000 ? e.src : undefined,
        })),
      })),
    };
    const jsonStr = JSON.stringify(compact);
    return btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode("0x" + p1),
      ),
    );
  } catch (err) {
    console.error("Encoding error:", err);
    return null;
  }
};

const decodeCanvasState = (base64) => {
  try {
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(
          atob(base64),
          (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(""),
    );
    const compact = JSON.parse(jsonStr);
    return {
      width: compact.w,
      height: compact.h,
      bgColor: compact.bg,
      layers: compact.layers.map((l) => ({
        id: l.id,
        name: l.name,
        visible: l.v === 1,
        locked: false,
        opacity: l.o ?? 1,
        elements: l.elements.map((e, idx) => ({
          id: e.id || "el_" + Date.now() + "_" + idx,
          type: e.t,
          shapeType: e.st,
          strokeType: e.sT,
          x: e.x,
          y: e.y,
          width: e.w,
          height: e.h,
          rotation: e.r || 0,
          strokeColor: e.c || "#0f6e5c",
          strokeWidth: e.sw || 3,
          fillColor: e.f || "transparent",
          fillEnabled: e.fe === 1,
          points: e.p ? e.p.map((pt) => ({ x: pt[0], y: pt[1] })) : [],
          text: e.txt || "",
          font: e.fn || "Inter, sans-serif",
          fontSize: e.fs || 28,
          bold: e.b === 1,
          italic: e.i === 1,
          src: e.src,
        })),
      })),
    };
  } catch (err) {
    console.error("Decoding error:", err);
    return null;
  }
};

export default function PaintStudio() {
  // Canvas Canvas dimensions & Viewport State
  const [canvasWidth, setCanvasWidth] = useState(800);
  const [canvasHeight, setCanvasHeight] = useState(600);
  const [bgColor, setBgColor] = useState("#faf9f6");
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Tools & Drawing Properties State
  const [activeTool, setActiveTool] = useState("brush"); // select, brush, pencil, eraser, eyedropper, shape, text, pan
  const [activeShape, setActiveShape] = useState("rectangle"); // rectangle, rounded-rect, circle, line, arrow, star
  const [primaryColor, setPrimaryColor] = useState("#0f6e5c");
  const [fillColor, setFillColor] = useState("#c14e32");
  const [fillEnabled, setFillEnabled] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [brushOpacity, setBrushOpacity] = useState(1);
  const [lineCap, setLineCap] = useState("round");

  // Text Properties & Live Text Editor State
  const [textFont, setTextFont] = useState("Inter, sans-serif");
  const [textSize, setTextSize] = useState(28);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [editingTextValue, setEditingTextValue] = useState("");

  // Layers & Artifact History State
  const [layers, setLayers] = useState([
    {
      id: "layer_1",
      name: "Background Layer",
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState("layer_1");
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Undo/Redo History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // UI Modals & Notifications
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });

  // Refs
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawingStateRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const saveHistory = useCallback(
    (newLayers) => {
      const serialized = JSON.stringify(newLayers);
      setHistory((prev) => {
        const updated = prev.slice(0, historyIndex + 1);
        return [...updated, serialized];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const pushLayerUpdate = useCallback(
    (updater) => {
      setLayers((prevLayers) => {
        const nextLayers =
          typeof updater === "function" ? updater(prevLayers) : updater;
        saveHistory(nextLayers);
        return nextLayers;
      });
    },
    [saveHistory],
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setLayers(JSON.parse(history[prevIdx]));
      setHistoryIndex(prevIdx);
      showToast("Undo action");
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setLayers(JSON.parse(history[nextIdx]));
      setHistoryIndex(nextIdx);
      showToast("Redo action");
    }
  }, [history, historyIndex]);

  // Find selected element object across all or active layers
  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    for (const layer of layers) {
      const found = layer.elements.find((e) => e.id === selectedElementId);
      if (found) return found;
    }
    return null;
  }, [layers, selectedElementId]);

  // Synchronize text property inputs when selected element changes
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setEditingTextValue(selectedElement.text || "");
      if (selectedElement.font) setTextFont(selectedElement.font);
      if (selectedElement.fontSize) setTextSize(selectedElement.fontSize);
      if (selectedElement.bold !== undefined) setTextBold(selectedElement.bold);
      if (selectedElement.italic !== undefined)
        setTextItalic(selectedElement.italic);
      if (selectedElement.strokeColor)
        setPrimaryColor(selectedElement.strokeColor);
    }
  }, [selectedElementId]);

  // Artifact Deletion Function
  const deleteSelectedElement = useCallback(() => {
    if (!selectedElementId) {
      showToast("No element selected to delete");
      return;
    }

    pushLayerUpdate((prev) =>
      prev.map((l) => ({
        ...l,
        elements: l.elements.filter((e) => e.id !== selectedElementId),
      })),
    );

    setSelectedElementId(null);
    showToast("Artifact deleted");
  }, [selectedElementId, pushLayerUpdate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid hotkeys when typing in input or textarea
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        )
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedElement();
      } else if (e.key === "v" || e.key === "V") {
        setActiveTool("select");
      } else if (e.key === "b" || e.key === "B") {
        setActiveTool("brush");
      } else if (e.key === "p" || e.key === "P") {
        setActiveTool("pencil");
      } else if (e.key === "e" || e.key === "E") {
        setActiveTool("eraser");
      } else if (e.key === "s" || e.key === "S") {
        setActiveTool("shape");
      } else if (e.key === "t" || e.key === "T") {
        setActiveTool("text");
      } else if (e.key === "i" || e.key === "I") {
        setActiveTool("eyedropper");
      } else if (e.key === "h" || e.key === "H") {
        setActiveTool("pan");
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedElement, handleUndo, handleRedo]);

  // Initial Hash Loading
  useEffect(() => {
    if (window.location.hash.startsWith("#data=")) {
      const base64 = window.location.hash.replace("#data=", "");
      const loaded = decodeCanvasState(base64);
      if (loaded) {
        setCanvasWidth(loaded.width);
        setCanvasHeight(loaded.height);
        setBgColor(loaded.bgColor || "#faf9f6");
        setLayers(loaded.layers);
        setActiveLayerId(loaded.layers[0]?.id || "layer_1");
        showToast("Shared canvas state restored!");
      }
    } else {
      setHistory([JSON.stringify(layers)]);
      setHistoryIndex(0);
    }
  }, []);

  const processImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPendingImage({
          src: event.target.result,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        setShowImageModal(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) processImageFile(file);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = "";
  };

  const handleImageOption = (option) => {
    if (!pendingImage) return;

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked) {
      showToast("Selected layer is locked!");
      setShowImageModal(false);
      return;
    }

    if (option === "resize_canvas") {
      setCanvasWidth(pendingImage.width);
      setCanvasHeight(pendingImage.height);
      const newImgElement = {
        id: "img_" + Date.now(),
        type: "image",
        x: 0,
        y: 0,
        width: pendingImage.width,
        height: pendingImage.height,
        src: pendingImage.src,
        rotation: 0,
      };
      pushLayerUpdate((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, elements: [...l.elements, newImgElement] }
            : l,
        ),
      );
      setSelectedElementId(newImgElement.id);
      showToast("Canvas resized to match image dimensions");
    } else if (option === "scale_fit") {
      const scale = Math.min(
        canvasWidth / pendingImage.width,
        canvasHeight / pendingImage.height,
      );
      const w = pendingImage.width * scale;
      const h = pendingImage.height * scale;
      const x = (canvasWidth - w) / 2;
      const y = (canvasHeight - h) / 2;

      const newImgElement = {
        id: "img_" + Date.now(),
        type: "image",
        x,
        y,
        width: w,
        height: h,
        src: pendingImage.src,
        rotation: 0,
      };
      pushLayerUpdate((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, elements: [...l.elements, newImgElement] }
            : l,
        ),
      );
      setSelectedElementId(newImgElement.id);
      showToast("Image scaled to fit canvas");
    } else {
      const x = Math.max(0, (canvasWidth - pendingImage.width) / 2);
      const y = Math.max(0, (canvasHeight - pendingImage.height) / 2);
      const newImgElement = {
        id: "img_" + Date.now(),
        type: "image",
        x,
        y,
        width: pendingImage.width,
        height: pendingImage.height,
        src: pendingImage.src,
        rotation: 0,
      };
      pushLayerUpdate((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, elements: [...l.elements, newImgElement] }
            : l,
        ),
      );
      setSelectedElementId(newImgElement.id);
      showToast("Image added as canvas element");
    }

    setPendingImage(null);
    setShowImageModal(false);
  };

  const handlePickColor = async (e) => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        setPrimaryColor(result.sRGBHex);
        showToast(`Picked color: ${result.sRGBHex}`);
        setActiveTool("brush");
      } catch (err) {
        // User canceled or eyedropper unsupported
      }
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const x = Math.round((clientX - rect.left) / zoom);
      const y = Math.round((clientY - rect.top) / zoom);

      const ctx = canvas.getContext("2d");
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      setPrimaryColor(hex);
      showToast(`Sampled color: ${hex}`);
      setActiveTool("brush");
    }
  };

  const addLayer = () => {
    const newId = "layer_" + Date.now();
    const newLayer = {
      id: newId,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
    };
    pushLayerUpdate((prev) => [...prev, newLayer]);
    setActiveLayerId(newId);
    showToast("New layer added");
  };

  const deleteLayer = (id) => {
    if (layers.length <= 1) {
      showToast("Cannot delete the only layer");
      return;
    }
    pushLayerUpdate((prev) => prev.filter((l) => l.id !== id));
    if (activeLayerId === id) {
      const remaining = layers.filter((l) => l.id !== id);
      setActiveLayerId(remaining[remaining.length - 1].id);
    }
    showToast("Layer deleted");
  };

  const moveLayer = (id, direction) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= layers.length) return;

    const newLayers = [...layers];
    const [moved] = newLayers.splice(idx, 1);
    newLayers.splice(targetIdx, 0, moved);
    pushLayerUpdate(newLayers);
  };

  const mergeDownLayer = (id) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx <= 0) {
      showToast("Cannot merge down bottom layer");
      return;
    }
    const targetLayer = layers[idx - 1];
    const currentLayer = layers[idx];

    const mergedElements = [...targetLayer.elements, ...currentLayer.elements];
    const newLayers = layers
      .filter((l) => l.id !== id)
      .map((l) =>
        l.id === targetLayer.id ? { ...l, elements: mergedElements } : l,
      );
    pushLayerUpdate(newLayers);
    setActiveLayerId(targetLayer.id);
    showToast(`Merged ${currentLayer.name} into ${targetLayer.name}`);
  };

  const drawElementToContext = (ctx, el) => {
    ctx.save();

    if (el.type === "path") {
      if (el.points.length < 1) return;
      ctx.beginPath();
      ctx.strokeStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = el.lineCap || "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = el.opacity ?? 1;

      if (el.strokeType === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      }

      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y);
      }
      ctx.stroke();
    } else if (el.type === "shape") {
      ctx.strokeStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;
      ctx.fillStyle = el.fillColor;

      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      if (el.rotation) ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-(el.x + el.width / 2), -(el.y + el.height / 2));

      ctx.beginPath();
      if (el.shapeType === "rectangle") {
        ctx.rect(el.x, el.y, el.width, el.height);
      } else if (el.shapeType === "rounded-rect") {
        const r = Math.min(16, Math.abs(el.width) / 4, Math.abs(el.height) / 4);
        ctx.roundRect(el.x, el.y, el.width, el.height, r);
      } else if (el.shapeType === "circle") {
        const rx = Math.abs(el.width / 2);
        const ry = Math.abs(el.height / 2);
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      } else if (el.shapeType === "line") {
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
      } else if (el.shapeType === "arrow") {
        const fromX = el.x,
          fromY = el.y;
        const toX = el.x + el.width,
          toY = el.y + el.height;
        const headlen = 14;
        const dx = toX - fromX,
          dy = toY - fromY;
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
      } else if (el.shapeType === "star") {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const outerR = Math.min(Math.abs(el.width), Math.abs(el.height)) / 2;
        const innerR = outerR / 2;
        const spikes = 5;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;

        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
          let x = cx + Math.cos(rot) * outerR;
          let y = cy + Math.sin(rot) * outerR;
          ctx.lineTo(x, y);
          rot += step;

          x = cx + Math.cos(rot) * innerR;
          y = cy + Math.sin(rot) * innerR;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.lineTo(cx, cy - outerR);
        ctx.closePath();
      }

      if (
        el.fillEnabled &&
        el.shapeType !== "line" &&
        el.shapeType !== "arrow"
      ) {
        ctx.fill();
      }
      ctx.stroke();
    } else if (el.type === "text") {
      ctx.fillStyle = el.strokeColor || "#0f6e5c";
      ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${el.fontSize || 28}px ${el.font || "Inter, sans-serif"}`;
      ctx.textBaseline = "top";
      ctx.fillText(el.text, el.x, el.y);
    } else if (el.type === "image") {
      if (el._imgObj) {
        ctx.drawImage(el._imgObj, el.x, el.y, el.width, el.height);
      } else {
        const img = new Image();
        img.onload = () => {
          el._imgObj = img;
          renderAllLayers();
        };
        img.src = el.src;
      }
    }

    ctx.restore();
  };

  const renderAllLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw each visible layer
    layers.forEach((layer) => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      layer.elements.forEach((el) => drawElementToContext(ctx, el));

      ctx.restore();
    });

    // Draw active preview element during creation
    if (
      drawingStateRef.current &&
      drawingStateRef.current.activePreviewElement
    ) {
      drawElementToContext(ctx, drawingStateRef.current.activePreviewElement);
    }

    // Draw Bounding Box around selected artifact
    if (selectedElement) {
      let x = selectedElement.x,
        y = selectedElement.y,
        w = selectedElement.width || 0,
        h = selectedElement.height || 0;
      if (selectedElement.type === "path") {
        const xs = selectedElement.points.map((pt) => pt.x);
        const ys = selectedElement.points.map((pt) => pt.y);
        x = Math.min(...xs);
        y = Math.min(...ys);
        w = Math.max(...xs) - x;
        h = Math.max(...ys) - y;
      } else if (selectedElement.type === "text") {
        ctx.font = `${selectedElement.italic ? "italic " : ""}${selectedElement.bold ? "bold " : ""}${selectedElement.fontSize || 28}px ${selectedElement.font || "Inter, sans-serif"}`;
        const metrics = ctx.measureText(selectedElement.text || "");
        w = Math.max(20, metrics.width);
        h = (selectedElement.fontSize || 28) * 1.2;
      }

      ctx.save();
      ctx.strokeStyle = "#c14e32";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);

      // Handle corner nodes
      ctx.fillStyle = "#ffffff";
      ctx.setLineDash([]);
      const handles = [
        { x: x - 6, y: y - 6 },
        { x: x + w + 6, y: y - 6 },
        { x: x + w + 6, y: y + h + 6 },
        { x: x - 6, y: y + h + 6 },
      ];
      handles.forEach((hnd) => {
        ctx.beginPath();
        ctx.arc(hnd.x, hnd.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    }
  }, [layers, canvasWidth, canvasHeight, bgColor, selectedElement]);

  useEffect(() => {
    renderAllLayers();
  }, [renderAllLayers]);

  // Handle Real-Time updates to selected text element properties
  const updateSelectedTextElement = (key, value) => {
    if (!selectedElement || selectedElement.type !== "text") return;

    pushLayerUpdate((prev) =>
      prev.map((layer) => ({
        ...layer,
        elements: layer.elements.map((el) => {
          if (el.id !== selectedElement.id) return el;
          return {
            ...el,
            [key]: value,
          };
        }),
      })),
    );
  };

  const getCanvasPointerPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0].clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0].clientY);

    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const handlePointerDown = (e) => {
    if (activeTool === "pan" || e.button === 1 || e.spaceKey) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
      return;
    }

    const pos = getCanvasPointerPos(e);
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) {
      showToast("Current layer is locked or hidden!");
      return;
    }

    if (activeTool === "eyedropper") {
      handlePickColor(e);
      return;
    }

    if (activeTool === "select") {
      // Find element under cursor across current active layer
      let found = null;
      for (let i = activeLayer.elements.length - 1; i >= 0; i--) {
        const el = activeLayer.elements[i];
        if (el.type === "shape" || el.type === "image") {
          const minX = Math.min(el.x, el.x + el.width);
          const maxX = Math.max(el.x, el.x + el.width);
          const minY = Math.min(el.y, el.y + el.height);
          const maxY = Math.max(el.y, el.y + el.height);
          if (
            pos.x >= minX - 5 &&
            pos.x <= maxX + 5 &&
            pos.y >= minY - 5 &&
            pos.y <= maxY + 5
          ) {
            found = el;
            break;
          }
        } else if (el.type === "text") {
          const canvas = canvasRef.current;
          const ctx = canvas ? canvas.getContext("2d") : null;
          let w = 100;
          if (ctx) {
            ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${el.fontSize || 28}px ${el.font || "Inter, sans-serif"}`;
            w = ctx.measureText(el.text || "").width;
          }
          const h = (el.fontSize || 28) * 1.2;
          if (
            pos.x >= el.x - 5 &&
            pos.x <= el.x + w + 5 &&
            pos.y >= el.y - 5 &&
            pos.y <= el.y + h + 5
          ) {
            found = el;
            break;
          }
        } else if (el.type === "path") {
          const xs = el.points.map((p) => p.x);
          const ys = el.points.map((p) => p.y);
          const minX = Math.min(...xs),
            maxX = Math.max(...xs);
          const minY = Math.min(...ys),
            maxY = Math.max(...ys);
          if (
            pos.x >= minX - 10 &&
            pos.x <= maxX + 10 &&
            pos.y >= minY - 10 &&
            pos.y <= maxY + 10
          ) {
            found = el;
            break;
          }
        }
      }

      if (found) {
        setSelectedElementId(found.id);
        drawingStateRef.current = {
          mode: "drag_element",
          element: found,
          startX: pos.x,
          startY: pos.y,
          origX: found.x,
          origY: found.y,
        };
      } else {
        setSelectedElementId(null);
      }
      renderAllLayers();
      return;
    }

    if (
      activeTool === "brush" ||
      activeTool === "pencil" ||
      activeTool === "eraser"
    ) {
      const newPath = {
        id: "path_" + Date.now(),
        type: "path",
        strokeType: activeTool,
        points: [pos],
        strokeColor: activeTool === "eraser" ? "#ffffff" : primaryColor,
        strokeWidth:
          activeTool === "pencil" ? Math.min(2, strokeWidth) : strokeWidth,
        opacity: brushOpacity,
        lineCap,
      };

      drawingStateRef.current = {
        mode: "draw_path",
        currentPath: newPath,
      };
      return;
    }

    if (activeTool === "shape") {
      const newShape = {
        id: "shape_" + Date.now(),
        type: "shape",
        shapeType: activeShape,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        strokeColor: primaryColor,
        strokeWidth,
        fillColor,
        fillEnabled,
        rotation: 0,
      };

      drawingStateRef.current = {
        mode: "draw_shape",
        startX: pos.x,
        startY: pos.y,
        shape: newShape,
      };
      return;
    }

    if (activeTool === "text") {
      const defaultText = "Editorial Paint Studio";
      const newText = {
        id: "text_" + Date.now(),
        type: "text",
        x: pos.x,
        y: pos.y,
        text: defaultText,
        strokeColor: primaryColor,
        font: textFont,
        fontSize: textSize,
        bold: textBold,
        italic: textItalic,
      };
      pushLayerUpdate((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, elements: [...l.elements, newText] }
            : l,
        ),
      );
      setSelectedElementId(newText.id);
      setActiveTool("select");
      showToast("Text created. Edit content in the context bar above.");
      return;
    }
  };

  const handlePointerMove = (e) => {
    const pos = getCanvasPointerPos(e);
    setCursorCoords({ x: Math.round(pos.x), y: Math.round(pos.y) });

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    const state = drawingStateRef.current;
    if (!state) return;

    if (state.mode === "draw_path") {
      state.currentPath.points.push(pos);
      drawingStateRef.current.activePreviewElement = state.currentPath;
      renderAllLayers();
    } else if (state.mode === "draw_shape") {
      state.shape.width = pos.x - state.startX;
      state.shape.height = pos.y - state.startY;
      drawingStateRef.current.activePreviewElement = state.shape;
      renderAllLayers();
    } else if (state.mode === "drag_element") {
      const dx = pos.x - state.startX;
      const dy = pos.y - state.startY;

      pushLayerUpdate((prev) =>
        prev.map((l) => {
          if (l.id !== activeLayerId) return l;
          return {
            ...l,
            elements: l.elements.map((el) => {
              if (el.id !== state.element.id) return el;
              if (el.type === "path") {
                const origPoints = state.element.points;
                return {
                  ...el,
                  points: origPoints.map((pt) => ({
                    x: pt.x + dx,
                    y: pt.y + dy,
                  })),
                };
              }
              return {
                ...el,
                x: state.origX + dx,
                y: state.origY + dy,
              };
            }),
          };
        }),
      );
    }
  };

  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    const state = drawingStateRef.current;
    if (!state) return;

    if (state.mode === "draw_path") {
      pushLayerUpdate((prev) =>
        prev.map((l) =>
          l.id === activeLayerId
            ? { ...l, elements: [...l.elements, state.currentPath] }
            : l,
        ),
      );
      setSelectedElementId(state.currentPath.id);
    } else if (state.mode === "draw_shape") {
      if (Math.abs(state.shape.width) > 2 || Math.abs(state.shape.height) > 2) {
        pushLayerUpdate((prev) =>
          prev.map((l) =>
            l.id === activeLayerId
              ? { ...l, elements: [...l.elements, state.shape] }
              : l,
          ),
        );
        setSelectedElementId(state.shape.id);
      }
    }

    drawingStateRef.current = null;
    renderAllLayers();
  };

  const handleExport = (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasWidth;
    exportCanvas.height = canvasHeight;
    const ctx = exportCanvas.getContext("2d");

    if (format === "jpeg") {
      ctx.fillStyle = bgColor || "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    layers.forEach((layer) => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      layer.elements.forEach((el) => drawElementToContext(ctx, el));
      ctx.restore();
    });

    const link = document.createElement("a");
    link.download = `paint-studio-export-${Date.now()}.${format}`;
    link.href = exportCanvas.toDataURL(`image/${format}`, 0.95);
    link.click();
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleShareUrl = () => {
    const encoded = encodeCanvasState({
      width: canvasWidth,
      height: canvasHeight,
      bgColor,
      layers,
    });
    if (!encoded) {
      showToast("Canvas state too large for URL encoding!");
      return;
    }
    const shareableUrl = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
    navigator.clipboard.writeText(shareableUrl);
    showToast("Shareable URL copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-background,#faf9f6)] text-[var(--color-foreground,#1c2624)] font-sans select-none overflow-hidden">
      {/* Hidden File Input for Direct Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[var(--color-primary,#0f6e5c)] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-teal-600 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="h-14 border-b border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] px-4 flex items-center justify-between z-20">
        {/* Quick Actions */}
        <div className="flex items-center space-x-2 bg-[var(--color-background,#faf9f6)] px-2 py-1 rounded-md border border-[var(--color-border,#dcd5c8)]">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30"
          >
            <Icons.Undo />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo (Ctrl+Y)"
            className="p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30"
          >
            <Icons.Redo />
          </button>

          <div className="h-4 w-px bg-[var(--color-border,#dcd5c8)]" />

          {/* Delete Artifact Button */}
          <button
            onClick={deleteSelectedElement}
            disabled={!selectedElementId}
            title="Delete Selected Artifact (Backspace/Delete)"
            className="p-1.5 hover:bg-red-100 text-red-600 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Icons.Trash />
            <span className="hidden sm:inline">Delete</span>
          </button>

          <div className="h-4 w-px bg-[var(--color-border,#dcd5c8)]" />

          <button
            onClick={() => setShowResizeModal(true)}
            title="Canvas Dimensions"
            className="text-xs font-mono px-2 py-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded flex items-center gap-1"
          >
            <span>
              {canvasWidth} x {canvasHeight}
            </span>
            <Icons.Settings />
          </button>
        </div>

        {/* Right Actions: Image Upload, Share & Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-xs font-medium text-[var(--color-foreground,#1c2624)] bg-transparent hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded-md border border-[var(--color-border,#dcd5c8)] flex items-center gap-1.5"
            title="Upload Local Image"
          >
            <Icons.Upload />
            <span className="hidden md:inline">Upload Image</span>
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 text-xs hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded-md border border-[var(--color-border,#dcd5c8)] flex items-center gap-1"
            title="Shortcuts"
          >
            <Icons.Help />
          </button>

          <button
            onClick={handleShareUrl}
            className="px-3 py-1.5 text-xs font-medium text-[var(--color-foreground,#1c2624)] bg-transparent hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded-md border border-[var(--color-border,#dcd5c8)] flex items-center gap-1.5"
          >
            <Icons.Share />
            <span className="hidden md:inline">Share URL</span>
          </button>

          <div className="relative group">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-primary,#0f6e5c)] hover:bg-[var(--color-primary-hover,#0b5645)] rounded-md flex items-center gap-1.5 shadow-sm">
              <Icons.Download />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full hidden group-hover:block bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-md shadow-lg py-1 w-36 z-30">
              <button
                onClick={() => handleExport("png")}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-hover,#e8e4d8)]"
              >
                PNG (Transparent)
              </button>
              <button
                onClick={() => handleExport("jpeg")}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-hover,#e8e4d8)]"
              >
                JPG (Solid Background)
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-10 border-b border-[var(--color-border,#dcd5c8)] bg-[var(--color-background,#faf9f6)] px-4 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center space-x-4 shrink-0">
          {/* Stroke Width Slider */}
          {(activeTool === "brush" ||
            activeTool === "pencil" ||
            activeTool === "eraser" ||
            activeTool === "shape") && (
            <div className="flex items-center space-x-2">
              <span className="text-[var(--color-foreground-muted,#576360)]">
                Size:
              </span>
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20 accent-[var(--color-primary,#0f6e5c)]"
              />
              <span className="font-mono w-4">{strokeWidth}</span>
            </div>
          )}

          {/* Opacity Slider */}
          {(activeTool === "brush" || activeTool === "pencil") && (
            <div className="flex items-center space-x-2">
              <span className="text-[var(--color-foreground-muted,#576360)]">
                Opacity:
              </span>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={brushOpacity}
                onChange={(e) => setBrushOpacity(Number(e.target.value))}
                className="w-20 accent-[var(--color-primary,#0f6e5c)]"
              />
              <span className="font-mono">
                {Math.round(brushOpacity * 100)}%
              </span>
            </div>
          )}

          {/* Line Cap */}
          {(activeTool === "brush" || activeTool === "pencil") && (
            <div className="flex items-center space-x-1">
              <span className="text-[var(--color-foreground-muted,#576360)]">
                Cap:
              </span>
              {["round", "butt", "square"].map((cap) => (
                <button
                  key={cap}
                  onClick={() => setLineCap(cap)}
                  className={`px-2 py-0.5 rounded capitalize ${lineCap === cap ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "hover:bg-[var(--color-surface,#f0eee7)]"}`}
                >
                  {cap}
                </button>
              ))}
            </div>
          )}

          {/* Shape Selector & Fill Toggle */}
          {activeTool === "shape" && (
            <>
              <div className="flex items-center space-x-1 border-r border-[var(--color-border,#dcd5c8)] pr-3">
                {[
                  "rectangle",
                  "rounded-rect",
                  "circle",
                  "line",
                  "arrow",
                  "star",
                ].map((shape) => (
                  <button
                    key={shape}
                    onClick={() => setActiveShape(shape)}
                    className={`px-2 py-0.5 rounded capitalize ${activeShape === shape ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "hover:bg-[var(--color-surface,#f0eee7)]"}`}
                  >
                    {shape.replace("-", " ")}
                  </button>
                ))}
              </div>

              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fillEnabled}
                  onChange={(e) => setFillEnabled(e.target.checked)}
                  className="accent-[var(--color-primary,#0f6e5c)]"
                />
                <span>Fill Shape</span>
              </label>

              {fillEnabled && (
                <div className="flex items-center space-x-1">
                  <span>Fill Color:</span>
                  <input
                    type="color"
                    value={fillColor}
                    onChange={(e) => setFillColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-0"
                  />
                </div>
              )}
            </>
          )}

          {/* Real-time Text Inspector & Editing Bar */}
          {(selectedElement && selectedElement.type === "text") ||
          activeTool === "text" ? (
            <div className="flex items-center space-x-3 bg-amber-50/60 p-1 px-2.5 rounded border border-amber-200">
              <span className="font-semibold text-amber-900">
                Text Inspector:
              </span>

              {selectedElement && selectedElement.type === "text" && (
                <input
                  type="text"
                  value={editingTextValue}
                  onChange={(e) => {
                    setEditingTextValue(e.target.value);
                    updateSelectedTextElement("text", e.target.value);
                  }}
                  placeholder="Type text content..."
                  className="px-2 py-0.5 border border-amber-300 rounded bg-white font-sans text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#0f6e5c)]"
                />
              )}

              <select
                value={
                  selectedElement && selectedElement.type === "text"
                    ? selectedElement.font
                    : textFont
                }
                onChange={(e) => {
                  setTextFont(e.target.value);
                  updateSelectedTextElement("font", e.target.value);
                }}
                className="bg-white border border-amber-300 rounded px-2 py-0.5 text-xs focus:outline-none"
              >
                {FONTS.map((f) => (
                  <option key={f.id} value={f.family}>
                    {f.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center space-x-1">
                <span>Size:</span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={
                    selectedElement && selectedElement.type === "text"
                      ? selectedElement.fontSize
                      : textSize
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTextSize(val);
                    updateSelectedTextElement("fontSize", val);
                  }}
                  className="w-14 bg-white border border-amber-300 rounded px-1 py-0.5 text-xs font-mono"
                />
              </div>

              <button
                onClick={() => {
                  const nextVal =
                    selectedElement && selectedElement.type === "text"
                      ? !selectedElement.bold
                      : !textBold;
                  setTextBold(nextVal);
                  updateSelectedTextElement("bold", nextVal);
                }}
                className={`px-2 py-0.5 rounded font-bold ${(selectedElement && selectedElement.bold) || textBold ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "bg-white border border-amber-300 hover:bg-amber-100"}`}
              >
                B
              </button>

              <button
                onClick={() => {
                  const nextVal =
                    selectedElement && selectedElement.type === "text"
                      ? !selectedElement.italic
                      : !textItalic;
                  setTextItalic(nextVal);
                  updateSelectedTextElement("italic", nextVal);
                }}
                className={`px-2 py-0.5 rounded italic ${(selectedElement && selectedElement.italic) || textItalic ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "bg-white border border-amber-300 hover:bg-amber-100"}`}
              >
                I
              </button>

              <div className="flex items-center space-x-1">
                <span className="px-2">Color:</span>
                <input
                  type="color"
                  value={
                    selectedElement && selectedElement.type === "text"
                      ? selectedElement.strokeColor
                      : primaryColor
                  }
                  onChange={(e) => {
                    setPrimaryColor(e.target.value);
                    updateSelectedTextElement("strokeColor", e.target.value);
                  }}
                  className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Palette Bar */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[var(--color-foreground-muted,#576360)] mr-1 px-2">
            Color:
          </span>
          {COLOR_PALETTES[0].colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setPrimaryColor(c);
                if (selectedElement && selectedElement.type === "text") {
                  updateSelectedTextElement("strokeColor", c);
                }
              }}
              className={`w-5 h-5 rounded-full border border-black/20 ${primaryColor === c ? "ring-2 ring-[var(--color-primary,#0f6e5c)] scale-110" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}

          <input
            type="color"
            value={primaryColor}
            onChange={(e) => {
              setPrimaryColor(e.target.value);
              if (selectedElement && selectedElement.type === "text") {
                updateSelectedTextElement("strokeColor", e.target.value);
              }
            }}
            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            title="Custom Hex Picker"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {}
        <div className="w-12 border-r border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] flex flex-col items-center py-3 space-y-2 z-10 shrink-0">
          {[
            {
              id: "select",
              icon: Icons.Select,
              label: "Select & Move Artifacts (V)",
            },
            { id: "brush", icon: Icons.Brush, label: "Freehand Brush (B)" },
            { id: "pencil", icon: Icons.Pencil, label: "Pencil (P)" },
            { id: "eraser", icon: Icons.Eraser, label: "Eraser (E)" },
            { id: "shape", icon: Icons.Shapes, label: "Shapes (S)" },
            {
              id: "text",
              icon: Icons.Text,
              label: "Text Tool & Real-Time Inspector (T)",
            },
            {
              id: "eyedropper",
              icon: Icons.Eyedropper,
              label: "Eyedropper Color Picker (I)",
            },
            { id: "pan", icon: Icons.Pan, label: "Pan Canvas Viewport (H)" },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`p-2 rounded-lg transition-colors relative group ${activeTool === tool.id ? "bg-[var(--color-primary,#0f6e5c)] text-white shadow-sm" : "hover:bg-[var(--color-surface-hover,#e8e4d8)] text-[var(--color-foreground,#1c2624)]"}`}
              title={tool.label}
            >
              <tool.icon />
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-30">
                {tool.label}
              </div>
            </button>
          ))}
        </div>

        {}
        <div
          ref={containerRef}
          className="flex-1 bg-[#e8e4d8] dark:bg-[#121817] relative overflow-hidden flex items-center justify-center cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Transform Container for Zoom & Pan */}
          <div
            className="transition-transform duration-75 shadow-2xl relative"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="block bg-white rounded-sm shadow-md"
              style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
            />
          </div>

          {/* Floating Zoom Controls Bar */}
          <div className="absolute bottom-4 left-4 bg-[var(--color-surface,#f0eee7)]/90 backdrop-blur border border-[var(--color-border,#dcd5c8)] rounded-lg p-1.5 flex items-center space-x-2 shadow-md z-20 text-xs">
            <button
              onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
              className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"
            >
              <Icons.ZoomOut />
            </button>
            <span className="font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
              className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"
            >
              <Icons.ZoomIn />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="px-2 py-0.5 text-[10px] bg-[var(--color-background,#faf9f6)] hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded border"
            >
              Reset View
            </button>
          </div>
        </div>

        {}
        <div
          className={`${isLayersOpen ? "w-64" : "w-10"} border-l border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] transition-all duration-200 flex flex-col z-10 shrink-0`}
        >
          <div className="h-10 border-b border-[var(--color-border,#dcd5c8)] px-3 flex items-center justify-between">
            {isLayersOpen && (
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <Icons.Layers />
                <span>Layers ({layers.length})</span>
              </div>
            )}
            <button
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded ml-auto"
            >
              {isLayersOpen ? <Icons.ChevronUp /> : <Icons.Layers />}
            </button>
          </div>

          {isLayersOpen && (
            <div className="flex-1 flex flex-col justify-between p-3 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--color-border,#dcd5c8)] pb-2">
                <button
                  onClick={addLayer}
                  className="px-2 py-1 bg-[var(--color-primary,#0f6e5c)] text-white text-xs rounded hover:bg-[var(--color-primary-hover,#0b5645)] flex items-center gap-1 shadow-sm"
                >
                  <Icons.Plus />
                  <span>New Layer</span>
                </button>
                <div className="flex space-x-1">
                  <button
                    onClick={() => moveLayer(activeLayerId, "up")}
                    title="Move Up"
                    className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"
                  >
                    <Icons.ChevronUp />
                  </button>
                  <button
                    onClick={() => moveLayer(activeLayerId, "down")}
                    title="Move Down"
                    className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"
                  >
                    <Icons.ChevronDown />
                  </button>
                </div>
              </div>

              {/* Layer Items */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {layers
                  .slice()
                  .reverse()
                  .map((layer) => {
                    const isActive = layer.id === activeLayerId;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => setActiveLayerId(layer.id)}
                        className={`p-2.5 rounded-lg border text-xs flex flex-col space-y-2 cursor-pointer transition-colors ${isActive ? "bg-[var(--color-background,#faf9f6)] border-[var(--color-primary,#0f6e5c)] shadow-sm" : "border-[var(--color-border,#dcd5c8)] hover:bg-[var(--color-surface-hover,#e8e4d8)]"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold truncate w-28">
                            {layer.name}
                          </span>
                          <div
                            className="flex items-center space-x-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() =>
                                pushLayerUpdate((prev) =>
                                  prev.map((l) =>
                                    l.id === layer.id
                                      ? { ...l, visible: !l.visible }
                                      : l,
                                  ),
                                )
                              }
                              className="p-1 text-[var(--color-foreground-muted,#576360)] hover:text-black"
                            >
                              {layer.visible ? <Icons.Eye /> : <Icons.EyeOff />}
                            </button>
                            <button
                              onClick={() =>
                                pushLayerUpdate((prev) =>
                                  prev.map((l) =>
                                    l.id === layer.id
                                      ? { ...l, locked: !l.locked }
                                      : l,
                                  ),
                                )
                              }
                              className="p-1 text-[var(--color-foreground-muted,#576360)] hover:text-black"
                            >
                              {layer.locked ? <Icons.Lock /> : <Icons.Unlock />}
                            </button>
                            <button
                              onClick={() => deleteLayer(layer.id)}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        </div>

                        {isActive && (
                          <div
                            className="flex items-center space-x-2 pt-1 border-t border-[var(--color-border,#dcd5c8)]/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-[10px] text-[var(--color-foreground-muted,#576360)]">
                              Opacity
                            </span>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={layer.opacity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                pushLayerUpdate((prev) =>
                                  prev.map((l) =>
                                    l.id === layer.id
                                      ? { ...l, opacity: val }
                                      : l,
                                  ),
                                );
                              }}
                              className="w-24 accent-[var(--color-primary,#0f6e5c)]"
                            />
                            <span className="text-[10px] font-mono">
                              {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <button
                onClick={() => mergeDownLayer(activeLayerId)}
                className="w-full py-1.5 text-xs border border-[var(--color-border,#dcd5c8)] rounded hover:bg-[var(--color-surface-hover,#e8e4d8)]"
              >
                Merge Down
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] px-4 flex items-center justify-between text-[11px] text-[var(--color-foreground-muted,#576360)] font-mono z-20">
        <div>
          X: {cursorCoords.x}px Y: {cursorCoords.y}px
        </div>
        <div>
          Selected:{" "}
          {selectedElement
            ? `${selectedElement.type.toUpperCase()} (${selectedElement.id})`
            : "None"}
        </div>
        <div>Zoom: {Math.round(zoom * 100)}%</div>
      </footer>

      {/* Modal: Image Upload / Paste Options */}
      {showImageModal && pendingImage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold font-display">
              Image Placed on Canvas
            </h2>
            <p className="text-xs text-[var(--color-foreground-muted,#576360)]">
              An image ({pendingImage.width}x{pendingImage.height}px) was added.
              Choose positioning and sizing:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleImageOption("resize_canvas")}
                className="w-full py-2 px-3 text-left border rounded-lg hover:bg-[var(--color-surface-hover,#e8e4d8)] text-xs font-medium"
              >
                Resize Canvas to Fit Image ({pendingImage.width}x
                {pendingImage.height})
              </button>
              <button
                onClick={() => handleImageOption("scale_fit")}
                className="w-full py-2 px-3 text-left border rounded-lg hover:bg-[var(--color-surface-hover,#e8e4d8)] text-xs font-medium"
              >
                Scale Image to Fit Canvas ({canvasWidth}x{canvasHeight})
              </button>
              <button
                onClick={() => handleImageOption("original")}
                className="w-full py-2 px-3 text-left border rounded-lg hover:bg-[var(--color-surface-hover,#e8e4d8)] text-xs font-medium"
              >
                Place as Movable Layer Element
              </button>
            </div>

            <button
              onClick={() => setShowImageModal(false)}
              className="w-full py-1.5 text-xs text-center hover:underline text-[var(--color-foreground-muted,#576360)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modal: Canvas Settings */}
      {showResizeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-xl max-w-xs w-full p-5 shadow-2xl space-y-4">
            <h2 className="text-sm font-bold font-display">Canvas Settings</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[var(--color-foreground-muted,#576360)] mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={canvasWidth}
                  onChange={(e) => setCanvasWidth(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-[var(--color-background,#faf9f6)] font-mono"
                />
              </div>
              <div>
                <label className="block text-[var(--color-foreground-muted,#576360)] mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  value={canvasHeight}
                  onChange={(e) => setCanvasHeight(Number(e.target.value))}
                  className="w-full p-2 border rounded bg-[var(--color-background,#faf9f6)] font-mono"
                />
              </div>
              <div>
                <label className="block text-[var(--color-foreground-muted,#576360)] mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-8 rounded border cursor-pointer bg-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setShowResizeModal(false)}
              className="w-full py-2 bg-[var(--color-primary,#0f6e5c)] text-white text-xs rounded font-medium hover:bg-[var(--color-primary-hover,#0b5645)]"
            >
              Apply Settings
            </button>
          </div>
        </div>
      )}

      {/* Modal: Keyboard Shortcuts Legend */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h2 className="text-sm font-bold font-display">
              Keyboard Shortcuts
            </h2>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>V</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Select Tool
                </span>
              </div>
              <div className="flex justify-between">
                <span>B</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Brush Tool
                </span>
              </div>
              <div className="flex justify-between">
                <span>E</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Eraser
                </span>
              </div>
              <div className="flex justify-between">
                <span>T</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Text Tool
                </span>
              </div>
              <div className="flex justify-between">
                <span>Del / Backspace</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Delete Selected Artifact
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ctrl + V</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Paste Clipboard Image
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ctrl + Z / Y</span>
                <span className="text-[var(--color-foreground-muted,#576360)]">
                  Undo / Redo
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 bg-[var(--color-primary,#0f6e5c)] text-white text-xs rounded font-medium"
            >
              Close Shortcuts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
