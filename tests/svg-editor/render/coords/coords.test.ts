import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type {
  GeometryAdapter,
  ViewTransform,
} from "../../../../src/components/tools/svg-editor/contracts";
import {
  CoordinateError,
  clientToSvg,
  elementBBoxInRoot,
  fit,
  pan,
  zoomAt,
} from "../../../../src/components/tools/svg-editor/render/coords";

interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

function matrix(values: AffineMatrix): DOMMatrix {
  return values as DOMMatrix;
}

function fakeElement(
  ownerSVGElement: SVGSVGElement | null = null,
): SVGGraphicsElement {
  return { ownerSVGElement } as SVGGraphicsElement;
}

function adapterFor(
  matrices: Map<SVGGraphicsElement, AffineMatrix | null>,
  boxes = new Map<SVGGraphicsElement, DOMRect>(),
): GeometryAdapter {
  return {
    getScreenCTM(element) {
      const value = matrices.get(element);
      return value ? matrix(value) : null;
    },
    getBBox(element) {
      return (
        boxes.get(element) ?? ({ x: 0, y: 0, width: 10, height: 20 } as DOMRect)
      );
    },
  };
}

describe("coordinate and ViewTransform utilities", () => {
  it("converts client coordinates through the inverse screen CTM", () => {
    const element = fakeElement(null);
    const adapter = adapterFor(
      new Map([[element, { a: 2, b: 0, c: 0, d: 4, e: 10, f: 20 }]]),
    );

    expect(clientToSvg(element, 30, 60, adapter)).toEqual({ x: 10, y: 10 });
  });

  it("throws a typed error if there is no screen CTM", () => {
    const element = fakeElement(null);
    expect(() => clientToSvg(element, 1, 2, adapterFor(new Map()))).toThrow(
      CoordinateError,
    );
  });

  it("maps all four bbox corners through element CTM into root SVG space", () => {
    const root = fakeElement() as SVGSVGElement;
    const child = fakeElement(root);
    const adapter = adapterFor(
      new Map([
        [root, { a: 2, b: 0, c: 0, d: 2, e: 100, f: 50 }],
        [child, { a: 0, b: 3, c: -3, d: 0, e: 140, f: 90 }],
      ]),
      new Map([[child, { x: 1, y: 2, width: 4, height: 5 } as DOMRect]]),
    );

    expect(elementBBoxInRoot(child, adapter)).toEqual({
      x: 9.5,
      y: 21.5,
      width: 7.5,
      height: 6,
    });
  });

  it("clamps zoom and anchors it at the cursor", () => {
    const start: ViewTransform = { scale: 2, tx: 30, ty: -10 };
    expect(zoomAt(start, 80, 40, 1.5)).toEqual({
      scale: 3,
      tx: 5,
      ty: -35,
    });
    expect(zoomAt(start, 0, 0, 100)).toEqual({
      scale: 64,
      tx: 960,
      ty: -320,
    });
    expect(zoomAt(start, 0, 0, 0.0001).scale).toBe(0.02);
  });

  it("round-trips zoom in then out at the same cursor within epsilon", () => {
    fc.assert(
      fc.property(
        fc.record({
          scale: fc.double({ min: 0.5, max: 20, noNaN: true }),
          tx: fc.double({ min: -500, max: 500, noNaN: true }),
          ty: fc.double({ min: -500, max: 500, noNaN: true }),
          cx: fc.double({ min: -500, max: 500, noNaN: true }),
          cy: fc.double({ min: -500, max: 500, noNaN: true }),
          factor: fc.double({ min: 0.5, max: 2.5, noNaN: true }),
        }),
        ({ scale, tx, ty, cx, cy, factor }) => {
          const before = { scale, tx, ty };
          const after = zoomAt(
            zoomAt(before, cx, cy, factor),
            cx,
            cy,
            1 / factor,
          );
          expect(after.scale).toBeCloseTo(before.scale, 10);
          expect(after.tx).toBeCloseTo(before.tx, 8);
          expect(after.ty).toBeCloseTo(before.ty, 8);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("pans in viewport coordinates", () => {
    expect(pan({ scale: 1.5, tx: 4, ty: -8 }, -2, 6)).toEqual({
      scale: 1.5,
      tx: 2,
      ty: -2,
    });
  });

  it("fits content inside the viewport and centers it", () => {
    expect(
      fit(
        { x: 10, y: 20, width: 200, height: 100 },
        { width: 400, height: 400 },
      ),
    ).toEqual({
      scale: 2,
      tx: -20,
      ty: 60,
    });
  });

  it.skipIf(
    typeof SVGGraphicsElement === "undefined" ||
      typeof SVGGraphicsElement.prototype.getScreenCTM !== "function" ||
      typeof SVGGraphicsElement.prototype.getBBox !== "function",
  )(
    "uses real browser CTMs across nested transforms and nested svg viewports",
    () => {
      const outerSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      outerSvg.setAttribute("width", "400");
      outerSvg.setAttribute("height", "300");
      outerSvg.setAttribute("viewBox", "0 0 400 300");
      outerSvg.style.position = "absolute";
      outerSvg.style.left = "0";
      outerSvg.style.top = "0";
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", "translate(40 30) rotate(90)");
      const nestedSvg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      nestedSvg.setAttribute("x", "10");
      nestedSvg.setAttribute("y", "20");
      nestedSvg.setAttribute("width", "100");
      nestedSvg.setAttribute("height", "80");
      nestedSvg.setAttribute("viewBox", "0 0 10 8");
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.setAttribute("x", "1");
      rect.setAttribute("y", "2");
      rect.setAttribute("width", "4");
      rect.setAttribute("height", "3");
      nestedSvg.append(rect);
      group.append(nestedSvg);
      outerSvg.append(group);
      document.body.append(outerSvg);

      try {
        const adapter: GeometryAdapter = {
          getScreenCTM: (element) => element.getScreenCTM(),
          getBBox: (element) => element.getBBox(),
        };
        const bbox = elementBBoxInRoot(rect, adapter);
        expect(bbox.x).toBeCloseTo(-30, 4);
        expect(bbox.y).toBeCloseTo(50, 4);
        expect(bbox.width).toBeCloseTo(30, 4);
        expect(bbox.height).toBeCloseTo(40, 4);

        const screenCTM = rect.getScreenCTM();
        if (!screenCTM) throw new Error("Browser did not provide screen CTM");
        const local = clientToSvg(
          rect,
          screenCTM.a * 2 + screenCTM.c * 3 + screenCTM.e,
          screenCTM.b * 2 + screenCTM.d * 3 + screenCTM.f,
          adapter,
        );
        expect(local.x).toBeCloseTo(2, 4);
        expect(local.y).toBeCloseTo(3, 4);
      } finally {
        outerSvg.remove();
      }
    },
  );
});
