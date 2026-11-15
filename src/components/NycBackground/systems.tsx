import type { CSSProperties } from "react";
import { DEFAULT_CONFIG } from "./config";
import { SVG_PATHS } from "./paths";
import { SHIP_KEEL_Y, type SceneState } from "./state";
import {
  type CityDetailsDomRefs,
  createEmptyCityDetailsRefs,
  renderCityDetailsSvgElements,
  updateCityDetailsDom,
} from "./systemsCityDetails";
import {
  type HarborRenderItem,
  type SpringSummerDomRefs,
  collectSpringSummerHarborItems,
  createEmptySpringSummerRefs,
  renderSpringSummerAerialSvgElements,
  updateSpringSummerDom,
} from "./systemsSpringSummer";
import { approachAngle, smoothstep, strokePx } from "./utils";

export interface SceneDomRefs {
  springSummer: SpringSummerDomRefs;
  cityDetails: CityDetailsDomRefs;
  clouds: Array<SVGGElement | null>;
  birds: Array<{ group: SVGGElement | null; wing: SVGPathElement | null }>;
  helicopters: Array<{
    group: SVGGElement | null;
    rotor: SVGLineElement | null;
  }>;
  ships: Array<SVGGElement | null>;
  statenIslandFerrys: Array<{
    group: SVGGElement | null;
    wake: SVGPathElement | null;
  }>;

  // Halloween
  witches: Array<SVGGElement | null>;
  dogWizards: Array<{
    group: SVGGElement | null;
    broom: SVGGElement | null;
    cape: SVGGElement | null;
    folds: Array<SVGPathElement | null>;
    hat: SVGGElement | null;
  }>;
  charonFerrys: Array<{
    group: SVGGElement | null;
    oar: SVGGElement | null;
    arms: SVGPathElement | null;
  }>;

  // Thanksgiving
  paradeBalloons: Array<{
    group: SVGGElement | null;
    tailFan: SVGGElement | null;
    tethers: SVGPathElement | null;
  }>;
  pilgrimDogs: Array<{
    group: SVGGElement | null;
    leaf: SVGGElement | null;
    feathers: Array<SVGGElement | null>;
    hat: SVGGElement | null;
  }>;
  gooseFlocks: Array<{
    group: SVGGElement | null;
    birds: Array<{ group: SVGGElement | null; wings: SVGPathElement | null }>;
  }>;
  autumnLeaves: Array<{
    group: SVGGElement | null;
    inner: SVGGElement | null;
  }>;
  harvestBoats: Array<{
    group: SVGGElement | null;
    wheel: SVGGElement | null;
    stackSteam: SVGPathElement | null;
    pieSteam: SVGPathElement | null;
  }>;

  // Christmas
  santaSleighs: Array<{
    sleighGroup: SVGGElement | null;
    waveArm: SVGGElement | null;
    reindeerGroups: Array<{
      group: SVGGElement | null;
      frontA: SVGGElement | null;
      frontB: SVGGElement | null;
      hindA: SVGGElement | null;
      hindB: SVGGElement | null;
      noseGlow: SVGGElement | null;
    }>;
    reins: SVGPathElement | null;
    wake: SVGPathElement | null;
  }>;
  santaDogs: Array<{
    group: SVGGElement | null;
    sled: SVGGElement | null;
    scarfUpper: SVGGElement | null;
    scarfLower: SVGGElement | null;
    hat: SVGGElement | null;
    pom: SVGGElement | null;
  }>;
  holidayTreeBoats: Array<{
    group: SVGGElement | null;
    star: SVGGElement | null;
    steam: SVGPathElement | null;
  }>;
  twinkleStars: Array<SVGGElement | null>;

  // Shared Snow & Wind
  snowflakes: Array<SVGGElement | null>;
  windRibbons: Array<{
    group: SVGGElement | null;
    path: SVGPathElement | null;
  }>;

  // Winter
  snowyOwls: Array<{
    group: SVGGElement | null;
    nearWing: SVGGElement | null;
    farWing: SVGGElement | null;
  }>;
  winterDogs: Array<{
    group: SVGGElement | null;
    board: SVGGElement | null;
    scarf: SVGGElement | null;
    hat: SVGGElement | null;
    wake: SVGPathElement | null;
  }>;
  winterHarborBoats: Array<{
    group: SVGGElement | null;
    skater: SVGGElement | null;
    steam1: SVGPathElement | null;
    steam2: SVGPathElement | null;
  }>;
  iceFloes: Array<SVGGElement | null>;
}

export function createEmptyRefs(): SceneDomRefs {
  return {
    springSummer: createEmptySpringSummerRefs(),
    cityDetails: createEmptyCityDetailsRefs(),
    clouds: [],
    birds: [],
    helicopters: [],
    ships: [],
    statenIslandFerrys: [],
    witches: [],
    dogWizards: [],
    charonFerrys: [],
    paradeBalloons: [],
    pilgrimDogs: [],
    gooseFlocks: [],
    autumnLeaves: [],
    harvestBoats: [],
    santaSleighs: [],
    santaDogs: [],
    holidayTreeBoats: [],
    twinkleStars: [],
    snowflakes: [],
    windRibbons: [],
    snowyOwls: [],
    winterDogs: [],
    winterHarborBoats: [],
    iceFloes: [],
  };
}

const drawDelayStyle = (index: number, stepMs = 45): CSSProperties =>
  ({
    "--draw-delay": `${Math.min(520, index * stepMs)}ms`,
  }) as CSSProperties;

const deg = (rad: number) => +((rad * 180) / Math.PI).toFixed(2);

