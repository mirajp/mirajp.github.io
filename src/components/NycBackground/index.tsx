import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CONFIG, resolveSeason } from "./config";
import SeasonSpinner from "./SeasonSpinner";
import { createSceneState } from "./state";
import {
  createEmptyRefs,
  renderSceneSvgElements,
  updateSceneDom,
} from "./systems";
import type {
  NycBackgroundProps,
  ResolvedSeasonTheme,
  SeasonTheme,
} from "./types";

export interface NycHeroControlDetail {
  season?: SeasonTheme;
  replayDraw?: boolean;
  paused?: boolean;
  inspectInk?: boolean;
}

const VALID_SEASONS = new Set<SeasonTheme>([
  "auto",
  "stPatricks",
  "easter",
  "summer",
  "july4th",
  "halloween",
  "diwali",
  "thanksgiving",
  "christmas",
  "winter",
  "classic",
]);

function readInitialSeason(propSeason?: SeasonTheme): SeasonTheme {
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("season");
    if (param && VALID_SEASONS.has(param as SeasonTheme)) {
      return param as SeasonTheme;
    }
  }
  return propSeason ?? DEFAULT_CONFIG.season;
}

function withAlpha(rgba: string, multiplier: number): string {
  const m = rgba.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/,
  );
  if (!m) return rgba;
  const baseA = m[4] !== undefined ? parseFloat(m[4]) : 1;
  const a = Math.max(0, Math.min(1, baseA * multiplier)).toFixed(3);
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`;
}

export default function NycBackground(props: NycBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const skylineCanvasRef = useRef<HTMLCanvasElement>(null);
  const skylineImageRef = useRef<HTMLImageElement | null>(null);
  const nightWindowsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nightLitDarkMaskRef = useRef<Uint8Array | null>(null);
  const libertyLightCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const libertyDarkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const refs = useRef(createEmptyRefs());

  const [seasonPref, setSeasonPref] = useState<SeasonTheme>(() =>
    readInitialSeason(props.season),
  );
  const [drawCycle, setDrawCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inspectInk, setInspectInk] = useState(false);
  const [esbHovered, setEsbHovered] = useState(false);
  const [skylineReady, setSkylineReady] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-theme") === "dark"
      : false,
  );
  const [size, setSize] = useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 1440,
    height: 480,
  }));

  const resolvedSeason: ResolvedSeasonTheme = useMemo(
    () => resolveSeason(seasonPref),
    [seasonPref],
  );

  // Load skyline.png once, luminance-key white paper, and extract enclosed window panes for dark-mode night lighting
  useEffect(() => {
    const img = new Image();
    img.src = "/skyline.png";
    img.onload = () => {
      skylineImageRef.current = img;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = nw;
      srcCanvas.height = nh;
      const srcCtx = srcCanvas.getContext("2d");
      if (srcCtx && nw > 0 && nh > 0) {
        srcCtx.drawImage(img, 0, 0, nw, nh);
        const srcData = srcCtx.getImageData(0, 0, nw, nh).data;
        const winCanvas = document.createElement("canvas");
        winCanvas.width = nw;
        winCanvas.height = nh;
        const winCtx = winCanvas.getContext("2d");
        if (winCtx) {
          const winImg = winCtx.createImageData(nw, nh);
          const wData = winImg.data;
          const litDarkMask = new Uint8Array(nw * nh);
          const pickNightWindowColor = (
            hashVal: number,
            alphaBoost = 1,
          ): [number, number, number, number] => {
            const k = hashVal % 12;
            if (k < 6) {
              return [252, 206, 118, Math.min(255, Math.round(152 * alphaBoost))];
            }
            if (k < 9) {
              return [255, 236, 188, Math.min(255, Math.round(136 * alphaBoost))];
            }
            if (k < 11) {
              return [190, 226, 248, Math.min(255, Math.round(116 * alphaBoost))];
            }
            return [246, 176, 88, Math.min(255, Math.round(142 * alphaBoost))];
          };

          const qx = new Int32Array(nw * nh);
          const qy = new Int32Array(nw * nh);
          const xMinScan = Math.max(185, Math.floor(nw * 0.095));
          const xMaxScan = Math.floor(nw * 0.99);

          // Pass 1: Enclosed bright window panes, vertical shaft recesses & horizontal curtain-wall floor strips
          const visitedBright = new Uint8Array(nw * nh);
          const yMinBright = Math.floor(nh * 0.16);
          const yMaxBright = Math.floor(nh * 0.898);

          for (let y = yMinBright; y < yMaxBright; y++) {
            for (let x = xMinScan; x < xMaxScan; x++) {
              const idx = y * nw + x;
              if (visitedBright[idx]) continue;
              const p = idx * 4;
              const a = srcData[p + 3];
              const lum = (srcData[p] + srcData[p + 1] + srcData[p + 2]) / 765;
              if (a <= 200 || lum <= 0.87) continue;

              let head = 0;
              let tail = 0;
              qx[tail] = x;
              qy[tail] = y;
              tail++;
              visitedBright[idx] = 1;

              let minX = x;
              let maxX = x;
              let minY = y;
              let maxY = y;
              let touchesSky = false;

              while (head < tail) {
                const cx = qx[head];
                const cy = qy[head];
                head++;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const neighbors = [
                  [cx + 1, cy],
                  [cx - 1, cy],
                  [cx, cy + 1],
                  [cx, cy - 1],
                ];
                for (let n = 0; n < 4; n++) {
                  const nx = neighbors[n][0];
                  const ny = neighbors[n][1];
                  if (nx < 0 || nx >= nw || ny < 0 || ny >= nh) {
                    touchesSky = true;
                    continue;
                  }
                  const nIdx = ny * nw + nx;
                  const np = nIdx * 4;
                  if (srcData[np + 3] < 140) {
                    touchesSky = true;
                    continue;
                  }
                  if (visitedBright[nIdx]) continue;
                  const nLum =
                    (srcData[np] + srcData[np + 1] + srcData[np + 2]) / 765;
                  if (nLum > 0.87) {
                    visitedBright[nIdx] = 1;
                    qx[tail] = nx;
                    qy[tail] = ny;
                    tail++;
                  }
                }
              }

              if (touchesSky) continue;
              const bw = maxX - minX + 1;
              const bh = maxY - minY + 1;
              const area = tail;
              const fillRatio = area / Math.max(1, bw * bh);

              if (
                area >= 4 &&
                area <= 320 &&
                bw >= 2 &&
                bw <= 22 &&
                bh >= 2 &&
                bh <= 26 &&
                fillRatio >= 0.42
              ) {
                const hash =
                  (((minX * 73856093) ^ (minY * 19349663)) >>> 0);
                if (hash % 100 < 58) {
                  const [wr, wg, wb, wa] = pickNightWindowColor(hash, 1.0);
                  for (let k = 0; k < tail; k++) {
                    const wp = (qy[k] * nw + qx[k]) * 4;
                    wData[wp] = wr;
                    wData[wp + 1] = wg;
                    wData[wp + 2] = wb;
                    wData[wp + 3] = wa;
                  }
                }
              } else if (
                bw >= 2 &&
                bw <= 11 &&
                bh > 26 &&
                bh <= 260 &&
                fillRatio >= 0.38
              ) {
                for (let k = 0; k < tail; k++) {
                  const px = qx[k];
                  const py = qy[k];
                  const relY = py - minY;
                  const modY = relY % 6;
                  if (modY === 0 || modY === 5) continue;
                  const fl = Math.floor(relY / 6);
                  const hash = (((minX * 73856093) ^ (fl * 83492791)) >>> 0);
                  if (hash % 100 < 52) {
                    const [wr, wg, wb, wa] = pickNightWindowColor(hash, 0.92);
                    const wp = (py * nw + px) * 4;
                    wData[wp] = wr;
                    wData[wp + 1] = wg;
                    wData[wp + 2] = wb;
                    wData[wp + 3] = wa;
                  }
                }
              } else if (
                bw > 18 &&
                bw <= 95 &&
                bh >= 2 &&
                bh <= 12 &&
                fillRatio >= 0.38
              ) {
                for (let k = 0; k < tail; k++) {
                  const px = qx[k];
                  const py = qy[k];
                  const relX = px - minX;
                  if (relX % 7 === 0) continue;
                  const bay = Math.floor(relX / 7);
                  const hash = (((bay * 73856093) ^ (minY * 19349663)) >>> 0);
                  if (hash % 100 < 55) {
                    const [wr, wg, wb, wa] = pickNightWindowColor(hash, 0.92);
                    const wp = (py * nw + px) * 4;
                    wData[wp] = wr;
                    wData[wp + 1] = wg;
                    wData[wp + 2] = wb;
                    wData[wp + 3] = wa;
                  }
                }
              }
            }
          }

          // Pass 2: Enclosed dark-shaded skyscraper window panes, fluted ESB channels & One WTC floor ribbons
          const visitedDark = new Uint8Array(nw * nh);
          const yMinDark = Math.floor(nh * 0.2);
          const yMaxDark = Math.floor(nh * 0.895);

          for (let y = yMinDark; y < yMaxDark; y++) {
            for (let x = xMinScan; x < xMaxScan; x++) {
              const idx = y * nw + x;
              if (visitedDark[idx]) continue;
              const p = idx * 4;
              const a = srcData[p + 3];
              const lum = (srcData[p] + srcData[p + 1] + srcData[p + 2]) / 765;
              if (a <= 210 || lum >= 0.5) continue;

              let head = 0;
              let tail = 0;
              qx[tail] = x;
              qy[tail] = y;
              tail++;
              visitedDark[idx] = 1;

              let minX = x;
              let maxX = x;
              let minY = y;
              let maxY = y;
              let touchesSky = false;
              let borderLumSum = 0;
              let borderCount = 0;

              while (head < tail) {
                const cx = qx[head];
                const cy = qy[head];
                head++;
                if (cx < minX) minX = cx;
                if (cx > maxX) maxX = cx;
                if (cy < minY) minY = cy;
                if (cy > maxY) maxY = cy;

                const neighbors = [
                  [cx + 1, cy],
                  [cx - 1, cy],
                  [cx, cy + 1],
                  [cx, cy - 1],
                ];
                for (let n = 0; n < 4; n++) {
                  const nx = neighbors[n][0];
                  const ny = neighbors[n][1];
                  if (nx < 0 || nx >= nw || ny < 0 || ny >= nh) {
                    touchesSky = true;
                    continue;
                  }
                  const nIdx = ny * nw + nx;
                  const np = nIdx * 4;
                  if (srcData[np + 3] < 180) {
                    touchesSky = true;
                    continue;
                  }
                  const nLum =
                    (srcData[np] + srcData[np + 1] + srcData[np + 2]) / 765;
                  if (nLum < 0.5) {
                    if (!visitedDark[nIdx]) {
                      visitedDark[nIdx] = 1;
                      qx[tail] = nx;
                      qy[tail] = ny;
                      tail++;
                    }
                  } else {
                    borderLumSum += nLum;
                    borderCount++;
                  }
                }
              }

              if (touchesSky || borderCount === 0) continue;
              const avgBorderLum = borderLumSum / borderCount;
              if (avgBorderLum < 0.74) continue;

              const bw = maxX - minX + 1;
              const bh = maxY - minY + 1;
              const area = tail;
              const fillRatio = area / Math.max(1, bw * bh);

              if (
                area >= 4 &&
                area <= 64 &&
                bw >= 2 &&
                bw <= 10 &&
                bh >= 2 &&
                bh <= 12 &&
                fillRatio >= 0.45
              ) {
                const hash = (((minX * 73856093) ^ (minY * 19349663)) >>> 0);
                if (hash % 100 < 62) {
                  const [wr, wg, wb, wa] = pickNightWindowColor(hash, 1.05);
                  for (let k = 0; k < tail; k++) {
                    const mIdx = qy[k] * nw + qx[k];
                    litDarkMask[mIdx] = 1;
                    const wp = mIdx * 4;
                    wData[wp] = wr;
                    wData[wp + 1] = wg;
                    wData[wp + 2] = wb;
                    wData[wp + 3] = wa;
                  }
                }
              } else if (
                bw >= 2 &&
                bw <= 7 &&
                bh > 22 &&
                bh <= 250 &&
                fillRatio >= 0.42
              ) {
                for (let k = 0; k < tail; k++) {
                  const px = qx[k];
                  const py = qy[k];
                  const relY = py - minY;
                  const modY = relY % 6;
                  if (modY === 0 || modY === 5) continue;
                  const fl = Math.floor(relY / 6);
                  const hash = (((minX * 73856093) ^ (fl * 83492791)) >>> 0);
                  if (hash % 100 < 48) {
                    const [wr, wg, wb, wa] = pickNightWindowColor(hash, 0.95);
                    const mIdx = py * nw + px;
                    litDarkMask[mIdx] = 1;
                    const wp = mIdx * 4;
                    wData[wp] = wr;
                    wData[wp + 1] = wg;
                    wData[wp + 2] = wb;
                    wData[wp + 3] = wa;
                  }
                }
              } else if (
                bw >= 10 &&
                bw <= 50 &&
                bh >= 2 &&
                bh <= 7 &&
                fillRatio >= 0.45
              ) {
                for (let k = 0; k < tail; k++) {
                  const px = qx[k];
                  const py = qy[k];
                  const relX = px - minX;
                  if (relX % 6 === 0) continue;
                  const bay = Math.floor(relX / 6);
                  const hash = (((bay * 73856093) ^ (minY * 19349663)) >>> 0);
                  if (hash % 100 < 52) {
                    const [wr, wg, wb, wa] = pickNightWindowColor(hash, 0.95);
                    const mIdx = py * nw + px;
                    litDarkMask[mIdx] = 1;
                    const wp = mIdx * 4;
                    wData[wp] = wr;
                    wData[wp + 1] = wg;
                    wData[wp + 2] = wb;
                    wData[wp + 3] = wa;
                  }
                }
              }
            }
          }

          winCtx.putImageData(winImg, 0, 0);
          nightWindowsCanvasRef.current = winCanvas;
          nightLitDarkMaskRef.current = litDarkMask;
        }

        // Pre-render Statue of Liberty copper patina tint (light mode) & luminous night floodlight (dark mode)
        const libLightCanvas = document.createElement("canvas");
        libLightCanvas.width = nw;
        libLightCanvas.height = nh;
        const libDarkCanvas = document.createElement("canvas");
        libDarkCanvas.width = nw;
        libDarkCanvas.height = nh;
        const llCtx = libLightCanvas.getContext("2d");
        const ldCtx = libDarkCanvas.getContext("2d");
        if (llCtx && ldCtx) {
          const llImg = llCtx.createImageData(nw, nh);
          const ldImg = ldCtx.createImageData(nw, nh);
          const llData = llImg.data;
          const ldData = ldImg.data;

          // Native 1994x789 Statue of Liberty bounds: torch flame (y=417..430), copper statue (y=431..595), pedestal (y=596..676)
          const xStart = Math.max(0, Math.floor(nw * (92 / 1994)));
          const xEnd = Math.min(nw, Math.ceil(nw * (174 / 1994)));
          const yFlameStart = Math.max(0, Math.floor(nh * (417 / 789)));
          const yFlameEnd = Math.floor(nh * (431 / 789));
          const yCopperEnd = Math.floor(nh * (595 / 789));
          const yPedestalEnd = Math.min(nh, Math.ceil(nh * (676 / 789)));

          for (let y = yFlameStart; y < yPedestalEnd; y++) {
            for (let x = xStart; x < xEnd; x++) {
              const p = (y * nw + x) * 4;
              const a = srcData[p + 3] / 255;
              if (a < 0.05) continue;
              const lum = (srcData[p] + srcData[p + 1] + srcData[p + 2]) / 765;

              if (y < yFlameEnd && x >= 100 && x <= 114) {
                // Torch flame: warm amber in light mode, bright shining gold in night mode
                llData[p] = 234;
                llData[p + 1] = 172;
                llData[p + 2] = 44;
                llData[p + 3] = Math.round(255 * a * (0.38 + 0.42 * lum));

                ldData[p] = Math.round(180 + 75 * lum);
                ldData[p + 1] = Math.round(135 + 100 * lum);
                ldData[p + 2] = Math.round(32 + 78 * lum);
                ldData[p + 3] = Math.round(255 * a * (0.72 + 0.28 * lum));
              } else if (y >= yFlameEnd && y <= yCopperEnd && x >= 96 && x <= 168) {
                // Copper statue body, crown, arm, tablet & robe:
                // Light mode: subtle oxidized verdigris patina wash behind dark drapery ink
                llData[p] = 88;
                llData[p + 1] = 172;
                llData[p + 2] = 144;
                llData[p + 3] = Math.round(255 * a * (0.22 + 0.18 * lum));

                // Dark mode: positive 3D floodlit verdigris copper shine (bright seafoam highlights + deep teal fold shadows)
                const vBoost =
                  0.86 + 0.24 * ((y - yFlameEnd) / Math.max(1, yCopperEnd - yFlameEnd));
                const shade = Math.pow(lum, 0.78) * vBoost;
                ldData[p] = Math.min(255, Math.round(20 + 108 * shade));
                ldData[p + 1] = Math.min(255, Math.round(58 + 178 * shade));
                ldData[p + 2] = Math.min(255, Math.round(48 + 144 * shade));
                ldData[p + 3] = Math.round(255 * a * (0.68 + 0.28 * lum));
              } else if (y > yCopperEnd) {
                // Granite pedestal in dark mode: warm stone uplight + 3 glowing recessed front colonnade arches
                const inArchedBayInterior =
                  y >= 625 &&
                  y <= 634 &&
                  ((x >= 114 && x <= 116) ||
                    (x >= 123 && x <= 124) ||
                    (x >= 132 && x <= 133));
                if (inArchedBayInterior && lum > 0.42) {
                  ldData[p] = 250;
                  ldData[p + 1] = 204;
                  ldData[p + 2] = 118;
                  ldData[p + 3] = Math.round(255 * a * 0.62);
                } else if (lum > 0.62) {
                  ldData[p] = 212;
                  ldData[p + 1] = 188;
                  ldData[p + 2] = 146;
                  ldData[p + 3] = Math.round(255 * a * 0.14 * lum);
                }
              }
            }
          }
          llCtx.putImageData(llImg, 0, 0);
          ldCtx.putImageData(ldImg, 0, 0);
          libertyLightCanvasRef.current = libLightCanvas;
          libertyDarkCanvasRef.current = libDarkCanvas;
        }
      }
      setSkylineReady(true);
    };
  }, []);

  // Sync container bounds via ResizeObserver so the SVG viewBox matches the hero 1:1
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setSize((prev) =>
          Math.abs(prev.width - rect.width) > 2 ||
          Math.abs(prev.height - rect.height) > 2
            ? { width: Math.round(rect.width), height: Math.round(rect.height) }
            : prev,
        );
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Observe Crisp Forest [data-theme="dark"] changes on <html>
  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () =>
      setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();

    const mo = new MutationObserver(syncTheme);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // Listen for sandbox toolbar events (season switch, ink-draw replay, pause, ink contrast)
  useEffect(() => {
    const onControl = (event: Event) => {
      const detail = (event as CustomEvent<NycHeroControlDetail>).detail;
      if (!detail) return;
      if (detail.season) {
        setSeasonPref(detail.season);
        setDrawCycle((c) => c + 1);
      } else if (detail.replayDraw) {
        setDrawCycle((c) => c + 1);
      }
      if (typeof detail.paused === "boolean") {
        setPaused(detail.paused);
      }
      if (typeof detail.inspectInk === "boolean") {
        setInspectInk(detail.inspectInk);
      }
    };

    window.addEventListener("nyc-hero:control", onControl);
    return () => window.removeEventListener("nyc-hero:control", onControl);
  }, []);

  const handleSpinnerSelectSeason = useCallback((nextSeason: SeasonTheme) => {
    setSeasonPref(nextSeason);
    setDrawCycle((c) => c + 1);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (nextSeason === "auto") {
        url.searchParams.delete("season");
      } else {
        url.searchParams.set("season", nextSeason);
      }
      window.history.replaceState({}, "", url);
      window.dispatchEvent(
        new CustomEvent("nyc-hero:season-changed", {
          detail: { season: nextSeason },
        }),
      );
    }
  }, []);

  const inkMultiplier = inspectInk ? 0.94 : 0.42;

  // Render luminance-keyed NYC skyline once per resize/theme/contrast change (0 per-frame cost, 0 offscreen CSS opacity group bugs)
  useEffect(() => {
    const canvas = skylineCanvasRef.current;
    const img = skylineImageRef.current;
    if (!canvas || !img || !skylineReady) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(size.width * dpr));
    const h = Math.max(1, Math.round(size.height * dpr));
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);

    const drawH = Math.round(w * (img.naturalHeight / img.naturalWidth));
    const drawY = h - drawH;
    ctx.drawImage(img, 0, drawY, w, drawH);

    const yStart = Math.max(0, drawY);
    const regionH = h - yStart;
    if (regionH <= 0) return;

    const imageData = ctx.getImageData(0, yStart, w, regionH);
    const data = imageData.data;
    const targetR = isDark ? 154 : 69;
    const targetG = isDark ? 166 : 79;
    const targetB = isDark ? 162 : 76;
    const skylineAlphaScale = (isDark ? 0.34 : 0.26) * (inspectInk ? 1.55 : 0.85);

    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const litDarkMask = nightLitDarkMaskRef.current;

    for (let y = 0; y < regionH; y++) {
      const canvasY = yStart + y;
      const srcY = ((canvasY - drawY) / Math.max(1, drawH)) * nh;
      const srcYi = Math.min(nh - 1, Math.max(0, Math.round(srcY)));
      const rowOffset = y * w * 4;
      for (let x = 0; x < w; x++) {
        const p = rowOffset + x * 4;
        const srcX = (x / Math.max(1, w)) * nw;
        const srcXi = Math.min(nw - 1, Math.max(0, Math.round(srcX)));
        const inLibertyCopper =
          srcX >= 96 && srcX <= 168 && srcY >= 417 && srcY <= 595;

        const srcAlpha = data[p + 3] / 255;
        const lum = (data[p] + data[p + 1] + data[p + 2]) / (3 * 255);
        const ink = srcAlpha * Math.max(0, 1 - lum);

        if (isDark && inLibertyCopper) {
          // Let libertyDarkCanvas render positive 3D floodlit verdigris highlights & shadows cleanly
          data[p + 3] = 0;
        } else if (!isDark && inLibertyCopper && srcY >= 431) {
          // Tint Lady Liberty's pen-and-ink drapery lines oxidized patina forest-green in light mode
          data[p] = 32;
          data[p + 1] = 92;
          data[p + 2] = 76;
          data[p + 3] = Math.round(
            255 * Math.min(1, ink * skylineAlphaScale * 1.18),
          );
        } else {
          const isLitDarkPane =
            isDark && litDarkMask !== null && litDarkMask[srcYi * nw + srcXi] === 1;
          const paneFade = isLitDarkPane ? 0.16 : 1.0;
          data[p] = targetR;
          data[p + 1] = targetG;
          data[p + 2] = targetB;
          data[p + 3] = Math.round(
            255 * Math.min(1, ink * skylineAlphaScale * paneFade),
          );
        }
      }
    }
    ctx.putImageData(imageData, 0, yStart);

    // Composite Statue of Liberty copper patina (light mode) or luminous floodlit shine + night windows (dark mode)
    if (isDark) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      if (libertyDarkCanvasRef.current) {
        ctx.globalAlpha = inspectInk ? 1.0 : 0.88;
        ctx.drawImage(libertyDarkCanvasRef.current, 0, drawY, w, drawH);
      }
      if (nightWindowsCanvasRef.current) {
        ctx.globalAlpha = inspectInk ? 1.0 : 0.9;
        ctx.drawImage(nightWindowsCanvasRef.current, 0, drawY, w, drawH);
      }
      ctx.restore();
    } else if (libertyLightCanvasRef.current) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.globalAlpha = inspectInk ? 1.0 : 0.78;
      ctx.drawImage(libertyLightCanvasRef.current, 0, drawY, w, drawH);
      ctx.restore();
    }
  }, [skylineReady, size.width, size.height, isDark, inspectInk]);

  const baseScale = Math.max(0.42, Math.min(0.76, size.width / 1920));

  const scene = useMemo(() => {
    refs.current = createEmptyRefs();
    return createSceneState(resolvedSeason, size.width, size.height, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedSeason,
    size.width,
    size.height,
    drawCycle,
    props.cloudCount,
    props.birdCount,
    props.witchCount,
    props.shipCount,
    props.helicopterCount,
    props.dogWizardCount,
    props.charonFerryCount,
  ]);

  // Imperative 60fps animation loop (positions frame 0 immediately; respects reduced motion)
  useEffect(() => {
    let rafId = 0;
    let lastTime = 0;

    updateSceneDom(
      scene,
      refs.current,
      0,
      size.width,
      size.height,
      baseScale,
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || paused) {
      return;
    }

    const tick = (now: number) => {
      const dt = lastTime === 0 ? 1 : Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;
      updateSceneDom(
        scene,
        refs.current,
        dt,
        size.width,
        size.height,
        baseScale,
      );
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [scene, size.width, size.height, baseScale, paused]);

  const colors = {
    sketch: withAlpha(
      props.sketchColor ??
        (isDark
          ? DEFAULT_CONFIG.sketchColorDark
          : DEFAULT_CONFIG.sketchColorLight),
      inkMultiplier,
    ),
    accent: withAlpha(
      props.accentColor ??
        (isDark
          ? DEFAULT_CONFIG.accentColorDark
          : DEFAULT_CONFIG.accentColorLight),
      Math.min(1, inkMultiplier * 1.15),
    ),
    primary: withAlpha(
      isDark
        ? DEFAULT_CONFIG.primaryColorDark
        : DEFAULT_CONFIG.primaryColorLight,
      Math.min(1, inkMultiplier * 1.15),
    ),
    gold: withAlpha(
      isDark
        ? DEFAULT_CONFIG.goldColorDark
        : DEFAULT_CONFIG.goldColorLight,
      Math.min(1, inkMultiplier * 1.15),
    ),
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
      data-active-season={resolvedSeason}
    >
      {/* Static luminance-keyed NYC skyline (redrawn only on resize/theme change) */}
      <canvas
        ref={skylineCanvasRef}
        className="absolute inset-0 z-0 h-full w-full"
      />

      {/* Seasonal animated SVG line drawings */}
      <svg
        key={`${resolvedSeason}-${drawCycle}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${size.width} ${size.height}`}
        width={size.width}
        height={size.height}
        fill="none"
        stroke={colors.sketch}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute inset-0 z-0 h-full w-full transition-[filter] duration-200 ${
          esbHovered ? "brightness-105" : ""
        }`}
      >
        {renderSceneSvgElements(
          scene,
          refs.current,
          baseScale,
          isDark,
          colors,
          inkMultiplier,
        )}
      </svg>

      {/* Hidden Easter Egg: Click the Empire State Building to open the Season Spinner */}
      <SeasonSpinner
        width={size.width}
        height={size.height}
        seasonPref={seasonPref}
        resolvedSeason={resolvedSeason}
        isDark={isDark}
        onSelectSeason={handleSpinnerSelectSeason}
        onEsbHoverChange={setEsbHovered}
      />
    </div>
  );
}
