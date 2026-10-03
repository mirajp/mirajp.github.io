/**
 * useHistory — encapsulates undo/redo with a linear history stack.
 *
 * Callers push snapshots via `saveHistory(layers)`.  Undo/redo simply
 * re-apply prior serialised states.
 */

import { useState, useCallback } from "react";
import type { Layer } from "../types";

export interface HistoryAPI {
  historyIndex: number;
  historyLength: number;

  /** Snapshot `layers` into the undo stack (trimming any redo tail). */
  saveHistory: (layers: Layer[]) => void;

  /** Step backward. Returns the restored layers or null if at the start. */
  handleUndo: () => Layer[] | null;

  /** Step forward. Returns the restored layers or null if at the end. */
  handleRedo: () => Layer[] | null;

  /** Seed the stack with an initial snapshot (used during hydration). */
  initHistory: (layers: Layer[]) => void;
}

export function useHistory(): HistoryAPI {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveHistory = useCallback(
    (newLayers: Layer[]) => {
      const serialized = JSON.stringify(newLayers);
      setHistory((prev) => {
        const updated = prev.slice(0, historyIndex + 1);
        return [...updated, serialized];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const handleUndo = useCallback((): Layer[] | null => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      return JSON.parse(history[prevIdx]);
    }
    return null;
  }, [history, historyIndex]);

  const handleRedo = useCallback((): Layer[] | null => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      return JSON.parse(history[nextIdx]);
    }
    return null;
  }, [history, historyIndex]);

  const initHistory = useCallback((layers: Layer[]) => {
    setHistory([JSON.stringify(layers)]);
    setHistoryIndex(0);
  }, []);

  return {
    historyIndex,
    historyLength: history.length,
    saveHistory,
    handleUndo,
    handleRedo,
    initHistory,
  };
}
