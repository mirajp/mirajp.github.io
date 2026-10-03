// Barrel re-exports for the paint module
export { default as Icons } from "./icons";
export * from "./constants";
export * from "./types";
export * from "./utils";
export * from "./rendering";
export { useHistory } from "./hooks/useHistory";
export { useAutosave, hydrateFromStorage } from "./hooks/useAutosave";
export { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
export { useLayers } from "./hooks/useLayers";
export { ImageModal, ResizeModal, ShortcutsModal } from "./components/Modals";
