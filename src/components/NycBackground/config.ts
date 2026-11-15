import type {
  DesignThemeId,
  ResolvedSeasonTheme,
  SeasonTheme,
} from "./types";

export interface ThemeInkPalette {
  sketch: string;
  primary: string;
  accent: string;
  gold: string;
  skylineRgb: readonly [number, number, number];
  paperMask: string;
}

const CSS_PAPER_MASK = "var(--background)";

export const THEME_INK_PALETTES: Record<
  DesignThemeId,
  { light: ThemeInkPalette; dark: ThemeInkPalette }
> = {
  "crisp-forest": {
    light: {
      sketch: "rgba(78, 91, 88, 0.95)",
      primary: "rgba(13, 107, 88, 0.9)",
      accent: "rgba(179, 65, 37, 0.9)",
      gold: "rgba(180, 83, 9, 0.9)",
      skylineRgb: [64, 78, 75],
      paperMask: CSS_PAPER_MASK,
    },
    dark: {
      sketch: "rgba(155, 168, 164, 0.92)",
      primary: "rgba(71, 196, 165, 0.9)",
      accent: "rgba(235, 132, 104, 0.92)",
      gold: "rgba(240, 182, 76, 0.92)",
      skylineRgb: [155, 168, 164],
      paperMask: CSS_PAPER_MASK,
    },
  },
  "swiss-drafting": {
    light: {
      sketch: "rgba(74, 83, 98, 0.95)",
      primary: "rgba(24, 73, 169, 0.9)",
      accent: "rgba(196, 50, 26, 0.9)",
      gold: "rgba(180, 83, 9, 0.9)",
      skylineRgb: [58, 68, 84],
      paperMask: CSS_PAPER_MASK,
    },
    dark: {
      sketch: "rgba(150, 161, 179, 0.92)",
      primary: "rgba(126, 178, 255, 0.9)",
      accent: "rgba(255, 139, 115, 0.92)",
      gold: "rgba(240, 182, 76, 0.92)",
      skylineRgb: [150, 161, 179],
      paperMask: CSS_PAPER_MASK,
    },
  },
  "press-darkroom": {
    light: {
      sketch: "rgba(87, 82, 78, 0.95)",
      primary: "rgba(142, 27, 44, 0.9)",
      accent: "rgba(29, 78, 107, 0.9)",
      gold: "rgba(164, 92, 18, 0.9)",
      skylineRgb: [68, 63, 59],
      paperMask: CSS_PAPER_MASK,
    },
    dark: {
      sketch: "rgba(168, 161, 155, 0.92)",
      primary: "rgba(242, 148, 159, 0.9)",
      accent: "rgba(124, 194, 232, 0.92)",
      gold: "rgba(240, 182, 76, 0.92)",
      skylineRgb: [168, 161, 155],
      paperMask: CSS_PAPER_MASK,
    },
  },
};

export const DEFAULT_CONFIG = {
  season: "auto" as SeasonTheme,
  sketchColorLight: THEME_INK_PALETTES["crisp-forest"].light.sketch,
  sketchColorDark: THEME_INK_PALETTES["crisp-forest"].dark.sketch,
  accentColorLight: THEME_INK_PALETTES["crisp-forest"].light.accent,
  accentColorDark: THEME_INK_PALETTES["crisp-forest"].dark.accent,
  primaryColorLight: THEME_INK_PALETTES["crisp-forest"].light.primary,
  primaryColorDark: THEME_INK_PALETTES["crisp-forest"].dark.primary,
  goldColorLight: THEME_INK_PALETTES["crisp-forest"].light.gold,
  goldColorDark: THEME_INK_PALETTES["crisp-forest"].dark.gold,
  cloudCount: 7,
  birdCount: 10,
  witchCount: 5,
  shipCount: 4,
  helicopterCount: 3,
  witchLoopRadius: 24,
  witchLoopChance: 0.0005,
  witchLoopDrift: 0.15,
  witchLoopWidth: 1,
  witchLoopHeight: 0.87,
  witchLoopRamp: Math.PI * 0.15,
  dogWizardCount: 1,
  charonFerryCount: 2,
};

