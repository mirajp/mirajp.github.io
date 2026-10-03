/**
 * useAutosave — handles initial hydration from a share URL or
 * localStorage, and debounced autosave on every committed change.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { AUTOSAVE_STORAGE_KEY, DEFAULTS } from "../constants";
import { decodeCanvasState } from "../utils";
import type { Layer } from "../types";

export interface AutosaveConfig {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  bgColor: string;
}

export interface HydrationResult {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  bgColor: string;
}

export interface AutosaveAPI {
  isHydrated: boolean;
  /**
   * Called once on mount. Returns the hydrated state or null (use defaults).
   * Also returns a toast message string.
   */
  hydrate: () => { result: HydrationResult | null; message: string | null };
}

/**
 * Runs the autosave debounce effect. Must be called in the component body
 * (not conditionally) so the effect is always registered.
 */
export function useAutosave(
  config: AutosaveConfig & { isHydrated: boolean },
  showToast: (msg: string) => void,
): void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!config.isHydrated) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        const sanitizedLayers = config.layers.map((l) => ({
          ...l,
          elements: l.elements.map(({ _imgObj, ...rest }) => rest),
        }));
        window.localStorage.setItem(
          AUTOSAVE_STORAGE_KEY,
          JSON.stringify({
            version: 1,
            savedAt: Date.now(),
            width: config.canvasWidth,
            height: config.canvasHeight,
            bgColor: config.bgColor,
            layers: sanitizedLayers,
          }),
        );
      } catch (err) {
        console.error("Autosave failed:", err);
        if (!warnedRef.current) {
          warnedRef.current = true;
          showToast("Autosave failed — local storage may be full");
        }
      }
    }, DEFAULTS.autosaveDebounce);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    config.isHydrated,
    config.layers,
    config.canvasWidth,
    config.canvasHeight,
    config.bgColor,
  ]);
}

/**
 * One-time hydration: share URL hash wins, then localStorage autosave,
 * then blank canvas defaults.
 */
export function hydrateFromStorage(): {
  result: HydrationResult | null;
  message: string | null;
} {
  // 1. Share URL
  if (window.location.hash.startsWith("#data=")) {
    const base64 = window.location.hash.replace("#data=", "");
    const loaded = decodeCanvasState(base64);
    if (loaded) {
      return {
        result: {
          layers: loaded.layers,
          canvasWidth: loaded.width,
          canvasHeight: loaded.height,
          bgColor: loaded.bgColor || DEFAULTS.bgColor,
        },
        message: "Shared canvas state restored!",
      };
    }
  }

  // 2. localStorage
  try {
    const raw = window.localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (saved && Array.isArray(saved.layers) && saved.layers.length) {
      return {
        result: {
          layers: saved.layers,
          canvasWidth: saved.width || DEFAULTS.canvasWidth,
          canvasHeight: saved.height || DEFAULTS.canvasHeight,
          bgColor: saved.bgColor || DEFAULTS.bgColor,
        },
        message: "Restored your last autosaved session",
      };
    }
  } catch (err) {
    console.error("Autosave restore failed:", err);
  }

  return { result: null, message: null };
}
