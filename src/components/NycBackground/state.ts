import { SEASON_PRESETS, DEFAULT_CONFIG } from "./config";
import type {
  AutumnLeaf,
  AutumnLeafKind,
  BannerPlane,
  Bird,
  BlackCat,
  BlossomPetal,
  BuildingWreath,
  CharonFerry,
  Cloud,
  DiwaliBoat,
  DiwaliDog,
  DogWizard,
  DroneShow,
  EasterDog,
  EggBalloon,
  EmeraldBoat,
  Fireboat,
  FireworkBurst,
  FireworkShape,
  GooseFlock,
  HarvestBoat,
  Helicopter,
  HolidayTreeBoat,
  IceFloe,
  LeprechaunDog,
  LibertyBat,
  LibertyIcicle,
  LibertyStringLights,
  NycBackgroundProps,
  ParadeBalloon,
  ParadeBalloonKind,
  PatriotDog,
  PilgrimDog,
  RangoliStar,
  ResolvedSeasonTheme,
  SantaDog,
  SantaSleigh,
  ShamrockClover,
  Ship,
  SkyLantern,
  SkyRainbow,
  Snowflake,
  SnowflakeKind,
  SnowyOwl,
  SpireLighting,
  SpringBoat,
  StatenIslandFerry,
  SummerBoat,
  SummerDog,
  SummerSun,
  Swallow,
  TwinkleStar,
  WaterfrontPumpkin,
  WaterfrontSnowman,
  WindRibbon,
  WindowCandle,
  WinterDog,
  WinterHarborBoat,
  Witch,
} from "./types";

export class SceneState {
  clouds: Cloud[] = [];
  birds: Bird[] = [];
  helicopters: Helicopter[] = [];
  ships: Ship[] = [];
  statenIslandFerrys: StatenIslandFerry[] = [];

  // Halloween
  witches: Witch[] = [];
  dogWizards: DogWizard[] = [];
  charonFerrys: CharonFerry[] = [];

  // Thanksgiving
  paradeBalloons: ParadeBalloon[] = [];
  pilgrimDogs: PilgrimDog[] = [];
  gooseFlocks: GooseFlock[] = [];
  autumnLeaves: AutumnLeaf[] = [];
  harvestBoats: HarvestBoat[] = [];

  // Christmas
  santaSleighs: SantaSleigh[] = [];
  santaDogs: SantaDog[] = [];
  holidayTreeBoats: HolidayTreeBoat[] = [];
  twinkleStars: TwinkleStar[] = [];

  // Shared Winter / Christmas / Breeze
  snowflakes: Snowflake[] = [];
  windRibbons: WindRibbon[] = [];

  // Winter
  snowyOwls: SnowyOwl[] = [];
  winterDogs: WinterDog[] = [];
  winterHarborBoats: WinterHarborBoat[] = [];
  iceFloes: IceFloe[] = [];

  // St. Patrick's Day
  leprechaunDogs: LeprechaunDog[] = [];
  shamrockClovers: ShamrockClover[] = [];
  skyRainbows: SkyRainbow[] = [];
  emeraldBoats: EmeraldBoat[] = [];

  // Easter
  easterDogs: EasterDog[] = [];
  eggBalloons: EggBalloon[] = [];
  swallows: Swallow[] = [];
  blossomPetals: BlossomPetal[] = [];
  springBoats: SpringBoat[] = [];

  // Summer
  summerSuns: SummerSun[] = [];
  bannerPlanes: BannerPlane[] = [];
  summerDogs: SummerDog[] = [];
  summerBoats: SummerBoat[] = [];

  // July 4th (& Diwali aerial sparkles)
  fireworks: FireworkBurst[] = [];
  patriotDogs: PatriotDog[] = [];
  fireboats: Fireboat[] = [];

  // Diwali
  skyLanterns: SkyLantern[] = [];
  diwaliDogs: DiwaliDog[] = [];
  rangoliStars: RangoliStar[] = [];
  diwaliBoats: DiwaliBoat[] = [];
  windowCandles: WindowCandle[] = [];

  // Skyline-anchored city & waterfront details + drone show + spire lights
  droneShows: DroneShow[] = [];
  libertyBats: LibertyBat[] = [];
  waterfrontPumpkins: WaterfrontPumpkin[] = [];
  blackCats: BlackCat[] = [];
  buildingWreaths: BuildingWreath[] = [];
  waterfrontSnowmen: WaterfrontSnowman[] = [];
  libertyStringLights: LibertyStringLights[] = [];
  libertyIcicles: LibertyIcicle[] = [];
  spireLights: SpireLighting[] = [];
}

