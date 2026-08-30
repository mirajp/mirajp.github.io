import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "work" | "break";

const MIN_MINUTES = 1;
const MAX_MINUTES = 60;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroTimer() {
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [announcement, setAnnouncement] = useState("Ready when you are.");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported"
  );

  const endTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | undefined>(undefined);

  const durationFor = useCallback(
    (m: Mode) => (m === "work" ? workMinutes : breakMinutes) * 60,
    [workMinutes, breakMinutes]
  );

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = isRunning
      ? `${formatTime(secondsLeft)} · ${mode === "work" ? "Focus" : "Break"}`
      : "Pomodoro Timer";
    return () => {
      document.title = "Pomodoro Timer";
    };
  }, [secondsLeft, isRunning, mode]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      if (endTimeRef.current == null) return;
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(intervalRef.current);
        setIsRunning(false);
        const nextMode: Mode = mode === "work" ? "break" : "work";
        if (mode === "work") setCompletedSessions((c) => c + 1);
        setMode(nextMode);
        setSecondsLeft(durationFor(nextMode));
        const message =
          nextMode === "break" ? "Work session complete. Break started." : "Break complete. Back to work.";
        setAnnouncement(message);

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(nextMode === "break" ? "Break time" : "Back to work", {
            body: nextMode === "break" ? "Nice work — take a short break." : "Break's over. Let's go.",
          });
        }
      }
    }, 250);

    return () => window.clearInterval(intervalRef.current);
  }, [isRunning, mode, durationFor]);

  function start() {
    endTimeRef.current = Date.now() + secondsLeft * 1000;
    setIsRunning(true);
    setAnnouncement(`${mode === "work" ? "Focus" : "Break"} session started.`);
  }

  function pause() {
    setIsRunning(false);
    if (endTimeRef.current != null) {
      const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    }
    setAnnouncement("Paused.");
  }

  function reset() {
    setIsRunning(false);
    endTimeRef.current = null;
    setMode("work");
    setSecondsLeft(workMinutes * 60);
    setCompletedSessions(0);
    setAnnouncement("Timer reset.");
  }

  function adjustMinutes(target: Mode, delta: number) {
    if (isRunning) return;
    const setter = target === "work" ? setWorkMinutes : setBreakMinutes;
    setter((prev) => {
      const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, prev + delta));
      if (mode === target) setSecondsLeft(next * 60);
      return next;
    });
  }

  async function requestNotifications() {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  }

  const duration = durationFor(mode);
  const progress = duration > 0 ? 1 - secondsLeft / duration : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-8 sm:p-10">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            mode === "work"
              ? "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
              : "bg-coral-400/15 text-coral-600 dark:text-coral-400"
          }`}
        >
          {mode === "work" ? "Focus" : "Break"}
        </span>
        <span className="text-sm text-foreground-muted">
          {completedSessions} session{completedSessions === 1 ? "" : "s"} completed
        </span>
      </div>

      <p className="mt-8 text-center font-mono text-7xl font-bold tabular-nums text-foreground sm:text-8xl">
        {formatTime(secondsLeft)}
      </p>

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-[var(--ease-standard)]"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {!isRunning ? (
          <button
            type="button"
            onClick={start}
            className="min-h-11 rounded-md bg-primary px-8 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {secondsLeft === duration ? "Start" : "Resume"}
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="min-h-11 rounded-md bg-primary px-8 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Pause
          </button>
        )}
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-md border border-border px-6 text-sm font-medium text-foreground hover:bg-surface-hover"
        >
          Reset
        </button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-6">
        <fieldset disabled={isRunning} className="disabled:opacity-50">
          <legend className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Focus length
          </legend>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease focus minutes"
              onClick={() => adjustMinutes("work", -5)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-hover"
            >
              −
            </button>
            <span className="w-14 text-center font-mono text-sm">{workMinutes} min</span>
            <button
              type="button"
              aria-label="Increase focus minutes"
              onClick={() => adjustMinutes("work", 5)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-hover"
            >
              +
            </button>
          </div>
        </fieldset>

        <fieldset disabled={isRunning} className="disabled:opacity-50">
          <legend className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
            Break length
          </legend>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease break minutes"
              onClick={() => adjustMinutes("break", -1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-hover"
            >
              −
            </button>
            <span className="w-14 text-center font-mono text-sm">{breakMinutes} min</span>
            <button
              type="button"
              aria-label="Increase break minutes"
              onClick={() => adjustMinutes("break", 1)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface-hover"
            >
              +
            </button>
          </div>
        </fieldset>
      </div>

      {notifPermission === "default" && (
        <button
          type="button"
          onClick={requestNotifications}
          className="mt-6 text-xs font-medium text-primary hover:text-primary-hover"
        >
          Enable a browser notification for when a session ends
        </button>
      )}

      <p role="status" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
