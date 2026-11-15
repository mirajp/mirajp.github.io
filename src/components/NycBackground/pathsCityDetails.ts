// ============================================================================
// Skyline-Anchored Landmarks, Shaped Fireworks & Drone Show Catalog
//   - July 4th: Shaped firework shells (Star, Heart, Saturn) & 36-drone show
//   - Halloween: Waterfront jack-o'-lanterns, running black cats & Liberty bats
//   - Diwali: Glowing window candles mapped to skyline.png windows
//   - Christmas & Winter: Building wreaths & shared waterfront snowmen
// ============================================================================

/** Exact pixel dimensions of `public/skyline.png` (1994 x 789). */
export const SKYLINE_NATIVE_W = 1994;
export const SKYLINE_NATIVE_H = 789;
export const SKYLINE_ASPECT = SKYLINE_NATIVE_H / SKYLINE_NATIVE_W;

/**
 * Maps normalized `skyline.png` coordinates `(u, v)` in `[0..1]` to exact SVG
 * viewBox coordinates, matching `ctx.drawImage(img, 0, h - drawH, w, drawH)`.
 */
export function skylineToSvg(
  u: number,
  v: number,
  width: number,
  height: number,
): { x: number; y: number; scale: number } {
  const skylineH = width * SKYLINE_ASPECT;
  return {
    x: u * width,
    y: height - skylineH + v * skylineH,
    scale: Math.max(0.45, width / 1440),
  };
}

/** Maps native `1994x789` pixel coordinates `(px, py)` directly to SVG space. */
export function skylinePxToSvg(
  px: number,
  py: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const skylineH = width * SKYLINE_ASPECT;
  return {
    x: (px / SKYLINE_NATIVE_W) * width,
    y: height - skylineH + (py / SKYLINE_NATIVE_H) * skylineH,
  };
}

