import {
  type JpegMetadata,
  readJpegMeta,
  spliceMetadata,
} from "./jpegMeta";
import { BANDS, isNeutral, type ParamValues } from "./presets";

export interface AnalysisBuffer {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
}

export interface DetailCache {
  readonly key: string;
  readonly map: Float32Array;
}

export interface SoftPlanes {
  readonly mild: readonly [Float32Array, Float32Array, Float32Array];
  readonly strong: readonly [Float32Array, Float32Array, Float32Array];
}

export type RgbPlanes = readonly [Float32Array, Float32Array, Float32Array];

export interface DetailBuffer {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
  cache: DetailCache | null;
  soft?: SoftPlanes;
  smart?: RgbPlanes;
}

export interface PhotoSource {
  readonly analysis: AnalysisBuffer;
  readonly detail: DetailBuffer;
}

export interface LoadedPhoto extends PhotoSource {
  readonly id: string;
  readonly name: string;
  readonly buf: Uint8Array<ArrayBuffer>;
  readonly isJpeg: boolean;
  readonly meta: JpegMetadata | null;
  readonly colorSpace: PredefinedColorSpace;
  readonly bitmap: ImageBitmap;
  readonly width: number;
  readonly height: number;
}

export interface RenderContext {
  readonly lv: boolean;
  readonly b0: number;
  readonly sc: number;
  readonly gr: number;
  readonly gg: number;
  readonly gb: number;
  readonly N: number;
  readonly lut: Float32Array;
  readonly k: number;
  readonly blur?: Float32Array;
  readonly bw: number;
  readonly bh: number;
  readonly tex: number;
  readonly skin: number;
  readonly dt: boolean;
  readonly dmap?: Float32Array;
  readonly dw: number;
  readonly dh: number;
  readonly smart: number;
  readonly band: number;
  readonly spot: number;
  readonly glow: number;
  readonly soft: boolean;
  readonly fw: number;
  readonly fh: number;
  readonly sm?: RgbPlanes;
  readonly sinv: number;
  readonly m1?: RgbPlanes;
  readonly m2?: RgbPlanes;
  readonly fcx: number;
  readonly fcy: number;
  readonly bhalf: number;
  readonly bfeather: number;
  readonly shalf: number;
  readonly sfeather: number;
  readonly strip: number;
  readonly top: number;
  readonly vg: number;
  readonly sat: number;
  readonly vib: number;
  readonly cs: boolean;
  readonly ms: Float32Array;
  readonly ml: Float32Array;
  readonly mh: Float32Array;
  readonly mix: boolean;
  readonly gs: number;
  readonly gh: number;
  readonly gt: number;
  readonly grade: boolean;
  readonly grain: number;
  readonly fade: number;
}

export interface SmallCopyResult {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly image: ImageData;
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;
  readonly colorSpace: PredefinedColorSpace;
}

export interface ExportResult {
  readonly blob: Blob;
  readonly copy: boolean;
}

let nextPhotoSeq = 1;

/** Creates a 2D canvas in `preferred` color space, falling back to `srgb` if unsupported. */
export function makeCanvas(
  width: number,
  height: number,
  preferred: PredefinedColorSpace,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  colorSpace: PredefinedColorSpace;
} {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  if (preferred === "display-p3") {
    try {
      const p3Ctx = canvas.getContext("2d", {
        colorSpace: "display-p3",
        willReadFrequently: true,
      });
      if (p3Ctx != null) {
        return { canvas, ctx: p3Ctx, colorSpace: "display-p3" };
      }
    } catch {
      // Fall back to sRGB on browsers without Display P3 2D canvas support.
    }
  }
  const ctx = canvas.getContext("2d", {
    colorSpace: "srgb",
    willReadFrequently: true,
  });
  if (ctx == null) {
    throw new Error("The browser could not create a 2D canvas context.");
  }
  return { canvas, ctx, colorSpace: "srgb" };
}

/** Reads `ImageData` in `colorSpace`, falling back cleanly if settings are unsupported. */
export function getImageDataSafe(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colorSpace: PredefinedColorSpace,
): ImageData {
  try {
    return ctx.getImageData(x, y, w, h, { colorSpace });
  } catch {
    return ctx.getImageData(x, y, w, h);
  }
}

