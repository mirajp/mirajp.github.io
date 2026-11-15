import type { CSSProperties } from "react";
import { SVG_PATHS } from "./paths";
import { SHAPED_FIREWORK_SHELLS } from "./pathsCityDetails";
import type { SceneState } from "./state";
import { strokePx } from "./utils";

export interface SpringSummerDomRefs {
  // St. Patrick's
  skyRainbows: Array<{
    group: SVGGElement | null;
    arc1: SVGPathElement | null;
    coins: SVGGElement | null;
  }>;
  leprechaunDogs: Array<{
    group: SVGGElement | null;
    hat: SVGGElement | null;
    coins: SVGGElement | null;
    rainbowMid: SVGPathElement | null;
  }>;
  shamrockClovers: Array<SVGGElement | null>;
  emeraldBoats: Array<{
    group: SVGGElement | null;
    wake: SVGPathElement | null;
  }>;

  // Easter
  eggBalloons: Array<SVGGElement | null>;
  easterDogs: Array<{
    group: SVGGElement | null;
    earBack: SVGGElement | null;
    earFront: SVGGElement | null;
    ribbons: SVGGElement | null;
  }>;
  swallows: Array<{
    group: SVGGElement | null;
    wings: SVGPathElement | null;
  }>;
  blossomPetals: Array<SVGGElement | null>;
  springBoats: Array<{
    group: SVGGElement | null;
    tulips: SVGGElement | null;
  }>;

  // Summer
  summerSuns: Array<{
    group: SVGGElement | null;
    rays: SVGGElement | null;
  }>;
  bannerPlanes: Array<{
    group: SVGGElement | null;
    prop: SVGLineElement | null;
    banner: SVGPathElement | null;
    bannerWave: SVGPathElement | null;
  }>;
  summerDogs: Array<{
    group: SVGGElement | null;
    bandana: SVGGElement | null;
    wake: SVGPathElement | null;
  }>;
  summerBoats: Array<{
    group: SVGGElement | null;
    umbrella: SVGGElement | null;
    kite1Group: SVGGElement | null;
    kite1String: SVGPathElement | null;
    kite1Tail: SVGPathElement | null;
    kite2Group: SVGGElement | null;
    kite2String: SVGPathElement | null;
    kite2Tail: SVGPathElement | null;
  }>;

  // July 4th (& Diwali fireworks)
  fireworks: Array<{
    group: SVGGElement | null;
    rocket: SVGLineElement | null;
    burstGroup: SVGGElement | null;
    rays: SVGPathElement | null;
  }>;
  patriotDogs: Array<{
    group: SVGGElement | null;
    neckerchief: SVGGElement | null;
    sparkler: SVGGElement | null;
  }>;
  fireboats: Array<{
    group: SVGGElement | null;
    arch1: SVGPathElement | null;
    arch2: SVGPathElement | null;
    arch3: SVGPathElement | null;
  }>;

  // Diwali
  skyLanterns: Array<{
    group: SVGGElement | null;
    flame: SVGGElement | null;
  }>;
  diwaliDogs: Array<{
    group: SVGGElement | null;
    plume: SVGGElement | null;
    carpet: SVGPathElement | null;
    tassels: SVGPathElement | null;
  }>;
  rangoliStars: Array<SVGGElement | null>;
  diwaliBoats: Array<{
    group: SVGGElement | null;
    flames: SVGGElement | null;
  }>;
}

export function createEmptySpringSummerRefs(): SpringSummerDomRefs {
  return {
    skyRainbows: [],
    leprechaunDogs: [],
    shamrockClovers: [],
    emeraldBoats: [],
    eggBalloons: [],
    easterDogs: [],
    swallows: [],
    blossomPetals: [],
    springBoats: [],
    summerSuns: [],
    bannerPlanes: [],
    summerDogs: [],
    summerBoats: [],
    fireworks: [],
    patriotDogs: [],
    fireboats: [],
    skyLanterns: [],
    diwaliDogs: [],
    rangoliStars: [],
    diwaliBoats: [],
  };
}

const drawDelay = (index: number, stepMs = 45): CSSProperties =>
  ({ "--draw-delay": `${Math.min(520, index * stepMs)}ms` }) as CSSProperties;

const deg = (rad: number) => +((rad * 180) / Math.PI).toFixed(2);

function buildFireworkBurstRays(rayCount: number): string[] {
  const rays: string[] = [];
  for (let i = 0; i < rayCount; i++) {
    const angle = (i * Math.PI * 2) / rayCount;
    const len = i % 2 === 0 ? 48 : 34;
    const x1 = +(Math.cos(angle) * 3.5).toFixed(2);
    const y1 = +(Math.sin(angle) * 3.5).toFixed(2);
    const xm = +(Math.cos(angle) * (len * 0.6)).toFixed(2);
    const ym = +(Math.sin(angle) * (len * 0.6) - 2.5).toFixed(2);
    const x2 = +(Math.cos(angle) * len).toFixed(2);
    const y2 = +(Math.sin(angle) * len + 7.5).toFixed(2);
    rays.push(`M ${x1} ${y1} Q ${xm} ${ym} ${x2} ${y2}`);
  }
  return rays;
}

const FIREWORK_RAYS_12 = buildFireworkBurstRays(12);
const FIREWORK_RAYS_16 = buildFireworkBurstRays(16);

function renderKaiBody(swMain: number, mask: string) {
  return (
    <>
      <path d={SVG_PATHS.kaiDog.tail} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.legs} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.belly} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.chest} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.body} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.ear} fill={mask} strokeWidth={swMain} />
    </>
  );
}

function renderKaiHandsFace(swMain: number, mask: string) {
  return (
    <>
      <path d={SVG_PATHS.kaiDog.hands} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.nose} fill={mask} strokeWidth={swMain} />
      <path d={SVG_PATHS.kaiDog.face} strokeWidth={swMain} />
    </>
  );
}

