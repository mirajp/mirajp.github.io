import type { CSSProperties } from "react";
import { SVG_PATHS } from "./paths";
import {
  DRONE_FORMATIONS,
  LIBERTY_LED_BULBS,
  LIBERTY_LED_STRANDS,
  SPIRE_PIXEL_GEOMETRY,
  skylinePxToSvg,
  skylineToSvg,
} from "./pathsCityDetails";
import type { SceneState } from "./state";
import { smoothstep, strokePx } from "./utils";

export interface CityDetailsDomRefs {
  spireLights: Array<{
    esbAntenna: SVGPathElement | null;
    esbMastWash: SVGPathElement | null;
    esbMastContours: SVGPathElement | null;
    esbParapet: SVGPathElement | null;
    esbUpperPiersPrimary: SVGPathElement | null;
    esbUpperPiersAccent: SVGPathElement | null;
    esbLowerPiersPrimary: SVGPathElement | null;
    esbLowerPiersAccent: SVGPathElement | null;
    esbMidTowerPiersPrimary: SVGPathElement | null;
    esbMidTowerPiersAccent: SVGPathElement | null;
    esbCrownLedges: SVGPathElement | null;
    esbTip: SVGGElement | null;
    wtcShafts: Array<SVGPathElement | null>;
    wtcCollars: SVGPathElement | null;
    wtcStruts: SVGPathElement | null;
    wtcPodiumRings: SVGPathElement | null;
    wtcBeaconGroup: SVGGElement | null;
    wtcBeamLeft: SVGPathElement | null;
    wtcBeamRight: SVGPathElement | null;
    libertyAura: SVGGElement | null;
    libertyTorchGlow: SVGGElement | null;
    nightChryslerWash: SVGPathElement | null;
    nightChryslerContours: SVGPathElement | null;
    nightChryslerTip: SVGGElement | null;
    nightAtriumWash: SVGPathElement | null;
    nightCoolCrowns: SVGPathElement | null;
    nightWoolworthWash: SVGPathElement | null;
    nightWarmCrowns: SVGPathElement | null;
    nightWarmPiers: SVGPathElement | null;
    nightWarmLanterns: Array<SVGGElement | null>;
    nightAviationBeacons: Array<SVGGElement | null>;
  }>;
  libertyStringLights: Array<{
    wires: Array<SVGPathElement | null>;
    bulbs: Array<SVGGElement | null>;
  }>;
  libertyIcicles: Array<SVGGElement | null>;
  droneShows: Array<{
    group: SVGGElement | null;
    drones: Array<SVGGElement | null>;
  }>;
  libertyBats: Array<{
    group: SVGGElement | null;
    wingLeft: SVGGElement | null;
    wingRight: SVGGElement | null;
  }>;
  waterfrontPumpkins: Array<{
    group: SVGGElement | null;
    face: SVGPathElement | null;
  }>;
  blackCats: Array<{
    group: SVGGElement | null;
    tail: SVGGElement | null;
    frontLegs: SVGPathElement | null;
    hindLegs: SVGPathElement | null;
  }>;
  windowCandles: Array<{
    group: SVGGElement | null;
    flame: SVGGElement | null;
  }>;
  buildingWreaths: Array<{
    group: SVGGElement | null;
    bow: SVGGElement | null;
  }>;
  waterfrontSnowmen: Array<{
    group: SVGGElement | null;
    waveArm: SVGGElement | null;
  }>;
}

export function createEmptyCityDetailsRefs(): CityDetailsDomRefs {
  return {
    spireLights: [],
    libertyStringLights: [],
    libertyIcicles: [],
    droneShows: [],
    libertyBats: [],
    waterfrontPumpkins: [],
    blackCats: [],
    windowCandles: [],
    buildingWreaths: [],
    waterfrontSnowmen: [],
  };
}

const drawDelay = (index: number, stepMs = 35): CSSProperties =>
  ({ "--draw-delay": `${Math.min(500, index * stepMs)}ms` }) as CSSProperties;

const DRONE_COUNT = 36;

const LED_BULB_COLORS_LIGHT = [
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#0284c7",
  "#db2777",
];
const LED_BULB_COLORS_DARK = [
  "#ff4d4d",
  "#4ade80",
  "#fbbf24",
  "#38bdf8",
  "#f472b6",
];

function pxPolyToPath(
  poly: ReadonlyArray<readonly [number, number]>,
  width: number,
  height: number,
): string {
  return (
    poly
      .map(([px, py], idx) => {
        const p = skylinePxToSvg(px, py, width, height);
        return `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
      })
      .join(" ") + " Z"
  );
}

function pxPolylinesToPath(
  lines: ReadonlyArray<ReadonlyArray<readonly [number, number]>>,
  width: number,
  height: number,
): string {
  return lines
    .map((pts) =>
      pts
        .map(([px, py], idx) => {
          const p = skylinePxToSvg(px, py, width, height);
          return `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        })
        .join(" "),
    )
    .join(" ");
}