/** Allocates a fresh `ImageData` copy of `source` in `colorSpace`. */
export function createImageDataCopy(
  source: Uint8ClampedArray,
  w: number,
  h: number,
  colorSpace: PredefinedColorSpace,
): ImageData {
  const copy = new Uint8ClampedArray(source);
  try {
    return new ImageData(copy, w, h, { colorSpace });
  } catch {
    return new ImageData(copy, w, h);
  }
}

/** Renders a scaled down-sampled copy of `bitmap` with `longSide` max dimension. */
export function smallCopy(
  bitmap: ImageBitmap,
  longSide: number,
  preferredColorSpace: PredefinedColorSpace,
): SmallCopyResult {
  const scale = Math.min(1, longSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const { canvas, ctx, colorSpace } = makeCanvas(w, h, preferredColorSpace);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  const image = getImageDataSafe(ctx, 0, 0, w, h, colorSpace);
  return { canvas, ctx, image, w, h, data: image.data, colorSpace };
}

function boxBlur(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
  passes: number,
): Float32Array {
  let a = Float32Array.from(src);
  const b = new Float32Array(w * h);
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let n = 0;
        const x0 = Math.max(0, x - radius);
        const x1 = Math.min(w - 1, x + radius);
        for (let k = x0; k <= x1; k++) {
          sum += a[y * w + k];
          n++;
        }
        b[y * w + x] = sum / n;
      }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let sum = 0;
        let n = 0;
        const y0 = Math.max(0, y - radius);
        const y1 = Math.min(h - 1, y + radius);
        for (let k = y0; k <= y1; k++) {
          sum += b[k * w + x];
          n++;
        }
        a[y * w + x] = sum / n;
      }
    }
  }
  return a;
}

function boxBlurFast(
  src: Float32Array,
  w: number,
  h: number,
  radius: number,
  passes: number,
): Float32Array {
  const a = Float32Array.from(src);
  const b = new Float32Array(w * h);
  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      let n = 0;
      for (let k = 0; k <= radius && k < w; k++) {
        sum += a[row + k];
        n++;
      }
      for (let x = 0; x < w; x++) {
        b[row + x] = sum / n;
        if (x + radius + 1 < w) {
          sum += a[row + x + radius + 1];
          n++;
        }
        if (x - radius >= 0) {
          sum -= a[row + x - radius];
          n--;
        }
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let k = 0; k <= radius && k < h; k++) {
        sum += b[k * w + x];
        n++;
      }
      for (let y = 0; y < h; y++) {
        a[y * w + x] = sum / n;
        if (y + radius + 1 < h) {
          sum += b[(y + radius + 1) * w + x];
          n++;
        }
        if (y - radius >= 0) {
          sum -= b[(y - radius) * w + x];
          n--;
        }
      }
    }
  }
  return a;
}

function extractPlane(
  data: Uint8ClampedArray,
  pixelCount: number,
  channel: number,
): Float32Array {
  const plane = new Float32Array(pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    plane[i] = data[i * 4 + channel] / 255;
  }
  return plane;
}

function softMaps(det: DetailBuffer): SoftPlanes {
  if (det.soft == null) {
    const m = det.w * det.h;
    const long = Math.max(det.w, det.h);
    const r1 = Math.max(1, Math.round(0.003 * long));
    const r2 = Math.max(2, Math.round(0.016 * long));
    const p0 = extractPlane(det.data, m, 0);
    const p1 = extractPlane(det.data, m, 1);
    const p2 = extractPlane(det.data, m, 2);
    det.soft = {
      mild: [
        boxBlurFast(p0, det.w, det.h, r1, 2),
        boxBlurFast(p1, det.w, det.h, r1, 2),
        boxBlurFast(p2, det.w, det.h, r1, 2),
      ],
      strong: [
        boxBlurFast(p0, det.w, det.h, r2, 3),
        boxBlurFast(p1, det.w, det.h, r2, 3),
        boxBlurFast(p2, det.w, det.h, r2, 3),
      ],
    };
  }
  return det.soft;
}

