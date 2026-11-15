import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SEASON_META, resolveSeason } from "./config";
import { skylinePxToSvg } from "./pathsCityDetails";
import type { ResolvedSeasonTheme, SeasonTheme } from "./types";

interface SpinnerOption {
  id: SeasonTheme;
  label: string;
  badge: string;
  swatchLight: string;
  swatchDark: string;
}

const SPINNER_OPTIONS: SpinnerOption[] = [
  {
    id: "auto",
    label: "Auto",
    badge: "Calendar",
    swatchLight: "#0d6b58",
    swatchDark: "#47c4a5",
  },
  {
    id: "stPatricks",
    label: "St. Patrick's",
    badge: "Mar 17",
    swatchLight: "#16a34a",
    swatchDark: "#4ade80",
  },
  {
    id: "easter",
    label: "Easter",
    badge: "Spring",
    swatchLight: "#db2777",
    swatchDark: "#f472b6",
  },
  {
    id: "summer",
    label: "Summer",
    badge: "Jun–Aug",
    swatchLight: "#ca8a04",
    swatchDark: "#facc15",
  },
  {
    id: "july4th",
    label: "July 4th",
    badge: "Jul 4",
    swatchLight: "#2563eb",
    swatchDark: "#60a5fa",
  },
  {
    id: "halloween",
    label: "Halloween",
    badge: "Oct 31",
    swatchLight: "#ea580c",
    swatchDark: "#ff6b1a",
  },
  {
    id: "diwali",
    label: "Diwali",
    badge: "Kartik",
    swatchLight: "#d97706",
    swatchDark: "#fbbf24",
  },
  {
    id: "thanksgiving",
    label: "Thanksgiving",
    badge: "Nov",
    swatchLight: "#c2410c",
    swatchDark: "#fb923c",
  },
  {
    id: "christmas",
    label: "Christmas",
    badge: "Dec 25",
    swatchLight: "#dc2626",
    swatchDark: "#f87171",
  },
  {
    id: "winter",
    label: "Winter",
    badge: "Dec–Feb",
    swatchLight: "#0284c7",
    swatchDark: "#38bdf8",
  },
  {
    id: "classic",
    label: "NYC Classic",
    badge: "Random",
    swatchLight: "#7c3aed",
    swatchDark: "#c084fc",
  },
];

const OPTION_COUNT = SPINNER_OPTIONS.length;
const DRUM_RADIUS_PX = 68;
const SLOT_OFFSETS = [-2, -1, 0, 1, 2] as const;

function wrapIndex(idx: number): number {
  return ((idx % OPTION_COUNT) + OPTION_COUNT) % OPTION_COUNT;
}

export interface SeasonSpinnerProps {
  width: number;
  height: number;
  seasonPref: SeasonTheme;
  resolvedSeason: ResolvedSeasonTheme;
  isDark: boolean;
  onSelectSeason: (season: SeasonTheme) => void;
  onEsbHoverChange?: (hovered: boolean) => void;
}