export function renderSpringSummerSvgElements(
  scene: SceneState,
  refs: SpringSummerDomRefs,
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

  return (
    <>
      {/* ================================================================== */}
      {/* ST. PATRICK'S DAY                                                  */}
      {/* ================================================================== */}
      {scene.skyRainbows.map((rb, i) => {
        const slot = (refs.skyRainbows[i] ??= {
          group: null,
          arc1: null,
          coins: null,
        });
        const s = baseScale * rb.scale * 1.15;
        const sw = strokePx(1.05, s);
        return (
          <g
            key={`rainbow-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="sky-rainbow"
          >
            <path
              ref={(el) => {
                slot.arc1 = el;
              }}
              d={SVG_PATHS.stPatricks.skyRainbow.arc1}
              stroke={colors.primary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(0, 60)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.stPatricks.skyRainbow.arc2}
              stroke={colors.gold}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(2, 60)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.stPatricks.skyRainbow.arc3}
              stroke={colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(4, 60)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.stPatricks.skyRainbow.potOfGold}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(5, 60)}
              strokeWidth={strokePx(1.15, s)}
            />
            <g
              ref={(el) => {
                slot.coins = el;
              }}
            >
              <path
                d={SVG_PATHS.stPatricks.skyRainbow.coins}
                stroke={colors.gold}
                strokeWidth={sw}
              />
            </g>
          </g>
        );
      })}

      {scene.leprechaunDogs.map((dog, i) => {
        const slot = (refs.leprechaunDogs[i] ??= {
          group: null,
          hat: null,
          coins: null,
          rainbowMid: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        const gear = SVG_PATHS.stPatricks.leprechaunDogGear;
        return (
          <g
            key={`lep-dog-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-st-patricks"
          >
            {/* Rainbow glider arcs + Pot of Gold at front prow */}
            <path
              d={gear.rainbowOuter}
              stroke={colors.primary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(1, 50)}
              strokeWidth={swMain}
            />
            <path
              ref={(el) => {
                slot.rainbowMid = el;
              }}
              d={gear.rainbowMid}
              stroke={colors.gold}
              pathLength={1}
              strokeDasharray="0.58 0.42"
              strokeWidth={swMain}
            />
            <path
              d={gear.rainbowInner}
              stroke={colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(2, 50)}
              strokeWidth={swFine}
            />
            <path
              d={gear.potCauldron}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(3, 50)}
              strokeWidth={swMain}
            />
            <g
              ref={(el) => {
                slot.coins = el;
              }}
            >
              <path d={gear.potCoins} stroke={colors.gold} strokeWidth={swFine} />
            </g>

            {renderKaiBody(swMain, paperMaskFill)}
            <path d={SVG_PATHS.kaiDog.collar} strokeWidth={swMain} />
            <path
              d={gear.bowtie}
              fill={colors.primary}
              fillOpacity={0.22}
              stroke={colors.primary}
              strokeWidth={swMain}
            />
            {renderKaiHandsFace(swMain, paperMaskFill)}

            <g
              ref={(el) => {
                slot.hat = el;
              }}
            >
              <path
                d={gear.hatCrown}
                fill={colors.primary}
                fillOpacity={0.22}
                stroke={colors.primary}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(4, 50)}
                strokeWidth={swMain}
              />
              <path
                d={gear.hatBrimAndBand}
                fill={paperMaskFill}
                strokeWidth={swMain}
              />
              <path
                d={gear.hatBuckle}
                stroke={colors.gold}
                strokeWidth={swFine}
              />
              <path
                d={gear.hatShamrock}
                fill={colors.primary}
                fillOpacity={0.25}
                stroke={colors.primary}
                strokeWidth={swFine}
              />
            </g>
          </g>
        );
      })}

      {scene.emeraldBoats.map((_, i) => {
        const slot = (refs.emeraldBoats[i] ??= { group: null, wake: null });
        const s = baseScale * 0.95;
        const sw = strokePx(1.1, s);
        return (
          <g
            key={`emerald-boat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="emerald-ferry"
          >
            <path
              ref={(el) => {
                slot.wake = el;
              }}
              d={SVG_PATHS.stPatricks.emeraldBoat.emeraldWake}
              pathLength={1}
              strokeDasharray="0.48 0.52"
              stroke={colors.primary}
              strokeWidth={strokePx(0.95, s)}
            />
            <path
              d={SVG_PATHS.stPatricks.emeraldBoat.hull}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 55)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.stPatricks.emeraldBoat.buntingAndShamrock}
              stroke={colors.primary}
              strokeWidth={strokePx(0.85, s)}
            />
            {isDark && (
              <g data-entity="boat-night-lights">
                <path
                  d="M -18 -6 L -12 -6 M -5 -6 L 1 -6 M 8 -6 L 14 -6 M -10 -17.5 L 8 -17.5"
                  stroke="#fde68a"
                  strokeWidth={strokePx(1.85, s)}
                  opacity={0.92}
                />
                <path
                  d="M -30 12.5 L 32 12.5"
                  stroke="#fbbf24"
                  strokeWidth={strokePx(0.95, s)}
                  opacity={0.42}
                />
                <circle cx={38} cy={-1} r={1.25} fill="#4ade80" stroke="none" />
                <circle cx={-36} cy={-1} r={1.2} fill="#f87171" stroke="none" />
                <circle cx={0} cy={-40} r={1.45} fill="#4ade80" stroke="none" />
              </g>
            )}
          </g>
        );
      })}

      {scene.shamrockClovers.map((clover, i) => {
        const s = baseScale * clover.scale * 0.95;
        return (
          <g
            key={`clover-${i}`}
            ref={(el) => {
              refs.shamrockClovers[i] = el;
            }}
            data-entity={clover.fourLeaf ? "four-leaf-clover" : "shamrock"}
          >
            <path
              d={
                clover.fourLeaf
                  ? SVG_PATHS.stPatricks.shamrock4
                  : SVG_PATHS.stPatricks.shamrock3
              }
              fill={paperMaskFill}
              fillOpacity={0.45}
              stroke={clover.fourLeaf ? colors.gold : colors.primary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 25)}
              strokeWidth={strokePx(0.95, s)}
            />
          </g>
        );
      })}

      {/* ================================================================== */}
      {/* EASTER                                                             */}
      {/* ================================================================== */}
      {scene.eggBalloons.map((egg, i) => {
        const s = baseScale * egg.scale * 1.08;
        const swMain = strokePx(1.15, s);
        const swFine = strokePx(0.82, s);
        const patColor =
          egg.variant === 0
            ? colors.accent
            : egg.variant === 1
              ? colors.primary
              : colors.gold;
        return (
          <g
            key={`egg-balloon-${i}`}
            ref={(el) => {
              refs.eggBalloons[i] = el;
            }}
            data-entity="easter-egg-balloon"
          >
            <path
              d={SVG_PATHS.easter.eggBalloon.basketAndRigging}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2 + 1, 55)}
              strokeWidth={swFine}
            />
            <path
              d={SVG_PATHS.easter.eggBalloon.envelope}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 55)}
              strokeWidth={swMain}
            />
            <path
              d={SVG_PATHS.easter.eggBalloon.patterns[egg.variant]}
              stroke={patColor}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2 + 2, 55)}
              strokeWidth={swFine}
            />
          </g>
        );
      })}

      {scene.swallows.map((swallow, i) => {
        const slot = (refs.swallows[i] ??= { group: null, wings: null });
        const s = baseScale * swallow.scale * 1.1;
        const sw = strokePx(1.05, s);
        return (
          <g
            key={`swallow-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="spring-swallow"
          >
            <path
              d="M -14 -3 L -4 0 L -15 4 M -4 0 C 0 -2 6 -2 11 0 L 14 0 L 11 2 C 6 3 0 2 -4 0 Z"
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 35)}
              strokeWidth={sw}
            />
            <path
              ref={(el) => {
                slot.wings = el;
              }}
              d="M 3 -1 Q 0 -11 -9 -14 M 4 1 Q 1 9 -7 12"
              strokeWidth={sw}
            />
          </g>
        );
      })}

      {scene.easterDogs.map((dog, i) => {
        const slot = (refs.easterDogs[i] ??= {
          group: null,
          earBack: null,
          earFront: null,
          ribbons: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        const gear = SVG_PATHS.easter.easterDogGear;
        return (
          <g
            key={`easter-dog-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-easter"
          >
            {/* Decorated Easter eggs + woven wicker basket glider */}
            <path
              d={gear.basketEggs}
              fill={paperMaskFill}
              stroke={colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(2, 50)}
              strokeWidth={swFine}
            />
            <path
              d={gear.basketHull}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(1, 50)}
              strokeWidth={swMain}
            />
            <path
              d={gear.basketWeave}
              stroke={colors.gold}
              strokeWidth={swFine}
            />

            {renderKaiBody(swMain, paperMaskFill)}
            <path d={SVG_PATHS.kaiDog.collar} strokeWidth={swMain} />
            {renderKaiHandsFace(swMain, paperMaskFill)}

            {/* Fifth-Avenue Bonnet + Articulated Bunny Ears */}
            <g
              ref={(el) => {
                slot.ribbons = el;
              }}
            >
              <path
                d={gear.bonnetRibbons}
                stroke={colors.accent}
                strokeWidth={swMain}
              />
            </g>
            <g
              ref={(el) => {
                slot.earBack = el;
              }}
            >
              <path
                d={gear.earBack}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(3, 50)}
                strokeWidth={swMain}
              />
            </g>
            <g
              ref={(el) => {
                slot.earFront = el;
              }}
            >
              <path
                d={gear.earFront}
                fill={paperMaskFill}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(4, 50)}
                strokeWidth={swMain}
              />
            </g>
            <path
              d={gear.bonnetBrim}
              fill={paperMaskFill}
              strokeWidth={swMain}
            />
            <path
              d={gear.bonnetFlowers}
              fill={colors.accent}
              fillOpacity={0.22}
              stroke={colors.accent}
              strokeWidth={swFine}
            />
          </g>
        );
      })}

      {scene.springBoats.map((_, i) => {
        const slot = (refs.springBoats[i] ??= { group: null, tulips: null });
        const s = baseScale * 0.95;
        return (
          <g
            key={`spring-boat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="spring-tulip-boat"
          >
            <path
              d={SVG_PATHS.easter.springBoat.hull}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 55)}
              strokeWidth={strokePx(1.1, s)}
            />
            <g
              ref={(el) => {
                slot.tulips = el;
              }}
            >
              <path
                d={SVG_PATHS.easter.springBoat.tulips}
                stroke={colors.accent}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(i * 2 + 1, 55)}
                strokeWidth={strokePx(0.95, s)}
              />
            </g>
            {isDark && (
              <g data-entity="boat-night-lights">
                <path
                  d="M -22 -3 L -16 -3 M -8 -3 L -2 -3"
                  stroke="#fde68a"
                  strokeWidth={strokePx(1.85, s)}
                  opacity={0.92}
                />
                <path
                  d="M -28 12.5 L 32 12.5"
                  stroke="#fbbf24"
                  strokeWidth={strokePx(0.95, s)}
                  opacity={0.4}
                />
                <circle cx={39} cy={1} r={1.25} fill="#4ade80" stroke="none" />
                <circle cx={-36} cy={1} r={1.2} fill="#f87171" stroke="none" />
                <circle cx={2} cy={-10} r={1.3} fill="#fef08a" stroke="none" />
              </g>
            )}
          </g>
        );
      })}

      {scene.blossomPetals.map((petal, i) => {
        const s = baseScale * petal.scale * 0.95;
        return (
          <g
            key={`petal-${i}`}
            ref={(el) => {
              refs.blossomPetals[i] = el;
            }}
            data-entity="cherry-blossom"
          >
            <path
              d={
                petal.fullFlower
                  ? SVG_PATHS.easter.blossomFlower
                  : SVG_PATHS.easter.blossomPetal
              }
              fill={paperMaskFill}
              fillOpacity={0.55}
              stroke={i % 2 === 0 ? colors.accent : colors.primary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 22)}
              strokeWidth={strokePx(0.9, s)}
            />
          </g>
        );
      })}

      {/* ================================================================== */}
      {/* SUMMER                                                             */}
      {/* ================================================================== */}
      {scene.summerSuns.map((sun, i) => {
        const slot = (refs.summerSuns[i] ??= { group: null, rays: null });
        const s = baseScale * sun.scale * 1.25;
        return (
          <g
            key={`sun-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="summer-compass-sun"
          >
            <g
              ref={(el) => {
                slot.rays = el;
              }}
            >
              <path
                d={SVG_PATHS.summer.sunRays}
                stroke={colors.gold}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(2, 60)}
                strokeWidth={strokePx(0.92, s)}
              />
            </g>
            <path
              d={SVG_PATHS.summer.sunInnerRing}
              stroke={colors.gold}
              strokeDasharray="3 3"
              strokeWidth={strokePx(0.85, s)}
            />
            <path
              d={SVG_PATHS.summer.sunCore}
              fill={paperMaskFill}
              stroke={colors.gold}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(0, 60)}
              strokeWidth={strokePx(1.2, s)}
            />
          </g>
        );
      })}

      {scene.bannerPlanes.map((plane, i) => {
        const slot = (refs.bannerPlanes[i] ??= {
          group: null,
          prop: null,
          banner: null,
          bannerWave: null,
        });
        const s = baseScale * plane.scale * 1.15;
        const sw = strokePx(1.1, s);
        const swFine = strokePx(0.82, s);
        return (
          <g
            key={`plane-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="summer-banner-biplane"
          >
            {/* Tow rope + undulating fabric sky-banner */}
            <path
              ref={(el) => {
                slot.banner = el;
              }}
              d="M -28 1 L -48 2 M -48 -9 L -138 -9 L -132 2 L -138 13 L -48 13 Z"
              fill={paperMaskFill}
              strokeWidth={swFine}
            />
            <path
              ref={(el) => {
                slot.bannerWave = el;
              }}
              d="M -58 2 Q -78 -3 -96 2 Q -114 7 -126 2"
              stroke={colors.accent}
              strokeWidth={swFine}
            />
            <path
              d={SVG_PATHS.summer.biplane.body}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(1, 55)}
              strokeWidth={sw}
            />
            <line
              ref={(el) => {
                slot.prop = el;
              }}
              x1={30}
              y1={-9}
              x2={30}
              y2={14}
              strokeWidth={sw}
            />
          </g>
        );
      })}

      {scene.summerDogs.map((dog, i) => {
        const slot = (refs.summerDogs[i] ??= {
          group: null,
          bandana: null,
          wake: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        const gear = SVG_PATHS.summer.summerDogGear;
        return (
          <g key={`summer-dog-wrap-${i}`} data-entity="kai-summer">
            <path
              ref={(el) => {
                slot.wake = el;
              }}
              d="M 0 0 L -80 0"
              pathLength={1}
              strokeDasharray="0.5 0.5"
              stroke={colors.primary}
              strokeWidth={1.05}
            />
            <g
              ref={(el) => {
                slot.group = el;
              }}
            >
              <path
                d={gear.surfboard}
                fill={paperMaskFill}
                stroke={colors.primary}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(1, 55)}
                strokeWidth={swMain}
              />
              <path
                d={gear.waterWave}
                stroke={colors.primary}
                strokeWidth={swFine}
              />
              {renderKaiBody(swMain, paperMaskFill)}
              <g
                ref={(el) => {
                  slot.bandana = el;
                }}
              >
                <path
                  d={gear.bandana}
                  fill={colors.accent}
                  fillOpacity={0.2}
                  stroke={colors.accent}
                  strokeWidth={swMain}
                />
              </g>
              {renderKaiHandsFace(swMain, paperMaskFill)}
              {/* Aviator sunglasses + backwards summer sun-cap */}
              <path
                d={gear.aviators}
                fill={paperMaskFill}
                strokeWidth={swFine}
              />
              <path
                d={gear.sunCap}
                fill={colors.gold}
                fillOpacity={0.22}
                stroke={colors.gold}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(3, 55)}
                strokeWidth={swMain}
              />
            </g>
          </g>
        );
      })}

      {scene.summerBoats.map((boat, i) => {
        const slot = (refs.summerBoats[i] ??= {
          group: null,
          umbrella: null,
          kite1Group: null,
          kite1String: null,
          kite1Tail: null,
          kite2Group: null,
          kite2String: null,
          kite2Tail: null,
        });
        const s = baseScale * 0.98;
        const sw = strokePx(1.1, s);
        const swFine = strokePx(0.85, s);
        const kiteColor1 =
          i % 3 === 0 ? colors.accent : i % 3 === 1 ? colors.gold : colors.primary;
        const kiteColor2 = colors.primary;
        return (
          <g
            key={`summer-boat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="summer-kite-barge"
          >
            {/* Kite strings (behind kites, anchored to deck flyers' raised hands) */}
            <path
              ref={(el) => {
                slot.kite1String = el;
              }}
              d="M -19 -21 Q -42 -62 -76 -110"
              strokeWidth={strokePx(0.75, s)}
              opacity={0.85}
            />
            {boat.twinKites && (
              <path
                ref={(el) => {
                  slot.kite2String = el;
                }}
                d="M -39 -19 Q -68 -50 -106 -86"
                strokeWidth={strokePx(0.72, s)}
                opacity={0.82}
              />
            )}

            {/* Primary diamond kite + fluttering ribbon tail */}
            <g
              ref={(el) => {
                slot.kite1Group = el;
              }}
              transform="translate(-76, -112) rotate(-22)"
            >
              <path
                ref={(el) => {
                  slot.kite1Tail = el;
                }}
                d={SVG_PATHS.summer.summerBoat.kiteTailStatic}
                stroke={kiteColor1}
                strokeWidth={swFine}
              />
              <path
                d={SVG_PATHS.summer.summerBoat.diamondKite}
                fill={paperMaskFill}
                stroke={kiteColor1}
                pathLength={1}
                className="nyc-ink-path"
                style={drawDelay(i * 2 + 1, 55)}
                strokeWidth={sw}
              />
            </g>

            {/* Optional second kite flown by stern companion */}
            {boat.twinKites && (
              <g
                ref={(el) => {
                  slot.kite2Group = el;
                }}
                transform="translate(-106, -88) scale(0.86) rotate(-26)"
              >
                <path
                  ref={(el) => {
                    slot.kite2Tail = el;
                  }}
                  d={SVG_PATHS.summer.summerBoat.kiteTailStatic}
                  stroke={kiteColor2}
                  strokeWidth={swFine}
                />
                <path
                  d={SVG_PATHS.summer.summerBoat.diamondKite}
                  fill={paperMaskFill}
                  stroke={kiteColor2}
                  pathLength={1}
                  className="nyc-ink-path"
                  style={drawDelay(i * 2 + 2, 55)}
                  strokeWidth={sw}
                />
              </g>
            )}

            {/* People on barge deck holding kite strings */}
            <path
              d={SVG_PATHS.summer.summerBoat.kiteFlyerPrimary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 45)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.summer.summerBoat.kiteFlyerSecondary}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2 + 1, 45)}
              strokeWidth={sw}
            />

            {/* Barge hull, ice-cream cabin & beach umbrella */}
            <path
              d={SVG_PATHS.summer.summerBoat.hull}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 55)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.summer.summerBoat.iceCreamCone}
              fill={paperMaskFill}
              stroke={colors.gold}
              strokeWidth={swFine}
            />
            <path d={SVG_PATHS.summer.summerBoat.umbrellaPole} strokeWidth={swFine} />
            <g
              ref={(el) => {
                slot.umbrella = el;
              }}
            >
              <path
                d={SVG_PATHS.summer.summerBoat.umbrellaCanopy}
                fill={colors.accent}
                fillOpacity={0.2}
                stroke={colors.accent}
                strokeWidth={swFine}
              />
            </g>
            {isDark && (
              <g data-entity="boat-night-lights">
                <path
                  d="M 15 -3 L 21 -3 M 27 -3 L 33 -3"
                  stroke="#fde68a"
                  strokeWidth={strokePx(1.9, s)}
                  opacity={0.92}
                />
                <path
                  d="M -38 12.5 L 40 12.5"
                  stroke="#fbbf24"
                  strokeWidth={strokePx(0.95, s)}
                  opacity={0.42}
                />
                <circle cx={48} cy={1} r={1.25} fill="#4ade80" stroke="none" />
                <circle cx={-45} cy={1} r={1.2} fill="#f87171" stroke="none" />
                <circle cx={24} cy={-10} r={1.3} fill="#fef08a" stroke="none" />
              </g>
            )}
          </g>
        );
      })}

      {/* ================================================================== */}
      {/* JULY 4TH (& DIWALI AERIAL SPARKLES)                                */}
      {/* ================================================================== */}
      {scene.fireworks.map((fw, i) => {
        const slot = (refs.fireworks[i] ??= {
          group: null,
          rocket: null,
          burstGroup: null,
          rays: null,
        });
        const s = baseScale * fw.scale * 1.25;
        const strokeCol =
          fw.colorKind === "accent"
            ? colors.accent
            : fw.colorKind === "gold"
              ? colors.gold
              : colors.primary;
        return (
          <g
            key={`fw-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="aerial-firework"
          >
            <line
              ref={(el) => {
                slot.rocket = el;
              }}
              x1={0}
              y1={95}
              x2={0}
              y2={65}
              stroke={strokeCol}
              strokeWidth={strokePx(1.05, s)}
            />
            <g
              ref={(el) => {
                slot.burstGroup = el;
              }}
              stroke={strokeCol}
              strokeWidth={strokePx(1.05, s)}
            >
              {fw.shape === "chrysanthemum" ? (
                (fw.rayCount === 16 ? FIREWORK_RAYS_16 : FIREWORK_RAYS_12).map(
                  (rayD, rIdx) => (
                    <path key={rIdx} d={rayD} pathLength={1} />
                  ),
                )
              ) : (
                <>
                  {SHAPED_FIREWORK_SHELLS[fw.shape].rays.map((rayD, rIdx) => (
                    <path key={rIdx} d={rayD} pathLength={1} />
                  ))}
                  <path
                    d={SHAPED_FIREWORK_SHELLS[fw.shape].contour}
                    strokeDasharray="3.2 2.4"
                    strokeDashoffset={0}
                    strokeWidth={strokePx(1.0, s)}
                    opacity={0.92}
                  />
                </>
              )}
              <circle
                cx={0}
                cy={0}
                r={2.2}
                fill={strokeCol}
                stroke="none"
                opacity={0.75}
              />
            </g>
          </g>
        );
      })}

      {scene.patriotDogs.map((dog, i) => {
        const slot = (refs.patriotDogs[i] ??= {
          group: null,
          neckerchief: null,
          sparkler: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        const gear = SVG_PATHS.july4th.patriotDogGear;
        return (
          <g
            key={`patriot-dog-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-july-4th"
          >
            <path
              d={gear.rocketBody}
              fill={paperMaskFill}
              stroke={colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(1, 55)}
              strokeWidth={swMain}
            />
            <g
              ref={(el) => {
                slot.sparkler = el;
              }}
              transform="translate(-136, 195)"
            >
              <path
                d={gear.sparklerRays}
                stroke={colors.gold}
                strokeWidth={swFine}
              />
            </g>

            {renderKaiBody(swMain, paperMaskFill)}
            <g
              ref={(el) => {
                slot.neckerchief = el;
              }}
            >
              <path
                d={gear.neckerchief}
                fill={colors.primary}
                fillOpacity={0.2}
                stroke={colors.primary}
                strokeWidth={swMain}
              />
            </g>
            {renderKaiHandsFace(swMain, paperMaskFill)}

            <path
              d={gear.hatCrown}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(3, 55)}
              strokeWidth={swMain}
            />
            <path
              d={gear.hatStripesAndBrim}
              stroke={colors.accent}
              strokeWidth={swFine}
            />
          </g>
        );
      })}

      {scene.fireboats.map((_, i) => {
        const slot = (refs.fireboats[i] ??= {
          group: null,
          arch1: null,
          arch2: null,
          arch3: null,
        });
        const s = baseScale * 0.96;
        const sw = strokePx(1.1, s);
        const swSpray = strokePx(0.95, s);
        return (
          <g
            key={`fireboat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="fdny-fireboat"
          >
            <path
              ref={(el) => {
                slot.arch1 = el;
              }}
              d={SVG_PATHS.july4th.fireboat.archBack}
              pathLength={1}
              strokeDasharray="0.24 0.16"
              stroke={colors.primary}
              strokeWidth={swSpray}
            />
            <path
              ref={(el) => {
                slot.arch2 = el;
              }}
              d={SVG_PATHS.july4th.fireboat.archMid}
              pathLength={1}
              strokeDasharray="0.24 0.16"
              stroke={colors.accent}
              strokeWidth={swSpray}
            />
            <path
              ref={(el) => {
                slot.arch3 = el;
              }}
              d={SVG_PATHS.july4th.fireboat.archFront}
              pathLength={1}
              strokeDasharray="0.24 0.16"
              stroke={colors.primary}
              strokeWidth={swSpray}
            />
            <path
              d={SVG_PATHS.july4th.fireboat.hull}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 55)}
              strokeWidth={sw}
            />
            {isDark && (
              <g data-entity="boat-night-lights">
                <path
                  d="M -14 -6 L -8 -6 M -1 -6 L 5 -6 M 11 -6 L 16 -6 M -4 -18 L 8 -18"
                  stroke="#fde68a"
                  strokeWidth={strokePx(1.85, s)}
                  opacity={0.92}
                />
                <path
                  d="M -34 12.5 L 40 12.5"
                  stroke="#fbbf24"
                  strokeWidth={strokePx(0.95, s)}
                  opacity={0.42}
                />
                <circle cx={46} cy={-4} r={1.25} fill="#4ade80" stroke="none" />
                <circle cx={-38} cy={-1} r={1.2} fill="#f87171" stroke="none" />
                <circle cx={2} cy={-31.5} r={2.8} fill="#ef4444" fillOpacity={0.34} stroke="none" />
                <circle cx={2} cy={-31.5} r={1.3} fill="#fca5a5" stroke="none" />
              </g>
            )}
          </g>
        );
      })}

      {/* ================================================================== */}
      {/* DIWALI — Festival of Lights                                        */}
      {/* ================================================================== */}
      {scene.rangoliStars.map((rg, i) => {
        const s = baseScale * rg.scale * 1.15;
        return (
          <g
            key={`rangoli-${i}`}
            ref={(el) => {
              refs.rangoliStars[i] = el;
            }}
            data-entity="rangoli-mandala"
          >
            <path
              d={SVG_PATHS.diwali.rangoliMandala}
              stroke={i % 2 === 0 ? colors.gold : colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 50)}
              strokeWidth={strokePx(0.88, s)}
            />
          </g>
        );
      })}

      {scene.skyLanterns.map((lantern, i) => {
        const slot = (refs.skyLanterns[i] ??= { group: null, flame: null });
        const s = baseScale * lantern.scale * 1.05;
        const sw = strokePx(0.98, s);
        return (
          <g
            key={`lantern-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity={lantern.ornate ? "akash-kandil" : "sky-lantern"}
          >
            <path
              d={
                lantern.ornate
                  ? SVG_PATHS.diwali.akashKandil
                  : SVG_PATHS.diwali.skyLanternPaper
              }
              fill={paperMaskFill}
              stroke={lantern.ornate ? colors.accent : colors.gold}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i, 35)}
              strokeWidth={sw}
            />
            <g
              ref={(el) => {
                slot.flame = el;
              }}
            >
              <path
                d={SVG_PATHS.diwali.lanternFlame}
                fill={colors.gold}
                fillOpacity={0.45}
                stroke={colors.accent}
                strokeWidth={strokePx(0.8, s)}
              />
            </g>
          </g>
        );
      })}

      {scene.diwaliDogs.map((dog, i) => {
        const slot = (refs.diwaliDogs[i] ??= {
          group: null,
          plume: null,
          carpet: null,
          tassels: null,
        });
        const s = baseScale * dog.scale;
        const swMain = strokePx(1.2, s);
        const swFine = strokePx(0.85, s);
        const gear = SVG_PATHS.diwali.diwaliDogGear;
        return (
          <g
            key={`diwali-dog-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="kai-diwali"
          >
            {/* Undulating silk lotus carpet + fluttering corner tassels */}
            <path
              ref={(el) => {
                slot.carpet = el;
              }}
              d="M -124 172 Q 0 154 128 164 Q 204 170 258 152 L 246 184 Q 190 198 118 192 Q -8 182 -114 198 Z"
              fill={paperMaskFill}
              stroke={colors.accent}
              strokeWidth={swMain}
            />
            <path
              d={gear.carpetMedallion}
              stroke={colors.gold}
              strokeWidth={swFine}
            />
            <path
              ref={(el) => {
                slot.tassels = el;
              }}
              d="M -124 172 L -144 176 M -114 198 L -136 206 M 258 152 L 278 146 M 246 184 L 266 188"
              stroke={colors.gold}
              strokeWidth={swMain}
            />

            {renderKaiBody(swMain, paperMaskFill)}
            <path
              d={gear.marigoldMala}
              stroke={colors.gold}
              strokeWidth={swMain}
            />
            {renderKaiHandsFace(swMain, paperMaskFill)}

            <path
              d={gear.topiCap}
              fill={colors.accent}
              fillOpacity={0.22}
              stroke={colors.accent}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(3, 55)}
              strokeWidth={swMain}
            />
            <path
              d={gear.topiPattern}
              stroke={colors.gold}
              strokeWidth={swFine}
            />
            <g
              ref={(el) => {
                slot.plume = el;
              }}
            >
              <path
                d={gear.kalgiPlume}
                stroke={colors.gold}
                strokeWidth={swFine}
              />
            </g>
          </g>
        );
      })}

      {scene.diwaliBoats.map((_, i) => {
        const slot = (refs.diwaliBoats[i] ??= { group: null, flames: null });
        const s = baseScale * 0.98;
        const sw = strokePx(1.1, s);
        const swFine = strokePx(0.85, s);
        return (
          <g
            key={`diwali-boat-${i}`}
            ref={(el) => {
              slot.group = el;
            }}
            data-entity="diwali-diya-boat"
          >
            <path
              d={SVG_PATHS.diwali.diwaliBoat.hull}
              fill={paperMaskFill}
              pathLength={1}
              className="nyc-ink-path"
              style={drawDelay(i * 2, 55)}
              strokeWidth={sw}
            />
            <path
              d={SVG_PATHS.diwali.diwaliBoat.diyaBowls}
              fill={paperMaskFill}
              stroke={colors.accent}
              strokeWidth={swFine}
            />
            <g
              ref={(el) => {
                slot.flames = el;
              }}
            >
              <path
                d={SVG_PATHS.diwali.diwaliBoat.diyaFlames}
                fill={colors.gold}
                fillOpacity={0.35}
                stroke={colors.gold}
                strokeWidth={swFine}
              />
            </g>
            {isDark && (
              <path
                d="M -34 14.5 L 36 14.5 M -18 17 L 20 17"
                stroke="#fbbf24"
                strokeWidth={strokePx(1.0, s)}
                opacity={0.46}
              />
            )}
          </g>
        );
      })}
    </>
  );
}