function smartMap(det: DetailBuffer): RgbPlanes {
  if (det.smart == null) {
    const w = det.w;
    const h = det.h;
    const m = w * h;
    const d = det.data;
    const step = Math.max(1, Math.round(Math.max(w, h) / 400));
    const reach = 4;
    const lum = new Uint8Array(m);
    const lut = new Float32Array(256);
    for (let i = 0; i < m; i++) {
      lum[i] = Math.round(
        0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2],
      );
    }
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.exp((-i * i) / (2 * 18 * 18));
    }
    const out: RgbPlanes = [
      new Float32Array(m),
      new Float32Array(m),
      new Float32Array(m),
    ];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const l0 = lum[p];
        let sr = 0;
        let sg = 0;
        let sb = 0;
        let sw = 0;
        for (let j = -reach; j <= reach; j++) {
          const yy = Math.min(h - 1, Math.max(0, y + j * step)) * w;
          for (let i = -reach; i <= reach; i++) {
            const q = yy + Math.min(w - 1, Math.max(0, x + i * step));
            const dl = lum[q] - l0;
            const k = lut[dl < 0 ? -dl : dl];
            sr += k * d[q * 4];
            sg += k * d[q * 4 + 1];
            sb += k * d[q * 4 + 2];
            sw += k;
          }
        }
        const f = 1 / (sw * 255);
        out[0][p] = sr * f;
        out[1][p] = sg * f;
        out[2][p] = sb * f;
      }
    }
    det.smart = out;
  }
  return det.smart;
}

function bilinear(
  map: Float32Array,
  mw: number,
  mh: number,
  fx: number,
  fy: number,
): number {
  const gx = Math.min(mw - 1, Math.max(0, fx * mw - 0.5));
  const gy = Math.min(mh - 1, Math.max(0, fy * mh - 0.5));
  const ix = gx | 0;
  const iy = gy | 0;
  const ix1 = ix + 1 < mw ? ix + 1 : ix;
  const iy1 = iy + 1 < mh ? iy + 1 : iy;
  const wx = gx - ix;
  const wy = gy - iy;
  const top = map[iy * mw + ix] + (map[iy * mw + ix1] - map[iy * mw + ix]) * wx;
  const bot =
    map[iy1 * mw + ix] + (map[iy1 * mw + ix1] - map[iy1 * mw + ix]) * wx;
  return top + (bot - top) * wy;
}