export default function SeasonSpinner({
  width,
  height,
  seasonPref,
  resolvedSeason,
  isDark,
  onSelectSeason,
  onEsbHoverChange,
}: SeasonSpinnerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [anchorPos, setAnchorPos] = useState<{
    left: number;
    top: number;
    side: "right" | "left" | "center";
    notchY: number;
  }>({ left: 0, top: 0, side: "right", notchY: 96 });

  const activeIdx = useMemo(() => {
    const idx = SPINNER_OPTIONS.findIndex((o) => o.id === seasonPref);
    return idx >= 0 ? idx : 0;
  }, [seasonPref]);

  // Continuous floating-point drum wheel position (can wind across multiple turns)
  const [wheelPos, setWheelPos] = useState<number>(activeIdx);
  const targetPosRef = useRef<number>(activeIdx);
  const wheelPosRef = useRef<number>(activeIdx);
  const animRafRef = useRef<number>(0);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    startY: number;
    startPos: number;
    lastY: number;
    lastT: number;
    velocity: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: -1,
    startY: 0,
    startPos: 0,
    lastY: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
  });

  // Sync external seasonPref changes (e.g. URL init) onto the nearest equivalent drum slot
  useEffect(() => {
    const currentWrapped = wrapIndex(Math.round(targetPosRef.current));
    if (currentWrapped !== activeIdx) {
      let delta = activeIdx - currentWrapped;
      if (delta > OPTION_COUNT / 2) delta -= OPTION_COUNT;
      if (delta < -OPTION_COUNT / 2) delta += OPTION_COUNT;
      const nextTarget = Math.round(targetPosRef.current) + delta;
      targetPosRef.current = nextTarget;
      wheelPosRef.current = nextTarget;
      setWheelPos(nextTarget);
    }
  }, [activeIdx]);

  const commitSlot = useCallback(
    (slotNumber: number) => {
      const idx = wrapIndex(slotNumber);
      const nextSeason = SPINNER_OPTIONS[idx].id;
      if (nextSeason !== seasonPref) {
        onSelectSeason(nextSeason);
      }
    },
    [onSelectSeason, seasonPref],
  );

  const animateToTarget = useCallback(
    (nextTarget: number) => {
      targetPosRef.current = nextTarget;
      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        cancelAnimationFrame(animRafRef.current);
        animRafRef.current = 0;
        wheelPosRef.current = nextTarget;
        setWheelPos(nextTarget);
        commitSlot(Math.round(nextTarget));
        return;
      }

      if (animRafRef.current !== 0) return;

      const step = () => {
        const diff = targetPosRef.current - wheelPosRef.current;
        if (Math.abs(diff) < 0.006) {
          wheelPosRef.current = targetPosRef.current;
          setWheelPos(targetPosRef.current);
          animRafRef.current = 0;
          commitSlot(Math.round(targetPosRef.current));
          return;
        }
        wheelPosRef.current += diff * 0.19;
        setWheelPos(wheelPosRef.current);
        // Live-preview each season as the drum clicks past its detent
        commitSlot(Math.round(wheelPosRef.current));
        animRafRef.current = requestAnimationFrame(step);
      };

      animRafRef.current = requestAnimationFrame(step);
    },
    [commitSlot],
  );

  useEffect(() => {
    return () => cancelAnimationFrame(animRafRef.current);
  }, []);

  const stepBy = useCallback(
    (delta: number) => {
      const snappedTarget = Math.round(targetPosRef.current) + delta;
      animateToTarget(snappedTarget);
    },
    [animateToTarget],
  );

  const spinRandom = useCallback(() => {
    // Full multi-click tactile spin that lands on a guaranteed different season
    const extraSteps = OPTION_COUNT + 1 + Math.floor(Math.random() * (OPTION_COUNT - 1));
    animateToTarget(Math.round(targetPosRef.current) + extraSteps);
  }, [animateToTarget]);

  // Compute exact Empire State Building hit box in hero coordinates (px=1222..1317, py=124..560)
  const esbBox = useMemo(() => {
    const topPt = skylinePxToSvg(1269.5, 124, width, height);
    const leftPt = skylinePxToSvg(1222, 295, width, height);
    const rightPt = skylinePxToSvg(1317, 295, width, height);
    const botPt = skylinePxToSvg(1269.5, 560, width, height);

    const rawW = Math.max(44, rightPt.x - leftPt.x);
    const boxLeft = topPt.x - rawW * 0.5;
    const boxTop = Math.max(0, topPt.y - 6);
    const boxHeight = Math.max(88, botPt.y - boxTop);

    return {
      left: Math.round(boxLeft),
      top: Math.round(boxTop),
      width: Math.round(rawW),
      height: Math.round(boxHeight),
    };
  }, [width, height]);

  // Keep portaled spinner popover anchored right beside the Empire State crown
  const updatePopoverAnchor = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn || typeof window === "undefined") return;
    const rect = btn.getBoundingClientRect();
    const popW = 248;
    const popH = 264;
    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const crownClientY = rect.top + Math.min(rect.height * 0.34, 92);
    const clampedTop = Math.max(
      74,
      Math.min(vh - popH - margin, Math.round(crownClientY - 108)),
    );
    const notchY = Math.max(
      28,
      Math.min(popH - 28, Math.round(crownClientY - clampedTop)),
    );

    if (vw < 540) {
      setAnchorPos({
        left: Math.max(margin, Math.round((vw - popW) * 0.5)),
        top: clampedTop,
        side: "center",
        notchY,
      });
    } else if (rect.right + 14 + popW <= vw - margin) {
      setAnchorPos({
        left: Math.round(rect.right + 14),
        top: clampedTop,
        side: "right",
        notchY,
      });
    } else {
      setAnchorPos({
        left: Math.max(margin, Math.round(rect.left - popW - 14)),
        top: clampedTop,
        side: "left",
        notchY,
      });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePopoverAnchor();
    const onRelayout = () => updatePopoverAnchor();
    window.addEventListener("resize", onRelayout);
    window.addEventListener("scroll", onRelayout, { passive: true });
    return () => {
      window.removeEventListener("resize", onRelayout);
      window.removeEventListener("scroll", onRelayout);
    };
  }, [open, updatePopoverAnchor, width, height]);

  // Dismiss on outside pointerdown or Escape; arrow keys spin the dial when open
  useEffect(() => {
    if (!open) return;

    const onPointerDownDoc = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDownDoc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        stepBy(-1);
      } else if (e.key === "Home") {
        e.preventDefault();
        stepBy(-wrapIndex(Math.round(targetPosRef.current)));
      }
    };

    document.addEventListener("pointerdown", onPointerDownDoc);
    document.addEventListener("keydown", onKeyDownDoc);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownDoc);
      document.removeEventListener("keydown", onKeyDownDoc);
    };
  }, [open, stepBy]);

  // Non-passive wheel listener on the drum so scrolling spins the wheel without scrolling the page
  useEffect(() => {
    if (!open) return;
    const drumEl = drumRef.current;
    if (!drumEl) return;

    let wheelAccum = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dy = e.deltaMode === 1 ? e.deltaY * 28 : e.deltaY;
      wheelAccum += dy;
      const threshold = 28;
      if (Math.abs(wheelAccum) >= threshold) {
        const steps = Math.trunc(wheelAccum / threshold);
        wheelAccum -= steps * threshold;
        stepBy(steps);
      }
    };

    drumEl.addEventListener("wheel", onWheel, { passive: false });
    return () => drumEl.removeEventListener("wheel", onWheel);
  }, [open, stepBy]);

  const onDrumPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    cancelAnimationFrame(animRafRef.current);
    animRafRef.current = 0;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startPos: wheelPosRef.current,
      lastY: e.clientY,
      lastT: performance.now(),
      velocity: 0,
      moved: false,
    };
  };

  const onDrumPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    const dy = e.clientY - st.startY;
    if (Math.abs(dy) > 4) st.moved = true;

    const now = performance.now();
    const dt = Math.max(1, now - st.lastT);
    st.velocity = (e.clientY - st.lastY) / dt;
    st.lastY = e.clientY;
    st.lastT = now;

    // Dragging downward rotates the wheel backward (like pulling a physical cylinder down)
    const nextPos = st.startPos - dy / 34;
    wheelPosRef.current = nextPos;
    targetPosRef.current = nextPos;
    setWheelPos(nextPos);
    commitSlot(Math.round(nextPos));
  };

  const onDrumPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    st.active = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already released
    }
    if (st.moved) {
      const momentumSlots = Math.max(
        -4,
        Math.min(4, Math.round((-st.velocity * 140) / 34)),
      );
      const snapped = Math.round(wheelPosRef.current) + momentumSlots;
      animateToTarget(snapped);
    }
  };

  const baseSlot = Math.round(wheelPos);
  const frac = wheelPos - baseSlot;
  const autoResolvedLabel = SEASON_META[resolveSeason("auto")].label;
  const centeredOption = SPINNER_OPTIONS[wrapIndex(baseSlot)];

  return (
    <>
      {/* Hidden Easter-Egg Hit Target Mapped Directly Over the Empire State Building */}
      <button
        ref={triggerRef}
        type="button"
        data-easter-egg="empire-state-trigger"
        aria-label="Empire State Building tower lights — secret season spinner"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) updatePopoverAnchor();
          setOpen((v) => !v);
        }}
        onPointerEnter={() => onEsbHoverChange?.(true)}
        onPointerLeave={() => onEsbHoverChange?.(false)}
        onFocus={() => onEsbHoverChange?.(true)}
        onBlur={() => onEsbHoverChange?.(false)}
        style={{
          left: `${esbBox.left}px`,
          top: `${esbBox.top}px`,
          width: `${esbBox.width}px`,
          height: `${esbBox.height}px`,
        }}
        className="pointer-events-auto absolute z-20 cursor-pointer rounded-sm bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
      />

      {/* Portaled 3D Cylindrical Drum-Wheel Season Spinner */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Empire State Tower Lights Season Spinner"
            data-easter-egg="season-spinner-popover"
            style={{
              left: `${anchorPos.left}px`,
              top: `${anchorPos.top}px`,
              width: "248px",
            }}
            className="fixed z-150 select-none rounded-lg border border-border-subtle bg-surface/95 p-3 shadow-lg backdrop-blur-md"
          >
            {/* Subtle directional diamond notch pointing to the Empire State spire */}
            {anchorPos.side !== "center" && (
              <span
                aria-hidden="true"
                style={{ top: `${anchorPos.notchY - 6}px` }}
                className={`absolute h-3 w-3 rotate-45 border-border-subtle bg-surface/95 ${
                  anchorPos.side === "right"
                    ? "-left-1.5 border-b border-l"
                    : "-right-1.5 border-t border-r"
                }`}
              />
            )}

            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: isDark
                      ? centeredOption.swatchDark
                      : centeredOption.swatchLight,
                  }}
                />
                <span className="font-mono text-[10px] font-semibold tracking-wider text-primary uppercase">
                  ESB Tower Dial
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={spinRandom}
                  title="Spin the wheel to a surprise season"
                  className="rounded-sm border border-border-control bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
                >
                  Spin
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close season spinner"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-sm font-mono text-xs text-foreground-muted transition-colors duration-150 ease-out hover:bg-surface-hover hover:text-foreground"
                >
                  ×
                </button>
              </div>
            </div>

            {/* 3D Cylindrical Drum Wheel + Stepper Controls */}
            <div className="mt-2 flex items-center gap-1.5">
              <div
                ref={drumRef}
                role="listbox"
                aria-label="Season wheel"
                tabIndex={0}
                onPointerDown={onDrumPointerDown}
                onPointerMove={onDrumPointerMove}
                onPointerUp={onDrumPointerUp}
                onPointerCancel={onDrumPointerUp}
                style={{
                  height: "164px",
                  perspective: "420px",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
                }}
                className="relative flex-1 cursor-grab touch-none overflow-hidden rounded-md border border-border-subtle bg-surface-sunken focus:outline-none focus-visible:ring-1 focus-visible:ring-primary active:cursor-grabbing"
              >
                {/* Center active detent selection window */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-1.5 top-1/2 z-0 h-8 -translate-y-1/2 rounded-sm border-y border-primary/50 bg-primary-soft/80"
                />

                {/* 5 cylindrical drum faces rotating smoothly in 3D */}
                <div
                  className="relative h-full w-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {SLOT_OFFSETS.map((slotOffset) => {
                    const slotNum = baseSlot + slotOffset;
                    const optIdx = wrapIndex(slotNum);
                    const opt = SPINNER_OPTIONS[optIdx];
                    const rel = slotOffset - frac;
                    const angleDeg = rel * 25;
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const yPx = Math.sin(angleRad) * DRUM_RADIUS_PX;
                    const zPx =
                      Math.cos(angleRad) * DRUM_RADIUS_PX - DRUM_RADIUS_PX;
                    const scale = 1 - Math.min(0.22, Math.abs(rel) * 0.08);
                    const opacity = Math.max(0.08, 1 - Math.abs(rel) * 0.36);
                    const isCenter = Math.abs(rel) < 0.45;
                    const dotColor = isDark ? opt.swatchDark : opt.swatchLight;

                    return (
                      <div
                        key={slotOffset}
                        role="option"
                        aria-selected={isCenter}
                        onClick={() => {
                          if (
                            !dragStateRef.current.moved &&
                            slotOffset !== 0
                          ) {
                            stepBy(slotOffset);
                          }
                        }}
                        style={{
                          transform: `translate3d(0, ${yPx.toFixed(1)}px, ${zPx.toFixed(1)}px) rotateX(${(-angleDeg).toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                          opacity: +opacity.toFixed(2),
                        }}
                        className={`absolute inset-x-2 top-1/2 z-10 flex h-8 -translate-y-1/2 items-center justify-between gap-2 px-2 font-mono text-[11px] tabular-nums ${
                          isCenter
                            ? "font-semibold text-on-primary-soft"
                            : "cursor-pointer font-normal text-foreground-muted"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate">
                          <span
                            aria-hidden="true"
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span className="truncate">{opt.label}</span>
                        </span>
                        <span
                          className={`shrink-0 text-[9px] tabular-nums ${
                            isCenter
                              ? "text-on-primary-soft/85"
                              : "text-foreground-muted"
                          }`}
                        >
                          {opt.id === "auto" ? autoResolvedLabel : opt.badge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Up / Down tactile detent steppers */}
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => stepBy(-1)}
                  aria-label="Previous season"
                  className="inline-flex h-7 w-6 items-center justify-center rounded-sm border border-border-control bg-background font-mono text-[10px] text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => stepBy(1)}
                  aria-label="Next season"
                  className="inline-flex h-7 w-6 items-center justify-center rounded-sm border border-border-control bg-background font-mono text-[10px] text-foreground transition-colors duration-150 ease-out hover:bg-surface-hover"
                >
                  ▼
                </button>
              </div>
            </div>

            {/* Active theme micro-footer */}
            <p className="mt-2 truncate border-t border-border-subtle pt-1.5 font-mono text-[10px] text-foreground-muted tabular-nums">
              {SEASON_META[resolvedSeason].label} ·{" "}
              {SEASON_META[resolvedSeason].badge}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
