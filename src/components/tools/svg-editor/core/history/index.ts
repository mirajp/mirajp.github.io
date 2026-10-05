export interface HistoryCommand<T> {
  id: string;
  label: string;
  apply(doc: T): T;
  mergeKey?: string;
}

export interface HistoryClock {
  now(): number;
}

export interface HistoryOptions<T> {
  /** Maximum number of undoable command entries, excluding the initial version. */
  maxEntries?: number;
  /** Return true when the oldest retained version should be discarded. */
  shouldTrim?: (versions: readonly T[]) => boolean;
}

interface VersionEntry<T> {
  document: T;
  mergeKey?: string;
  timestamp?: number;
}

interface MergePoint {
  index: number;
  key: string;
  timestamp: number;
}

const DEFAULT_MAX_ENTRIES = 200;
const MERGE_WINDOW_MS = 500;

/**
 * Immutable document history with bounded undo and merge-key coalescing (TDD §9).
 */
export class HistoryImpl<T> {
  private readonly entries: VersionEntry<T>[];
  private readonly maxEntries: number;
  private readonly shouldTrim?: HistoryOptions<T>["shouldTrim"];
  private cursor: number;
  private mergePoint: MergePoint | null = null;

  constructor(
    initial: T | null,
    private readonly clock: HistoryClock,
    options: HistoryOptions<T> = {},
  ) {
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    if (!Number.isInteger(this.maxEntries) || this.maxEntries < 1) {
      throw new RangeError("History maxEntries must be a positive integer.");
    }
    this.shouldTrim = options.shouldTrim;
    this.entries = initial ? [{ document: initial }] : [];
    this.cursor = this.entries.length - 1;
  }

  push(command: HistoryCommand<T>): void {
    const current = this.current();
    if (!current) {
      throw new Error("Cannot push a command before loading a document.");
    }

    const timestamp = this.clock.now();
    const next = command.apply(current);
    if (this.cursor < this.entries.length - 1) {
      this.entries.splice(this.cursor + 1);
      this.mergePoint = null;
    }

    const canMerge =
      command.mergeKey !== undefined &&
      this.mergePoint !== null &&
      this.mergePoint.index === this.cursor &&
      this.mergePoint.key === command.mergeKey &&
      timestamp >= this.mergePoint.timestamp &&
      timestamp - this.mergePoint.timestamp <= MERGE_WINDOW_MS;

    if (canMerge && command.mergeKey !== undefined) {
      this.entries[this.cursor] = {
        document: next,
        mergeKey: command.mergeKey,
        timestamp,
      };
      this.mergePoint = {
        index: this.cursor,
        key: command.mergeKey,
        timestamp,
      };
    } else {
      this.entries.push({
        document: next,
        mergeKey: command.mergeKey,
        timestamp,
      });
      this.cursor += 1;
      this.mergePoint =
        command.mergeKey === undefined
          ? null
          : { index: this.cursor, key: command.mergeKey, timestamp };
    }

    this.trimOldVersions();
  }

  undo(): T | null {
    if (!this.canUndo()) return this.current();
    this.cursor -= 1;
    this.mergePoint = null;
    return this.current();
  }

  redo(): T | null {
    if (!this.canRedo()) return this.current();
    this.cursor += 1;
    this.mergePoint = null;
    return this.current();
  }

  canUndo(): boolean {
    return this.cursor > 0;
  }

  canRedo(): boolean {
    return this.cursor >= 0 && this.cursor < this.entries.length - 1;
  }

  current(): T | null {
    return this.entries[this.cursor]?.document ?? null;
  }

  private trimOldVersions(): void {
    while (
      this.entries.length > 1 &&
      (this.entries.length - 1 > this.maxEntries ||
        this.shouldTrim?.(this.entries.map((entry) => entry.document)) === true)
    ) {
      this.entries.shift();
      this.cursor -= 1;
      if (this.mergePoint) {
        this.mergePoint.index -= 1;
      }
    }
  }
}
