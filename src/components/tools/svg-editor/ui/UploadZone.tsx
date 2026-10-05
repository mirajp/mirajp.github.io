import { useRef, useState } from "react";

interface UploadZoneProps {
  onSource(source: string): void;
  onError(message: string): void;
  maxFileBytes?: number;
  busy: boolean;
}

export function UploadZone({
  onSource,
  onError,
  maxFileBytes,
  busy,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");

  async function readFile(file: File | undefined): Promise<void> {
    if (!file) return;
    if (maxFileBytes !== undefined && file.size > maxFileBytes) {
      onError(`This file exceeds the ${maxFileBytes}-byte limit.`);
      return;
    }
    setFileName(file.name);
    try {
      onSource(await file.text());
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Unable to read this file.",
      );
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragging(false);
    void readFile(event.dataTransfer.files[0]);
  }

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>): void {
    const source = event.clipboardData.getData("text/plain");
    if (!/<svg(?:\s|>)/i.test(source)) return;
    event.preventDefault();
    setFileName("");
    onSource(source);
  }

  return (
    <div
      className={`flex min-h-12 flex-wrap items-center gap-3 rounded-md border px-3 py-2 ${
        dragging
          ? "border-primary bg-surface-hover"
          : "border-border bg-background"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={onDrop}
      onPaste={onPaste}
      data-testid="upload-zone"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".svg,image/svg+xml"
        className="sr-only"
        aria-label="Choose an SVG file"
        onChange={(event) => void readFile(event.currentTarget.files?.[0])}
        disabled={busy}
      />
      <button
        type="button"
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-background hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {busy ? "Loading…" : "Choose SVG"}
      </button>
      <span className="text-sm text-foreground-muted">
        {fileName || "Drop a file or paste SVG source"}
      </span>
    </div>
  );
}
