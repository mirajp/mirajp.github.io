import type { GeometryAdapter, ViewTransform } from "../../contracts";

/**
 * Coordinate conversions flow between local element, parent, root SVG, and client spaces.
 * Local values belong to one element; parent space applies its immediate transform;
 * root space is the outermost SVG user coordinate system; client space is viewport pixels.
 * Tools use these helpers rather than mixing or converting those spaces independently.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

export class CoordinateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CoordinateError";
  }
}

const MIN_SCALE = 0.02;
const MAX_SCALE = 64;

interface AffineMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

function invert(matrix: AffineMatrix): AffineMatrix {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
    throw new CoordinateError("SVG coordinate transform is not invertible");
  }
  const inverse = 1 / determinant;
  const a = matrix.d * inverse;
  const b = -matrix.b * inverse;
  const c = -matrix.c * inverse;
  const d = matrix.a * inverse;
  return {
    a,
    b,
    c,
    d,
    e: -(a * matrix.e + c * matrix.f),
    f: -(b * matrix.e + d * matrix.f),
  };
}

function multiply(left: AffineMatrix, right: AffineMatrix): AffineMatrix {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

function transformPoint(matrix: AffineMatrix, point: Point): Point {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  };
}

function requiredScreenCTM(
  element: SVGGraphicsElement,
  adapter: GeometryAdapter,
): DOMMatrix {
  const matrix = adapter.getScreenCTM(element);
  if (!matrix) {
    throw new CoordinateError("SVG element has no screen CTM");
  }
  return matrix;
}

/**
 * Converts a client-space point into the element's local SVG user space (TDD §8).
 */
export function clientToSvg(
  element: SVGGraphicsElement,
  x: number,
  y: number,
  adapter: GeometryAdapter,
): Point {
  const local = transformPoint(invert(requiredScreenCTM(element, adapter)), {
    x,
    y,
  });
  return local;
}

function outermostSvg(element: SVGGraphicsElement): SVGGraphicsElement {
  let root = element;
  let owner = element.ownerSVGElement;
  while (owner) {
    root = owner;
    owner = owner.ownerSVGElement;
  }
  return root;
}

/**
 * Maps the four local bounding-box corners into the outermost SVG root space (TDD §8).
 */
export function elementBBoxInRoot(
  element: SVGGraphicsElement,
  adapter: GeometryAdapter,
): Bounds {
  const elementMatrix = requiredScreenCTM(element, adapter);
  const rootMatrix = requiredScreenCTM(outermostSvg(element), adapter);
  const toRoot = multiply(invert(rootMatrix), elementMatrix);
  const box = adapter.getBBox(element);
  const corners = [
    transformPoint(toRoot, { x: box.x, y: box.y }),
    transformPoint(toRoot, { x: box.x + box.width, y: box.y }),
    transformPoint(toRoot, { x: box.x, y: box.y + box.height }),
    transformPoint(toRoot, {
      x: box.x + box.width,
      y: box.y + box.height,
    }),
  ];
  const xs = corners.map(({ x }) => x);
  const ys = corners.map(({ y }) => y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function assertFiniteTransform(transform: ViewTransform): void {
  if (
    !Number.isFinite(transform.scale) ||
    transform.scale <= 0 ||
    !Number.isFinite(transform.tx) ||
    !Number.isFinite(transform.ty)
  ) {
    throw new RangeError(
      "ViewTransform values must be finite with positive scale",
    );
  }
}

/**
 * Zooms around a cursor point, clamping scale to 2%–6400% (TDD §7).
 */
export function zoomAt(
  transform: ViewTransform,
  cx: number,
  cy: number,
  factor: number,
): ViewTransform {
  assertFiniteTransform(transform);
  if (
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(factor) ||
    factor <= 0
  ) {
    throw new RangeError(
      "Zoom cursor and factor must be finite; factor must be positive",
    );
  }
  const scale = Math.min(
    MAX_SCALE,
    Math.max(MIN_SCALE, transform.scale * factor),
  );
  const ratio = scale / transform.scale;
  return {
    scale,
    tx: cx - (cx - transform.tx) * ratio,
    ty: cy - (cy - transform.ty) * ratio,
  };
}

/**
 * Applies a viewport-space pan without changing zoom (TDD §7).
 */
export function pan(
  transform: ViewTransform,
  dx: number,
  dy: number,
): ViewTransform {
  assertFiniteTransform(transform);
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) {
    throw new RangeError("Pan deltas must be finite");
  }
  return {
    scale: transform.scale,
    tx: transform.tx + dx,
    ty: transform.ty + dy,
  };
}

/**
 * Scales and centers content bounds within a viewport (TDD §7, §8).
 */
export function fit(content: Bounds, viewport: ViewportSize): ViewTransform {
  if (
    !Number.isFinite(content.x) ||
    !Number.isFinite(content.y) ||
    !Number.isFinite(content.width) ||
    !Number.isFinite(content.height) ||
    content.width <= 0 ||
    content.height <= 0 ||
    !Number.isFinite(viewport.width) ||
    !Number.isFinite(viewport.height) ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    throw new RangeError(
      "Fit requires finite, positive content and viewport dimensions",
    );
  }
  const scale = Math.min(
    MAX_SCALE,
    Math.max(
      MIN_SCALE,
      Math.min(
        viewport.width / content.width,
        viewport.height / content.height,
      ),
    ),
  );
  return {
    scale,
    tx: (viewport.width - content.width * scale) / 2 - content.x * scale,
    ty: (viewport.height - content.height * scale) / 2 - content.y * scale,
  };
}
