export type SeasonTheme =
  | "auto"
  | "stPatricks"
  | "easter"
  | "summer"
  | "july4th"
  | "halloween"
  | "diwali"
  | "thanksgiving"
  | "christmas"
  | "winter"
  | "classic";

export type ResolvedSeasonTheme = Exclude<SeasonTheme, "auto">;

export interface NycBackgroundProps {
  season?: SeasonTheme;
  sketchColor?: string;
  accentColor?: string;
  cloudCount?: number;
  birdCount?: number;
  witchCount?: number;
  shipCount?: number;
  helicopterCount?: number;
  dogWizardCount?: number;
  charonFerryCount?: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
}

export interface Bird {
  x: number;
  y: number;
  speed: number;
  flapSpeed: number;
  flap: number;
  scale: number;
}

export interface Ship {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  type: "ferry" | "catamaran" | "tugboat" | "cargo" | "sailboat";
}

export interface StatenIslandFerry {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  bobSpeed: number;
  wakePhase: number;
}

export interface Helicopter {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  rotorAngle: number;
}

// ------------------------------------------------------------
// Halloween entities
// ------------------------------------------------------------
export interface Witch {
  baseX: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobAngle: number;
  isLooping: boolean;
  loopProgress: number;
  rotation: number;
  rotationInitialized: boolean;
}

export interface DogWizard {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobAngle: number;
  bobSpeed: number;
  broomAngle: number;
  broomSpeed: number;
  capeAngle: number;
  capeSpeed: number;
  hatAngle: number;
  hatSpeed: number;
}

export interface CharonFerry {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  bobSpeed: number;
  paddleAngle: number;
  paddleSpeed: number;
}

// ------------------------------------------------------------
// Thanksgiving entities
// ------------------------------------------------------------
export type ParadeBalloonKind = "turkey" | "astronautPup" | "harvestCluster";

export interface ParadeBalloon {
  kind: ParadeBalloonKind;
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobAngle: number;
  bobSpeed: number;
  swayPhase: number;
  swaySpeed: number;
}

export interface PilgrimDog {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobAngle: number;
  bobSpeed: number;
  featherPhase: number;
  featherSpeed: number;
  hatAngle: number;
  hatSpeed: number;
  leafAngle: number;
  leafSpeed: number;
}

export interface GooseFlock {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  wingCount: number;
  flapPhase: number;
  flapSpeed: number;
  driftPhase: number;
}

export type AutumnLeafKind = "maple" | "oak" | "ginkgo";

export interface AutumnLeaf {
  kind: AutumnLeafKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  swayPhase: number;
  swaySpeed: number;
  spinAngle: number;
  spinSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
}

export interface HarvestBoat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  bobSpeed: number;
  wheelAngle: number;
  steamPhase: number;
}

// ------------------------------------------------------------
// Christmas entities
// ------------------------------------------------------------
export interface SantaSleigh {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  wavePhase: number;
  gallopPhase: number;
  waveArmPhase: number;
  noseGlowPhase: number;
}

export interface SantaDog {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobAngle: number;
  bobSpeed: number;
  scarfPhase: number;
  scarfSpeed: number;
  pomPhase: number;
  pomSpeed: number;
  sledTiltPhase: number;
}

export interface HolidayTreeBoat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  bobSpeed: number;
  starPhase: number;
}

export interface TwinkleStar {
  xRatio: number;
  yRatio: number;
  scale: number;
  phase: number;
  speed: number;
}

// ------------------------------------------------------------
// Winter & shared snow/wind entities
// ------------------------------------------------------------
export type SnowflakeKind = "dendrite" | "fernStar" | "hexPrism";

export interface Snowflake {
  kind: SnowflakeKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  swayPhase: number;
  swaySpeed: number;
}

export interface WindRibbon {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  dashPhase: number;
  dashSpeed: number;
  variant: 0 | 1 | 2;
}

export interface SnowyOwl {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  cyclePhase: number;
  cycleSpeed: number;
}

export interface WinterDog {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  carvePhase: number;
  carveSpeed: number;
  scarfPhase: number;
  scarfSpeed: number;
  hatPhase: number;
}

export interface WinterHarborBoat {
  kind: "rinkBarge" | "cocoaTug";
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  bobSpeed: number;
  actionPhase: number;
  actionSpeed: number;
}

export interface IceFloe {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobPhase: number;
  variant: 0 | 1 | 2;
}

// ------------------------------------------------------------
// St. Patrick's Day entities
// ------------------------------------------------------------
export interface LeprechaunDog {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobPhase: number;
  hatPhase: number;
  coinPhase: number;
}