// ============================================================================
// Declarative SVG Tree Renderer
// Pre-allocates each ref slot before returning JSX so React 19 child-first ref
// callbacks never read an uninitialized parent slot.
// ============================================================================
export function renderSceneSvgElements(
  scene: SceneState,
  refs: SceneDomRefs,
  baseScale: number,
  isDark: boolean,
  colors: {
    sketch: string;
    accent: string;
    primary: string;
    gold: string;
    paperMask?: string;
  },
  inkMultiplier = 0.42,
) {
  const darkFillStrong = isDark
    ? `rgba(28, 38, 36, ${(0.88 * inkMultiplier).toFixed(2)})`
    : `rgba(38, 48, 45, ${(0.78 * inkMultiplier).toFixed(2)})`;
  const darkFillSoft = isDark
    ? `rgba(42, 54, 50, ${(0.82 * inkMultiplier).toFixed(2)})`
    : `rgba(64, 76, 72, ${(0.72 * inkMultiplier).toFixed(2)})`;
  const paperMaskFill = colors.paperMask ?? "var(--background)";

  // Collect all harbor watercraft into a single Y-sorted forefront layer so:
  //   1. Every boat sits in front of skyline facade details and waterfront props
  //      (snowmen, black cats, jack-o'-lantern pumpkins).
  //   2. Boats positioned higher up (smaller hull-bottom waterlineY, farther back)
  //      render behind boats positioned lower down (larger waterlineY, closer to viewer).
  const harborItems: HarborRenderItem[] = [];
  let harborSeq = 0;

  scene.iceFloes.forEach((floe, i) => {
    const s = baseScale * floe.scale * 0.95;
    const moveScale = baseScale * floe.scale * 0.9;
    const iceStroke = isDark
      ? "rgba(125, 211, 252, 0.86)"
      : "rgba(14, 116, 144, 0.78)";
    harborItems.push({
      waterlineY: floe.y + 2.5 * moveScale,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`floe-${i}`}
          ref={(el) => {
            refs.iceFloes[i] = el;
          }}
          data-entity="river-iceberg"
        >
          <path
            d={SVG_PATHS.iceFloes[floe.variant]}
            fill={paperMaskFill}
            stroke={iceStroke}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(i, 45)}
            strokeWidth={strokePx(1.0, s)}
          />
        </g>
      ),
    });
  });

  scene.ships.forEach((ship, i) => {
    const s = baseScale * 0.85;
    const nl = SVG_PATHS.shipNightLights[ship.type];
    harborItems.push({
      waterlineY: ship.y + SHIP_KEEL_Y[ship.type] * s,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`ship-${i}`}
          ref={(el) => {
            refs.ships[i] = el;
          }}
          data-entity={`ship-${ship.type}`}
        >
          <path
            d={SVG_PATHS.ships[ship.type]}
            fill={paperMaskFill}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(i, 55)}
            strokeWidth={strokePx(1.05, s)}
          />
          {isDark && (
            <g data-entity="ship-night-lights">
              <path
                d={nl.reflection}
                stroke="#fbbf24"
                strokeWidth={strokePx(0.9, s)}
                opacity={0.42}
              />
              <path
                d={nl.windows}
                stroke="#fde68a"
                strokeWidth={strokePx(1.85, s)}
                opacity={0.92}
              />
              <circle
                cx={nl.bowLight[0]}
                cy={nl.bowLight[1]}
                r={1.25}
                fill="#4ade80"
                stroke="none"
              />
              <circle
                cx={nl.sternLight[0]}
                cy={nl.sternLight[1]}
                r={1.2}
                fill="#f87171"
                stroke="none"
              />
              <circle
                cx={nl.mastLight[0]}
                cy={nl.mastLight[1]}
                r={2.5}
                fill="#fef08a"
                fillOpacity={0.28}
                stroke="none"
              />
              <circle
                cx={nl.mastLight[0]}
                cy={nl.mastLight[1]}
                r={1.2}
                fill="#fef08a"
                stroke="none"
              />
            </g>
          )}
        </g>
      ),
    });
  });

  scene.statenIslandFerrys.forEach((ferry, i) => {
    const slot = (refs.statenIslandFerrys[i] ??= {
      group: null,
      wake: null,
    });
    const s = baseScale * 0.98;
    const swMain = strokePx(1.18, s);
    const swFine = strokePx(0.88, s);
    const orangeAlpha = Math.min(1, 0.58 + inkMultiplier * 0.45).toFixed(2);
    const ferryOrangeStroke = isDark
      ? `rgba(251, 122, 36, ${orangeAlpha})`
      : `rgba(217, 83, 15, ${orangeAlpha})`;
    const ferryOrangeWash = isDark
      ? "rgba(234, 88, 12, 0.34)"
      : "rgba(249, 115, 22, 0.24)";
    const windowDayStroke = isDark
      ? "#fde68a"
      : `rgba(154, 52, 18, ${orangeAlpha})`;
    const sif = SVG_PATHS.statenIslandFerry;

    harborItems.push({
      waterlineY: ferry.y + 9 * s,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`staten-island-ferry-${i}`}
          ref={(el) => {
            slot.group = el;
          }}
          data-entity="staten-island-ferry"
        >
          <path
            ref={(el) => {
              slot.wake = el;
            }}
            d={sif.wakeRipples}
            pathLength={1}
            strokeDasharray="0.46 0.54"
            stroke={isDark ? "rgba(251, 146, 60, 0.52)" : colors.sketch}
            strokeWidth={strokePx(0.9, s)}
            opacity={0.78}
          />

          {/* Opaque background mask behind full ferry silhouette (hull, decks, wheelhouses & stack) */}
          <path d={sif.hull} fill={paperMaskFill} stroke="none" />
          <path d={sif.lowerDeck} fill={paperMaskFill} stroke="none" />
          <path d={sif.upperDeck} fill={paperMaskFill} stroke="none" />
          <path d={sif.pilotHousesAndStack} fill={paperMaskFill} stroke="none" />

          <path
            d={sif.hull}
            fill={ferryOrangeWash}
            stroke={ferryOrangeStroke}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(2, 55)}
            strokeWidth={swMain}
          />
          <path
            d={sif.rubRailAndPortals}
            stroke={ferryOrangeStroke}
            strokeWidth={swFine}
          />
          <path
            d={sif.lowerDeck}
            fill={ferryOrangeWash}
            stroke={ferryOrangeStroke}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(3, 55)}
            strokeWidth={swMain}
          />
          <path
            d={sif.upperDeck}
            fill={ferryOrangeWash}
            stroke={ferryOrangeStroke}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(4, 55)}
            strokeWidth={swMain}
          />
          <path
            d={sif.pilotHousesAndStack}
            fill={ferryOrangeWash}
            stroke={ferryOrangeStroke}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(5, 55)}
            strokeWidth={swFine}
          />

          <path
            d={sif.lowerWindows}
            stroke={windowDayStroke}
            strokeWidth={strokePx(isDark ? 2.1 : 1.35, s)}
            opacity={isDark ? 0.96 : 0.85}
          />
          <path
            d={sif.upperWindows}
            stroke={windowDayStroke}
            strokeWidth={strokePx(isDark ? 1.95 : 1.25, s)}
            opacity={isDark ? 0.94 : 0.85}
          />
          <path
            d={sif.bridgeWindows}
            stroke={isDark ? "#fef08a" : windowDayStroke}
            strokeWidth={strokePx(isDark ? 1.75 : 1.15, s)}
            opacity={isDark ? 0.96 : 0.85}
          />

          {isDark && (
            <g data-entity="staten-island-ferry-night-lights">
              <path
                d="M -42 12.5 L 42 12.5 M -28 15.2 L 28 15.2"
                stroke="#fb923c"
                strokeWidth={strokePx(1.05, s)}
                opacity={0.5}
              />
              <circle
                cx={48}
                cy={-1}
                r={1.35}
                fill="#4ade80"
                stroke="none"
              />
              <circle
                cx={-48}
                cy={-1}
                r={1.3}
                fill="#f87171"
                stroke="none"
              />
              <circle
                cx={0}
                cy={-34.5}
                r={3.2}
                fill="#fef08a"
                fillOpacity={0.32}
                stroke="none"
              />
              <circle
                cx={0}
                cy={-34.5}
                r={1.35}
                fill="#fef08a"
                stroke="none"
              />
            </g>
          )}
        </g>
      ),
    });
  });

  scene.charonFerrys.forEach((ship, i) => {
    const slot = (refs.charonFerrys[i] ??= {
      group: null,
      oar: null,
      arms: null,
    });
    const s = baseScale * 0.85;
    const sw = strokePx(1.05, s);
    harborItems.push({
      waterlineY: ship.y + 9.5 * s,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`charon-${i}`}
          ref={(el) => {
            slot.group = el;
          }}
          data-entity="charon-ferry"
        >
          <path
            d={SVG_PATHS.charonFerry.hull}
            fill={paperMaskFill}
            pathLength={1}
            className="nyc-ink-path"
            strokeWidth={sw}
          />
          <path
            d={SVG_PATHS.charonFerry.skeleton}
            pathLength={1}
            className="nyc-ink-path"
            strokeWidth={sw}
          />
          <g
            ref={(el) => {
              slot.oar = el;
            }}
          >
            <path d={SVG_PATHS.charonFerry.oar} strokeWidth={sw} />
          </g>
          <path
            ref={(el) => {
              slot.arms = el;
            }}
            d="M 4 -31 L 1 -25 L 6 -24"
            strokeWidth={sw}
          />
          {isDark && (
            <g data-entity="boat-night-lights">
              <circle cx={-32} cy={-8} r={3.2} fill="#fbbf24" fillOpacity={0.3} stroke="none" />
              <circle cx={-32} cy={-8} r={1.3} fill="#fef08a" stroke="none" />
              <path
                d="M -26 12.5 L 26 12.5"
                stroke="#fbbf24"
                strokeWidth={strokePx(0.9, s)}
                opacity={0.38}
              />
            </g>
          )}
        </g>
      ),
    });
  });

  scene.harvestBoats.forEach((boat, i) => {
    const slot = (refs.harvestBoats[i] ??= {
      group: null,
      wheel: null,
      stackSteam: null,
      pieSteam: null,
    });
    const s = baseScale * 0.96;
    const swMain = strokePx(1.1, s);
    const swFine = strokePx(0.82, s);
    harborItems.push({
      waterlineY: boat.y + 10 * s,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`harvest-boat-${i}`}
          ref={(el) => {
            slot.group = el;
          }}
          data-entity="harvest-steamboat"
        >
          <path
            d={SVG_PATHS.harvestBoat.hullAndCabin}
            fill={paperMaskFill}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(i * 2, 60)}
            strokeWidth={swMain}
          />
          <path
            d={SVG_PATHS.harvestBoat.pieAndPumpkins}
            fill={paperMaskFill}
            stroke={colors.accent}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(i * 2 + 1, 60)}
            strokeWidth={swFine}
          />
          <g
            ref={(el) => {
              slot.wheel = el;
            }}
          >
            <path
              d={SVG_PATHS.harvestBoat.paddleWheelRim}
              fill={paperMaskFill}
              strokeWidth={swMain}
            />
            <path
              d={SVG_PATHS.harvestBoat.paddleSpokes}
              strokeWidth={swFine}
            />
          </g>
          <path
            ref={(el) => {
              slot.stackSteam = el;
            }}
            d="M -6 -38 C -10 -44 -2 -49 -7 -55 C -11 -60 -4 -64 -8 -69"
            pathLength={1}
            strokeDasharray="0.45 0.55"
            strokeWidth={swFine}
            opacity={0.78}
          />
          <path
            ref={(el) => {
              slot.pieSteam = el;
            }}
            d="M 26 -15 C 24 -20 29 -24 26 -29 C 23 -33 28 -36 26 -40"
            pathLength={1}
            strokeDasharray="0.45 0.55"
            stroke={colors.accent}
            strokeWidth={swFine}
            opacity={0.82}
          />
          {isDark && (
            <g data-entity="boat-night-lights">
              <path
                d="M -17 -6 L -12 -6 M -7 -6 L -2 -6 M 3 -6 L 8 -6 M -6 -18 L 2 -18"
                stroke="#fde68a"
                strokeWidth={strokePx(1.9, s)}
                opacity={0.92}
              />
              <path
                d="M -32 12.5 L 34 12.5"
                stroke="#fbbf24"
                strokeWidth={strokePx(0.95, s)}
                opacity={0.42}
              />
              <circle cx={40} cy={-1} r={1.25} fill="#4ade80" stroke="none" />
              <circle cx={-36} cy={-1} r={1.2} fill="#f87171" stroke="none" />
            </g>
          )}
        </g>
      ),
    });
  });

  scene.holidayTreeBoats.forEach((boat, i) => {
    const slot = (refs.holidayTreeBoats[i] ??= {
      group: null,
      star: null,
      steam: null,
    });
    const s = baseScale * 0.96;
    const swMain = strokePx(1.1, s);
    const swFine = strokePx(0.82, s);
    harborItems.push({
      waterlineY: boat.y + 9 * s,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`tree-boat-${i}`}
          ref={(el) => {
            slot.group = el;
          }}
          data-entity="rockefeller-tree-barge"
        >
          <path
            d={SVG_PATHS.holidayTreeBoat.tugAndTow}
            fill={paperMaskFill}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(i * 2, 60)}
            strokeWidth={swMain}
          />
          <path
            d={SVG_PATHS.holidayTreeBoat.spruceBoughs}
            fill={paperMaskFill}
            stroke="none"
          />
          <path
            d={SVG_PATHS.holidayTreeBoat.spruceBoughs}
            fill={colors.primary}
            fillOpacity={0.14}
            stroke={colors.primary}
            pathLength={1}
            className="nyc-ink-path"
            style={drawDelayStyle(i * 2 + 1, 60)}
            strokeWidth={swMain}
          />
          <path
            d={SVG_PATHS.holidayTreeBoat.garlandAndWreath}
            stroke={colors.accent}
            strokeWidth={swFine}
          />
          <g
            ref={(el) => {
              slot.star = el;
            }}
          >
            <path
              d={SVG_PATHS.holidayTreeBoat.starTopper}
              fill={paperMaskFill}
              stroke="none"
            />
            <path
              d={SVG_PATHS.holidayTreeBoat.starTopper}
              fill={colors.accent}
              fillOpacity={0.28}
              stroke={colors.accent}
              strokeWidth={swFine}
            />
          </g>
          <path
            ref={(el) => {
              slot.steam = el;
            }}
            d="M 26.5 -24 C 23 -30 30 -35 25 -41 C 21 -46 27 -50 23 -55"
            pathLength={1}
            strokeDasharray="0.44 0.56"
            strokeWidth={swFine}
            opacity={0.75}
          />
          {isDark && (
            <g data-entity="boat-night-lights">
              <path
                d="M 30 -7 L 36 -7 M -76 11.5 L -22 11.5 M 14 10.5 L 46 10.5"
                stroke="#fde68a"
                strokeWidth={strokePx(1.5, s)}
                opacity={0.85}
              />
              <circle cx={-58} cy={-8} r={1.2} fill="#ff4d4d" stroke="none" />
              <circle cx={-41} cy={-9} r={1.2} fill="#fbbf24" stroke="none" />
              <circle cx={-54} cy={-19} r={1.2} fill="#38bdf8" stroke="none" />
              <circle cx={-44} cy={-20} r={1.2} fill="#4ade80" stroke="none" />
              <circle cx={-49} cy={-31} r={1.2} fill="#f472b6" stroke="none" />
              <circle cx={51} cy={-5} r={1.25} fill="#4ade80" stroke="none" />
            </g>
          )}
        </g>
      ),
    });
  });

  scene.winterHarborBoats.forEach((boat, i) => {
    const slot = (refs.winterHarborBoats[i] ??= {
      group: null,
      skater: null,
      steam1: null,
      steam2: null,
    });
    const s = baseScale * 0.98;
    const swMain = strokePx(1.1, s);
    const swFine = strokePx(0.82, s);
    const keelY = boat.kind === "rinkBarge" ? 10 : 9;
    harborItems.push({
      waterlineY: boat.y + keelY * s,
      orderTieBreaker: harborSeq++,
      element: (
        <g
          key={`winter-boat-${i}`}
          ref={(el) => {
            slot.group = el;
          }}
          data-entity={`winter-${boat.kind}`}
        >
          {boat.kind === "rinkBarge" ? (
            <>
              <path
                d={SVG_PATHS.winterHarbor.rinkBarge.hull}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(i * 2, 60)}
                strokeWidth={swMain}
              />
              <g
                ref={(el) => {
                  slot.skater = el;
                }}
              >
                <path
                  d={SVG_PATHS.winterHarbor.rinkBarge.skater}
                  stroke={colors.primary}
                  strokeWidth={swMain}
                />
              </g>
              {isDark && (
                <g data-entity="boat-night-lights">
                  {[-32, -16, 0, 16, 32].map((bx, bIdx) => (
                    <circle
                      key={bIdx}
                      cx={bx}
                      cy={bIdx === 2 ? -16 : bIdx === 1 || bIdx === 3 ? -17 : -19}
                      r={1.35}
                      fill="#fef08a"
                      stroke="none"
                    />
                  ))}
                  <path
                    d="M -40 12.5 L 40 12.5"
                    stroke="#fbbf24"
                    strokeWidth={strokePx(0.95, s)}
                    opacity={0.42}
                  />
                </g>
              )}
            </>
          ) : (
            <>
              <path
                d={SVG_PATHS.winterHarbor.cocoaTug.hull}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(i * 2, 60)}
                strokeWidth={swMain}
              />
              <path
                ref={(el) => {
                  slot.steam1 = el;
                }}
                d="M -21 -25 C -25 -31 -17 -36 -22 -43 C -26 -48 -19 -53 -23 -58"
                pathLength={1}
                strokeDasharray="0.45 0.55"
                stroke={colors.accent}
                strokeWidth={swFine}
                opacity={0.82}
              />
              <path
                ref={(el) => {
                  slot.steam2 = el;
                }}
                d="M -16 -24 C -13 -30 -19 -35 -15 -41"
                pathLength={1}
                strokeDasharray="0.45 0.55"
                strokeWidth={swFine}
                opacity={0.72}
              />
              {isDark && (
                <g data-entity="boat-night-lights">
                  <path
                    d="M 6 -8 L 14 -8 M -28 11.5 L 36 11.5"
                    stroke="#fde68a"
                    strokeWidth={strokePx(1.6, s)}
                    opacity={0.88}
                  />
                  <circle cx={41} cy={-5} r={1.25} fill="#4ade80" stroke="none" />
                  <circle cx={6.5} cy={-23.5} r={1.3} fill="#fef08a" stroke="none" />
                </g>
              )}
            </>
          )}
        </g>
      ),
    });
  });

  harborItems.push(
    ...collectSpringSummerHarborItems(
      scene,
      refs.springSummer,
      baseScale,
      isDark,
      colors,
      harborSeq,
    ),
  );
  harborItems.sort(
    (a, b) => a.waterlineY - b.waterlineY || a.orderTieBreaker - b.orderTieBreaker,
  );

  return (
    <>
      {/* Layer 1 (Back): Skyline-anchored facade lighting, wreaths & waterfront props */}
      <g data-layer="city-and-waterfront">
        {renderCityDetailsSvgElements(
          scene,
          refs.cityDetails,
          baseScale,
          isDark,
          colors,
        )}
      </g>

      {/* Layer 2 (Mid): Sky clouds, birds, aircraft, Kai sky gliders & falling particles */}
      <g data-layer="sky-and-aerial">
      {/* 1. Upper-sky twinkling compass stars (Christmas) */}
      {scene.twinkleStars.map((star, i) => {
        const s = baseScale * star.scale * 1.15;
        return (
          <g
            key={`star-${i}`}
            ref={(el) => {
              refs.twinkleStars[i] = el;
            }}
            data-entity="compass-star"
          >
            <path
              d={SVG_PATHS.compassStar}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i, 35)}
              strokeWidth={strokePx(0.95, s)}
            />
          </g>
        );
      })}

      {/* 2. Clouds */}
      {scene.clouds.map((cloud, i) => {
        const s = baseScale * cloud.scale;
        return (
          <g
            key={`cloud-${i}`}
            ref={(el) => {
              refs.clouds[i] = el;
            }}
            data-entity="cloud"
          >
            <path
              d={SVG_PATHS.cloud}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i, 50)}
              strokeWidth={strokePx(1.05, s)}
            />
          </g>
        );
      })}

      {/* 3. Calligraphic self-drawing wind ribbons */}
      {scene.windRibbons.map((ribbon, i) => {
        const slot = (refs.windRibbons[i] ??= { group: null, path: null });
        const s = baseScale * ribbon.scale * 1.2;
        return (
          <g
            key={`wind-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="wind-ribbon"
          >
            <path
              ref={(el) => {
                slot.path = el;
              }}
              d={SVG_PATHS.windRibbons[ribbon.variant]}
              pathLength={1}
              strokeDasharray="0.38 0.62"
              strokeWidth={strokePx(0.95, s)}
              opacity={0.72}
            />
          </g>
        );
      })}

      {/* 4. Classic seagulls */}
      {scene.birds.map((bird, i) => {
        const slot = (refs.birds[i] ??= { group: null, wing: null });
        const s = baseScale * bird.scale;
        return (
          <g
            key={`bird-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="bird"
          >
            <path
              ref={(el) => {
                slot.wing = el;
              }}
              d="M -10 -4 Q -5 0 0 5 Q 5 0 10 -4"
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i, 30)}
              strokeWidth={strokePx(1.05, s)}
            />
          </g>
        );
      })}

      {/* 5. Migrating V-Formation Canada Geese (Thanksgiving) */}
      {scene.gooseFlocks.map((flock, i) => {
        const slot = (refs.gooseFlocks[i] ??= { group: null, birds: [] });
        const s = baseScale * flock.scale * 1.15;
        const sw = strokePx(1.1, s);
        const totalBirds = 1 + flock.wingCount * 2;
        return (
          <g
            key={`flock-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="migrating-geese"
          >
            {Array.from({ length: totalBirds }, (_, bIdx) => {
              const birdSlot = (slot.birds[bIdx] ??= {
                group: null,
                wings: null,
              });
              const armRank = bIdx === 0 ? 0 : Math.ceil(bIdx / 2);
              const side = bIdx % 2 === 1 ? -1 : 1;
              const localX = -armRank * 24;
              const localY = bIdx === 0 ? 0 : side * armRank * 13;
              return (
                <g
                  key={`goose-${bIdx}`}
                  transform={`translate(${localX}, ${localY})`}
                  ref={(el) => {
                    birdSlot.group = el;
                  }}
                >
                  <path
                    d="M -9 1 C -5 -2 2 -2 7 0 L 15 -3 L 18 -2 L 15 -1 L 7 2 C 2 3 -5 3 -9 1 Z"
                    pathLength={1}
                    className="nyc-ink-path"
                    style={drawDelayStyle(i * 4 + bIdx, 35)}
                    strokeWidth={sw}
                  />
                  <path
                    ref={(el) => {
                      birdSlot.wings = el;
                    }}
                    d="M -1 -1 Q -4 -10 -11 -12 M 1 1 Q -2 9 -9 11"
                    strokeWidth={sw}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 6. Central Park Snowy Owls (Winter) */}
      {scene.snowyOwls.map((owl, i) => {
        const slot = (refs.snowyOwls[i] ??= {
          group: null,
          nearWing: null,
          farWing: null,
        });
        const s = baseScale * owl.scale * 1.3;
        const sw = strokePx(1.15, s);
        return (
          <g
            key={`owl-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="snowy-owl"
          >
            <g
              ref={(el) => {
                slot.farWing = el;
              }}
            >
              <path
                d={SVG_PATHS.snowyOwl.farWing}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(i * 2, 50)}
                strokeWidth={strokePx(0.95, s)}
              />
            </g>
            <path
              d={SVG_PATHS.snowyOwl.bodyAndHead}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i * 2 + 1, 50)}
              strokeWidth={sw}
            />
            <g
              ref={(el) => {
                slot.nearWing = el;
              }}
            >
              <path
                d={SVG_PATHS.snowyOwl.nearWing}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(i * 2 + 2, 50)}
                strokeWidth={sw}
              />
            </g>
          </g>
        );
      })}

      {/* 7. Helicopters */}
      {scene.helicopters.map((_, i) => {
        const slot = (refs.helicopters[i] ??= { group: null, rotor: null });
        const s = baseScale * 1.35;
        const sw = strokePx(1.1, s);
        return (
          <g
            key={`heli-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="helicopter"
          >
            <path
              d={SVG_PATHS.helicopter.body}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i, 60)}
              strokeWidth={sw}
            />
            <line
              ref={(el) => {
                slot.rotor = el;
              }}
              x1={-20}
              y1={-12}
              x2={20}
              y2={-12}
              strokeWidth={sw}
            />
          </g>
        );
      })}

      {/* 8. Macy's Thanksgiving Day Parade Giant Balloons */}
      {scene.paradeBalloons.map((balloon, i) => {
        const slot = (refs.paradeBalloons[i] ??= {
          group: null,
          tailFan: null,
          tethers: null,
        });
        const s = baseScale * balloon.scale * 1.18;
        const swMain = strokePx(1.2, s);
        const swDetail = strokePx(0.82, s);
        const spec = SVG_PATHS.paradeBalloons[balloon.kind];

        return (
          <g
            key={`balloon-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity={`parade-balloon-${balloon.kind}`}
          >
            <path
              ref={(el) => {
                slot.tethers = el;
              }}
              d="M 0 30 L 0 76"
              strokeWidth={strokePx(0.75, s)}
              opacity={0.85}
            />

            {balloon.kind === "turkey" && (
              <>
                <g
                  ref={(el) => {
                    slot.tailFan = el;
                  }}
                >
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.tailFan}
                    fill={paperMaskFill}
                    pathLength={1}
                    className="nyc-ink-path"
                    style={drawDelayStyle(i * 3, 60)}
                    strokeWidth={swMain}
                  />
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.tailRibs}
                    pathLength={1}
                    className="nyc-ink-path"
                    style={drawDelayStyle(i * 3 + 1, 60)}
                    strokeWidth={swDetail}
                  />
                </g>
                <path
                  d={SVG_PATHS.paradeBalloons.turkey.body}
                  fill={paperMaskFill}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3 + 1, 60)}
                  strokeWidth={swMain}
                />
                <path
                  d={SVG_PATHS.paradeBalloons.turkey.seams}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3 + 2, 60)}
                  strokeWidth={swDetail}
                />
                <path
                  d={SVG_PATHS.paradeBalloons.turkey.hat}
                  fill={darkFillSoft}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3 + 2, 60)}
                  strokeWidth={swMain}
                />
                <path
                  d={SVG_PATHS.paradeBalloons.turkey.hatBand}
                  stroke={colors.accent}
                  strokeWidth={swDetail}
                />
              </>
            )}

            {balloon.kind === "astronautPup" && (
              <>
                <path
                  d={SVG_PATHS.paradeBalloons.astronautPup.body}
                  fill={paperMaskFill}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3, 60)}
                  strokeWidth={swMain}
                />
                <path
                  d={SVG_PATHS.paradeBalloons.astronautPup.seams}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3 + 1, 60)}
                  strokeWidth={swDetail}
                />
                <path
                  d={SVG_PATHS.paradeBalloons.astronautPup.scarf}
                  fill={colors.accent}
                  fillOpacity={0.22}
                  stroke={colors.accent}
                  strokeWidth={swDetail}
                />
              </>
            )}

            {balloon.kind === "harvestCluster" && (
              <>
                <path
                  d={spec.body}
                  fill={paperMaskFill}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3, 60)}
                  strokeWidth={swMain}
                />
                <path
                  d={spec.seams}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(i * 3 + 1, 60)}
                  strokeWidth={swDetail}
                />
              </>
            )}
          </g>
        );
      })}

      {/* 9. Santa's Sleigh & 3 Articulated Galloping Reindeer (Christmas) */}
      {scene.santaSleighs.map((sleigh, i) => {
        const slot = (refs.santaSleighs[i] ??= {
          sleighGroup: null,
          waveArm: null,
          reindeerGroups: [],
          reins: null,
          wake: null,
        });
        const s = baseScale * sleigh.scale * 1.18;
        const swMain = strokePx(1.2, s);
        const swDetail = strokePx(0.85, s);

        return (
          <g key={`santa-team-${i}`} data-entity="santa-sleigh-team">
            <path
              ref={(el) => {
                slot.wake = el;
              }}
              d="M 0 0 L -80 0"
              pathLength={1}
              strokeDasharray="0.45 0.55"
              strokeWidth={1.0}
              opacity={0.65}
            />
            <path
              ref={(el) => {
                slot.reins = el;
              }}
              d="M 0 0 L 100 0"
              strokeWidth={0.9}
              opacity={0.85}
            />
            <g
              ref={(el) => {
                slot.sleighGroup = el;
              }}
            >
              <path
                d={SVG_PATHS.santaSleigh.runners}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(1, 50)}
                strokeWidth={swDetail}
              />
              <path
                d={SVG_PATHS.santaSleigh.giftsAndSack}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(2, 50)}
                strokeWidth={swDetail}
              />
              <g
                ref={(el) => {
                  slot.waveArm = el;
                }}
              >
                <path
                  d={SVG_PATHS.santaSleigh.santaWaveArm}
                  strokeWidth={swMain}
                />
              </g>
              <path
                d={SVG_PATHS.santaSleigh.santa}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(3, 50)}
                strokeWidth={swMain}
              />
              <path
                d={SVG_PATHS.santaSleigh.body}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(0, 50)}
                strokeWidth={swMain}
              />
            </g>

            {[0, 1, 2].map((rIdx) => {
              const rSlot = (slot.reindeerGroups[rIdx] ??= {
                group: null,
                frontA: null,
                frontB: null,
                hindA: null,
                hindB: null,
                noseGlow: null,
              });
              const isRudolph = rIdx === 2;
              return (
                <g
                  key={`reindeer-${rIdx}`}
                  ref={(el) => {
                    rSlot.group = el;
                  }}
                >
                  <g
                    ref={(el) => {
                      rSlot.hindB = el;
                    }}
                  >
                    <path
                      d={SVG_PATHS.reindeer.hindLegB}
                      strokeWidth={swDetail}
                    />
                  </g>
                  <g
                    ref={(el) => {
                      rSlot.frontB = el;
                    }}
                  >
                    <path
                      d={SVG_PATHS.reindeer.frontLegB}
                      strokeWidth={swDetail}
                    />
                  </g>
                  <path
                    d={SVG_PATHS.reindeer.antlers}
                    pathLength={1}
                    className="nyc-ink-path"
                    style={drawDelayStyle(4 + rIdx, 55)}
                    strokeWidth={swDetail}
                  />
                  <path
                    d={SVG_PATHS.reindeer.bodyAndHead}
                    fill={paperMaskFill}
                    pathLength={1}
                    className="nyc-ink-path"
                    style={drawDelayStyle(3 + rIdx, 55)}
                    strokeWidth={swMain}
                  />
                  <g
                    ref={(el) => {
                      rSlot.hindA = el;
                    }}
                  >
                    <path d={SVG_PATHS.reindeer.hindLegA} strokeWidth={swMain} />
                  </g>
                  <g
                    ref={(el) => {
                      rSlot.frontA = el;
                    }}
                  >
                    <path
                      d={SVG_PATHS.reindeer.frontLegA}
                      strokeWidth={swMain}
                    />
                  </g>
                  {isRudolph && (
                    <g
                      ref={(el) => {
                        rSlot.noseGlow = el;
                      }}
                      transform="translate(28.5, -17.5)"
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={2.3}
                        fill={colors.accent}
                        stroke={colors.accent}
                        strokeWidth={swDetail}
                      />
                      <path
                        d="M 0 -5.5 L 0 -3.5 M 0 3.5 L 0 5.5 M -5.5 0 L -3.5 0 M 3.5 0 L 5.5 0"
                        stroke={colors.accent}
                        strokeWidth={strokePx(0.75, s)}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 10. Halloween Witches */}
      {scene.witches.map((witch, i) => {
        const s = baseScale * witch.scale;
        return (
          <g
            key={`witch-${i}`}
            ref={(el) => {
              refs.witches[i] = el;
            }}
            data-entity="witch"
          >
            <path
              d={SVG_PATHS.witch}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i, 40)}
              strokeWidth={strokePx(1.05, s)}
            />
          </g>
        );
      })}

      {/* 11A. Kai the Dog — Halloween Wizard Edition */}
      {scene.dogWizards.map((dog, i) => {
        const slot = (refs.dogWizards[i] ??= {
          group: null,
          broom: null,
          cape: null,
          folds: [],
          hat: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.8, s);
        return (
          <g
            key={`dog-wizard-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-wizard"
          >
            <g
              ref={(el) => {
                slot.broom = el;
              }}
            >
              <path
                d={SVG_PATHS.dogWizardGear.broom}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                strokeWidth={swMain}
              />
              <path d={SVG_PATHS.dogWizardGear.broomGrain} strokeWidth={swFine} />
              <path
                d={SVG_PATHS.dogWizardGear.bristles}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                strokeWidth={swMain}
              />
            </g>
            {renderKaiBaseBody(swMain, paperMaskFill)}
            <g
              ref={(el) => {
                slot.cape = el;
              }}
            >
              <path
                d={SVG_PATHS.dogWizardGear.cape}
                fill={darkFillStrong}
                strokeWidth={swMain}
              />
              {[
                SVG_PATHS.dogWizardGear.capeFold1,
                SVG_PATHS.dogWizardGear.capeFold2,
                SVG_PATHS.dogWizardGear.capeFold3,
                SVG_PATHS.dogWizardGear.capeFold4,
              ].map((foldD, fIdx) => (
                <path
                  key={`fold-${fIdx}`}
                  ref={(el) => {
                    slot.folds[fIdx] = el;
                  }}
                  d={foldD}
                  strokeWidth={swFine}
                />
              ))}
            </g>
            <path d={SVG_PATHS.kaiDog.collar} strokeWidth={swMain} />
            <path
              d={SVG_PATHS.dogWizardGear.clasp}
              fill={paperMaskFill}
              strokeWidth={swMain}
            />
            <path
              d={SVG_PATHS.kaiDog.diamondTag}
              fill={paperMaskFill}
              strokeWidth={swMain}
            />
            {renderKaiHandsAndFace(swMain, paperMaskFill)}
            <g
              ref={(el) => {
                slot.hat = el;
              }}
            >
              <path
                d={SVG_PATHS.dogWizardGear.hat}
                fill={darkFillSoft}
                strokeWidth={swMain}
              />
              <path
                d={SVG_PATHS.dogWizardGear.hatDetails}
                strokeWidth={swMain}
              />
            </g>
          </g>
        );
      })}

      {/* 11B. Kai the Dog — Thanksgiving Pilgrim & Turkey-Feather Maple Glider */}
      {scene.pilgrimDogs.map((dog, i) => {
        const slot = (refs.pilgrimDogs[i] ??= {
          group: null,
          leaf: null,
          feathers: [],
          hat: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.82, s);
        return (
          <g
            key={`pilgrim-dog-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-thanksgiving"
          >
            <g
              ref={(el) => {
                slot.leaf = el;
              }}
            >
              <path
                d={SVG_PATHS.pilgrimDogGear.mapleBlade}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(1, 60)}
                strokeWidth={swMain}
              />
              <path
                d={SVG_PATHS.pilgrimDogGear.mapleVeins}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(2, 60)}
                strokeWidth={swFine}
              />
              <path
                d={SVG_PATHS.pilgrimDogGear.mapleStem}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(0, 60)}
                strokeWidth={swMain}
              />
            </g>

            {SVG_PATHS.pilgrimDogGear.feathers.map((feather, fIdx) => (
              <g
                key={`feather-${fIdx}`}
                ref={(el) => {
                  slot.feathers[fIdx] = el;
                }}
              >
                <path
                  d={feather.outline}
                  fill={paperMaskFill}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(2 + fIdx, 45)}
                  strokeWidth={swMain}
                />
                <path
                  d={feather.detail}
                  stroke={fIdx % 2 === 1 ? colors.accent : undefined}
                  strokeWidth={swFine}
                />
              </g>
            ))}

            {renderKaiBaseBody(swMain, paperMaskFill)}
            <path d={SVG_PATHS.kaiDog.collar} strokeWidth={swMain} />
            <path
              d={SVG_PATHS.kaiDog.diamondTag}
              fill={paperMaskFill}
              strokeWidth={swMain}
            />
            {renderKaiHandsAndFace(swMain, paperMaskFill)}

            <g
              ref={(el) => {
                slot.hat = el;
              }}
            >
              <path
                d={SVG_PATHS.pilgrimDogGear.hatCrown}
                fill={darkFillStrong}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(4, 50)}
                strokeWidth={swMain}
              />
              <path
                d={SVG_PATHS.pilgrimDogGear.hatBrimAndBuckle}
                fill={paperMaskFill}
                fillOpacity={0.18}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(5, 50)}
                strokeWidth={swMain}
              />
            </g>
          </g>
        );
      })}

      {/* 11C. Kai the Dog — Christmas Santa-Hat & Candy-Cane Sky-Sled */}
      {scene.santaDogs.map((dog, i) => {
        const slot = (refs.santaDogs[i] ??= {
          group: null,
          sled: null,
          scarfUpper: null,
          scarfLower: null,
          hat: null,
          pom: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        return (
          <g
            key={`santa-dog-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-christmas"
          >
            <g
              ref={(el) => {
                slot.sled = el;
              }}
            >
              <path
                d={SVG_PATHS.santaDogGear.sledGifts}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(2, 55)}
                strokeWidth={swFine}
              />
              <path
                d={SVG_PATHS.santaDogGear.sledDeckAndRunner}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(1, 55)}
                strokeWidth={swMain}
              />
            </g>

            <g
              ref={(el) => {
                slot.scarfLower = el;
              }}
            >
              <path
                d={SVG_PATHS.santaDogGear.scarfTailLower}
                fill={colors.accent}
                fillOpacity={0.18}
                stroke={colors.accent}
                strokeWidth={swMain}
              />
            </g>

            {renderKaiBaseBody(swMain, paperMaskFill)}

            <g
              ref={(el) => {
                slot.scarfUpper = el;
              }}
            >
              <path
                d={SVG_PATHS.santaDogGear.scarfTailUpper}
                fill={colors.accent}
                fillOpacity={0.22}
                stroke={colors.accent}
                strokeWidth={swMain}
              />
            </g>
            <path
              d={SVG_PATHS.santaDogGear.scarfNeck}
              fill={colors.accent}
              fillOpacity={0.24}
              stroke={colors.accent}
              strokeWidth={swMain}
            />
            <path
              d={SVG_PATHS.santaDogGear.jingleBell}
              fill={paperMaskFill}
              strokeWidth={swFine}
            />

            {renderKaiHandsAndFace(swMain, paperMaskFill)}

            <g
              ref={(el) => {
                slot.hat = el;
              }}
            >
              <path
                d={SVG_PATHS.santaDogGear.hatCrownFill}
                fill={colors.accent}
                fillOpacity={0.24}
                stroke={colors.accent}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(4, 50)}
                strokeWidth={swMain}
              />
              <path
                d={SVG_PATHS.santaDogGear.hatBrim}
                fill={paperMaskFill}
                strokeWidth={swMain}
              />
              <g
                ref={(el) => {
                  slot.pom = el;
                }}
              >
                <path
                  d={SVG_PATHS.santaDogGear.pomPom}
                  fill={paperMaskFill}
                  strokeWidth={swMain}
                />
              </g>
            </g>
          </g>
        );
      })}

      {/* 11D. Kai the Dog — Winter Beanie, Earmuffs & Carving Snowboard */}
      {scene.winterDogs.map((dog, i) => {
        const slot = (refs.winterDogs[i] ??= {
          group: null,
          board: null,
          scarf: null,
          hat: null,
          wake: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        return (
          <g key={`winter-dog-wrap-${i}`} data-entity="kai-winter">
            <path
              ref={(el) => {
                slot.wake = el;
              }}
              d="M 0 0 L -80 0"
              pathLength={1}
              strokeDasharray="0.52 0.48"
              strokeWidth={1.05}
              opacity={0.72}
            />

            <g
              ref={(el) => {
                slot.group = el;
              }}
            >
              <g
                ref={(el) => {
                  slot.board = el;
                }}
              >
                <path
                  d={SVG_PATHS.winterDogGear.snowboard}
                  fill={paperMaskFill}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(1, 55)}
                  strokeWidth={swMain}
                />
                <path
                  d={SVG_PATHS.winterDogGear.snowboardDetails}
                  stroke={colors.primary}
                  strokeWidth={swFine}
                />
              </g>

              {renderKaiBaseBody(swMain, paperMaskFill)}

              <g
                ref={(el) => {
                  slot.scarf = el;
                }}
              >
                <path
                  d={SVG_PATHS.winterDogGear.scarfStream}
                  fill={colors.primary}
                  fillOpacity={0.2}
                  stroke={colors.primary}
                  strokeWidth={swMain}
                />
              </g>
              <path
                d={SVG_PATHS.winterDogGear.scarfNeck}
                fill={colors.primary}
                fillOpacity={0.24}
                stroke={colors.primary}
                strokeWidth={swMain}
              />

              {renderKaiHandsAndFace(swMain, paperMaskFill)}

              <g
                ref={(el) => {
                  slot.hat = el;
                }}
              >
                <path
                  d={SVG_PATHS.winterDogGear.beanieCap}
                  fill={darkFillSoft}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(3, 50)}
                  strokeWidth={swMain}
                />
                <path
                  d={SVG_PATHS.winterDogGear.earmuffFill}
                  fill={paperMaskFill}
                  stroke="none"
                />
                <path
                  d={SVG_PATHS.winterDogGear.beanieDetails}
                  fill={paperMaskFill}
                  fillOpacity={0.3}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelayStyle(4, 50)}
                  strokeWidth={swMain}
                />
              </g>
            </g>
          </g>
        );
      })}

      {/* 15. Tumbling Autumn Leaves (Thanksgiving) */}
      {scene.autumnLeaves.map((leaf, i) => {
        const slot = (refs.autumnLeaves[i] ??= { group: null, inner: null });
        const s = baseScale * leaf.scale * 0.95;
        const sw = strokePx(1.0, s);
        const spec = SVG_PATHS.autumnLeaves[leaf.kind];
        const useAccent = i % 3 === 0;
        return (
          <g
            key={`leaf-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity={`autumn-leaf-${leaf.kind}`}
          >
            <g
              ref={(el) => {
                slot.inner = el;
              }}
            >
              <path
                d={spec.outline}
                fill={paperMaskFill}
                fillOpacity={0.5}
                stroke={useAccent ? colors.accent : undefined}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelayStyle(i, 25)}
                strokeWidth={sw}
              />
              <path
                d={spec.veins}
                stroke={useAccent ? colors.accent : undefined}
                strokeWidth={strokePx(0.72, s)}
              />
            </g>
          </g>
        );
      })}

      {/* 16. 6-Fold Crystalline Snowflakes (Christmas & Winter) */}
      {scene.snowflakes.map((flake, i) => {
        const s = baseScale * flake.scale * 1.05;
        return (
          <g
            key={`flake-${i}`}
            ref={(el) => {
              refs.snowflakes[i] = el;
            }}
            data-entity={`snowflake-${flake.kind}`}
          >
            <path
              d={SVG_PATHS.snowflakes[flake.kind]}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelayStyle(i, 20)}
              strokeWidth={strokePx(0.92, s)}
              opacity={0.86}
            />
          </g>
        );
      })}

      {/* 17. Spring, Summer & Festival Sky Elements */}
      {renderSpringSummerAerialSvgElements(
        scene,
        refs.springSummer,
        baseScale,
        isDark,
        colors,
      )}
      </g>

      {/* Layer 3 (Forefront): Harbor watercraft Y-sorted from upper bay (back) to lower foreground */}
      <g data-layer="harbor-forefront">
        {harborItems.map((item) => item.element)}
      </g>
    </>
  );
}

