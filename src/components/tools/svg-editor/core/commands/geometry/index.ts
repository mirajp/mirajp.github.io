import type { Command, ElementNode, SvgDocument } from "../../../contracts";
import { fromPx, parseLength } from "../../units";
import type {
  AbsoluteLengthUnit,
  LengthFontMetrics,
  LengthSize,
  LengthUnit,
} from "../../units";

export interface GeometryBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EffectiveViewBox {
  kind: "known";
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UnknownGeometry {
  kind: "unknown";
  reason: "needs-bounds";
}

export interface GeometryErrorResult {
  kind: "error";
  reason: "invalid-viewBox" | "invalid-length" | "missing-context";
  attribute?: "width" | "height";
}

export type EffectiveViewBoxResult =
  EffectiveViewBox | UnknownGeometry | GeometryErrorResult;

export interface EffectiveSize {
  kind: "known";
  width: number;
  height: number;
}

export type EffectiveSizeResult =
  EffectiveSize | UnknownGeometry | GeometryErrorResult;

export interface EffectiveSizeOptions {
  bounds?: GeometryBounds;
  parent?: LengthSize;
  font?: LengthFontMetrics;
}

export interface SetSizeOptions extends EffectiveSizeOptions {
  /** Requested display dimensions in CSS px. */
  width?: number;
  /** Requested display dimensions in CSS px. */
  height?: number;
  /** Retain the root's current display aspect ratio; width takes priority if both are supplied. */
  lockAspect?: boolean;
  /** Convert both output dimensions to this unit instead of retaining each authored unit. */
  unit?: LengthUnit;
}

export interface SetViewBoxOptions extends EffectiveSizeOptions {
  minX: number;
  minY: number;
  width: number;
  height: number;
  keepDisplaySize?: boolean;
}

export class GeometryCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeometryCommandError";
  }
}

const UNIT_PATTERN = /^(px|pt|pc|mm|cm|in|%|em|ex)?$/i;
const PRESERVE_ASPECT_RATIO_PATTERN =
  /^(?:none|x(?:Min|Mid|Max)Y(?:Min|Mid|Max)(?:\s+(?:meet|slice))?)$/;

/**
 * Returns the root viewBox, or caller-computed content bounds when the SVG has
 * no viewBox. Geometry-dependent callers can distinguish missing bounds.
 */
export function effectiveViewBox(
  document: SvgDocument,
  bounds?: GeometryBounds,
): EffectiveViewBoxResult {
  const root = requireRoot(document);
  const source = root.attrs.viewBox;
  if (source !== undefined) {
    const values = source
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (
      values.length !== 4 ||
      values.some((value) => !Number.isFinite(value)) ||
      values[2] <= 0 ||
      values[3] <= 0
    ) {
      return { kind: "error", reason: "invalid-viewBox" };
    }
    return {
      kind: "known",
      x: values[0],
      y: values[1],
      width: values[2],
      height: values[3],
    };
  }
  if (bounds === undefined) return { kind: "unknown", reason: "needs-bounds" };
  if (
    !Number.isFinite(bounds.x) ||
    !Number.isFinite(bounds.y) ||
    !Number.isFinite(bounds.width) ||
    !Number.isFinite(bounds.height) ||
    bounds.width <= 0 ||
    bounds.height <= 0
  ) {
    return { kind: "error", reason: "invalid-viewBox" };
  }
  return { kind: "known", ...bounds };
}

/**
 * Resolves explicit root dimensions to CSS px. Missing dimensions use viewBox
 * dimensions first, then caller-supplied bounds when there is no viewBox.
 */
export function effectiveSize(
  document: SvgDocument,
  options: EffectiveSizeOptions = {},
): EffectiveSizeResult {
  const root = requireRoot(document);
  const viewBox = effectiveViewBox(document, options.bounds);
  if (viewBox.kind === "error") return viewBox;

  const width = resolveDimension(root, "width", viewBox, options);
  if (width.kind !== "known") return width;
  const height = resolveDimension(root, "height", viewBox, options);
  if (height.kind !== "known") return height;
  return { kind: "known", width: width.value, height: height.value };
}

interface ResolvedDimension {
  kind: "known";
  value: number;
}

function resolveDimension(
  root: ElementNode,
  axis: "width" | "height",
  viewBox: EffectiveViewBox | UnknownGeometry,
  options: EffectiveSizeOptions,
): ResolvedDimension | UnknownGeometry | GeometryErrorResult {
  const raw = root.attrs[axis];
  if (raw === undefined) {
    if (viewBox.kind === "known") {
      return { kind: "known", value: viewBox[axis] };
    }
    const bound = options.bounds?.[axis];
    return bound !== undefined && Number.isFinite(bound) && bound > 0
      ? { kind: "known", value: bound }
      : { kind: "unknown", reason: "needs-bounds" };
  }

  const unit = readUnit(raw);
  if (unit === null)
    return { kind: "error", reason: "invalid-length", attribute: axis };
  const parsed = parseLength(raw, {
    axis,
    viewBox:
      unit === "%" && options.parent
        ? undefined
        : viewBox.kind === "known"
          ? viewBox
          : undefined,
    parent: options.parent,
    font: options.font,
  });
  if (!parsed.ok) {
    return {
      kind: "error",
      reason:
        parsed.error.kind === "missing-context"
          ? "missing-context"
          : "invalid-length",
      attribute: axis,
    };
  }

  if (unit === "%" || unit === "em" || unit === "ex" || unit === "") {
    return { kind: "known", value: parsed.value };
  }
  return { kind: "known", value: parsed.value };
}