function pxSegmentsToPath(
  segs: ReadonlyArray<readonly [number, number, number, number]>,
  width: number,
  height: number,
): string {
  return segs
    .map(([x0, y0, x1, y1]) => {
      const p0 = skylinePxToSvg(x0, y0, width, height);
      const p1 = skylinePxToSvg(x1, y1, width, height);
      return `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    })
    .join(" ");
}

export function renderCityDetailsSvgElements(
  scene: SceneState,
  refs: CityDetailsDomRefs,
  baseScale: number,
  isDark: boolean,
  colors: {
    sketch: string;
    accent: string;
    primary: string;
    gold: string;
    paperMask?: string;
  },
) {
  const paperMaskFill =
    colors.paperMask ?? "color-mix(in srgb, var(--background) 92%, transparent)";
  const blackCatFill = isDark
    ? "rgba(10, 14, 13, 0.96)"
    : "rgba(31, 41, 39, 0.9)";
  const paths = SVG_PATHS.cityDetails;
  const bulbPalette = isDark ? LED_BULB_COLORS_DARK : LED_BULB_COLORS_LIGHT;

  return (
    <>
      {/* 0. Meticulously Outlined Empire State & One WTC Spire Illumination (All Themes) */}
      {scene.spireLights.map((spire, i) => {
        const slot = (refs.spireLights[i] ??= {
          esbAntenna: null,
          esbMastWash: null,
          esbMastContours: null,
          esbParapet: null,
          esbUpperPiersPrimary: null,
          esbUpperPiersAccent: null,
          esbLowerPiersPrimary: null,
          esbLowerPiersAccent: null,
          esbMidTowerPiersPrimary: null,
          esbMidTowerPiersAccent: null,
          esbCrownLedges: null,
          esbTip: null,
          wtcShafts: [],
          wtcCollars: null,
          wtcStruts: null,
          wtcPodiumRings: null,
          wtcBeaconGroup: null,
          wtcBeamLeft: null,
          wtcBeamRight: null,
          libertyAura: null,
          libertyTorchGlow: null,
          nightChryslerWash: null,
          nightChryslerContours: null,
          nightChryslerTip: null,
          nightAtriumWash: null,
          nightCoolCrowns: null,
          nightWoolworthWash: null,
          nightWarmCrowns: null,
          nightWarmPiers: null,
          nightWarmLanterns: [],
          nightAviationBeacons: [],
        });
        const topCol = isDark ? spire.topColorDark : spire.topColorLight;
        const midCol = isDark ? spire.midColorDark : spire.midColorLight;
        const baseCol = isDark ? spire.baseColorDark : spire.baseColorLight;
        const beaconCol = isDark
          ? spire.beaconColorDark
          : spire.beaconColorLight;
        const wtcColors = [topCol, midCol, baseCol, topCol, midCol, baseCol];
        const gradPrefix = `nyc-spire-${i}`;

        return (
          <g key={`spires-${i}`} data-entity="nyc-landmark-spires">
            <defs>
              {/* Upward theatrical floodlight gradients (no boxy outlines!) */}
              <linearGradient id={`${gradPrefix}-mast`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={midCol} stopOpacity={isDark ? 0.5 : 0.36} />
                <stop offset="100%" stopColor={topCol} stopOpacity={isDark ? 0.2 : 0.12} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-upper-crown`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={midCol} stopOpacity={isDark ? 0.85 : 0.68} />
                <stop offset="100%" stopColor={midCol} stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-lower-crown`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={baseCol} stopOpacity={isDark ? 0.88 : 0.7} />
                <stop offset="100%" stopColor={baseCol} stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-accent-crown`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={topCol} stopOpacity={isDark ? 0.85 : 0.68} />
                <stop offset="100%" stopColor={topCol} stopOpacity={0.08} />
              </linearGradient>
              {/* Optical horizontal fade gradients for One WTC rotating harbor beacon */}
              <linearGradient id={`${gradPrefix}-beam-l`} x1="1" y1="0.5" x2="0" y2="0.5">
                <stop offset="0%" stopColor={beaconCol} stopOpacity={isDark ? 0.65 : 0.45} />
                <stop offset="100%" stopColor={beaconCol} stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-beam-r`} x1="0" y1="0.5" x2="1" y2="0.5">
                <stop offset="0%" stopColor={beaconCol} stopOpacity={isDark ? 0.65 : 0.45} />
                <stop offset="100%" stopColor={beaconCol} stopOpacity={0} />
              </linearGradient>
              <radialGradient id={`${gradPrefix}-lib-aura`} cx="50%" cy="55%" r="50%">
                <stop offset="0%" stopColor="#6ee7b7" stopOpacity={isDark ? 0.24 : 0.06} />
                <stop offset="60%" stopColor="#34d399" stopOpacity={isDark ? 0.09 : 0.02} />
                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
              </radialGradient>
              <radialGradient id={`${gradPrefix}-lib-torch`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity={isDark ? 0.85 : 0.35} />
                <stop offset="45%" stopColor="#f59e0b" stopOpacity={isDark ? 0.36 : 0.12} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </radialGradient>
              <linearGradient id={`${gradPrefix}-chrysler-wash`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#fde68a" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-atrium-wash`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#e0f2fe" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-woolworth-wash`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#fcd34d" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#6ee7b7" stopOpacity={0.08} />
              </linearGradient>
              <linearGradient id={`${gradPrefix}-warm-pier`} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.76} />
                <stop offset="100%" stopColor="#fef3c7" stopOpacity={0.06} />
              </linearGradient>
            </defs>

            {/* Night-Mode Architectural Crowns & Beacons Across Other NYC Landmarks */}
            {isDark && (
              <g data-entity="nyc-secondary-landmark-lights">
                <path
                  ref={(el) => {
                    slot.nightChryslerWash = el;
                  }}
                  d="M 0 0"
                  fill={`url(#${gradPrefix}-chrysler-wash)`}
                  stroke="none"
                />
                <path
                  ref={(el) => {
                    slot.nightAtriumWash = el;
                  }}
                  d="M 0 0"
                  fill={`url(#${gradPrefix}-atrium-wash)`}
                  stroke="none"
                />
                <path
                  ref={(el) => {
                    slot.nightWoolworthWash = el;
                  }}
                  d="M 0 0"
                  fill={`url(#${gradPrefix}-woolworth-wash)`}
                  stroke="none"
                />
                <path
                  ref={(el) => {
                    slot.nightWarmPiers = el;
                  }}
                  d="M 0 0"
                  fill="none"
                  stroke={`url(#${gradPrefix}-warm-pier)`}
                  strokeLinecap="butt"
                />
                <path
                  ref={(el) => {
                    slot.nightChryslerContours = el;
                  }}
                  d="M 0 0"
                  fill="none"
                  stroke="#fef3c7"
                  strokeOpacity={0.86}
                />
                <path
                  ref={(el) => {
                    slot.nightCoolCrowns = el;
                  }}
                  d="M 0 0"
                  fill="none"
                  stroke="#bae6fd"
                  strokeOpacity={0.76}
                />
                <path
                  ref={(el) => {
                    slot.nightWarmCrowns = el;
                  }}
                  d="M 0 0"
                  fill="none"
                  stroke="#fde68a"
                  strokeOpacity={0.8}
                />
                <g
                  ref={(el) => {
                    slot.nightChryslerTip = el;
                  }}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={3.8}
                    fill="#fef3c7"
                    fillOpacity={0.32}
                    stroke="none"
                  />
                  <circle cx={0} cy={0} r={1.3} fill="#ffffff" stroke="none" />
                </g>
                {SPIRE_PIXEL_GEOMETRY.nightCrowns.warmLanternPointsPx.map(
                  (_, lIdx) => (
                    <g
                      key={`night-lantern-${lIdx}`}
                      ref={(el) => {
                        slot.nightWarmLanterns[lIdx] = el;
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={3.4}
                        fill="#fbbf24"
                        fillOpacity={0.3}
                        stroke="none"
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={1.25}
                        fill="#fef08a"
                        stroke="none"
                      />
                    </g>
                  ),
                )}
                {SPIRE_PIXEL_GEOMETRY.nightCrowns.aviationBeaconsPx.map(
                  (_, bIdx) => (
                    <g
                      key={`aviation-beacon-${bIdx}`}
                      ref={(el) => {
                        slot.nightAviationBeacons[bIdx] = el;
                      }}
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={3.6}
                        fill="#ef4444"
                        fillOpacity={0.34}
                        stroke="none"
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={1.15}
                        fill="#fca5a5"
                        stroke="none"
                      />
                    </g>
                  ),
                )}
              </g>
            )}

            {/* Statue of Liberty Verdigris Night Shine & Golden Torch Halo */}
            <g
              ref={(el) => {
                slot.libertyAura = el;
              }}
            >
              <ellipse
                cx={0}
                cy={0}
                rx={26}
                ry={66}
                fill={`url(#${gradPrefix}-lib-aura)`}
                stroke="none"
              />
            </g>
            <g
              ref={(el) => {
                slot.libertyTorchGlow = el;
              }}
            >
              <circle
                cx={0}
                cy={0}
                r={12}
                fill={`url(#${gradPrefix}-lib-torch)`}
                stroke="none"
              />
              {isDark && (
                <circle
                  cx={0}
                  cy={0}
                  r={2.1}
                  fill="#fef08a"
                  fillOpacity={0.9}
                  stroke="none"
                />
              )}
            </g>

            {/* Empire State Building: soft inner mast glow + meticulous stepped & fluted contours */}
            <path
              ref={(el) => {
                slot.esbMastWash = el;
              }}
              d="M 0 0"
              fill={`url(#${gradPrefix}-mast)`}
              stroke="none"
            />
            <path
              ref={(el) => {
                slot.esbMidTowerPiersPrimary = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={`url(#${gradPrefix}-lower-crown)`}
              strokeLinecap="butt"
            />
            <path
              ref={(el) => {
                slot.esbMidTowerPiersAccent = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={`url(#${gradPrefix}-accent-crown)`}
              strokeLinecap="butt"
            />
            <path
              ref={(el) => {
                slot.esbLowerPiersPrimary = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={`url(#${gradPrefix}-lower-crown)`}
              strokeLinecap="butt"
            />
            <path
              ref={(el) => {
                slot.esbLowerPiersAccent = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={`url(#${gradPrefix}-accent-crown)`}
              strokeLinecap="butt"
            />
            <path
              ref={(el) => {
                slot.esbUpperPiersPrimary = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={`url(#${gradPrefix}-lower-crown)`}
              strokeLinecap="butt"
            />
            <path
              ref={(el) => {
                slot.esbUpperPiersAccent = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={`url(#${gradPrefix}-upper-crown)`}
              strokeLinecap="butt"
            />
            <path
              ref={(el) => {
                slot.esbCrownLedges = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={baseCol}
              strokeOpacity={isDark ? 0.78 : 0.62}
            />
            <path
              ref={(el) => {
                slot.esbParapet = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={baseCol}
              strokeOpacity={isDark ? 0.85 : 0.68}
            />
            <path
              ref={(el) => {
                slot.esbMastContours = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={midCol}
              strokeOpacity={isDark ? 0.92 : 0.76}
            />
            <path
              ref={(el) => {
                slot.esbAntenna = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={topCol}
              strokeOpacity={isDark ? 0.95 : 0.82}
            />
            <g
              ref={(el) => {
                slot.esbTip = el;
              }}
            >
              <circle
                cx={0}
                cy={0}
                r={4.2}
                fill={beaconCol}
                fillOpacity={isDark ? 0.3 : 0.18}
                stroke="none"
              />
              <circle cx={0} cy={0} r={1.4} fill={beaconCol} stroke="none" />
            </g>

            {/* One World Trade Center: slender spire shafts, radome collars, tripod struts & optical beacon */}
            <path
              ref={(el) => {
                slot.wtcPodiumRings = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={baseCol}
              strokeOpacity={isDark ? 0.82 : 0.65}
            />
            <path
              ref={(el) => {
                slot.wtcStruts = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={midCol}
              strokeOpacity={isDark ? 0.84 : 0.68}
            />
            {SPIRE_PIXEL_GEOMETRY.wtc.shaftSegments.map((_, sIdx) => {
              const sCol = wtcColors[sIdx % wtcColors.length];
              return (
                <path
                  key={`wtc-shaft-${sIdx}`}
                  ref={(el) => {
                    slot.wtcShafts[sIdx] = el;
                  }}
                  d="M 0 0"
                  fill="none"
                  stroke={sCol}
                  strokeLinecap="butt"
                />
              );
            })}
            <path
              ref={(el) => {
                slot.wtcCollars = el;
              }}
              d="M 0 0"
              fill="none"
              stroke={beaconCol}
              strokeOpacity={isDark ? 0.92 : 0.75}
            />
            <g
              ref={(el) => {
                slot.wtcBeaconGroup = el;
              }}
            >
              <path
                ref={(el) => {
                  slot.wtcBeamLeft = el;
                }}
                d="M 0 0 L -22 -2 L -22 2 Z"
                fill={`url(#${gradPrefix}-beam-l)`}
                stroke="none"
              />
              <path
                ref={(el) => {
                  slot.wtcBeamRight = el;
                }}
                d="M 0 0 L 22 -2 L 22 2 Z"
                fill={`url(#${gradPrefix}-beam-r)`}
                stroke="none"
              />
              <circle
                cx={0}
                cy={0}
                r={4.2}
                fill={beaconCol}
                fillOpacity={isDark ? 0.34 : 0.2}
                stroke="none"
              />
              <circle cx={0} cy={0} r={1.6} fill={beaconCol} stroke="none" />
            </g>
          </g>
        );
      })}

      {/* 1. July 4th 36-Drone Synchronized Sky Light Show */}
      {scene.droneShows.map((show, i) => {
        const slot = (refs.droneShows[i] ??= { group: null, drones: [] });
        const s = baseScale * show.scale * 1.18;
        return (
          <g
            key={`drone-show-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="july4th-drone-show"
          >
            {Array.from({ length: DRONE_COUNT }, (_, dIdx) => {
              const ledColor =
                dIdx < 12
                  ? colors.accent
                  : dIdx < 24
                    ? colors.gold
                    : colors.primary;
              return (
                <g
                  key={`drone-${dIdx}`}
                  ref={(el) => {
                    slot.drones[dIdx] = el;
                  }}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={3.5}
                    fill={ledColor}
                    fillOpacity={0.22}
                    stroke="none"
                  />
                  <path
                    d="M -2.6 0 L 2.6 0 M 0 -1.3 L 0 1.3"
                    stroke={ledColor}
                    strokeWidth={strokePx(0.75, s)}
                    opacity={0.78}
                  />
                  <circle
                    cx={0}
                    cy={0}
                    r={1.65}
                    fill={ledColor}
                    stroke={paperMaskFill}
                    strokeWidth={strokePx(0.45, s)}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 2. Diwali Glowing Window Candles (50% smaller) */}
      {scene.windowCandles.map((candle, i) => {
        const slot = (refs.windowCandles[i] ??= { group: null, flame: null });
        const sw = strokePx(0.8, baseScale * candle.scale);
        return (
          <g
            key={`win-candle-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="diwali-window-candle"
          >
            <path
              d={paths.windowCandle.waxPillar}
              fill={paperMaskFill}
              stroke={colors.accent}
              strokeWidth={sw}
            />
            <g
              ref={(el) => {
                slot.flame = el;
              }}
            >
              <circle
                cx={0}
                cy={-4.6}
                r={5.0}
                fill={colors.gold}
                fillOpacity={0.26}
                stroke="none"
              />
              <path
                d={paths.windowCandle.flame}
                fill={colors.gold}
                fillOpacity={0.82}
                stroke={colors.gold}
                strokeWidth={sw}
              />
              <path
                d={paths.windowCandle.rays}
                stroke={colors.gold}
                strokeWidth={strokePx(0.68, baseScale * candle.scale)}
                opacity={0.85}
              />
            </g>
          </g>
        );
      })}

      {/* 3. Christmas Evergreen Building Wreaths */}
      {scene.buildingWreaths.map((wreath, i) => {
        const slot = (refs.buildingWreaths[i] ??= { group: null, bow: null });
        const sw = strokePx(0.95, baseScale * wreath.scale);
        return (
          <g
            key={`wreath-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="christmas-building-wreath"
          >
            <path
              d={paths.buildingWreath.hollyRing}
              fill={paperMaskFill}
              stroke={colors.primary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 30)}
              strokeWidth={sw}
            />
            <circle cx={0} cy={-5.3} r={1.0} fill={colors.accent} stroke="none" />
            <circle cx={-4.8} cy={-2.2} r={0.95} fill={colors.accent} stroke="none" />
            <circle cx={4.8} cy={-2.2} r={0.95} fill={colors.accent} stroke="none" />
            <g
              ref={(el) => {
                slot.bow = el;
              }}
            >
              <path
                d={paths.buildingWreath.bowAndTails}
                fill={paperMaskFill}
                stroke={colors.accent}
                strokeWidth={sw}
              />
            </g>
          </g>
        );
      })}

      {/* 3B. Christmas Color LED String Lights Around Statue of Liberty */}
      {scene.libertyStringLights.map((_, i) => {
        const slot = (refs.libertyStringLights[i] ??= {
          wires: [],
          bulbs: [],
        });
        return (
          <g key={`lib-leds-${i}`} data-entity="statue-of-liberty-led-lights">
            {LIBERTY_LED_STRANDS.map((_, sIdx) => (
              <path
                key={`wire-${sIdx}`}
                ref={(el) => {
                  slot.wires[sIdx] = el;
                }}
                d="M 0 0"
                stroke={colors.sketch}
                strokeWidth={0.85}
                opacity={0.72}
              />
            ))}
            {LIBERTY_LED_BULBS.map((bulb, bIdx) => {
              const bCol = bulbPalette[bulb.colorIdx % bulbPalette.length];
              return (
                <g
                  key={`bulb-${bIdx}`}
                  ref={(el) => {
                    slot.bulbs[bIdx] = el;
                  }}
                >
                  <circle
                    cx={0}
                    cy={0}
                    r={3.4}
                    fill={bCol}
                    fillOpacity={isDark ? 0.34 : 0.22}
                    stroke="none"
                  />
                  <circle cx={0} cy={0} r={1.45} fill={bCol} stroke="none" />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 3C. Winter Frozen Icicles (Under Torch, Elbow, Book & Pedestal) */}
      {scene.libertyIcicles.map((ic, i) => {
        const s = baseScale * ic.scale;
        const iceStroke = isDark
          ? "rgba(125, 211, 252, 0.92)"
          : "rgba(14, 116, 144, 0.86)";
        const iceFill = isDark
          ? "rgba(186, 230, 253, 0.32)"
          : "rgba(224, 242, 254, 0.78)";
        return (
          <g
            key={`lib-icicle-${i}`}
            ref={(el) => {
              refs.libertyIcicles[i] = el;
            }}
            data-entity="statue-of-liberty-icicles"
          >
            <path
              d={paths.libertyIcicles[ic.variant]}
              fill={iceFill}
              stroke={iceStroke}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 35)}
              strokeWidth={strokePx(0.92, s)}
            />
          </g>
        );
      })}

      {/* 4. Halloween Upside-Down Bats Hanging on the Statue of Liberty (3 bats, 50% smaller) */}
      {scene.libertyBats.map((bat, i) => {
        const slot = (refs.libertyBats[i] ??= {
          group: null,
          wingLeft: null,
          wingRight: null,
        });
        const sw = strokePx(0.85, baseScale * bat.scale);
        return (
          <g
            key={`liberty-bat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="statue-of-liberty-bat"
          >
            <g
              ref={(el) => {
                slot.wingLeft = el;
              }}
            >
              <path
                d={paths.libertyBat.wingLeft}
                fill={blackCatFill}
                stroke={colors.sketch}
                strokeWidth={sw}
              />
            </g>
            <g
              ref={(el) => {
                slot.wingRight = el;
              }}
            >
              <path
                d={paths.libertyBat.wingRight}
                fill={blackCatFill}
                stroke={colors.sketch}
                strokeWidth={sw}
              />
            </g>
            <path
              d={paths.libertyBat.body}
              fill={blackCatFill}
              stroke={colors.sketch}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 40)}
              strokeWidth={sw}
            />
            <circle cx={-1.1} cy={9.2} r={0.7} fill={colors.gold} stroke="none" />
            <circle cx={1.1} cy={9.2} r={0.7} fill={colors.gold} stroke="none" />
          </g>
        );
      })}

      {/* 5. Halloween Carved Pumpkins Along the Waterfront */}
      {scene.waterfrontPumpkins.map((pumpkin, i) => {
        const slot = (refs.waterfrontPumpkins[i] ??= {
          group: null,
          face: null,
        });
        const sw = strokePx(0.95, baseScale * pumpkin.scale);
        const swFine = strokePx(0.72, baseScale * pumpkin.scale);
        return (
          <g
            key={`pumpkin-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="waterfront-pumpkin"
          >
            <path
              d={
                pumpkin.pair
                  ? paths.waterfrontPumpkin.pairOutline
                  : paths.waterfrontPumpkin.singleOutline
              }
              fill={paperMaskFill}
              stroke={colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 30)}
              strokeWidth={sw}
            />
            {!pumpkin.pair && (
              <path
                d={paths.waterfrontPumpkin.singleRibs}
                stroke={colors.accent}
                strokeWidth={swFine}
                opacity={0.75}
              />
            )}
            <path
              ref={(el) => {
                slot.face = el;
              }}
              d={
                pumpkin.pair
                  ? paths.waterfrontPumpkin.pairFace
                  : paths.waterfrontPumpkin.singleFace
              }
              fill={colors.gold}
              fillOpacity={0.65}
              stroke={colors.gold}
              strokeWidth={swFine}
            />
          </g>
        );
      })}

      {/* 6. Halloween Little Black Cats Running Along the Waterfront (25% smaller) */}
      {scene.blackCats.map((cat, i) => {
        const slot = (refs.blackCats[i] ??= {
          group: null,
          tail: null,
          frontLegs: null,
          hindLegs: null,
        });
        const sw = strokePx(0.9, baseScale * cat.scale);
        return (
          <g
            key={`black-cat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="waterfront-black-cat"
          >
            <path
              ref={(el) => {
                slot.hindLegs = el;
              }}
              d={paths.blackCat.hindLegsA}
              stroke={colors.sketch}
              strokeWidth={sw}
            />
            <path
              ref={(el) => {
                slot.frontLegs = el;
              }}
              d={paths.blackCat.frontLegsA}
              stroke={colors.sketch}
              strokeWidth={sw}
            />
            <g
              ref={(el) => {
                slot.tail = el;
              }}
            >
              <path
                d={paths.blackCat.tail}
                stroke={colors.sketch}
                strokeWidth={strokePx(1.15, baseScale * cat.scale)}
              />
            </g>
            <path
              d={paths.blackCat.bodyAndHead}
              fill={blackCatFill}
              stroke={colors.sketch}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 45)}
              strokeWidth={sw}
            />
            <path
              d={paths.blackCat.whiskers}
              stroke={colors.sketch}
              strokeWidth={strokePx(0.65, baseScale * cat.scale)}
            />
            <circle cx={6.8} cy={-8.4} r={0.8} fill={colors.gold} stroke="none" />
          </g>
        );
      })}

      {/* 7. Shared Christmas & Winter Waterfront Snowmen */}
      {scene.waterfrontSnowmen.map((sm, i) => {
        const slot = (refs.waterfrontSnowmen[i] ??= {
          group: null,
          waveArm: null,
        });
        const sw = strokePx(0.95, baseScale * sm.scale);
        const swFine = strokePx(0.78, baseScale * sm.scale);
        const scarfColor = i % 2 === 0 ? colors.accent : colors.primary;
        return (
          <g
            key={`snowman-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="waterfront-snowman"
          >
            <path
              d={paths.waterfrontSnowman.leftTwigArm}
              strokeWidth={swFine}
            />
            <g
              ref={(el) => {
                slot.waveArm = el;
              }}
              transform="translate(3.6, -13.4)"
            >
              <path
                d={paths.waterfrontSnowman.rightTwigArm}
                strokeWidth={swFine}
              />
            </g>
            <path
              d={paths.waterfrontSnowman.bodyBalls}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 35)}
              strokeWidth={sw}
            />
            <path
              d={paths.waterfrontSnowman.coalAndButtons}
              fill={colors.sketch}
              strokeWidth={swFine}
            />
            <path
              d={paths.waterfrontSnowman.carrotNose}
              fill={colors.accent}
              stroke={colors.accent}
              strokeWidth={swFine}
            />
            <path
              d={paths.waterfrontSnowman.scarf}
              stroke={scarfColor}
              strokeWidth={strokePx(1.1, baseScale * sm.scale)}
            />
            {sm.hatKind === "topHat" ? (
              <>
                <path
                  d={paths.waterfrontSnowman.topHat}
                  fill={paperMaskFill}
                  strokeWidth={sw}
                />
                <path
                  d={paths.waterfrontSnowman.topHatBand}
                  stroke={colors.accent}
                  strokeWidth={swFine}
                />
              </>
            ) : (
              <path
                d={paths.waterfrontSnowman.beanie}
                fill={paperMaskFill}
                stroke={colors.primary}
                strokeWidth={sw}
              />
            )}
          </g>
        );
      })}
    </>
  );
}

// ============================================================================
// Imperative 60fps Updater for Skyline-Anchored Details, Spires & Drone Show
// ============================================================================
export function updateCityDetailsDom(
  scene: SceneState,
  refs: CityDetailsDomRefs,
  dt: number,
  width: number,
  height: number,
  baseScale: number,
) {
  const pxScale = width / 1994;

  // 0. Meticulously Outlined Empire State & One WTC Spire Illumination
  scene.spireLights.forEach((spire, i) => {
    spire.beaconPhase += 0.028 * dt;
    spire.shimmerPhase += 0.045 * dt;
    const slot = refs.spireLights[i];
    if (!slot) return;

    const esb = SPIRE_PIXEL_GEOMETRY.esb;
    const swThin = Math.max(0.75, 1.05 * pxScale).toFixed(2);
    const swPier = Math.max(1.2, 2.35 * pxScale).toFixed(2);

    slot.esbMastWash?.setAttribute(
      "d",
      pxPolyToPath(esb.mastWashPoly, width, height),
    );
    slot.esbMastContours?.setAttribute(
      "d",
      pxPolylinesToPath(esb.mastContourPolylines, width, height),
    );
    slot.esbMastContours?.setAttribute("stroke-width", swThin);

    slot.esbAntenna?.setAttribute(
      "d",
      pxSegmentsToPath(esb.antennaSegments, width, height),
    );
    slot.esbAntenna?.setAttribute("stroke-width", swThin);

    slot.esbParapet?.setAttribute(
      "d",
      pxPolylinesToPath(esb.parapetPolylines, width, height),
    );
    slot.esbParapet?.setAttribute("stroke-width", swThin);

    // 81st-85th floor upper crown stone piers (between arched windows — never covering dark arches)
    const upPrimarySegs: Array<[number, number, number, number]> = [];
    const upAccentSegs: Array<[number, number, number, number]> = [];
    esb.upperCrownPiersX.forEach((px, pIdx) => {
      const target =
        pIdx === 0 || pIdx === esb.upperCrownPiersX.length - 1
          ? upAccentSegs
          : upPrimarySegs;
      target.push([px, esb.upperCrownY[1], px, esb.upperCrownY[0]]);
    });
    slot.esbUpperPiersPrimary?.setAttribute(
      "d",
      pxSegmentsToPath(upPrimarySegs, width, height),
    );
    slot.esbUpperPiersPrimary?.setAttribute("stroke-width", swPier);
    slot.esbUpperPiersAccent?.setAttribute(
      "d",
      pxSegmentsToPath(upAccentSegs, width, height),
    );
    slot.esbUpperPiersAccent?.setAttribute("stroke-width", swPier);

    // 72nd-80th floor lower setback vertical pilasters (between tall window bays)
    const lowPrimarySegs: Array<[number, number, number, number]> = [];
    const lowAccentSegs: Array<[number, number, number, number]> = [];
    esb.lowerCrownPiersX.forEach((px, pIdx) => {
      const target =
        pIdx === 0 || pIdx === esb.lowerCrownPiersX.length - 1
          ? lowAccentSegs
          : lowPrimarySegs;
      target.push([px, esb.lowerCrownY[1], px, esb.lowerCrownY[0]]);
    });
    slot.esbLowerPiersPrimary?.setAttribute(
      "d",
      pxSegmentsToPath(lowPrimarySegs, width, height),
    );
    slot.esbLowerPiersPrimary?.setAttribute("stroke-width", swPier);
    slot.esbLowerPiersAccent?.setAttribute(
      "d",
      pxSegmentsToPath(lowAccentSegs, width, height),
    );
    slot.esbLowerPiersAccent?.setAttribute("stroke-width", swPier);

    // Next setback level down (y = 296..347.8: left & right fluted wings + central spine)
    const midPrimarySegs: Array<[number, number, number, number]> = [];
    const midAccentSegs: Array<[number, number, number, number]> = [];
    esb.midTowerPiers.forEach(([px, yBot, yTop, isAccent]) => {
      (isAccent ? midAccentSegs : midPrimarySegs).push([px, yBot, px, yTop]);
    });
    slot.esbMidTowerPiersPrimary?.setAttribute(
      "d",
      pxSegmentsToPath(midPrimarySegs, width, height),
    );
    slot.esbMidTowerPiersPrimary?.setAttribute("stroke-width", swPier);
    slot.esbMidTowerPiersAccent?.setAttribute(
      "d",
      pxSegmentsToPath(midAccentSegs, width, height),
    );
    slot.esbMidTowerPiersAccent?.setAttribute("stroke-width", swPier);

    slot.esbCrownLedges?.setAttribute(
      "d",
      pxSegmentsToPath([esb.upperCrownLedge, esb.lowerCrownLedge], width, height) +
        " " +
        pxPolylinesToPath(esb.midTowerContourPolylines, width, height),
    );
    slot.esbCrownLedges?.setAttribute("stroke-width", swThin);

    const esbTip = skylinePxToSvg(esb.tipPx[0], esb.tipPx[1], width, height);
    const tipScale = Math.max(0.45, width / 1440);
    const esbPulse = 0.78 + 0.22 * Math.sin(spire.shimmerPhase);
    slot.esbTip?.setAttribute(
      "transform",
      `translate(${esbTip.x.toFixed(1)}, ${esbTip.y.toFixed(1)}) scale(${tipScale.toFixed(3)})`,
    );
    slot.esbTip?.setAttribute("opacity", esbPulse.toFixed(2));

    // Statue of Liberty night floodlight aura & torch flame beacon
    const lib = SPIRE_PIXEL_GEOMETRY.liberty;
    const libCenter = skylinePxToSvg(
      lib.statueGlowPx[0],
      lib.statueGlowPx[1],
      width,
      height,
    );
    slot.libertyAura?.setAttribute(
      "transform",
      `translate(${libCenter.x.toFixed(1)}, ${libCenter.y.toFixed(1)}) scale(${tipScale.toFixed(3)})`,
    );
    const torchPos = skylinePxToSvg(
      lib.torchFlamePx[0],
      lib.torchFlamePx[1],
      width,
      height,
    );
    const torchPulse = 0.84 + 0.16 * Math.sin(spire.shimmerPhase * 1.3 + 0.8);
    slot.libertyTorchGlow?.setAttribute(
      "transform",
      `translate(${torchPos.x.toFixed(1)}, ${torchPos.y.toFixed(1)}) scale(${(tipScale * torchPulse).toFixed(3)})`,
    );

    // One World Trade Center: slender tapered shafts, horizontal collars, tripod struts & sloped rings
    const wtc = SPIRE_PIXEL_GEOMETRY.wtc;
    wtc.shaftSegments.forEach((seg, sIdx) => {
      const shaftEl = slot.wtcShafts[sIdx];
      if (!shaftEl) return;
      const p0 = skylinePxToSvg(seg.x, seg.y0, width, height);
      const p1 = skylinePxToSvg(seg.x, seg.y1, width, height);
      shaftEl.setAttribute(
        "d",
        `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      );
      shaftEl.setAttribute(
        "stroke-width",
        Math.max(0.95, seg.wPx * pxScale * 1.15).toFixed(2),
      );
      const wave = 0.72 + 0.28 * Math.sin(spire.shimmerPhase - sIdx * 0.8);
      shaftEl.setAttribute("opacity", wave.toFixed(2));
    });

    slot.wtcCollars?.setAttribute(
      "d",
      pxSegmentsToPath(wtc.collarRings, width, height),
    );
    slot.wtcCollars?.setAttribute("stroke-width", swThin);

    slot.wtcStruts?.setAttribute(
      "d",
      pxSegmentsToPath(wtc.baseStruts, width, height),
    );
    slot.wtcStruts?.setAttribute("stroke-width", swThin);

    slot.wtcPodiumRings?.setAttribute(
      "d",
      pxSegmentsToPath(wtc.slopedPodiumRings, width, height),
    );
    slot.wtcPodiumRings?.setAttribute("stroke-width", swThin);

    // Optical soft-fading rotating beacon at One WTC apex
    const wtcTip = skylinePxToSvg(
      wtc.beaconPx[0],
      wtc.beaconPx[1],
      width,
      height,
    );
    slot.wtcBeaconGroup?.setAttribute(
      "transform",
      `translate(${wtcTip.x.toFixed(1)}, ${wtcTip.y.toFixed(1)}) scale(${tipScale.toFixed(3)})`,
    );
    const sweep = Math.abs(Math.sin(spire.beaconPhase));
    const span = 4 + 28 * sweep;
    const coneH = 0.9 + 2.1 * sweep;
    slot.wtcBeamLeft?.setAttribute(
      "d",
      `M 0 -0.6 L ${(-span).toFixed(1)} ${(-coneH).toFixed(1)} L ${(-span).toFixed(1)} ${coneH.toFixed(1)} L 0 0.6 Z`,
    );
    slot.wtcBeamRight?.setAttribute(
      "d",
      `M 0 -0.6 L ${span.toFixed(1)} ${(-coneH).toFixed(1)} L ${span.toFixed(1)} ${coneH.toFixed(1)} L 0 0.6 Z`,
    );
    const beamOp = (0.3 + 0.7 * sweep).toFixed(2);
    slot.wtcBeamLeft?.setAttribute("opacity", beamOp);
    slot.wtcBeamRight?.setAttribute("opacity", beamOp);

    // Night-mode architectural crowns & FAA beacons across Chrysler, Midtown, Woolworth & FiDi towers
    const nc = SPIRE_PIXEL_GEOMETRY.nightCrowns;
    slot.nightChryslerWash?.setAttribute(
      "d",
      pxPolyToPath(nc.chryslerWashPoly, width, height),
    );
    slot.nightChryslerContours?.setAttribute(
      "d",
      pxPolylinesToPath(nc.chryslerPolylines, width, height),
    );
    slot.nightChryslerContours?.setAttribute("stroke-width", swThin);

    const chryslerTip = skylinePxToSvg(
      nc.chryslerTipPx[0],
      nc.chryslerTipPx[1],
      width,
      height,
    );
    slot.nightChryslerTip?.setAttribute(
      "transform",
      `translate(${chryslerTip.x.toFixed(1)}, ${chryslerTip.y.toFixed(1)}) scale(${tipScale.toFixed(3)})`,
    );

    slot.nightAtriumWash?.setAttribute(
      "d",
      pxPolyToPath(nc.diagonalAtriumWashPoly, width, height),
    );
    slot.nightCoolCrowns?.setAttribute(
      "d",
      pxPolylinesToPath(nc.coolGlassCrownPolylines, width, height),
    );
    slot.nightCoolCrowns?.setAttribute("stroke-width", swThin);

    slot.nightWoolworthWash?.setAttribute(
      "d",
      pxPolyToPath(nc.woolworthWashPoly, width, height),
    );
    slot.nightWarmCrowns?.setAttribute(
      "d",
      pxPolylinesToPath(nc.warmGoldCrownPolylines, width, height),
    );
    slot.nightWarmCrowns?.setAttribute("stroke-width", swThin);

    const warmPierSegs = nc.warmGoldPiers.map(
      ([px, yBot, yTop]) => [px, yBot, px, yTop] as [number, number, number, number],
    );
    slot.nightWarmPiers?.setAttribute(
      "d",
      pxSegmentsToPath(warmPierSegs, width, height),
    );
    slot.nightWarmPiers?.setAttribute("stroke-width", swPier);

    nc.warmLanternPointsPx.forEach(([lx, ly], lIdx) => {
      const lEl = slot.nightWarmLanterns[lIdx];
      if (!lEl) return;
      const lPos = skylinePxToSvg(lx, ly, width, height);
      lEl.setAttribute(
        "transform",
        `translate(${lPos.x.toFixed(1)}, ${lPos.y.toFixed(1)}) scale(${tipScale.toFixed(3)})`,
      );
    });

    nc.aviationBeaconsPx.forEach(([bx, by], bIdx) => {
      const bEl = slot.nightAviationBeacons[bIdx];
      if (!bEl) return;
      const bPos = skylinePxToSvg(bx, by, width, height);
      const blink =
        0.38 + 0.62 * (0.5 + 0.5 * Math.sin(spire.shimmerPhase * 1.4 - bIdx * 1.7));
      bEl.setAttribute(
        "transform",
        `translate(${bPos.x.toFixed(1)}, ${bPos.y.toFixed(1)}) scale(${tipScale.toFixed(3)})`,
      );
      bEl.setAttribute("opacity", blink.toFixed(2));
    });
  });

  // 0B. Christmas Statue of Liberty Color LED String Lights
  scene.libertyStringLights.forEach((lights, i) => {
    lights.chasePhase += lights.chaseSpeed * dt;
    const slot = refs.libertyStringLights[i];
    if (!slot) return;

    LIBERTY_LED_STRANDS.forEach((s, sIdx) => {
      const wireEl = slot.wires[sIdx];
      if (!wireEl) return;
      const p0 = skylineToSvg(s.u0, s.v0, width, height);
      const pm = skylineToSvg(s.um, s.vm, width, height);
      const p1 = skylineToSvg(s.u1, s.v1, width, height);
      wireEl.setAttribute(
        "d",
        `M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} Q ${pm.x.toFixed(1)} ${pm.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
      );
    });

    LIBERTY_LED_BULBS.forEach((bulb, bIdx) => {
      const bulbEl = slot.bulbs[bIdx];
      if (!bulbEl) return;
      const pos = skylineToSvg(bulb.u, bulb.v, width, height);
      const twinkle =
        0.55 + 0.45 * (0.5 + 0.5 * Math.sin(lights.chasePhase - bIdx * 0.75));
      const bScale = pos.scale * (0.85 + 0.22 * twinkle);
      bulbEl.setAttribute(
        "transform",
        `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${bScale.toFixed(3)})`,
      );
      bulbEl.setAttribute("opacity", twinkle.toFixed(2));
    });
  });

  // 0C. Winter Statue of Liberty Frozen Icicles (Torch, Elbow, Book & Pedestal)
  scene.libertyIcicles.forEach((ic, i) => {
    ic.glintPhase += 0.03 * dt;
    const el = refs.libertyIcicles[i];
    if (!el) return;
    const pos = skylineToSvg(ic.u, ic.v, width, height);
    const s = pos.scale * ic.scale;
    const glint = 0.84 + 0.16 * Math.sin(ic.glintPhase);
    el.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    el.setAttribute("opacity", glint.toFixed(2));
  });

  const numFormations = DRONE_FORMATIONS.length;

  // 1. July 4th 36-Drone Show (smooth morph across USA -> STAR -> TORCH -> BELL)
  scene.droneShows.forEach((show, i) => {
    show.timeline = (show.timeline + show.speed * dt) % numFormations;
    const slot = refs.droneShows[i];
    if (!slot?.group) return;

    const cx = show.xRatio * width;
    const cy = show.yRatio * height;
    const s = baseScale * show.scale * 1.18;
    slot.group.setAttribute(
      "transform",
      `translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) scale(${s.toFixed(3)})`,
    );

    const currIdx = Math.floor(show.timeline) % numFormations;
    const nextIdx = (currIdx + 1) % numFormations;
    const localPhase = show.timeline - Math.floor(show.timeline);
    const morphT =
      localPhase < 0.56 ? 0 : smoothstep((localPhase - 0.56) / 0.44);
    const arcLift = Math.sin(morphT * Math.PI) * 9.5;

    const ptsA = DRONE_FORMATIONS[currIdx].points;
    const ptsB = DRONE_FORMATIONS[nextIdx].points;

    for (let dIdx = 0; dIdx < DRONE_COUNT; dIdx++) {
      const droneEl = slot.drones[dIdx];
      if (!droneEl) continue;
      const [ax, ay] = ptsA[dIdx];
      const [bx, by] = ptsB[dIdx];
      const swirlSign = dIdx % 2 === 0 ? 1 : -1;
      const hoverX = Math.sin(show.timeline * 14 + dIdx * 0.9) * 0.65;
      const hoverY = Math.cos(show.timeline * 16 + dIdx * 1.3) * 0.65;
      const x = ax + (bx - ax) * morphT + swirlSign * arcLift * 0.45 + hoverX;
      const y = ay + (by - ay) * morphT - arcLift * 0.35 + hoverY;
      const pulse = 0.78 + 0.22 * Math.sin(show.timeline * 22 + dIdx * 0.7);

      droneEl.setAttribute(
        "transform",
        `translate(${x.toFixed(1)}, ${y.toFixed(1)})`,
      );
      droneEl.setAttribute("opacity", pulse.toFixed(2));
    }
  });

  // 2. Diwali Window Candles (50% smaller)
  scene.windowCandles.forEach((candle, i) => {
    candle.flickerPhase += candle.flickerSpeed * dt;
    const slot = refs.windowCandles[i];
    if (!slot?.group) return;

    const pos = skylineToSvg(candle.u, candle.v, width, height);
    const s = pos.scale * candle.scale;
    slot.group.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );

    if (slot.flame) {
      const sy = 0.86 + 0.22 * Math.sin(candle.flickerPhase);
      const lean = Math.cos(candle.flickerPhase * 0.7) * 5.5;
      const op = 0.78 + 0.22 * Math.sin(candle.flickerPhase * 1.3);
      slot.flame.setAttribute(
        "transform",
        `rotate(${lean.toFixed(1)}, 0, -1.5) scale(1, ${sy.toFixed(2)})`,
      );
      slot.flame.setAttribute("opacity", op.toFixed(2));
    }
  });

  // 3. Christmas Building Wreaths
  scene.buildingWreaths.forEach((wreath, i) => {
    wreath.swayPhase += wreath.swaySpeed * dt;
    const slot = refs.buildingWreaths[i];
    if (!slot?.group) return;

    const pos = skylineToSvg(wreath.u, wreath.v, width, height);
    const s = pos.scale * wreath.scale;
    slot.group.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    slot.bow?.setAttribute(
      "transform",
      `rotate(${(Math.sin(wreath.swayPhase) * 5.0).toFixed(1)}, 0, 5.8)`,
    );
  });

  // 4. Statue of Liberty Hanging Bats (Halloween — 3 bats, 50% smaller)
  scene.libertyBats.forEach((bat, i) => {
    bat.flapPhase += bat.flapSpeed * dt;
    const slot = refs.libertyBats[i];
    if (!slot?.group) return;

    const pos = skylineToSvg(bat.u, bat.v, width, height);
    const s = pos.scale * bat.scale;
    const sway = Math.sin(bat.flapPhase * 0.6) * 4.0 + bat.tiltDeg;
    slot.group.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${sway.toFixed(1)})`,
    );

    const wave = Math.max(0, Math.sin(bat.flapPhase));
    const spread = 0.42 + Math.pow(wave, 3) * 0.72;
    slot.wingLeft?.setAttribute(
      "transform",
      `translate(-2.2, 4.2) scale(${spread.toFixed(2)}, 1) translate(2.2, -4.2)`,
    );
    slot.wingRight?.setAttribute(
      "transform",
      `translate(2.2, 4.2) scale(${spread.toFixed(2)}, 1) translate(-2.2, -4.2)`,
    );
  });

  // 5. Waterfront Carved Pumpkins (Halloween)
  scene.waterfrontPumpkins.forEach((pumpkin, i) => {
    pumpkin.glowPhase += pumpkin.glowSpeed * dt;
    const slot = refs.waterfrontPumpkins[i];
    if (!slot?.group) return;

    const pos = skylineToSvg(pumpkin.u, pumpkin.v, width, height);
    const s = pos.scale * pumpkin.scale;
    slot.group.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    if (slot.face) {
      const glow = 0.62 + 0.36 * Math.sin(pumpkin.glowPhase);
      slot.face.setAttribute("opacity", glow.toFixed(2));
    }
  });

  // 6. Running Black Cats Along the Waterfront (Halloween — 25% smaller)
  scene.blackCats.forEach((cat, i) => {
    cat.u += cat.uSpeed * cat.direction * dt;
    if (cat.u >= cat.uMax) {
      cat.u = cat.uMax;
      cat.direction = -1;
    } else if (cat.u <= cat.uMin) {
      cat.u = cat.uMin;
      cat.direction = 1;
    }
    cat.stridePhase += 0.24 * dt;
    cat.tailPhase += 0.09 * dt;

    const slot = refs.blackCats[i];
    if (!slot?.group) return;

    const pos = skylineToSvg(cat.u, cat.v, width, height);
    const s = pos.scale * cat.scale;
    const bounceY = -Math.abs(Math.sin(cat.stridePhase)) * 1.8 * s;

    slot.group.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${(pos.y + bounceY).toFixed(1)}) scale(${(cat.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );

    const swing = Math.sin(cat.stridePhase) * 2.8;
    slot.frontLegs?.setAttribute(
      "d",
      `M 3.8 -4.8 L ${(4.4 + swing).toFixed(1)} 0 M 2.4 -4.8 L ${(2.4 - swing * 0.8).toFixed(1)} 0`,
    );
    slot.hindLegs?.setAttribute(
      "d",
      `M -4.4 -4.8 L ${(-3.6 - swing).toFixed(1)} 0 M -5.8 -4.8 L ${(-6.8 + swing * 0.8).toFixed(1)} 0`,
    );
    slot.tail?.setAttribute(
      "transform",
      `rotate(${(Math.sin(cat.tailPhase) * 12).toFixed(1)}, -6.4, -6.4)`,
    );
  });

  // 7. Shared Christmas & Winter Waterfront Snowmen
  scene.waterfrontSnowmen.forEach((sm, i) => {
    sm.wavePhase += sm.waveSpeed * dt;
    const slot = refs.waterfrontSnowmen[i];
    if (!slot?.group) return;

    const pos = skylineToSvg(sm.u, sm.v, width, height);
    const s = pos.scale * sm.scale;
    slot.group.setAttribute(
      "transform",
      `translate(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}) scale(${(sm.facing * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    slot.waveArm?.setAttribute(
      "transform",
      `translate(3.6, -13.4) rotate(${(Math.sin(sm.wavePhase) * 16 - 8).toFixed(1)})`,
    );
  });
}