/**
 * Holiday window rule: active for 4 days leading up to the holiday,
 * the holiday itself, and 3 days after (`[-4, +3]` calendar days).
 */
export const HOLIDAY_LEAD_DAYS = 4;
export const HOLIDAY_TRAIL_DAYS = 3;

export interface SeasonCounts {
  clouds: number;
  birds: number;
  helicopters: number;
  ships: number;
  statenIslandFerrys: number;
  // Halloween
  witches: number;
  dogWizards: number;
  charonFerrys: number;
  // Thanksgiving
  paradeBalloons: number;
  pilgrimDogs: number;
  gooseFlocks: number;
  autumnLeaves: number;
  harvestBoats: number;
  // Christmas
  santaSleighs: number;
  santaDogs: number;
  holidayTreeBoats: number;
  twinkleStars: number;
  // Shared Winter / Christmas / Breeze
  snowflakes: number;
  windRibbons: number;
  // Winter
  snowyOwls: number;
  winterDogs: number;
  winterHarborBoats: number;
  iceFloes: number;
  // St. Patrick's Day
  leprechaunDogs: number;
  shamrockClovers: number;
  skyRainbows: number;
  emeraldBoats: number;
  // Easter
  easterDogs: number;
  eggBalloons: number;
  swallows: number;
  blossomPetals: number;
  springBoats: number;
  // Summer
  summerSuns: number;
  bannerPlanes: number;
  summerDogs: number;
  summerBoats: number;
  // July 4th
  fireworks: number;
  droneShows: number;
  patriotDogs: number;
  fireboats: number;
  // Diwali
  skyLanterns: number;
  diwaliDogs: number;
  rangoliStars: number;
  diwaliBoats: number;
  windowCandles: number;
  // Halloween city & Liberty details
  libertyBats: number;
  waterfrontPumpkins: number;
  blackCats: number;
  // Christmas & Winter city/waterfront details
  buildingWreaths: number;
  waterfrontSnowmen: number;
  libertyStringLights: number;
  libertyIcicles: number;
  // Illuminated Empire State & One WTC spires (all themes)
  spireLights: number;
}

const ZERO_COUNTS: SeasonCounts = {
  clouds: 0,
  birds: 0,
  helicopters: 0,
  ships: 0,
  statenIslandFerrys: 0,
  witches: 0,
  dogWizards: 0,
  charonFerrys: 0,
  paradeBalloons: 0,
  pilgrimDogs: 0,
  gooseFlocks: 0,
  autumnLeaves: 0,
  harvestBoats: 0,
  santaSleighs: 0,
  santaDogs: 0,
  holidayTreeBoats: 0,
  twinkleStars: 0,
  snowflakes: 0,
  windRibbons: 0,
  snowyOwls: 0,
  winterDogs: 0,
  winterHarborBoats: 0,
  iceFloes: 0,
  leprechaunDogs: 0,
  shamrockClovers: 0,
  skyRainbows: 0,
  emeraldBoats: 0,
  easterDogs: 0,
  eggBalloons: 0,
  swallows: 0,
  blossomPetals: 0,
  springBoats: 0,
  summerSuns: 0,
  bannerPlanes: 0,
  summerDogs: 0,
  summerBoats: 0,
  fireworks: 0,
  droneShows: 0,
  patriotDogs: 0,
  fireboats: 0,
  skyLanterns: 0,
  diwaliDogs: 0,
  rangoliStars: 0,
  diwaliBoats: 0,
  windowCandles: 0,
  libertyBats: 0,
  waterfrontPumpkins: 0,
  blackCats: 0,
  buildingWreaths: 0,
  waterfrontSnowmen: 0,
  libertyStringLights: 0,
  libertyIcicles: 0,
  spireLights: 0,
};

