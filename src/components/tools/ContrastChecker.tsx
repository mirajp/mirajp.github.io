import { useMemo, useState } from "react";

const PRESETS: { label: string; hex: string }[] = [
  { label: "Background", hex: "#FAF9F6" },
  { label: "Surface", hex: "#F0EEE7" },
  { label: "Foreground", hex: "#1C2624" },
  { label: "Muted", hex: "#5E6A67" },
  { label: "Primary", hex: "#0F6E5C" },
  { label: "Accent", hex: "#C14E32" },
  { label: "White", hex: "#FFFFFF" },
  { label: "Black", hex: "#000000" },
];

function normalizeHex(input: string): string | null {
  let h = input.trim();
  if (!h.startsWith("#")) h = `#${h}`;
  if (/^#([0-9a-fA-F]{3})$/.test(h)) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return /^#([0-9a-fA-F]{6})$/.test(h) ? h.toUpperCase() : null;
}

function relLuminance(hex: string): number {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const L1 = relLuminance(hexA);
  const L2 = relLuminance(hexB);
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (lighter + 0.05) / (darker + 0.05);
}

function PassBadge({ pass, label }: { pass: boolean; label: string }) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
        pass
          ? "border-primary/30 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300"
          : "border-error/30 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-300"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono text-xs font-semibold">{pass ? "PASS" : "FAIL"}</span>
    </div>
  );
}

export default function ContrastChecker() {
  const [fgInput, setFgInput] = useState("#1C2624");
  const [bgInput, setBgInput] = useState("#FAF9F6");

  const fg = normalizeHex(fgInput);
  const bg = normalizeHex(bgInput);
  const bothValid = fg !== null && bg !== null;

  const ratio = useMemo(() => (bothValid ? contrastRatio(fg!, bg!) : null), [fg, bg, bothValid]);

  function swap() {
    setFgInput(bgInput);
    setBgInput(fgInput);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="fg-input" className="text-sm font-medium text-foreground">
            Text color
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              aria-label="Text color picker"
              value={fg ?? "#000000"}
              onChange={(e) => setFgInput(e.target.value)}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
            />
            <input
              id="fg-input"
              type="text"
              value={fgInput}
              onChange={(e) => setFgInput(e.target.value)}
              spellCheck={false}
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bg-input" className="text-sm font-medium text-foreground">
            Background color
          </label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              aria-label="Background color picker"
              value={bg ?? "#FFFFFF"}
              onChange={(e) => setBgInput(e.target.value)}
              className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-1"
            />
            <input
              id="bg-input"
              type="text"
              value={bgInput}
              onChange={(e) => setBgInput(e.target.value)}
              spellCheck={false}
              className="min-h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground-muted">Quick pick:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setFgInput(p.hex)}
            title={`Set text color to ${p.label}`}
            className="flex items-center gap-1.5 rounded-full border border-border py-1 pl-1 pr-2.5 text-xs text-foreground-muted hover:border-primary hover:text-foreground"
          >
            <span
              className="h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: p.hex }}
              aria-hidden="true"
            />
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={swap}
          className="ml-auto rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-surface-hover"
        >
          Swap
        </button>
      </div>

      {!bothValid ? (
        <p className="mt-6 text-sm text-error">Enter two valid hex colors (e.g. #1C2624) to check contrast.</p>
      ) : (
        <>
          <div
            className="mt-6 flex flex-col items-center justify-center gap-2 rounded-lg border border-border p-8 text-center"
            style={{ backgroundColor: bg!, color: fg! }}
          >
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {ratio!.toFixed(2)}:1
            </p>
            <p className="text-lg">Large text sample, 24px+</p>
            <p className="text-sm">Normal text sample, 16px — the size most body copy actually ships at.</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <PassBadge pass={ratio! >= 4.5} label="AA · normal text (4.5:1)" />
            <PassBadge pass={ratio! >= 3} label="AA · large text (3:1)" />
            <PassBadge pass={ratio! >= 7} label="AAA · normal text (7:1)" />
            <PassBadge pass={ratio! >= 4.5} label="AAA · large text (4.5:1)" />
          </div>
        </>
      )}
    </div>
  );
}
