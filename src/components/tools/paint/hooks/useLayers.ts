/**
 * useLayers — all layer and element management in one place.
 *
 * Encapsulates:
 *  - pushLayerUpdate (write + history snapshot in one call)
 *  - Layer CRUD: add, delete, move, mergeDown
 *  - Element CRUD: delete, duplicate, updateProps, reorderZ, nudge
 *  - Selection helpers: selectSingle, clearSelection
 *  - Read helpers: getElementLabel, selectedElement, selectedElementLayer, …
 */

import { useState, useCallback, useMemo } from "react";
import type { Layer, PaintElement, ZOrderAction } from "../types";
import type { HistoryAPI } from "./useHistory";

export interface LayersAPI {
  // State reads
  layers: Layer[];
  activeLayerId: string;
  selectedElementId: string | null;
  multiSelectIds: string[];
  isMultiSelect: boolean;
  hasSelection: boolean;
  selectedElement: PaintElement | null;
  selectedElementLayer: Layer | null;
  selectedElementZIndex: number;
  multiSelectedElements: PaintElement[];

  // Layer mutations
  setActiveLayerId: (id: string) => void;
  addLayer: () => void;
  deleteLayer: (id: string, showToast: (m: string) => void) => void;
  moveLayer: (id: string, direction: "up" | "down") => void;
  mergeDownLayer: (id: string, showToast: (m: string) => void) => void;

  // Element mutations
  pushLayerUpdate: (updater: Layer[] | ((prev: Layer[]) => Layer[])) => void;
  selectSingleElement: (id: string) => void;
  clearSelection: () => void;
  deleteElement: (elementId: string, showToast: (m: string) => void) => void;
  deleteSelectedElement: (showToast: (m: string) => void) => void;
  updateElementProps: (elementId: string, updates: Partial<PaintElement>) => void;
  duplicateElement: (elementId: string, showToast: (m: string) => void) => void;
  duplicateSelectedElement: (showToast: (m: string) => void) => void;
  reorderElementZ: (elementId: string, action: ZOrderAction) => void;
  nudgeElements: (ids: string[], dx: number, dy: number) => void;

  // Helpers
  getElementLabel: (el: PaintElement) => string;

  /** Directly replace layers without snapshotting history (for undo/redo). */
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  /** Directly replace activeLayerId without side-effects. */
  setActiveLayerIdRaw: React.Dispatch<React.SetStateAction<string>>;
  /** Expose multi-select setter so canvas handlers can update it. */
  setMultiSelectIds: React.Dispatch<React.SetStateAction<string[]>>;
  /** Expose selectedElementId setter so canvas handlers can update it. */
  setSelectedElementId: React.Dispatch<React.SetStateAction<string | null>>;
}

interface UseLayersOptions {
  history: HistoryAPI;
  /** Called when a layer is deleted, so callers can clean up per-layer canvases. */
  onLayerDeleted?: (id: string) => void;
}

const DEFAULT_LAYER: Layer = {
  id: "layer_1",
  name: "Background Layer",
  visible: true,
  locked: false,
  opacity: 1,
  elements: [],
};

