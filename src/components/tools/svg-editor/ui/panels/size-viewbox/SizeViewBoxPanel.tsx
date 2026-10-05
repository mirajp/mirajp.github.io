import { useEffect, useRef, useState } from "react";
import type { EditorState, SvgDocument } from "../../../contracts";
import { parseLength } from "../../../core/units";
import { fromPx } from "../../../core/units";
import type { AbsoluteLengthUnit } from "../../../core/units";
import {
  effectiveSize,
  effectiveViewBox,
  setPreserveAspectRatio,
  setSize,
  setViewBox,
} from "../../../core/commands/geometry";
import type { EditorStoreWithLink } from "../../../state/createEditorStore";
import { useEditorStore } from "../../useEditorStore";

export interface SizeViewBoxPanelProps {
  store: EditorStoreWithLink;
  bounds?: { x: number; y: number; width: number; height: number };
  parentSize?: { width: number; height: number };
}

interface Draft {
  width: string;
  height: string;
  unit: AbsoluteLengthUnit | "%";
  lockAspect: boolean;
  minX: string;
  minY: string;
  viewBoxWidth: string;
  viewBoxHeight: string;
  keepDisplaySize: boolean;
  preserveAspectRatio: string;
}

interface InputErrors {
  size?: string;
  viewBox?: string;
}

const UNIT_OPTIONS: Array<{ value: Draft["unit"]; label: string }> = [
  { value: "px", label: "px" },
  { value: "pt", label: "pt" },
  { value: "pc", label: "pc" },
  { value: "mm", label: "mm" },
  { value: "cm", label: "cm" },
  { value: "in", label: "in" },
  { value: "%", label: "%" },
];

const ASPECT_HINTS: Record<string, string> = {
  none: "Stretch the drawing to fill the viewport.",
  xMinYMin: "Keep its shape and pin it to the top left.",
  xMidYMin: "Keep its shape and center it along the top.",
  xMaxYMin: "Keep its shape and pin it to the top right.",
  xMinYMid: "Keep its shape and center it along the left.",
  xMidYMid: "Keep its shape and center it in the viewport.",
  xMaxYMid: "Keep its shape and center it along the right.",
  xMinYMax: "Keep its shape and pin it to the bottom left.",
  xMidYMax: "Keep its shape and center it along the bottom.",
  xMaxYMax: "Keep its shape and pin it to the bottom right.",
};

const ASPECT_POSITIONS: Record<string, string> = {
  xMinYMin: "Top left",
  xMidYMin: "Top center",
  xMaxYMin: "Top right",
  xMinYMid: "Left center",
  xMidYMid: "Center",
  xMaxYMid: "Right center",
  xMinYMax: "Bottom left",
  xMidYMax: "Bottom center",
  xMaxYMax: "Bottom right",
};

const ALIGNMENTS = Object.keys(ASPECT_HINTS);

function selectDocument(state: EditorState): SvgDocument | null {
  return state.document;
}

function readDraft(
  document: SvgDocument | null,
  bounds: SizeViewBoxPanelProps["bounds"],
  parentSize: SizeViewBoxPanelProps["parentSize"],
): Draft {
  if (!document) {
    return {
      width: "",
      height: "",
      unit: "px",
      lockAspect: false,
      minX: "",
      minY: "",
      viewBoxWidth: "",
      viewBoxHeight: "",
      keepDisplaySize: false,
      preserveAspectRatio: "xMidYMid meet",
    };
  }
  const root = document?.nodes.get(document.root);
  const attrs = root?.kind === "element" ? root.attrs : {};
  const viewBox = effectiveViewBox(document, bounds);
  const size = effectiveSize(document, { bounds, parent: parentSize });
  const widthUnit = unitFrom(attrs.width);
  const unit = widthUnit;
  const viewBoxValue =
    viewBox.kind === "known" ? viewBox : { x: 0, y: 0, width: 0, height: 0 };
  const widthNeedsConversion =
    attrs.width === undefined || unitFrom(attrs.width) !== unit;
  const heightNeedsConversion =
    attrs.height === undefined || unitFrom(attrs.height) !== unit;

  return {
    width: widthNeedsConversion
      ? size.kind === "known"
        ? displayValue(size.width, unit, "width", document, bounds, parentSize)
        : ""
      : numericPart(attrs.width),
    height: heightNeedsConversion
      ? size.kind === "known"
        ? displayValue(
            size.height,
            unit,
            "height",
            document,
            bounds,
            parentSize,
          )
        : ""
      : numericPart(attrs.height),
    unit,
    lockAspect: false,
    minX: String(viewBoxValue.x),
    minY: String(viewBoxValue.y),
    viewBoxWidth: viewBox.kind === "known" ? String(viewBox.width) : "",
    viewBoxHeight: viewBox.kind === "known" ? String(viewBox.height) : "",
    keepDisplaySize: false,
    preserveAspectRatio: attrs.preserveAspectRatio ?? "xMidYMid meet",
  };
}

