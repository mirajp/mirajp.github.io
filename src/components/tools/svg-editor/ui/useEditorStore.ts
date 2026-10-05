import { useCallback, useRef, useSyncExternalStore } from "react";
import type { EditorState } from "../contracts";
import type { EditorStoreWithLink } from "../state/createEditorStore";

export function useEditorStore<T>(
  store: EditorStoreWithLink,
  selector: (state: EditorState) => T,
  equalityFn: (left: T, right: T) => boolean = Object.is,
): T {
  const selectorRef = useRef(selector);
  const equalityRef = useRef(equalityFn);
  const cachedRef = useRef<{ snapshot: EditorState; selected: T } | null>(null);
  selectorRef.current = selector;
  equalityRef.current = equalityFn;

  const getSelection = useCallback((): T => {
    const snapshot = store.getSnapshot();
    const cached = cachedRef.current;
    if (cached && Object.is(cached.snapshot, snapshot)) return cached.selected;
    const selected = selectorRef.current(snapshot);
    if (cached && equalityRef.current(cached.selected, selected)) {
      cachedRef.current = { snapshot, selected: cached.selected };
      return cached.selected;
    }
    cachedRef.current = { snapshot, selected };
    return selected;
  }, [store]);

  return useSyncExternalStore(store.subscribe, getSelection, getSelection);
}