// ============================================================================
// Imperative 60fps Updater for Spring, Summer & Festival Themes
// ============================================================================
export function updateSpringSummerDom(
  scene: SceneState,
  refs: SpringSummerDomRefs,
  dt: number,
  width: number,
  height: number,
  baseScale: number,
) {
  // 1. St. Patrick's Sky Rainbow + Pot of Gold
  scene.skyRainbows.forEach((rb, i) => {
    rb.shimmerPhase += 0.03 * dt;
    const slot = refs.skyRainbows[i];
    if (!slot?.group) return;
    const s = baseScale * rb.scale * 1.15;
    const x = rb.xRatio * width;
    const y = rb.yRatio * height;
    slot.group.setAttribute(
      "transform",
      `translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    const pulse = 0.92 + 0.14 * (0.5 + 0.5 * Math.sin(rb.shimmerPhase));
    slot.coins?.setAttribute(
      "transform",
      `translate(122, 52) scale(${pulse.toFixed(2)}) translate(-122, -52)`,
    );
  });

  // 2. St. Patrick's Leprechaun Kai
  scene.leprechaunDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.bobPhase += 0.032 * dt;
    dog.hatPhase += 0.026 * dt;
    dog.coinPhase = (dog.coinPhase + 0.006 * dt) % 1;

    if (dog.direction === 1 && dog.x > width + 130) dog.x = -130;
    if (dog.direction === -1 && dog.x < -130) dog.x = width + 130;

    const slot = refs.leprechaunDogs[i];
    if (!slot?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.bobPhase) * 6;
    const tilt = deg(Math.cos(dog.bobPhase) * 0.024);

    slot.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.baseY + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${tilt})`,
    );
    slot.hat?.setAttribute(
      "transform",
      `rotate(${deg(Math.sin(dog.hatPhase) * 0.025)}, 110, -58)`,
    );
    slot.rainbowMid?.setAttribute(
      "stroke-dashoffset",
      (-dog.coinPhase).toFixed(3),
    );
  });

  // 3. Tumbling 3- & 4-Leaf Shamrocks
  scene.shamrockClovers.forEach((clover, i) => {
    clover.swayPhase += clover.swaySpeed * dt;
    clover.spinAngle += clover.spinSpeed * dt;
    clover.x += (clover.vx + Math.sin(clover.swayPhase) * 0.28) * dt;
    clover.y += clover.vy * dt;

    if (clover.x > width + 36) clover.x = -36;
    if (clover.y > height + 30) {
      clover.y = -24;
      clover.x = Math.random() * width;
    }

    const el = refs.shamrockClovers[i];
    if (!el) return;
    const s = baseScale * clover.scale * 0.95;
    el.setAttribute(
      "transform",
      `translate(${clover.x.toFixed(1)}, ${clover.y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${deg(clover.spinAngle)})`,
    );
  });

  // 4. Emerald Harbor Ferries
  scene.emeraldBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += 0.028 * dt;
    boat.wakePhase = (boat.wakePhase + 0.01 * dt) % 1;

    if (boat.direction === 1 && boat.x > width + 110) boat.x = -110;
    if (boat.direction === -1 && boat.x < -110) boat.x = width + 110;

    const slot = refs.emeraldBoats[i];
    if (!slot?.group) return;
    const s = baseScale * 0.95;
    const bobY = Math.sin(boat.bobAngle) * 1.8;
    slot.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    slot.wake?.setAttribute("stroke-dashoffset", (-boat.wakePhase).toFixed(3));
  });

  // 5. Easter Decorated Egg Hot-Air Balloons
  scene.eggBalloons.forEach((egg, i) => {
    egg.x += egg.speed * egg.direction * dt;
    egg.bobPhase += egg.bobSpeed * dt;
    egg.swayPhase += 0.024 * dt;

    if (egg.direction === 1 && egg.x > width + 110) egg.x = -110;
    if (egg.direction === -1 && egg.x < -110) egg.x = width + 110;

    const el = refs.eggBalloons[i];
    if (!el) return;
    const s = baseScale * egg.scale * 1.08;
    const bobY = Math.sin(egg.bobPhase) * 6.5;
    const swayDeg = Math.sin(egg.swayPhase) * 3.2;
    el.setAttribute(
      "transform",
      `translate(${egg.x.toFixed(1)}, ${(egg.baseY + bobY).toFixed(1)}) scale(${s.toFixed(3)}) rotate(${swayDeg.toFixed(2)})`,
    );
  });

  // 6. Spring Barn Swallows
  scene.swallows.forEach((swallow, i) => {
    swallow.x += swallow.speed * swallow.direction * dt;
    swallow.flapPhase += 0.14 * dt;
    swallow.swoopPhase += 0.024 * dt;

    if (swallow.direction === 1 && swallow.x > width + 60) swallow.x = -60;
    if (swallow.direction === -1 && swallow.x < -60) swallow.x = width + 60;

    const slot = refs.swallows[i];
    if (!slot?.group || !slot.wings) return;
    const s = baseScale * swallow.scale * 1.1;
    const swoopY = Math.sin(swallow.swoopPhase) * 9;
    const pitchDeg = deg(Math.cos(swallow.swoopPhase) * 0.09);
    const beat = Math.sin(swallow.flapPhase);

    slot.group.setAttribute(
      "transform",
      `translate(${swallow.x.toFixed(1)}, ${(swallow.baseY + swoopY).toFixed(1)}) scale(${(swallow.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${pitchDeg})`,
    );
    const upY = -9 + beat * 7;
    const dnY = 8 + beat * 5;
    slot.wings.setAttribute(
      "d",
      `M 3 -1 Q 0 ${(upY * 0.65).toFixed(1)} -9 ${upY.toFixed(1)} M 4 1 Q 1 ${(dnY * 0.65).toFixed(1)} -7 ${dnY.toFixed(1)}`,
    );
  });

  // 7. Easter Bunny-Ears & Floral Bonnet Kai
  scene.easterDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.bobPhase += 0.03 * dt;
    dog.earPhase += 0.055 * dt;
    dog.ribbonPhase += 0.065 * dt;

    if (dog.direction === 1 && dog.x > width + 130) dog.x = -130;
    if (dog.direction === -1 && dog.x < -130) dog.x = width + 130;

    const slot = refs.easterDogs[i];
    if (!slot?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.bobPhase) * 5.5;
    const tilt = deg(Math.cos(dog.bobPhase) * 0.022);

    slot.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.baseY + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${tilt})`,
    );
    slot.earBack?.setAttribute(
      "transform",
      `rotate(${(Math.sin(dog.earPhase) * 6.5).toFixed(1)}, 90, -66)`,
    );
    slot.earFront?.setAttribute(
      "transform",
      `rotate(${(Math.sin(dog.earPhase - 0.7) * 7.5).toFixed(1)}, 126, -66)`,
    );
    slot.ribbons?.setAttribute(
      "transform",
      `rotate(${(Math.sin(dog.ribbonPhase) * 5).toFixed(1)}, 36, -42)`,
    );
  });

  // 8. Cherry Blossom Petals & Spring Tulip Boats
  scene.blossomPetals.forEach((petal, i) => {
    petal.swayPhase += 0.028 * dt;
    petal.spinAngle += petal.spinSpeed * dt;
    petal.x += (petal.vx + Math.sin(petal.swayPhase) * 0.3) * dt;
    petal.y += petal.vy * dt;

    if (petal.x > width + 30) petal.x = -30;
    if (petal.y > height + 26) {
      petal.y = -20;
      petal.x = Math.random() * width;
    }

    const el = refs.blossomPetals[i];
    if (!el) return;
    const s = baseScale * petal.scale * 0.95;
    el.setAttribute(
      "transform",
      `translate(${petal.x.toFixed(1)}, ${petal.y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${deg(petal.spinAngle)})`,
    );
  });

  scene.springBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += 0.028 * dt;
    boat.bloomPhase += 0.04 * dt;

    if (boat.direction === 1 && boat.x > width + 100) boat.x = -100;
    if (boat.direction === -1 && boat.x < -100) boat.x = width + 100;

    const slot = refs.springBoats[i];
    if (!slot?.group) return;
    const s = baseScale * 0.95;
    const bobY = Math.sin(boat.bobAngle) * 1.7;
    slot.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    slot.tulips?.setAttribute(
      "transform",
      `rotate(${(Math.sin(boat.bloomPhase) * 3.5).toFixed(1)}, 23, 2)`,
    );
  });

  // 9. Summer Compass Sun + Sky-Banner Biplane + Surfing Kai + Ice-Cream Barge
  scene.summerSuns.forEach((sun, i) => {
    sun.rayAngle = (sun.rayAngle + 0.14 * dt) % 360;
    sun.pulsePhase += 0.025 * dt;
    const slot = refs.summerSuns[i];
    if (!slot?.group) return;
    const pulse = 1 + 0.035 * Math.sin(sun.pulsePhase);
    const s = baseScale * sun.scale * 1.25 * pulse;
    slot.group.setAttribute(
      "transform",
      `translate(${(sun.xRatio * width).toFixed(1)}, ${(sun.yRatio * height).toFixed(1)}) scale(${s.toFixed(3)})`,
    );
    slot.rays?.setAttribute("transform", `rotate(${sun.rayAngle.toFixed(1)})`);
  });

  scene.bannerPlanes.forEach((plane, i) => {
    plane.x += plane.speed * plane.direction * dt;
    plane.propPhase += 0.45 * dt;
    plane.bannerWavePhase += 0.11 * dt;

    if (plane.direction === 1 && plane.x - 160 > width + 60) plane.x = -120;
    if (plane.direction === -1 && plane.x + 160 < -60) plane.x = width + 120;

    const slot = refs.bannerPlanes[i];
    if (!slot?.group) return;
    const s = baseScale * plane.scale * 1.15;
    const bobY = Math.sin(plane.bannerWavePhase * 0.25) * 4;

    slot.group.setAttribute(
      "transform",
      `translate(${plane.x.toFixed(1)}, ${(plane.baseY + bobY).toFixed(1)}) scale(${(plane.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );

    const propH = Math.cos(plane.propPhase) * 11;
    slot.prop?.setAttribute("y1", (2 - propH).toFixed(1));
    slot.prop?.setAttribute("y2", (2 + propH).toFixed(1));

    const w1 = Math.sin(plane.bannerWavePhase) * 3.5;
    const w2 = Math.cos(plane.bannerWavePhase) * 4.2;
    slot.banner?.setAttribute(
      "d",
      `M -28 1 L -48 ${(2 + w1 * 0.3).toFixed(1)} ` +
        `M -48 ${(-9 + w1 * 0.3).toFixed(1)} Q -92 ${(-9 + w2).toFixed(1)} -138 ${(-9 - w1).toFixed(1)} ` +
        `L -131 ${(2 - w1 * 0.6).toFixed(1)} L -138 ${(13 - w1).toFixed(1)} ` +
        `Q -92 ${(13 + w2).toFixed(1)} -48 ${(13 + w1 * 0.3).toFixed(1)} Z`,
    );
    slot.bannerWave?.setAttribute(
      "d",
      `M -56 ${(2 + w1 * 0.4).toFixed(1)} Q -82 ${(2 + w2).toFixed(1)} -104 ${(2 - w1 * 0.5).toFixed(1)} Q -118 ${(2 - w2 * 0.5).toFixed(1)} -126 ${(2 - w1 * 0.7).toFixed(1)}`,
    );
  });

  scene.summerDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.surfPhase += 0.032 * dt;
    dog.bandanaPhase += 0.065 * dt;

    if (dog.direction === 1 && dog.x > width + 110) dog.x = -110;
    if (dog.direction === -1 && dog.x < -110) dog.x = width + 110;

    const slot = refs.summerDogs[i];
    if (!slot?.group) return;
    const s = baseScale * dog.scale;
    const waterY = height - (width >= 1024 ? 14 : 9);
    dog.baseY = waterY - 180 * s;
    const waveY = Math.sin(dog.surfPhase) * 2.2;
    const currentY = dog.baseY + waveY;
    const pitchDeg = deg(Math.atan(Math.cos(dog.surfPhase) * 0.045));

    slot.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${currentY.toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${pitchDeg})`,
    );
    slot.bandana?.setAttribute(
      "transform",
      `rotate(${(Math.sin(dog.bandanaPhase) * 5.5).toFixed(1)}, 60, 16)`,
    );

    if (slot.wake) {
      const dir = dog.direction;
      const tailX = dog.x - dir * 132 * s;
      const tailY = currentY + 180 * s;
      const endX = tailX - dir * 64;
      const endY = dog.baseY + Math.sin(dog.surfPhase - 0.8) * 1.8 + 181 * s;
      slot.wake.setAttribute(
        "d",
        `M ${tailX.toFixed(1)} ${tailY.toFixed(1)} Q ${((tailX + endX) * 0.5).toFixed(1)} ${(tailY + 2.5).toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
      );
      slot.wake.setAttribute(
        "stroke-dashoffset",
        (-((dog.bandanaPhase * 0.08) % 1)).toFixed(3),
      );
    }
  });

  scene.summerBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += 0.028 * dt;
    boat.umbrellaPhase += 0.035 * dt;
    boat.kitePhase += 0.042 * dt;

    if (boat.direction === 1 && boat.x - 165 > width) boat.x = -165;
    if (boat.direction === -1 && boat.x + 165 < 0) boat.x = width + 165;

    const slot = refs.summerBoats[i];
    if (!slot?.group) return;
    const s = baseScale * 0.98;
    const bobY = Math.sin(boat.bobAngle) * 1.8;
    slot.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    slot.umbrella?.setAttribute(
      "transform",
      `rotate(${(Math.sin(boat.umbrellaPhase) * 4).toFixed(1)}, 35, -24)`,
    );

    // Animate primary kite & catenary string from flyer #1's hand (-19, -21)
    const kp = boat.kitePhase;
    const kx1 = -76 + Math.sin(kp) * 6.5;
    const ky1 = -112 - (i % 2) * 16 + Math.cos(kp * 1.3) * 5.5;
    const krot1 = -22 + Math.sin(kp * 1.5) * 7;
    slot.kite1Group?.setAttribute(
      "transform",
      `translate(${kx1.toFixed(1)}, ${ky1.toFixed(1)}) rotate(${krot1.toFixed(1)})`,
    );
    slot.kite1String?.setAttribute(
      "d",
      `M -19 -21 Q ${((-19 + kx1) * 0.5 + 8).toFixed(1)} ${((-21 + ky1) * 0.5 + 12).toFixed(1)} ${kx1.toFixed(1)} ${(ky1 + 2).toFixed(1)}`,
    );
    const tw1 = Math.sin(kp * 2.2) * 4.5;
    const tw2 = Math.cos(kp * 2.2) * 5.0;
    slot.kite1Tail?.setAttribute(
      "d",
      `M 0 13 Q ${(-6 + tw1).toFixed(1)} 22 ${(-4 - tw2 * 0.5).toFixed(1)} 30 ` +
        `Q ${(-2 - tw1).toFixed(1)} 37 ${(-9 + tw2).toFixed(1)} 44 ` +
        `M ${(-7 + tw1 * 0.6).toFixed(1)} 21 L ${(-1 + tw1 * 0.6).toFixed(1)} 23 ` +
        `M ${(-2 - tw2 * 0.4).toFixed(1)} 33 L ${(-8 - tw2 * 0.4).toFixed(1)} 35`,
    );

    // Animate secondary kite & string from flyer #2's hand (-39, -19) when present
    if (boat.twinKites) {
      const kx2 = -108 + Math.cos(kp * 1.15) * 6.0;
      const ky2 = -88 + Math.sin(kp * 1.4) * 5.0;
      const krot2 = -26 + Math.cos(kp * 1.6) * 7.5;
      slot.kite2Group?.setAttribute(
        "transform",
        `translate(${kx2.toFixed(1)}, ${ky2.toFixed(1)}) scale(0.86) rotate(${krot2.toFixed(1)})`,
      );
      slot.kite2String?.setAttribute(
        "d",
        `M -39 -19 Q ${((-39 + kx2) * 0.5 + 7).toFixed(1)} ${((-19 + ky2) * 0.5 + 10).toFixed(1)} ${kx2.toFixed(1)} ${(ky2 + 2).toFixed(1)}`,
      );
      slot.kite2Tail?.setAttribute(
        "d",
        `M 0 13 Q ${(-6 - tw1).toFixed(1)} 22 ${(-4 + tw2 * 0.5).toFixed(1)} 30 ` +
          `Q ${(-2 + tw1).toFixed(1)} 37 ${(-9 - tw2).toFixed(1)} 44 ` +
          `M ${(-7 - tw1 * 0.6).toFixed(1)} 21 L ${(-1 - tw1 * 0.6).toFixed(1)} 23`,
      );
    }
  });

  // 10. July 4th Aerial Fireworks + Patriot Kai + FDNY Fireboats
  scene.fireworks.forEach((fw, i) => {
    fw.progress = (fw.progress + fw.speed * dt) % 1;
    const slot = refs.fireworks[i];
    if (!slot?.group || !slot.rocket || !slot.burstGroup) return;

    const x = fw.xRatio * width;
    const y = fw.yRatio * height;
    const s = baseScale * fw.scale * 1.25;
    slot.group.setAttribute(
      "transform",
      `translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${s.toFixed(3)})`,
    );

    const p = fw.progress;
    if (p < 0.22) {
      // Phase 1: rising whistle streak
      const t = p / 0.22;
      const headY = 95 * (1 - t);
      const tailY = Math.min(95, headY + 24);
      slot.rocket.setAttribute("opacity", "0.85");
      slot.rocket.setAttribute("y1", tailY.toFixed(1));
      slot.rocket.setAttribute("y2", headY.toFixed(1));
      slot.burstGroup.setAttribute("opacity", "0");
    } else {
      // Phase 2: radial chrysanthemum stroke-dashoffset bloom & dissolve across all rays
      slot.rocket.setAttribute("opacity", "0");
      const b = (p - 0.22) / 0.78; // 0..1
      const expand = 0.3 + 0.9 * (1 - (1 - b) * (1 - b));
      const alpha = b < 0.68 ? 0.96 : Math.max(0, ((1 - b) / 0.32) * 0.96);
      const dashLen = Math.max(0.16, 0.56 * (1 - b * 0.5));
      const dashOffset = -Math.max(0, b * 0.76);

      slot.burstGroup.setAttribute("opacity", alpha.toFixed(2));
      slot.burstGroup.setAttribute("transform", `scale(${expand.toFixed(3)})`);
      slot.burstGroup.setAttribute(
        "stroke-dasharray",
        `${dashLen.toFixed(2)} 2`,
      );
      slot.burstGroup.setAttribute("stroke-dashoffset", dashOffset.toFixed(3));
    }
  });

  scene.patriotDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.bobPhase += 0.034 * dt;
    dog.sparkPhase = (dog.sparkPhase + 4.5 * dt) % 360;
    dog.scarfPhase += 0.07 * dt;

    if (dog.direction === 1 && dog.x > width + 130) dog.x = -130;
    if (dog.direction === -1 && dog.x < -130) dog.x = width + 130;

    const slot = refs.patriotDogs[i];
    if (!slot?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.bobPhase) * 5.5;
    const tilt = deg(Math.cos(dog.bobPhase) * 0.025);

    slot.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.baseY + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)}) rotate(${tilt})`,
    );
    slot.neckerchief?.setAttribute(
      "transform",
      `rotate(${(Math.sin(dog.scarfPhase) * 5.5).toFixed(1)}, 60, 18)`,
    );
    const sparkScale = 0.82 + 0.35 * (0.5 + 0.5 * Math.sin(dog.scarfPhase * 2));
    slot.sparkler?.setAttribute(
      "transform",
      `translate(-136, 195) rotate(${dog.sparkPhase.toFixed(1)}) scale(${sparkScale.toFixed(2)})`,
    );
  });

  scene.fireboats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += 0.028 * dt;
    boat.sprayPhase = (boat.sprayPhase + 0.014 * dt) % 1;

    if (boat.direction === 1 && boat.x > width + 130) boat.x = -130;
    if (boat.direction === -1 && boat.x < -130) boat.x = width + 130;

    const slot = refs.fireboats[i];
    if (!slot?.group) return;
    const s = baseScale * 0.96;
    const bobY = Math.sin(boat.bobAngle) * 1.6;
    slot.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    const off = (-boat.sprayPhase).toFixed(3);
    slot.arch1?.setAttribute("stroke-dashoffset", off);
    slot.arch2?.setAttribute("stroke-dashoffset", off);
    slot.arch3?.setAttribute("stroke-dashoffset", off);
  });

  // 11. Diwali Rangoli Mandalas + Rising Sky Lanterns + Lotus Carpet Kai + Diya Boats
  scene.rangoliStars.forEach((rg, i) => {
    rg.rotation = (rg.rotation + rg.rotationSpeed * dt) % 360;
    rg.pulsePhase += 0.028 * dt;
    const el = refs.rangoliStars[i];
    if (!el) return;
    const pulse = 0.94 + 0.12 * (0.5 + 0.5 * Math.sin(rg.pulsePhase));
    const s = baseScale * rg.scale * 1.15 * pulse;
    el.setAttribute(
      "transform",
      `translate(${(rg.xRatio * width).toFixed(1)}, ${(rg.yRatio * height).toFixed(1)}) scale(${s.toFixed(3)}) rotate(${rg.rotation.toFixed(1)})`,
    );
  });

  scene.skyLanterns.forEach((lantern, i) => {
    lantern.swayPhase += lantern.swaySpeed * dt;
    lantern.flickerPhase += 0.12 * dt;
    lantern.x += (lantern.vx + Math.sin(lantern.swayPhase) * 0.2) * dt;
    lantern.y -= lantern.vy * dt; // gently ascends toward the night sky!

    if (lantern.y < -36) {
      lantern.y = height - 24;
      lantern.x = Math.random() * width;
    }
    if (lantern.x > width + 36) lantern.x = -36;
    if (lantern.x < -36) lantern.x = width + 36;

    const slot = refs.skyLanterns[i];
    if (!slot?.group) return;
    const s = baseScale * lantern.scale * 1.05;
    const swayDeg = Math.sin(lantern.swayPhase) * 4.5;
    slot.group.setAttribute(
      "transform",
      `translate(${lantern.x.toFixed(1)}, ${lantern.y.toFixed(1)}) scale(${s.toFixed(3)}) rotate(${swayDeg.toFixed(1)})`,
    );
    const flicker = 0.85 + 0.28 * (0.5 + 0.5 * Math.sin(lantern.flickerPhase));
    slot.flame?.setAttribute(
      "transform",
      `translate(0, 13) scale(${flicker.toFixed(2)}) translate(0, -13)`,
    );
  });

  scene.diwaliDogs.forEach((dog, i) => {
    dog.x += dog.speed * dog.direction * dt;
    dog.wavePhase += 0.075 * dt;
    dog.tasselPhase += 0.09 * dt;
    dog.plumePhase += 0.05 * dt;

    if (dog.direction === 1 && dog.x > width + 130) dog.x = -130;
    if (dog.direction === -1 && dog.x < -130) dog.x = width + 130;

    const slot = refs.diwaliDogs[i];
    if (!slot?.group) return;
    const s = baseScale * dog.scale;
    const bobY = Math.sin(dog.wavePhase * 0.45) * 5.5;

    slot.group.setAttribute(
      "transform",
      `translate(${dog.x.toFixed(1)}, ${(dog.baseY + bobY).toFixed(1)}) scale(${(dog.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    slot.plume?.setAttribute(
      "transform",
      `rotate(${(Math.sin(dog.plumePhase) * 5).toFixed(1)}, 164, -98)`,
    );

    const c1 = Math.sin(dog.wavePhase) * 9;
    const c2 = Math.cos(dog.wavePhase) * 8;
    slot.carpet?.setAttribute(
      "d",
      `M -124 ${(172 + c1).toFixed(1)} Q 0 ${(156 + c2).toFixed(1)} 128 ${(164 - c1 * 0.7).toFixed(1)} ` +
        `Q 204 ${(168 + c2 * 0.6).toFixed(1)} 258 ${(152 + c1 * 0.5).toFixed(1)} ` +
        `L 246 ${(184 + c1 * 0.5).toFixed(1)} Q 190 ${(198 + c2 * 0.6).toFixed(1)} 118 ${(192 - c1 * 0.7).toFixed(1)} ` +
        `Q -8 ${(184 + c2).toFixed(1)} -114 ${(198 + c1).toFixed(1)} Z`,
    );
    slot.tassels?.setAttribute(
      "d",
      `M -124 ${(172 + c1).toFixed(1)} L -146 ${(176 + c2).toFixed(1)} ` +
        `M -114 ${(198 + c1).toFixed(1)} L -138 ${(207 + c2).toFixed(1)} ` +
        `M 258 ${(152 + c1 * 0.5).toFixed(1)} L 278 ${(145 - c2 * 0.5).toFixed(1)} ` +
        `M 246 ${(184 + c1 * 0.5).toFixed(1)} L 266 ${(189 - c2 * 0.5).toFixed(1)}`,
    );
  });

  scene.diwaliBoats.forEach((boat, i) => {
    boat.x += boat.speed * boat.direction * dt;
    boat.bobAngle += 0.026 * dt;
    boat.flamePhase += 0.13 * dt;

    if (boat.direction === 1 && boat.x > width + 110) boat.x = -110;
    if (boat.direction === -1 && boat.x < -110) boat.x = width + 110;

    const slot = refs.diwaliBoats[i];
    if (!slot?.group) return;
    const s = baseScale * 0.98;
    const bobY = Math.sin(boat.bobAngle) * 1.6;
    slot.group.setAttribute(
      "transform",
      `translate(${boat.x.toFixed(1)}, ${(boat.y + bobY).toFixed(1)}) scale(${(boat.direction * s).toFixed(3)}, ${s.toFixed(3)})`,
    );
    const flScaleY = 0.88 + 0.24 * (0.5 + 0.5 * Math.sin(boat.flamePhase));
    const flSkew = Math.cos(boat.flamePhase * 0.7) * 4;
    slot.flames?.setAttribute(
      "transform",
      `translate(0, -4) skewX(${flSkew.toFixed(1)}) scale(1, ${flScaleY.toFixed(2)}) translate(0, 4)`,
    );
  });
}
