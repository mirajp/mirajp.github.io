import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildContext,
  createImageDataCopy,
  exportName,
  exportPhoto,
  type LoadedPhoto,
  loadPhoto,
  makeCanvas,
  type PhotoSource,
  processRegion,
  smallCopy,
} from "./photo-editor/engine";
import {
  BANDS,
  CATEGORIES,
  GROUPS,
  isNeutral,
  mixValues,
  type ParamKey,
  PARAMS,
  type ParamSpec,
  type PartialParamValues,
  PRESET_BY_ID,
  type PresetSpec,
  type PresetTabId,
  type SliderGroupId,
  TABS,
} from "./photo-editor/presets";

interface PhotoItem {
  readonly photo: LoadedPhoto;
  readonly preset: string;
  readonly strength: number;
  readonly tweak: PartialParamValues;
}

interface PreviewBuffer {
  readonly photoId: string;
  readonly base: ImageData;
  readonly w: number;
  readonly h: number;
  readonly colorSpace: PredefinedColorSpace;
}

type MobilePane = "presets" | "adjust";

const DEFAULT_OPEN_CATEGORY_ID = "quick";

const CATEGORY_ID_BY_PRESET: Readonly<Record<string, string>> =
  Object.fromEntries(
    CATEGORIES.flatMap((cat) => cat.presets.map((p) => [p.id, cat.id])),
  );

const BAND_CSS_BY_ID: Readonly<Record<string, string>> = Object.fromEntries(
  BANDS.map((b) => [b.id, b.css]),
);

const ORDERED_PARAMS_BY_GROUP: Readonly<
  Record<SliderGroupId, readonly ParamSpec[]>
> = {
  light: PARAMS.filter((p) => p.group === "light"),
  colour: PARAMS.filter((p) => p.group === "colour"),
  detail: PARAMS.filter((p) => p.group === "detail"),
  effects: PARAMS.filter((p) => p.group === "effects"),
  focus: PARAMS.filter((p) => p.group === "focus"),
  grade: PARAMS.filter((p) => p.group === "grade"),
  mixer: BANDS.flatMap((band) => PARAMS.filter((p) => p.band === band.id)),
};

function isSupportedImageFile(file: File): boolean {
  return (
    /^image\/(jpeg|png|webp)$/i.test(file.type) ||
    /\.(jpe?g|png|webp)$/i.test(file.name)
  );
}

function isValidTabId(value: string | null): value is PresetTabId {
  return value != null && TABS.some((tab) => tab.id === value);
}

function mixerShortLabel(param: ParamSpec): string {
  if (param.key.startsWith("sat_")) {
    return param.label.replace(": colour", "");
  }
  if (param.key.startsWith("lum_")) {
    return "bright";
  }
  return "hue";
}

function triggerDownload(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 30_000);
}

function FilmstripThumb({
  photo,
}: {
  readonly photo: LoadedPhoto;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const thumbHeight = 54;
  const scale = thumbHeight / Math.max(1, photo.height);
  const thumbWidth = Math.max(1, Math.round(photo.width * scale));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas == null) return;
    const ctx = canvas.getContext("2d");
    if (ctx == null) return;
    ctx.clearRect(0, 0, thumbWidth, thumbHeight);
    ctx.drawImage(photo.bitmap, 0, 0, thumbWidth, thumbHeight);
  }, [photo, thumbWidth]);

  return (
    <canvas
      ref={canvasRef}
      width={thumbWidth}
      height={thumbHeight}
      className="block h-[54px] rounded-[calc(var(--theme-radius-sm)-2px)]"
    />
  );
}