export interface ShamrockClover {
  fourLeaf: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  spinAngle: number;
  spinSpeed: number;
  swayPhase: number;
  swaySpeed: number;
}

export interface SkyRainbow {
  xRatio: number;
  yRatio: number;
  scale: number;
  shimmerPhase: number;
}

export interface EmeraldBoat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  wakePhase: number;
}

// ------------------------------------------------------------
// Easter entities
// ------------------------------------------------------------
export interface EasterDog {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobPhase: number;
  earPhase: number;
  ribbonPhase: number;
}

export interface EggBalloon {
  variant: 0 | 1 | 2;
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobPhase: number;
  bobSpeed: number;
  swayPhase: number;
}

export interface Swallow {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  flapPhase: number;
  swoopPhase: number;
}

export interface BlossomPetal {
  fullFlower: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  spinAngle: number;
  spinSpeed: number;
  swayPhase: number;
}

export interface SpringBoat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  bloomPhase: number;
}

// ------------------------------------------------------------
// Summer entities
// ------------------------------------------------------------
export interface SummerSun {
  xRatio: number;
  yRatio: number;
  scale: number;
  rayAngle: number;
  pulsePhase: number;
}

export interface BannerPlane {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  propPhase: number;
  bannerWavePhase: number;
}

export interface SummerDog {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  surfPhase: number;
  bandanaPhase: number;
}

export interface SummerBoat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  umbrellaPhase: number;
  kitePhase: number;
  twinKites: boolean;
}

// ------------------------------------------------------------
// July 4th entities
// ------------------------------------------------------------
export type FireworkShape = "chrysanthemum" | "star" | "heart" | "saturn";

export interface FireworkBurst {
  shape: FireworkShape;
  xRatio: number;
  yRatio: number;
  scale: number;
  progress: number; // 0..1 lifecycle (launch -> bloom -> fade)
  speed: number;
  colorKind: "accent" | "gold" | "primary";
  rayCount: 12 | 16;
}

export interface DroneShow {
  xRatio: number;
  yRatio: number;
  scale: number;
  timeline: number; // advances continuously across formations
  speed: number;
}

export interface PatriotDog {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  bobPhase: number;
  sparkPhase: number;
  scarfPhase: number;
}

export interface Fireboat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  sprayPhase: number;
}

// ------------------------------------------------------------
// Diwali entities
// ------------------------------------------------------------
export interface SkyLantern {
  ornate: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  swayPhase: number;
  swaySpeed: number;
  flickerPhase: number;
}

export interface DiwaliDog {
  x: number;
  baseY: number;
  speed: number;
  direction: 1 | -1;
  scale: number;
  wavePhase: number;
  tasselPhase: number;
  plumePhase: number;
}

export interface RangoliStar {
  xRatio: number;
  yRatio: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
}

export interface DiwaliBoat {
  x: number;
  y: number;
  speed: number;
  direction: 1 | -1;
  bobAngle: number;
  flamePhase: number;
}

// ------------------------------------------------------------
// Skyline-anchored city & waterfront details
// ------------------------------------------------------------
export interface LibertyBat {
  u: number;
  v: number;
  scale: number;
  flapPhase: number;
  flapSpeed: number;
  tiltDeg: number;
}

export interface WaterfrontPumpkin {
  u: number;
  v: number;
  scale: number;
  pair: boolean;
  glowPhase: number;
  glowSpeed: number;
}

export interface BlackCat {
  u: number;
  v: number;
  uMin: number;
  uMax: number;
  uSpeed: number;
  direction: 1 | -1;
  scale: number;
  stridePhase: number;
  tailPhase: number;
}

export interface WindowCandle {
  u: number;
  v: number;
  scale: number;
  flickerPhase: number;
  flickerSpeed: number;
}

export interface BuildingWreath {
  u: number;
  v: number;
  scale: number;
  swayPhase: number;
  swaySpeed: number;
}

export interface WaterfrontSnowman {
  u: number;
  v: number;
  scale: number;
  hatKind: "topHat" | "beanie";
  facing: 1 | -1;
  wavePhase: number;
  waveSpeed: number;
}

export interface SpireLighting {
  topColorLight: string;
  topColorDark: string;
  midColorLight: string;
  midColorDark: string;
  baseColorLight: string;
  baseColorDark: string;
  beaconColorLight: string;
  beaconColorDark: string;
  beaconPhase: number;
  shimmerPhase: number;
}

export interface LibertyStringLights {
  chasePhase: number;
  chaseSpeed: number;
}

export interface LibertyIcicle {
  u: number;
  v: number;
  scale: number;
  variant: 0 | 1 | 2;
  glintPhase: number;
}
