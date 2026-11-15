// ============================================================================
// Spring, Summer & Festival SVG <path d="..."> Line-Drawing Catalog
//   - St. Patrick's Day (`stPatricks`)
//   - Easter (`easter`)
//   - Summer (`summer`)
//   - July 4th (`july4th`)
//   - Diwali (`diwali`)
// ============================================================================

function buildRadialMandala(petals: number, outerR: number, innerR: number): string {
  const cmds: string[] = [];
  for (let i = 0; i < petals; i++) {
    const a0 = (i * Math.PI * 2) / petals;
    const aMid = ((i + 0.5) * Math.PI * 2) / petals;
    const a1 = ((i + 1) * Math.PI * 2) / petals;
    const x0 = +(Math.cos(a0) * innerR).toFixed(2);
    const y0 = +(Math.sin(a0) * innerR).toFixed(2);
    const xm = +(Math.cos(aMid) * outerR).toFixed(2);
    const ym = +(Math.sin(aMid) * outerR).toFixed(2);
    const x1 = +(Math.cos(a1) * innerR).toFixed(2);
    const y1 = +(Math.sin(a1) * innerR).toFixed(2);
    cmds.push(`M ${x0} ${y0} Q ${xm} ${ym} ${x1} ${y1}`);
    const dotX = +(Math.cos(aMid) * (outerR * 0.62)).toFixed(2);
    const dotY = +(Math.sin(aMid) * (outerR * 0.62)).toFixed(2);
    cmds.push(`M ${x0} ${y0} L ${dotX} ${dotY}`);
  }
  return cmds.join(" ");
}