export function useLayers({ history, onLayerDeleted }: UseLayersOptions): LayersAPI {
  const [layers, setLayers] = useState<Layer[]>([DEFAULT_LAYER]);
  const [activeLayerId, setActiveLayerIdRaw] = useState("layer_1");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [multiSelectIds, setMultiSelectIds] = useState<string[]>([]);

  // ─── Core update primitive ───────────────────────────────────────────────

  const pushLayerUpdate = useCallback(
    (updater: Layer[] | ((prev: Layer[]) => Layer[])) => {
      setLayers((prevLayers) => {
        const nextLayers =
          typeof updater === "function" ? updater(prevLayers) : updater;
        history.saveHistory(nextLayers);
        return nextLayers;
      });
    },
    [history],
  );

  // ─── Derived state ───────────────────────────────────────────────────────

  const isMultiSelect = multiSelectIds.length > 1;
  const hasSelection = isMultiSelect || !!selectedElementId;

  const selectedElement = useMemo<PaintElement | null>(() => {
    if (!selectedElementId) return null;
    for (const layer of layers) {
      const found = layer.elements.find((e) => e.id === selectedElementId);
      if (found) return found;
    }
    return null;
  }, [layers, selectedElementId]);

  const selectedElementLayer = useMemo<Layer | null>(() => {
    if (!selectedElementId) return null;
    return (
      layers.find((l) => l.elements.some((e) => e.id === selectedElementId)) ??
      null
    );
  }, [layers, selectedElementId]);

  const selectedElementZIndex = useMemo(() => {
    if (!selectedElementLayer || !selectedElementId) return -1;
    return selectedElementLayer.elements.findIndex(
      (e) => e.id === selectedElementId,
    );
  }, [selectedElementLayer, selectedElementId]);

  const multiSelectedElements = useMemo<PaintElement[]>(() => {
    if (!isMultiSelect) return [];
    const byId = new Map<string, PaintElement>();
    layers.forEach((l) => l.elements.forEach((e) => byId.set(e.id, e)));
    return multiSelectIds.map((id) => byId.get(id)!).filter(Boolean);
  }, [layers, multiSelectIds, isMultiSelect]);

  // ─── Selection helpers ───────────────────────────────────────────────────

  const selectSingleElement = useCallback((id: string) => {
    setSelectedElementId(id);
    setMultiSelectIds((prev) => (prev.length ? [] : prev));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElementId(null);
    setMultiSelectIds([]);
  }, []);

  // ─── Layer CRUD ──────────────────────────────────────────────────────────

  const setActiveLayerId = useCallback((id: string) => {
    setActiveLayerIdRaw(id);
  }, []);

  const addLayer = useCallback(() => {
    const newId = "layer_" + Date.now();
    setLayers((prev) => {
      const newLayer: Layer = {
        id: newId,
        name: `Layer ${prev.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        elements: [],
      };
      const next = [...prev, newLayer];
      history.saveHistory(next);
      return next;
    });
    setActiveLayerIdRaw(newId);
  }, [history]);

  const deleteLayer = useCallback(
    (id: string, showToast: (m: string) => void) => {
      setLayers((prev) => {
        if (prev.length <= 1) {
          showToast("Cannot delete the only layer");
          return prev;
        }
        const next = prev.filter((l) => l.id !== id);
        history.saveHistory(next);
        setActiveLayerIdRaw((cur) => {
          if (cur !== id) return cur;
          return next[next.length - 1].id;
        });
        onLayerDeleted?.(id);
        showToast("Layer deleted");
        return next;
      });
    },
    [history, onLayerDeleted],
  );

  const moveLayer = useCallback(
    (id: string, direction: "up" | "down") => {
      setLayers((prev) => {
        const idx = prev.findIndex((l) => l.id === id);
        if (idx === -1) return prev;
        const targetIdx = direction === "up" ? idx + 1 : idx - 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(idx, 1);
        next.splice(targetIdx, 0, moved);
        history.saveHistory(next);
        return next;
      });
    },
    [history],
  );

  const mergeDownLayer = useCallback(
    (id: string, showToast: (m: string) => void) => {
      setLayers((prev) => {
        const idx = prev.findIndex((l) => l.id === id);
        if (idx <= 0) {
          showToast("Cannot merge down bottom layer");
          return prev;
        }
        const target = prev[idx - 1];
        const current = prev[idx];
        const merged: Layer = {
          ...target,
          elements: [...target.elements, ...current.elements],
        };
        const next = prev
          .filter((l) => l.id !== id)
          .map((l) => (l.id === target.id ? merged : l));
        history.saveHistory(next);
        setActiveLayerIdRaw(target.id);
        showToast(`Merged ${current.name} into ${target.name}`);
        return next;
      });
    },
    [history],
  );

  // ─── Element mutations ───────────────────────────────────────────────────

  const updateElementProps = useCallback(
    (elementId: string, updates: Partial<PaintElement>) => {
      pushLayerUpdate((prev) =>
        prev.map((l) => ({
          ...l,
          elements: l.elements.map((el) =>
            el.id === elementId ? { ...el, ...updates } : el,
          ),
        })),
      );
    },
    [pushLayerUpdate],
  );

  const deleteElement = useCallback(
    (elementId: string, showToast: (m: string) => void) => {
      pushLayerUpdate((prev) =>
        prev.map((l) => ({
          ...l,
          elements: l.elements.filter((e) => e.id !== elementId),
        })),
      );
      setSelectedElementId((prev) => (prev === elementId ? null : prev));
      setMultiSelectIds((prev) => prev.filter((id) => id !== elementId));
      showToast("Artifact deleted");
    },
    [pushLayerUpdate],
  );

  const deleteSelectedElement = useCallback(
    (showToast: (m: string) => void) => {
      if (isMultiSelect) {
        const idSet = new Set(multiSelectIds);
        pushLayerUpdate((prev) =>
          prev.map((l) => ({
            ...l,
            elements: l.elements.filter((e) => !idSet.has(e.id)),
          })),
        );
        showToast(`${idSet.size} artifacts deleted`);
        setMultiSelectIds([]);
        return;
      }
      if (!selectedElementId) {
        showToast("No element selected to delete");
        return;
      }
      deleteElement(selectedElementId, showToast);
    },
    [isMultiSelect, multiSelectIds, selectedElementId, deleteElement, pushLayerUpdate],
  );

  const duplicateElement = useCallback(
    (elementId: string, showToast: (m: string) => void) => {
      setLayers((prev) => {
        let original: PaintElement | null = null;
        let targetLayerId: string | null = null;
        for (const l of prev) {
          const found = l.elements.find((e) => e.id === elementId);
          if (found) { original = found; targetLayerId = l.id; break; }
        }
        if (!original || !targetLayerId) {
          showToast("No element selected to duplicate");
          return prev;
        }
        const offset = 16;
        const newId = `${original.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const duplicated: PaintElement = { ...original, id: newId };
        if (original.points) {
          duplicated.points = original.points.map((pt) => ({
            x: pt.x + offset,
            y: pt.y + offset,
          }));
        } else {
          duplicated.x = (original.x || 0) + offset;
          duplicated.y = (original.y || 0) + offset;
        }
        const next = prev.map((l) =>
          l.id === targetLayerId
            ? { ...l, elements: [...l.elements, duplicated] }
            : l,
        );
        history.saveHistory(next);
        selectSingleElement(newId);
        setActiveLayerIdRaw(targetLayerId);
        showToast("Artifact duplicated");
        return next;
      });
    },
    [history, selectSingleElement],
  );

  const duplicateSelectedElement = useCallback(
    (showToast: (m: string) => void) => {
      if (isMultiSelect) {
        showToast("Select a single artifact to duplicate");
        return;
      }
      if (!selectedElementId) {
        showToast("No element selected to duplicate");
        return;
      }
      duplicateElement(selectedElementId, showToast);
    },
    [isMultiSelect, selectedElementId, duplicateElement],
  );

  const reorderElementZ = useCallback(
    (elementId: string, action: ZOrderAction) => {
      pushLayerUpdate((prev) =>
        prev.map((l) => {
          const idx = l.elements.findIndex((e) => e.id === elementId);
          if (idx === -1) return l;
          const elements = l.elements.slice();
          const [el] = elements.splice(idx, 1);
          if (action === "front") elements.push(el);
          else if (action === "back") elements.unshift(el);
          else if (action === "forward")
            elements.splice(Math.min(idx + 1, elements.length), 0, el);
          else if (action === "backward")
            elements.splice(Math.max(idx - 1, 0), 0, el);
          else elements.splice(idx, 0, el);
          return { ...l, elements };
        }),
      );
    },
    [pushLayerUpdate],
  );

  const nudgeElements = useCallback(
    (ids: string[], dx: number, dy: number) => {
      if (!ids.length) return;
      const idSet = new Set(ids);
      pushLayerUpdate((prev) =>
        prev.map((l) => ({
          ...l,
          elements: l.elements.map((el) => {
            if (!idSet.has(el.id) || el.locked) return el;
            if (el.type === "path") {
              return {
                ...el,
                points: el.points!.map((pt) => ({
                  x: pt.x + dx,
                  y: pt.y + dy,
                })),
              };
            }
            return { ...el, x: (el.x || 0) + dx, y: (el.y || 0) + dy };
          }),
        })),
      );
    },
    [pushLayerUpdate],
  );

  // ─── Label helper ────────────────────────────────────────────────────────

  const getElementLabel = useCallback((el: PaintElement): string => {
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
  }, []);

  return {
    layers,
    activeLayerId,
    selectedElementId,
    multiSelectIds,
    isMultiSelect,
    hasSelection,
    selectedElement,
    selectedElementLayer,
    selectedElementZIndex,
    multiSelectedElements,
    setActiveLayerId,
    addLayer,
    deleteLayer,
    moveLayer,
    mergeDownLayer,
    pushLayerUpdate,
    selectSingleElement,
    clearSelection,
    deleteElement,
    deleteSelectedElement,
    updateElementProps,
    duplicateElement,
    duplicateSelectedElement,
    reorderElementZ,
    nudgeElements,
    getElementLabel,
    setLayers,
    setActiveLayerIdRaw,
    setMultiSelectIds,
    setSelectedElementId,
  };
}