export function setSize(options: SetSizeOptions): Command {
  return {
    id: "SetSize",
    label: "Set SVG size",
    apply(document) {
      const root = requireRoot(document);
      const current = effectiveSize(document, options);
      if (current.kind !== "known") {
        throw new GeometryCommandError(
          current.kind === "unknown"
            ? "Cannot determine the current size; supply bounds."
            : `Cannot determine the current size: ${current.reason}.`,
        );
      }
      if (options.width === undefined && options.height === undefined) {
        throw new RangeError("SetSize requires a width or height.");
      }
      assertPositiveOptional(options.width, "width");
      assertPositiveOptional(options.height, "height");

      let width = options.width ?? current.width;
      let height = options.height ?? current.height;
      if (options.lockAspect) {
        const ratio = current.width / current.height;
        if (options.width !== undefined) height = width / ratio;
        else if (options.height !== undefined) width = height * ratio;
      }

      const attrs = { ...root.attrs };
      attrs.width = formatDimension(
        width,
        root.attrs.width,
        "width",
        document,
        options,
      );
      attrs.height = formatDimension(
        height,
        root.attrs.height,
        "height",
        document,
        options,
      );
      return replaceRoot(document, { ...root, attrs });
    },
  };
}

export function setViewBox(options: SetViewBoxOptions): Command {
  return {
    id: "SetViewBox",
    label: "Set SVG viewBox",
    apply(document) {
      assertFinite(options.minX, "minX");
      assertFinite(options.minY, "minY");
      assertPositive(options.width, "width");
      assertPositive(options.height, "height");
      const root = requireRoot(document);
      const attrs: Record<string, string> = {
        ...root.attrs,
        viewBox: `${numberString(options.minX)} ${numberString(options.minY)} ${numberString(options.width)} ${numberString(options.height)}`,
      };

      if (options.keepDisplaySize) {
        const oldViewBox = effectiveViewBox(document, options.bounds);
        const oldSize = effectiveSize(document, options);
        if (oldViewBox.kind !== "known" || oldSize.kind !== "known") {
          throw new GeometryCommandError(
            "Cannot preserve display size without known viewBox and root dimensions.",
          );
        }
        attrs.width = formatDimension(
          (oldSize.width * options.width) / oldViewBox.width,
          root.attrs.width,
          "width",
          document,
          options,
        );
        attrs.height = formatDimension(
          (oldSize.height * options.height) / oldViewBox.height,
          root.attrs.height,
          "height",
          document,
          options,
        );
      }

      return replaceRoot(document, { ...root, attrs });
    },
  };
}

export function setPreserveAspectRatio(value: string): Command {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!PRESERVE_ASPECT_RATIO_PATTERN.test(normalized)) {
    throw new RangeError(`Invalid preserveAspectRatio value: ${value}`);
  }
  return {
    id: "SetPreserveAspectRatio",
    label: "Set preserve aspect ratio",
    apply(document) {
      const root = requireRoot(document);
      return replaceRoot(document, {
        ...root,
        attrs: { ...root.attrs, preserveAspectRatio: normalized },
      });
    },
  };
}

function formatDimension(
  pixels: number,
  original: string | undefined,
  axis: "width" | "height",
  document: SvgDocument,
  options: EffectiveSizeOptions & { unit?: LengthUnit },
): string {
  assertPositive(pixels, axis);
  const outputUnit =
    options.unit ?? (original === undefined ? "" : readUnit(original));
  if (outputUnit === null || !UNIT_PATTERN.test(outputUnit)) {
    throw new GeometryCommandError(`Cannot preserve the ${axis} unit.`);
  }
  if (outputUnit === "") return numberString(pixels);
  if (isAbsoluteUnit(outputUnit)) {
    return `${numberString(fromPx(pixels, outputUnit))}${outputUnit}`;
  }

  const viewBox = effectiveViewBox(document, options.bounds);
  const basisSize =
    outputUnit === "%"
      ? (options.parent?.[axis] ??
        (viewBox.kind === "known" ? viewBox[axis] : undefined))
      : outputUnit === "em"
        ? options.font?.em
        : options.font?.ex;
  if (
    basisSize === undefined ||
    !Number.isFinite(basisSize) ||
    basisSize <= 0
  ) {
    throw new GeometryCommandError(
      `Cannot convert CSS px to ${outputUnit} without a positive ${outputUnit} context.`,
    );
  }
  const value =
    outputUnit === "%" ? (pixels / basisSize) * 100 : pixels / basisSize;
  return `${numberString(value)}${outputUnit}`;
}

function readUnit(value: string): LengthUnit | null {
  const match =
    /^\s*[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?\s*(px|pt|pc|mm|cm|in|%|em|ex)?\s*$/i.exec(
      value,
    );
  if (!match) return null;
  return (match[1]?.toLowerCase() ?? "") as LengthUnit;
}

function isAbsoluteUnit(unit: LengthUnit): unit is AbsoluteLengthUnit {
  return unit !== "" && unit !== "%" && unit !== "em" && unit !== "ex";
}

function requireRoot(document: SvgDocument): ElementNode {
  const root = document.nodes.get(document.root);
  if (
    !root ||
    root.kind !== "element" ||
    root.parent !== null ||
    root.tag !== "svg"
  ) {
    throw new GeometryCommandError("Document root must be an SVG element.");
  }
  return root;
}

function replaceRoot(document: SvgDocument, root: ElementNode): SvgDocument {
  return { ...document, nodes: document.nodes.set(root.id, root) };
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
}

function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be positive.`);
}

function assertPositiveOptional(value: number | undefined, name: string): void {
  if (value !== undefined) assertPositive(value, name);
}

function numberString(value: number): string {
  return Object.is(value, -0) ? "0" : String(value);
}