function hslToHex(h: number, sPct: number, lPct: number): string {
  const hNorm = ((h % 360) + 360) % 360;
  const s = sPct / 100;
  const l = lPct / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hNorm < 60) [r, g, b] = [c, x, 0];
  else if (hNorm < 120) [r, g, b] = [x, c, 0];
  else if (hNorm < 180) [r, g, b] = [0, c, x];
  else if (hNorm < 240) [r, g, b] = [0, x, c];
  else if (hNorm < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const hex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function createSpireLighting(season: ResolvedSeasonTheme): SpireLighting {
  const holidayPalettes: Partial<
    Record<
      ResolvedSeasonTheme,
      Omit<SpireLighting, "beaconPhase" | "shimmerPhase">
    >
  > = {
    stPatricks: {
      topColorLight: "#059669",
      topColorDark: "#34d399",
      midColorLight: "#16a34a",
      midColorDark: "#4ade80",
      baseColorLight: "#047857",
      baseColorDark: "#10b981",
      beaconColorLight: "#d97706",
      beaconColorDark: "#fbbf24",
    },
    easter: {
      topColorLight: "#ca8a04",
      topColorDark: "#fde047",
      midColorLight: "#db2777",
      midColorDark: "#f472b6",
      baseColorLight: "#7c3aed",
      baseColorDark: "#c084fc",
      beaconColorLight: "#0284c7",
      beaconColorDark: "#38bdf8",
    },
    july4th: {
      // Real-world ESB July 4th layout: Blue spire/mast, White upper crown, Red lower crown
      topColorLight: "#2563eb",
      topColorDark: "#3b82f6",
      midColorLight: "#0284c7",
      midColorDark: "#f8fafc",
      baseColorLight: "#dc2626",
      baseColorDark: "#ef4444",
      beaconColorLight: "#2563eb",
      beaconColorDark: "#f8fafc",
    },
    halloween: {
      // Real-world ESB Halloween layout: Emerald Green spire & mast, Pumpkin Orange crown
      topColorLight: "#15803d",
      topColorDark: "#22c55e",
      midColorLight: "#16a34a",
      midColorDark: "#4ade80",
      baseColorLight: "#ea580c",
      baseColorDark: "#ff6b1a",
      beaconColorLight: "#16a34a",
      beaconColorDark: "#4ade80",
    },
    diwali: {
      topColorLight: "#d97706",
      topColorDark: "#fbbf24",
      midColorLight: "#db2777",
      midColorDark: "#f472b6",
      baseColorLight: "#ea580c",
      baseColorDark: "#fb923c",
      beaconColorLight: "#ca8a04",
      beaconColorDark: "#fde047",
    },
    thanksgiving: {
      topColorLight: "#ca8a04",
      topColorDark: "#facc15",
      midColorLight: "#ea580c",
      midColorDark: "#fb923c",
      baseColorLight: "#b91c1c",
      baseColorDark: "#f87171",
      beaconColorLight: "#d97706",
      beaconColorDark: "#fbbf24",
    },
    christmas: {
      topColorLight: "#dc2626",
      topColorDark: "#ef4444",
      midColorLight: "#15803d",
      midColorDark: "#22c55e",
      baseColorLight: "#b91c1c",
      baseColorDark: "#f87171",
      beaconColorLight: "#d97706",
      beaconColorDark: "#fbbf24",
    },
  };

  const preset = holidayPalettes[season];
  if (preset) {
    return { ...preset, beaconPhase: 0.4, shimmerPhase: 0 };
  }

  // Non-holiday days (classic, summer, winter): fresh random colors on every load
  const h0 = Math.floor(Math.random() * 360);
  const offsets = [
    [0, 120, 240],
    [0, 42, 84],
    [0, 155, 215],
  ][Math.floor(Math.random() * 3)];
  const [hTop, hMid, hBase] = offsets.map((off) => (h0 + off) % 360);
  const hBeacon = (h0 + 60) % 360;

  return {
    topColorLight: hslToHex(hTop, 85, 46),
    topColorDark: hslToHex(hTop, 92, 64),
    midColorLight: hslToHex(hMid, 85, 46),
    midColorDark: hslToHex(hMid, 92, 64),
    baseColorLight: hslToHex(hBase, 85, 46),
    baseColorDark: hslToHex(hBase, 92, 64),
    beaconColorLight: hslToHex(hBeacon, 88, 48),
    beaconColorDark: hslToHex(hBeacon, 95, 68),
    beaconPhase: 0.4,
    shimmerPhase: 0,
  };
}

export const SHIP_KEEL_Y: Record<Ship["type"], number> = {
  ferry: 10,
  catamaran: 0,
  tugboat: 5,
  cargo: 6,
  sailboat: 4,
};

const stratifiedX = (
  index: number,
  count: number,
  width: number,
  jitter = 0.7,
) => {
  if (count <= 0) return width * 0.5;
  const slot = width / count;
  const center = (index + 0.5) * slot;
  return center + (Math.random() - 0.5) * slot * jitter;
};

export function createSceneState(
  season: ResolvedSeasonTheme,
  width: number,
  height: number,
  overrides: NycBackgroundProps = {},
): SceneState {
  const preset = SEASON_PRESETS[season];
  const state = new SceneState();

  const cloudCount = overrides.cloudCount ?? preset.clouds;
  const birdCount = overrides.birdCount ?? preset.birds;
  const heliCount = overrides.helicopterCount ?? preset.helicopters;
  const shipCount = overrides.shipCount ?? preset.ships;
  const charonCount =
    season === "halloween"
      ? (overrides.charonFerryCount ?? DEFAULT_CONFIG.charonFerryCount)
      : 0;

  // Stratified harbor waterline lanes (hull-bottom Y in viewport px) from the upper bay
  // below the Manhattan seawall down to the foreground water edge so every watercraft has a
  // distinct depth lane and lower-down boats cleanly occlude higher-up boats.
  const baseScale = Math.max(0.42, Math.min(0.76, width / 1920));
  const seawallY = height - width * (789 / 1994) * (1 - 0.903);
  const waterBand = Math.max(14, height - seawallY);
  const minWaterlineY = seawallY + waterBand * 0.28;
  const maxWaterlineY = height - (width >= 1024 ? 5.5 : 3.5);
  const totalHarborCraft =
    shipCount +
    preset.statenIslandFerrys +
    charonCount +
    preset.harvestBoats +
    preset.holidayTreeBoats +
    preset.winterHarborBoats +
    preset.emeraldBoats +
    preset.springBoats +
    preset.summerDogs +
    preset.summerBoats +
    preset.fireboats +
    preset.diwaliBoats;

  const harborWaterlines = Array.from(
    { length: Math.max(1, totalHarborCraft) },
    (_, idx) => {
      if (totalHarborCraft <= 1) {
        return (minWaterlineY + maxWaterlineY) * 0.5;
      }
      const span = Math.max(2, maxWaterlineY - minWaterlineY);
      const slotGap = span / (totalHarborCraft - 1);
      const jitter = (Math.random() - 0.5) * slotGap * 0.2;
      return Math.max(
        minWaterlineY,
        Math.min(maxWaterlineY, minWaterlineY + idx * slotGap + jitter),
      );
    },
  );
  for (let i = harborWaterlines.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [harborWaterlines[i], harborWaterlines[j]] = [
      harborWaterlines[j],
      harborWaterlines[i],
    ];
  }
  let nextHarborLane = 0;
  const claimBoatAnchorY = (localKeelY: number, scaleFactor: number) => {
    const waterlineY =
      harborWaterlines[nextHarborLane % harborWaterlines.length] ??
      (minWaterlineY + maxWaterlineY) * 0.5;
    nextHarborLane += 1;
    return waterlineY - localKeelY * baseScale * scaleFactor;
  };

  state.clouds = Array.from({ length: cloudCount }, (_, i) => ({
    x: stratifiedX(i, cloudCount, width, 0.85),
    y: (0.07 + Math.random() * 0.3) * height,
    speed: 0.06 + Math.random() * 0.16,
    scale: 0.45 + Math.random() * 0.95,
  }));

  state.birds = Array.from({ length: birdCount }, (_, i) => ({
    x: stratifiedX(i, birdCount, width, 0.9),
    y: (0.06 + Math.random() * 0.32) * height,
    speed: 0.22 + Math.random() * 0.35,
    flapSpeed: 0.055 + Math.random() * 0.045,
    flap: Math.random() * Math.PI * 2,
    scale: 0.45 + Math.random() * 0.65,
  }));

  state.helicopters = Array.from({ length: heliCount }, (_, i) => ({
    x: stratifiedX(i, heliCount, width, 0.8),
    y: (0.08 + Math.random() * 0.28) * height,
    speed: 1.35 + Math.random() * 0.75,
    direction: i % 2 === 0 ? 1 : -1,
    rotorAngle: Math.random() * Math.PI * 2,
  }));

  const shipTypes: Ship["type"][] =
    season === "summer"
      ? ["sailboat", "sailboat", "catamaran", "ferry", "sailboat"]
      : ["ferry", "catamaran", "tugboat", "cargo", "sailboat"];

  state.ships = Array.from({ length: shipCount }, (_, i) => {
    const type = shipTypes[i % shipTypes.length];
    const speed =
      type === "catamaran"
        ? 0.45 + Math.random() * 0.1
        : type === "ferry"
          ? 0.16 + Math.random() * 0.08
          : type === "cargo"
            ? 0.05 + Math.random() * 0.04
            : 0.12 + Math.random() * 0.06;
    return {
      x: stratifiedX(i, shipCount, width, 0.85),
      y: claimBoatAnchorY(SHIP_KEEL_Y[type], 0.85),
      speed,
      direction: i % 2 === 0 ? 1 : -1,
      type,
    };
  });

  // Iconic Orange Staten Island Ferry cruising the Upper Bay across all seasons
  state.statenIslandFerrys = Array.from(
    { length: preset.statenIslandFerrys },
    (_, i) => ({
      x: width * (0.34 + i * 0.42),
      y: claimBoatAnchorY(9, 0.98),
      speed: 0.21,
      direction: 1,
      bobAngle: 0.7,
      bobSpeed: 0.026,
      wakePhase: 0,
    }),
  );

  // ------------------------------------------------------------------
  // Halloween
  // ------------------------------------------------------------------
  const witchCount =
    season === "halloween"
      ? (overrides.witchCount ?? DEFAULT_CONFIG.witchCount)
      : 0;
  state.witches = Array.from({ length: witchCount }, (_, i) => ({
    baseX: stratifiedX(i, witchCount, width, 0.8),
    baseY: height * (0.44 + Math.random() * 0.34),
    speed: 0.6 + Math.random() * 0.7,
    direction: i % 2 === 0 ? 1 : -1,
    scale: 1 + Math.random() * 0.45,
    bobAngle: Math.random() * Math.PI * 2,
    isLooping: false,
    loopProgress: 0,
    rotation: 0,
    rotationInitialized: false,
  }));

  const dogWizardCount =
    season === "halloween"
      ? (overrides.dogWizardCount ?? DEFAULT_CONFIG.dogWizardCount)
      : 0;
  state.dogWizards = Array.from({ length: dogWizardCount }, () => ({
    x: width * (0.56 + Math.random() * 0.24),
    y: height * (0.44 + Math.random() * 0.2),
    speed: 0.55 + Math.random() * 0.3,
    direction: 1,
    scale: 0.22,
    bobAngle: Math.random() * Math.PI * 2,
    bobSpeed: 0.032,
    broomAngle: 0,
    broomSpeed: 0.02,
    capeAngle: 0,
    capeSpeed: 0.035,
    hatAngle: 0,
    hatSpeed: 0.024,
  }));

  state.charonFerrys = Array.from({ length: charonCount }, (_, i) => ({
    x: stratifiedX(i, charonCount, width, 0.6),
    y: claimBoatAnchorY(9.5, 0.85),
    speed: 0.14 + Math.random() * 0.07,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: Math.random() * Math.PI * 2,
    bobSpeed: 0.032 + Math.random() * 0.012,
    paddleAngle: Math.random() * Math.PI * 2,
    paddleSpeed: 0.048 + Math.random() * 0.012,
  }));

  // ------------------------------------------------------------------
  // Thanksgiving
  // ------------------------------------------------------------------
  const balloonKinds: ParadeBalloonKind[] = [
    "turkey",
    "astronautPup",
    "harvestCluster",
  ];
  state.paradeBalloons = Array.from(
    { length: preset.paradeBalloons },
    (_, i) => ({
      kind: balloonKinds[i % balloonKinds.length],
      x: width * (0.2 + i * 0.3 + (Math.random() - 0.5) * 0.08),
      baseY: height * (0.24 + (i % 2) * 0.14 + Math.random() * 0.06),
      speed: 0.18 + Math.random() * 0.1,
      direction: i === 1 ? -1 : 1,
      scale: i === 0 ? 1.05 : 0.92,
      bobAngle: i * 2.1,
      bobSpeed: 0.022 + Math.random() * 0.008,
      swayPhase: i * 1.4,
      swaySpeed: 0.03 + Math.random() * 0.01,
    }),
  );

  state.pilgrimDogs = Array.from({ length: preset.pilgrimDogs }, () => ({
    x: width * 0.62,
    y: height * 0.54,
    speed: 0.52,
    direction: 1,
    scale: 0.22,
    bobAngle: 0.6,
    bobSpeed: 0.032,
    featherPhase: 0,
    featherSpeed: 0.048,
    hatAngle: 0,
    hatSpeed: 0.025,
    leafAngle: 0,
    leafSpeed: 0.028,
  }));

  state.gooseFlocks = Array.from({ length: preset.gooseFlocks }, (_, i) => ({
    x: width * (0.28 + i * 0.45),
    baseY: height * (0.12 + i * 0.09),
    speed: 0.48 + i * 0.08,
    direction: i % 2 === 0 ? 1 : -1,
    scale: 0.85 - i * 0.12,
    wingCount: i === 0 ? 3 : 2,
    flapPhase: i * 1.7,
    flapSpeed: 0.075,
    driftPhase: i * 2.3,
  }));

  const leafKinds: AutumnLeafKind[] = ["maple", "oak", "ginkgo"];
  state.autumnLeaves = Array.from({ length: preset.autumnLeaves }, (_, i) => ({
    kind: leafKinds[i % leafKinds.length],
    x: stratifiedX(i, preset.autumnLeaves, width, 0.95),
    y: Math.random() * height * 0.88,
    vx: 0.35 + Math.random() * 0.35,
    vy: 0.22 + Math.random() * 0.24,
    scale: 0.65 + Math.random() * 0.45,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.028 + Math.random() * 0.02,
    spinAngle: Math.random() * Math.PI * 2,
    spinSpeed: (Math.random() - 0.5) * 0.03,
    tumblePhase: Math.random() * Math.PI * 2,
    tumbleSpeed: 0.03 + Math.random() * 0.025,
  }));

  state.harvestBoats = Array.from({ length: preset.harvestBoats }, (_, i) => ({
    x: width * (0.3 + i * 0.46),
    y: claimBoatAnchorY(10, 0.96),
    speed: 0.16 + i * 0.04,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: i * 1.9,
    bobSpeed: 0.03,
    wheelAngle: 0,
    steamPhase: i * 0.5,
  }));

  // ------------------------------------------------------------------
  // Christmas
  // ------------------------------------------------------------------
  state.santaSleighs = Array.from({ length: preset.santaSleighs }, () => ({
    x: width * 0.52,
    baseY: height * 0.25,
    speed: 0.68,
    direction: 1,
    scale: 0.98,
    wavePhase: 0,
    gallopPhase: 0,
    waveArmPhase: 0,
    noseGlowPhase: 0,
  }));

  state.santaDogs = Array.from({ length: preset.santaDogs }, () => ({
    x: width * 0.68,
    y: height * 0.56,
    speed: 0.5,
    direction: -1,
    scale: 0.21,
    bobAngle: 1.1,
    bobSpeed: 0.034,
    scarfPhase: 0,
    scarfSpeed: 0.058,
    pomPhase: 0.4,
    pomSpeed: 0.068,
    sledTiltPhase: 0,
  }));

  state.holidayTreeBoats = Array.from(
    { length: preset.holidayTreeBoats },
    (_, i) => ({
      x: width * (0.28 + i * 0.48),
      y: claimBoatAnchorY(9, 0.96),
      speed: 0.15 + i * 0.04,
      direction: i % 2 === 0 ? 1 : -1,
      bobAngle: i * 2.2,
      bobSpeed: 0.03,
      starPhase: i * 1.5,
    }),
  );

  state.twinkleStars = Array.from({ length: preset.twinkleStars }, (_, i) => ({
    xRatio: 0.06 + ((i + 0.5) / Math.max(1, preset.twinkleStars)) * 0.88,
    yRatio: 0.06 + ((i * 37) % 100) / 360,
    scale: 0.55 + (i % 3) * 0.22,
    phase: i * 1.15,
    speed: 0.03 + (i % 4) * 0.008,
  }));

  // ------------------------------------------------------------------
  // Snowflakes & Wind Ribbons
  // ------------------------------------------------------------------
  const flakeKinds: SnowflakeKind[] = ["dendrite", "fernStar", "hexPrism"];
  state.snowflakes = Array.from({ length: preset.snowflakes }, (_, i) => ({
    kind: flakeKinds[i % flakeKinds.length],
    x: stratifiedX(i, preset.snowflakes, width, 0.95),
    y: Math.random() * height * 0.92,
    vx: (season === "winter" ? 0.22 : 0.08) + (Math.random() - 0.3) * 0.16,
    vy: 0.2 + Math.random() * 0.28,
    scale: 0.42 + (i % 4) * 0.18,
    rotation: Math.random() * 360,
    rotationSpeed: (i % 2 === 0 ? 1 : -1) * (0.18 + Math.random() * 0.22),
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.022 + Math.random() * 0.018,
  }));

  state.windRibbons = Array.from({ length: preset.windRibbons }, (_, i) => ({
    x: stratifiedX(i, preset.windRibbons, width, 0.7),
    y: height * (0.15 + ((i * 0.21) % 0.55)),
    speed: 0.42 + (i % 3) * 0.14,
    direction: 1,
    scale: 0.82 + (i % 2) * 0.24,
    dashPhase: (i / Math.max(1, preset.windRibbons)) * 1.0,
    dashSpeed: 0.0045 + (i % 3) * 0.0012,
    variant: (i % 3) as 0 | 1 | 2,
  }));

  // ------------------------------------------------------------------
  // Winter
  // ------------------------------------------------------------------
  state.snowyOwls = Array.from({ length: preset.snowyOwls }, (_, i) => ({
    x: width * (0.18 + i * 0.31),
    baseY: height * (0.14 + (i % 2) * 0.12),
    speed: 0.46 + i * 0.09,
    direction: i === 1 ? -1 : 1,
    scale: 0.95 - (i % 2) * 0.14,
    cyclePhase: i * 2.4,
    cycleSpeed: 0.022,
  }));

  state.winterDogs = Array.from({ length: preset.winterDogs }, () => ({
    x: width * 0.6,
    baseY: height * 0.53,
    speed: 0.58,
    direction: 1,
    scale: 0.21,
    carvePhase: 0.3,
    carveSpeed: 0.026,
    scarfPhase: 0,
    scarfSpeed: 0.062,
    hatPhase: 0,
  }));

  state.winterHarborBoats = Array.from(
    { length: preset.winterHarborBoats },
    (_, i) => {
      const kind = i === 0 ? "rinkBarge" : "cocoaTug";
      return {
        kind,
        x: width * (0.32 + i * 0.42),
        y: claimBoatAnchorY(kind === "rinkBarge" ? 10 : 9, 0.98),
        speed: i === 0 ? 0.13 : 0.18,
        direction: i === 0 ? 1 : -1,
        bobAngle: i * 1.8,
        bobSpeed: 0.028,
        actionPhase: 0,
        actionSpeed: 0.032,
      };
    },
  );

  state.iceFloes = Array.from({ length: preset.iceFloes }, (_, i) => {
    const floeScale = 0.75 + (i % 3) * 0.2;
    const floeT =
      preset.iceFloes <= 1 ? 0.5 : (i + 0.5) / preset.iceFloes;
    const floeWaterlineY =
      minWaterlineY + floeT * Math.max(2, maxWaterlineY - minWaterlineY);
    return {
      x: stratifiedX(i, preset.iceFloes, width, 0.8),
      y: floeWaterlineY - 2.5 * baseScale * floeScale * 0.9,
      speed: 0.06 + (i % 3) * 0.025,
      direction: 1,
      scale: floeScale,
      bobPhase: i * 1.3,
      variant: (i % 3) as 0 | 1 | 2,
    };
  });

  // ------------------------------------------------------------------
  // St. Patrick's Day
  // ------------------------------------------------------------------
  state.skyRainbows = Array.from({ length: preset.skyRainbows }, () => ({
    xRatio: 0.76,
    yRatio: 0.32,
    scale: 1.25,
    shimmerPhase: 0,
  }));

  state.leprechaunDogs = Array.from({ length: preset.leprechaunDogs }, () => ({
    x: width * 0.58,
    baseY: height * 0.53,
    speed: 0.54,
    direction: 1,
    scale: 0.21,
    bobPhase: 0.4,
    hatPhase: 0,
    coinPhase: 0,
  }));

  state.shamrockClovers = Array.from(
    { length: preset.shamrockClovers },
    (_, i) => ({
      fourLeaf: i % 5 === 0,
      x: stratifiedX(i, preset.shamrockClovers, width, 0.9),
      y: Math.random() * height * 0.86,
      vx: 0.28 + Math.random() * 0.25,
      vy: 0.16 + Math.random() * 0.18,
      scale: 0.65 + (i % 3) * 0.2,
      spinAngle: Math.random() * Math.PI * 2,
      spinSpeed: (i % 2 === 0 ? 1 : -1) * (0.015 + Math.random() * 0.015),
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.025 + Math.random() * 0.015,
    }),
  );

  state.emeraldBoats = Array.from({ length: preset.emeraldBoats }, (_, i) => ({
    x: width * (0.28 + i * 0.46),
    y: claimBoatAnchorY(10, 0.95),
    speed: 0.18 + i * 0.04,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: i * 1.7,
    wakePhase: i * 0.4,
  }));

  // ------------------------------------------------------------------
  // Easter
  // ------------------------------------------------------------------
  state.eggBalloons = Array.from({ length: preset.eggBalloons }, (_, i) => ({
    variant: (i % 3) as 0 | 1 | 2,
    x: width * (0.22 + i * 0.31),
    baseY: height * (0.22 + (i % 2) * 0.13),
    speed: 0.16 + i * 0.04,
    direction: i === 1 ? -1 : 1,
    scale: 0.96 - (i % 2) * 0.08,
    bobPhase: i * 2.1,
    bobSpeed: 0.022,
    swayPhase: i * 1.3,
  }));

  state.easterDogs = Array.from({ length: preset.easterDogs }, () => ({
    x: width * 0.64,
    baseY: height * 0.55,
    speed: 0.5,
    direction: 1,
    scale: 0.21,
    bobPhase: 0.5,
    earPhase: 0,
    ribbonPhase: 0,
  }));

  state.swallows = Array.from({ length: preset.swallows }, (_, i) => ({
    x: stratifiedX(i, preset.swallows, width, 0.85),
    baseY: height * (0.09 + (i % 4) * 0.07),
    speed: 0.62 + (i % 3) * 0.16,
    direction: i % 3 === 1 ? -1 : 1,
    scale: 0.72 + (i % 3) * 0.14,
    flapPhase: i * 1.1,
    swoopPhase: i * 0.9,
  }));

  state.blossomPetals = Array.from(
    { length: preset.blossomPetals },
    (_, i) => ({
      fullFlower: i % 3 === 0,
      x: stratifiedX(i, preset.blossomPetals, width, 0.9),
      y: Math.random() * height * 0.88,
      vx: 0.26 + Math.random() * 0.22,
      vy: 0.18 + Math.random() * 0.18,
      scale: 0.72 + (i % 3) * 0.2,
      spinAngle: Math.random() * Math.PI * 2,
      spinSpeed: (i % 2 === 0 ? 1 : -1) * 0.02,
      swayPhase: i * 0.8,
    }),
  );

  state.springBoats = Array.from({ length: preset.springBoats }, (_, i) => ({
    x: width * (0.3 + i * 0.44),
    y: claimBoatAnchorY(10, 0.95),
    speed: 0.15 + i * 0.04,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: i * 2.0,
    bloomPhase: i * 1.4,
  }));

  // ------------------------------------------------------------------
  // Summer
  // ------------------------------------------------------------------
  state.summerSuns = Array.from({ length: preset.summerSuns }, () => ({
    xRatio: 0.86,
    yRatio: 0.19,
    scale: 1.15,
    rayAngle: 0,
    pulsePhase: 0,
  }));

  state.bannerPlanes = Array.from({ length: preset.bannerPlanes }, () => ({
    x: width * 0.56,
    baseY: height * 0.2,
    speed: 0.72,
    direction: 1,
    scale: 1.05,
    propPhase: 0,
    bannerWavePhase: 0,
  }));

  const surfScale = 0.175;
  state.summerDogs = Array.from({ length: preset.summerDogs }, () => ({
    x: width * 0.48,
    baseY: claimBoatAnchorY(180, surfScale),
    speed: 0.36,
    direction: 1,
    scale: surfScale,
    surfPhase: 0.4,
    bandanaPhase: 0,
  }));

  state.summerBoats = Array.from({ length: preset.summerBoats }, (_, i) => ({
    x: width * (0.18 + i * 0.32),
    y: claimBoatAnchorY(10, 0.98),
    speed: 0.13 + i * 0.03,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: i * 1.9,
    umbrellaPhase: i * 1.2,
    kitePhase: i * 1.8,
    twinKites: i === 1,
  }));

  // ------------------------------------------------------------------
  // July 4th (& Diwali gentle fireworks)
  // ------------------------------------------------------------------
  const fwColors: FireworkBurst["colorKind"][] = ["accent", "gold", "primary"];
  const fwShapes: FireworkShape[] =
    season === "diwali"
      ? ["chrysanthemum", "star"]
      : ["star", "heart", "saturn", "chrysanthemum", "star", "heart", "chrysanthemum"];
  const fwPositions: Array<[number, number]> =
    season === "diwali"
      ? [
          [0.64, 0.2],
          [0.86, 0.25],
        ]
      : [
          [0.14, 0.19],
          [0.33, 0.14],
          [0.49, 0.18],
          [0.6, 0.15],
          [0.84, 0.16],
          [0.91, 0.25],
          [0.24, 0.25],
        ];
  state.fireworks = Array.from({ length: preset.fireworks }, (_, i) => {
    const [xr, yr] = fwPositions[i % fwPositions.length];
    return {
      shape: fwShapes[i % fwShapes.length],
      xRatio: xr,
      yRatio: yr,
      scale: 0.92 + (i % 3) * 0.16,
      // Stagger initial phases so shaped star/heart/saturn bursts are mid-bloom on frame 0
      progress: (0.34 + i * 0.18) % 1,
      speed: 0.004 + (i % 3) * 0.0007,
      colorKind: fwColors[i % fwColors.length],
      rayCount: i % 2 === 0 ? 16 : 12,
    };
  });

  state.droneShows = Array.from({ length: preset.droneShows }, () => ({
    xRatio: 0.715,
    yRatio: 0.24,
    scale: 1.0,
    timeline: 0.32,
    speed: 0.0044,
  }));

  state.patriotDogs = Array.from({ length: preset.patriotDogs }, () => ({
    x: width * 0.6,
    baseY: height * 0.54,
    speed: 0.62,
    direction: 1,
    scale: 0.21,
    bobPhase: 0.3,
    sparkPhase: 0,
    scarfPhase: 0,
  }));

  state.fireboats = Array.from({ length: preset.fireboats }, (_, i) => ({
    x: width * (0.3 + i * 0.45),
    y: claimBoatAnchorY(10, 0.96),
    speed: 0.14 + i * 0.03,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: i * 1.7,
    sprayPhase: i * 0.5,
  }));

  // ------------------------------------------------------------------
  // Diwali
  // ------------------------------------------------------------------
  state.skyLanterns = Array.from({ length: preset.skyLanterns }, (_, i) => ({
    ornate: i % 3 === 0,
    x: stratifiedX(i, preset.skyLanterns, width, 0.85),
    y: height * (0.14 + ((i * 0.19) % 0.68)),
    vx: (i % 2 === 0 ? 1 : -1) * (0.06 + (i % 3) * 0.03),
    vy: 0.16 + (i % 4) * 0.05, // rises upward!
    scale: 0.78 + (i % 3) * 0.18,
    swayPhase: i * 1.3,
    swaySpeed: 0.022 + (i % 3) * 0.006,
    flickerPhase: i * 0.9,
  }));

  state.diwaliDogs = Array.from({ length: preset.diwaliDogs }, () => ({
    x: width * 0.62,
    baseY: height * 0.54,
    speed: 0.52,
    direction: 1,
    scale: 0.21,
    wavePhase: 0,
    tasselPhase: 0,
    plumePhase: 0,
  }));

  const rangoliSpots: Array<[number, number]> = [
    [0.14, 0.16],
    [0.54, 0.14],
    [0.74, 0.22],
    [0.91, 0.15],
  ];
  state.rangoliStars = Array.from({ length: preset.rangoliStars }, (_, i) => {
    const [xr, yr] = rangoliSpots[i % rangoliSpots.length];
    return {
      xRatio: xr,
      yRatio: yr,
      scale: 0.88 + (i % 2) * 0.2,
      rotation: i * 22.5,
      rotationSpeed: (i % 2 === 0 ? 1 : -1) * 0.16,
      pulsePhase: i * 1.4,
    };
  });

  state.diwaliBoats = Array.from({ length: preset.diwaliBoats }, (_, i) => ({
    x: width * (0.28 + i * 0.46),
    y: claimBoatAnchorY(12, 0.98),
    speed: 0.13 + i * 0.04,
    direction: i % 2 === 0 ? 1 : -1,
    bobAngle: i * 2.1,
    flamePhase: i * 1.2,
  }));

  // ------------------------------------------------------------------
  // Skyline-Anchored City & Waterfront Details
  // ------------------------------------------------------------------

  // 1. Diwali window candles mapped to exact window centers in skyline.png (50% smaller)
  const candleWindows: Array<[number, number]> = [
    [0.123, 0.828], [0.139, 0.808], [0.148, 0.850], [0.167, 0.848],
    [0.196, 0.750], [0.212, 0.772], [0.226, 0.812], [0.248, 0.842],
    [0.274, 0.842], [0.294, 0.818], [0.312, 0.760], [0.330, 0.790],
    [0.342, 0.760], [0.374, 0.720], [0.390, 0.742], [0.409, 0.794],
    [0.422, 0.834], [0.436, 0.794], [0.493, 0.826], [0.518, 0.800],
    [0.543, 0.826], [0.575, 0.852], [0.635, 0.788], [0.648, 0.810],
    [0.686, 0.808], [0.703, 0.835], [0.736, 0.824], [0.815, 0.834],
  ];
  state.windowCandles = Array.from(
    { length: preset.windowCandles },
    (_, i) => {
      const [u, v] = candleWindows[i % candleWindows.length];
      return {
        u,
        v,
        scale: 0.46 + (i % 3) * 0.05,
        flickerPhase: i * 1.1,
        flickerSpeed: 0.08 + (i % 4) * 0.018,
      };
    },
  );

  // 2. Halloween roosting bats on the Statue of Liberty (3 bats, 50% smaller)
  const libertyBatSpots: Array<[number, number, number]> = [
    [0.053, 0.562, -6],
    [0.081, 0.676, 6],
    [0.051, 0.779, -5],
  ];
  state.libertyBats = Array.from({ length: preset.libertyBats }, (_, i) => {
    const [u, v, tiltDeg] = libertyBatSpots[i % libertyBatSpots.length];
    return {
      u,
      v,
      scale: 0.48 + (i % 2) * 0.04,
      flapPhase: i * 1.35,
      flapSpeed: 0.045 + (i % 3) * 0.012,
      tiltDeg,
    };
  });

  // 3. Halloween waterfront jack-o'-lanterns along the Manhattan seawall (v = 0.903)
  const pumpkinUs = [
    0.132, 0.208, 0.285, 0.358, 0.435, 0.512, 0.588, 0.668, 0.748, 0.832, 0.918,
  ];
  state.waterfrontPumpkins = Array.from(
    { length: preset.waterfrontPumpkins },
    (_, i) => ({
      u: pumpkinUs[i % pumpkinUs.length],
      v: 0.903,
      scale: 0.98 + (i % 2) * 0.12,
      pair: i % 2 === 1,
      glowPhase: i * 0.95,
      glowSpeed: 0.06 + (i % 3) * 0.015,
    }),
  );

  // 4. Halloween little black cats running along the waterfront seawall (25% smaller)
  const catZones: Array<[number, number, number, 1 | -1]> = [
    [0.18, 0.115, 0.33, 1],
    [0.44, 0.33, 0.55, -1],
    [0.64, 0.55, 0.76, 1],
    [0.86, 0.75, 0.955, -1],
  ];
  state.blackCats = Array.from({ length: preset.blackCats }, (_, i) => {
    const [u, uMin, uMax, direction] = catZones[i % catZones.length];
    return {
      u,
      v: 0.904,
      uMin,
      uMax,
      uSpeed: 0.00038 + (i % 2) * 0.00009,
      direction,
      scale: 0.79,
      stridePhase: i * 1.6,
      tailPhase: i * 1.1,
    };
  });

  // 5. Christmas holly wreaths mounted on Manhattan building pediments & facades
  const wreathSpots: Array<[number, number, number]> = [
    [0.138, 0.786, 0.92],
    [0.237, 0.768, 0.98],
    [0.320, 0.715, 0.95],
    [0.369, 0.805, 1.02],
    [0.423, 0.760, 1.06],
    [0.519, 0.772, 1.06],
    [0.556, 0.512, 0.92],
    [0.638, 0.342, 0.95],
    [0.695, 0.778, 0.94],
    [0.738, 0.796, 0.94],
    [0.826, 0.800, 1.0],
    [0.848, 0.535, 0.94],
  ];
  state.buildingWreaths = Array.from(
    { length: preset.buildingWreaths },
    (_, i) => {
      const [u, v, scale] = wreathSpots[i % wreathSpots.length];
      return {
        u,
        v,
        scale,
        swayPhase: i * 0.85,
        swaySpeed: 0.032 + (i % 3) * 0.006,
      };
    },
  );

  // 6. Shared Christmas & Winter snowmen along the waterfront (v = 0.903)
  const snowmanUs = [0.145, 0.268, 0.388, 0.505, 0.618, 0.752, 0.888];
  state.waterfrontSnowmen = Array.from(
    { length: preset.waterfrontSnowmen },
    (_, i) => ({
      u: snowmanUs[i % snowmanUs.length],
      v: 0.903,
      scale: 0.96 + (i % 2) * 0.1,
      hatKind: i % 2 === 0 ? "topHat" : "beanie",
      facing: i % 2 === 0 ? 1 : -1,
      wavePhase: i * 1.3,
      waveSpeed: 0.042 + (i % 3) * 0.008,
    }),
  );

  // 7. Christmas color LED string lights draped around the Statue of Liberty
  state.libertyStringLights = Array.from(
    { length: preset.libertyStringLights },
    () => ({
      chasePhase: 0,
      chaseSpeed: 0.08,
    }),
  );

  // 8. Winter frozen icicles: under torch, under elbow, under book, and one batch under pedestal
  const icicleSpots: Array<[number, number, 0 | 1 | 2, number]> = [
    [106.5 / 1994, 435.5 / 789, 0, 0.92], // 1. Under the torch
    [113.5 / 1994, 489.5 / 789, 0, 0.78], // 2. Under the raised elbow
    [157.5 / 1994, 534.5 / 789, 0, 0.84], // 3. Under the book (tablet)
    [132.5 / 1994, 615.5 / 789, 2, 1.1],  // 4. One batch under the pedestal cornice
  ];
  state.libertyIcicles = Array.from(
    { length: preset.libertyIcicles },
    (_, i) => {
      const [u, v, variant, scale] = icicleSpots[i % icicleSpots.length];
      return {
        u,
        v,
        variant,
        scale,
        glintPhase: i * 1.1,
      };
    },
  );

  // 9. Colorful Empire State Building & One World Trade Center spires (all themes)
  state.spireLights = Array.from({ length: preset.spireLights }, () =>
    createSpireLighting(season),
  );

  return state;
}