export const SPRING_SUMMER_PATHS = {
  // --------------------------------------------------------------------------
  // ST. PATRICK'S DAY — Emerald Parade, Shamrocks & Rainbow Pot of Gold
  // --------------------------------------------------------------------------
  stPatricks: {
    skyRainbow: {
      arc1: "M -130 52 A 132 108 0 0 1 130 52",
      arc2: "M -120 52 A 122 99 0 0 1 120 52",
      arc3: "M -110 52 A 112 90 0 0 1 110 52",
      potOfGold:
        "M 108 54 C 102 54 100 68 106 76 C 112 82 132 82 138 76 " +
        "C 144 68 142 54 136 54 Z M 105 54 L 139 54",
      coins:
        "M 111 53 A 4 3 0 1 1 119 53 M 118 51 A 4.5 3.5 0 1 1 127 51 " +
        "M 126 53 A 4 3 0 1 1 134 53 M 122 44 L 122 40 M 115 46 L 112 43 M 129 46 L 132 43",
    },

    shamrock3:
      "M 0 2 C -3 -8 -14 -10 -13 -2 C -12 4 -4 4 0 2 " +
      "C -6 -6 -6 -16 0 -15 C 6 -16 6 -6 0 2 " +
      "C 4 4 12 4 13 -2 C 14 -10 3 -8 0 2 " +
      "M 0 2 Q -1 10 -5 14",

    shamrock4:
      "M 0 0 C -4 -10 -13 -9 -11 -1 C -9 3 -3 2 0 0 " +
      "C -9 -4 -10 6 -2 9 C 2 10 2 3 0 0 " +
      "C 4 10 13 9 11 1 C 9 -3 3 -2 0 0 " +
      "C 9 4 10 -6 2 -9 C -2 -10 -2 -3 0 0 " +
      "M 0 0 Q -2 11 -6 15",

    leprechaunDogGear: {
      // Jaunty tilted Leprechaun Top-Hat perched cleanly above Kai's eyes
      hatCrown:
        "M 46 -60 L 54 -148 C 56 -158 72 -162 116 -160 C 156 -158 172 -152 172 -140 " +
        "L 168 -52 C 128 -58 86 -60 46 -60 Z",
      hatBrimAndBand:
        "M 16 -48 C 52 -66 98 -72 148 -70 C 186 -68 216 -60 226 -48 " +
        "C 230 -42 222 -36 204 -35 C 162 -32 108 -34 58 -38 C 28 -40 12 -42 16 -48 Z " +
        "M 48 -82 C 90 -87 132 -85 170 -76 L 168 -54 C 128 -62 88 -64 46 -60 Z",
      hatBuckle:
        "M 114 -86 L 144 -83 L 142 -56 L 112 -59 Z M 120 -79 L 136 -77 L 135 -63 L 119 -65 Z",
      hatShamrock:
        "M 66 -84 C 58 -98 44 -96 48 -84 C 52 -78 60 -80 66 -84 " +
        "C 56 -96 58 -110 68 -108 C 76 -106 72 -94 66 -84 " +
        "C 74 -96 86 -90 80 -80 C 76 -75 70 -79 66 -84",
      bowtie:
        "M 138 35 L 118 23 L 116 45 Z M 138 35 L 158 25 L 156 47 Z " +
        "M 134 35 A 4.5 4.5 0 1 0 143 35 A 4.5 4.5 0 1 0 134 35",
      // Rainbow arc glider + cauldron pot of gold at front prow
      rainbowOuter: "M -126 184 C -28 142 98 138 228 156",
      rainbowMid: "M -122 194 C -26 152 98 148 226 166",
      rainbowInner: "M -118 204 C -24 162 98 158 224 176",
      potCauldron:
        "M 218 136 C 206 142 206 168 218 178 C 232 186 262 184 274 174 " +
        "C 284 164 282 140 270 134 Z M 212 135 L 276 133",
      potCoins:
        "M 222 134 A 9 6 0 1 1 240 133 M 236 130 A 10 7 0 1 1 256 130 " +
        "M 250 133 A 9 6 0 1 1 268 132 " +
        "M 245 112 L 245 102 M 228 116 L 222 108 M 262 115 L 268 107",
    },

    emeraldBoat: {
      hull:
        "M -40 0 L 42 0 L 35 10 L -34 10 Z M -32 0 L -27 -13 L 24 -13 L 29 0 Z " +
        "M -18 -13 L -14 -22 L 12 -22 L 16 -13 Z " +
        "M -18 -6 L -12 -6 M -5 -6 L 1 -6 M 8 -6 L 14 -6",
      buntingAndShamrock:
        "M -27 -13 Q -14 -7 0 -13 Q 14 -7 29 -13 " +
        "M -1 -29 C -4 -35 -10 -34 -9 -29 C -8 -26 -3 -27 -1 -29 " +
        "C -4 -34 -3 -40 0 -39 C 3 -40 4 -34 1 -29 " +
        "C 3 -27 8 -26 9 -29 C 10 -34 4 -35 1 -29 M 0 -29 L 0 -22",
      emeraldWake: "M -42 8 Q -64 5 -86 9 M -40 11 Q -60 14 -80 11",
    },
  },

  // --------------------------------------------------------------------------
  // EASTER — Fifth Avenue Floral Bonnets, Egg Hot-Air Balloons & Blossoms
  // --------------------------------------------------------------------------
  easter: {
    eggBalloon: {
      // Classic ovoid egg balloon envelope + wicker basket below
      envelope:
        "M 0 -54 C 24 -54 38 -24 36 2 C 34 22 18 34 0 34 " +
        "C -18 34 -34 22 -36 2 C -38 -24 -24 -54 0 -54 Z",
      basketAndRigging:
        "M -16 32 L -11 52 M 16 32 L 11 52 M -7 34 L -6 52 M 7 34 L 6 52 " +
        "M -13 52 L 13 52 L 11 66 L -11 66 Z M -12 57 L 12 57 M -11 62 L 11 62 " +
        "M -6 52 L -6 66 M 0 52 L 0 66 M 6 52 L 6 66",
      patterns: [
        // Variant 0: Zigzag chevron + dots
        "M -35 -6 L -22 -16 L -10 -6 L 2 -16 L 14 -6 L 26 -16 L 35 -6 " +
          "M -34 8 C -12 14 12 14 34 8 " +
          "M -28 -26 C -10 -32 10 -32 28 -26",
        // Variant 1: Scalloped lace + spring floral medallion
        "M -35 -2 Q -23 8 -12 -2 Q 0 8 12 -2 Q 23 8 35 -2 " +
          "M -31 -20 Q -15 -12 0 -20 Q 15 -12 31 -20 " +
          "M 0 -36 A 5 5 0 1 0 0.1 -36",
        // Variant 2: Diagonal ribbon stripes + diamond band
        "M -32 -22 L 32 -22 M -35 10 L 35 10 " +
          "M -24 -6 L -12 -16 L 0 -6 L 12 -16 L 24 -6 L 12 4 L 0 -6 L -12 4 Z",
      ],
    },

    easterDogGear: {
      // Articulated tall Bunny Ears + Fifth Avenue Floral Easter Bonnet
      earBack:
        "M 84 -66 C 72 -106 70 -148 84 -168 C 94 -180 108 -172 108 -150 " +
        "C 108 -124 102 -92 96 -66 Z " +
        "M 88 -82 C 82 -110 82 -138 90 -154 C 96 -160 100 -150 98 -130",
      earFront:
        "M 118 -66 C 116 -108 122 -152 138 -170 C 150 -182 162 -172 158 -148 " +
        "C 154 -122 142 -92 132 -66 Z " +
        "M 126 -82 C 126 -112 132 -140 142 -154 C 148 -158 150 -146 144 -124",
      bonnetBrim:
        "M 22 -52 C 56 -74 108 -80 162 -74 C 194 -70 214 -60 218 -50 " +
        "C 220 -40 204 -36 182 -39 C 136 -46 82 -46 38 -40 C 22 -38 16 -45 22 -52 Z",
      bonnetFlowers:
        // Three Fifth-Avenue bonnet daisies + trailing ribbons
        "M 66 -66 A 8 8 0 1 0 82 -66 A 8 8 0 1 0 66 -66 " +
        "M 108 -70 A 9 9 0 1 0 126 -70 A 9 9 0 1 0 108 -70 " +
        "M 150 -65 A 7 7 0 1 0 164 -65 A 7 7 0 1 0 150 -65",
      bonnetRibbons:
        "M 34 -44 C 4 -42 -26 -30 -54 -12 M 38 -39 C 10 -30 -18 -14 -42 8",
      // Woven Wicker Basket Glider + 3 Patterned Easter Eggs
      basketHull:
        "M -102 152 L 228 138 L 204 188 L -80 198 Z " +
        "M -108 152 C -108 144 234 130 234 138 " +
        // Arched wicker handle curving to Kai's front paw (188, 84)
        "M 216 138 C 234 106 218 84 190 84",
      basketWeave:
        "M -92 168 L 216 154 M -86 184 L 208 171 " +
        "M -64 151 L -54 197 M -18 149 L -10 195 M 28 147 L 36 193 " +
        "M 74 145 L 82 191 M 120 143 L 126 189 M 166 141 L 172 187",
      basketEggs:
        "M -84 150 C -86 122 -64 106 -48 122 C -38 132 -42 149 -46 150 " +
        "M -52 149 C -54 118 -28 102 -12 120 C -4 130 -8 147 -12 148 " +
        "M -78 132 L -66 124 L -54 132 L -44 125 " +
        "M -46 130 Q -30 120 -14 130",
    },

    blossomFlower:
      "M 0 -3 C -3 -10 -9 -8 -6 -2 C -12 -3 -12 4 -5 4 " +
      "C -8 10 -1 12 1 6 C 5 11 11 7 6 2 C 12 -1 8 -8 2 -4 Z M 0 0 A 1.5 1.5 0 1 0 0.1 0",
    blossomPetal:
      "M -6 0 C -4 -6 4 -7 7 -2 L 4 0 L 7 2 C 4 7 -4 6 -6 0 Z",

    springBoat: {
      hull:
        "M -40 2 L 42 2 L 36 10 L -34 10 Z M -32 2 L -30 -8 L 10 -8 L 12 2 Z " +
        "M -22 -3 L -16 -3 M -8 -3 L -2 -3",
      tulips:
        // Three oversized spring tulips swaying on foredeck
        "M 18 2 L 18 -16 M 18 -10 Q 12 -12 13 -6 " +
        "M 13 -16 C 13 -25 23 -25 23 -16 L 20 -21 L 18 -16 L 16 -21 Z " +
        "M 28 2 L 28 -20 M 28 -12 Q 34 -14 33 -8 " +
        "M 23 -20 C 23 -29 33 -29 33 -20 L 30 -25 L 28 -20 L 26 -25 Z",
    },
  },

  // --------------------------------------------------------------------------
  // SUMMER — Coney Island Sky Banner Biplane, Surf Kai & Ice-Cream Barge
  // --------------------------------------------------------------------------
  summer: {
    sunCore: "M -20 0 A 20 20 0 1 0 20 0 A 20 20 0 1 0 -20 0",
    sunInnerRing: "M -25 0 A 25 25 0 1 0 25 0 A 25 25 0 1 0 -25 0",
    sunRays: buildRadialMandala(12, 42, 28),

    biplane: {
      // Classic tow biplane facing +X
      body:
        "M -28 -2 L 16 -5 C 24 -5 28 -1 28 4 C 28 9 22 11 14 10 L -28 5 Z " +
        // Tail fin & rudder
        "M -28 -2 L -36 -13 L -29 -13 L -22 -2 " +
        // Upper & lower biplane wings + struts + landing gear wheel
        "M -6 -13 L 20 -13 M -8 10 L 18 10 " +
        "M -2 -13 L -4 10 M 14 -13 L 12 10 " +
        "M 4 10 L 8 18 M 12 10 L 8 18 M 5 18 A 3.5 3.5 0 1 0 12 18 A 3.5 3.5 0 1 0 5 18 " +
        // Pilot head & scarf
        "M 2 -8 A 3 3 0 1 0 8 -8 A 3 3 0 1 0 2 -8 M 1 -7 Q -6 -9 -10 -6",
    },

    summerDogGear: {
      // Backwards sun cap + Sleek Aviator Sunglasses + Neckerchief + Longboard Surfboard
      sunCap:
        "M 44 -58 C 52 -96 86 -116 126 -114 C 158 -112 178 -92 182 -56 " +
        "C 138 -62 90 -62 44 -58 Z " +
        // Backwards bill sticking out to -X
        "M 46 -62 L 4 -66 C -6 -66 -8 -56 2 -54 L 46 -52",
      aviators:
        // Double-bridge aviator sunglasses right over Kai's eye zone
        "M 84 -38 L 166 -42 M 90 -34 L 162 -38 " +
        "M 86 -38 C 84 -20 96 -14 110 -18 C 120 -21 122 -32 118 -40 Z " +
        "M 130 -40 C 128 -22 140 -16 154 -20 C 164 -23 166 -34 162 -42 Z " +
        // Temple arm to ear + lens glint lines
        "M 84 -36 L 54 -34 M 94 -34 L 102 -22 M 138 -36 L 146 -24",
      bandana:
        "M 60 12 C 88 28 122 36 156 30 L 136 58 L 98 34 " +
        "C 66 42 32 54 2 70 L -8 54 C 18 38 42 24 60 12 Z",
      surfboard:
        "M -134 176 C -110 156 -32 144 82 140 C 178 136 254 140 282 150 " +
        "C 256 168 180 176 84 180 C -28 184 -108 184 -134 176 Z " +
        // Center wooden stringer
        "M -128 176 L 278 150",
      waterWave:
        "M 294 154 C 274 144 258 164 234 172 C 192 184 126 174 74 184 " +
        "C 18 192 -52 178 -116 186 C -138 189 -154 182 -166 176 " +
        "M 248 184 Q 202 194 156 186 M 44 192 Q -12 200 -68 191",
    },

    summerBoat: {
      hull:
        "M -50 2 L 52 2 L 44 10 L -43 10 Z M 8 2 L 11 -8 L 38 -8 L 41 2 Z " +
        "M 15 -3 L 21 -3 M 27 -3 L 33 -3",
      // Waffle-cone ice cream on cabin + tilted striped beach umbrella on bow
      iceCreamCone:
        "M 14 -8 L 18 -19 L 22 -8 Z M 15 -12 L 21 -12 " +
        "M 13 -19 A 5 5 0 1 1 23 -19 M 14.5 -24 A 4 4 0 1 1 21.5 -24",
      umbrellaPole: "M 32 -8 L 35 -26",
      umbrellaCanopy:
        "M 19 -24 C 24 -35 44 -33 49 -21 Q 42 -24 35 -21 Q 27 -24 19 -24 Z " +
        "M 35 -30 L 35 -21 M 27 -29 L 26 -22 M 43 -28 L 42 -21",
      // People on promenade deck flying kites (Hand #1 at (-19, -21), Hand #2 at (-39, -19))
      kiteFlyerPrimary:
        "M -16 2 L -12 -6 L -8 2 M -12 -6 L -11 -15 " +
        "M -14 -18.5 A 3 3 0 1 0 -8 -18.5 A 3 3 0 1 0 -14 -18.5 " +
        "M -16.5 -20 Q -11 -22.5 -6 -19.5 " +
        "M -11 -14 L -19 -21 M -11 -14 L -6 -11",
      kiteFlyerSecondary:
        "M -35 2 L -32 -5.5 L -29 2 M -32 -5.5 L -31 -13.5 " +
        "M -33.8 -16.8 A 2.7 2.7 0 1 0 -28.4 -16.8 A 2.7 2.7 0 1 0 -33.8 -16.8 " +
        "M -35 -18.5 L -27 -18.5 " +
        "M -31 -12.5 L -39 -19 M -31 -12.5 L -26 -10",
      diamondKite:
        "M 0 -14 L 10 -2 L 0 13 L -10 -2 Z M 0 -14 L 0 13 M -10 -2 L 10 -2",
      kiteTailStatic:
        "M 0 13 Q -7 21 -4 29 Q -1 36 -9 43 M -7 21 L -2 23 M -2 33 L -7 35",
    },
  },

  // --------------------------------------------------------------------------
  // JULY 4TH — East River Fireworks, Uncle Sam Kai & FDNY Fireboat Arches
  // --------------------------------------------------------------------------
  july4th: {
    patriotDogGear: {
      // Tall Uncle Sam Top-Hat with vertical stripes & starred band
      hatCrown:
        "M 48 -58 L 54 -154 C 56 -164 78 -168 116 -166 C 154 -164 172 -158 172 -146 " +
        "L 168 -52 C 128 -58 88 -60 48 -58 Z",
      hatStripesAndBrim:
        "M 16 -46 C 52 -66 100 -72 150 -70 C 188 -68 218 -58 228 -46 " +
        "C 232 -40 222 -34 204 -34 C 160 -32 106 -34 56 -38 C 26 -40 12 -40 16 -46 Z " +
        "M 50 -84 C 92 -89 134 -87 170 -78 L 168 -54 C 128 -62 88 -64 48 -58 Z " +
        // Vertical Uncle-Sam stripes on upper crown
        "M 78 -162 L 76 -86 M 104 -165 L 103 -87 M 130 -164 L 130 -85 M 154 -160 L 154 -81 " +
        // Stars on hatband
        "M 74 -70 L 78 -70 M 76 -72 L 76 -68 M 112 -72 L 116 -72 M 114 -74 L 114 -70 M 148 -68 L 152 -68 M 150 -70 L 150 -66",
      neckerchief:
        "M 60 12 C 88 28 122 36 156 30 C 132 48 98 54 64 44 " +
        "C 32 56 -2 72 -34 78 L -42 60 C -8 52 28 34 60 12 Z",
      // Striped Fourth-of-July Sky-Rocket Cruiser + Tail Sparkler
      rocketBody:
        "M -108 176 L 222 144 L 278 152 L 224 176 L -104 202 Z " +
        // Nose cone seam + diagonal candy/banner stripes + tail fins
        "M 222 144 L 224 176 " +
        "M -64 172 L -46 198 M 4 166 L 22 192 M 72 160 L 90 186 M 140 152 L 158 178 " +
        "M -96 175 L -122 156 L -80 174 M -94 201 L -118 220 L -78 200 " +
        // Fuse cord out the tail
        "M -106 189 Q -120 190 -132 194",
      sparklerRays:
        "M -18 0 L 18 0 M 0 -18 L 0 18 M -13 -13 L 13 13 M -13 13 L 13 -13 " +
        "M -24 -6 L -19 -4 M 19 4 L 24 6 M -6 24 L -4 19 M 4 -19 L 6 -24",
    },

    fireboat: {
      hull:
        // Iconic FDNY Harbor Fireboat facing +X
        "M -42 0 L 44 0 L 50 -6 L 44 10 L -36 10 Z " +
        "M -22 0 L -20 -13 L 18 -13 L 21 0 Z " +
        "M -8 -13 L -6 -23 L 10 -23 L 12 -13 Z " +
        // Water-monitor towers & radar mast
        "M -30 0 L -30 -10 M -33 -10 L -27 -10 " +
        "M 30 0 L 30 -9 M 27 -9 L 33 -9 " +
        "M 2 -23 L 2 -31 M -1 -28 L 5 -28 " +
        "M -14 -6 L -8 -6 M -1 -6 L 5 -6 M 11 -6 L 16 -6",
      // Three triumphant parabolic FDNY water-cannon arches
      archBack: "M -30 -11 C -46 -46 -72 -48 -88 -6",
      archMid: "M 2 -31 C -8 -66 -38 -68 -56 -12",
      archFront: "M 30 -10 C 44 -46 70 -46 86 -6",
    },
  },

  // --------------------------------------------------------------------------
  // DIWALI — Festival of Lights: Sky Lanterns, Lotus Carpet Kai & Diya Boats
  // --------------------------------------------------------------------------
  diwali: {
    skyLanternPaper:
      "M -11 -14 C -14 -2 -10 10 -7 15 L 7 15 C 10 10 14 -2 11 -14 " +
      "C 6 -19 -6 -19 -11 -14 Z M -7 15 L 7 15 M -5 -16 C -3 -2 0 8 -2 15 M 5 -16 C 3 -2 0 8 2 15",
    akashKandil:
      // Traditional octagonal geometric lattice lantern + streaming tassels
      "M -8 -18 L 8 -18 L 15 -6 L 8 8 L -8 8 L -15 -6 Z " +
      "M -8 -18 L -4 8 M 8 -18 L 4 8 M -15 -6 L 15 -6 " +
      "M 0 -24 L 0 -18 " +
      "M -6 8 L -8 24 M -2 8 L -2 27 M 2 8 L 2 27 M 6 8 L 8 24",
    lanternFlame: "M 0 13 C -3 9 -2 4 0 1 C 2 4 3 9 0 13 Z",

    rangoliMandala:
      buildRadialMandala(8, 22, 9) +
      " M -9 0 A 9 9 0 1 0 9 0 A 9 9 0 1 0 -9 0 M -4 0 A 4 4 0 1 0 4 0 A 4 4 0 1 0 -4 0",

    diwaliDogGear: {
      // Embroidered geometric Topi cap + jeweled Kalgi feather plume
      topiCap:
        "M 46 -56 L 56 -104 C 84 -116 134 -116 172 -100 L 176 -52 " +
        "C 134 -60 88 -60 46 -56 Z",
      topiPattern:
        "M 52 -76 L 68 -88 L 84 -76 L 100 -88 L 116 -76 L 132 -88 L 148 -76 L 164 -88 L 174 -74",
      kalgiPlume:
        "M 158 -98 A 6 6 0 1 0 170 -98 A 6 6 0 1 0 158 -98 " +
        "M 164 -104 C 160 -132 138 -154 112 -158 C 130 -142 146 -124 158 -102",
      marigoldMala:
        "M 62 14 C 76 34 102 46 132 46 C 154 46 168 34 166 20 " +
        "M 76 28 A 6 6 0 1 0 88 28 M 96 38 A 6 6 0 1 0 108 38 " +
        "M 118 42 A 6 6 0 1 0 130 42 M 140 38 A 6 6 0 1 0 152 38",
      // Ornate Lotus-Medallion Silk Carpet (base details; outer border waves dynamically!)
      carpetMedallion:
        "M 36 168 L 76 154 L 116 164 L 76 178 Z " +
        "M 56 166 L 76 159 L 96 165 L 76 172 Z",
    },

    diwaliBoat: {
      hull:
        // Graceful curved ceremonial river boat carrying glowing terracotta diyas
        "M -46 -4 C -36 10 -14 12 14 12 C 36 12 48 6 52 -6 " +
        "C 46 -2 36 2 14 2 L -32 2 C -40 2 -44 -1 -46 -4 Z " +
        "M -36 6 Q 4 10 40 5",
      diyaBowls:
        // Three sculpted terracotta diya lamps on deck (-22, 0, +22)
        "M -30 2 C -30 -5 -14 -5 -14 2 Z " +
        "M -8 2 C -8 -6 8 -6 8 2 Z " +
        "M 14 2 C 14 -5 30 -5 30 2 Z",
      diyaFlames:
        "M -22 -4 C -25 -9 -24 -14 -22 -17 C -20 -14 -19 -9 -22 -4 Z " +
        "M 0 -5 C -3 -11 -2 -17 0 -21 C 2 -17 3 -11 0 -5 Z " +
        "M 22 -4 C 19 -9 20 -14 22 -17 C 24 -14 25 -9 22 -4 Z " +
        // Delicate light rays around center diya flame
        "M -7 -15 L -5 -14 M 7 -15 L 5 -14 M 0 -26 L 0 -23",
    },
  },
} as const;