/** Client-side photo preset & colour-grading darkroom with lossless JPEG metadata preservation. */
export default function PhotoEditor(): React.JSX.Element {
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [comparing, setComparing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<PresetTabId>("all");
  const [query, setQuery] = useState("");
  const [combineNext, setCombineNext] = useState(false);
  const [jpegQuality, setJpegQuality] = useState(0.95);
  const [statusText, setStatusText] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [mobilePane, setMobilePane] = useState<MobilePane>("presets");
  const [openCategories, setOpenCategories] = useState<ReadonlySet<string>>(
    () => new Set([DEFAULT_OPEN_CATEGORY_ID]),
  );
  const [searchCollapsed, setSearchCollapsed] = useState<{
    readonly query: string;
    readonly ids: ReadonlySet<string>;
  }>({ query: "", ids: new Set() });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const holdButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastPointerWasTouchRef = useRef(false);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewBufferRef = useRef<PreviewBuffer | null>(null);
  const presetButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const presetCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const loadedPhotosRef = useRef<Set<LoadedPhoto>>(new Set());
  const rafIdRef = useRef<number | null>(null);
  const dragDepthRef = useRef(0);

  const currentItem =
    selectedIndex >= 0 && selectedIndex < items.length
      ? items[selectedIndex]
      : null;
  const activePhoto = currentItem?.photo ?? null;

  const currentValues = useMemo(
    () =>
      currentItem != null
        ? mixValues(currentItem.preset, currentItem.strength, currentItem.tweak)
        : mixValues("", 100, null),
    [currentItem],
  );

  const basePresetValues = useMemo(
    () =>
      currentItem != null
        ? mixValues(currentItem.preset, currentItem.strength, null)
        : mixValues("", 100, null),
    [currentItem],
  );

  const hasManualTweaks = useMemo(
    () =>
      currentItem != null &&
      PARAMS.some((p) => currentValues[p.key] !== basePresetValues[p.key]),
    [basePresetValues, currentItem, currentValues],
  );

  const activeGroupCounts = useMemo(() => {
    const counts: Partial<Record<SliderGroupId, number>> = {};
    if (currentItem == null) return counts;
    for (const p of PARAMS) {
      if (currentValues[p.key] !== 0) {
        counts[p.group] = (counts[p.group] ?? 0) + 1;
      }
    }
    return counts;
  }, [currentItem, currentValues]);

  // Filter matching across tabs + multi-word search query
  const filterState = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const visiblePresetIds = new Set<string>();
    const visibleCategoryIds = new Set<string>();
    const matchCountByCategory: Record<string, number> = {};
    const orderedVisibleIds: string[] = [""];

    for (const cat of CATEGORIES) {
      const tabMatches = activeTab === "all" || cat.tab === activeTab;
      if (!tabMatches) continue;
      let catMatchCount = 0;
      for (const preset of cat.presets) {
        const haystack =
          `${preset.label} ${preset.when} ${preset.does} ${cat.title}`.toLowerCase();
        const matches = words.every((w) => haystack.includes(w));
        if (matches) {
          visiblePresetIds.add(preset.id);
          orderedVisibleIds.push(preset.id);
          catMatchCount++;
        }
      }
      if (catMatchCount > 0) {
        visibleCategoryIds.add(cat.id);
        matchCountByCategory[cat.id] = catMatchCount;
      }
    }

    return {
      isSearching: words.length > 0,
      visiblePresetIds,
      visibleCategoryIds,
      matchCountByCategory,
      orderedVisibleIds,
      hasAnyMatch: visiblePresetIds.size > 0,
    };
  }, [activeTab, query]);

  const toggleCategory = useCallback(
    (catId: string) => {
      if (query.trim().length > 0) {
        setSearchCollapsed((prev) => {
          const base = prev.query === query ? prev.ids : new Set<string>();
          const next = new Set(base);
          if (next.has(catId)) {
            next.delete(catId);
          } else {
            next.add(catId);
          }
          return { query, ids: next };
        });
        return;
      }
      setOpenCategories((prev) => {
        const next = new Set(prev);
        if (next.has(catId)) {
          next.delete(catId);
        } else {
          next.add(catId);
        }
        return next;
      });
    },
    [query],
  );

  // Release decoded ImageBitmaps when unmounting
  useEffect(() => {
    const tracked = loadedPhotosRef.current;
    return () => {
      for (const photo of tracked) {
        photo.bitmap.close();
      }
      tracked.clear();
    };
  }, []);

  // Prevent iOS Safari / Android long-press text selection on the Hold button
  useEffect(() => {
    const btn = holdButtonRef.current;
    if (btn == null) return;
    const onTouchStart = (e: TouchEvent) => {
      if (!btn.disabled && e.cancelable) {
        e.preventDefault();
      }
    };
    btn.addEventListener("touchstart", onTouchStart, { passive: false });
    return () => {
      btn.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  // Build 1600px working preview buffer whenever the active photo changes
  useEffect(() => {
    if (activePhoto == null) {
      previewBufferRef.current = null;
      return;
    }
    const view = smallCopy(activePhoto.bitmap, 1600, activePhoto.colorSpace);
    view.canvas.width = 0;
    previewBufferRef.current = {
      photoId: activePhoto.id,
      base: view.image,
      w: view.w,
      h: view.h,
      colorSpace: view.colorSpace,
    };
  }, [activePhoto]);

  // Coalesce preview pixel renders onto requestAnimationFrame
  const latestRenderStateRef = useRef({
    activePhoto,
    currentValues,
    comparing,
  });
  latestRenderStateRef.current = {
    activePhoto,
    currentValues,
    comparing,
  };

  const flushPreviewRender = useCallback(() => {
    const {
      activePhoto: photo,
      currentValues: vals,
      comparing: isComparing,
    } = latestRenderStateRef.current;
    const buf = previewBufferRef.current;
    const canvas = previewCanvasRef.current;
    if (photo == null || buf == null || canvas == null || buf.photoId !== photo.id) {
      return;
    }
    if (canvas.width !== buf.w || canvas.height !== buf.h) {
      canvas.width = buf.w;
      canvas.height = buf.h;
    }
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d", {
        colorSpace: buf.colorSpace,
        willReadFrequently: true,
      });
    } catch {
      ctx = canvas.getContext("2d");
    }
    if (ctx == null) return;

    if (isComparing || isNeutral(vals)) {
      ctx.putImageData(buf.base, 0, 0);
      return;
    }

    const frame = createImageDataCopy(buf.base.data, buf.w, buf.h, buf.colorSpace);
    processRegion(frame.data, buf.w, buf.h, 0, buf.h, buildContext(vals, photo));
    ctx.putImageData(frame, 0, 0);
  }, []);

  useEffect(() => {
    if (activePhoto == null) return;
    if (rafIdRef.current != null) {
      window.cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      flushPreviewRender();
    });
    return () => {
      if (rafIdRef.current != null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [activePhoto, comparing, currentValues, flushPreviewRender]);

  // Time-sliced rendering of all 135 96x54 preset thumbnails whenever activePhoto changes
  useEffect(() => {
    if (activePhoto == null) return;
    let cancelled = false;
    let timerId: number | null = null;

    const { canvas, ctx } = makeCanvas(96, 54, "srgb");
    const s = Math.max(96 / activePhoto.width, 54 / activePhoto.height);
    ctx.drawImage(
      activePhoto.bitmap,
      (96 - activePhoto.width * s) / 2,
      (54 - activePhoto.height * s) / 2,
      activePhoto.width * s,
      activePhoto.height * s,
    );
    const baseThumb = ctx.getImageData(0, 0, 96, 54);
    canvas.width = 0;

    // Shared 256px source caches `softMaps` and `smartMap` once across all 135 thumbnails
    const smallSource: PhotoSource = {
      analysis: activePhoto.analysis,
      detail: {
        w: activePhoto.analysis.w,
        h: activePhoto.analysis.h,
        data: activePhoto.analysis.data,
        cache: null,
      },
    };

    const queue: PresetSpec[] = CATEGORIES.flatMap((cat) => [...cat.presets]);
    let cursor = 0;

    const step = () => {
      if (cancelled) return;
      const sliceEnd = Math.min(queue.length, cursor + 12);
      for (; cursor < sliceEnd; cursor++) {
        const preset = queue[cursor];
        const targetCanvas = presetCanvasRefs.current.get(preset.id);
        if (targetCanvas == null) continue;
        const targetCtx = targetCanvas.getContext("2d");
        if (targetCtx == null) continue;
        const image = new ImageData(
          new Uint8ClampedArray(baseThumb.data),
          96,
          54,
        );
        processRegion(
          image.data,
          96,
          54,
          0,
          54,
          buildContext(mixValues(preset.id, 100, null), smallSource),
        );
        targetCtx.putImageData(image, 0, 0);
      }
      if (cursor < queue.length) {
        timerId = window.setTimeout(step, 0);
      }
    };

    step();

    return () => {
      cancelled = true;
      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [activePhoto]);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const candidates = Array.from(fileList).filter(isSupportedImageFile);
    if (candidates.length === 0) {
      setStatusText("No photo that this tool can read.");
      return;
    }

    let failed = 0;
    const loadedItems: PhotoItem[] = [];
    for (const file of candidates) {
      setStatusText(`Loading ${file.name} ...`);
      try {
        const photo = await loadPhoto(file, file.name);
        loadedPhotosRef.current.add(photo);
        loadedItems.push({
          photo,
          preset: "",
          strength: 100,
          tweak: {},
        });
      } catch {
        failed++;
      }
    }

    if (loadedItems.length > 0) {
      setItems((prev) => {
        const next = [...prev, ...loadedItems];
        setSelectedIndex((prevIdx) => (prevIdx < 0 ? 0 : prevIdx));
        setStatusText(
          failed > 0
            ? `${failed} file(s) did not load. Supported formats: JPEG, PNG, and WebP.`
            : `${next.length} photo(s) loaded.`,
        );
        return next;
      });
    } else {
      setStatusText(
        `${failed} file(s) did not load. Supported formats: JPEG, PNG, and WebP.`,
      );
    }
  }, []);

  const choosePreset = useCallback(
    (presetId: string, combine: boolean, scrollIntoView = false) => {
      if (selectedIndex < 0) return;
      let targetScrollId = presetId;
      setItems((prev) => {
        const item = prev[selectedIndex];
        if (item == null) return prev;
        let nextItem: PhotoItem;
        if (combine && presetId !== "") {
          const add = mixValues(presetId, item.strength, null);
          const nextTweak: PartialParamValues = { ...item.tweak };
          for (const p of PARAMS) {
            if (add[p.key] !== 0) {
              nextTweak[p.key] = (nextTweak[p.key] ?? 0) + add[p.key];
            }
          }
          nextItem = { ...item, tweak: nextTweak };
          targetScrollId = item.preset;
        } else {
          nextItem = { ...item, preset: presetId, tweak: {} };
          targetScrollId = presetId;
        }
        const copy = [...prev];
        copy[selectedIndex] = nextItem;
        return copy;
      });

      if (!combine && presetId !== "") {
        const targetCategoryId = CATEGORY_ID_BY_PRESET[presetId];
        if (targetCategoryId != null) {
          setOpenCategories((prev) => {
            if (prev.has(targetCategoryId)) return prev;
            const next = new Set(prev);
            next.add(targetCategoryId);
            return next;
          });
        }
      }

      if (scrollIntoView) {
        window.requestAnimationFrame(() => {
          const btn = presetButtonRefs.current.get(targetScrollId);
          if (btn != null && !btn.hidden) {
            btn.scrollIntoView({ block: "nearest" });
          }
        });
      }
    },
    [selectedIndex],
  );

  const stepPreset = useCallback(
    (direction: 1 | -1) => {
      if (currentItem == null) return;
      const ids = filterState.orderedVisibleIds;
      if (ids.length === 0) return;
      const at = ids.indexOf(currentItem.preset);
      const nextIdx =
        at < 0
          ? direction > 0
            ? 0
            : ids.length - 1
          : (at + direction + ids.length) % ids.length;
      choosePreset(ids[nextIdx], false, true);
    },
    [choosePreset, currentItem, filterState.orderedVisibleIds],
  );

  const updateStrength = useCallback(
    (nextStrength: number) => {
      if (selectedIndex < 0) return;
      setItems((prev) => {
        const item = prev[selectedIndex];
        if (item == null) return prev;
        const copy = [...prev];
        copy[selectedIndex] = { ...item, strength: nextStrength };
        return copy;
      });
    },
    [selectedIndex],
  );

  const updateSlider = useCallback(
    (key: ParamKey, numericValue: number) => {
      if (selectedIndex < 0) return;
      setItems((prev) => {
        const item = prev[selectedIndex];
        if (item == null) return prev;
        const base = mixValues(item.preset, item.strength, null)[key];
        const copy = [...prev];
        copy[selectedIndex] = {
          ...item,
          tweak: {
            ...item.tweak,
            [key]: numericValue - base,
          },
        };
        return copy;
      });
    },
    [selectedIndex],
  );

  const resetSliderTweak = useCallback(
    (key: ParamKey) => {
      if (selectedIndex < 0) return;
      setItems((prev) => {
        const item = prev[selectedIndex];
        if (item == null || item.tweak[key] === undefined) return prev;
        const nextTweak: PartialParamValues = { ...item.tweak };
        delete nextTweak[key];
        const copy = [...prev];
        copy[selectedIndex] = { ...item, tweak: nextTweak };
        return copy;
      });
    },
    [selectedIndex],
  );

  const resetCurrentPhoto = useCallback(() => {
    if (selectedIndex < 0) return;
    setItems((prev) => {
      const item = prev[selectedIndex];
      if (item == null) return prev;
      const copy = [...prev];
      copy[selectedIndex] = {
        ...item,
        preset: "",
        strength: 100,
        tweak: {},
      };
      return copy;
    });
  }, [selectedIndex]);

  const applyToAllPhotos = useCallback(() => {
    if (currentItem == null || items.length <= 1) return;
    setItems((prev) =>
      prev.map((other) => ({
        ...other,
        preset: currentItem.preset,
        strength: currentItem.strength,
        tweak: { ...currentItem.tweak },
      })),
    );
    setStatusText(`Applied settings to all ${items.length} photos.`);
  }, [currentItem, items.length]);

  const removeCurrentPhoto = useCallback(() => {
    if (selectedIndex < 0 || busy) return;
    setItems((prev) => {
      const target = prev[selectedIndex];
      if (target != null) {
        target.photo.bitmap.close();
        loadedPhotosRef.current.delete(target.photo);
      }
      const next = prev.filter((_, idx) => idx !== selectedIndex);
      setSelectedIndex((prevIdx) => {
        if (next.length === 0) return -1;
        return Math.min(prevIdx, next.length - 1);
      });
      setStatusText(
        next.length === 0
          ? "Removed photo."
          : `${next.length} photo(s) loaded.`,
      );
      return next;
    });
  }, [busy, selectedIndex]);

  const runExport = useCallback(
    async (targets: readonly PhotoItem[]) => {
      if (busy || targets.length === 0) return;
      setBusy(true);
      let done = 0;
      let copies = 0;
      try {
        for (const item of targets) {
          const label =
            targets.length > 1
              ? `${item.photo.name} (${done + 1} of ${targets.length})`
              : item.photo.name;
          const values = mixValues(item.preset, item.strength, item.tweak);
          const result = await exportPhoto(
            item.photo,
            values,
            jpegQuality,
            (fraction) => {
              setStatusText(
                `Exporting ${label}: ${Math.round(fraction * 100)}%`,
              );
            },
          );
          triggerDownload(result.blob, exportName(item.photo.name));
          if (result.copy) copies++;
          done++;
          if (targets.length > 1) {
            await new Promise<void>((resolve) => {
              window.setTimeout(resolve, 350);
            });
          }
        }
        setStatusText(
          `Exported ${done} photo(s).${
            copies > 0
              ? ` ${copies} had no change, so the file is an exact copy of the original.`
              : ""
          }`,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed.";
        setStatusText(`Export stopped: ${message}`);
      } finally {
        setBusy(false);
      }
    },
    [busy, jpegQuality],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (currentItem == null || selectedIndex < 0) return;
      if (currentValues.band === 0 && currentValues.spot === 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      const base = mixValues(currentItem.preset, currentItem.strength, null);
      const nextFocusX = Math.round((fx - 0.5) * 200) - base.focus_x;
      const nextFocusY = Math.round((0.5 - fy) * 200) - base.focus_y;

      setItems((prev) => {
        const item = prev[selectedIndex];
        if (item == null) return prev;
        const copy = [...prev];
        copy[selectedIndex] = {
          ...item,
          tweak: {
            ...item.tweak,
            focus_x: nextFocusX,
            focus_y: nextFocusY,
          },
        };
        return copy;
      });
    },
    [currentItem, currentValues.band, currentValues.spot, selectedIndex],
  );

  // Global keyboard shortcuts & window drag-and-drop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector("dialog[open]") != null) return;
      const themeMenu = document.getElementById("theme-menu");
      if (themeMenu != null && !themeMenu.hidden) return;

      const target = e.target;
      if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) {
        return;
      }
      if (target instanceof HTMLInputElement) {
        if (
          target.type === "search" ||
          target.type === "text" ||
          (target.type === "range" && e.key.startsWith("Arrow"))
        ) {
          return;
        }
      }
      if (currentItem == null) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        stepPreset(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        stepPreset(-1);
      } else if (e.key === "ArrowRight") {
        if (items.length > 1) {
          e.preventDefault();
          setSelectedIndex((idx) => (idx + 1) % items.length);
        }
      } else if (e.key === "ArrowLeft") {
        if (items.length > 1) {
          e.preventDefault();
          setSelectedIndex((idx) => (idx - 1 + items.length) % items.length);
        }
      } else if (e.key === "b" || e.key === "B") {
        setComparing(true);
      } else if (e.key === "0") {
        choosePreset("", false, true);
      } else if (e.key === "e" || e.key === "E") {
        void runExport([currentItem]);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "b" || e.key === "B") {
        setComparing(false);
      }
    };

    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current += 1;
      setIsDraggingFiles(true);
    };

    const onDragLeave = () => {
      dragDepthRef.current -= 1;
      if (dragDepthRef.current <= 0) {
        dragDepthRef.current = 0;
        setIsDraggingFiles(false);
      }
    };

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);
      if (e.dataTransfer != null && e.dataTransfer.files.length > 0) {
        void addFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [addFiles, choosePreset, currentItem, items.length, runExport, stepPreset]);

  // Optional `?tab=<id>&demo=<same-origin-path>&preset=<id>` startup support
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get("tab");
    if (isValidTabId(initialTab)) {
      setActiveTab(initialTab);
    }

    const demoPath = params.get("demo");
    if (demoPath == null || demoPath === "" || /^[a-z]+:|^\/\//i.test(demoPath)) {
      return;
    }

    const initialPreset = params.get("preset") ?? "";
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(demoPath);
        if (!res.ok) {
          throw new Error("Demo fetch failed");
        }
        const blob = await res.blob();
        const filename = demoPath.split("/").pop() ?? "demo.jpg";
        const photo = await loadPhoto(
          new File([blob], filename, { type: blob.type }),
          filename,
        );
        if (cancelled) {
          photo.bitmap.close();
          return;
        }
        loadedPhotosRef.current.add(photo);
        const validPreset =
          initialPreset !== "" && PRESET_BY_ID[initialPreset] != null
            ? initialPreset
            : "";
        if (validPreset !== "") {
          const initialCategoryId = CATEGORY_ID_BY_PRESET[validPreset];
          if (initialCategoryId != null) {
            setOpenCategories((prev) => {
              if (prev.has(initialCategoryId)) return prev;
              const next = new Set(prev);
              next.add(initialCategoryId);
              return next;
            });
          }
        }
        setItems([{ photo, preset: validPreset, strength: 100, tweak: {} }]);
        setSelectedIndex(0);
        setStatusText("1 photo(s) loaded.");
      } catch {
        if (!cancelled) {
          setStatusText("The demo photo did not load.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const isFocusInteractive =
    currentItem != null && (currentValues.band > 0 || currentValues.spot > 0);
  const activePresetLabel =
    currentItem != null && currentItem.preset !== ""
      ? (PRESET_BY_ID[currentItem.preset]?.label ?? "No preset")
      : "No preset";

  const compactBtnClass =
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border border-border-control bg-surface px-2.5 font-sans text-xs font-semibold leading-4 tracking-[0.02em] text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-45";
  const compactPrimaryBtnClass =
    "inline-flex h-8 items-center justify-center gap-1.5 rounded-sm border border-primary bg-primary px-3 font-sans text-xs font-semibold leading-4 tracking-[0.02em] text-on-primary transition-colors duration-150 ease-out hover:bg-primary-hover disabled:pointer-events-none disabled:opacity-45";

  return (
    <div className="photo-editor-shell flex flex-col border-b border-border-subtle bg-surface font-sans text-sm text-foreground lg:h-[calc(100dvh-4.1rem)] lg:min-h-[600px]">
      {/* Studio Workspace Top Bar (`32px` compact controls, `--font-sans` / `--font-mono`) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-subtle bg-surface px-3.5 py-2">
        <h1 className="!m-0 !font-sans !text-base !font-semibold !leading-6 !tracking-normal text-foreground">
          Photo Editor
        </h1>
        <span className="text-xs leading-4 text-foreground-muted">
          Photos stay in this browser tab. Nothing is uploaded.
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={compactPrimaryBtnClass}
        >
          Add photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files != null && e.target.files.length > 0) {
              void addFiles(e.target.files);
            }
            e.target.value = "";
          }}
        />
      </div>

      {/* Main 3-Column Studio Workbench (stacked stage + tabbed panels below `lg`) */}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[320px_minmax(0,1fr)_330px] xl:grid-cols-[340px_minmax(0,1fr)_340px]">
        {/* Column 1: Preset Library */}
        <section
          aria-label="Presets"
          className={`order-3 min-h-0 flex-col border-border-subtle bg-surface lg:order-1 lg:flex lg:border-r ${
            mobilePane === "presets" ? "flex max-h-[520px] lg:max-h-none" : "hidden"
          }`}
        >
          <div className="border-b border-border-subtle p-2.5">
            <div
              role="group"
              aria-label="Preset type"
              className="mb-2 flex flex-wrap gap-1.5"
            >
              {TABS.map((tab) => {
                const pressed = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex h-7 items-center rounded-pill border px-2.5 text-xs font-semibold leading-4 transition-colors duration-150 ease-out ${
                      pressed
                        ? "border-primary bg-primary text-on-primary"
                        : "border-border-control bg-background text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search presets, e.g. sunset, skin, haze"
              aria-label="Search presets"
              className="h-8 w-full rounded-sm border border-border-control bg-background px-2.5 text-xs text-foreground placeholder:text-foreground-muted"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-2 pb-5">
            <button
              ref={(el) => {
                if (el != null) presetButtonRefs.current.set("", el);
                else presetButtonRefs.current.delete("");
              }}
              type="button"
              aria-pressed={currentItem?.preset === "" || currentItem == null}
              onClick={() => choosePreset("", false)}
              className={`mb-1.5 flex w-full items-center gap-2 rounded-sm border p-1.5 text-left transition-colors duration-150 ease-out ${
                currentItem?.preset === ""
                  ? "border-primary bg-primary-soft/50 ring-1 ring-primary"
                  : "border-border-subtle bg-background hover:bg-surface-hover"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-xs font-semibold leading-4 text-foreground">
                  No preset
                </span>
                <span className="block text-xs leading-4 text-foreground-muted">
                  The photo as it is, plus your slider changes.
                </span>
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const catVisible = filterState.visibleCategoryIds.has(cat.id);
              const matchCount = filterState.matchCountByCategory[cat.id] ?? 0;
              const isCollapsedInSearch =
                searchCollapsed.query === query &&
                searchCollapsed.ids.has(cat.id);
              const isExpanded = filterState.isSearching
                ? catVisible && !isCollapsedInSearch
                : openCategories.has(cat.id);
              const hasActivePreset =
                currentItem != null &&
                currentItem.preset !== "" &&
                CATEGORY_ID_BY_PRESET[currentItem.preset] === cat.id;
              const panelId = `preset-cat-${cat.id}`;

              return (
                <div
                  key={cat.id}
                  hidden={!catVisible}
                  className="border-t border-border-subtle py-1"
                >
                  <h2 className="!m-0 !text-xs !font-normal !leading-4 !tracking-normal">
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() => toggleCategory(cat.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-1 py-1 text-left transition-colors duration-150 ease-out hover:bg-surface-hover"
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.25}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className={`shrink-0 text-foreground-muted transition-transform duration-150 ease-out ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        <span
                          className={`truncate font-mono text-[11px] font-semibold leading-4 tracking-[0.06em] uppercase ${
                            hasActivePreset && !isExpanded
                              ? "text-primary"
                              : "text-foreground-muted"
                          }`}
                        >
                          {cat.title}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        {hasActivePreset && !isExpanded && (
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                          />
                        )}
                        <span className="font-mono text-[11px] leading-4 text-foreground-muted tabular-nums">
                          {matchCount}
                        </span>
                      </span>
                    </button>
                  </h2>

                  <div id={panelId} hidden={!isExpanded} className="pt-0.5 pb-1">
                    <p className="mt-0 mb-1.5 px-1 text-xs leading-4 text-foreground-muted">
                      {cat.blurb}
                    </p>
                    {cat.presets.map((preset) => {
                      const visible = filterState.visiblePresetIds.has(
                        preset.id,
                      );
                      const isSelected = currentItem?.preset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          ref={(el) => {
                            if (el != null) {
                              presetButtonRefs.current.set(preset.id, el);
                            } else {
                              presetButtonRefs.current.delete(preset.id);
                            }
                          }}
                          type="button"
                          hidden={!visible}
                          aria-pressed={isSelected}
                          title={`${preset.does} Watch for: ${preset.watch}`}
                          onClick={(e) =>
                            choosePreset(preset.id, e.shiftKey || combineNext)
                          }
                          className={`mb-1.5 flex w-full items-center gap-2.5 rounded-sm border p-1.5 text-left transition-colors duration-150 ease-out ${
                            isSelected
                              ? "border-primary bg-primary-soft/55 ring-1 ring-primary"
                              : "border-border-subtle bg-background hover:bg-surface-hover"
                          }`}
                        >
                          <canvas
                            ref={(el) => {
                              if (el != null) {
                                presetCanvasRefs.current.set(preset.id, el);
                              } else {
                                presetCanvasRefs.current.delete(preset.id);
                              }
                            }}
                            width={96}
                            height={54}
                            className="h-[45px] w-[80px] shrink-0 rounded-[calc(var(--theme-radius-sm)-2px)] border border-border-subtle bg-surface-sunken xl:h-[54px] xl:w-[96px]"
                          />
                          <span className="min-w-0">
                            <span className="block text-xs font-semibold leading-4 text-foreground">
                              {preset.label}
                            </span>
                            <span className="mt-0.5 block text-xs leading-4 text-foreground-muted">
                              {preset.when}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!filterState.hasAnyMatch && (
              <p className="px-1 py-3 text-xs leading-5 text-foreground-muted">
                No preset matches. Try a different word or select the &ldquo;All&rdquo;
                tab.
              </p>
            )}
          </div>
        </section>

        {/* Column 2: Studio Photo Canvas Well, Action Toolbar & Filmstrip */}
        <section
          aria-label="Photo"
          className="order-1 flex min-h-[340px] flex-1 flex-col bg-surface-sunken lg:order-2 lg:min-h-0"
        >
          <div
            className={`relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden p-3 lg:min-h-0 ${
              isDraggingFiles
                ? "outline-3 -outline-offset-8 outline-dashed outline-primary"
                : ""
            }`}
          >
            {activePhoto != null ? (
              <canvas
                key={`${activePhoto.id}-${activePhoto.colorSpace}`}
                ref={previewCanvasRef}
                role="img"
                aria-label={`Preview of ${activePhoto.name}`}
                onClick={handleCanvasClick}
                className={`max-h-full max-w-full rounded-sm shadow-md ${
                  isFocusInteractive ? "cursor-crosshair" : ""
                }`}
              />
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="max-w-lg rounded-lg border-2 border-dashed border-border-control bg-surface/75 px-8 py-10 text-center transition-colors duration-150 ease-out hover:bg-surface"
              >
                <strong className="mb-1.5 block text-base font-semibold text-foreground">
                  Drop photos here or click to browse
                </strong>
                <span className="block text-xs leading-5 text-foreground-muted">
                  JPEG keeps all EXIF, GPS, XMP, IPTC, and colour-profile metadata
                  on export. PNG and WebP load cleanly and export as JPEG without
                  metadata.
                </span>
              </button>
            )}

            {comparing && activePhoto != null && (
              <div className="pointer-events-none absolute top-4 left-4 rounded-pill border border-border-control bg-surface/92 px-2.5 py-1 font-mono text-xs font-semibold text-foreground shadow-sm backdrop-blur-xs">
                Original
              </div>
            )}
          </div>

          {/* Stage Action Bar */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle bg-surface px-2.5 py-1.5">
            <button
              ref={holdButtonRef}
              type="button"
              disabled={currentItem == null || busy}
              title="Hold to see the original (key: B)"
              onPointerDown={(e) => {
                lastPointerWasTouchRef.current = e.pointerType === "touch";
                if (currentItem == null) return;
                if (e.pointerType === "touch") {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    // Synthetic test events may not carry an active pointerId.
                  }
                }
                setComparing(true);
              }}
              onPointerUp={() => setComparing(false)}
              onPointerLeave={(e) => {
                if (e.pointerType !== "touch") {
                  setComparing(false);
                }
              }}
              onPointerCancel={() => setComparing(false)}
              onLostPointerCapture={() => setComparing(false)}
              onContextMenu={(e) => {
                if (
                  lastPointerWasTouchRef.current ||
                  window.matchMedia("(pointer: coarse)").matches
                ) {
                  e.preventDefault();
                }
              }}
              onBlur={() => setComparing(false)}
              onKeyDown={(e) => {
                if ((e.key === " " || e.key === "Enter") && currentItem != null) {
                  setComparing(true);
                }
              }}
              onKeyUp={() => setComparing(false)}
              className={`${compactBtnClass} pointer-coarse:touch-none pointer-coarse:select-none pointer-coarse:[-webkit-touch-callout:none] pointer-coarse:[-webkit-user-select:none]`}
            >
              Hold: original
            </button>
            <button
              type="button"
              disabled={items.length <= 1}
              aria-label="Previous photo"
              onClick={() =>
                setSelectedIndex((idx) => (idx - 1 + items.length) % items.length)
              }
              className={`${compactBtnClass} !px-2`}
            >
              &#9664;
            </button>
            <button
              type="button"
              disabled={items.length <= 1}
              aria-label="Next photo"
              onClick={() => setSelectedIndex((idx) => (idx + 1) % items.length)}
              className={`${compactBtnClass} !px-2`}
            >
              &#9654;
            </button>
            {currentItem != null && (
              <button
                type="button"
                disabled={busy}
                onClick={removeCurrentPhoto}
                title="Remove current photo from this session"
                className={`${compactBtnClass} !px-2`}
              >
                Remove
              </button>
            )}

            <span
              role="status"
              aria-live="polite"
              className="min-h-4 truncate text-xs leading-4 text-foreground-muted tabular-nums"
            >
              {statusText}
            </span>

            <span className="flex-1" />

            <label
              htmlFor="jpeg-quality-select"
              className="text-xs leading-4 text-foreground-muted"
            >
              <span className="hidden 2xl:inline">JPEG </span>Quality
            </label>
            <div className="relative inline-flex items-center">
              <select
                id="jpeg-quality-select"
                value={String(jpegQuality)}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  if (Number.isFinite(parsed)) {
                    setJpegQuality(parsed);
                  }
                }}
                className="h-8 cursor-pointer appearance-none rounded-sm border border-border-control bg-surface py-0 pr-7 pl-2.5 font-mono text-xs font-semibold leading-4 text-foreground tabular-nums transition-colors duration-150 ease-out hover:bg-surface-hover"
              >
                <option value="0.92" className="bg-surface text-foreground">
                  92
                </option>
                <option value="0.95" className="bg-surface text-foreground">
                  95
                </option>
                <option value="1" className="bg-surface text-foreground">
                  100
                </option>
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="pointer-events-none absolute right-2 text-foreground-muted"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <button
              type="button"
              disabled={currentItem == null || busy}
              onClick={() => void runExport(items)}
              className={`${compactBtnClass} tabular-nums`}
            >
              Export all ({items.length})
            </button>
            <button
              type="button"
              disabled={currentItem == null || busy}
              onClick={() => {
                if (currentItem != null) {
                  void runExport([currentItem]);
                }
              }}
              className={compactPrimaryBtnClass}
            >
              Export photo
            </button>
          </div>

          {/* Loaded Photos Filmstrip */}
          {items.length > 0 && (
            <div
              aria-label="Loaded photos"
              className="flex gap-1.5 overflow-x-auto border-t border-border-subtle bg-surface px-2.5 py-1.5"
            >
              {items.map((item, idx) => {
                const isActive = idx === selectedIndex;
                const edited = !isNeutral(
                  mixValues(item.preset, item.strength, item.tweak),
                );
                return (
                  <button
                    key={item.photo.id}
                    type="button"
                    title={item.photo.name}
                    aria-label={`Photo ${item.photo.name}`}
                    aria-current={isActive ? "true" : "false"}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative shrink-0 rounded-sm border-2 p-0 leading-none transition-colors duration-150 ease-out ${
                      isActive
                        ? "border-primary ring-1 ring-primary"
                        : "border-transparent hover:border-border-control"
                    }`}
                  >
                    <FilmstripThumb photo={item.photo} />
                    {edited && (
                      <span
                        aria-label="Edited"
                        className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full border border-surface bg-status-success"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mobile/Tablet Panel Switcher (`< lg` only) */}
          <div
            role="tablist"
            aria-label="Mobile workspace panel"
            className="grid grid-cols-2 border-t border-border-subtle bg-surface p-1.5 gap-1.5 lg:hidden"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mobilePane === "presets"}
              onClick={() => setMobilePane("presets")}
              className={
                mobilePane === "presets" ? compactPrimaryBtnClass : compactBtnClass
              }
            >
              Presets (135)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mobilePane === "adjust"}
              onClick={() => setMobilePane("adjust")}
              className={
                mobilePane === "adjust" ? compactPrimaryBtnClass : compactBtnClass
              }
            >
              Adjustments &amp; EXIF
            </button>
          </div>
        </section>

        {/* Column 3: Expert Sliders, Metadata Inspector & Keyboard Reference */}
        <section
          aria-label="Adjustments"
          className={`order-4 min-h-0 overflow-y-auto border-border-subtle bg-surface px-3 pt-2.5 pb-6 lg:order-3 lg:block lg:border-l ${
            mobilePane === "adjust" ? "block max-h-[560px] lg:max-h-none" : "hidden"
          }`}
        >
          {/* Active Preset & Strength Card */}
          <div className="rounded-md border border-border-subtle bg-background p-2.5">
            <p className="m-0 text-xs font-semibold leading-4 text-foreground">
              {activePresetLabel}
              {hasManualTweaks ? " + your changes" : ""}
            </p>

            <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-x-2">
              <label
                htmlFor="preset-strength-range"
                className="text-xs leading-4 text-foreground"
              >
                Preset strength
              </label>
              <output
                htmlFor="preset-strength-range"
                className="min-w-9 text-right font-mono text-xs leading-4 text-foreground-muted tabular-nums"
              >
                {currentItem?.strength ?? 100}%
              </output>
              <input
                id="preset-strength-range"
                type="range"
                min={0}
                max={150}
                step={5}
                value={currentItem?.strength ?? 100}
                disabled={currentItem == null || currentItem.preset === ""}
                onChange={(e) => {
                  const parsed = Number(e.target.value);
                  if (Number.isFinite(parsed)) {
                    updateStrength(parsed);
                  }
                }}
                className="col-span-2 mt-1 w-full accent-primary disabled:opacity-45"
              />
            </div>

            <label className="mt-2 flex items-center gap-2 text-xs leading-4 text-foreground">
              <input
                type="checkbox"
                checked={combineNext}
                onChange={(e) => setCombineNext(e.target.checked)}
                className="h-3.5 w-3.5 rounded-sm border-border-control accent-primary"
              />
              <span>Combine: add the next preset to these settings</span>
            </label>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={currentItem == null || busy}
                onClick={resetCurrentPhoto}
                className={compactBtnClass}
              >
                Reset photo
              </button>
              <button
                type="button"
                disabled={items.length <= 1 || currentItem == null}
                title="Use these settings on each loaded photo"
                onClick={applyToAllPhotos}
                className={compactBtnClass}
              >
                Apply to all photos
              </button>
            </div>
          </div>

          <h2 className="mt-4 mb-0.5 !font-mono !text-[11px] !font-semibold !leading-4 !tracking-[0.06em] text-foreground-muted uppercase">
            Expert settings
          </h2>
          <p className="mt-0 mb-2 text-xs leading-4 text-foreground-muted">
            A preset is a mix of these sliders. Move a slider to fine-tune.
            Double-click a slider to undo your change.
          </p>

          {/* 7 Collapsible Slider Groups */}
          <div>
            {GROUPS.map((group) => {
              const inUse = activeGroupCounts[group.id] ?? 0;
              const groupParams = ORDERED_PARAMS_BY_GROUP[group.id];
              return (
                <details
                  key={group.id}
                  open={group.open}
                  className="border-t border-border-subtle py-1.5"
                >
                  <summary className="cursor-pointer py-0.5 text-xs font-semibold leading-5 text-foreground">
                    {group.title}{" "}
                    {inUse > 0 && (
                      <span className="font-mono text-[11px] font-medium text-primary tabular-nums">
                        ({inUse} in use)
                      </span>
                    )}
                  </summary>

                  {group.id === "focus" && (
                    <p className="mt-1 mb-1 text-xs leading-4 text-foreground-muted">
                      When a focus blur is on, click the photo to put the sharp
                      area there.
                    </p>
                  )}

                  {group.id === "mixer" && (
                    <p className="mt-1 mb-1.5 text-xs leading-4 text-foreground-muted">
                      Changes one colour band at a time. Columns: colour,
                      brightness, and hue.
                    </p>
                  )}

                  <div
                    className={
                      group.id === "mixer"
                        ? "grid grid-cols-[1.25fr_1fr_1fr] gap-x-2.5"
                        : ""
                    }
                  >
                    {groupParams.map((param) => {
                      const val = currentValues[param.key];
                      const isManuallyChanged =
                        currentItem != null &&
                        val !== basePresetValues[param.key];
                      const inputId = `slider-${param.key}`;
                      return (
                        <div
                          key={param.key}
                          className={`grid grid-cols-[1fr_auto] items-center gap-x-2 ${
                            group.id === "mixer" ? "mt-1.5" : "mt-2"
                          }`}
                        >
                          <label
                            htmlFor={inputId}
                            aria-label={param.band ? param.label : undefined}
                            title={param.more}
                            onDoubleClick={() => resetSliderTweak(param.key)}
                            className={`text-xs leading-4 ${
                              param.band ? "whitespace-nowrap" : ""
                            } ${
                              isManuallyChanged
                                ? "font-semibold text-primary"
                                : "text-foreground"
                            }`}
                          >
                            {param.band != null && (
                              <span
                                aria-hidden="true"
                                className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                                style={{
                                  backgroundColor: BAND_CSS_BY_ID[param.band],
                                }}
                              />
                            )}
                            {param.band != null
                              ? mixerShortLabel(param)
                              : param.label}
                          </label>
                          <output
                            htmlFor={inputId}
                            className="min-w-8 text-right font-mono text-[11px] leading-4 text-foreground-muted tabular-nums"
                          >
                            {val > 0 ? `+${val}` : String(val)}
                          </output>
                          <input
                            id={inputId}
                            type="range"
                            min={param.min}
                            max={param.max}
                            step={1}
                            value={val}
                            disabled={currentItem == null}
                            title={param.more}
                            onChange={(e) => {
                              const parsed = Number(e.target.value);
                              if (Number.isFinite(parsed)) {
                                updateSlider(param.key, parsed);
                              }
                            }}
                            onDoubleClick={() => resetSliderTweak(param.key)}
                            className="col-span-2 mt-0.5 w-full accent-primary disabled:opacity-45"
                          />
                          {param.hint !== "" && (
                            <span className="col-span-2 mt-0.5 text-[11.5px] leading-4 text-foreground-muted">
                              {param.hint}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>

          {/* Declarative JPEG Metadata Inspector */}
          <h2 className="mt-4 mb-1 !font-mono !text-[11px] !font-semibold !leading-4 !tracking-[0.06em] text-foreground-muted uppercase">
            Metadata kept on export
          </h2>
          <div className="rounded-md border border-border-subtle bg-background p-2.5 text-xs leading-4">
            {activePhoto == null ? (
              <p className="m-0 text-foreground-muted">
                Load a photo to see its metadata.
              </p>
            ) : !activePhoto.isJpeg || activePhoto.meta == null ? (
              <>
                <dl className="m-0">
                  <dt className="text-[11px] text-foreground-muted">File</dt>
                  <dd className="m-0 font-mono break-all text-foreground tabular-nums">
                    {activePhoto.name} &middot; {activePhoto.width} &times;{" "}
                    {activePhoto.height}
                  </dd>
                </dl>
                <p className="mt-2 mb-0 rounded-sm bg-accent-soft px-2 py-1.5 text-xs leading-4 text-on-accent-soft">
                  This file is not a JPEG. The export is a JPEG with no metadata.
                </p>
              </>
            ) : (
              <MetadataDetails photo={activePhoto} />
            )}
          </div>

          {/* Keyboard Reference */}
          <h2 className="mt-4 mb-1 !font-mono !text-[11px] !font-semibold !leading-4 !tracking-[0.06em] text-foreground-muted uppercase">
            Keys
          </h2>
          <p className="m-0 text-xs leading-6 text-foreground-muted">
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              &uarr;
            </kbd>{" "}
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              &darr;
            </kbd>{" "}
            previous or next preset &nbsp;{" "}
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              &larr;
            </kbd>{" "}
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              &rarr;
            </kbd>{" "}
            previous or next photo
            <br />
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              B
            </kbd>{" "}
            hold for original &nbsp;{" "}
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              0
            </kbd>{" "}
            no preset &nbsp;{" "}
            <kbd className="rounded-sm border border-border-control bg-background px-1 py-0.5 text-[11px] text-foreground">
              E
            </kbd>{" "}
            export photo
          </p>
        </section>
      </div>
    </div>
  );
}

function MetadataDetails({
  photo,
}: {
  readonly photo: LoadedPhoto;
}): React.JSX.Element | null {
  const m = photo.meta;
  if (m == null) return null;

  const blockKinds = [
    m.exif ? "EXIF" : null,
    m.xmp ? "XMP" : null,
    m.iptc ? "IPTC" : null,
    m.comment ? "comment" : null,
  ]
    .filter((v): v is string => v != null)
    .join(", ");

  const notes: string[] = [];
  if (m.gps && !m.gpsEmpty) {
    notes.push(
      "Remove the location in another tool before you share the file, if you do not want to share it.",
    );
  }
  if (m.iccKind === "other") {
    notes.push(
      "The browser converts this colour profile to sRGB. The export does not carry the old profile.",
    );
  }
  if (m.motion) {
    notes.push(
      "This is a Motion Photo. The export is a still photo without the video.",
    );
  }
  if (m.extraImages) {
    notes.push(
      "Extra embedded images, such as an HDR gain map, are not copied. The export is a normal SDR photo.",
    );
  }
  if (m.orientation > 1) {
    notes.push("The export saves the pixels upright and sets Orientation to 1.");
  }

  return (
    <>
      <dl className="m-0 space-y-1.5">
        <div>
          <dt className="text-[11px] text-foreground-muted">File</dt>
          <dd className="m-0 font-mono break-all text-foreground tabular-nums">
            {photo.name} &middot; {photo.width} &times; {photo.height}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-foreground-muted">Camera</dt>
          <dd className="m-0 text-foreground">{m.camera || "Not recorded"}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-foreground-muted">Date</dt>
          <dd className="m-0 font-mono text-foreground tabular-nums">
            {m.taken || "Not recorded"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-foreground-muted">Location (GPS)</dt>
          <dd className="m-0 text-foreground">
            {!m.gps ? (
              "Not recorded"
            ) : m.gpsEmpty ? (
              "A location block with no position. Kept as it is."
            ) : (
              <>
                Present. <strong className="font-semibold">The export keeps it.</strong>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-foreground-muted">Colour profile</dt>
          <dd className="m-0 text-foreground">
            {m.icc
              ? `${m.icc}${m.iccKind === "other" ? "" : ". Kept."}`
              : "None (sRGB)"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-foreground-muted">Blocks copied</dt>
          <dd className="m-0 text-foreground tabular-nums">
            {blockKinds || "None"} ({m.blocks} in total)
          </dd>
        </div>
      </dl>
      {notes.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {notes.map((note) => (
            <p
              key={note}
              className="m-0 rounded-sm bg-accent-soft px-2 py-1.5 text-xs leading-4 text-on-accent-soft"
            >
              {note}
            </p>
          ))}
        </div>
      )}
    </>
  );
}