export const SEASON_PRESETS: Record<ResolvedSeasonTheme, SeasonCounts> = {
  stPatricks: {
    ...ZERO_COUNTS,
    clouds: 6,
    birds: 6,
    helicopters: 2,
    ships: 2,
    statenIslandFerrys: 1,
    leprechaunDogs: 1,
    shamrockClovers: 16,
    skyRainbows: 1,
    emeraldBoats: 2,
    windRibbons: 3,
    spireLights: 1,
  },
  easter: {
    ...ZERO_COUNTS,
    clouds: 6,
    ships: 2,
    statenIslandFerrys: 1,
    easterDogs: 1,
    eggBalloons: 3,
    swallows: 7,
    blossomPetals: 16,
    springBoats: 2,
    windRibbons: 2,
    spireLights: 1,
  },
  summer: {
    ...ZERO_COUNTS,
    clouds: 5,
    birds: 10,
    helicopters: 2,
    ships: 3,
    statenIslandFerrys: 1,
    summerSuns: 1,
    bannerPlanes: 1,
    summerDogs: 1,
    summerBoats: 3,
    spireLights: 1,
  },
  july4th: {
    ...ZERO_COUNTS,
    clouds: 4,
    ships: 2,
    statenIslandFerrys: 1,
    twinkleStars: 8,
    fireworks: 7,
    droneShows: 1,
    patriotDogs: 1,
    fireboats: 2,
    spireLights: 1,
  },
  halloween: {
    ...ZERO_COUNTS,
    clouds: 8,
    birds: 8,
    helicopters: 2,
    ships: 3,
    statenIslandFerrys: 1,
    witches: 5,
    dogWizards: 1,
    charonFerrys: 2,
    libertyBats: 3,
    waterfrontPumpkins: 11,
    blackCats: 4,
    spireLights: 1,
  },
  diwali: {
    ...ZERO_COUNTS,
    clouds: 4,
    ships: 2,
    statenIslandFerrys: 1,
    twinkleStars: 8,
    skyLanterns: 9,
    diwaliDogs: 1,
    rangoliStars: 4,
    diwaliBoats: 2,
    windowCandles: 28,
    fireworks: 2,
    spireLights: 1,
  },
  thanksgiving: {
    ...ZERO_COUNTS,
    clouds: 6,
    helicopters: 2,
    ships: 2,
    statenIslandFerrys: 1,
    paradeBalloons: 3,
    pilgrimDogs: 1,
    gooseFlocks: 2,
    autumnLeaves: 14,
    harvestBoats: 2,
    windRibbons: 3,
    spireLights: 1,
  },
  christmas: {
    ...ZERO_COUNTS,
    clouds: 5,
    ships: 2,
    statenIslandFerrys: 1,
    santaSleighs: 1,
    santaDogs: 1,
    holidayTreeBoats: 2,
    twinkleStars: 11,
    snowflakes: 16,
    windRibbons: 2,
    buildingWreaths: 12,
    waterfrontSnowmen: 7,
    libertyStringLights: 1,
    spireLights: 1,
  },
  winter: {
    ...ZERO_COUNTS,
    clouds: 6,
    ships: 2,
    statenIslandFerrys: 1,
    snowyOwls: 0,
    winterDogs: 1,
    winterHarborBoats: 2,
    iceFloes: 6,
    snowflakes: 22,
    windRibbons: 5,
    waterfrontSnowmen: 7,
    libertyIcicles: 4,
    spireLights: 1,
  },
  classic: {
    ...ZERO_COUNTS,
    clouds: 8,
    birds: 12,
    helicopters: 3,
    ships: 4,
    statenIslandFerrys: 1,
    spireLights: 1,
  },
};

export const SEASON_META: Record<
  ResolvedSeasonTheme,
  { label: string; badge: string; summary: string }