function buildStarShell(): { rays: string[]; contour: string } {
  const vertices: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 46 : 19;
    vertices.push([+(Math.cos(angle) * r).toFixed(2), +(Math.sin(angle) * r).toFixed(2)]);
  }
  const contourCmds = vertices.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`);
  contourCmds.push("Z");

  const rays: string[] = [];
  for (let i = 0; i < 10; i++) {
    const [xA, yA] = vertices[i];
    const [xB, yB] = vertices[(i + 1) % 10];
    for (const t of [0, 0.5]) {
      const px = +(xA + (xB - xA) * t).toFixed(2);
      const py = +(yA + (yB - yA) * t).toFixed(2);
      const x0 = +(px * 0.1).toFixed(2);
      const y0 = +(py * 0.1).toFixed(2);
      rays.push(`M ${x0} ${y0} L ${px} ${py}`);
    }
  }
  return { rays, contour: contourCmds.join(" ") };
}

function buildHeartShell(): { rays: string[]; contour: string } {
  const pts: Array<[number, number]> = [];
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const t = (i * Math.PI * 2) / steps;
    const sx = Math.sin(t);
    const x = +(16 * sx * sx * sx * 2.5).toFixed(2);
    const y = +(
      -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) *
        2.35 -
      4
    ).toFixed(2);
    pts.push([x, y]);
  }
  const contour =
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z";
  const rays = pts.map(([px, py]) => {
    const x0 = +(px * 0.1).toFixed(2);
    const y0 = +(-4 + (py + 4) * 0.1).toFixed(2);
    return `M ${x0} ${y0} L ${px} ${py}`;
  });
  return { rays, contour };
}

function buildSaturnShell(): { rays: string[]; contour: string } {
  const rays: string[] = [];
  // Inner spherical core burst (12 rays)
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI * 2) / 12;
    const x0 = +(Math.cos(a) * 2.5).toFixed(2);
    const y0 = +(Math.sin(a) * 2.5).toFixed(2);
    const x1 = +(Math.cos(a) * 23).toFixed(2);
    const y1 = +(Math.sin(a) * 23).toFixed(2);
    rays.push(`M ${x0} ${y0} L ${x1} ${y1}`);
  }
  // Tilted equatorial ring rays (12 rays rotated -20 deg)
  const tilt = (-20 * Math.PI) / 180;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const ringPts: Array<[number, number]> = [];
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    const ex = Math.cos(a) * 48;
    const ey = Math.sin(a) * 13;
    const rx = +(ex * ct - ey * st).toFixed(2);
    const ry = +(ex * st + ey * ct).toFixed(2);
    ringPts.push([rx, ry]);
    if (i % 2 === 0) {
      rays.push(`M ${(rx * 0.35).toFixed(2)} ${(ry * 0.35).toFixed(2)} L ${rx} ${ry}`);
    }
  }
  const contour =
    ringPts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ") +
    " Z M -22 0 A 22 22 0 1 0 22 0 A 22 22 0 1 0 -22 0";
  return { rays, contour };
}

function buildScallopedWreath(lobes: number, outerR: number, innerR: number): string {
  const outer: string[] = [];
  for (let i = 0; i < lobes; i++) {
    const a0 = (i * Math.PI * 2) / lobes;
    const aMid = ((i + 0.5) * Math.PI * 2) / lobes;
    const a1 = ((i + 1) * Math.PI * 2) / lobes;
    const rValley = outerR * 0.82;
    const x0 = +(Math.cos(a0) * rValley).toFixed(2);
    const y0 = +(Math.sin(a0) * rValley).toFixed(2);
    const xm = +(Math.cos(aMid) * (outerR * 1.12)).toFixed(2);
    const ym = +(Math.sin(aMid) * (outerR * 1.12)).toFixed(2);
    const x1 = +(Math.cos(a1) * rValley).toFixed(2);
    const y1 = +(Math.sin(a1) * rValley).toFixed(2);
    outer.push(`${i === 0 ? `M ${x0} ${y0}` : ""} Q ${xm} ${ym} ${x1} ${y1}`);
  }
  return (
    outer.join(" ") +
    ` Z M -${innerR} 0 A ${innerR} ${innerR} 0 1 0 ${innerR} 0 A ${innerR} ${innerR} 0 1 0 -${innerR} 0`
  );
}

// ============================================================================
// 36-Drone Synchronized Sky Formations (local coords in [-72..72, -44..44])
// ============================================================================
function buildStarDroneFormation(): Array<[number, number]> {
  const verts: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? 44 : 18;
    verts.push([+(Math.cos(a) * r).toFixed(1), +(Math.sin(a) * r).toFixed(1)]);
  }
  const pts: Array<[number, number]> = [];
  // 25 drones along the 5-point star perimeter (10 vertices + 15 edge points)
  for (let i = 0; i < 10; i++) {
    const [x0, y0] = verts[i];
    const [x1, y1] = verts[(i + 1) % 10];
    pts.push([x0, y0]);
    pts.push([+(x0 + (x1 - x0) * 0.5).toFixed(1), +(y0 + (y1 - y0) * 0.5).toFixed(1)]);
    if (i % 2 === 0) {
      pts.push([+(x0 + (x1 - x0) * 0.25).toFixed(1), +(y0 + (y1 - y0) * 0.25).toFixed(1)]);
    }
  }
  // 10 inner crown ring drones + 1 center beacon = 36 total
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    pts.push([+(Math.cos(a) * 9.5).toFixed(1), +(Math.sin(a) * 9.5).toFixed(1)]);
  }
  pts.push([0, 0]);
  return pts;
}

export const DRONE_FORMATIONS: Array<{
  name: string;
  points: Array<[number, number]>;
}> = [
  {
    name: "USA",
    points: [
      // U (12 drones)
      [-66, -20], [-66, -10], [-66, 0], [-66, 10],
      [-61, 19], [-54, 22], [-46, 22], [-39, 19],
      [-34, 10], [-34, 0], [-34, -10], [-34, -20],
      // S (12 drones)
      [14, -15], [7, -21], [-3, -21], [-12, -17], [-15, -9],
      [-8, -2], [2, 2], [11, 7],
      [15, 15], [8, 21], [-3, 21], [-14, 15],
      // A (12 drones)
      [34, 22], [38, 11], [42, 0], [46, -11],
      [50, -22],
      [54, -11], [58, 0], [62, 11], [66, 22],
      [42, 6], [50, 6], [58, 6],
    ],
  },
  {
    name: "STAR",
    points: buildStarDroneFormation(),
  },
  {
    name: "TORCH",
    points: [
      // Sweeping Liberty flame (14 drones)
      [2, -44], [-5, -37], [7, -36], [-11, -29], [12, -28],
      [-14, -21], [14, -20], [-11, -14], [11, -14], [-5, -11],
      [5, -11], [0, -23], [-3, -31], [4, -18],
      // Torch gallery platform (10 drones)
      [-22, -7], [-17, -7], [-11, -7], [-5, -7], [0, -7],
      [5, -7], [11, -7], [17, -7], [22, -7], [0, -3],
      // Fluted torch handle & base (12 drones)
      [-9, 1], [9, 1], [-7, 9], [7, 9], [-6, 17], [6, 17],
      [-5, 25], [5, 25], [-4, 33], [4, 33], [-9, 39], [9, 39],
    ],
  },
  {
    name: "LIBERTY_BELL",
    points: [
      // Top yoke beam (5 drones)
      [-18, -32], [-9, -32], [0, -32], [9, -32], [18, -32],
      // Bell crown & waist (14 drones)
      [-15, -24], [-7, -25], [0, -25], [7, -25], [15, -24],
      [-18, -15], [18, -15], [-20, -5], [20, -5],
      [-24, 5], [24, 5], [-30, 14], [30, 14], [0, -15],
      // Flared bell lip (8 drones)
      [-35, 21], [-25, 22], [-15, 22], [-5, 22],
      [5, 22], [15, 22], [25, 22], [35, 21],
      // Clapper (3 drones) & iconic crack (6 drones)
      [-4, 29], [0, 31], [4, 29],
      [5, 19], [2, 13], [-2, 7], [2, 1], [-1, -5], [3, -10],
    ],
  },
];

export const SHAPED_FIREWORK_SHELLS = {
  star: buildStarShell(),
  heart: buildHeartShell(),
  saturn: buildSaturnShell(),
} as const;

// ============================================================================
// Statue of Liberty Christmas Color LED String Lights (exact skyline.png u,v)
// ============================================================================
export const LIBERTY_LED_STRANDS: Array<{
  u0: number;
  v0: number;
  um: number;
  vm: number;
  u1: number;
  v1: number;
  bulbs: number;
}> = [
  // 0. Torch gallery garland
  { u0: 0.050, v0: 0.558, um: 0.0535, vm: 0.566, u1: 0.057, v1: 0.558, bulbs: 4 },
  // 1. Crown garland
  { u0: 0.060, v0: 0.598, um: 0.066, vm: 0.608, u1: 0.072, v1: 0.598, bulbs: 5 },
  // 2. Upper toga sash
  { u0: 0.056, v0: 0.618, um: 0.067, vm: 0.646, u1: 0.078, v1: 0.654, bulbs: 6 },
  // 3. Lower draped robe festoon
  { u0: 0.077, v0: 0.674, um: 0.066, vm: 0.712, u1: 0.057, v1: 0.726, bulbs: 6 },
  // 4. Upper pedestal cornice garland
  { u0: 0.050, v0: 0.779, um: 0.0665, vm: 0.793, u1: 0.083, v1: 0.779, bulbs: 6 },
  // 5. Lower pedestal cornice garland
  { u0: 0.048, v0: 0.825, um: 0.0665, vm: 0.840, u1: 0.085, v1: 0.825, bulbs: 7 },
];

export const LIBERTY_LED_BULBS: Array<{
  u: number;
  v: number;
  colorIdx: number;
}> = (() => {
  const out: Array<{ u: number; v: number; colorIdx: number }> = [];
  let idx = 0;
  for (const s of LIBERTY_LED_STRANDS) {
    for (let k = 0; k < s.bulbs; k++) {
      const t = s.bulbs === 1 ? 0.5 : k / (s.bulbs - 1);
      const mt = 1 - t;
      const u = mt * mt * s.u0 + 2 * mt * t * s.um + t * t * s.u1;
      const v = mt * mt * s.v0 + 2 * mt * t * s.vm + t * t * s.v1;
      out.push({ u, v, colorIdx: idx % 5 });
      idx++;
    }
  }
  return out;
})();

// ============================================================================
// Meticulously Traced Empire State & One WTC Spire Contours (native 1994x789 px)
// ============================================================================
export const SPIRE_PIXEL_GEOMETRY = {
  esb: {
    tipPx: [1269.5, 127.5] as [number, number],
    // Slender antenna needle & tiered collar lines (topColor)
    antennaSegments: [
      [1269.5, 128, 1269.5, 178],
      [1269.1, 136, 1268.3, 153],
      [1269.9, 136, 1270.7, 153],
      [1267.3, 154, 1266.9, 177.5],
      [1271.7, 154, 1272.1, 177.5],
      [1267.1, 154, 1271.9, 154],
      [1266.9, 165.5, 1272.1, 165.5],
      [1266.5, 177.5, 1272.5, 177.5],
      // 102nd observation dome & gallery rings
      [1263.0, 183.5, 1269.5, 178.5],
      [1276.0, 183.5, 1269.5, 178.5],
      [1262.0, 186.0, 1277.0, 186.0],
      [1260.5, 191.5, 1278.5, 191.5],
      [1260.5, 196.5, 1278.5, 196.5],
    ] as Array<[number, number, number, number]>,
    // Exact 14-point stepped silhouette of the mooring mast (soft inner gradient wash, no border)
    mastWashPoly: [
      [1261.5, 197],
      [1277.5, 197],
      [1277.5, 218],
      [1280.5, 224],
      [1280.5, 232],
      [1283.5, 236],
      [1285.5, 243],
      [1288.5, 246],
      [1250.5, 246],
      [1253.5, 243],
      [1255.5, 236],
      [1258.5, 232],
      [1258.5, 224],
      [1261.5, 218],
    ] as Array<[number, number]>,
    // Crisp fluted vertical ribs & stepped art-deco buttress contours on mooring mast
    mastContourPolylines: [
      // Left stepped buttress wing
      [
        [1261.5, 197],
        [1261.5, 218],
        [1258.5, 224],
        [1258.5, 232],
        [1255.5, 236],
        [1253.5, 243],
        [1250.5, 246],
      ],
      // Right stepped buttress wing
      [
        [1277.5, 197],
        [1277.5, 218],
        [1280.5, 224],
        [1280.5, 232],
        [1283.5, 236],
        [1285.5, 243],
        [1288.5, 246],
      ],
      // Vertical illuminated mast flutes
      [[1265.3, 198], [1265.3, 245]],
      [[1269.5, 198], [1269.5, 245]],
      [[1273.7, 198], [1273.7, 245]],
      // Flared buttress inner ribs & base cornice
      [[1261.5, 220], [1256.2, 245]],
      [[1277.5, 220], [1282.8, 245]],
      [[1250.5, 246], [1288.5, 246]],
    ] as Array<Array<[number, number]>>,
    // 86th-floor stepped observatory parapet ledges (y = 247..259)
    parapetPolylines: [
      [
        [1250.5, 246.5],
        [1245.5, 250.5],
        [1245.5, 255.0],
        [1241.5, 259.0],
      ],
      [
        [1288.5, 246.5],
        [1293.5, 250.5],
        [1293.5, 255.0],
        [1297.5, 259.0],
      ],
      [[1245.5, 250.5], [1293.5, 250.5]],
      [[1245.5, 255.0], [1293.5, 255.0]],
      [[1241.5, 259.0], [1297.5, 259.0]],
    ] as Array<Array<[number, number]>>,
    // 81st-85th floor upper crown stone piers between the arched windows (y = 260.5..273.5)
    upperCrownPiersX: [1241.0, 1250.5, 1260.0, 1269.5, 1279.0, 1288.5, 1298.0],
    upperCrownY: [260.5, 273.5] as [number, number],
    upperCrownLedge: [1238.8, 273.8, 1300.2, 273.8] as [number, number, number, number],
    // 72nd-80th floor lower setback vertical pilasters between tall window recesses (y = 276..294.5)
    lowerCrownPiersX: [1235.5, 1245.5, 1255.0, 1264.8, 1274.2, 1284.0, 1293.5, 1303.5],
    lowerCrownY: [276.0, 294.5] as [number, number],
    lowerCrownLedge: [1234.5, 294.5, 1304.5, 294.5] as [number, number, number, number],
    // Next setback level down (y = 296..347.8: left & right fluted wings + central recessed spine)
    midTowerPiers: [
      [1233.2, 347.5, 302.0, true],
      [1239.2, 347.5, 297.5, false],
      [1246.2, 347.5, 297.5, false],
      [1254.8, 347.5, 297.5, false],
      [1264.8, 347.5, 295.8, false],
      [1274.5, 347.5, 295.8, false],
      [1284.5, 347.5, 297.5, false],
      [1291.5, 347.5, 297.5, false],
      [1298.5, 347.5, 297.5, false],
      [1305.5, 347.5, 297.5, true],
    ] as Array<[number, number, number, boolean]>,
    midTowerContourPolylines: [
      [
        [1258.5, 296.2],
        [1235.5, 296.2],
        [1235.5, 298.5],
        [1230.5, 302.5],
      ],
      [[1280.5, 296.2], [1308.5, 296.2]],
      [[1226.5, 347.8], [1259.5, 347.8]],
      [[1279.5, 347.8], [1312.5, 347.8]],
    ] as Array<Array<[number, number]>>,
  },
  liberty: {
    torchFlamePx: [106.5, 424.5] as [number, number],
    statueGlowPx: [132.0, 516.0] as [number, number],
  },
  wtc: {
    beaconPx: [1589.5, 67.5] as [number, number],
    // 6 slender vertical spire shaft segments (exact 1.2..2.2px widths, non-boxy!)
    shaftSegments: [
      { x: 1589.5, y0: 62.5, y1: 73.0, wPx: 1.5 },
      { x: 1589.5, y0: 73.0, y1: 88.5, wPx: 1.15 },
      { x: 1589.5, y0: 93.5, y1: 109.0, wPx: 1.35 },
      { x: 1589.5, y0: 113.0, y1: 123.5, wPx: 1.5 },
      { x: 1589.5, y0: 127.0, y1: 138.5, wPx: 1.65 },
      { x: 1589.5, y0: 142.0, y1: 155.0, wPx: 1.85 },
    ],
    // 5 horizontal radome collar rings
    collarRings: [
      [1587.2, 91.0, 1591.8, 91.0],
      [1586.2, 111.0, 1592.8, 111.0],
      [1585.8, 125.2, 1593.2, 125.2],
      [1585.3, 140.2, 1593.7, 140.2],
      [1584.5, 157.0, 1594.5, 157.0],
    ] as Array<[number, number, number, number]>,
    // Structural tripod struts & perspective-sloped rooftop communication rings
    baseStruts: [
      [1589.5, 158.0, 1589.5, 186.0],
      [1586.0, 159.0, 1577.5, 186.0],
      [1593.0, 159.0, 1601.5, 186.0],
    ] as Array<[number, number, number, number]>,
    slopedPodiumRings: [
      [1567.5, 191.0, 1588.0, 186.2],
      [1591.0, 186.2, 1611.5, 191.0],
      [1567.5, 195.2, 1588.0, 190.4],
      [1591.0, 190.4, 1611.5, 195.2],
    ] as Array<[number, number, number, number]>,
  },
  // Night-mode architectural crown & spire lighting across the other NYC landmark towers (native 1994x789 px)
  nightCrowns: {
    // 1. Chrysler Building Art Deco terraced sunburst arches, chevron ribs & needle spire (x=978..1028, y=185..340)
    chryslerWashPoly: [
      [1002.5, 226],
      [1009.0, 256],
      [1016.0, 286],
      [1025.0, 318],
      [1028.0, 340],
      [978.0, 340],
      [982.0, 318],
      [990.0, 286],
      [997.0, 256],
    ] as Array<[number, number]>,
    chryslerPolylines: [
      // Needle spire & upper finial
      [[1002.5, 185.5], [1002.5, 238.0]],
      // 6 terraced Art Deco parabolic sunburst arches
      [[999.2, 248.0], [1002.5, 236.5], [1006.2, 248.0]],
      [[996.2, 263.0], [1002.5, 247.5], [1009.5, 263.0]],
      [[992.5, 279.0], [1003.0, 260.5], [1014.0, 279.0]],
      [[988.5, 296.0], [1003.0, 274.5], [1018.0, 296.0]],
      [[984.5, 314.0], [1003.0, 290.5], [1022.0, 314.0]],
      [[980.5, 332.0], [1003.0, 307.5], [1026.0, 332.0]],
      // Radiating Art Deco sunburst chevron ribs + eagle setback ledges
      [[1003.0, 262.0], [1003.0, 332.0]],
      [[997.5, 282.0], [992.0, 332.0]],
      [[1008.5, 282.0], [1014.0, 332.0]],
      [[978.0, 334.0], [1028.0, 334.0]],
      [[978.0, 340.0], [1028.0, 340.0]],
    ] as Array<Array<[number, number]>>,
    chryslerTipPx: [1002.5, 185.5] as [number, number],

    // 2. Diagonal Glass Atrium Skyscraper (1 Bryant Park / Citigroup style, x=876..936, y=238..286) + adjacent glass parapet
    diagonalAtriumWashPoly: [
      [876.5, 238.5],
      [936.0, 286.0],
      [876.5, 286.0],
    ] as Array<[number, number]>,
    coolGlassCrownPolylines: [
      // Diagonal atrium crown & vertical glass fins
      [[876.5, 286.0], [876.5, 238.5], [936.0, 286.0], [876.5, 286.0]],
      [[891.5, 250.5], [891.5, 286.0]],
      [[906.5, 262.5], [906.5, 286.0]],
      [[921.5, 274.5], [921.5, 286.0]],
      // Adjacent Midtown glass tower rooftop crown (x=814..872, y=293..304)
      [[814.0, 293.5], [871.5, 293.5]],
      [[814.0, 303.5], [871.5, 303.5]],
      // Left Midtown stepped glass penthouse (x=629..713, y=357..373)
      [[673.0, 357.0], [706.0, 357.0]],
      [[652.0, 360.5], [706.0, 360.5]],
      [[629.0, 372.5], [713.0, 372.5]],
      // Mid-right modern glass slab penthouse (x=1445..1510, y=399..413)
      [[1451.0, 399.5], [1506.0, 399.5]],
      [[1445.0, 412.5], [1510.0, 412.5]],
      // Right Financial District glass tower penthouse crown (x=1853..1896, y=434..458)
      [[1853.0, 434.5], [1890.0, 434.5]],
      [[1853.0, 450.5], [1895.0, 450.5]],
      [[1853.0, 458.5], [1896.0, 458.5]],
    ] as Array<Array<[number, number]>>,

    // 3. Warm-gold Historic Landmark Crowns: Woolworth/40 Wall Pyramid, Paramount Ziggurat & Downtown Spires
    woolworthWashPoly: [
      [1692.5, 352.0],
      [1720.0, 407.5],
      [1664.0, 407.5],
    ] as Array<[number, number]>,
    warmGoldCrownPolylines: [
      // Paramount / Midtown stepped ziggurat lantern (x=1087..1132, y=375..413)
      [[1106.0, 380.0], [1114.5, 380.0]],
      [[1102.0, 386.0], [1117.5, 386.0]],
      [[1102.0, 392.5], [1119.0, 392.5]],
      [[1089.5, 396.5], [1131.0, 396.5]],
      [[1087.0, 412.5], [1132.0, 412.5]],
      // Woolworth / 40 Wall pyramidal roof, central ridge & neo-Gothic colonnade ledges (x=1663..1720, y=350..437)
      [[1664.0, 407.5], [1692.5, 352.0], [1720.0, 407.5]],
      [[1692.5, 352.0], [1692.5, 407.5]],
      [[1663.5, 407.5], [1720.0, 407.5]],
      [[1663.0, 413.5], [1720.5, 413.5]],
      [[1663.0, 436.5], [1720.0, 436.5]],
      // Mid-right stepped pyramid tower (x=1476..1498, y=492..534)
      [[1487.0, 492.0], [1478.0, 522.0], [1496.0, 522.0], [1487.0, 492.0]],
      // Right downtown cupola spire (x=1772..1785, y=480..514)
      [[1778.0, 480.0], [1778.0, 500.0]],
      [[1772.0, 512.0], [1778.0, 498.0], [1784.0, 512.0]],
    ] as Array<Array<[number, number]>>,
    warmGoldPiers: [
      // Woolworth upper colonnade vertical floodlit piers
      [1668.5, 436.0, 414.0],
      [1679.5, 436.0, 414.0],
      [1691.5, 436.0, 414.0],
      [1703.5, 436.0, 414.0],
      [1714.5, 436.0, 414.0],
      // Paramount upper colonnade vertical floodlit piers
      [1094.0, 412.0, 397.0],
      [1104.5, 412.0, 397.0],
      [1115.5, 412.0, 397.0],
      [1126.0, 412.0, 397.0],
    ] as Array<[number, number, number]>,
    // Glowing oculus dormers & lantern cupolas (warm gold)
    warmLanternPointsPx: [
      [1110.0, 376.5], // Paramount lantern apex
      [1692.5, 353.0], // Woolworth cupola lantern
      [1679.0, 396.5], // Woolworth left oculus dormer
      [1699.0, 396.5], // Woolworth right oculus dormer
    ] as Array<[number, number]>,
    // Subtle pulsing red FAA aviation obstruction beacons on secondary skyline peaks
    aviationBeaconsPx: [
      [438.5, 480.5],  // West Side steeple antenna
      [876.5, 238.5],  // Diagonal atrium tower apex
      [1778.0, 480.0], // Downtown cupola spire tip
    ] as Array<[number, number]>,
  },
} as const;

export const CITY_DETAIL_PATHS = {
  cityDetails: {
    // ------------------------------------------------------------------------
    // HALLOWEEN — Liberty Hanging Bats, Waterfront Pumpkins & Black Cats
    // ------------------------------------------------------------------------
    libertyBat: {
      // Gripping claws at (0,0), upside-down body + pointy bat ears at y=10..13
      body:
        "M -1.6 0 L -1.6 2.6 M 1.6 0 L 1.6 2.6 " +
        "M 0 2.2 C 3.2 2.2 4 6 2.8 9.6 L 3.8 13 L 1.3 10.6 L -1.3 10.6 L -3.8 13 L -2.8 9.6 C -4 6 -3.2 2.2 0 2.2 Z",
      wingLeft:
        "M -2.2 4.2 C -7.5 2.5 -12.5 5.5 -13.5 10.5 C -10.5 9.2 -8.2 9.8 -6.5 11.4 C -5 9.6 -3.6 9.2 -2.4 9.2 Z",
      wingRight:
        "M 2.2 4.2 C 7.5 2.5 12.5 5.5 13.5 10.5 C 10.5 9.2 8.2 9.8 6.5 11.4 C 5 9.6 3.6 9.2 2.4 9.2 Z",
    },

    waterfrontPumpkin: {
      // Grounded at y = 0 along waterfront seawall
      singleOutline:
        "M 0 -11.5 C 5.8 -12 8.2 -8.2 8 -4.4 C 7.8 -0.8 4.8 0.2 0 0 " +
        "C -4.8 0.2 -7.8 -0.8 -8 -4.4 C -8.2 -8.2 -5.8 -12 0 -11.5 Z " +
        "M -0.6 -11.5 C -0.8 -14.2 1.4 -15.4 2.8 -14.2",
      singleRibs:
        "M -3 -11.2 C -4.4 -7.5 -4.4 -3.2 -2.8 -0.2 M 3 -11.2 C 4.4 -7.5 4.4 -3.2 2.8 -0.2",
      singleFace:
        "M -4.2 -6.8 L -2.4 -8.4 L -1.4 -6.4 Z M 1.4 -6.4 L 2.4 -8.4 L 4.2 -6.8 Z " +
        "M -4.4 -3.6 L -2.4 -2.3 L -0.8 -3.4 L 0.8 -2.3 L 2.4 -3.4 L 4.4 -3.2 C 3 -1.2 -3 -1.2 -4.4 -3.6 Z",
      pairOutline:
        "M -3.5 -12.5 C 1.8 -13 4.2 -9 4 -4.6 C 3.8 -0.8 1.2 0.2 -3.5 0 " +
        "C -8.2 0.2 -10.8 -0.8 -11 -4.6 C -11.2 -9 -8.8 -13 -3.5 -12.5 Z " +
        "M -4 -12.5 C -4.2 -15.2 -2 -16.2 -0.8 -15 " +
        "M 5.6 -8.4 C 9.2 -8.6 10.8 -5.8 10.6 -3.2 C 10.4 -0.6 8.4 0.2 5.6 0 " +
        "C 2.8 0.2 1 -0.6 0.8 -3.2 C 0.6 -5.8 2.2 -8.6 5.6 -8.4 Z M 5.5 -8.4 L 6.4 -10.4",
      pairFace:
        "M -7.2 -7.4 L -5.6 -8.9 L -4.6 -7 Z M -2.4 -7 L -1.4 -8.9 L 0.2 -7.4 Z " +
        "M -7.2 -4 C -5 -2.2 -2 -2.2 0.2 -4 " +
        "M 3.6 -4.8 L 4.6 -5.8 L 5.2 -4.6 Z M 6.4 -4.6 L 7.2 -5.8 L 8 -4.8 Z M 3.8 -2.4 Q 5.8 -1.2 7.8 -2.4",
    },

    blackCat: {
      // Facing +X, paws touching promenade at y = 0
      bodyAndHead:
        "M -6.8 -5.2 C -6.2 -9.2 -2.2 -10.2 1.8 -8.2 L 4.2 -9.8 L 4.6 -12.8 L 6.4 -10.4 " +
        "L 8 -12.6 L 8.2 -9.4 C 9.8 -8.4 9.8 -6.2 7.8 -5.6 L 4.8 -5 C 2.2 -3.8 -3.6 -3.8 -6.8 -5.2 Z",
      whiskers: "M 8.8 -7.4 L 11.4 -8 M 8.8 -6.6 L 11.4 -6.4",
      tail: "M -6.4 -6.4 C -10.2 -9.6 -8.8 -14.8 -11.6 -17.4",
      frontLegsA: "M 3.8 -4.8 L 6.4 0 M 2.4 -4.8 L 0.4 0",
      hindLegsA: "M -4.4 -4.8 L -2.2 0 M -5.8 -4.8 L -8.4 0",
    },

    // ------------------------------------------------------------------------
    // DIWALI — Glowing Window Candles
    // ------------------------------------------------------------------------
    windowCandle: {
      waxPillar: "M -1.7 3.5 L -1.7 -1.2 L 1.7 -1.2 L 1.7 3.5 Z M -3 3.5 L 3 3.5",
      flame: "M 0 -1.6 C -2.1 -3.6 -1.4 -6.2 0 -7.6 C 1.4 -6.2 2.1 -3.6 0 -1.6 Z",
      rays: "M -4.4 -4.6 L -3.1 -4.6 M 4.4 -4.6 L 3.1 -4.6 M 0 -9.8 L 0 -8.5",
    },

    // ------------------------------------------------------------------------
    // CHRISTMAS & WINTER — Building Wreaths & Waterfront Snowmen
    // ------------------------------------------------------------------------
    buildingWreath: {
      hollyRing: buildScallopedWreath(10, 7.2, 3.1),
      bowAndTails:
        "M 0 5.8 L -4.2 3.8 L -3.8 7.8 Z M 0 5.8 L 4.2 3.8 L 3.8 7.8 Z " +
        "M -0.8 6.2 L -3.2 11.6 M 0.8 6.2 L 3.2 11.6",
    },

    waterfrontSnowman: {
      // Three stacked snowballs grounded at y = 0
      bodyBalls:
        "M -5.4 -5 A 5.4 5 0 1 0 5.4 -5 A 5.4 5 0 1 0 -5.4 -5 " +
        "M -4.0 -12.6 A 4.0 3.8 0 1 0 4.0 -12.6 A 4.0 3.8 0 1 0 -4.0 -12.6 " +
        "M -3.0 -19.0 A 3.0 2.9 0 1 0 3.0 -19.0 A 3.0 2.9 0 1 0 -3.0 -19.0",
      coalAndButtons:
        "M -1.0 -19.8 A 0.45 0.45 0 1 0 -0.1 -19.8 M 1.1 -19.8 A 0.45 0.45 0 1 0 2.0 -19.8 " +
        "M 0 -14.0 A 0.45 0.45 0 1 0 0.9 -14.0 M 0 -11.6 A 0.45 0.45 0 1 0 0.9 -11.6 M 0 -6.4 A 0.45 0.45 0 1 0 0.9 -6.4",
      carrotNose: "M 0.8 -19.0 L 5.2 -18.2 L 0.8 -17.6 Z",
      scarf:
        "M -3.0 -16.2 Q 0 -15.2 3.0 -16.2 M -1.8 -15.8 L -3.6 -10.8 M -0.4 -15.8 L -1.2 -11.4",
      leftTwigArm: "M -3.8 -13.2 L -8.8 -15.8 M -7.2 -15.0 L -8.6 -17.2",
      rightTwigArm: "M 0 0 L 5.4 -3.6 M 3.6 -2.4 L 4.8 -4.8 M 3.6 -2.4 L 5.8 -1.8",
      topHat:
        "M -4.2 -21.5 L 4.2 -21.5 M -2.7 -21.5 L -2.4 -26.8 L 2.4 -26.8 L 2.7 -21.5",
      topHatBand: "M -2.6 -22.6 L 2.6 -22.6",
      beanie:
        "M -3.2 -20.8 C -3.0 -24.8 3.0 -24.8 3.2 -20.8 Z M -0.9 -25.2 A 1.1 1.1 0 1 0 1.3 -25.2 A 1.1 1.1 0 1 0 -0.9 -25.2",
    },

    // ------------------------------------------------------------------------
    // WINTER — Frozen Icicles Draping off the Statue of Liberty & Torch
    // ------------------------------------------------------------------------
    libertyIcicles: [
      // Variant 0: Torch & narrow ledge cluster
      "M -4.6 0 L 4.6 0 M -4.2 0 L -3.1 8.6 L -2.0 0 " +
        "M -1.6 0 L -0.3 12.6 L 1.0 0 M 1.4 0 L 2.6 7.6 L 3.9 0",
      // Variant 1: Medium crown / parapet icicle fringe
      "M -7.6 0 L 7.6 0 M -7.1 0 L -5.8 7.4 L -4.6 0 " +
        "M -4.2 0 L -2.8 11.6 L -1.4 0 M -1.0 0 L 0.2 7.0 L 1.4 0 " +
        "M 1.8 0 L 3.3 10.8 L 4.7 0 M 5.1 0 L 6.3 6.6 L 7.3 0",
      // Variant 2: Wide pedestal cornice icicle curtain
      "M -12.6 0 L 12.6 0 M -12.0 0 L -10.6 8.0 L -9.2 0 " +
        "M -8.6 0 L -7.0 12.8 L -5.4 0 M -4.8 0 L -3.5 7.4 L -2.2 0 " +
        "M -1.6 0 L 0.0 13.8 L 1.6 0 M 2.2 0 L 3.5 8.2 L 4.8 0 " +
        "M 5.4 0 L 7.0 11.8 L 8.6 0 M 9.2 0 L 10.6 7.4 L 12.0 0",
    ],
  },
} as const;