/** Precomputes tone LUTs, spatial detail/blur maps, and HSL mixer weights for a render pass. */
export function buildContext(
  values: Readonly<ParamValues>,
  photo: PhotoSource,
): RenderContext {
  const v = values;
  const analysis = photo.analysis;
  const b0 = (v.blacks / 100) * 0.25;
  const w0 = (v.whites / 100) * 0.2;
  const lv = b0 > 0 || w0 > 0;
  const sc = 1 / (1 - b0 - w0);

  const t = v.temperature / 100;
  const ti = v.tint / 100;
  const rawGr = 1 + 0.15 * t;
  const rawGg = 1 - 0.1 * ti;
  const rawGb = 1 - 0.15 * t;
  const norm = 0.2126 * rawGr + 0.7152 * rawGg + 0.0722 * rawGb;
  const gr = rawGr / norm;
  const gg = rawGg / norm;
  const gb = rawGb / norm;

  const prepared = (d: Uint8ClampedArray, i: number): number => {
    let r = d[i] / 255;
    let g = d[i + 1] / 255;
    let b = d[i + 2] / 255;
    if (lv) {
      r = Math.max(0, (r - b0) * sc);
      g = Math.max(0, (g - b0) * sc);
      b = Math.max(0, (b - b0) * sc);
    }
    r = Math.min(1, r * gr);
    g = Math.min(1, g * gg);
    b = Math.min(1, b * gb);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const gamma = Math.pow(2, -v.exposure / 100);
  const hl = -v.highlights / 100;
  const hk = hl > 0 ? 2.2 : 0.9;
  const sh = (v.shadows / 100) * (v.shadows > 0 ? 0.8 : 0.45);
  const con = (v.contrast / 100) * 0.25;

  const base = (L: number): number => {
    let o = Math.pow(L, gamma);
    if (hl !== 0 && o > 0.6) {
      const u = (o - 0.6) / 0.4;
      o = 0.6 + 0.4 * (u - hl * hk * u * u * (1 - u));
    }
    if (sh !== 0 && o < 0.5) {
      const s = o / 0.5;
      o += sh * s * (1 - s) * (1 - s);
    }
    return o;
  };

  const n = analysis.w * analysis.h;
  const lum = new Float32Array(n);
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    lum[i] = base(prepared(analysis.data, i * 4));
    hist[Math.min(255, Math.max(0, Math.round(lum[i] * 255)))]++;
  }
  let acc = 0;
  let median = 128;
  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= n / 2) {
      median = i;
      break;
    }
  }
  const pivot = Math.min(0.85, Math.max(0.15, median / 255));
  const tone = (L: number): number => {
    let o = base(L);
    o += con * (o - pivot) * 4 * o * (1 - o);
    return Math.min(1, Math.max(0, o));
  };

  const N = 1024;
  const lut = new Float32Array(N + 2);
  for (let i = 0; i <= N; i++) lut[i] = tone(i / N);
  lut[N + 1] = lut[N];

  const k = (v.clarity / 100) * 0.8;
  let blur: Float32Array | undefined;
  let bw = 0;
  let bh = 0;
  if (k !== 0) {
    for (let i = 0; i < n; i++) {
      const o = lum[i];
      lum[i] = Math.min(1, Math.max(0, o + con * (o - pivot) * 4 * o * (1 - o)));
    }
    const radius = Math.max(
      2,
      Math.round(0.04 * Math.max(analysis.w, analysis.h)),
    );
    blur = boxBlur(lum, analysis.w, analysis.h, radius, 3);
    bw = analysis.w;
    bh = analysis.h;
  }

  const tex = (v.texture / 100) * (v.texture > 0 ? 1.5 : 0.85);
  const skin = (v.skin / 100) * 0.9;
  const dt = tex !== 0 || skin > 0;
  let dmap: Float32Array | undefined;
  let dw = 0;
  let dh = 0;
  if (dt) {
    const det = photo.detail;
    const key = [b0, w0, gr, gg, gb].join(",");
    if (det.cache == null || det.cache.key !== key) {
      const m = det.w * det.h;
      const map = new Float32Array(m);
      for (let i = 0; i < m; i++) map[i] = prepared(det.data, i * 4);
      const radius = Math.max(1, Math.round(0.004 * Math.max(det.w, det.h)));
      det.cache = { key, map: boxBlur(map, det.w, det.h, radius, 2) };
    }
    dmap = det.cache.map;
    dw = det.w;
    dh = det.h;
  }

  const smart = (v.smart / 100) * 0.95;
  const band = v.band / 100;
  const spot = v.spot / 100;
  const glow = (v.glow / 100) * 0.9;
  const soft = smart > 0 || band > 0 || spot > 0 || glow > 0;
  let fw = 0;
  let fh = 0;
  let sm: RgbPlanes | undefined;
  let sinv = 0;
  let m1: RgbPlanes | undefined;
  let m2: RgbPlanes | undefined;
  let fcx = 0.5;
  let fcy = 0.5;
  let bhalf = 0;
  let bfeather = 0;
  let shalf = 0;
  let sfeather = 0;

  if (soft) {
    const det = photo.detail;
    fw = det.w;
    fh = det.h;
    if (smart > 0) {
      const sigma = 0.03 + (0.07 * v.smart) / 100;
      sm = smartMap(det);
      sinv = 1 / (2 * sigma * sigma);
    }
    if (band > 0 || spot > 0 || glow > 0) {
      const softPlanes = softMaps(det);
      m1 = softPlanes.mild;
      m2 = softPlanes.strong;
    }
    const size = Math.pow(2, (v.focus_size / 100) * 1.6);
    fcx = 0.5 + v.focus_x / 200;
    fcy = 0.5 - v.focus_y / 200;
    bhalf = 0.09 * size;
    bfeather = 0.2 * Math.sqrt(size);
    shalf = 0.15 * size;
    sfeather = 0.3 * Math.sqrt(size);
  }

  const strip = (v.bottom / 100) * 0.35;
  const top = (v.top / 100) * 0.4;
  const vg = (v.vignette / 100) * 0.6;
  const sat = 1 + v.saturation / 100;
  const vib = (v.vibrance / 100) * 0.8;
  const cs = sat !== 1 || vib !== 0;

  const ms = new Float32Array(7);
  const ml = new Float32Array(7);
  const mh = new Float32Array(7);
  let mix = false;
  for (let i = 0; i < BANDS.length; i++) {
    const bandSpec = BANDS[i];
    ms[i] = v[`sat_${bandSpec.id}`] / 100;
    ml[i] = (v[`lum_${bandSpec.id}`] / 100) * 0.5;
    mh[i] = ((v[`hue_${bandSpec.id}`] / 100) * 120 * Math.PI) / 180;
    if (ms[i] !== 0 || ml[i] !== 0 || mh[i] !== 0) {
      mix = true;
    }
  }

  const gs = v.sh_tone / 100;
  const gh = v.hi_tone / 100;
  const gt = v.sh_tint / 100;
  const grade = gs !== 0 || gh !== 0 || gt !== 0;
  const grain = (v.grain / 100) * 0.16;
  const fade = (v.fade / 100) * 0.12;

  return {
    lv,
    b0,
    sc,
    gr,
    gg,
    gb,
    N,
    lut,
    k,
    blur,
    bw,
    bh,
    tex,
    skin,
    dt,
    dmap,
    dw,
    dh,
    smart,
    band,
    spot,
    glow,
    soft,
    fw,
    fh,
    sm,
    sinv,
    m1,
    m2,
    fcx,
    fcy,
    bhalf,
    bfeather,
    shalf,
    sfeather,
    strip,
    top,
    vg,
    sat,
    vib,
    cs,
    ms,
    ml,
    mh,
    mix,
    gs,
    gh,
    gt,
    grade,
    grain,
    fade,
  };
}

