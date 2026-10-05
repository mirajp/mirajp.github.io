export type AbsoluteLengthUnit = "px" | "pt" | "pc" | "mm" | "cm" | "in";
export type RelativeLengthUnit = "%" | "em" | "ex";
export type LengthUnit = AbsoluteLengthUnit | RelativeLengthUnit | "";
export type LengthAxis = "width" | "height" | "other";

export interface LengthSize {
  width: number;
  height: number;
}

export interface LengthFontMetrics {
  em?: number;
  ex?: number;
}

/**
 * Sizes are expressed in the current SVG user coordinate system (TDD §8).
 */
export interface LengthContext {
  axis?: LengthAxis;
  viewBox?: LengthSize;
  parent?: LengthSize;
  font?: LengthFontMetrics;
}

export interface ParsedLength {
  ok: true;
  /** Resolved length in CSS px for absolute units and SVG user units for relative units. */
  value: number;
  /** Normalized authored unit; the empty string means unitless. */
  unit: LengthUnit;
}

export type LengthErrorKind =
  "invalid-input" | "missing-context" | "non-finite-result";

export interface LengthError {
  kind: LengthErrorKind;
  message: string;
  input: string;
}

export interface InvalidLength {
  ok: false;
  error: LengthError;
}

export type ParseLengthResult = ParsedLength | InvalidLength;

const PX_PER_UNIT: Record<AbsoluteLengthUnit, number> = {
  px: 1,
  pt: 96 / 72,
  pc: 16,
  mm: 96 / 25.4,
  cm: 96 / 2.54,
  in: 96,
};

const LENGTH_PATTERN =
  /^([+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?)(px|pt|pc|mm|cm|in|%|em|ex)?$/i;

function error(
  input: string,
  kind: LengthErrorKind,
  message: string,
): InvalidLength {
  return { ok: false, error: { kind, message, input } };
}

function validSize(size: LengthSize | undefined): size is LengthSize {
  return (
    size !== undefined &&
    Number.isFinite(size.width) &&
    Number.isFinite(size.height) &&
    size.width >= 0 &&
    size.height >= 0
  );
}

/**
 * Parses an SVG/CSS length without DOM access. Absolute units resolve at 96 dpi;
 * percentages use the viewBox extent (or parent extent when no viewBox exists).
 */
export function parseLength(
  input: string,
  context: LengthContext,
): ParseLengthResult {
  const source = input.trim();
  const match = LENGTH_PATTERN.exec(source);
  if (!match) {
    return error(input, "invalid-input", "Expected a finite SVG length.");
  }

  const magnitude = Number(match[1]);
  if (!Number.isFinite(magnitude)) {
    return error(input, "invalid-input", "Length magnitude must be finite.");
  }

  const unit = (match[2]?.toLowerCase() ?? "") as LengthUnit;
  if (unit === "") return { ok: true, value: magnitude, unit };

  if (unit in PX_PER_UNIT) {
    const value = magnitude * PX_PER_UNIT[unit as AbsoluteLengthUnit];
    return Number.isFinite(value)
      ? { ok: true, value, unit }
      : error(input, "non-finite-result", "Resolved length is not finite.");
  }

  if (unit === "%") {
    if (!context.axis) {
      return error(
        input,
        "missing-context",
        "A percentage length requires its width, height, or other axis.",
      );
    }
    const size = context.viewBox ?? context.parent;
    if (!validSize(size)) {
      return error(
        input,
        "missing-context",
        "A percentage length requires finite viewBox or parent dimensions.",
      );
    }
    // Width and height percentages use their matching viewport dimension. Other
    // SVG length properties use the normalized diagonal sqrt((w² + h²) / 2).
    const basis =
      context.axis === "width"
        ? size.width
        : context.axis === "height"
          ? size.height
          : Math.hypot(size.width, size.height) / Math.SQRT2;
    const value = (magnitude / 100) * basis;
    return Number.isFinite(value)
      ? { ok: true, value, unit }
      : error(input, "non-finite-result", "Resolved length is not finite.");
  }

  const metric = unit === "em" ? context.font?.em : context.font?.ex;
  if (metric === undefined) {
    return error(
      input,
      "missing-context",
      `An ${unit} length requires the corresponding font metric.`,
    );
  }
  if (!Number.isFinite(metric) || metric < 0) {
    return error(
      input,
      "missing-context",
      `The ${unit} font metric must be finite and non-negative.`,
    );
  }
  const value = magnitude * metric;
  return Number.isFinite(value)
    ? { ok: true, value, unit }
    : error(input, "non-finite-result", "Resolved length is not finite.");
}

/** Converts an absolute length to CSS pixels using the CSS 96 dpi reference. */
export function toPx(value: number, unit: AbsoluteLengthUnit): number {
  assertFinite(value);
  return assertFiniteResult(value * PX_PER_UNIT[unit]);
}

/** Converts a CSS pixel length to an absolute unit using the CSS 96 dpi reference. */
export function fromPx(value: number, unit: AbsoluteLengthUnit): number {
  assertFinite(value);
  return assertFiniteResult(value / PX_PER_UNIT[unit]);
}

/** Converts between absolute units using CSS's 96 dpi reference pixel. */
export function convertAbsoluteLength(
  value: number,
  from: AbsoluteLengthUnit,
  to: AbsoluteLengthUnit,
): number {
  return fromPx(toPx(value, from), to);
}

function assertFinite(value: number): void {
  if (!Number.isFinite(value)) {
    throw new RangeError("Length conversions require a finite number.");
  }
}

function assertFiniteResult(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Converted length is not finite.");
  }
  return value;
}
