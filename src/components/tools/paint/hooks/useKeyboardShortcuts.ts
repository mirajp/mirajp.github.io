/**
 * useKeyboardShortcuts — registers the single global keydown handler
 * for tool switching, delete, duplicate, undo/redo, z-order, nudge, etc.
 *
 * Pulled out of the component body so the main function stays focused on
 * wiring state, not on keyboard mapping.
 */

import { useEffect } from "react";
import type { ToolId, ZOrderAction } from "../types";

export interface ShortcutActions {
  setActiveTool: (tool: ToolId) => void;
  deleteSelectedElement: () => void;
  duplicateSelectedElement: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  reorderElementZ: (id: string, action: ZOrderAction) => void;
  nudgeElements: (ids: string[], dx: number, dy: number) => void;
  clearSelection: () => void;

  // State reads
  selectedElementId: string | null;
  multiSelectIds: string[];
  isMultiSelect: boolean;
}

const TOOL_KEYS: Record<string, ToolId> = {
  v: "select",
  b: "brush",
  p: "pencil",
  e: "eraser",
  s: "shape",
  t: "text",
  i: "eyedropper",
  h: "pan",
};

export function useKeyboardShortcuts(actions: ShortcutActions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs/textareas
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        actions.deleteSelectedElement();
        return;
      }

      // Tool switching (single key, no modifier)
      if (!mod && TOOL_KEYS[key]) {
        actions.setActiveTool(TOOL_KEYS[key]);
        return;
      }

      // Ctrl+Z / Ctrl+Shift+Z
      if (mod && key === "z") {
        e.preventDefault();
        e.shiftKey ? actions.handleRedo() : actions.handleUndo();
        return;
      }

      // Ctrl+Y
      if (mod && key === "y") {
        e.preventDefault();
        actions.handleRedo();
        return;
      }

      // Ctrl+D — duplicate
      if (mod && key === "d") {
        e.preventDefault();
        actions.duplicateSelectedElement();
        return;
      }

      // Escape — clear selection
      if (e.key === "Escape") {
        if (actions.multiSelectIds.length || actions.selectedElementId) {
          e.preventDefault();
          actions.clearSelection();
        }
        return;
      }

      // Z-order: Ctrl+] / Ctrl+[  (Shift for "all the way")
      if (mod && actions.selectedElementId) {
        if (e.key === "]") {
          e.preventDefault();
          actions.reorderElementZ(
            actions.selectedElementId,
            e.shiftKey ? "front" : "forward",
          );
          return;
        }
        if (e.key === "[") {
          e.preventDefault();
          actions.reorderElementZ(
            actions.selectedElementId,
            e.shiftKey ? "back" : "backward",
          );
          return;
        }
      }

      // Arrow nudge
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const ids = actions.isMultiSelect
          ? actions.multiSelectIds
          : actions.selectedElementId
            ? [actions.selectedElementId]
            : [];
        if (ids.length) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx =
            e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy =
            e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          actions.nudgeElements(ids, dx, dy);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    actions.deleteSelectedElement,
    actions.duplicateSelectedElement,
    actions.handleUndo,
    actions.handleRedo,
    actions.multiSelectIds,
    actions.selectedElementId,
    actions.isMultiSelect,
    actions.reorderElementZ,
    actions.nudgeElements,
    actions.clearSelection,
    actions.setActiveTool,
  ]);
}
