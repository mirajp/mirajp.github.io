import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  convertAbsoluteLength,
  fromPx,
  parseLength,
  toPx,
} from "../../../../src/components/tools/svg-editor/core/units";
import type {
  AbsoluteLengthUnit,
  LengthContext,
} from "../../../../src/components/tools/svg-editor/core/units";

const CONTEXT: LengthContext = {
  axis: "width",
  viewBox: { width: 200, height: 100 },
  parent: { width: 300, height: 150 },
  font: { em: 20, ex: 8 },
};

describe("parseLength", () => {
  it.each([
    ["10px", 10, "px"],
    ["10pt", 40 / 3, "pt"],
    ["10pc", 160, "pc"],
    ["10mm", (10 * 96) / 25.4, "mm"],
    ["10cm", (10 * 96) / 2.54, "cm"],
    ["1in", 96, "in"],
    ["50%", 100, "%"],
    ["2em", 40, "em"],
    ["2ex", 16, "ex"],
    ["12", 12, ""],
    ["1e2px", 100, "px"],
    ["  -2.5e1px  ", -25, "px"],
  ])("parses %s", (source, expected, unit) => {
    const result = parseLength(source, CONTEXT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeCloseTo(expected, 12);
      expect(result.unit).toBe(unit);
    }
  });

  it.each([
    ["50%", "width", 100],
    ["50%", "height", 50],
    ["100%", "other", Math.sqrt((200 ** 2 + 100 ** 2) / 2)],
  ] as const)(
    "resolves percentage %s on the %s axis",
    (source, axis, value) => {
      const result = parseLength(source, { ...CONTEXT, axis });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeCloseTo(value, 12);
        expect(result.unit).toBe("%");
      }
    },
  );

  it("falls back to parent dimensions when no viewBox is supplied", () => {
    expect(
      parseLength("25%", {
        axis: "width",
        parent: { width: 80, height: 40 },
      }),
    ).toEqual({ ok: true, value: 20, unit: "%" });
  });

  it.each(["", " ", "garbage", "10 px", "1e999px", "NaN", "Infinity"])(
    "rejects invalid length %j with a typed error",
    (source) => {
      const result = parseLength(source, CONTEXT);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.kind).toBe("invalid-input");
    },
  );

  it("returns a typed error when a finite magnitude overflows during resolution", () => {
    const result = parseLength("1e307in", CONTEXT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("non-finite-result");
  });

  it.each([
    ["50%", { axis: "width" }],
    ["2em", { axis: "width" }],
    ["2ex", { axis: "width", font: { em: 10 } }],
  ] as const)("reports missing context for %s", (source, context) => {
    const result = parseLength(source, context);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe("missing-context");
  });
});

describe("absolute length conversions", () => {
  it.each([
    ["px", 1],
    ["in", 96],
    ["pt", 96 / 72],
    ["pc", 16],
    ["mm", 96 / 25.4],
    ["cm", 96 / 2.54],
  ] as const)("converts one %s to CSS pixels at 96 dpi", (unit, expected) => {
    expect(toPx(1, unit)).toBeCloseTo(expected, 12);
    expect(fromPx(expected, unit)).toBeCloseTo(1, 12);
  });

  it("converts between arbitrary absolute units", () => {
    expect(convertAbsoluteLength(2.54, "cm", "in")).toBeCloseTo(1, 12);
    expect(convertAbsoluteLength(72, "pt", "in")).toBeCloseTo(1, 12);
  });

  it("round-trips finite values across every absolute unit", () => {
    const units: AbsoluteLengthUnit[] = ["px", "pt", "pc", "mm", "cm", "in"];
    fc.assert(
      fc.property(
        fc.double({
          min: -1e6,
          max: 1e6,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.constantFrom(...units),
        fc.constantFrom(...units),
        (value, from, to) => {
          const converted = convertAbsoluteLength(value, from, to);
          const returned = convertAbsoluteLength(converted, to, from);
          expect(Math.abs(returned - value)).toBeLessThanOrEqual(
            Math.max(1e-8, Math.abs(value) * 1e-12),
          );
        },
      ),
    );
  });

  it("rejects non-finite conversion input", () => {
    expect(() => toPx(Number.NaN, "px")).toThrow(RangeError);
    expect(() => fromPx(Number.POSITIVE_INFINITY, "in")).toThrow(RangeError);
    expect(() => toPx(Number.MAX_VALUE, "in")).toThrow(RangeError);
  });
});