> = {
  stPatricks: {
    label: "St. Patrick's",
    badge: "Mar 17 (−4/+3d)",
    summary:
      "Sky rainbow & pot of gold, Leprechaun-hat Kai on a rainbow cauldron glider, tumbling 3- & 4-leaf shamrocks, and emerald-wake harbor ferries.",
  },
  easter: {
    label: "Easter",
    badge: "Easter (−4/+3d)",
    summary:
      "Decorated egg hot-air balloons, Fifth-Avenue bunny-ears & floral-bonnet Kai in a wicker basket glider, spring swallows, cherry blossoms, and tulip barges.",
  },
  summer: {
    label: "Summer",
    badge: "Jun–Aug",
    summary:
      "Rotating compass sun, Hudson sky-banner biplane, aviator-sunglasses Kai surfing the harbor, regatta sailboats, and people flying kites from summer barges.",
  },
  july4th: {
    label: "July 4th",
    badge: "Jul 4 (−4/+3d)",
    summary:
      "Shaped star, heart & Saturn fireworks, morphing 36-drone sky show (USA, Star, Torch, Liberty Bell), Uncle-Sam Kai, and FDNY fireboats.",
  },
  halloween: {
    label: "Halloween",
    badge: "Oct 31 (−4/+3d)",
    summary:
      "Green & orange Empire State & One WTC spires, witches, Wizard Kai, waterfront pumpkins, black cats, and bats on the Statue of Liberty.",
  },
  diwali: {
    label: "Diwali",
    badge: "Kartik Amavasya (−4/+3d)",
    summary:
      "Rising Akash-Kandil & sky lanterns, glowing candles in city windows, lotus-carpet Kai, rotating rangoli mandalas, and terracotta diya boats.",
  },
  thanksgiving: {
    label: "Thanksgiving",
    badge: "4th Thu Nov (−4/+3d)",
    summary:
      "Macy's parade balloons, Pilgrim Kai on a maple-leaf glider, V-formation geese, tumbling autumn leaves, and Hudson harvest pie steamboats.",
  },
  christmas: {
    label: "Christmas",
    badge: "Dec 25 (−4/+3d)",
    summary:
      "Santa's sleigh, colorful LED string lights on the Statue of Liberty, holly wreaths on buildings, waterfront snowmen, and Rockefeller spruce barges.",
  },
  winter: {
    label: "Winter",
    badge: "Dec–Feb",
    summary:
      "Frozen icicles draping off the Statue of Liberty & torch, small river icebergs, waterfront snowmen, snowboard Kai, skating barge, and cocoa tug.",
  },
  classic: {
    label: "NYC Classic",
    badge: "Spring & Fall",
    summary:
      "Manhattan skyline with randomized Empire State & One WTC spire lighting, night-illuminated windows in dark mode, clouds, gulls, and ferries.",
  },
};

// ============================================================================
// Deterministic Holiday Calendar Calculators (`[-4, +3]` day window)
// ============================================================================

const MS_PER_DAY = 86_400_000;

/** DST-proof UTC calendar day serial at 00:00Z for local `(year, monthIndex, day)`. */
function toDaySerial(year: number, monthIndex: number, day: number): number {
  return Math.round(Date.UTC(year, monthIndex, day) / MS_PER_DAY);
}

/** Anonymous Gregorian (Meeus/Jones/Butcher) algorithm for Easter Sunday. */
export function getEasterDate(year: number): { monthIndex: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { monthIndex: month - 1, day };
}

/** US Thanksgiving: 4th Thursday of November. */
export function getThanksgivingDate(year: number): {
  monthIndex: number;
  day: number;
} {
  const nov1Dow = new Date(Date.UTC(year, 10, 1)).getUTCDay(); // 0=Sun..4=Thu
  const firstThursday = 1 + ((4 - nov1Dow + 7) % 7);
  return { monthIndex: 10, day: firstThursday + 21 };
}

/**
 * Verified main Diwali (Lakshmi Puja / Kartik Amavasya) dates 2024–2040,
 * with astronomical synodic new-moon fallback outside the table range.
 */
