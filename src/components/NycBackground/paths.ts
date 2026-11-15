// ============================================================================
// Hand-crafted SVG <path d="..."> line-drawing catalog for NycHero / miraj.dev
//
// Canonical orientation:
//   Every newly authored sprite faces +X (right) in local space so horizontal
//   direction mirroring (`scale(dir * s, s)`) always points forward.
// ============================================================================

import { CITY_DETAIL_PATHS } from "./pathsCityDetails";
import { SPRING_SUMMER_PATHS } from "./pathsSpringSummer";

function buildSixFoldSnowflake(
  armSegments: Array<[number, number, number, number]>,
): string {
  const cmds: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const rot = (x: number, y: number) => {
      const rx = +(x * cos - y * sin).toFixed(2);
      const ry = +(x * sin + y * cos).toFixed(2);
      return `${rx} ${ry}`;
    };
    for (const [x1, y1, x2, y2] of armSegments) {
      cmds.push(`M ${rot(x1, y1)} L ${rot(x2, y2)}`);
    }
  }
  return cmds.join(" ");
}

export const SVG_PATHS = {
  // --------------------------------------------------------------------------
  // Shared NYC sky & harbor line art
  // --------------------------------------------------------------------------
  cloud:
    "M -18 18 C -29 18 -34 8 -27 -1 C -24 -12 -12 -16 -3 -10 " +
    "C 4 -24 24 -25 32 -11 C 43 -13 53 -4 50 7 C 56 13 51 18 42 18 Z",

  ships: {
    ferry:
      "M -35 0 L 35 0 L 30 10 L -30 10 Z " +
      "M -30 0 L -25 -12 L 25 -12 L 30 0 Z " +
      "M -20 -12 L -15 -20 L 15 -20 L 20 -12 Z " +
      "M -15 -6 L -10 -6 M -5 -6 L 0 -6 M 5 -6 L 10 -6 M 15 -6 L 20 -6",

    catamaran:
      "M -35 0 L 25 0 L 35 -10 L 25 -10 L 25 0 Z " +
      "M -30 0 L -25 -15 L 15 -15 L 25 -10 L 25 0 Z " +
      "M -15 -15 L -10 -22 L 5 -22 L 10 -15 Z " +
      "M -10 -7 L 10 -7",

    tugboat:
      "M -20 0 L 15 0 L 20 -5 L 20 5 L -15 5 Z " +
      "M -5 0 L -5 -12 L 8 -12 L 8 0 Z " +
      "M -2 -12 L -2 -18 L 2 -18 L 2 -12 Z " +
      "M 2 -6 L 5 -6",

    cargo:
      "M -40 0 L 40 0 L 35 6 L -35 6 Z " +
      "M -30 0 L -30 -10 L -10 -10 L -10 0 Z " +
      "M -5 0 L -5 -15 L 15 -15 L 15 0 Z " +
      "M 25 0 L 25 -12 L 35 -12 L 35 0 Z " +
      "M -35 0 L -35 -18 L -30 -18 L -30 0 Z",

    sailboat:
      "M -15 0 L 15 0 Q 0 8 -15 0 Z M 0 -5 L 0 -35 L 15 -5 Z M 0 0 L 0 -5",
  },

  // Night-mode cabin windows, maritime navigation lights & water reflections for standard ships
  shipNightLights: {
    ferry: {
      windows:
        "M -20 -6 L -15 -6 M -10 -6 L -5 -6 M 0 -6 L 5 -6 M 10 -6 L 15 -6 M -11 -16 L -4 -16 M 4 -16 L 11 -16",
      reflection: "M -28 12.5 L 28 12.5 M -18 15 L 18 15",
      bowLight: [31, -2] as [number, number],
      sternLight: [-31, -2] as [number, number],
      mastLight: [0, -22] as [number, number],
    },
    catamaran: {
      windows: "M -19 -7.5 L 12 -7.5 M -8 -18.5 L 4 -18.5",
      reflection: "M -26 3.5 L 24 3.5 M -16 6 L 14 6",
      bowLight: [32, -9] as [number, number],
      sternLight: [-31, -2] as [number, number],
      mastLight: [-2, -24] as [number, number],
    },
    tugboat: {
      windows: "M -2 -6.5 L 5 -6.5 M -13 2.5 L -11 2.5 M -6 2.5 L -4 2.5",
      reflection: "M -16 7.5 L 16 7.5",
      bowLight: [18, -4] as [number, number],
      sternLight: [-17, -1] as [number, number],
      mastLight: [0, -20.5] as [number, number],
    },
    cargo: {
      windows:
        "M -34 -15 L -31 -15 M -34 -11 L -31 -11 M -28 -3 L -24 -3 M 27 -9 L 33 -9",
      reflection: "M -34 8.5 L 34 8.5 M -22 11 L 22 11",
      bowLight: [37, -1] as [number, number],
      sternLight: [-37, -1] as [number, number],
      mastLight: [-32.5, -20] as [number, number],
    },
    sailboat: {
      windows: "M -5 2.5 L -2 2.5 M 2 2.5 L 5 2.5",
      reflection: "M -12 8.5 L 12 8.5",
      bowLight: [13, -1] as [number, number],
      sternLight: [-13, -1] as [number, number],
      mastLight: [0, -36] as [number, number],
    },
  },

  // Iconic Orange Staten Island Ferry (double-ended Molinari/Ollis class NYC harbor ferry)
  statenIslandFerry: {
    hull:
      "M -52 1 L -46 -1 L 46 -1 L 52 1 L 47 9 L -47 9 Z",
    rubRailAndPortals:
      "M -49 4.5 L 49 4.5 " +
      "M -44 9 L -40 1 L -35 1 L -35 9 " +
      "M 35 9 L 35 1 L 40 1 L 44 9",
    lowerDeck:
      "M -41 -1 L -38 -11 L 38 -11 L 41 -1 Z",
    upperDeck:
      "M -34 -11 L -32 -19.5 L 32 -19.5 L 34 -11 Z " +
      "M -35 -11 L 35 -11 M -33 -19.5 L 33 -19.5",
    pilotHousesAndStack:
      // Symmetric aft & forward double-ended wheelhouses + central funnel stack & radar mast
      "M -28 -19.5 L -29.5 -25.5 L -18 -25.5 L -17 -19.5 Z " +
      "M 17 -19.5 L 18 -25.5 L 29.5 -25.5 L 28 -19.5 Z " +
      "M -30.5 -25.5 L -17 -25.5 M 17 -25.5 L 30.5 -25.5 " +
      "M -4.2 -19.5 L -3.4 -28 L 3.4 -28 L 4.2 -19.5 Z " +
      "M -3.6 -25.5 L 3.6 -25.5 M 0 -28 L 0 -34 M -2.5 -31.5 L 2.5 -31.5",
    lowerWindows:
      "M -32 -6 L -28 -6 M -24.5 -6 L -20.5 -6 M -17 -6 L -13 -6 " +
      "M -9.5 -6 L -5.5 -6 M -2 -6 L 2 -6 M 5.5 -6 L 9.5 -6 " +
      "M 13 -6 L 17 -6 M 20.5 -6 L 24.5 -6 M 28 -6 L 32 -6",
    upperWindows:
      "M -27 -15.2 L -23 -15.2 M -19.8 -15.2 L -15.8 -15.2 " +
      "M -12.6 -15.2 L -8.6 -15.2 M -5.4 -15.2 L -1.4 -15.2 " +
      "M 1.4 -15.2 L 5.4 -15.2 M 8.6 -15.2 L 12.6 -15.2 " +
      "M 15.8 -15.2 L 19.8 -15.2 M 23 -15.2 L 27 -15.2",
    bridgeWindows:
      "M -27.5 -22.8 L -20 -22.8 M 20 -22.8 L 27.5 -22.8",
    wakeRipples:
      "M -54 9.5 Q -68 7.5 -82 10.5 M -50 12 Q -30 13.5 0 12.5 Q 30 11.5 50 12.5",
  },

  helicopter: {
    body:
      "M -15 0 A 15 8 0 1 0 15 0 A 15 8 0 1 0 -15 0 " +
      "M 3 -7 Q 13 -5 14 1 L 3 1 Z " +
      "M -15 0 L -30 -5 L -32 -11 M -34 -8 L -29 -13 " +
      "M -9 8 L -9 11 M 7 8 L 7 11 M -14 11 L 13 11 Q 16 11 17 8 " +
      "M 0 -8 L 0 -12",
  },

  // --------------------------------------------------------------------------
  // Kai the Floppy-Eared Dog — shared canonical anatomy across all seasons
  // --------------------------------------------------------------------------
  kaiDog: {
    body:
      "M 18 -22 C 30 -48 58 -70 92 -76 C 126 -82 163 -72 184 -52 " +
      "C 202 -35 207 -12 201 8 C 194 30 173 40 148 42 " +
      "C 121 44 94 36 76 23 C 67 40 56 57 42 66 " +
      "C 26 76 8 75 -3 65 C -14 55 -10 39 3 32 " +
      "C 14 26 25 25 32 17 C 28 5 23 -9 18 -22 Z",
    ear:
      "M 48 -47 C 45 -27 37 -7 25 8 C 13 23 -3 34 -18 38 " +
      "C -34 42 -45 36 -48 26 C -52 13 -42 4 -29 1 " +
      "C -15 -2 -1 -6 8 -17 C 17 -28 22 -42 26 -56",
    chest:
      "M 75 18 C 79 40 87 60 101 75 C 113 88 125 100 126 115 " +
      "C 127 128 117 138 104 140 C 88 142 75 132 67 118 " +
      "C 57 101 52 78 48 59",
    belly:
      "M 47 59 C 32 67 21 81 19 96 C 17 112 25 127 39 135 " +
      "C 52 143 68 143 79 135",
    tail:
      "M 53 67 C 34 78 15 83 -4 80 C -23 77 -36 68 -39 57 " +
      "C -42 47 -35 40 -26 41 C -17 42 -12 49 -4 53 C 5 57 16 53 28 46",
    nose:
      "M 188 -8 C 198 -13 209 -8 212 1 C 215 10 208 19 198 20 " +
      "C 188 20 181 13 181 5 C 181 -1 184 -6 188 -8 Z",
    face:
      "M 91 -29 C 97 -36 106 -36 113 -30 " +
      "M 134 -34 C 142 -39 151 -37 158 -31 " +
      "M 97 16 C 100 28 113 35 129 37 C 147 39 164 36 177 30 " +
      "M 97 16 C 95 12 95 9 98 6",
    legs:
      "M 89 74 C 82 93 80 112 84 128 C 88 143 99 152 112 151 " +
      "C 126 150 136 141 139 129 C 143 115 138 102 128 91 " +
      "M 112 151 C 120 159 128 164 137 164 C 147 164 155 160 159 153 " +
      "C 164 145 162 138 156 134 C 150 130 143 133 139 139 " +
      "M 48 82 C 39 99 36 117 40 133 C 44 149 55 158 69 158 " +
      "C 82 158 92 149 95 138 C 99 124 94 111 86 99 " +
      "M 69 158 C 77 165 86 169 96 168 C 106 167 113 161 116 153 " +
      "C 119 145 115 139 108 137 C 101 135 95 140 92 146",
    hands:
      "M 168 78 C 175 68 185 65 194 70 C 202 74 204 83 200 91 " +
      "C 196 99 187 102 178 98 L 166 93 C 161 90 163 83 168 78 Z " +
      "M 138 96 C 144 87 153 84 161 88 C 169 92 172 100 168 108 " +
      "C 164 116 156 120 147 117 L 135 111 C 130 108 132 101 138 96 Z " +
      "M 187 70 C 194 66 201 69 205 75 " +
      "M 181 96 C 188 102 197 104 204 100 " +
      "M 154 88 C 161 84 168 87 172 93",
    collar:
      "M 63 13 C 78 26 95 33 113 36 C 130 39 147 37 160 30",
    diamondTag: "M 128 34 L 131 52 L 141 60 L 151 52 L 148 34 Z",
  },

  // --------------------------------------------------------------------------
  // HALLOWEEN (preserved)
  // --------------------------------------------------------------------------
  witch:
    "M -2 -12 L 8 -12 M 1 -12 L 6 -22 L 7 -12 " +
    "M 3 -12 L 7 -2 L -1 1 Z " +
    "M -1 -2 Q -10 2 -15 -3 Q -10 0 -2 3 " +
    "M -20 4 L 15 0 " +
    "M -20 4 L -28 1 M -20 4 L -30 5 M -20 4 L -26 9",

  charonFerry: {
    hull:
      "M -35 0 L 35 0 Q 38 10, 0 10 Q -32 10, -35 0 Z " +
      "M -30 0 L 30 0 M -28 0 Q 0 8, 28 0",
    skeleton:
      "M -35 0 C -38 -5, -32 -10, -28 -5 " +
      "M -34 -2 Q -35 -4, -33 -4 Q -31 -4, -32 -2 " +
      "M -31 -6 L -29 -6 M -33 -1 L -31 -1 " +
      "M 4 -36 C 3 -44, 13 -44, 12 -36 L 10 -34 L 6 -34 Z " +
      "M 5.5 -38.5 a 1.2 1.2 0 1 0 2.4 0 a 1.2 1.2 0 1 0 -2.4 0 " +
      "M 6 -34 L 6 -35.5 M 8 -34 L 8 -35.5 M 10 -34 L 10 -35.5 " +
      "M 8 -34 L 8 -14 M 3 -31 L 13 -31 " +
      "M 4 -29 Q 8 -27, 12 -29 M 4.5 -26 Q 8 -24, 11.5 -26 M 5 -23 Q 8 -21, 11 -23 " +
      "M 4 -14 Q 8 -10, 12 -14 L 11 -12 Q 8 -9, 5 -12 Z " +
      "M 5 -12 L 4 -6 L 4 0 M 11 -12 L 12 -6 L 12 0 " +
      "M 4 0 L 0 0 M 12 0 L 8 0 " +
      "M -40 8 Q -20 12, 0 10 Q 20 8, 40 10",
    oar: "M -11 0 L 60 0 M 47 -2 L 52 -8 L 60 -8 L 60 8 L 52 8 L 47 2 Z",
  },

  dogWizardGear: {
    broom:
      "M 8 168 C 58 147 110 123 161 96 C 209 70 250 42 287 16 " +
      "C 313 -2 337 -22 354 -42 C 365 -55 373 -59 380 -55 " +
      "C 388 -50 388 -41 382 -31 C 372 -14 355 1 336 15 " +
      "C 300 41 260 64 219 87 C 168 116 116 139 63 162 " +
      "C 43 171 24 173 8 168 Z",
    broomGrain:
      "M 288 24 C 306 14 322 3 337 -10 " +
      "M 303 7 C 320 -4 333 -16 342 -27 " +
      "M 330 -10 C 340 -18 348 -27 355 -37",
    bristles:
      "M 9 168 C -4 159 -17 155 -31 157 C -49 159 -66 167 -82 177 " +
      "C -101 189 -120 197 -141 199 C -127 206 -114 209 -99 208 " +
      "C -117 216 -134 225 -150 226 C -134 234 -118 237 -101 234 " +
      "C -119 243 -134 253 -147 264 C -127 267 -108 263 -90 257 " +
      "C -106 269 -119 282 -128 296 C -106 292 -85 282 -68 270 " +
      "C -81 286 -88 301 -89 316 C -69 306 -52 293 -37 277 " +
      "C -48 294 -52 308 -50 322 C -32 309 -18 292 -7 273 " +
      "C -13 290 -12 303 -8 313 C 9 294 19 270 23 246 " +
      "C 28 220 24 187 9 168 Z " +
      "M 1 177 C -20 198 -46 214 -74 226 " +
      "M 11 188 C -9 211 -32 232 -57 246 " +
      "M 17 201 C 1 224 -16 246 -35 265 " +
      "M 21 216 C 10 239 -2 258 -14 275",
    cape:
      "M 76 43 C 57 37 39 36 21 40 C 0 44 -20 53 -38 67 " +
      "C -57 82 -73 100 -83 120 C -68 113 -52 109 -38 108 " +
      "C -50 119 -59 131 -65 144 C -47 137 -28 135 -8 137 " +
      "C -26 147 -39 159 -45 172 C -20 166 5 160 29 162 " +
      "C 10 173 -1 184 -6 196 C 20 187 45 178 66 165 " +
      "C 91 151 110 134 124 116 C 134 104 139 91 137 80 " +
      "C 134 65 119 51 101 46 Z",
    capeFold1: "M 21 42 C 39 53 58 58 80 57 C 99 56 116 50 127 43",
    capeFold2: "M 42 62 C 27 80 8 96 -14 106",
    capeFold3: "M 60 70 C 44 91 25 109 4 122",
    capeFold4: "M 79 78 C 63 100 46 119 26 134",
    clasp:
      "M 115 31 C 121 25 130 25 136 31 C 142 37 142 46 136 52 " +
      "C 130 58 121 58 115 52 C 109 46 109 37 115 31 Z",
    hat:
      "M 39 -59 C 34 -77 27 -96 18 -111 C 10 -124 7 -136 13 -144 " +
      "C 20 -154 37 -157 55 -154 C 78 -151 100 -140 116 -127 " +
      "C 132 -114 144 -99 157 -87 C 174 -94 193 -98 211 -97 " +
      "C 226 -96 239 -92 244 -85 C 249 -77 243 -68 232 -60 " +
      "C 214 -48 192 -41 169 -35 C 143 -29 116 -22 91 -15 L 58 -8 Z",
    hatDetails:
      "M 38 -59 C 62 -68 87 -77 111 -85 C 138 -94 165 -103 192 -108 " +
      "C 214 -112 235 -111 246 -105 C 252 -101 252 -96 247 -90 " +
      "C 236 -74 215 -61 192 -51 C 166 -40 139 -33 112 -27 " +
      "C 83 -20 58 -14 40 -7 C 30 -3 20 -5 18 -12 C 16 -20 25 -38 38 -59 " +
      "M 51 -70 C 70 -76 91 -83 111 -91 C 128 -97 145 -104 158 -110 " +
      "L 179 -81 C 158 -73 136 -66 115 -60 C 93 -53 73 -47 55 -42 Z " +
      "M 139 -99 L 158 -106 C 164 -108 168 -104 171 -99 L 177 -85 " +
      "C 179 -80 176 -76 171 -74 L 151 -68 C 146 -67 142 -70 141 -75 " +
      "L 135 -91 C 133 -95 135 -98 139 -99 Z " +
      "M 144 -94 L 159 -99 L 164 -82 L 149 -78 Z",
  },

  // --------------------------------------------------------------------------
  // THANKSGIVING — Macy's Parade over Manhattan & Autumn Harbor
  // --------------------------------------------------------------------------
  paradeBalloons: {
    // Giant Macy's Parade Turkey Balloon (facing +X)
    turkey: {
      tailFan:
        "M -18 -14 C -36 -38 -56 -46 -64 -34 C -70 -26 -62 -14 -48 -8 " +
        "C -66 -16 -78 -8 -76 4 C -74 14 -60 16 -44 10 " +
        "C -60 14 -66 26 -56 34 C -46 40 -30 30 -18 16 " +
        "M -12 -18 C -24 -48 -42 -60 -52 -50 C -58 -42 -48 -28 -34 -16 " +
        "M -6 -20 C -10 -52 -24 -66 -36 -58 C -42 -52 -34 -36 -22 -20",
      tailRibs:
        "M -20 -12 L -56 -34 M -22 -4 L -68 2 M -20 6 L -52 28 " +
        "M -14 -16 L -44 -46 M -8 -18 L -28 -54",
      body:
        "M -28 -6 C -28 -28 -6 -42 18 -38 C 36 -35 46 -20 44 0 " +
        "C 42 20 24 32 0 32 C -18 32 -28 16 -28 -6 Z " +
        "M 30 -24 C 34 -38 42 -48 52 -46 C 62 -44 64 -32 58 -22 " +
        "C 54 -15 44 -12 38 -10 " +
        // Beak + wattle
        "M 61 -34 L 74 -30 L 60 -25 Z " +
        "M 58 -25 C 62 -20 61 -13 56 -13 C 52 -13 52 -20 55 -25 " +
        // Tucked wing + drumstick feet
        "M -10 -12 C 4 -18 22 -12 22 2 C 22 14 4 18 -12 10 C -18 6 -16 -6 -10 -12 Z " +
        "M -4 31 C -6 39 2 43 8 38 C 12 35 10 31 6 30 " +
        "M 14 30 C 13 38 22 42 27 37 C 30 34 28 29 22 29",
      seams:
        "M -10 -36 C 2 -16 2 12 -8 30 " +
        "M 12 -38 C 24 -18 24 12 12 30 " +
        "M 49 -38 C 52 -40 55 -40 57 -37 " +
        "M -4 -3 L 14 -2 M -6 3 L 11 4",
      hat:
        "M 36 -45 C 46 -49 60 -49 68 -44 C 60 -43 46 -43 36 -45 Z " +
        "M 42 -46 L 45 -64 L 61 -63 L 62 -45 Z",
      hatBand: "M 43 -51 L 61 -50 M 50 -53 L 56 -53 L 56 -47 L 50 -47 Z",
      anchors: [
        [-14, 29],
        [2, 32],
        [18, 30],
        [34, 16],
      ] as Array<[number, number]>,
    },

    // Horizontal Flying Astronaut/Explorer Pup Parade Balloon (facing +X)
    astronautPup: {
      body:
        // Outstretched super-pup torso & legs
        "M -56 -4 C -68 -8 -74 -2 -68 5 C -60 11 -42 10 -28 8 " +
        "C -12 14 14 14 30 8 C 46 12 64 12 72 6 C 77 2 73 -5 62 -5 " +
        "C 50 -5 38 -2 30 -4 C 24 -16 -10 -18 -28 -10 C -40 -10 -48 -6 -56 -4 Z " +
        // Bubble helmet & pup head inside
        "M 18 -22 A 22 22 0 1 1 62 -22 A 22 22 0 1 1 18 -22 " +
        "M 28 -22 C 28 -32 42 -35 50 -28 C 55 -23 54 -14 46 -12 C 36 -10 28 -14 28 -22 Z " +
        // Floppy balloon ear floating inside/behind helmet
        "M 32 -26 C 24 -24 21 -15 26 -11 C 31 -8 36 -14 35 -21 " +
        // Jetpack cylinder on back
        "M -18 -16 L 8 -16 C 12 -16 12 -24 8 -24 L -18 -24 C -22 -24 -22 -16 -18 -16 Z",
      seams:
        "M 54 -23 A 2.2 2.2 0 1 0 54 -22.9 " +
        "M 40 -26 C 43 -29 47 -29 49 -26 " +
        "M 44 -42 C 53 -36 56 -20 48 -4 " +
        "M -16 -12 C -12 -2 -12 6 -16 12 " +
        "M 6 -13 C 10 -2 10 6 6 11 " +
        "M -22 -20 L -32 -22 M -22 -18 L -30 -16",
      scarf:
        "M 18 -6 C 4 -4 -12 -8 -26 -4 C -16 2 2 2 18 -1 Z",
      anchors: [
        [-42, 8],
        [-12, 13],
        [16, 12],
        [52, 10],
      ] as Array<[number, number]>,
    },

    // Giant Harvest Pumpkin, Acorn & Oak Leaf Cluster Balloon (facing +X)
    harvestCluster: {
      body:
        // Plump heirloom pumpkin balloon
        "M -44 4 C -46 -20 -26 -36 0 -36 C 26 -36 46 -20 44 4 " +
        "C 42 24 24 34 0 34 C -24 34 -42 24 -44 4 Z " +
        // Curled pumpkin stem
        "M -4 -36 C -4 -48 4 -56 14 -52 C 18 -50 16 -45 11 -46 C 6 -47 4 -42 5 -36 " +
        // Tilted Acorn companion balloon tucked top-right
        "M 24 -24 C 32 -42 54 -44 62 -28 C 68 -16 58 2 44 6 L 40 12 L 36 5 " +
        "C 26 0 20 -12 24 -24 Z",
      seams:
        // Pumpkin ribs
        "M -16 -34 C -28 -14 -28 14 -16 32 " +
        "M 0 -36 L 0 34 " +
        "M 16 -34 C 28 -14 28 14 16 32 " +
        // Acorn cap cross-hatch
        "M 23 -23 C 36 -30 52 -30 63 -25 " +
        "M 28 -33 L 42 -26 M 38 -38 L 54 -27 M 48 -37 L 32 -27 M 57 -32 L 44 -26 " +
        // Trailing oak leaf ribbon
        "M -28 -26 C -42 -36 -58 -34 -62 -24 C -65 -16 -52 -10 -40 -14 M -32 -20 L -56 -25",
      anchors: [
        [-24, 30],
        [0, 34],
        [24, 30],
        [44, 8],
      ] as Array<[number, number]>,
    },
  },

  pilgrimDogGear: {
    // Giant Sugar-Maple Leaf Glider aligned with Kai's grip axis (8,168)->(354,-42)
    mapleStem:
      "M 14 164 C 72 138 134 108 192 76 C 248 45 302 10 348 -28 " +
      "C 356 -35 362 -34 365 -29 C 368 -24 363 -17 354 -10 " +
      "C 306 28 250 63 194 94 C 136 126 76 154 18 178 Z",
    mapleBlade:
      "M 24 162 C 6 140 -18 126 -46 124 L -36 142 " +
      "C -64 138 -94 144 -120 158 L -102 174 " +
      "C -132 178 -158 192 -178 214 C -152 222 -126 222 -102 216 " +
      "L -116 238 C -90 242 -64 236 -42 224 " +
      "C -54 246 -58 270 -52 292 C -30 278 -12 258 2 236 " +
      "L 10 254 C 28 236 38 210 38 184 Z",
    mapleVeins:
      "M 18 170 C -34 184 -88 198 -154 210 " +
      "M -12 178 C -38 162 -68 154 -104 158 " +
      "M -18 186 C -26 218 -36 248 -46 276 " +
      "M -58 188 L -88 174 M -64 196 L -82 224",

    // 5 Articulated Turkey Tail Feathers fanning behind Kai's back
    feathers: [
      {
        outline:
          "M 26 52 C -8 24 -46 4 -82 -4 C -98 -8 -110 2 -106 16 " +
          "C -102 30 -84 40 -54 48 C -26 55 4 60 26 62 Z",
        detail: "M 20 56 L -92 8 M -44 26 L -62 12 M -58 30 L -72 28",
      },
      {
        outline:
          "M 30 46 C 4 8 -28 -24 -62 -44 C -78 -52 -92 -44 -90 -28 " +
          "C -88 -12 -70 4 -42 22 C -16 38 8 48 28 54 Z",
        detail: "M 22 48 L -78 -34 M -32 6 L -44 -14 M -46 -4 L -62 -8",
      },
      {
        outline:
          "M 36 40 C 20 -2 -2 -42 -30 -72 C -44 -86 -60 -82 -64 -66 " +
          "C -68 -50 -56 -26 -34 0 C -14 24 10 40 32 48 Z",
        detail: "M 28 42 L -50 -66 M -14 -14 L -20 -36 M -26 -30 L -42 -36",
      },
      {
        outline:
          "M 42 38 C 38 -6 26 -48 6 -84 C -4 -100 -22 -100 -30 -86 " +
          "C -38 -72 -32 -44 -18 -14 C -4 14 16 34 36 44 Z",
        detail: "M 34 38 L -14 -82 M 8 -24 L 8 -46 M -2 -42 L -16 -52",
      },
      {
        outline:
          "M 24 60 C -16 48 -58 44 -94 50 C -110 53 -116 68 -106 80 " +
          "C -96 92 -74 94 -42 88 C -14 82 10 74 28 68 Z",
        detail: "M 20 64 L -96 66 M -46 65 L -66 56 M -58 66 L -74 78",
      },
    ],

    // Tall Pilgrim Hat (crown fill + crisp brim & buckle)
    hatCrown:
      "M 48 -56 L 62 -148 C 64 -158 76 -163 94 -162 L 152 -156 " +
      "C 168 -154 176 -146 175 -135 L 172 -46 " +
      "C 134 -52 90 -56 48 -56 Z",
    hatBrimAndBuckle:
      "M 12 -42 C 48 -62 96 -70 148 -68 C 188 -66 220 -58 232 -46 " +
      "C 238 -40 232 -32 216 -30 C 178 -26 128 -28 78 -32 " +
      "C 42 -35 16 -36 12 -42 Z " +
      "M 51 -78 C 92 -83 134 -81 173 -72 L 172 -50 C 132 -58 90 -60 49 -56 Z " +
      "M 118 -84 L 148 -80 L 146 -52 L 116 -56 Z " +
      "M 124 -77 L 140 -75 L 139 -59 L 123 -61 Z",
  },

  autumnLeaves: {
    maple: {
      outline:
        "M -14 0 L -6 0 L -8 -7 L -2 -4 L 0 -13 L 4 -5 L 12 -8 L 8 -1 " +
        "L 15 2 L 7 5 L 10 11 L 2 7 L -2 13 L -4 5 L -9 7 L -6 1 Z",
      veins: "M -14 0 L 9 1 M -2 0 L 0 -9 M -1 1 L -1 9 M 2 1 L 8 -5",
    },
    oak: {
      outline:
        "M -14 0 L -8 0 C -8 -5 -4 -7 -2 -4 C 0 -9 6 -9 7 -4 " +
        "C 11 -6 15 -3 14 0 C 15 3 11 6 7 4 C 6 9 0 9 -2 4 " +
        "C -4 7 -8 5 -8 0 Z",
      veins: "M -14 0 L 12 0 M -2 0 L 3 -5 M 1 0 L 5 5 M -5 0 L -3 -4",
    },
    ginkgo: {
      outline:
        "M -12 0 L -3 0 C 0 -8 7 -13 13 -10 C 16 -8 14 -2 9 0 " +
        "C 14 2 16 8 13 10 C 7 13 0 8 -3 0 Z",
      veins: "M -3 0 L 11 -6 M -3 0 L 11 6 M -3 0 L 10 0",
    },
  },

  harvestBoat: {
    hullAndCabin:
      // Classic Hudson paddle-steamer facing +X
      "M -38 0 L 44 0 L 36 10 L -34 10 Z " +
      "M -32 5 L 34 5 " +
      "M -24 0 L -22 -13 L 14 -13 L 17 0 Z " +
      "M -14 -13 L -12 -23 L 6 -23 L 8 -13 Z " +
      // Twin vintage fluted smokestacks
      "M -8 -23 L -8 -36 L -4 -36 L -4 -23 Z M -9 -36 L -3 -36 " +
      "M 0 -23 L 0 -34 L 4 -34 L 4 -23 Z M -1 -34 L 5 -34 " +
      // Windows
      "M -17 -6 L -12 -6 M -7 -6 L -2 -6 M 3 -6 L 8 -6 M -6 -18 L 2 -18",
    pieAndPumpkins:
      // Pedestal + giant lattice-crust pumpkin pie on foredeck
      "M 24 0 L 28 0 M 26 0 L 26 -4 M 17 -4 L 35 -4 L 33 -8 L 19 -8 Z " +
      "M 18 -8 C 21 -14 31 -14 34 -8 " +
      "M 21 -8 L 25 -12 M 26 -8 L 30 -12 M 24 -12 L 28 -8 " +
      // Small harvest pumpkin beside it
      "M 11 -3 C 11 -7 16 -7 16 -3 C 16 0 11 0 11 -3 Z M 13.5 -6 L 14 -8",
    paddleWheelRim:
      "M -49 2 A 9 9 0 1 0 -31 2 A 9 9 0 1 0 -49 2 " +
      "M -45 2 A 5 5 0 1 0 -35 2 A 5 5 0 1 0 -45 2",
    paddleSpokes:
      "M -49 2 L -31 2 M -40 -7 L -40 11 M -46.4 -4.4 L -33.6 8.4 M -46.4 8.4 L -33.6 -4.4",
  },

  // --------------------------------------------------------------------------
  // CHRISTMAS — Christmas Eve Over Manhattan & Festive Harbor
  // --------------------------------------------------------------------------
  santaSleigh: {
    body:
      // Victorian swan-neck sleigh facing +X
      "M -44 -20 C -46 -4 -34 6 -14 6 L 18 6 C 32 6 42 -4 44 -16 " +
      "C 45 -22 39 -25 35 -20 C 32 -16 35 -11 39 -12 " +
      "M -44 -20 C -36 -22 -28 -14 -22 -10 L 20 -10 C 28 -10 34 -14 36 -20 " +
      // Decorative side scroll panel
      "M -28 -2 C -14 2 8 2 24 -3",
    runners:
      // Ornate curled ironwork runners & struts
      "M -50 16 L 34 16 C 48 16 56 6 52 -4 C 50 -9 44 -8 45 -3 " +
      "M -30 6 L -34 16 M -6 6 L -6 16 M 18 6 L 22 16 " +
      "M -18 11 C -14 7 -10 15 -6 11 M 4 11 C 8 7 12 15 16 11",
    giftsAndSack:
      // Bulging toy sack & ribboned gift boxes in back
      "M -40 -12 C -46 -26 -36 -38 -22 -35 C -12 -33 -10 -22 -14 -10 " +
      "M -25 -35 L -22 -40 L -17 -37 " +
      "M -16 -10 L -16 -24 L -3 -24 L -3 -10 M -9.5 -24 L -9.5 -10 M -16 -17 L -3 -17 " +
      "M -12 -24 C -14 -28 -10 -29 -9.5 -24 C -9 -29 -5 -28 -7 -24",
    santa:
      // Seated Santa facing +X with beard & drooping hat
      "M 2 -10 C 2 -22 16 -22 18 -10 " +
      "M 6 -23 A 6 6 0 1 0 18 -23 A 6 6 0 1 0 6 -23 " +
      // Fluffy beard
      "M 11 -21 C 17 -21 22 -16 19 -12 C 16 -9 10 -11 9 -16 " +
      // Santa cap + pom-pom
      "M 5 -26 C 9 -36 18 -36 19 -26 " +
      "M 7 -30 C 2 -36 -6 -34 -8 -28 " +
      "M -11 -27 A 2.5 2.5 0 1 0 -6 -27 A 2.5 2.5 0 1 0 -11 -27",
    santaWaveArm: "M 9 -18 L 3 -29 L 1 -33 M -1 -33 L 3 -34",
  },

  reindeer: {
    bodyAndHead:
      // Graceful galloping reindeer facing +X
      "M -16 -4 C -16 -11 -6 -12 8 -10 C 12 -16 15 -22 19 -23 " +
      "C 24 -24 29 -20 28 -16 C 27 -13 22 -13 18 -14 " +
      "C 16 -8 14 -2 10 1 C 0 3 -12 2 -16 -4 Z " +
      // Perky ear & tail
      "M 17 -22 L 13 -26 L 15 -20 " +
      "M -16 -6 C -21 -10 -23 -8 -20 -3",
    antlers:
      "M 19 -23 C 18 -30 22 -35 27 -36 M 20 -29 L 25 -30 M 19 -27 L 14 -32",
    frontLegA: "M 9 0 L 16 6 L 22 4",
    frontLegB: "M 7 0 L 12 9 L 8 14",
    hindLegA: "M -12 -1 L -19 6 L -25 11",
    hindLegB: "M -10 0 L -14 9 L -9 14",
  },

  santaDogGear: {
    // Santa cap + shearling fur brim + articulated pom-pom perched cleanly above Kai's eyes
    hatCrownFill:
      "M 46 -64 C 52 -114 86 -148 126 -146 C 154 -144 172 -124 176 -72 " +
      "C 136 -78 88 -76 46 -64 Z " +
      "M 84 -138 C 46 -136 12 -118 -14 -92 C 8 -82 36 -86 62 -98",
    hatBrim:
      "M 34 -58 C 56 -76 96 -84 140 -82 C 170 -80 192 -72 196 -60 " +
      "C 200 -50 188 -45 170 -47 C 130 -52 84 -50 44 -46 " +
      "C 32 -45 28 -52 34 -58 Z",
    pomPom:
      "M -32 -90 A 14 14 0 1 0 -4 -90 A 14 14 0 1 0 -32 -90 " +
      "M -25 -97 C -21 -101 -14 -101 -10 -97",

    // Cozy multi-fold fringed winter scarf at collar
    scarfNeck:
      "M 56 8 C 80 24 112 32 146 32 C 162 32 172 24 170 14 " +
      "C 168 6 154 8 140 10 C 110 12 82 6 64 -2 Z",
    scarfTailUpper:
      "M 66 18 C 36 22 4 34 -28 52 C -56 68 -84 76 -110 72 " +
      "L -104 94 C -76 98 -46 88 -16 70 C 14 52 44 40 72 36 Z " +
      "M -110 72 L -124 70 M -108 79 L -123 79 M -106 87 L -121 89 M -104 94 L -118 98",
    scarfTailLower:
      "M 58 28 C 30 42 2 62 -22 86 C -42 106 -64 118 -88 120 " +
      "L -78 138 C -52 136 -28 122 -6 100 C 18 76 44 56 68 44 Z " +
      "M -88 120 L -102 122 M -84 129 L -98 133 M -78 138 L -91 144",
    jingleBell:
      "M 132 38 A 11 11 0 1 0 154 38 A 11 11 0 1 0 132 38 " +
      "M 136 42 L 150 42 M 143 42 L 143 48",

    // Candy-Cane Runner Sky-Sled & Wrapped Presents under Kai's paws
    sledDeckAndRunner:
      "M -108 168 L 236 152 C 266 150 288 130 286 106 C 285 90 268 84 258 96 " +
      "C 250 106 258 120 270 116 " +
      // Lower curved candy-cane runner
      "M -122 198 L 244 182 C 282 180 308 152 304 118 " +
      // Sled struts + steering rein directly to Kai's front paw-hand (186, 84)
      "M -76 167 L -82 196 M 12 162 L 10 192 M 112 158 L 114 188 M 204 154 L 210 183 " +
      "M 268 96 C 242 88 214 84 190 84 " +
      // Candy-cane diagonal stripe ticks along runner
      "M -88 197 L -76 186 M -38 195 L -26 184 M 14 192 L 26 181 " +
      "M 66 190 L 78 179 M 118 188 L 130 177 M 170 185 L 182 174",
    sledGifts:
      // Two stacked ribbon-bowed Christmas boxes behind Kai on rear sled deck
      "M -98 167 L -98 112 L -36 110 L -36 165 Z " +
      "M -67 111 L -67 166 M -98 138 L -36 137 " +
      "M -67 111 C -79 97 -86 105 -67 111 C -48 104 -55 96 -67 111 " +
      "M -84 111 L -84 78 L -46 77 L -46 110 Z " +
      "M -65 77 L -65 110 M -65 77 C -74 67 -80 73 -65 77 C -50 72 -56 66 -65 77",
  },

  holidayTreeBoat: {
    tugAndTow:
      // NYC Tugboat (right, +X) towing Rockefeller Spruce barge (left, -X)
      "M 8 0 L 48 0 L 54 -6 L 50 8 L 12 8 Z " +
      "M 18 0 L 20 -13 L 38 -13 L 40 0 Z " +
      "M 24 -13 L 24 -22 L 29 -22 L 29 -13 Z " +
      "M 23 -20 L 30 -20 M 31 -7 L 36 -7 " +
      // Tire fenders along tug hull
      "M 18 4 A 2 2 0 1 0 22 4 A 2 2 0 1 0 18 4 " +
      "M 28 4 A 2 2 0 1 0 32 4 A 2 2 0 1 0 28 4 " +
      "M 38 4 A 2 2 0 1 0 42 4 A 2 2 0 1 0 38 4 " +
      // Tow cable with gentle catenary sag to barge
      "M 10 2 Q -2 7 -14 2 " +
      // Flat Hudson River tree barge
      "M -84 2 L -14 2 L -18 9 L -80 9 Z M -78 5 L -20 5",
    spruceBoughs:
      // 5-tier Rockefeller Center Norway Spruce centered at x = -49
      "M -52 2 L -52 -4 M -46 2 L -46 -4 " +
      "M -72 -4 L -49 -18 L -26 -4 Z " +
      "M -68 -14 L -49 -28 L -30 -14 Z " +
      "M -63 -24 L -49 -37 L -35 -24 Z " +
      "M -58 -33 L -49 -45 L -40 -33 Z " +
      "M -54 -41 L -49 -52 L -44 -41 Z",
    garlandAndWreath:
      // Spiral garland + ornaments + tugboat prow wreath
      "M -64 -7 Q -49 -2 -34 -9 " +
      "M -60 -18 Q -49 -13 -38 -20 " +
      "M -56 -28 Q -49 -24 -42 -30 " +
      "M -53 -37 Q -49 -34 -45 -38 " +
      // Prow holiday wreath on tugboat bow
      "M 46 -3 A 3.2 3.2 0 1 0 52.4 -3 A 3.2 3.2 0 1 0 46 -3",
    starTopper:
      "M -49 -60 L -47.5 -55.5 L -43 -54 L -47.5 -52.5 L -49 -48 " +
      "L -50.5 -52.5 L -55 -54 L -50.5 -55.5 Z",
  },

  compassStar:
    "M 0 -10 L 1.8 -1.8 L 10 0 L 1.8 1.8 L 0 10 L -1.8 1.8 L -10 0 L -1.8 -1.8 Z " +
    "M -4.2 -4.2 L 4.2 4.2 M -4.2 4.2 L 4.2 -4.2",

  // --------------------------------------------------------------------------
  // WINTER — Central Park Snowy Owls, Carving Kai, Crystals & Rink Barge
  // --------------------------------------------------------------------------
  snowflakes: {
    dendrite: buildSixFoldSnowflake([
      [0, 0, 14, 0],
      [5, 0, 8.5, 3.2],
      [5, 0, 8.5, -3.2],
      [9.5, 0, 12.5, 2.6],
      [9.5, 0, 12.5, -2.6],
    ]),
    fernStar: buildSixFoldSnowflake([
      [0, 0, 14, 0],
      [3.5, 0, 5.5, 2.2],
      [3.5, 0, 5.5, -2.2],
      [7, 0, 10.5, 3.8],
      [7, 0, 10.5, -3.8],
      [11, 0, 13, 1.8],
      [11, 0, 13, -1.8],
    ]),
    hexPrism: buildSixFoldSnowflake([
      [0, 0, 13, 0],
      [4.5, 0, 2.25, 3.9],
      [8.5, 0, 11, 2.4],
      [8.5, 0, 11, -2.4],
    ]),
  },

  windRibbons: [
    "M -70 4 C -42 -12 -12 16 18 0 C 42 -12 64 -4 72 6 C 78 13 68 20 60 14 C 54 9 60 2 66 5",
    "M -85 -2 C -50 14 -16 -14 22 -2 C 50 7 74 -8 88 -2",
    "M -60 8 C -30 8 -8 -10 18 -10 C 38 -10 52 4 44 14 C 38 20 28 15 32 8",
  ],

  snowyOwl: {
    // Central Park Snowy Owl facing +X with broad swept feathered wingspan
    bodyAndHead:
      "M -18 2 C -14 -7 -2 -10 10 -7 C 16 -10 23 -8 24 -1 " +
      "C 25 5 18 9 10 8 C 0 11 -12 9 -18 2 Z " +
      // Fanned tail feathers + winter fleck bars
      "M -16 0 L -27 -5 L -25 2 L -27 7 L -15 5 " +
      "M 25 -1 L 28 1 L 24 2 " +
      "M 18 -3 A 1.6 1.6 0 1 0 21.2 -3 A 1.6 1.6 0 1 0 18 -3 " +
      "M 14 -6 C 17 -2 17 3 14 6 " +
      "M -4 -3 L -1 -2 M 2 -4 L 5 -3 M -7 2 L -4 3",
    nearWing:
      "M 6 -4 C 2 -16 -10 -26 -26 -24 C -22 -19 -18 -16 -14 -15 " +
      "C -20 -13 -24 -9 -25 -5 C -19 -5 -14 -6 -10 -7 " +
      "C -14 -3 -16 1 -15 4 C -8 3 0 0 6 -4 Z " +
      "M -2 -11 C -9 -15 -16 -18 -22 -19",
    farWing:
      "M 10 -6 C 10 -16 2 -25 -12 -27 C -9 -21 -6 -16 -2 -13",
  },

  winterDogGear: {
    // Ribbed cable-knit beanie + plush earmuff cup over floppy ear root
    beanieCap:
      "M 42 -54 C 46 -96 76 -124 116 -124 C 152 -124 178 -98 182 -54 Z",
    beanieDetails:
      "M 34 -46 C 64 -62 114 -66 188 -50 L 186 -36 C 116 -50 66 -46 36 -32 Z " +
      "M 76 -116 C 72 -94 70 -74 70 -56 " +
      "M 106 -123 C 105 -98 104 -76 104 -57 " +
      "M 136 -120 C 138 -96 139 -76 138 -56 " +
      "M 162 -106 C 164 -88 165 -70 164 -53 " +
      // Top pom-pom
      "M 96 -136 A 14 14 0 1 0 124 -136 A 14 14 0 1 0 96 -136 " +
      // Plush winter earmuff nestled at ear root (46, -24) + arched band
      "M 56 -56 C 50 -38 46 -28 46 -22 " +
      "M 26 -18 A 18 20 0 1 0 62 -18 A 18 20 0 1 0 26 -18",
    earmuffFill: "M 26 -18 A 18 20 0 1 0 62 -18 A 18 20 0 1 0 26 -18",

    // Cozy flowing plaid-lined winter scarf
    scarfNeck:
      "M 56 10 C 82 26 116 34 150 32 C 166 31 174 22 170 12 " +
      "C 166 4 150 8 136 10 C 106 12 80 6 62 -2 Z",
    scarfStream:
      "M 64 20 C 28 28 -10 46 -48 70 C -80 90 -112 96 -138 88 " +
      "L -130 112 C -100 120 -66 112 -32 90 C 4 66 38 48 72 40 Z " +
      // Tartan stripe lines + fringe
      "M 34 32 L 42 50 M -4 50 L 6 68 M -42 72 L -32 90 M -82 88 L -74 108 " +
      "M -138 88 L -154 84 M -135 96 L -152 95 M -133 104 L -149 106 M -130 112 L -145 117",

    // Twin-tip Carving Snowboard under Kai's paws
    snowboard:
      "M -112 178 C -132 178 -142 166 -132 156 C -124 148 -104 154 -84 156 " +
      "L 210 140 C 234 138 254 128 264 138 C 274 148 262 162 238 164 L -112 178 Z",
    snowboardDetails:
      // Center camber stripe + paw bindings over rearPaw (92,164) & frontPaw (138,160)
      "M -108 167 L 234 151 " +
      "M 76 168 C 82 146 102 146 108 166 " +
      "M 124 165 C 130 143 150 143 156 163",
  },

  winterHarbor: {
    rinkBarge: {
      hull:
        // Floating winter ice-rink barge facing +X
        "M -50 2 L 50 2 L 44 10 L -44 10 Z " +
        "M -44 2 L -44 -5 L 44 -5 L 44 2 Z " +
        // Festoon light posts & draped cable + etched figure-8 rink trace
        "M -40 -5 L -40 -22 M 40 -5 L 40 -22 " +
        "M -40 -20 Q 0 -12 40 -20 " +
        "M -26 -2 C -14 -5 -4 1 0 -2 C 4 -5 14 1 26 -2",
      skater:
        // Graceful miniature figure skater in arabesque glide
        "M 0 -20 A 2.4 2.4 0 1 0 4.8 -20 A 2.4 2.4 0 1 0 0 -20 " +
        "M 2 -17 L 0 -9 L 1 -2 M -2 -2 L 4 -2 " +
        "M 0 -10 L -9 -12 " +
        "M 1 -15 L 9 -18 M 1 -15 L -7 -16 " +
        // Tiny trailing skater scarf
        "M 1 -16 Q -6 -19 -11 -17",
    },
    cocoaTug: {
      hull:
        // Cozy NYC winter tug carrying a giant steaming hot-cocoa mug
        "M -34 0 L 38 0 L 44 -6 L 40 9 L -28 9 Z " +
        "M -6 0 L -4 -14 L 18 -14 L 20 0 Z " +
        "M 4 -14 L 4 -22 L 9 -22 L 9 -14 Z M 7 -8 L 14 -8 " +
        // Giant ceramic hot-cocoa mug on stern deck (-28..-10)
        "M -27 0 L -27 -18 L -11 -18 L -11 0 Z " +
        "M -27 -14 L -11 -14 " +
        // Mug C-handle + whipped cream peak
        "M -27 -15 C -33 -15 -33 -6 -27 -6 " +
        "M -25 -18 C -23 -23 -15 -23 -13 -18",
    },
  },

  iceFloes: [
    // Small sculpted crystalline river icebergs with 3D facet ridges & waterline ripples
    "M -19 1 L -14 -7 L -8 -5 L -3 -14 L 4 -9 L 10 -12 L 17 -3 L 20 1 Z " +
      "M -3 -14 L -1 1 M 10 -12 L 7 1 M -14 -7 L -6 1 M -22 3 Q 0 5 23 3",
    "M -15 1 L -10 -9 L -3 -6 L 3 -15 L 11 -7 L 16 1 Z " +
      "M 3 -15 L 1 1 M -10 -9 L -4 1 M -18 3 Q 0 5 19 3",
    "M -22 1 L -16 -6 L -9 -13 L -1 -8 L 6 -16 L 14 -8 L 19 -4 L 23 1 Z " +
      "M -9 -13 L -7 1 M 6 -16 L 5 1 M 14 -8 L 12 1 M -25 3 Q 0 5 26 3",
  ],

  ...SPRING_SUMMER_PATHS,
  ...CITY_DETAIL_PATHS,
} as const;