function unitFrom(value: string | undefined): Draft["unit"] {
  const match = value?.trim().match(/(px|pt|pc|mm|cm|in|%)$/i);
  const unit = match?.[1]?.toLowerCase();
  return UNIT_OPTIONS.find((option) => option.value === unit)?.value ?? "px";
}

function numericPart(value: string): string {
  return value.trim().replace(/(?:px|pt|pc|mm|cm|in|%)$/i, "");
}

function displayValue(
  pixels: number,
  unit: Draft["unit"],
  axis: "width" | "height",
  document: SvgDocument | null,
  bounds: SizeViewBoxPanelProps["bounds"],
  parentSize: SizeViewBoxPanelProps["parentSize"],
): string {
  if (unit !== "%") {
    return String(fromPx(pixels, unit));
  }
  if (!document) return "";
  const viewBox = effectiveViewBox(document, bounds);
  const basis = parentSize
    ? parentSize[axis]
    : viewBox.kind === "known"
      ? viewBox[axis]
      : undefined;
  return basis && basis > 0 ? String((pixels / basis) * 100) : "";
}

function pixelsFromDraft(
  value: string,
  axis: "width" | "height",
  draft: Draft,
  document: SvgDocument,
  bounds: SizeViewBoxPanelProps["bounds"],
  parentSize: SizeViewBoxPanelProps["parentSize"],
): number | null {
  const source = `${value}${draft.unit}`;
  const viewBox = effectiveViewBox(document, bounds);
  const result = parseLength(source, {
    axis,
    viewBox:
      draft.unit === "%" && parentSize
        ? undefined
        : viewBox.kind === "known"
          ? viewBox
          : undefined,
    parent: parentSize,
  });
  return result.ok && result.value > 0 ? result.value : null;
}

