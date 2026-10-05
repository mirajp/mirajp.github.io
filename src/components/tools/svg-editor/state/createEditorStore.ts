import type {
  Command,
  EditorState,
  EditorStore,
  Pane,
  SourceMetadata,
  SvgDocument,
  Unsubscribe,
  ViewTransform,
} from "../contracts";
import { HistoryImpl } from "../core/history";

export interface EditorStoreWithLink extends EditorStore {
  setLinked(linked: boolean): void;
}

export interface EditorStoreOptions {
  now?: () => number;
}

const initialTransform: ViewTransform = { scale: 1, tx: 0, ty: 0 };

export function createEditorStore(
  options: EditorStoreOptions = {},
): EditorStoreWithLink {
  let snapshot: EditorState = {
    document: null,
    metadata: null,
    canUndo: false,
    canRedo: false,
    selection: { nodeIds: [] },
    view: {
      linked: true,
      original: initialTransform,
      edited: initialTransform,
    },
  };
  let history = new HistoryImpl<SvgDocument>(null, {
    now: options.now ?? (() => globalThis.performance.now()),
  });
  const listeners = new Set<() => void>();
  let batchDepth = 0;
  let notificationPending = false;

  const notify = (): void => {
    if (batchDepth > 0) {
      notificationPending = true;
      return;
    }
    for (const listener of Array.from(listeners)) listener();
  };

  const publish = (next: EditorState): void => {
    if (Object.is(snapshot, next)) return;
    snapshot = next;
    notify();
  };

  const withHistoryFlags = (
    document: SvgDocument | null,
  ): Pick<EditorState, "canUndo" | "canRedo"> => ({
    canUndo: document !== null && history.canUndo(),
    canRedo: document !== null && history.canRedo(),
  });

  const store: EditorStoreWithLink = {
    getSnapshot: () => snapshot,

    subscribe(listener): Unsubscribe {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    subscribeSelector<T>(
      selector: (state: EditorState) => T,
      listener: (value: T, previous: T) => void,
      equalityFn: (a: T, b: T) => boolean = Object.is,
    ): Unsubscribe {
      let previous = selector(snapshot);
      return store.subscribe(() => {
        const next = selector(snapshot);
        if (equalityFn(previous, next)) return;
        const before = previous;
        previous = next;
        listener(next, before);
      });
    },

    load(document: SvgDocument, metadata: SourceMetadata): void {
      history = new HistoryImpl(document, {
        now: options.now ?? (() => globalThis.performance.now()),
      });
      publish({
        ...snapshot,
        document,
        metadata,
        selection: { nodeIds: [] },
        ...withHistoryFlags(document),
      });
    },

    dispatch(command: Command): void {
      const current = snapshot.document;
      if (!current) throw new Error("Load an SVG before dispatching commands.");
      history.push({
        ...command,
        apply(document) {
          const next = command.apply(document);
          return next === document
            ? document
            : { ...next, version: document.version + 1 };
        },
      });
      const document = history.current();
      publish({
        ...snapshot,
        document,
        ...withHistoryFlags(document),
      });
    },

    undo(): void {
      const document = history.undo();
      if (!document) return;
      publish({
        ...snapshot,
        document,
        ...withHistoryFlags(document),
      });
    },

    redo(): void {
      const document = history.redo();
      if (!document) return;
      publish({
        ...snapshot,
        document,
        ...withHistoryFlags(document),
      });
    },

    select(nodeIds): void {
      const selected = Array.isArray(nodeIds) ? [...nodeIds] : [nodeIds];
      if (
        selected.length === snapshot.selection.nodeIds.length &&
        selected.every((id, index) => id === snapshot.selection.nodeIds[index])
      ) {
        return;
      }
      publish({ ...snapshot, selection: { nodeIds: selected } });
    },

    addToSelection(nodeId): void {
      if (snapshot.selection.nodeIds.includes(nodeId)) return;
      publish({
        ...snapshot,
        selection: {
          nodeIds: [...snapshot.selection.nodeIds, nodeId],
        },
      });
    },

    toggleSelection(nodeId): void {
      const selected = snapshot.selection.nodeIds.includes(nodeId);
      publish({
        ...snapshot,
        selection: {
          nodeIds: selected
            ? snapshot.selection.nodeIds.filter((id) => id !== nodeId)
            : [...snapshot.selection.nodeIds, nodeId],
        },
      });
    },

    clearSelection(): void {
      if (snapshot.selection.nodeIds.length === 0) return;
      publish({ ...snapshot, selection: { nodeIds: [] } });
    },

    setViewTransform(pane: Pane, transform: ViewTransform): void {
      publish({
        ...snapshot,
        view: snapshot.view.linked
          ? { ...snapshot.view, original: transform, edited: transform }
          : { ...snapshot.view, [pane]: transform },
      });
    },

    setLinked(linked: boolean): void {
      if (snapshot.view.linked === linked) return;
      const sharedTransform = snapshot.view.edited;
      publish({
        ...snapshot,
        view: {
          linked,
          original: linked ? sharedTransform : snapshot.view.original,
          edited: sharedTransform,
        },
      });
    },

    batch(fn): void {
      batchDepth += 1;
      try {
        fn();
      } finally {
        batchDepth -= 1;
        if (batchDepth === 0 && notificationPending) {
          notificationPending = false;
          notify();
        }
      }
    },
  };

  return store;
}