function renderKaiBaseBody(swMain: number, paperMaskFill: string) {
  return (
    <>
      <path d={SVG_PATHS.kaiDog.tail} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.legs} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.belly} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.chest} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.body} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.ear} fill={paperMaskFill} strokeWidth={swMain} />
    </>
  );
}

function renderKaiHandsAndFace(swMain: number, paperMaskFill: string) {
  return (
    <>
      <path d={SVG_PATHS.kaiDog.hands} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.nose} fill={paperMaskFill} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.face} strokeWidth={swMain} />
    </>
  );
}

// ============================================================================
// Imperative 60fps Scene Physics & SVG Attribute Updater
// ============================================================================
export function updateSceneDom(
  scene: SceneState,
  refs: SceneDomRefs,
  dt: number,
  width: number,
  height: number,
  baseScale: number,
) {
  // 1. Twinkling compass stars
  scene.twinkleStars.forEach((star, i) => {
    const el = refs.twinkleStars[i];
    if (!el) return;
    star.phase += star.speed * dt;
    const pulse = 0.55 + 0.45 * Math.sin(star.phase);
    const s = baseScale * star.scale * (0.95 + 0.22 * pulse);
    const x = star.xRatio * width;
    const y = star.yRatio * height;
    el.setAttribute(
      "transform",
      `translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    el.setAttribute("opacity", (0.35 + 0.6 * pulse).toFixed(2));
  });

  // 2. Clouds
  scene.clouds.forEach((cloud, i) => {
    cloud.x += cloud.speed * dt;
    if (cloud.x > width + 110) cloud.x = -110;
    const el = refs.clouds[i];
    if (!el) return;
    const s = baseScale * cloud.scale;
    el.setAttribute(
      "transform",
      `translate(${cloud.x.toFixed(1)}, ${cloud.y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
  });

  // 3. Calligraphic wind ribbons
  scene.windRibbons.forEach((ribbon, i) => {
    ribbon.x += ribbon.speed * ribbon.direction * dt;
    ribbon.dashPhase = (ribbon.dashPhase + ribbon.dashSpeed * dt) % 1;
    if (ribbon.x > width + 140) {
      ribbon.x = -140;
      ribbon.y = height * (0.12 + Math.random() * 0.55);
    }
    const ref = refs.windRibbons[i];
    if (!ref?.group || !ref.path) return;
    const s = baseScale * ribbon.scale * 1.2;
    ref.group.setAttribute(
      "transform",
      `translate(${ribbon.x.toFixed(1)}, ${ribbon.y.toFixed(1)}) scale(${(ribbon.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    ref.path.setAttribute("stroke-dashoffset", (-ribbon.dashPhase).toFixed(3));
  });

  // 4. Classic seagulls
  scene.birds.forEach((bird, i) => {
    bird.x += bird.speed * dt;
    bird.flap += bird.flapSpeed * dt;
    if (bird.x > width + 50) {
      bird.x = -50;
      bird.y = (0.06 + Math.random() * 0.32) * height;
    }
    const ref = refs.birds[i];
    if (!ref?.group || !ref.wing) return;
    const s = baseScale * bird.scale;
    const flapOffset = Math.sin(bird.flap) * 7.5;
    ref.group.setAttribute(
      "transform",
      `translate(${bird.x.toFixed(1)}, ${bird.y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    ref.wing.setAttribute(
      "d",
      `M -10 ${(-4 + flapOffset).toFixed(1)} Q -5 0 0 5 Q 5 0 10 ${(-4 + flapOffset).toFixed(1)}`,
    );
  });

  // 5. Migrating V-Formation Canada Geese
  scene.gooseFlocks.forEach((flock, i) => {
    flock.x += flock.speed * flock.direction * dt;
    flock.flapPhase += flock.flapSpeed * dt;
    flock.driftPhase += 0.014 * dt;

    if (flock.direction === 1 && flock.x > width + 160) {
      flock.x = -160;
    } else if (flock.direction === -1 && flock.x < -160) {
      flock.x = width + 160;
    }

    const ref = refs.gooseFlocks[i];
    if (!ref?.group) return;
    const s = baseScale * flock.scale * 1.15;
    const y = flock.baseY + Math.sin(flock.driftPhase) * 5;
    ref.group.setAttribute(
      "transform",
      `translate(${flock.x.toFixed(1)}, ${y.toFixed(1)}) scale(${(flock.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );

    const totalBirds = 1 + flock.wingCount * 2;
    for (let bIdx = 0; bIdx < totalBirds; bIdx++) {
      const birdRef = ref.birds[bIdx];
      if (!birdRef?.wings) continue;
      const armRank = bIdx === 0 ? 0 : Math.ceil(bIdx / 2);
      const phase = flock.flapPhase - armRank * 0.48;
      const beat = Math.sin(phase);
      const upperTipY = -9 + beat * 6.5;
      const lowerTipY = 8 + beat * 5.0;
      birdRef.wings.setAttribute(
        "d",
        `M -1 -1 Q -4 ${(upperTipY * 0.6).toFixed(1)} -11 ${upperTipY.toFixed(1)} ` +
          `M 1 1 Q -2 ${(lowerTipY * 0.6).toFixed(1)} -9 ${lowerTipY.toFixed(1)}`,
      );
    }
  });

  // 6. Central Park Snowy Owls
  scene.snowyOwls.forEach((owl, i) => {
    owl.x += owl.speed * owl.direction * dt;
    owl.cyclePhase += owl.cycleSpeed * dt;

    if (owl.direction === 1 && owl.x > width + 110) {
      owl.x = -110;
    } else if (owl.direction === -1 && owl.x < -110) {
      owl.x = width + 110;
    }

    const ref = refs.snowyOwls[i];
    if (!ref?.group) return;

    const cycleMod = owl.cyclePhase % (Math.PI * 3);
    const flapEnvelope =
      cycleMod < Math.PI * 2
        ? Math.sin((cycleMod / (Math.PI * 2)) * Math.PI)
        : 0;
    const wingBeat = Math.sin(cycleMod * 2) * flapEnvelope;
    const bobY = Math.sin(owl.cyclePhase * 1.4) * 4 - wingBeat * 2.5;
    const s = baseScale * owl.scale * 1.3;

    ref.group.setAttribute(
      "transform",
      `translate(${owl.x.toFixed(1)}, ${(owl.baseY + bobY).toFixed(1)}) scale(${(owl.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    ref.nearWing?.setAttribute(
      "transform",
      `rotate(${(wingBeat * 26).toFixed(1)}, 4, -4)`,
    );
    ref.farWing?.setAttribute(
      "transform",
      `rotate(${(wingBeat * 18).toFixed(1)}, 8, -6)`,
    );
  });

  // 7. Helicopters
  scene.helicopters.forEach((heli, i) => {
    heli.x += heli.speed * heli.direction * dt;
    heli.rotorAngle += 0.28 * dt;
    if (heli.direction === 1 && heli.x > width + 100) {
      heli.x = -100;
      heli.y = (0.08 + Math.random() * 0.28) * height;
    } else if (heli.direction === -1 && heli.x < -100) {
      heli.x = width + 100;
      heli.y = (0.08 + Math.random() * 0.28) * height;
    }

    const ref = refs.helicopters[i];
    if (!ref?.group || !ref.rotor) return;
    const s = baseScale * 1.35;
    const rotorW = Math.cos(heli.rotorAngle) * 20;
    ref.group.setAttribute(
      "transform",
      `translate(${heli.x.toFixed(1)}, ${heli.y.toFixed(1)}) scale(${(heli.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    ref.rotor.setAttribute("x1", (-rotorW).toFixed(1));
    ref.rotor.setAttribute("x2", rotorW.toFixed(1));
  });

  // 8. Macy's Thanksgiving Parade Giant Balloons
  scene.paradeBalloons.forEach((balloon, i) => {
    balloon.x += balloon.speed * balloon.direction * dt;
    balloon.bobAngle += balloon.bobSpeed * dt;
    balloon.swayPhase += balloon.swaySpeed * dt;

    if (balloon.direction === 1 && balloon.x > width + 150) {
      balloon.x = -150;
    } else if (balloon.direction === -1 && balloon.x < -150) {
      balloon.x = width + 150;
    }

    const ref = refs.paradeBalloons[i];
    if (!ref?.group) return;

    const bobY = Math.sin(balloon.bobAngle) * 7;
    const pitchDeg = Math.cos(balloon.bobAngle) * 2.4;
    const breath = 1 + Math.sin(balloon.swayPhase * 0.8) * 0.015;
    const s = baseScale * balloon.scale * 1.18 * breath;

    ref.group.setAttribute(
      "transform",
      `translate(${balloon.x.toFixed(1)}, ${(balloon.baseY + bobY).toFixed(1)}) scale(${(balloon.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${pitchDeg.toFixed(2)})`,
    );

    if (ref.tailFan) {
      const fanDeg = Math.sin(balloon.swayPhase) * 2.8;
      ref.tailFan.setAttribute(
        "transform",
        `rotate(${fanDeg.toFixed(2)}, -16, -6)`,
      );
    }

    if (ref.tethers) {
      const anchors = SVG_PATHS.paradeBalloons[balloon.kind].anchors;
      const sway = Math.sin(balloon.swayPhase) * 7;
      const tetherCmds = anchors.map(([ax, ay], idx) => {
        const len = 44 + (idx % 2) * 8;
        const endX = ax - 10 - sway * (0.7 + idx * 0.15);
        const endY = ay + len;
        const ctrlX = ax - 3 + sway * 0.4;
        const ctrlY = ay + len * 0.55;
        return `M ${ax} ${ay} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      });
      ref.tethers.setAttribute("d", tetherCmds.join(" "));
    }
  });

  // 9. Santa's Sleigh & 3 Articulated Galloping Reindeer
  scene.santaSleighs.forEach((sleigh, i) => {
    sleigh.x += sleigh.speed * sleigh.direction * dt;
    sleigh.wavePhase += 0.012 * dt;
    sleigh.gallopPhase += 0.14 * dt;
    sleigh.waveArmPhase += 0.09 * dt;
    sleigh.noseGlowPhase += 0.08 * dt;

    const dir = sleigh.direction;
    const s = baseScale * sleigh.scale * 1.18;
    const spanPx = 225 * s;

    if (dir === 1 && sleigh.x - 80 * s > width + 60) {
      sleigh.x = -spanPx - 40;
    } else if (dir === -1 && sleigh.x + 80 * s < -60) {
      sleigh.x = width + spanPx + 40;
    }

    const ref = refs.santaSleighs[i];
    if (!ref?.sleighGroup) return;

    const waveAmp = 13;
    const waveFreq = 0.0075;
    const evalWave = (wx: number) => {
      const arg = wx * waveFreq + sleigh.wavePhase;
      const wy = sleigh.baseY + Math.sin(arg) * waveAmp;
      const dydx = Math.cos(arg) * waveAmp * waveFreq;
      const localDeg = deg(Math.atan(dydx * dir));
      return { wy, localDeg };
    };

    const sPos = evalWave(sleigh.x);
    ref.sleighGroup.setAttribute(
      "transform",
      `translate(${sleigh.x.toFixed(1)}, ${sPos.wy.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${sPos.localDeg})`,
    );

    if (ref.waveArm) {
      const armDeg = Math.sin(sleigh.waveArmPhase) * 18;
      ref.waveArm.setAttribute(
        "transform",
        `rotate(${armDeg.toFixed(1)}, 9, -18)`,
      );
    }

    const harnessPoints: Array<[number, number]> = [
      [sleigh.x + dir * 34 * s, sPos.wy - 11 * s],
    ];

    [0, 1, 2].forEach((rIdx) => {
      const rRef = ref.reindeerGroups[rIdx];
      if (!rRef?.group) return;
      const rx = sleigh.x + dir * (82 + rIdx * 54) * s;
      const rWave = evalWave(rx);
      const stride = sleigh.gallopPhase - rIdx * 0.95;
      const gallopLift = Math.sin(stride) * 2.5 * s;
      const ry = rWave.wy + gallopLift;
      const gallopPitch = rWave.localDeg + Math.cos(stride) * 4.5;

      rRef.group.setAttribute(
        "transform",
        `translate(${rx.toFixed(1)}, ${ry.toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${gallopPitch.toFixed(1)})`,
      );

      const legSwing = Math.sin(stride) * 24;
      const legSwingOpp = Math.sin(stride + 0.7) * 20;
      rRef.frontA?.setAttribute(
        "transform",
        `rotate(${legSwing.toFixed(1)}, 9, 0)`,
      );
      rRef.frontB?.setAttribute(
        "transform",
        `rotate(${(-legSwingOpp).toFixed(1)}, 7, 0)`,
      );
      rRef.hindA?.setAttribute(
        "transform",
        `rotate(${(-legSwing).toFixed(1)}, -12, -1)`,
      );
      rRef.hindB?.setAttribute(
        "transform",
        `rotate(${legSwingOpp.toFixed(1)}, -10, 0)`,
      );

      if (rRef.noseGlow) {
        const glowScale =
          0.9 + 0.25 * (0.5 + 0.5 * Math.sin(sleigh.noseGlowPhase));
        rRef.noseGlow.setAttribute(
          "transform",
          `translate(28.5, -17.5) scale(${glowScale.toFixed(2)})`,
        );
      }

      harnessPoints.push([rx + dir * 12 * s, ry - 9 * s]);
    });

    if (ref.reins && harnessPoints.length === 4) {
      const segs: string[] = [
        `M ${harnessPoints[0][0].toFixed(1)} ${harnessPoints[0][1].toFixed(1)}`,
      ];
      for (let k = 0; k < harnessPoints.length - 1; k++) {
        const [x1, y1] = harnessPoints[k];
        const [x2, y2] = harnessPoints[k + 1];
        const cx = (x1 + x2) * 0.5;
        const cy = (y1 + y2) * 0.5 + 6 * s;
        segs.push(
          `Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
        );
      }
      ref.reins.setAttribute("d", segs.join(" "));
    }

    if (ref.wake) {
      const tailX = sleigh.x - dir * 48 * s;
      const tailY = sPos.wy + 15 * s;
      const endX = tailX - dir * 95 * s;
      const endWave = evalWave(endX);
      const midX = (tailX + endX) * 0.5;
      const midWave = evalWave(midX);
      ref.wake.setAttribute(
        "d",
        `M ${tailX.toFixed(1)} ${tailY.toFixed(1)} Q ${midX.toFixed(1)} ${(midWave.wy + 18 * s).toFixed(1)} ${endX.toFixed(1)} ${(endWave.wy + 15 * s).toFixed(1)}`,
      );
      ref.wake.setAttribute(
        "stroke-dashoffset",
        (-((sleigh.gallopPhase * 0.06) % 1)).toFixed(3),
      );
    }
  });

  // 10. Halloween Witches
  scene.witches.forEach((witch, i) => {
    const s = baseScale * witch.scale;
    const r = DEFAULT_CONFIG.witchLoopRadius * s;
    const dir = witch.direction;

    if (
      !witch.isLooping &&
      witch.baseY - 2 * r > 0 &&
      Math.random() < DEFAULT_CONFIG.witchLoopChance * dt
    ) {
      witch.isLooping = true;
      witch.loopProgress = 0;
    }

    witch.bobAngle += 0.025 * dt;

    let loopBlend = 0;
    let loopVX = 0;
    let loopVY = 0;
    let offsetX = 0;
    let offsetY = 0;

    if (witch.isLooping) {
      const p = witch.loopProgress;
      const enter = smoothstep(p / DEFAULT_CONFIG.witchLoopRamp);
      const exit = smoothstep((Math.PI * 2 - p) / DEFAULT_CONFIG.witchLoopRamp);
      loopBlend = enter * exit;
      const speedFactor = 1 - 0.35 * Math.sin(p / 2) ** 2;
      const angularSpeed =
        (witch.speed / r) * speedFactor * (0.2 + 0.8 * loopBlend);
      witch.loopProgress += angularSpeed * dt;

      offsetX = Math.sin(p) * r * DEFAULT_CONFIG.witchLoopWidth * dir;
      offsetY = -(1 - Math.cos(p)) * r * DEFAULT_CONFIG.witchLoopHeight;
      loopVX =
        Math.cos(p) * r * DEFAULT_CONFIG.witchLoopWidth * angularSpeed * dir;
      loopVY =
        -Math.sin(p) * r * DEFAULT_CONFIG.witchLoopHeight * angularSpeed;

      if (witch.loopProgress >= Math.PI * 2) {
        witch.isLooping = false;
        witch.loopProgress = 0;
      }
    }

    const forwardSpeed =
      witch.speed * (1 - (1 - DEFAULT_CONFIG.witchLoopDrift) * loopBlend);
    const flightVX = forwardSpeed * dir;
    witch.baseX += flightVX * dt;

    const bobY = Math.sin(witch.bobAngle) * 5 * (1 - loopBlend);
    const bobVY = Math.cos(witch.bobAngle) * 5 * 0.025 * (1 - loopBlend);

    if (!witch.isLooping) {
      if (dir === 1 && witch.baseX > width + 100) witch.baseX = -100;
      if (dir === -1 && witch.baseX < -100) witch.baseX = width + 100;
    }

    const worldAngle = Math.atan2(loopVY + bobVY, flightVX + loopVX);
    const localAngle = Math.atan2(
      Math.sin(worldAngle),
      dir * Math.cos(worldAngle),
    );
    if (!witch.rotationInitialized) {
      witch.rotation = localAngle;
      witch.rotationInitialized = true;
    } else {
      witch.rotation = approachAngle(witch.rotation, localAngle, 0.14 * dt);
    }

    const el = refs.witches[i];
    if (!el) return;
    el.setAttribute(
      "transform",
      `translate(${(witch.baseX + offsetX).toFixed(1)}, ${(witch.baseY + offsetY + bobY).toFixed(1)}) scale(${(dir * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${deg(witch.rotation)})`,
    );
  });

  // 11A. Kai Wizard
  scene.dogWizards.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.bobAngle += dog.bobSpeed * dt;
    dog.broomAngle += dog.broomSpeed * dt;
    dog.capeAngle += dog.capeSpeed * dt;
    dog.hatAngle += dog.hatSpeed * dt;

    if (dog.direction === 1 && dog.x > width + 110) dog.x = -110;
    if (dog.direction === -1 && dog.x < -110) dog.x = width + 110;

    const ref = refs.dogWizards[i];
    if (!ref?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.bobAngle) * 4.5;
    const tilt = deg(Math.cos(dog.bobAngle) * 0.018);

    ref.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.y + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${tilt})`,
    );
    ref.broom?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.broomAngle) * 0.018)}, 160, 105)`,
    );
    ref.cape?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.capeAngle) * 0.06)}, 120, 45)`,
    );
    ref.hat?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.hatAngle) * 0.02)}, 65, -60)`,
    );
  });

  // 11B. Kai Pilgrim & Turkey-Tail Maple-Leaf Glider
  scene.pilgrimDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.bobAngle += dog.bobSpeed * dt;
    dog.featherPhase += dog.featherSpeed * dt;
    dog.hatAngle += dog.hatSpeed * dt;
    dog.leafAngle += dog.leafSpeed * dt;

    if (dog.direction === 1 && dog.x > width + 120) dog.x = -120;
    if (dog.direction === -1 && dog.x < -120) dog.x = width + 120;

    const ref = refs.pilgrimDogs[i];
    if (!ref?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.bobAngle) * 5.5;
    const bodyTilt = deg(Math.cos(dog.bobAngle) * 0.025);

    ref.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.y + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${bodyTilt})`,
    );
    ref.leaf?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.leafAngle) * 0.024)}, 165, 92)`,
    );
    ref.hat?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.hatAngle) * 0.028)}, 110, -56)`,
    );
    ref.feathers.forEach((fEl, fIdx) => {
      if (!fEl) return;
      const fanDeg = deg(Math.sin(dog.featherPhase - fIdx * 0.55) * 0.055);
      fEl.setAttribute("transform", `rotate(${fanDeg}, 30, 50)`);
    });
  });

  // 11C. Kai Santa-Paws Sky-Sled
  scene.santaDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.bobAngle += dog.bobSpeed * dt;
    dog.scarfPhase += dog.scarfSpeed * dt;
    dog.pomPhase += dog.pomSpeed * dt;
    dog.sledTiltPhase += 0.025 * dt;

    if (dog.direction === 1 && dog.x > width + 120) dog.x = -120;
    if (dog.direction === -1 && dog.x < -120) dog.x = width + 120;

    const ref = refs.santaDogs[i];
    if (!ref?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.bobAngle) * 5;
    const tilt = deg(Math.cos(dog.bobAngle) * 0.03);

    ref.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.y + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${tilt})`,
    );
    ref.sled?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.sledTiltPhase) * 0.016)}, 95, 165)`,
    );
    ref.scarfUpper?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.scarfPhase) * 0.075)}, 66, 24)`,
    );
    ref.scarfLower?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.scarfPhase - 0.8) * 0.09)}, 58, 34)`,
    );
    ref.hat?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.bobAngle * 0.85) * 0.022)}, 110, -56)`,
    );
    ref.pom?.setAttribute(
      "transform",
      `translate(0, ${(Math.sin(dog.pomPhase) * 5).toFixed(1)})`,
    );
  });

  // 11D. Kai Winter Snowboarder
  scene.winterDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.carvePhase += dog.carveSpeed * dt;
    dog.scarfPhase += dog.scarfSpeed * dt;
    dog.hatPhase += 0.03 * dt;

    if (dog.direction === 1 && dog.x > width + 130) dog.x = -130;
    if (dog.direction === -1 && dog.x < -130) dog.x = width + 130;

    const ref = refs.winterDogs[i];
    if (!ref?.group) return;
    const s = baseScale * dog.scale;
    const carveY = Math.sin(dog.carvePhase) * 14;
    const carveSlope = Math.cos(dog.carvePhase) * 14 * 0.012;
    const carveDeg = deg(Math.atan(carveSlope));
    const currentY = dog.baseY + carveY;

    ref.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${currentY.toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${carveDeg})`,
    );
    ref.scarf?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.scarfPhase) * 0.08)}, 64, 28)`,
    );
    ref.hat?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.hatPhase) * 0.02)}, 110, -56)`,
    );

    if (ref.wake) {
      const dir = dog.direction;
      const tailX = dog.x - dir * 115 * s;
      const tailY = currentY + 168 * s;
      const endX = tailX - dir * 88;
      const endY =
        dog.baseY + Math.sin(dog.carvePhase - 0.85) * 14 + 168 * s;
      const midX = (tailX + endX) * 0.5;
      const midY =
        dog.baseY + Math.sin(dog.carvePhase - 0.42) * 14 + 174 * s;
      ref.wake.setAttribute(
        "d",
        `M ${tailX.toFixed(1)} ${tailY.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      );
      ref.wake.setAttribute(
        "stroke-dashoffset",
        (-((dog.scarfPhase * 0.08) % 1)).toFixed(3),
      );
    }
  });

  // 12. Harbor Ice Floes
  scene.iceFloes.forEach((floe, i) => {
    floe.x += floe.speed * floe.direction * dt;
    floe.bobPhase += 0.022 * dt;
    if (floe.x > width + 60) floe.x = -60;
    const el = refs.iceFloes[i];
    if (!el) return;
    const s = baseScale * floe.scale * 0.9;
    const bob = Math.sin(floe.bobPhase) * 1.4;
    el.setAttribute(
      "transform",
      `translate(${floe.x.toFixed(1)}, ${(floe.y + bob).toFixed(1)}) scale(${s.toFixed(3)})`,
    );
  });

  // 13. Standard NYC Harbor Ships
  scene.ships.forEach((ship, i) => {
    ship.x += ship.speed * ship.direction * dt;
    if (ship.x > width + 90) ship.x = -90;
    if (ship.x < -90) ship.x = width + 90;
    const el = refs.ships[i];
    if (!el) return;
    const s = baseScale * 0.85;
    el.setAttribute(
      "transform",
      `translate(${ship.x.toFixed(1)}, ${ship.y.toFixed(1)}) scale(${(ship.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
  });

  // 13B. Orange Staten Island Ferry
  scene.statenIslandFerrys.forEach((ferry, i) => {
    ferry.x += ferry.speed * ferry.direction * dt;
    ferry.bobAngle += ferry.bobSpeed * dt;
    ferry.wakePhase = (ferry.wakePhase + 0.009 * dt) % 1;

    if (ferry.direction === 1 && ferry.x > width + 115) ferry.x = -115;
    if (ferry.direction === -1 && ferry.x < -115) ferry.x = width + 115;

    const ref = refs.statenIslandFerrys[i];
    if (!ref?.group) return;
    const s = baseScale * 0.98;
    const bobY = Math.sin(ferry.bobAngle) * 1.6;
    const rockDeg = deg(Math.cos(ferry.bobAngle) * 0.015);

    ref.group.setAttribute(
      "transform",
      `translate(${ferry.x.toFixed(1)}, ${(ferry.y + bobY).toFixed(1)}) scale(${(ferry.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${rockDeg})`,
    );
    ref.wake?.setAttribute("stroke-dashoffset", (-ferry.wakePhase).toFixed(3));
  });

  // 14A. Charon's Ferry
  scene.charonFerrys.forEach((ship, i) => {
    ship.x += ship.speed * ship.direction * dt;
    ship.bobAngle += ship.bobSpeed * dt;
    ship.paddleAngle += ship.paddleSpeed * dt;

    if (ship.direction === 1 && ship.x > width + 100) ship.x = -100;
    if (ship.direction === -1 && ship.x < -100) ship.x = width + 100;

    const ref = refs.charonFerrys[i];
    if (!ref?.group) return;
    const s = baseScale * 0.85;
    const bobY = Math.sin(ship.bobAngle) * 2;
    const rockDeg = deg(Math.cos(ship.bobAngle) * 0.025);
    const dirScale = -ship.direction;

    ref.group.setAttribute(
      "transform",
      `translate(${ship.x.toFixed(1)}, ${(ship.y + bobY).toFixed(1)}) scale(${(dirScale * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${rockDeg})`,
    );

    const stroke = Math.sin(ship.paddleAngle);
    const oarAngle = 0.84 + stroke * 0.2;
    const gripX = 6 + stroke * 1.2;
    const gripY = -24 + Math.cos(ship.paddleAngle) * 0.7;
    const hand2X = gripX + Math.cos(oarAngle) * 12.5;
    const hand2Y = gripY + Math.sin(oarAngle) * 12.5;

    ref.oar?.setAttribute(
      "transform",
      `translate(${gripX.toFixed(1)}, ${gripY.toFixed(1)}) rotate(${deg(oarAngle)})`,
    );
    ref.arms?.setAttribute(
      "d",
      `M 4 -31 L 1 -25 L ${gripX.toFixed(1)} ${gripY.toFixed(1)} ` +
        `M 12 -31 L 15 -23 L ${hand2X.toFixed(1)} ${hand2Y.toFixed(1)}`,
    );
  });

  // 14B. Hudson Harvest Steamboat
  scene.harvestBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += boat.bobSpeed * dt;
    boat.wheelAngle += 2.2 * dt;
    boat.steamPhase = (boat.steamPhase + 0.008 * dt) % 1;

    if (boat.direction === 1 && boat.x > width + 110) boat.x = -110;
    if (boat.direction === -1 && boat.x < -110) boat.x = width + 110;

    const ref = refs.harvestBoats[i];
    if (!ref?.group) return;
    const s = baseScale * 0.96;
    const bobY = Math.sin(boat.bobAngle) * 1.8;
    const rockDeg = deg(Math.cos(boat.bobAngle) * 0.02);

    ref.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${rockDeg})`,
    );
    ref.wheel?.setAttribute(
      "transform",
      `rotate(${boat.wheelAngle.toFixed(1)}, -40, 2)`,
    );
    ref.stackSteam?.setAttribute(
      "stroke-dashoffset",
      (-boat.steamPhase).toFixed(3),
    );
    ref.pieSteam?.setAttribute(
      "stroke-dashoffset",
      (-((boat.steamPhase + 0.45) % 1)).toFixed(3),
    );
  });

  // 14C. Rockefeller Spruce Tugboat & Barge
  scene.holidayTreeBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += boat.bobSpeed * dt;
    boat.starPhase += 0.06 * dt;

    if (boat.direction === 1 && boat.x > width + 130) boat.x = -130;
    if (boat.direction === -1 && boat.x < -130) boat.x = width + 130;

    const ref = refs.holidayTreeBoats[i];
    if (!ref?.group) return;
    const s = baseScale * 0.96;
    const bobY = Math.sin(boat.bobAngle) * 1.8;
    const rockDeg = deg(Math.cos(boat.bobAngle) * 0.018);

    ref.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${rockDeg})`,
    );

    if (ref.star) {
      const pulse = 0.88 + 0.24 * (0.5 + 0.5 * Math.sin(boat.starPhase));
      ref.star.setAttribute(
        "transform",
        `translate(-49, -54) scale(${pulse.toFixed(2)}) translate(49, 54)`,
      );
    }
    ref.steam?.setAttribute(
      "stroke-dashoffset",
      (-((boat.starPhase * 0.12) % 1)).toFixed(3),
    );
  });

  // 14D. Winter Harbor Rink Barge & Hot-Cocoa Tug
  scene.winterHarborBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += boat.bobSpeed * dt;
    boat.actionPhase += boat.actionSpeed * dt;

    if (boat.direction === 1 && boat.x > width + 120) boat.x = -120;
    if (boat.direction === -1 && boat.x < -120) boat.x = width + 120;

    const ref = refs.winterHarborBoats[i];
    if (!ref?.group) return;
    const s = baseScale * 0.98;
    const bobY = Math.sin(boat.bobAngle) * 1.6;
    const rockDeg = deg(Math.cos(boat.bobAngle) * 0.018);

    ref.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${rockDeg})`,
    );

    if (boat.kind === "rinkBarge" && ref.skater) {
      const skateX = Math.sin(boat.actionPhase) * 24;
      const skateDir = Math.cos(boat.actionPhase) >= 0 ? 1 : -1;
      const lean = Math.sin(boat.actionPhase) * -8;
      ref.skater.setAttribute(
        "transform",
        `translate(${skateX.toFixed(1)}, -2) scale(${skateDir}, 1) rotate(${lean.toFixed(1)}, 0, -2)`,
      );
    } else {
      const dash = (boat.actionPhase * 0.22) % 1;
      ref.steam1?.setAttribute("stroke-dashoffset", (-dash).toFixed(3));
      ref.steam2?.setAttribute(
        "stroke-dashoffset",
        (-((dash + 0.5) % 1)).toFixed(3),
      );
    }
  });

  // 15. Tumbling Autumn Leaves
  scene.autumnLeaves.forEach((leaf, i) => {
    leaf.swayPhase += leaf.swaySpeed * dt;
    leaf.spinAngle += leaf.spinSpeed * dt;
    leaf.tumblePhase += leaf.tumbleSpeed * dt;

    leaf.x += (leaf.vx + Math.sin(leaf.swayPhase) * 0.32) * dt;
    leaf.y += (leaf.vy + Math.cos(leaf.swayPhase) * 0.14) * dt;

    if (leaf.x > width + 40) leaf.x = -40;
    if (leaf.y > height + 30) {
      leaf.y = -25;
      leaf.x = Math.random() * width;
    }

    const ref = refs.autumnLeaves[i];
    if (!ref?.group || !ref.inner) return;
    const s = baseScale * leaf.scale * 0.95;
    const rawCos = Math.cos(leaf.tumblePhase);
    const flipSign = rawCos >= 0 ? 1 : -1;
    const foreshorten = flipSign * Math.max(0.38, Math.abs(rawCos));

    ref.group.setAttribute(
      "transform",
      `translate(${leaf.x.toFixed(1)}, ${leaf.y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${deg(leaf.spinAngle)})`,
    );
    ref.inner.setAttribute("transform", `scale(${foreshorten.toFixed(2)}, 1)`);
  });

  // 16. 6-Fold Crystalline Snowflakes
  scene.snowflakes.forEach((flake, i) => {
    flake.swayPhase += flake.swaySpeed * dt;
    flake.rotation = (flake.rotation + flake.rotationSpeed * dt) % 360;
    flake.x += (flake.vx + Math.sin(flake.swayPhase) * 0.24) * dt;
    flake.y += flake.vy * dt;

    if (flake.x > width + 30) flake.x = -30;
    if (flake.x < -30) flake.x = width + 30;
    if (flake.y > height + 30) {
      flake.y = -24;
      flake.x = Math.random() * width;
    }

    const el = refs.snowflakes[i];
    if (!el) return;
    const s = baseScale * flake.scale * 1.05;
    el.setAttribute(
      "transform",
      `translate(${flake.x.toFixed(1)}, ${flake.y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${flake.rotation.toFixed(1)})`,
    );
  });

  // 17. Spring, Summer & Festival Themes (St. Patrick's, Easter, Summer, July 4th, Diwali)
  updateSpringSummerDom(scene, refs.springSummer, dt, width, height, baseScale);

  // 18. Skyline-Anchored City Landmarks & Drone Show
  updateCityDetailsDom(scene, refs.cityDetails, dt, width, height, baseScale);
}