export function SizeViewBoxPanel({
  store,
  bounds,
  parentSize,
}: SizeViewBoxPanelProps) {
  const document = useEditorStore(store, selectDocument);
  const [draft, setDraft] = useState(() =>
    readDraft(document, bounds, parentSize),
  );
  const [errors, setErrors] = useState<InputErrors>({});
  const [pendingSize, setPendingSize] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sizeOptions = useRef<{ width?: number; height?: number } | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (!dirty.current) {
      setDraft((current) => ({
        ...readDraft(document, bounds, parentSize),
        lockAspect: current.lockAspect,
        keepDisplaySize: current.keepDisplaySize,
      }));
    }
  }, [bounds, document, parentSize]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function scheduleSize(nextDraft: Draft, axis: "width" | "height") {
    if (!document) return;
    dirty.current = true;
    setErrors((current) => ({ ...current, size: undefined }));
    const pixels = pixelsFromDraft(
      nextDraft[axis],
      axis,
      nextDraft,
      document,
      bounds,
      parentSize,
    );
    if (pixels === null) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      sizeOptions.current = null;
      setPendingSize(false);
      setErrors((current) => ({
        ...current,
        size: `Enter a positive ${axis} with a resolvable unit.`,
      }));
      return;
    }

    sizeOptions.current = { [axis]: pixels };
    setPendingSize(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commitSize(nextDraft), 120);
  }

  function commitSize(nextDraft = draft) {
    if (!document || !sizeOptions.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const options = sizeOptions.current;
    sizeOptions.current = null;
    try {
      store.dispatch({
        ...setSize({
          ...options,
          lockAspect: nextDraft.lockAspect,
          unit: nextDraft.unit,
          bounds,
          parent: parentSize,
        }),
        mergeKey: "size-inspector",
      });
      setPendingSize(false);
      dirty.current = false;
    } catch (error) {
      setErrors({
        size:
          error instanceof Error ? error.message : "Unable to update SVG size.",
      });
      setPendingSize(false);
    }
  }

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (key === "width" || key === "height") scheduleSize(next, key);
  }

  function changeUnit(unit: Draft["unit"]) {
    const next = { ...draft, unit };
    setDraft(next);
    if (!document) return;
    if (sizeOptions.current) commitSize(draft);
    const currentDocument = store.getSnapshot().document;
    if (!currentDocument) return;
    const size = effectiveSize(currentDocument, { bounds, parent: parentSize });
    if (size.kind !== "known") {
      setErrors({
        ...errors,
        size: "Canvas dimensions must be known before converting units.",
      });
      return;
    }
    try {
      store.dispatch({
        ...setSize({
          width: size.width,
          height: size.height,
          unit,
          bounds,
          parent: parentSize,
        }),
        mergeKey: "size-inspector",
      });
      setDraft({
        ...next,
        width: displayValue(
          size.width,
          unit,
          "width",
          currentDocument,
          bounds,
          parentSize,
        ),
        height: displayValue(
          size.height,
          unit,
          "height",
          currentDocument,
          bounds,
          parentSize,
        ),
      });
      setErrors({ ...errors, size: undefined });
    } catch (error) {
      setErrors({
        ...errors,
        size:
          error instanceof Error ? error.message : "Unable to convert units.",
      });
    }
  }

  function applyViewBox() {
    const values = [
      draft.minX,
      draft.minY,
      draft.viewBoxWidth,
      draft.viewBoxHeight,
    ].map(Number);
    if (
      values.some((value) => !Number.isFinite(value)) ||
      values[2] <= 0 ||
      values[3] <= 0
    ) {
      setErrors({
        ...errors,
        viewBox: "Enter finite coordinates and positive viewBox dimensions.",
      });
      return;
    }
    if (!document) return;
    if (sizeOptions.current) commitSize(draft);
    try {
      store.dispatch(
        setViewBox({
          minX: values[0],
          minY: values[1],
          width: values[2],
          height: values[3],
          keepDisplaySize: draft.keepDisplaySize,
          bounds,
          parent: parentSize,
        }),
      );
      setErrors({ ...errors, viewBox: undefined });
      dirty.current = false;
    } catch (error) {
      setErrors({
        ...errors,
        viewBox:
          error instanceof Error
            ? error.message
            : "Unable to update the viewBox.",
      });
    }
  }

  function applyAspectRatio(value: string) {
    if (!document) return;
    const [align, mode] = value.split(" ");
    const normalized = mode ? `${align} ${mode}` : align;
    try {
      store.dispatch(setPreserveAspectRatio(normalized));
      updateDraft("preserveAspectRatio", normalized);
    } catch (error) {
      setErrors({
        ...errors,
        viewBox:
          error instanceof Error
            ? error.message
            : "Invalid aspect-ratio value.",
      });
    }
  }

  const viewBoxState = document
    ? effectiveViewBox(document, bounds)
    : { kind: "unknown" as const, reason: "needs-bounds" as const };
  const effective = document
    ? effectiveSize(document, { bounds, parent: parentSize })
    : { kind: "unknown" as const, reason: "needs-bounds" as const };
  const rootNode = document?.nodes.get(document.root);
  const missingWidth =
    rootNode?.kind === "element" && rootNode.attrs.width === undefined;
  const missingHeight =
    rootNode?.kind === "element" && rootNode.attrs.height === undefined;
  const selectedAlignment =
    draft.preserveAspectRatio.split(/\s+/)[0] ?? "xMidYMid";
  const selectedMode = draft.preserveAspectRatio.split(/\s+/)[1] ?? "meet";
  const selectedAspectValue =
    selectedAlignment === "none"
      ? "none"
      : `${selectedAlignment} ${selectedMode}`;

  return (
    <section
      aria-labelledby="size-viewbox-heading"
      className="space-y-5 border-t border-border pt-4"
      data-testid="size-viewbox-panel"
    >
      <div>
        <h3 id="size-viewbox-heading" className="text-base font-semibold">
          Size and viewBox
        </h3>
        <p className="mt-1 max-w-prose text-sm text-foreground-muted">
          Set the exported canvas size and the area of the drawing it shows.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Canvas size</legend>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <div className="space-y-1">
            <label htmlFor="svg-size-width" className="text-sm">
              Width
            </label>
            <input
              id="svg-size-width"
              type="number"
              min="0"
              step="any"
              value={draft.width}
              onChange={(event) =>
                updateDraft("width", event.currentTarget.value)
              }
              onBlur={() => pendingSize && commitSize()}
              aria-invalid={Boolean(errors.size)}
              aria-describedby={errors.size ? "svg-size-error" : undefined}
              className={inputClass}
            />
            {effective.kind === "known" && missingWidth && (
              <p
                id="svg-size-derived"
                className="text-xs text-foreground-muted"
              >
                Derived from viewBox: {effective.width} px
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="svg-size-height" className="text-sm">
              Height
            </label>
            <input
              id="svg-size-height"
              type="number"
              min="0"
              step="any"
              value={draft.height}
              onChange={(event) =>
                updateDraft("height", event.currentTarget.value)
              }
              onBlur={() => pendingSize && commitSize()}
              aria-invalid={Boolean(errors.size)}
              aria-describedby={errors.size ? "svg-size-error" : undefined}
              className={inputClass}
            />
            {effective.kind === "known" && missingHeight && (
              <p className="text-xs text-foreground-muted">
                Derived from viewBox: {effective.height} px
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="svg-size-unit" className="text-sm">
              Unit
            </label>
            <select
              id="svg-size-unit"
              value={draft.unit}
              onChange={(event) =>
                changeUnit(event.currentTarget.value as Draft["unit"])
              }
              className={inputClass}
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit.value} value={unit.value}>
                  {unit.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.lockAspect}
            onChange={(event) =>
              updateDraft("lockAspect", event.currentTarget.checked)
            }
            className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          Lock aspect ratio
        </label>
        {errors.size && (
          <p id="svg-size-error" role="alert" className="text-sm text-error">
            {errors.size}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Visible drawing area</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["minX", "Minimum X"],
              ["minY", "Minimum Y"],
              ["viewBoxWidth", "ViewBox width"],
              ["viewBoxHeight", "ViewBox height"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <label htmlFor={`svg-${key}`} className="text-sm">
                {label}
              </label>
              <input
                id={`svg-${key}`}
                type="number"
                step="any"
                min={
                  key === "viewBoxWidth" || key === "viewBoxHeight"
                    ? "0"
                    : undefined
                }
                value={draft[key]}
                onChange={(event) =>
                  updateDraft(key, event.currentTarget.value)
                }
                aria-invalid={Boolean(errors.viewBox)}
                aria-describedby={
                  errors.viewBox ? "svg-viewbox-error" : undefined
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
        {viewBoxState.kind === "unknown" && (
          <p className="text-xs text-foreground-muted">
            No viewBox yet. Enter a visible area; content bounds will be used
            when supplied by the renderer.
          </p>
        )}
        {viewBoxState.kind === "error" && (
          <p role="alert" className="text-sm text-error">
            The current viewBox is invalid. Enter a valid visible area.
          </p>
        )}
        <label className="flex w-fit items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.keepDisplaySize}
            onChange={(event) =>
              updateDraft("keepDisplaySize", event.currentTarget.checked)
            }
            className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          Keep the same display size
        </label>
        <button type="button" onClick={applyViewBox} className={buttonClass}>
          Apply viewBox
        </button>
        {errors.viewBox && (
          <p id="svg-viewbox-error" role="alert" className="text-sm text-error">
            {errors.viewBox}
          </p>
        )}
      </fieldset>

      <div className="space-y-1">
        <label
          htmlFor="svg-preserve-aspect-ratio"
          className="text-sm font-medium"
        >
          Fit drawing in viewport
        </label>
        <select
          id="svg-preserve-aspect-ratio"
          value={selectedAspectValue}
          onChange={(event) => applyAspectRatio(event.currentTarget.value)}
          className={inputClass}
        >
          <option value="none">Stretch to fill</option>
          {ALIGNMENTS.flatMap((align) => [
            <option key={`${align}-meet`} value={`${align} meet`}>
              {ASPECT_POSITIONS[align]} — fit all, keep shape
            </option>,
            <option key={`${align}-slice`} value={`${align} slice`}>
              {ASPECT_POSITIONS[align]} — fill and crop, keep shape
            </option>,
          ])}
        </select>
        <p className="text-xs text-foreground-muted" aria-live="polite">
          {ASPECT_HINTS[selectedAlignment] ?? ASPECT_HINTS.xMidYMid}{" "}
          {selectedMode === "slice"
            ? "The viewport may crop the edges."
            : selectedMode === "meet"
              ? "The whole drawing stays visible."
              : ""}
        </p>
      </div>
    </section>
  );
}

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const buttonClass =
  "min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