function grainHash(ix: number, iy: number): number {
  let n = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) & 0xffff) / 65535;
}

function grainLayer(u: number, v: number): number {
  const ix = Math.floor(u);
  const iy = Math.floor(v);
  const fx = u - ix;
  const fy = v - iy;
  const a = grainHash(ix, iy);
  const b = grainHash(ix + 1, iy);
  const c = grainHash(ix, iy + 1);
  const d = grainHash(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a + (a - b + d - c) * fx) * fy - 0.5;
}

function grainNoise(u: number, v: number): number {
  return (
    (grainLayer(u, v) + 0.6 * grainLayer(u * 2.3 + 17.1, v * 2.3 + 5.3)) * 1.6
  );
}

function tap(
  plane: Float32Array,
  q0: number,
  q1: number,
  dn: number,
  w00: number,
  w01: number,
  w10: number,
  w11: number,
): number {
  return (
    plane[q0] * w00 +
    plane[q1] * w01 +
    plane[q0 + dn] * w10 +
    plane[q1 + dn] * w11
  );
}

/** Mutates `d` RGBA pixels in place for `h` rows starting at `y0` out of `fullH` total rows. */
export function processRegion(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  y0: number,
  fullH: number,
  c: RenderContext,
): void {
  const lut = c.lut;
  const N = c.N;
  const k = c.k;
  const ms = c.ms;
  const ml = c.ml;
  const mh = c.mh;
  const gscale = c.grain > 0 ? Math.min(1, 1400 / Math.max(w, fullH)) : 0;
  const asx = w / Math.min(w, fullH);
  const asy = fullH / Math.min(w, fullH);

  for (let y = 0; y < h; y++) {
    const fy = (y0 + y + 0.5) / fullH;
    const dy = fy - 0.5;
    let rowMul = 1;
    if (c.strip > 0) {
      rowMul *= 1 - c.strip * Math.min(1, Math.max(0, (fy - 0.7) / 0.3));
    }
    if (c.top > 0) {
      rowMul *= 1 - c.top * Math.min(1, Math.max(0, (0.45 - fy) / 0.45));
    }
    let i = y * w * 4;

    for (let x = 0; x < w; x++, i += 4) {
      const fx = (x + 0.5) / w;
      let r = d[i] / 255;
      let g = d[i + 1] / 255;
      let b = d[i + 2] / 255;

      if (c.soft) {
        const gx = Math.min(c.fw - 1, Math.max(0, fx * c.fw - 0.5));
        const gy = Math.min(c.fh - 1, Math.max(0, fy * c.fh - 0.5));
        const ix = gx | 0;
        const iy = gy | 0;
        const wx = gx - ix;
        const wy = gy - iy;
        const q0 = iy * c.fw + ix;
        const q1 = ix + 1 < c.fw ? q0 + 1 : q0;
        const dn = iy + 1 < c.fh ? c.fw : 0;
        const w00 = (1 - wx) * (1 - wy);
        const w01 = wx * (1 - wy);
        const w10 = (1 - wx) * wy;
        const w11 = wx * wy;

        if (c.smart > 0 && c.sm != null) {
          const sr = tap(c.sm[0], q0, q1, dn, w00, w01, w10, w11);
          const sg = tap(c.sm[1], q0, q1, dn, w00, w01, w10, w11);
          const sb = tap(c.sm[2], q0, q1, dn, w00, w01, w10, w11);
          const dl =
            0.2126 * (r - sr) + 0.7152 * (g - sg) + 0.0722 * (b - sb);
          const q = c.smart * Math.exp(-dl * dl * c.sinv);
          r += (sr - r) * q;
          g += (sg - g) * q;
          b += (sb - b) * q;
        }

        let m = 0;
        if (c.band > 0) {
          const dz = Math.abs(fy - c.fcy) - c.bhalf;
          if (dz > 0) {
            const t = Math.min(1, dz / c.bfeather);
            m = c.band * t * t * (3 - 2 * t);
          }
        }
        if (c.spot > 0) {
          const ex = (fx - c.fcx) * asx;
          const ey = (fy - c.fcy) * asy;
          const dz = Math.sqrt(ex * ex + ey * ey) - c.shalf;
          if (dz > 0) {
            const t = Math.min(1, dz / c.sfeather);
            const msVal = c.spot * t * t * (3 - 2 * t);
            if (msVal > m) m = msVal;
          }
        }

        if ((m > 0 || c.glow > 0) && c.m1 != null && c.m2 != null) {
          let br = 0;
          let bg = 0;
          let bb = 0;
          if (m > 0.5 || c.glow > 0) {
            br = tap(c.m2[0], q0, q1, dn, w00, w01, w10, w11);
            bg = tap(c.m2[1], q0, q1, dn, w00, w01, w10, w11);
            bb = tap(c.m2[2], q0, q1, dn, w00, w01, w10, w11);
          }
          if (m > 0) {
            const ar = tap(c.m1[0], q0, q1, dn, w00, w01, w10, w11);
            const ag = tap(c.m1[1], q0, q1, dn, w00, w01, w10, w11);
            const ab = tap(c.m1[2], q0, q1, dn, w00, w01, w10, w11);
            if (m <= 0.5) {
              const q = m * 2;
              r += (ar - r) * q;
              g += (ag - g) * q;
              b += (ab - b) * q;
            } else {
              const q = (m - 0.5) * 2;
              r = ar + (br - ar) * q;
              g = ag + (bg - ag) * q;
              b = ab + (bb - ab) * q;
            }
          }
          if (c.glow > 0) {
            r = 1 - (1 - r) * (1 - c.glow * br * br);
            g = 1 - (1 - g) * (1 - c.glow * bg * bg);
            b = 1 - (1 - b) * (1 - c.glow * bb * bb);
          }
        }
      }

      if (c.lv) {
        r = (r - c.b0) * c.sc;
        g = (g - c.b0) * c.sc;
        b = (b - c.b0) * c.sc;
        if (r < 0) r = 0;
        if (g < 0) g = 0;
        if (b < 0) b = 0;
      }
      r *= c.gr;
      g *= c.gg;
      b *= c.gb;
      if (r > 1) r = 1;
      if (g > 1) g = 1;
      if (b > 1) b = 1;

      let L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (c.dt && c.dmap != null) {
        const diff = L - bilinear(c.dmap, c.dw, c.dh, fx, fy);
        let adj = c.tex * diff;
        if (c.skin > 0 && r >= g && g >= b && r > b && r > 0.06) {
          const s = (r - b) / r;
          const hue = (60 * (g - b)) / (r - b);
          const hw = 1 - Math.abs(hue - 22) / 28;
          if (hw > 0) {
            const sw =
              hw *
              Math.min(1, Math.max(0, (s - 0.08) / 0.12)) *
              Math.min(1, Math.max(0, (0.8 - s) / 0.2));
            adj -= c.skin * sw * Math.exp((-diff * diff) / 0.0036) * diff;
          }
        }
        const L2 = Math.min(1, Math.max(0, L + adj));
        if (L > 1e-4) {
          const q = L2 / L;
          r *= q;
          g *= q;
          b *= q;
        }
        L = L2;
      }

      const p = L * N;
      const i0 = p | 0;
      let Lt = lut[i0] + (lut[i0 + 1] - lut[i0]) * (p - i0);
      if (k !== 0 && c.blur != null) {
        Lt += k * (Lt - bilinear(c.blur, c.bw, c.bh, fx, fy)) * 4 * Lt * (1 - Lt);
        if (Lt < 0) Lt = 0;
        else if (Lt > 1) Lt = 1;
      }

      let mul = rowMul;
      if (c.vg !== 0) {
        const dx = fx - 0.5;
        const tt = (dx * dx + dy * dy) * 2;
        mul *= 1 - c.vg * tt * tt;
      }
      if (mul !== 1) {
        Lt *= mul;
        if (Lt > 1) Lt = 1;
      }

      if (L > 1e-4) {
        const ratio = Lt / L;
        r *= ratio;
        g *= ratio;
        b *= ratio;
      } else {
        r = g = b = Lt;
      }

      if (c.mix) {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const ch = mx - mn;
        if (ch > 1e-4) {
          let hue: number;
          if (mx === r) hue = (g - b) / ch;
          else if (mx === g) hue = (b - r) / ch + 2;
          else hue = (r - g) / ch + 4;
          hue *= 60;
          if (hue < 0) hue += 360;

          let a: number;
          let f: number;
          if (hue < 30) {
            a = 0;
            f = hue / 30;
          } else if (hue < 60) {
            a = 1;
            f = (hue - 30) / 30;
          } else if (hue < 120) {
            a = 2;
            f = (hue - 60) / 60;
          } else if (hue < 180) {
            a = 3;
            f = (hue - 120) / 60;
          } else if (hue < 240) {
            a = 4;
            f = (hue - 180) / 60;
          } else if (hue < 300) {
            a = 5;
            f = (hue - 240) / 60;
          } else {
            a = 6;
            f = (hue - 300) / 60;
          }

          const a1 = a === 6 ? 0 : a + 1;
          const cw = Math.min(1, ch / mx / 0.2);
          const la = (ml[a] + (ml[a1] - ml[a]) * f) * cw;
          const sa = (ms[a] + (ms[a1] - ms[a]) * f) * cw;
          const ha = (mh[a] + (mh[a1] - mh[a]) * f) * cw;

          if (ha !== 0) {
            const co = Math.cos(ha);
            const si = Math.sin(ha) * 0.57735;
            const mAvg = ((r + g + b) / 3) * (1 - co);
            const r2 = r * co + (b - g) * si + mAvg;
            const g2 = g * co + (r - b) * si + mAvg;
            const b2 = b * co + (g - r) * si + mAvg;
            const fix = Lt - (0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2);
            r = r2 + fix;
            g = g2 + fix;
            b = b2 + fix;
          }
          if (la !== 0) {
            const q = 1 + la;
            r *= q;
            g *= q;
            b *= q;
            Lt *= q;
          }
          if (sa !== 0) {
            const q = Math.max(0, 1 + sa);
            r = Lt + (r - Lt) * q;
            g = Lt + (g - Lt) * q;
            b = Lt + (b - Lt) * q;
          }
        }
      }

      if (c.cs) {
        const hi = Math.max(r, g, b);
        const lo = Math.min(r, g, b);
        const s = hi > 0 ? Math.min(1, Math.max(0, (hi - lo) / hi)) : 0;
        const gain = c.sat * (1 + c.vib * (1 - s));
        r = Lt + (r - Lt) * gain;
        g = Lt + (g - Lt) * gain;
        b = Lt + (b - Lt) * gain;
      }

      if (c.grade || c.grain > 0) {
        const Lc = Lt < 0 ? 0 : Lt > 1 ? 1 : Lt;
        if (c.grade) {
          const ws = 4 * Lc * (1 - Lc) * (1 - Lc);
          const wh = 4 * Lc * Lc * (1 - Lc);
          const t2 = (c.gs * ws + c.gh * wh) * 0.1;
          r += t2;
          b -= t2;
          g += t2 < 0 ? -t2 * 0.35 : t2 * 0.15;
          const m2 = c.gt * ws * 0.07;
          g -= m2;
          r += m2 * 0.3;
          b += m2 * 0.3;
        }
        if (c.grain > 0) {
          const amp =
            c.grain *
            (0.35 + 2.6 * Lc * (1 - Lc)) *
            grainNoise((x + 0.5) * gscale, (y0 + y + 0.5) * gscale);
          r += amp;
          g += amp;
          b += amp;
        }
      }

      if (c.fade > 0) {
        const q = 1 - c.fade;
        r = c.fade + r * q;
        g = c.fade + g * q;
        b = c.fade + b * q;
      }

      d[i] = r * 255;
      d[i + 1] = g * 255;
      d[i + 2] = b * 255;
    }
  }
}

