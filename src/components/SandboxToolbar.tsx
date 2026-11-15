import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SEASON_META, resolveSeason } from "./NycBackground/config";
import { SVG_PATHS } from "./NycBackground/paths";
import type { ResolvedSeasonTheme, SeasonTheme } from "./NycBackground/types";

const SEASON_OPTIONS: Array<{ id: SeasonTheme; label: string }> = [
  { id: "auto", label: "Auto" },
  { id: "stPatricks", label: "St. Pat's" },
  { id: "easter", label: "Easter" },
  { id: "summer", label: "Summer" },
  { id: "july4th", label: "July 4th" },
  { id: "halloween", label: "Halloween" },
  { id: "diwali", label: "Diwali" },
  { id: "thanksgiving", label: "Thanksgiving" },
  { id: "christmas", label: "Christmas" },
  { id: "winter", label: "Winter" },
  { id: "classic", label: "NYC" },
];

const VALID_OPTION_IDS = new Set<SeasonTheme>(
  SEASON_OPTIONS.map((opt) => opt.id),
);

export default function SandboxToolbar() {
  const [seasonPref, setSeasonPref] = useState<SeasonTheme>("auto");
  const [inspectInk, setInspectInk] = useState(false);
  const [showSpecimens, setShowSpecimens] = useState(false);
  const [specimenReplay, setSpecimenReplay] = useState(0);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get(
      "season",
    ) as SeasonTheme | null;
    if (param && VALID_OPTION_IDS.has(param)) {
      setSeasonPref(param);
    } else {
      setSeasonPref("auto");
    }

    const onSeasonChanged = (event: Event) => {
      const next = (event as CustomEvent<{ season?: SeasonTheme }>).detail
        ?.season;
      if (next && VALID_OPTION_IDS.has(next)) {
        setSeasonPref(next);
      }
    };
    window.addEventListener("nyc-hero:season-changed", onSeasonChanged);
    return () =>
      window.removeEventListener("nyc-hero:season-changed", onSeasonChanged);
  }, []);

  const activeSeason: ResolvedSeasonTheme = resolveSeason(seasonPref);

  const replayDraw = () => {
    setSpecimenReplay((n) => n + 1);
    window.dispatchEvent(
      new CustomEvent("nyc-hero:control", { detail: { replayDraw: true } }),
    );
  };

  const toggleInspectInk = () => {
    const next = !inspectInk;
    setInspectInk(next);
    window.dispatchEvent(
      new CustomEvent("nyc-hero:control", { detail: { inspectInk: next } }),
    );
  };

  return (
    <>
      <div className="sandbox-toolbar flex flex-wrap items-center gap-2">
        {/* Redraw stroke animation (`button-studio-compact`: 32px height, `border-control`) */}
        <button
          type="button"
          onClick={replayDraw}
          title="Replay SVG stroke line-drawing animation"
          className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border-control bg-surface px-2.5 font-mono text-xs font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
        >
          Redraw
        </button>

        {/* Toggle 40% production opacity vs 95% artwork inspection */}
        <button
          type="button"
          onClick={toggleInspectInk}
          aria-pressed={inspectInk}
          title="Toggle between 40% hero background opacity and 95% line-art inspection contrast"
          className={`inline-flex h-8 items-center rounded-sm border px-2.5 font-mono text-xs font-medium tabular-nums transition-colors duration-150 ease-out ${
            inspectInk
              ? "border-primary bg-primary-soft text-on-primary-soft"
              : "border-border-control bg-surface text-foreground hover:bg-surface-hover"
          }`}
        >
          {inspectInk ? "Ink: 95%" : "Ink: 40%"}
        </button>

        {/* Close-up SVG Specimen Inspector */}
        <button
          type="button"
          onClick={() => {
            setShowSpecimens((v) => !v);
            setSpecimenReplay((n) => n + 1);
          }}
          aria-expanded={showSpecimens}
          className="inline-flex h-8 items-center rounded-sm border border-border-control bg-surface px-2.5 font-mono text-xs font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
        >
          SVG Sheet
        </button>
      </div>

      {/* Close-up SVG Specimen Sheet modal (portaled to body so header backdrop-blur doesn't clip fixed positioning) */}
      {showSpecimens &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Seasonal SVG Line Drawing Specimens"
            className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSpecimens(false);
            }}
          >
            <div className="max-h-[86vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-border-subtle bg-background p-6 shadow-lg">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border-subtle pb-4">
                <div>
                  <p className="font-mono text-xs font-medium text-primary tabular-nums">
                    {SEASON_META[activeSeason].badge} ·{" "}
                    {SEASON_META[activeSeason].label}
                    {seasonPref === "auto" ? " (Auto [-4, +3] Window)" : ""}
                  </p>
                  <h2 className="mt-1 !text-2xl font-bold">
                    Animated SVG Line-Drawing Sheet
                  </h2>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {SEASON_META[activeSeason].summary}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpecimenReplay((n) => n + 1)}
                    className="inline-flex h-8 items-center rounded-sm border border-border-control bg-surface px-3 font-mono text-xs font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
                  >
                    Replay Ink Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSpecimens(false)}
                    className="inline-flex h-8 items-center rounded-sm bg-primary px-3 font-mono text-xs font-medium text-on-primary transition-colors duration-150 ease-out hover:bg-primary-hover"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div
                key={specimenReplay}
                className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {/* St. Patrick's Day specimens */}
                <SpecimenCard
                  title="Leprechaun Kai & Rainbow Pot of Gold"
                  tag="St. Patrick's"
                  viewBox="-140 -174 432 384"
                >
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.rainbowOuter}
                    stroke="var(--primary)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.2}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.rainbowMid}
                    stroke="var(--accent)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={3.6}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.rainbowInner}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={3.4}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.potCauldron}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.4}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.potCoins}
                    stroke="var(--accent)"
                    strokeWidth={3.4}
                  />
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.bowtie}
                    stroke="var(--primary)"
                    strokeWidth={4.0}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.hatCrown}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.hatBrimAndBand}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.hatBuckle}
                    stroke="var(--accent)"
                    strokeWidth={3.8}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.leprechaunDogGear.hatShamrock}
                    stroke="var(--primary)"
                    strokeWidth={3.8}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Emerald Harbor Ferry & Four-Leaf Clover"
                  tag="St. Patrick's"
                  viewBox="-92 -46 156 66"
                >
                  <path
                    d={SVG_PATHS.stPatricks.emeraldBoat.emeraldWake}
                    stroke="var(--primary)"
                    strokeWidth={1.1}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.emeraldBoat.hull}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.3}
                  />
                  <path
                    d={SVG_PATHS.stPatricks.emeraldBoat.buntingAndShamrock}
                    stroke="var(--primary)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.15}
                  />
                  <g transform="translate(44, -22) scale(0.95)">
                    <path
                      d={SVG_PATHS.stPatricks.shamrock4}
                      stroke="var(--primary)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.15}
                    />
                  </g>
                </SpecimenCard>

                {/* Easter specimens */}
                <SpecimenCard
                  title="Fifth Ave Bonnet & Bunny-Ears Kai"
                  tag="Easter"
                  viewBox="-122 -186 372 398"
                >
                  <path
                    d={SVG_PATHS.easter.easterDogGear.basketEggs}
                    stroke="var(--accent)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.0}
                  />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.basketHull}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.basketWeave}
                    strokeWidth={3.0}
                  />
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.bonnetRibbons}
                    stroke="var(--accent)"
                    strokeWidth={3.8}
                  />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.earBack}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.4}
                  />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.earFront}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.4}
                  />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.bonnetBrim}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.easter.easterDogGear.bonnetFlowers}
                    stroke="var(--primary)"
                    strokeWidth={3.8}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Painted Egg Balloon & Tulip Ferry"
                  tag="Easter"
                  viewBox="-56 -60 162 132"
                >
                  <g transform="translate(-14, 0)">
                    <path
                      d={SVG_PATHS.easter.eggBalloon.envelope}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.35}
                    />
                    <path
                      d={SVG_PATHS.easter.eggBalloon.patterns[0]}
                      stroke="var(--accent)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.05}
                    />
                    <path
                      d={SVG_PATHS.easter.eggBalloon.basketAndRigging}
                      strokeWidth={1.0}
                    />
                  </g>
                  <g transform="translate(56, 46) scale(0.92)">
                    <path
                      d={SVG_PATHS.easter.springBoat.hull}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.3}
                    />
                    <path
                      d={SVG_PATHS.easter.springBoat.tulips}
                      stroke="var(--accent)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.15}
                    />
                  </g>
                </SpecimenCard>

                {/* Summer specimens */}
                <SpecimenCard
                  title="Aviator Kai Surfing the Hudson"
                  tag="Summer"
                  viewBox="-172 -130 474 342"
                >
                  <path
                    d={SVG_PATHS.summer.summerDogGear.surfboard}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.summer.summerDogGear.waterWave}
                    stroke="var(--primary)"
                    strokeWidth={3.8}
                  />
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.summer.summerDogGear.bandana}
                    fill="var(--background)"
                    stroke="var(--accent)"
                    strokeWidth={4.2}
                  />
                  <path
                    d={SVG_PATHS.summer.summerDogGear.sunCap}
                    fill="var(--background)"
                    stroke="var(--primary)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.summer.summerDogGear.aviators}
                    fill="var(--background)"
                    strokeWidth={4.2}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Kite-Flying Summer Barge & Banner Plane"
                  tag="Summer"
                  viewBox="-132 -128 196 146"
                >
                  <g transform="translate(22, -104) scale(0.88)">
                    <path
                      d="M -28 1 L -48 2 M -48 -9 L -138 -9 L -132 2 L -138 13 L -48 13 Z"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.05}
                    />
                    <path
                      d="M -56 -1 Q -74 -5 -92 -1 Q -110 3 -126 -1 M -56 5 Q -74 1 -92 5 Q -110 9 -124 5"
                      stroke="var(--accent)"
                      strokeWidth={0.95}
                    />
                    <path
                      d={SVG_PATHS.summer.biplane.body}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.25}
                    />
                  </g>
                  <g transform="translate(4, 0)">
                    <path
                      d="M -19 -21 Q -42 -48 -72 -76"
                      strokeWidth={0.9}
                      opacity={0.85}
                    />
                    <g transform="translate(-74, -78) rotate(-22)">
                      <path
                        d={SVG_PATHS.summer.summerBoat.kiteTailStatic}
                        stroke="var(--accent)"
                        strokeWidth={1.0}
                      />
                      <path
                        d={SVG_PATHS.summer.summerBoat.diamondKite}
                        fill="var(--background)"
                        stroke="var(--accent)"
                        pathLength={1}
                        className="nyc-ink-path"
                        strokeWidth={1.2}
                      />
                    </g>
                    <path
                      d={SVG_PATHS.summer.summerBoat.kiteFlyerPrimary}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.2}
                    />
                    <path
                      d={SVG_PATHS.summer.summerBoat.kiteFlyerSecondary}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.2}
                    />
                    <path
                      d={SVG_PATHS.summer.summerBoat.hull}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.25}
                    />
                    <path
                      d={SVG_PATHS.summer.summerBoat.iceCreamCone}
                      stroke="var(--accent)"
                      strokeWidth={1.05}
                    />
                    <path
                      d={SVG_PATHS.summer.summerBoat.umbrellaPole}
                      strokeWidth={1.05}
                    />
                    <path
                      d={SVG_PATHS.summer.summerBoat.umbrellaCanopy}
                      stroke="var(--primary)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.15}
                    />
                  </g>
                </SpecimenCard>

                {/* July 4th specimens */}
                <SpecimenCard
                  title="Uncle Sam Kai on Sky-Rocket Cruiser"
                  tag="July 4th"
                  viewBox="-166 -178 456 410"
                >
                  <path
                    d={SVG_PATHS.july4th.patriotDogGear.rocketBody}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <g transform="translate(-136, 195)">
                    <path
                      d={SVG_PATHS.july4th.patriotDogGear.sparklerRays}
                      stroke="var(--accent)"
                      strokeWidth={3.6}
                    />
                  </g>
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.july4th.patriotDogGear.neckerchief}
                    fill="var(--background)"
                    stroke="var(--accent)"
                    strokeWidth={4.2}
                  />
                  <path
                    d={SVG_PATHS.july4th.patriotDogGear.hatCrown}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.july4th.patriotDogGear.hatStripesAndBrim}
                    fill="var(--background)"
                    stroke="var(--primary)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.2}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="FDNY Fireboat Water-Cannon Arches"
                  tag="July 4th"
                  viewBox="-96 -70 190 88"
                >
                  <path
                    d={SVG_PATHS.july4th.fireboat.archBack}
                    stroke="var(--primary)"
                    strokeDasharray="4 3"
                    strokeWidth={1.15}
                  />
                  <path
                    d={SVG_PATHS.july4th.fireboat.archMid}
                    stroke="var(--accent)"
                    strokeDasharray="4 3"
                    strokeWidth={1.2}
                  />
                  <path
                    d={SVG_PATHS.july4th.fireboat.archFront}
                    stroke="var(--primary)"
                    strokeDasharray="4 3"
                    strokeWidth={1.15}
                  />
                  <path
                    d={SVG_PATHS.july4th.fireboat.hull}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.3}
                  />
                </SpecimenCard>

                {/* Diwali specimens */}
                <SpecimenCard
                  title="Kalgi Topi & Lotus-Carpet Kai"
                  tag="Diwali"
                  viewBox="-146 -170 426 382"
                >
                  <path
                    d="M -126 164 Q -24 146 76 154 Q 176 162 254 148 L 242 184 Q 166 198 72 190 Q -28 182 -116 196 Z"
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.diwali.diwaliDogGear.carpetMedallion}
                    stroke="var(--accent)"
                    strokeWidth={3.6}
                  />
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.diwali.diwaliDogGear.marigoldMala}
                    stroke="var(--accent)"
                    strokeWidth={4.0}
                  />
                  <path
                    d={SVG_PATHS.diwali.diwaliDogGear.topiCap}
                    fill="var(--background)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.diwali.diwaliDogGear.topiPattern}
                    stroke="var(--accent)"
                    strokeWidth={3.6}
                  />
                  <path
                    d={SVG_PATHS.diwali.diwaliDogGear.kalgiPlume}
                    stroke="var(--primary)"
                    strokeWidth={4.0}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Akash Kandil, Rangoli & Diya Boat"
                  tag="Diwali"
                  viewBox="-66 -54 136 74"
                >
                  <g transform="translate(-38, -24) scale(0.85)">
                    <path
                      d={SVG_PATHS.diwali.akashKandil}
                      stroke="var(--accent)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.15}
                    />
                  </g>
                  <g transform="translate(38, -26) scale(0.75)">
                    <path
                      d={SVG_PATHS.diwali.rangoliMandala}
                      stroke="var(--primary)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.1}
                    />
                  </g>
                  <g transform="translate(0, 6)">
                    <path
                      d={SVG_PATHS.diwali.diwaliBoat.hull}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.3}
                    />
                    <path
                      d={SVG_PATHS.diwali.diwaliBoat.diyaBowls}
                      stroke="var(--accent)"
                      strokeWidth={1.1}
                    />
                    <path
                      d={SVG_PATHS.diwali.diwaliBoat.diyaFlames}
                      stroke="var(--primary)"
                      strokeWidth={1.05}
                    />
                  </g>
                </SpecimenCard>

                {/* Thanksgiving specimens */}
                <SpecimenCard
                  title="Macy's Turkey Parade Balloon"
                  tag="Thanksgiving"
                  viewBox="-85 -72 175 156"
                >
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.tailFan}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.5}
                  />
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.tailRibs}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.0}
                  />
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.body}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.5}
                  />
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.seams}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.0}
                  />
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.hat}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.5}
                  />
                  <path
                    d={SVG_PATHS.paradeBalloons.turkey.hatBand}
                    stroke="var(--accent)"
                    strokeWidth={1.2}
                  />
                  <path
                    d="M -14 29 Q -18 52 -24 74 M 2 32 Q -2 54 -8 76 M 18 30 Q 14 52 8 74 M 34 16 Q 30 42 24 66"
                    strokeWidth={0.9}
                    opacity={0.75}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Pilgrim Kai on Maple-Leaf Glider"
                  tag="Thanksgiving"
                  viewBox="-190 -178 575 490"
                >
                  <path
                    d={SVG_PATHS.pilgrimDogGear.mapleBlade}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.pilgrimDogGear.mapleVeins}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={3}
                  />
                  <path
                    d={SVG_PATHS.pilgrimDogGear.mapleStem}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  {SVG_PATHS.pilgrimDogGear.feathers.map((f, idx) => (
                    <g key={idx}>
                      <path
                        d={f.outline}
                        pathLength={1}
                        className="nyc-ink-path"
                        strokeWidth={4.5}
                      />
                      <path
                        d={f.detail}
                        stroke={idx % 2 === 1 ? "var(--accent)" : undefined}
                        strokeWidth={3}
                      />
                    </g>
                  ))}
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.pilgrimDogGear.hatCrown}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.pilgrimDogGear.hatBrimAndBuckle}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Hudson Harvest Pie Steamboat"
                  tag="Thanksgiving"
                  viewBox="-60 -66 116 86"
                >
                  <path
                    d={SVG_PATHS.harvestBoat.hullAndCabin}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.3}
                  />
                  <path
                    d={SVG_PATHS.harvestBoat.pieAndPumpkins}
                    stroke="var(--accent)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.1}
                  />
                  <path
                    d={SVG_PATHS.harvestBoat.paddleWheelRim}
                    strokeWidth={1.2}
                  />
                  <path
                    d={SVG_PATHS.harvestBoat.paddleSpokes}
                    strokeWidth={0.9}
                  />
                  <path
                    d="M -6 -38 C -10 -44 -2 -49 -7 -55 M 26 -15 C 24 -20 29 -24 26 -29"
                    stroke="var(--accent)"
                    strokeWidth={0.95}
                  />
                </SpecimenCard>

                {/* Christmas specimens */}
                <SpecimenCard
                  title="Santa's Sleigh & Rudolph Team"
                  tag="Christmas"
                  viewBox="-58 -46 262 74"
                >
                  <path
                    d={SVG_PATHS.santaSleigh.runners}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.1}
                  />
                  <path
                    d={SVG_PATHS.santaSleigh.giftsAndSack}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.1}
                  />
                  <path
                    d={SVG_PATHS.santaSleigh.santa}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.3}
                  />
                  <path
                    d={SVG_PATHS.santaSleigh.santaWaveArm}
                    strokeWidth={1.3}
                  />
                  <path
                    d={SVG_PATHS.santaSleigh.body}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.4}
                  />
                  <path
                    d="M 34 -11 Q 54 -4 74 -9 Q 96 -4 118 -9 Q 142 -4 164 -9"
                    strokeWidth={0.9}
                    opacity={0.8}
                  />
                  {[62, 108, 154].map((rx, idx) => (
                    <g key={rx} transform={`translate(${rx}, 0)`}>
                      <path d={SVG_PATHS.reindeer.antlers} strokeWidth={1.0} />
                      <path
                        d={SVG_PATHS.reindeer.bodyAndHead}
                        pathLength={1}
                        className="nyc-ink-path"
                        strokeWidth={1.3}
                      />
                      <path
                        d={SVG_PATHS.reindeer.frontLegA}
                        strokeWidth={1.2}
                      />
                      <path d={SVG_PATHS.reindeer.hindLegA} strokeWidth={1.2} />
                      {idx === 2 && (
                        <circle
                          cx={28.5}
                          cy={-17.5}
                          r={2.4}
                          fill="var(--accent)"
                          stroke="var(--accent)"
                        />
                      )}
                    </g>
                  ))}
                </SpecimenCard>

                <SpecimenCard
                  title="Santa-Paws Kai on Candy-Cane Sled"
                  tag="Christmas"
                  viewBox="-145 -155 470 375"
                >
                  <path
                    d={SVG_PATHS.santaDogGear.sledGifts}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={3.6}
                  />
                  <path
                    d={SVG_PATHS.santaDogGear.sledDeckAndRunner}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.santaDogGear.scarfTailLower}
                    stroke="var(--accent)"
                    strokeWidth={4.5}
                  />
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.santaDogGear.scarfTailUpper}
                    stroke="var(--accent)"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.santaDogGear.scarfNeck}
                    stroke="var(--accent)"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.santaDogGear.jingleBell}
                    strokeWidth={3.6}
                  />
                  <path
                    d={SVG_PATHS.santaDogGear.hatCrownFill}
                    stroke="var(--accent)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path d={SVG_PATHS.santaDogGear.hatBrim} strokeWidth={4.5} />
                  <path d={SVG_PATHS.santaDogGear.pomPom} strokeWidth={4.5} />
                </SpecimenCard>

                <SpecimenCard
                  title="Rockefeller Spruce Tug & Barge"
                  tag="Christmas"
                  viewBox="-94 -66 158 84"
                >
                  <path
                    d={SVG_PATHS.holidayTreeBoat.tugAndTow}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.3}
                  />
                  <path
                    d={SVG_PATHS.holidayTreeBoat.spruceBoughs}
                    stroke="var(--primary)"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.3}
                  />
                  <path
                    d={SVG_PATHS.holidayTreeBoat.garlandAndWreath}
                    stroke="var(--accent)"
                    strokeWidth={1.0}
                  />
                  <path
                    d={SVG_PATHS.holidayTreeBoat.starTopper}
                    stroke="var(--accent)"
                    strokeWidth={1.1}
                  />
                </SpecimenCard>

                {/* Winter specimens */}
                <SpecimenCard
                  title="Central Park Snowy Owl & Crystals"
                  tag="Winter"
                  viewBox="-64 -42 132 72"
                >
                  <g transform="translate(-18, 4) scale(1.15)">
                    <path
                      d={SVG_PATHS.snowyOwl.farWing}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.0}
                    />
                    <path
                      d={SVG_PATHS.snowyOwl.bodyAndHead}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.25}
                    />
                    <path
                      d={SVG_PATHS.snowyOwl.nearWing}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.25}
                    />
                  </g>
                  <g transform="translate(36, -16) scale(0.95)">
                    <path
                      d={SVG_PATHS.snowflakes.dendrite}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.0}
                    />
                  </g>
                  <g transform="translate(42, 14) scale(0.8)">
                    <path
                      d={SVG_PATHS.snowflakes.fernStar}
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.0}
                    />
                  </g>
                </SpecimenCard>

                <SpecimenCard
                  title="Winter Earmuff & Snowboard Kai"
                  tag="Winter"
                  viewBox="-165 -160 455 360"
                >
                  <path
                    d={SVG_PATHS.winterDogGear.snowboard}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.winterDogGear.snowboardDetails}
                    stroke="var(--primary)"
                    strokeWidth={3.5}
                  />
                  <KaiStaticSpecimen sw={4.5} />
                  <path
                    d={SVG_PATHS.winterDogGear.scarfStream}
                    stroke="var(--primary)"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.winterDogGear.scarfNeck}
                    stroke="var(--primary)"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.winterDogGear.beanieCap}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                  <path
                    d={SVG_PATHS.winterDogGear.beanieDetails}
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={4.5}
                  />
                </SpecimenCard>

                {/* New City-Landmark & Festival Specimens */}
                <SpecimenCard
                  title="Staten Island Ferry (Harbor Orange)"
                  tag="All Seasons"
                  viewBox="-86 -40 152 60"
                >
                  <path
                    d={SVG_PATHS.statenIslandFerry.wakeRipples}
                    stroke="#ea580c"
                    strokeWidth={0.95}
                    opacity={0.7}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.hull}
                    fill="#f97316"
                    fillOpacity={0.26}
                    stroke="#ea580c"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.25}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.rubRailAndPortals}
                    stroke="#ea580c"
                    strokeWidth={0.95}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.lowerDeck}
                    fill="#f97316"
                    fillOpacity={0.22}
                    stroke="#ea580c"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.2}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.upperDeck}
                    fill="#f97316"
                    fillOpacity={0.18}
                    stroke="#ea580c"
                    pathLength={1}
                    className="nyc-ink-path"
                    strokeWidth={1.15}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.pilotHousesAndStack}
                    fill="#f97316"
                    fillOpacity={0.22}
                    stroke="#ea580c"
                    strokeWidth={1.1}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.lowerWindows}
                    stroke="#fbbf24"
                    strokeWidth={1.8}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.upperWindows}
                    stroke="#fbbf24"
                    strokeWidth={1.7}
                  />
                  <path
                    d={SVG_PATHS.statenIslandFerry.bridgeWindows}
                    stroke="#fde68a"
                    strokeWidth={1.6}
                  />
                </SpecimenCard>

                <SpecimenCard
                  title="Shaped Fireworks & USA Drone Formation"
                  tag="July 4th"
                  viewBox="-96 -52 192 104"
                >
                  {/* Star & Heart Fireworks on Left */}
                  <g transform="translate(-58, -12) scale(0.56)">
                    <path
                      d="M 0 -46 L 11.2 -15.4 L 43.7 -14.2 L 18.1 5.9 L 27.0 37.2 L 0 19 L -27.0 37.2 L -18.1 5.9 L -43.7 -14.2 L -11.2 -15.4 Z"
                      stroke="var(--accent)"
                      strokeDasharray="4 3"
                      strokeWidth={2.0}
                    />
                  </g>
                  <g transform="translate(-56, 26) scale(0.45)">
                    <path
                      d="M 0 -22 C 18 -42 42 -18 0 26 C -42 -18 -18 -42 0 -22 Z"
                      stroke="var(--primary)"
                      strokeDasharray="4 3"
                      strokeWidth={2.2}
                    />
                  </g>
                  {/* USA Drone Light Matrix on Right */}
                  <g transform="translate(26, 2) scale(0.84)">
                    {[
                      [-66, -20], [-66, -10], [-66, 0], [-66, 10],
                      [-61, 19], [-54, 22], [-46, 22], [-39, 19],
                      [-34, 10], [-34, 0], [-34, -10], [-34, -20],
                      [14, -15], [7, -21], [-3, -21], [-12, -17], [-15, -9],
                      [-8, -2], [2, 2], [11, 7],
                      [15, 15], [8, 21], [-3, 21], [-14, 15],
                      [34, 22], [38, 11], [42, 0], [46, -11], [50, -22],
                      [54, -11], [58, 0], [62, 11], [66, 22],
                      [42, 6], [50, 6], [58, 6],
                    ].map(([dx, dy], idx) => (
                      <circle
                        key={idx}
                        cx={dx}
                        cy={dy}
                        r={2.1}
                        fill={idx < 12 ? "var(--accent)" : idx < 24 ? "currentColor" : "var(--primary)"}
                        stroke="none"
                      />
                    ))}
                  </g>
                </SpecimenCard>

                <SpecimenCard
                  title="Liberty Bat, Waterfront Pumpkins & Black Cat"
                  tag="Halloween"
                  viewBox="-48 -24 96 42"
                >
                  <g transform="translate(-30, -18) scale(1.25)">
                    <path d={SVG_PATHS.cityDetails.libertyBat.wingLeft} strokeWidth={0.9} />
                    <path d={SVG_PATHS.cityDetails.libertyBat.wingRight} strokeWidth={0.9} />
                    <path d={SVG_PATHS.cityDetails.libertyBat.body} strokeWidth={1.0} />
                  </g>
                  <g transform="translate(0, 12) scale(1.35)">
                    <path
                      d={SVG_PATHS.cityDetails.waterfrontPumpkin.pairOutline}
                      stroke="var(--accent)"
                      pathLength={1}
                      className="nyc-ink-path"
                      strokeWidth={1.0}
                    />
                    <path
                      d={SVG_PATHS.cityDetails.waterfrontPumpkin.pairFace}
                      stroke="var(--accent)"
                      strokeWidth={0.8}
                    />
                  </g>
                  <g transform="translate(28, 12) scale(1.4)">
                    <path d={SVG_PATHS.cityDetails.blackCat.hindLegsA} strokeWidth={1.0} />
                    <path d={SVG_PATHS.cityDetails.blackCat.frontLegsA} strokeWidth={1.0} />
                    <path d={SVG_PATHS.cityDetails.blackCat.tail} strokeWidth={1.15} />
                    <path
                      d={SVG_PATHS.cityDetails.blackCat.bodyAndHead}
                      fill="currentColor"
                      strokeWidth={0.9}
                    />
                    <circle cx={6.8} cy={-8.4} r={0.85} fill="var(--background)" stroke="none" />
                  </g>
                </SpecimenCard>

                <SpecimenCard
                  title="Diwali Candles & Christmas/Winter Wreath & Snowmen"
                  tag="Diwali · Winter"
                  viewBox="-54 -30 108 40"
                >
                  {/* Window frame + glowing candle */}
                  <g transform="translate(-34, -6) scale(1.5)">
                    <rect x={-5.5} y={-11} width={11} height={15} rx={1} strokeWidth={0.8} opacity={0.6} />
                    <path d={SVG_PATHS.cityDetails.windowCandle.waxPillar} stroke="var(--accent)" strokeWidth={0.9} />
                    <path d={SVG_PATHS.cityDetails.windowCandle.flame} fill="var(--accent)" stroke="var(--accent)" strokeWidth={0.8} />
                    <path d={SVG_PATHS.cityDetails.windowCandle.rays} stroke="var(--accent)" strokeWidth={0.75} />
                  </g>
                  {/* Building holly wreath */}
                  <g transform="translate(0, -12) scale(1.35)">
                    <path d={SVG_PATHS.cityDetails.buildingWreath.hollyRing} stroke="var(--primary)" strokeWidth={1.0} />
                    <path d={SVG_PATHS.cityDetails.buildingWreath.bowAndTails} stroke="var(--accent)" strokeWidth={0.95} />
                  </g>
                  {/* Waterfront snowman */}
                  <g transform="translate(32, 6) scale(1.25)">
                    <path d={SVG_PATHS.cityDetails.waterfrontSnowman.leftTwigArm} strokeWidth={0.9} />
                    <g transform="translate(3.6, -13.4)">
                      <path d={SVG_PATHS.cityDetails.waterfrontSnowman.rightTwigArm} strokeWidth={0.9} />
                    </g>
                    <path d={SVG_PATHS.cityDetails.waterfrontSnowman.bodyBalls} fill="var(--background)" strokeWidth={1.0} />
                    <path d={SVG_PATHS.cityDetails.waterfrontSnowman.coalAndButtons} strokeWidth={0.85} />
                    <path d={SVG_PATHS.cityDetails.waterfrontSnowman.carrotNose} stroke="var(--accent)" strokeWidth={0.85} />
                    <path d={SVG_PATHS.cityDetails.waterfrontSnowman.scarf} stroke="var(--accent)" strokeWidth={1.1} />
                    <path d={SVG_PATHS.cityDetails.waterfrontSnowman.topHat} fill="var(--background)" strokeWidth={1.0} />
                  </g>
                </SpecimenCard>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function SpecimenCard({
  title,
  tag,
  viewBox,
  children,
}: {
  title: string;
  tag: string;
  viewBox: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border-subtle bg-surface p-3.5">
      <div className="flex h-36 items-center justify-center rounded-sm bg-surface-sunken p-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-full w-full text-foreground/85"
        >
          {children}
        </svg>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="rounded-pill border border-border-subtle bg-background px-2 py-0.5 font-mono text-[11px] font-medium text-foreground tabular-nums">
          {tag}
        </span>
      </div>
    </div>
  );
}

function KaiStaticSpecimen({ sw }: { sw: number }) {
  const mask = "var(--background)";
  return (
    <>
      <path d={SVG_PATHS.kaiDog.tail} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.legs} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.belly} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.chest} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.body} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.ear} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.hands} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.nose} fill={mask} strokeWidth={sw} />
      <path d={SVG_PATHS.kaiDog.face} strokeWidth={sw} />
    </>
  );
}
