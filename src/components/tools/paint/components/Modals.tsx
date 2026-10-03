/**
 * Paint studio modals: ImageModal, ResizeModal, ShortcutsModal.
 *
 * These are pure presentational components — they receive all needed state
 * and callbacks as props, no internal state.
 */

import React from "react";

// ─── Image placement modal ───────────────────────────────────────────────────

interface PendingImage {
  src: string;
  width: number;
  height: number;
}

interface ImageModalProps {
  pendingImage: PendingImage;
  canvasWidth: number;
  canvasHeight: number;
  onOption: (option: "resize_canvas" | "scale_fit" | "original") => void;
  onCancel: () => void;
}

export function ImageModal({
  pendingImage,
  canvasWidth,
  canvasHeight,
  onOption,
  onCancel,
}: ImageModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-xl max-w-md w-full p-4 md:p-6 shadow-2xl space-y-4">
        <h2 className="text-base md:text-lg font-bold font-display">
          Image Placed on Canvas
        </h2>
        <p className="text-xs text-[var(--color-foreground-muted,#576360)]">
          An image ({pendingImage.width}x{pendingImage.height}px) was added.
          Choose positioning and sizing:
        </p>

        <div className="space-y-2">
          <button
            onClick={() => onOption("resize_canvas")}
            className="w-full py-2 px-3 text-left border rounded-lg hover:bg-[var(--color-surface-hover,#e8e4d8)] text-xs font-medium"
          >
            Resize Canvas to Fit Image ({pendingImage.width}x{pendingImage.height})
          </button>
          <button
            onClick={() => onOption("scale_fit")}
            className="w-full py-2 px-3 text-left border rounded-lg hover:bg-[var(--color-surface-hover,#e8e4d8)] text-xs font-medium"
          >
            Scale Image to Fit Canvas ({canvasWidth}x{canvasHeight})
          </button>
          <button
            onClick={() => onOption("original")}
            className="w-full py-2 px-3 text-left border rounded-lg hover:bg-[var(--color-surface-hover,#e8e4d8)] text-xs font-medium"
          >
            Place as Movable Layer Element
          </button>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-1.5 text-xs text-center hover:underline text-[var(--color-foreground-muted,#576360)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Canvas settings modal ───────────────────────────────────────────────────

interface ResizeModalProps {
  canvasWidth: number;
  canvasHeight: number;
  bgColor: string;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  onBgColorChange: (v: string) => void;
  onClose: () => void;
}

export function ResizeModal({
  canvasWidth,
  canvasHeight,
  bgColor,
  onWidthChange,
  onHeightChange,
  onBgColorChange,
  onClose,
}: ResizeModalProps) {
  return (
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
              onChange={(e) => onWidthChange(Number(e.target.value))}
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
              onChange={(e) => onHeightChange(Number(e.target.value))}
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
              onChange={(e) => onBgColorChange(e.target.value)}
              className="w-full h-8 rounded border cursor-pointer bg-transparent"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-[var(--color-primary,#0f6e5c)] text-white text-xs rounded font-medium hover:bg-[var(--color-primary-hover,#0b5645)]"
        >
          Apply Settings
        </button>
      </div>
    </div>
  );
}

// ─── Keyboard shortcuts modal ────────────────────────────────────────────────

interface ShortcutsModalProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "V", desc: "Select Tool" },
  { key: "B", desc: "Brush Tool" },
  { key: "P", desc: "Pencil Tool" },
  { key: "E", desc: "Eraser" },
  { key: "S", desc: "Shape Tool" },
  { key: "T", desc: "Text Tool" },
  { key: "H", desc: "Pan Tool" },
  { key: "I", desc: "Eyedropper" },
  { key: "Del / Backspace", desc: "Delete Selected Artifact" },
  { key: "Ctrl + V", desc: "Paste Clipboard Image" },
  { key: "Ctrl + Z / Y", desc: "Undo / Redo" },
  { key: "Ctrl + D", desc: "Duplicate Selected" },
  { key: "Ctrl + ] / [", desc: "Z-order Forward / Backward" },
  { key: "Arrow Keys", desc: "Nudge 1px (Shift = 10px)" },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface,#f0eee7)] border border-[var(--color-border,#dcd5c8)] rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <h2 className="text-sm font-bold font-display">Keyboard Shortcuts</h2>

        <div className="space-y-2 text-xs font-mono">
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} className="flex justify-between">
              <span>{key}</span>
              <span className="text-[var(--color-foreground-muted,#576360)]">{desc}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-[var(--color-primary,#0f6e5c)] text-white text-xs rounded font-medium"
        >
          Close Shortcuts
        </button>
      </div>
    </div>
  );
}