/** Decodes a browser image file (`JPEG`, `PNG`, or `WebP`), reads JPEG metadata, and builds analysis pyramids. */
export async function loadPhoto(blob: Blob, name: string): Promise<LoadedPhoto> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const hasJpegMagic = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;
  let meta: JpegMetadata | null = null;
  if (hasJpegMagic) {
    try {
      meta = readJpegMeta(buf);
    } catch {
      meta = null;
    }
  }
  const preferredColorSpace: PredefinedColorSpace =
    meta?.iccKind === "p3" ? "display-p3" : "srgb";
  const bitmap = await createImageBitmap(blob, {
    imageOrientation: "from-image",
  });
  const analysis = smallCopy(bitmap, 256, preferredColorSpace);
  const detail = smallCopy(bitmap, 1024, analysis.colorSpace);
  analysis.canvas.width = 0;
  detail.canvas.width = 0;

  return {
    id: `photo-${nextPhotoSeq++}`,
    name,
    buf,
    isJpeg: hasJpegMagic && meta != null,
    meta,
    colorSpace: analysis.colorSpace,
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    analysis: { w: analysis.w, h: analysis.h, data: analysis.data },
    detail: {
      w: detail.w,
      h: detail.h,
      data: detail.data,
      cache: null,
    },
  };
}

