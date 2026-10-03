import { useState, useEffect, useRef, useCallback } from "react";

import Icons from './paint/icons';
import {
  EYEDROPPER_CURSOR,
  COLOR_PALETTES,
  FONTS,
  HANDLE_PAD,
  DEFAULTS,
} from './paint/constants';
import {
  encodeCanvasState,
  getElementBounds,
  getSelectionHandles,
  computeResizedElement,
  boxesOverlap,
} from './paint/utils';
import {
  drawElementToContext,
  drawSingleSelection,
  drawMultiSelection,
  drawMarquee,
} from './paint/rendering';
import { useHistory } from './paint/hooks/useHistory';
import { useAutosave, hydrateFromStorage } from './paint/hooks/useAutosave';
import { useKeyboardShortcuts } from './paint/hooks/useKeyboardShortcuts';
import { useLayers } from './paint/hooks/useLayers';
import { ImageModal, ResizeModal, ShortcutsModal } from './paint/components/Modals';

export default function PaintStudio() {
  // ─── Canvas dimensions & viewport ─────────────────────────────────────────
  const [canvasWidth, setCanvasWidth] = useState(DEFAULTS.canvasWidth);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULTS.canvasHeight);
  const [bgColor, setBgColor] = useState(DEFAULTS.bgColor);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // ─── Tools & drawing properties ───────────────────────────────────────────
  const [activeTool, setActiveTool] = useState("brush");
  const [activeShape, setActiveShape] = useState("rectangle");
  const [primaryColor, setPrimaryColor] = useState(DEFAULTS.primaryColor);
  const [fillColor, setFillColor] = useState(DEFAULTS.fillColor);
  const [fillEnabled, setFillEnabled] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULTS.strokeWidth);
  const [brushOpacity, setBrushOpacity] = useState(DEFAULTS.brushOpacity);
  const [lineCap, setLineCap] = useState<"round" | "butt" | "square">(DEFAULTS.lineCap);

  // ─── Text properties ───────────────────────────────────────────────────────
  const [textFont, setTextFont] = useState(DEFAULTS.font);
  const [textSize, setTextSize] = useState(DEFAULTS.fontSize);
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [editingTextValue, setEditingTextValue] = useState("");

  // ─── UI modals & notifications ─────────────────────────────────────────────
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [showResizeModal, setShowResizeModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [cursorCoords, setCursorCoords] = useState({ x: 0, y: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const containerRef = useRef(null);
  const exportMenuRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const drawingStateRef = useRef(null);
  const layerCanvasesRef = useRef({});

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), DEFAULTS.toastDuration);
  }, []);

  // ─── Hooks ─────────────────────────────────────────────────────────────────
  const history = useHistory();

  const layersAPI = useLayers({
    history,
    onLayerDeleted: (id) => { delete layerCanvasesRef.current[id]; },
  });

  const {
    layers, activeLayerId, selectedElementId, multiSelectIds,
    isMultiSelect, hasSelection,
    selectedElement, selectedElementLayer, selectedElementZIndex,
    multiSelectedElements,
    setActiveLayerId, addLayer, deleteLayer, moveLayer, mergeDownLayer,
    pushLayerUpdate, selectSingleElement, clearSelection,
    deleteElement, deleteSelectedElement, updateElementProps,
    duplicateElement, duplicateSelectedElement,
    reorderElementZ, nudgeElements, getElementLabel,
    setLayers, setActiveLayerIdRaw, setMultiSelectIds, setSelectedElementId,
  } = layersAPI;

  // ─── Autosave ──────────────────────────────────────────────────────────────
  useAutosave({ layers, canvasWidth, canvasHeight, bgColor, isHydrated }, showToast);

  // ─── Close export menu on outside click ───────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // ─── Initial hydration ────────────────────────────────────────────────────
  useEffect(() => {
    const { result, message } = hydrateFromStorage();
    if (result) {
      setCanvasWidth(result.canvasWidth);
      setCanvasHeight(result.canvasHeight);
      setBgColor(result.bgColor);
      setLayers(result.layers);
      setActiveLayerIdRaw(result.layers[0]?.id || "layer_1");
      history.initHistory(result.layers);
      if (message) showToast(message);
    } else {
      history.initHistory(layers);
    }
    setIsHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync text properties when selection changes ───────────────────────────
  useEffect(() => {
    if (selectedElement && selectedElement.type === "text") {
      setEditingTextValue(selectedElement.text || "");
      if (selectedElement.font) setTextFont(selectedElement.font);
      if (selectedElement.fontSize) setTextSize(selectedElement.fontSize);
      if (selectedElement.bold !== undefined) setTextBold(selectedElement.bold);
      if (selectedElement.italic !== undefined) setTextItalic(selectedElement.italic);
      if (selectedElement.strokeColor) setPrimaryColor(selectedElement.strokeColor);
    }
  }, [selectedElementId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Cursor helpers ────────────────────────────────────────────────────────
  const getBrushCursor = (size: number, z: number) => {
    const scaledDiameter = Math.max(4, Math.min(size * z, 128));
    const radius = scaledDiameter / 2;
    const padding = 2;
    const svgSize = scaledDiameter + padding * 2;
    const center = svgSize / 2;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="2" />
    <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1" />
  </svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${center} ${center}, crosshair`;
  };

  const getCursorStyle = () => {
    if (isPanning) return "grabbing";
    switch (activeTool) {
      case "pan": return "grab";
      case "select": return "default";
      case "text": return "text";
      case "eyedropper": return EYEDROPPER_CURSOR;
      case "brush":
      case "pencil":
      case "eraser": return getBrushCursor(strokeWidth, zoom);
      case "shape": return "crosshair";
      default: return "default";
    }
  };

  // ─── Undo / redo wired to history hook ────────────────────────────────────
  const handleUndo = useCallback(() => {
    const restored = history.handleUndo();
    if (restored) { setLayers(restored); showToast("Undo action"); }
  }, [history, setLayers, showToast]);

  const handleRedo = useCallback(() => {
    const restored = history.handleRedo();
    if (restored) { setLayers(restored); showToast("Redo action"); }
  }, [history, setLayers, showToast]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useKeyboardShortcuts({
    setActiveTool: (tool) => setActiveTool(tool),
    deleteSelectedElement: () => deleteSelectedElement(showToast),
    duplicateSelectedElement: () => duplicateSelectedElement(showToast),
    handleUndo,
    handleRedo,
    reorderElementZ,
    nudgeElements,
    clearSelection,
    selectedElementId,
    multiSelectIds,
    isMultiSelect,
  });

  // ─── Off-screen layer canvas manager ─────────────────────────────────────
  const getLayerCanvas = useCallback(
    (layerId: string) => {
      let layerCanvas = layerCanvasesRef.current[layerId];
      if (!layerCanvas) {
        layerCanvas = document.createElement("canvas");
        layerCanvasesRef.current[layerId] = layerCanvas;
      }
      if (layerCanvas.width !== canvasWidth || layerCanvas.height !== canvasHeight) {
        layerCanvas.width = canvasWidth;
        layerCanvas.height = canvasHeight;
      }
      return layerCanvas;
    },
    [canvasWidth, canvasHeight],
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  const renderAllLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const preview = drawingStateRef.current?.activePreviewElement;
    const overrides = drawingStateRef.current?.previewOverrides;

    layers.forEach((layer) => {
      if (!layer.visible) return;
      const layerCanvas = getLayerCanvas(layer.id);
      const layerCtx = layerCanvas.getContext("2d");
      layerCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      layer.elements.forEach((el) => {
        const override = overrides && overrides[el.id];
        drawElementToContext(layerCtx, override || el, renderAllLayers);
      });

      if (preview && layer.id === activeLayerId) {
        drawElementToContext(layerCtx, preview, renderAllLayers);
      }

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layerCanvas, 0, 0);
      ctx.restore();
    });

    // Multi-selection boxes
    if (multiSelectedElements.length > 1) {
      drawMultiSelection(ctx, multiSelectedElements);
    }

    // Marquee
    const marquee = drawingStateRef.current?.marqueeRect;
    if (marquee) drawMarquee(ctx, marquee);

    // Single selection handles
    if (selectedElement && !isMultiSelect) {
      drawSingleSelection(ctx, selectedElement);
    }
  }, [
    layers, canvasWidth, canvasHeight, bgColor,
    selectedElement, isMultiSelect, multiSelectedElements,
    activeLayerId, getLayerCanvas,
  ]);

  useEffect(() => { renderAllLayers(); }, [renderAllLayers]);

  // ─── Text element live-update ─────────────────────────────────────────────
  const updateSelectedTextElement = (key: string, value: unknown) => {
    if (!selectedElement || selectedElement.type !== "text") return;
    pushLayerUpdate((prev) =>
      prev.map((layer) => ({
        ...layer,
        elements: layer.elements.map((el) =>
          el.id !== selectedElement.id ? el : { ...el, [key]: value },
        ),
      })),
    );
  };

  // ─── Canvas pointer helpers ────────────────────────────────────────────────
  const getCanvasPointerPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  // ─── Pointer event handlers ───────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    if (e.target && (e.target as HTMLElement).setPointerCapture) {
      try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    }

    if (activeTool === "pan" || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const pos = getCanvasPointerPos(e);
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked || !activeLayer.visible) {
      showToast("Current layer is locked or hidden!");
      return;
    }

    if (activeTool === "eyedropper") { handlePickColor(e); return; }

    if (activeTool === "select") {
      if (selectedElement && !selectedElement.locked) {
        const bounds = getElementBounds(selectedElement, canvasRef.current?.getContext("2d"));
        const { corners, rotate } = getSelectionHandles(bounds);
        const hitRadius = 10 / zoom;
        const distTo = (pt) => Math.hypot(pos.x - pt.x, pos.y - pt.y);

        if (distTo(rotate) <= hitRadius) {
          const cx = bounds.x + bounds.w / 2;
          const cy = bounds.y + bounds.h / 2;
          drawingStateRef.current = {
            mode: "rotate_element",
            element: selectedElement,
            center: { x: cx, y: cy },
            startAngle: Math.atan2(pos.y - cy, pos.x - cx),
            origRotation: selectedElement.rotation || 0,
          };
          return;
        }

        const cornerHit = corners.find((c) => distTo(c) <= hitRadius);
        if (cornerHit) {
          const anchorByCorner = {
            tl: { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
            tr: { x: bounds.x, y: bounds.y + bounds.h },
            br: { x: bounds.x, y: bounds.y },
            bl: { x: bounds.x + bounds.w, y: bounds.y },
          };
          drawingStateRef.current = {
            mode: "resize_element",
            element: selectedElement,
            origBounds: bounds,
            anchor: anchorByCorner[cornerHit.corner],
          };
          return;
        }
      }

      // Hit-test elements in active layer (top-down)
      let found = null;
      for (let i = activeLayer.elements.length - 1; i >= 0; i--) {
        const el = activeLayer.elements[i];
        if (el.locked || el.visible === false) continue;
        if (el.type === "shape" || el.type === "image") {
          const minX = Math.min(el.x, el.x + el.width);
          const maxX = Math.max(el.x, el.x + el.width);
          const minY = Math.min(el.y, el.y + el.height);
          const maxY = Math.max(el.y, el.y + el.height);
          if (pos.x >= minX - 5 && pos.x <= maxX + 5 && pos.y >= minY - 5 && pos.y <= maxY + 5) { found = el; break; }
        } else if (el.type === "text") {
          const canvas = canvasRef.current;
          const ctx = canvas ? canvas.getContext("2d") : null;
          let w = 100;
          if (ctx) {
            ctx.font = `${el.italic ? "italic " : ""}${el.bold ? "bold " : ""}${el.fontSize || 28}px ${el.font || "Inter, sans-serif"}`;
            w = ctx.measureText(el.text || "").width;
          }
          const h = (el.fontSize || 28) * 1.2;
          if (pos.x >= el.x - 5 && pos.x <= el.x + w + 5 && pos.y >= el.y - 5 && pos.y <= el.y + h + 5) { found = el; break; }
        } else if (el.type === "path") {
          const xs = el.points.map((p) => p.x);
          const ys = el.points.map((p) => p.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          if (pos.x >= minX - 10 && pos.x <= maxX + 10 && pos.y >= minY - 10 && pos.y <= maxY + 10) { found = el; break; }
        }
      }

      const isShiftClick = e.shiftKey;
      if (found) {
        if (isShiftClick) {
          const base = isMultiSelect ? multiSelectIds : selectedElementId ? [selectedElementId] : [];
          const next = base.includes(found.id) ? base.filter((id) => id !== found.id) : [...base, found.id];
          if (next.length > 1) { setMultiSelectIds(next); setSelectedElementId(null); }
          else { setMultiSelectIds([]); setSelectedElementId(next[0] || null); }
          renderAllLayers(); return;
        }
        if (isMultiSelect && multiSelectIds.includes(found.id)) {
          const originals = {};
          multiSelectIds.forEach((id) => {
            const el = activeLayer.elements.find((e) => e.id === id);
            if (el) originals[id] = el;
          });
          drawingStateRef.current = { mode: "drag_group", startX: pos.x, startY: pos.y, originals };
          return;
        }
        selectSingleElement(found.id);
        drawingStateRef.current = { mode: "drag_element", element: found, startX: pos.x, startY: pos.y, origX: found.x, origY: found.y };
        renderAllLayers(); return;
      }

      drawingStateRef.current = {
        mode: "marquee_select", startX: pos.x, startY: pos.y,
        additive: isShiftClick,
        baseSelection: isShiftClick ? (isMultiSelect ? multiSelectIds : selectedElementId ? [selectedElementId] : []) : [],
      };
      renderAllLayers(); return;
    }

    if (activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser") {
      const newPath = {
        id: "path_" + Date.now(), type: "path", strokeType: activeTool,
        points: [pos],
        strokeColor: activeTool === "eraser" ? "#ffffff" : primaryColor,
        strokeWidth: activeTool === "pencil" ? Math.min(2, strokeWidth) : strokeWidth,
        opacity: brushOpacity, lineCap, visible: true, locked: false, rotation: 0,
      };
      drawingStateRef.current = { mode: "draw_path", currentPath: newPath };
      return;
    }

    if (activeTool === "shape") {
      const newShape = {
        id: "shape_" + Date.now(), type: "shape", shapeType: activeShape,
        x: pos.x, y: pos.y, width: 0, height: 0,
        strokeColor: primaryColor, strokeWidth, fillColor, fillEnabled,
        rotation: 0, visible: true, locked: false,
      };
      drawingStateRef.current = { mode: "draw_shape", startX: pos.x, startY: pos.y, shape: newShape };
      return;
    }

    if (activeTool === "text") {
      const newText = {
        id: "text_" + Date.now(), type: "text",
        x: pos.x, y: pos.y, text: "<enter text>",
        strokeColor: primaryColor, font: textFont, fontSize: textSize,
        bold: textBold, italic: textItalic, visible: true, locked: false, rotation: 0,
      };
      pushLayerUpdate((prev) =>
        prev.map((l) => l.id === activeLayerId ? { ...l, elements: [...l.elements, newText] } : l),
      );
      selectSingleElement(newText.id);
      setActiveTool("select");
      showToast("Text created. Edit content in the context bar above.");
      return;
    }
  };

  const handlePointerMove = (e) => {
    if (e.cancelable) e.preventDefault();
    const pos = getCanvasPointerPos(e);
    setCursorCoords({ x: Math.round(pos.x), y: Math.round(pos.y) });

    if (isPanning) {
      setPanOffset({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
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
      const dx = pos.x - state.startX, dy = pos.y - state.startY;
      if (state.element.type === "path") {
        state.draggedElement = { ...state.element, points: state.element.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) };
      } else {
        state.draggedElement = { ...state.element, x: state.origX + dx, y: state.origY + dy };
      }
      state.previewOverrides = { [state.element.id]: state.draggedElement };
      renderAllLayers();
    } else if (state.mode === "resize_element") {
      const anchor = state.anchor;
      const minSize = DEFAULTS.minResizeSize;
      const newBounds = {
        x: Math.min(anchor.x, pos.x), y: Math.min(anchor.y, pos.y),
        w: Math.max(minSize, Math.abs(pos.x - anchor.x)), h: Math.max(minSize, Math.abs(pos.y - anchor.y)),
      };
      state.draggedElement = computeResizedElement(state.element, state.origBounds, newBounds);
      state.previewOverrides = { [state.element.id]: state.draggedElement };
      renderAllLayers();
    } else if (state.mode === "rotate_element") {
      const currentAngle = Math.atan2(pos.y - state.center.y, pos.x - state.center.x);
      let newRotation = state.origRotation + ((currentAngle - state.startAngle) * 180) / Math.PI;
      if (e.shiftKey) newRotation = Math.round(newRotation / DEFAULTS.rotationSnap) * DEFAULTS.rotationSnap;
      state.draggedElement = { ...state.element, rotation: newRotation };
      state.previewOverrides = { [state.element.id]: state.draggedElement };
      renderAllLayers();
    } else if (state.mode === "drag_group") {
      const dx = pos.x - state.startX, dy = pos.y - state.startY;
      const overrides = {};
      Object.entries(state.originals).forEach(([id, el]: [string, any]) => {
        overrides[id] = el.type === "path"
          ? { ...el, points: el.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })) }
          : { ...el, x: (el.x || 0) + dx, y: (el.y || 0) + dy };
      });
      state.previewOverrides = overrides;
      renderAllLayers();
    } else if (state.mode === "marquee_select") {
      state.marqueeRect = {
        x: Math.min(state.startX, pos.x), y: Math.min(state.startY, pos.y),
        w: Math.abs(pos.x - state.startX), h: Math.abs(pos.y - state.startY),
      };
      renderAllLayers();
    }
  };

  const handlePointerUp = (e) => {
    if (e?.target?.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch {}
    }
    if (isPanning) { setIsPanning(false); return; }

    const state = drawingStateRef.current;
    if (!state) return;

    if (state.mode === "draw_path") {
      pushLayerUpdate((prev) =>
        prev.map((l) => l.id === activeLayerId ? { ...l, elements: [...l.elements, state.currentPath] } : l),
      );
      selectSingleElement(state.currentPath.id);
    } else if (state.mode === "draw_shape") {
      if (Math.abs(state.shape.width) > DEFAULTS.minShapeSize || Math.abs(state.shape.height) > DEFAULTS.minShapeSize) {
        pushLayerUpdate((prev) =>
          prev.map((l) => l.id === activeLayerId ? { ...l, elements: [...l.elements, state.shape] } : l),
        );
        selectSingleElement(state.shape.id);
      }
    } else if (state.mode === "drag_element" && state.draggedElement) {
      const updatedEl = state.draggedElement;
      pushLayerUpdate((prev) =>
        prev.map((l) => l.id !== activeLayerId ? l : {
          ...l,
          elements: l.elements.map((el) => el.id === updatedEl.id ? updatedEl : el),
        }),
      );
    } else if ((state.mode === "resize_element" || state.mode === "rotate_element") && state.draggedElement) {
      updateElementProps(state.draggedElement.id, state.draggedElement);
    } else if (state.mode === "drag_group" && state.previewOverrides) {
      const overrides = state.previewOverrides;
      pushLayerUpdate((prev) =>
        prev.map((l) => l.id !== activeLayerId ? l : {
          ...l,
          elements: l.elements.map((el) => overrides[el.id] || el),
        }),
      );
    } else if (state.mode === "marquee_select") {
      const rect = state.marqueeRect;
      const movedEnough = rect && (rect.w > 3 || rect.h > 3);
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (!movedEnough) {
        if (!state.additive) { setSelectedElementId(null); setMultiSelectIds([]); }
      } else if (activeLayer) {
        const ctx0 = canvasRef.current?.getContext("2d");
        const hitIds = activeLayer.elements
          .filter((el) => {
            if (el.locked || el.visible === false) return false;
            const b = getElementBounds(el, ctx0);
            return boxesOverlap(rect, { x: b.x - HANDLE_PAD, y: b.y - HANDLE_PAD, w: b.w + HANDLE_PAD * 2, h: b.h + HANDLE_PAD * 2 });
          })
          .map((el) => el.id);
        const combined = state.additive ? Array.from(new Set([...state.baseSelection, ...hitIds])) : hitIds;
        if (combined.length > 1) { setMultiSelectIds(combined); setSelectedElementId(null); }
        else { setMultiSelectIds([]); setSelectedElementId(combined[0] || null); }
      }
    }

    drawingStateRef.current = null;
    renderAllLayers();
  };

  // ─── Image handling ───────────────────────────────────────────────────────
  const processImageFile = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPendingImage({ src: event.target.result, width: img.naturalWidth, height: img.naturalHeight });
        setShowImageModal(true);
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) processImageFile(file);
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
    e.target.value = "";
  };

  const handleImageOption = (option: "resize_canvas" | "scale_fit" | "original") => {
    if (!pendingImage) return;
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked) { showToast("Selected layer is locked!"); setShowImageModal(false); return; }

    let newImgElement: any;
    if (option === "resize_canvas") {
      setCanvasWidth(pendingImage.width); setCanvasHeight(pendingImage.height);
      newImgElement = { id: "img_" + Date.now(), type: "image", x: 0, y: 0, width: pendingImage.width, height: pendingImage.height, src: pendingImage.src, rotation: 0, visible: true, locked: false };
      showToast("Canvas resized to match image dimensions");
    } else if (option === "scale_fit") {
      const scale = Math.min(canvasWidth / pendingImage.width, canvasHeight / pendingImage.height);
      const w = pendingImage.width * scale, h = pendingImage.height * scale;
      const x = (canvasWidth - w) / 2, y = (canvasHeight - h) / 2;
      newImgElement = { id: "img_" + Date.now(), type: "image", x, y, width: w, height: h, src: pendingImage.src, rotation: 0, visible: true, locked: false };
      showToast("Image scaled to fit canvas");
    } else {
      const x = Math.max(0, (canvasWidth - pendingImage.width) / 2);
      const y = Math.max(0, (canvasHeight - pendingImage.height) / 2);
      newImgElement = { id: "img_" + Date.now(), type: "image", x, y, width: pendingImage.width, height: pendingImage.height, src: pendingImage.src, rotation: 0, visible: true, locked: false };
      showToast("Image added as canvas element");
    }

    pushLayerUpdate((prev) => prev.map((l) => l.id === activeLayerId ? { ...l, elements: [...l.elements, newImgElement] } : l));
    selectSingleElement(newImgElement.id);
    setPendingImage(null); setShowImageModal(false);
  };

  const handlePickColor = async (e) => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        setPrimaryColor(result.sRGBHex);
        showToast(`Picked color: ${result.sRGBHex}`);
        setActiveTool("brush");
      } catch {}
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left) / zoom);
      const y = Math.round((e.clientY - rect.top) / zoom);
      const ctx = canvas.getContext("2d");
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      setPrimaryColor(hex);
      showToast(`Sampled color: ${hex}`);
      setActiveTool("brush");
    }
  };

  // ─── Export & share ───────────────────────────────────────────────────────
  const handleExport = (format: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvasWidth; exportCanvas.height = canvasHeight;
    const ctx = exportCanvas.getContext("2d");
    if (format === "jpeg") { ctx.fillStyle = bgColor || "#ffffff"; ctx.fillRect(0, 0, canvasWidth, canvasHeight); }
    layers.forEach((layer) => {
      if (!layer.visible) return;
      const layerCanvas = getLayerCanvas(layer.id);
      const layerCtx = layerCanvas.getContext("2d");
      layerCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      layer.elements.forEach((el) => drawElementToContext(layerCtx, el, () => {}));
      ctx.save(); ctx.globalAlpha = layer.opacity; ctx.drawImage(layerCanvas, 0, 0); ctx.restore();
    });
    const link = document.createElement("a");
    link.download = `paint-studio-export-${Date.now()}.${format}`;
    link.href = exportCanvas.toDataURL(`image/${format}`, 0.95);
    link.click();
    showToast(`Exported as ${format.toUpperCase()}`);
  };

  const handleShareUrl = () => {
    const encoded = encodeCanvasState({ width: canvasWidth, height: canvasHeight, bgColor, layers });
    if (!encoded) { showToast("Canvas state too large for URL encoding!"); return; }
    const shareableUrl = `${window.location.origin}${window.location.pathname}#data=${encoded}`;
    navigator.clipboard.writeText(shareableUrl);
    showToast("Shareable URL copied to clipboard!");
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-background,#faf9f6)] text-[var(--color-foreground,#1c2624)] font-sans select-none overflow-hidden">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      {toastMessage && (
        <div className="fixed top-24 right-4 z-60 bg-[var(--color-primary,#0f6e5c)] text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-teal-600 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="h-14 border-b border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] px-2 md:px-4 flex items-center justify-between z-50 gap-2 relative overflow-visible">
        <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto touch-pan-x py-1 flex-1 min-w-0 no-scrollbar [webkit-overflow-scrolling:touch]" style={{ touchAction: "pan-x" }}>
          {/* Quick Actions Group */}
          <div className="flex items-center space-x-1 md:space-x-2 bg-[var(--color-background,#faf9f6)] px-2 py-1 rounded-md border border-[var(--color-border,#dcd5c8)] shrink-0">
            <button onClick={handleUndo} disabled={history.historyIndex <= 0} title="Undo (Ctrl+Z)" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 shrink-0"><Icons.Undo /></button>
            <button onClick={handleRedo} disabled={history.historyIndex >= history.historyLength - 1} title="Redo (Ctrl+Y)" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 shrink-0"><Icons.Redo /></button>

            <div className="h-4 w-px bg-[var(--color-border,#dcd5c8)] shrink-0" />

            <button onClick={() => deleteSelectedElement(showToast)} disabled={!hasSelection} title={isMultiSelect ? `Delete ${multiSelectIds.length} Selected Artifacts` : "Delete Selected Artifact"} className="p-2 md:p-1.5 hover:bg-red-100 text-red-600 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-xs font-medium shrink-0">
              <Icons.Trash />
              <span className="hidden sm:inline">{isMultiSelect ? `Delete (${multiSelectIds.length})` : "Delete"}</span>
            </button>

            <button onClick={() => duplicateSelectedElement(showToast)} disabled={!selectedElementId} title="Duplicate Selected Artifact (Ctrl+D)" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-1 text-xs font-medium shrink-0">
              <Icons.Duplicate />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            <div className="h-4 w-px bg-[var(--color-border,#dcd5c8)] shrink-0" />

            {/* Z-order controls */}
            <button onClick={() => reorderElementZ(selectedElementId, "front")} disabled={!selectedElementId || selectedElementZIndex >= (selectedElementLayer?.elements.length ?? 0) - 1} title="Bring to Front (Ctrl+Shift+])" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 disabled:hover:bg-transparent shrink-0 text-sm leading-none font-mono">⤒</button>
            <button onClick={() => reorderElementZ(selectedElementId, "forward")} disabled={!selectedElementId || selectedElementZIndex >= (selectedElementLayer?.elements.length ?? 0) - 1} title="Bring Forward (Ctrl+])" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 disabled:hover:bg-transparent shrink-0 text-sm leading-none font-mono">▲</button>
            <button onClick={() => reorderElementZ(selectedElementId, "backward")} disabled={!selectedElementId || selectedElementZIndex <= 0} title="Send Backward (Ctrl+[)" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 disabled:hover:bg-transparent shrink-0 text-sm leading-none font-mono">▼</button>
            <button onClick={() => reorderElementZ(selectedElementId, "back")} disabled={!selectedElementId || selectedElementZIndex <= 0} title="Send to Back (Ctrl+Shift+[)" className="p-2 md:p-1.5 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded disabled:opacity-30 disabled:hover:bg-transparent shrink-0 text-sm leading-none font-mono">⤓</button>

            {isMultiSelect && (
              <>
                <div className="h-4 w-px bg-[var(--color-border,#dcd5c8)] shrink-0" />
                <span className="text-[10px] md:text-xs font-medium text-[var(--color-primary,#0f6e5c)] bg-[var(--color-primary,#0f6e5c)]/10 px-2 py-1 rounded shrink-0 whitespace-nowrap">{multiSelectIds.length} selected</span>
              </>
            )}

            <div className="h-4 w-px bg-[var(--color-border,#dcd5c8)] shrink-0" />

            <button onClick={() => setShowResizeModal(true)} title="Canvas Dimensions" className="text-xs font-mono px-2 py-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded flex items-center gap-1 shrink-0">
              <span>{canvasWidth} x {canvasHeight}</span>
              <Icons.Settings />
            </button>
          </div>

          <button onClick={() => fileInputRef.current?.click()} className="px-2 md:px-3 py-1.5 text-xs font-medium text-[var(--color-foreground,#1c2624)] bg-transparent hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded-md border border-[var(--color-border,#dcd5c8)] flex items-center gap-1.5 shrink-0" title="Upload Local Image">
            <Icons.Upload /><span className="hidden md:inline">Upload Image</span>
          </button>
          <button onClick={() => setShowShortcutsModal(true)} className="p-2 text-xs hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded-md border border-[var(--color-border,#dcd5c8)] flex items-center gap-1 shrink-0" title="Shortcuts"><Icons.Help /></button>
          <button onClick={handleShareUrl} className="px-2 md:px-3 py-1.5 text-xs font-medium text-[var(--color-foreground,#1c2624)] bg-transparent hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded-md border border-[var(--color-border,#dcd5c8)] flex items-center gap-1.5 shrink-0">
            <Icons.Share /><span className="hidden md:inline">Share URL</span>
          </button>
        </div>

        {/* Export button */}
        <div className="shrink-0 overflow-visible relative" ref={exportMenuRef}>
          <div className="relative">
            <button onClick={() => setShowExportMenu((prev) => !prev)} className="px-3 py-1.5 text-xs font-medium text-white bg-[var(--color-primary,#0f6e5c)] hover:bg-[var(--color-primary-hover,#0b5645)] rounded-md flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform">
              <Icons.Download /><span>Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-md shadow-xl py-1 w-40 z-50">
                <button onClick={() => { handleExport("png"); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-hover,#e8e4d8)] transition-colors">PNG (Transparent)</button>
                <button onClick={() => { handleExport("jpeg"); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-surface-hover,#e8e4d8)] transition-colors">JPG (Solid Background)</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Secondary Control Toolbar */}
      <div className="min-h-10 border-b border-[var(--color-border,#dcd5c8)] bg-[var(--color-background,#faf9f6)] px-2 md:px-4 flex items-center justify-between text-xs overflow-x-auto no-scrollbar py-1 md:py-0">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0">
          {(activeTool === "brush" || activeTool === "pencil" || activeTool === "eraser" || activeTool === "shape") && (
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <span className="text-[var(--color-foreground-muted,#576360)]">Size:</span>
              <input type="range" min="1" max="50" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-16 md:w-20 accent-[var(--color-primary,#0f6e5c)]" />
              <span className="font-mono w-4">{strokeWidth}</span>
            </div>
          )}

          {(activeTool === "brush" || activeTool === "pencil") && (
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <span className="text-[var(--color-foreground-muted,#576360)]">Opacity:</span>
              <input type="range" min="0.1" max="1" step="0.05" value={brushOpacity} onChange={(e) => setBrushOpacity(Number(e.target.value))} className="w-16 md:w-20 accent-[var(--color-primary,#0f6e5c)]" />
              <span className="font-mono">{Math.round(brushOpacity * 100)}%</span>
            </div>
          )}

          {(activeTool === "brush" || activeTool === "pencil") && (
            <div className="flex items-center space-x-1">
              <span className="text-[var(--color-foreground-muted,#576360)] hidden sm:inline">Cap:</span>
              {["round", "butt", "square"].map((cap) => (
                <button key={cap} onClick={() => setLineCap(cap as any)} className={`px-2 py-0.5 rounded capitalize ${lineCap === cap ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "hover:bg-[var(--color-surface,#f0eee7)]"}`}>{cap}</button>
              ))}
            </div>
          )}

          {activeTool === "shape" && (
            <>
              <div className="flex items-center space-x-1 border-r border-[var(--color-border,#dcd5c8)] pr-3">
                {["rectangle", "rounded-rect", "circle", "line", "arrow", "star"].map((shape) => (
                  <button key={shape} onClick={() => setActiveShape(shape)} className={`px-2 py-0.5 rounded capitalize whitespace-nowrap ${activeShape === shape ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "hover:bg-[var(--color-surface,#f0eee7)]"}`}>{shape.replace("-", " ")}</button>
                ))}
              </div>
              <label className="flex items-center space-x-1 cursor-pointer whitespace-nowrap">
                <input type="checkbox" checked={fillEnabled} onChange={(e) => setFillEnabled(e.target.checked)} className="accent-[var(--color-primary,#0f6e5c)]" />
                <span>Fill Shape</span>
              </label>
              {fillEnabled && (
                <div className="flex items-center space-x-1">
                  <span className="whitespace-nowrap">Fill Color:</span>
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-black/20">
                    <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} className="w-[150%] h-[150%] -m-[25%] cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Text Inspector */}
          {((selectedElement && selectedElement.type === "text") || activeTool === "text") ? (
            <div className="flex items-center space-x-2 md:space-x-3 bg-amber-50/60 p-1 px-2.5 rounded border border-amber-200 shrink-0">
              <span className="font-semibold text-amber-900 hidden lg:inline">Text Inspector:</span>
              {selectedElement && selectedElement.type === "text" && (
                <input type="text" value={editingTextValue} onChange={(e) => { setEditingTextValue(e.target.value); updateSelectedTextElement("text", e.target.value); }} placeholder="Type text content..." className="px-2 py-0.5 border border-amber-300 rounded bg-white font-sans text-xs w-28 sm:w-36 md:w-48 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary,#0f6e5c)]" />
              )}
              <select value={selectedElement && selectedElement.type === "text" ? selectedElement.font : textFont} onChange={(e) => { setTextFont(e.target.value); updateSelectedTextElement("font", e.target.value); }} className="bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs focus:outline-none">
                {FONTS.map((f) => <option key={f.id} value={f.family}>{f.name}</option>)}
              </select>
              <div className="flex items-center space-x-1">
                <span className="hidden sm:inline">Size:</span>
                <input type="number" min="10" max="200" value={selectedElement && selectedElement.type === "text" ? selectedElement.fontSize : textSize} onChange={(e) => { const val = Number(e.target.value); setTextSize(val); updateSelectedTextElement("fontSize", val); }} className="w-12 md:w-14 bg-white border border-amber-300 rounded px-1 py-0.5 text-xs font-mono" />
              </div>
              <button onClick={() => { const nextVal = selectedElement && selectedElement.type === "text" ? !selectedElement.bold : !textBold; setTextBold(nextVal); updateSelectedTextElement("bold", nextVal); }} className={`px-2 py-0.5 rounded font-bold ${(selectedElement && selectedElement.bold) || textBold ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "bg-white border border-amber-300 hover:bg-amber-100"}`}>B</button>
              <button onClick={() => { const nextVal = selectedElement && selectedElement.type === "text" ? !selectedElement.italic : !textItalic; setTextItalic(nextVal); updateSelectedTextElement("italic", nextVal); }} className={`px-2 py-0.5 rounded italic ${(selectedElement && selectedElement.italic) || textItalic ? "bg-[var(--color-primary,#0f6e5c)] text-white" : "bg-white border border-amber-300 hover:bg-amber-100"}`}>I</button>
              <div className="flex items-center space-x-1">
                <span className="px-1 hidden sm:inline">Color:</span>
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-black/20">
                  <input type="color" value={selectedElement && selectedElement.type === "text" ? selectedElement.strokeColor : primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); updateSelectedTextElement("strokeColor", e.target.value); }} className="w-[150%] h-[150%] -m-[25%] cursor-pointer border-0 p-0 bg-transparent" />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Palette Bar */}
        <div className="flex items-center space-x-1 md:space-x-1.5 shrink-0 ml-2">
          <span className="text-[var(--color-foreground-muted,#576360)] mr-1 px-1 hidden md:inline">Color:</span>
          {COLOR_PALETTES[0].colors.map((c) => (
            <button key={c} onClick={() => { setPrimaryColor(c); if (selectedElement && selectedElement.type === "text") updateSelectedTextElement("strokeColor", c); }} className={`w-5 h-5 rounded-full border border-black/20 ${primaryColor === c ? "ring-2 ring-[var(--color-primary,#0f6e5c)] scale-110" : ""}`} style={{ backgroundColor: c }} />
          ))}
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-black/20" title="Custom Hex Picker">
            <input type="color" value={primaryColor} onChange={(e) => { setPrimaryColor(e.target.value); if (selectedElement && selectedElement.type === "text") updateSelectedTextElement("strokeColor", e.target.value); }} className="w-[150%] h-[150%] -m-[25%] cursor-pointer border-0 p-0 bg-transparent" />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Toolbar */}
        <div className="w-12 border-r border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] flex flex-col items-center py-3 space-y-2 z-10 shrink-0 overflow-y-auto">
          {[
            { id: "select", icon: Icons.Select, label: "Select & Move Artifacts (V)" },
            { id: "brush", icon: Icons.Brush, label: "Freehand Brush (B)" },
            { id: "pencil", icon: Icons.Pencil, label: "Pencil (P)" },
            { id: "eraser", icon: Icons.Eraser, label: "Eraser (E)" },
            { id: "shape", icon: Icons.Shapes, label: "Shapes (S)" },
            { id: "text", icon: Icons.Text, label: "Text Tool & Real-Time Inspector (T)" },
            { id: "eyedropper", icon: Icons.Eyedropper, label: "Eyedropper Color Picker (I)" },
            { id: "pan", icon: Icons.Pan, label: "Pan Canvas Viewport (H)" },
          ].map((tool) => (
            <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`p-2.5 md:p-2 rounded-lg transition-colors relative group ${activeTool === tool.id ? "bg-[var(--color-primary,#0f6e5c)] text-white shadow-sm" : "hover:bg-[var(--color-surface-hover,#e8e4d8)] text-[var(--color-foreground,#1c2624)]"}`} title={tool.label}>
              <tool.icon />
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded hidden lg:group-hover:block whitespace-nowrap z-30">{tool.label}</div>
            </button>
          ))}
        </div>

        {/* Main Canvas Area */}
        <div ref={containerRef} className="flex-1 bg-[#e8e4d8] dark:bg-[#121817] relative overflow-hidden flex items-center justify-center touch-none select-none" style={{ cursor: getCursorStyle() }}>
          <div className="shadow-2xl relative" style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: "center center", touchAction: "none" }}>
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="block bg-white rounded-sm shadow-md"
              style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, touchAction: "none" }}
            />
          </div>

          {/* Floating Zoom Controls */}
          <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-[var(--color-surface,#f0eee7)]/90 backdrop-blur border border-[var(--color-border,#dcd5c8)] rounded-lg p-1 md:p-1.5 flex items-center space-x-1.5 md:space-x-2 shadow-md z-20 text-xs">
            <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))} className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"><Icons.ZoomOut /></button>
            <span className="font-mono w-10 md:w-12 text-center text-[11px] md:text-xs">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom((z) => Math.min(5, z + 0.1))} className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"><Icons.ZoomIn /></button>
            <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="px-2 py-0.5 text-[10px] bg-[var(--color-background,#faf9f6)] hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded border hidden sm:inline-block">Reset View</button>
          </div>
        </div>

        {/* Right Drawer: Layer Manager */}
        <div className={`absolute md:relative right-0 top-0 bottom-0 ${isLayersOpen ? "w-64" : "w-10"} border-l border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] transition-all duration-200 flex flex-col z-20 md:z-10 shrink-0 shadow-lg md:shadow-none`}>
          <div className="h-10 border-b border-[var(--color-border,#dcd5c8)] px-3 flex items-center justify-center">
            {isLayersOpen && (
              <div className="flex items-center space-x-1.5 font-bold text-xs">
                <Icons.Layers /><span>Layers ({layers.length})</span>
              </div>
            )}
            <button onClick={() => setIsLayersOpen(!isLayersOpen)} className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded ml-auto">
              {isLayersOpen ? <Icons.ChevronUp /> : <Icons.Layers />}
            </button>
          </div>

          {isLayersOpen && (
            <div className="flex-1 flex flex-col justify-between p-3 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--color-border,#dcd5c8)] pb-2">
                <button onClick={() => { addLayer(); showToast("New layer added"); }} className="px-2 py-1 bg-[var(--color-primary,#0f6e5c)] text-white text-xs rounded hover:bg-[var(--color-primary-hover,#0b5645)] flex items-center gap-1 shadow-sm">
                  <Icons.Plus /><span>New Layer</span>
                </button>
                <div className="flex space-x-1">
                  <button onClick={() => moveLayer(activeLayerId, "up")} title="Move Up" className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"><Icons.ChevronUp /></button>
                  <button onClick={() => moveLayer(activeLayerId, "down")} title="Move Down" className="p-1 hover:bg-[var(--color-surface-hover,#e8e4d8)] rounded"><Icons.ChevronDown /></button>
                </div>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {layers.slice().reverse().map((layer) => {
                  const isActive = layer.id === activeLayerId;
                  return (
                    <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} className={`p-2.5 rounded-lg border text-xs flex flex-col space-y-2 cursor-pointer transition-colors ${isActive ? "bg-[var(--color-background,#faf9f6)] border-[var(--color-primary,#0f6e5c)] shadow-sm" : "border-[var(--color-border,#dcd5c8)] hover:bg-[var(--color-surface-hover,#e8e4d8)]"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate w-28">{layer.name}</span>
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => pushLayerUpdate((prev) => prev.map((l) => l.id === layer.id ? { ...l, visible: !l.visible } : l))} className="p-1 text-[var(--color-foreground-muted,#576360)] hover:text-black">
                            {layer.visible ? <Icons.Eye /> : <Icons.EyeOff />}
                          </button>
                          <button onClick={() => pushLayerUpdate((prev) => prev.map((l) => l.id === layer.id ? { ...l, locked: !l.locked } : l))} className="p-1 text-[var(--color-foreground-muted,#576360)] hover:text-black">
                            {layer.locked ? <Icons.Lock /> : <Icons.Unlock />}
                          </button>
                          <button onClick={() => deleteLayer(layer.id, showToast)} className="p-1 text-red-500 hover:text-red-700"><Icons.Trash /></button>
                        </div>
                      </div>

                      {isActive && (
                        <div className="flex items-center space-x-2 pt-1 border-t border-[var(--color-border,#dcd5c8)]/50" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] text-[var(--color-foreground-muted,#576360)]">Opacity</span>
                          <input type="range" min="0" max="1" step="0.05" value={layer.opacity} onChange={(e) => { const val = Number(e.target.value); pushLayerUpdate((prev) => prev.map((l) => l.id === layer.id ? { ...l, opacity: val } : l)); }} className="w-24 accent-[var(--color-primary,#0f6e5c)]" />
                          <span className="text-[10px] font-mono">{Math.round(layer.opacity * 100)}%</span>
                        </div>
                      )}

                      {layer.elements.length > 0 && (
                        <div className="pt-2 border-t border-[var(--color-border,#dcd5c8)]/50 space-y-1" onClick={(e) => e.stopPropagation()}>
                          <div className="text-[9px] font-semibold text-[var(--color-foreground-muted,#576360)] uppercase tracking-wide">Artifacts ({layer.elements.length})</div>
                          <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5">
                            {layer.elements.slice().reverse().map((el) => {
                              const isElActive = el.id === selectedElementId;
                              const isElGrouped = isMultiSelect && multiSelectIds.includes(el.id);
                              const isElVisible = el.visible !== false;
                              const zIdx = layer.elements.findIndex((e2) => e2.id === el.id);
                              return (
                                <div key={el.id} onClick={() => { selectSingleElement(el.id); setActiveLayerId(layer.id); }} className={`px-1.5 py-1 rounded border text-[10px] flex flex-col cursor-pointer transition-colors ${isElActive || isElGrouped ? "bg-[var(--color-primary,#0f6e5c)]/10 border-[var(--color-primary,#0f6e5c)]" : "border-transparent hover:bg-[var(--color-surface-hover,#e8e4d8)]"}`}>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate flex-1">
                                      {getElementLabel(el)}
                                      {isElGrouped && !isElActive && <span className="ml-1 text-[var(--color-primary,#0f6e5c)]">•</span>}
                                    </span>
                                    <div className="flex items-center space-x-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => updateElementProps(el.id, { visible: !isElVisible })} title={isElVisible ? "Hide" : "Show"} className="p-0.5 text-[var(--color-foreground-muted,#576360)] hover:text-black">{isElVisible ? <Icons.Eye /> : <Icons.EyeOff />}</button>
                                      <button onClick={() => updateElementProps(el.id, { locked: !el.locked })} title={el.locked ? "Unlock" : "Lock"} className="p-0.5 text-[var(--color-foreground-muted,#576360)] hover:text-black">{el.locked ? <Icons.Lock /> : <Icons.Unlock />}</button>
                                      <button onClick={() => duplicateElement(el.id, showToast)} title="Duplicate" className="p-0.5 text-[var(--color-foreground-muted,#576360)] hover:text-black"><Icons.Duplicate /></button>
                                      <button onClick={() => deleteElement(el.id, showToast)} title="Delete" className="p-0.5 text-red-500 hover:text-red-700"><Icons.Trash /></button>
                                    </div>
                                  </div>
                                  {isElActive && (
                                    <>
                                      <div className="flex items-center space-x-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-[9px] text-[var(--color-foreground-muted,#576360)]">Opacity</span>
                                        <input type="range" min="0" max="1" step="0.05" value={el.opacity ?? 1} onChange={(e) => updateElementProps(el.id, { opacity: Number(e.target.value) })} className="flex-1 accent-[var(--color-primary,#0f6e5c)]" />
                                        <span className="text-[9px] font-mono w-7 text-right">{Math.round((el.opacity ?? 1) * 100)}%</span>
                                      </div>
                                      <div className="flex items-center space-x-1 mt-1" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-[9px] text-[var(--color-foreground-muted,#576360)]">Order</span>
                                        <button onClick={() => reorderElementZ(el.id, "front")} disabled={zIdx >= layer.elements.length - 1} title="Bring to Front" className="px-1 font-mono text-[10px] leading-tight text-[var(--color-foreground-muted,#576360)] hover:text-black disabled:opacity-30">⤒</button>
                                        <button onClick={() => reorderElementZ(el.id, "forward")} disabled={zIdx >= layer.elements.length - 1} title="Bring Forward" className="px-1 font-mono text-[10px] leading-tight text-[var(--color-foreground-muted,#576360)] hover:text-black disabled:opacity-30">▲</button>
                                        <button onClick={() => reorderElementZ(el.id, "backward")} disabled={zIdx <= 0} title="Send Backward" className="px-1 font-mono text-[10px] leading-tight text-[var(--color-foreground-muted,#576360)] hover:text-black disabled:opacity-30">▼</button>
                                        <button onClick={() => reorderElementZ(el.id, "back")} disabled={zIdx <= 0} title="Send to Back" className="px-1 font-mono text-[10px] leading-tight text-[var(--color-foreground-muted,#576360)] hover:text-black disabled:opacity-30">⤓</button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button onClick={() => mergeDownLayer(activeLayerId, showToast)} className="w-full py-1.5 text-xs border border-[var(--color-border,#dcd5c8)] rounded hover:bg-[var(--color-surface-hover,#e8e4d8)]">Merge Down</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-[var(--color-border,#dcd5c8)] bg-[var(--color-surface,#f0eee7)] px-2 md:px-4 flex items-center justify-between text-[10px] md:text-[11px] text-[var(--color-foreground-muted,#576360)] font-mono z-20">
        <div>X: {cursorCoords.x}px Y: {cursorCoords.y}px</div>
        <div className="truncate max-w-[120px] sm:max-w-none">
          Selected: {isMultiSelect ? `${multiSelectIds.length} artifacts` : selectedElement ? `${selectedElement.type.toUpperCase()} (${selectedElement.id})` : "None"}
        </div>
        <div>Zoom: {Math.round(zoom * 100)}%</div>
      </footer>

      {/* Modals */}
      {showImageModal && pendingImage && (
        <ImageModal
          pendingImage={pendingImage}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          onOption={handleImageOption}
          onCancel={() => setShowImageModal(false)}
        />
      )}
      {showResizeModal && (
        <ResizeModal
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          bgColor={bgColor}
          onWidthChange={setCanvasWidth}
          onHeightChange={setCanvasHeight}
          onBgColorChange={setBgColor}
          onClose={() => setShowResizeModal(false)}
        />
      )}
      {showShortcutsModal && (
        <ShortcutsModal onClose={() => setShowShortcutsModal(false)} />
      )}
    </div>
  );
}