const DIWALI_TABLE: Record<number, [number, number]> = {
  2024: [9, 31],  // Oct 31
  2025: [9, 20],  // Oct 20
  2026: [10, 8],  // Nov 8
  2027: [9, 29],  // Oct 29
  2028: [9, 17],  // Oct 17
  2029: [10, 5],  // Nov 5
  2030: [9, 26],  // Oct 26
  2031: [10, 14], // Nov 14
  2032: [10, 2],  // Nov 2
  2033: [9, 22],  // Oct 22
  2034: [10, 10], // Nov 10
  2035: [9, 30],  // Oct 30
  2036: [9, 19],  // Oct 19
  2037: [10, 7],  // Nov 7
  2038: [9, 27],  // Oct 27
  2039: [10, 15], // Nov 15
  2040: [10, 4],  // Nov 4
};

export function getDiwaliDate(year: number): { monthIndex: number; day: number } {
  const entry = DIWALI_TABLE[year];
  if (entry) {
    return { monthIndex: entry[0], day: entry[1] };
  }
  // Synodic lunar fallback anchored to 2026-11-08 Kartik Amavasya, picking the new moon in Oct 15 .. Nov 15
  const SYNODIC_DAYS = 29.530588853;
  const refSerial = toDaySerial(2026, 10, 8);
  const targetMid = toDaySerial(year, 9, 31);
  const cycles = Math.round((targetMid - refSerial) / SYNODIC_DAYS);
  const approxSerial = Math.round(refSerial + cycles * SYNODIC_DAYS);
  const dt = new Date(approxSerial * MS_PER_DAY);
  return { monthIndex: dt.getUTCMonth(), day: dt.getUTCDate() };
}

function getHolidayAnchorsForYear(
  year: number,
): Array<{ theme: ResolvedSeasonTheme; serial: number }> {
  const easter = getEasterDate(year);
  const diwali = getDiwaliDate(year);
  const thanksgiving = getThanksgivingDate(year);

  return [
    { theme: "stPatricks", serial: toDaySerial(year, 2, 17) },
    { theme: "easter", serial: toDaySerial(year, easter.monthIndex, easter.day) },
    { theme: "july4th", serial: toDaySerial(year, 6, 4) },
    { theme: "halloween", serial: toDaySerial(year, 9, 31) },
    { theme: "diwali", serial: toDaySerial(year, diwali.monthIndex, diwali.day) },
    {
      theme: "thanksgiving",
      serial: toDaySerial(year, thanksgiving.monthIndex, thanksgiving.day),
    },
    { theme: "christmas", serial: toDaySerial(year, 11, 25) },
  ];
}

export function resolveSeason(
  season: SeasonTheme = "auto",
  now: Date = new Date(),
): ResolvedSeasonTheme {
  if (season !== "auto") return season;

  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1..12
  const todaySerial = toDaySerial(year, now.getMonth(), now.getDate());

  // Check all holiday [-4, +3] windows across (year - 1 .. year + 1).
  // If two windows overlap (e.g. Oct 30 Diwali vs Oct 31 Halloween), pick the
  // holiday whose exact anchor day is closest to `todaySerial`.
  let bestMatch: { theme: ResolvedSeasonTheme; absDiff: number } | null = null;

  for (const y of [year - 1, year, year + 1]) {
    for (const h of getHolidayAnchorsForYear(y)) {
      const diff = todaySerial - h.serial;
      if (diff >= -HOLIDAY_LEAD_DAYS && diff <= HOLIDAY_TRAIL_DAYS) {
        const absDiff = Math.abs(diff);
        if (!bestMatch || absDiff < bestMatch.absDiff) {
          bestMatch = { theme: h.theme, absDiff };
        }
      }
    }
  }

  if (bestMatch) return bestMatch.theme;

  // Non-holiday seasonal defaults
  if (month === 12 || month === 1 || month === 2) return "winter";
  if (month >= 6 && month <= 8) return "summer";
  return "classic";
}