/** Formats the output filename as `<stem>_edited.jpg`. */
export function exportName(name: string): string {
  const dot = name.lastIndexOf(".");
  return `${dot > 0 ? name.slice(0, dot) : name}_edited.jpg`;
}

/** Renders `photo` at full resolution in chunked strips and splices original JPEG metadata when applicable. */
export async function exportPhoto(
  photo: LoadedPhoto,
  values: Readonly<ParamValues>,
  quality: number,
  onProgress?: (fraction: number) => void,
): Promise<ExportResult> {
  if (photo.isJpeg && isNeutral(values)) {
    return {
      blob: new Blob([photo.buf], { type: "image/jpeg" }),
      copy: true,
    };
  }

  const w = photo.width;
  const h = photo.height;
  const { canvas, ctx, colorSpace } = makeCanvas(w, h, photo.colorSpace);
  ctx.drawImage(photo.bitmap, 0, 0);

  if (!isNeutral(values)) {
    const context = buildContext(values, photo);
    const rows = Math.max(16, Math.floor(3_000_000 / w));
    for (let y = 0; y < h; y += rows) {
      const n = Math.min(rows, h - y);
      const strip = getImageDataSafe(ctx, 0, y, w, n, colorSpace);
      processRegion(strip.data, w, n, y, h, context);
      ctx.putImageData(strip, 0, y);
      onProgress?.((y + n) / h);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
    }
  }

  const encoded = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  canvas.width = 0;
  canvas.height = 0;

  if (encoded == null) {
    throw new Error("The browser could not encode this photo.");
  }
  if (!photo.isJpeg || photo.meta == null) {
    return { blob: encoded, copy: false };
  }

  const enc = new Uint8Array(await encoded.arrayBuffer());
  const keepIcc = photo.meta.iccKind !== "other";
  return {
    blob: spliceMetadata(photo.buf, enc, w, h, keepIcc),
    copy: false,
  };
}
