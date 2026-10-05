/**
 * Stable internal identifier independent of an SVG `id` attribute (TDD §3).
 */
export type NodeId = string;

/**
 * Immutable map abstraction used by the persistent document model (TDD §3).
 */
export interface PersistentMap<K, V> {
  readonly size: number;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): PersistentMap<K, V>;
  delete(key: K): PersistentMap<K, V>;
  entries(): IterableIterator<[K, V]>;
}

/**
 * A CSS declaration value and its importance flag (TDD §3, §5).
 */
export interface Decl {
  value: string;
  important: boolean;
}

/**
 * An SVG element in the normalized document tree (TDD §3).
 */
export interface ElementNode {
  kind: "element";
  id: NodeId;
  tag: string;
  attrs: Record<string, string>;
  style: Record<string, Decl>;
  children: NodeId[];
  parent: NodeId | null;
}

/**
 * Text content in the normalized SVG document tree (TDD §3).
 */
export interface TextNode {
  kind: "text";
  id: NodeId;
  value: string;
  parent: NodeId;
}

/**
 * An XML comment retained in the normalized document tree (TDD §3, §14).
 */
export interface CommentNode {
  kind: "comment";
  id: NodeId;
  value: string;
  parent: NodeId | null;
}

/**
 * An XML processing instruction retained in the normalized document tree (TDD §3, §14).
 */
export interface ProcessingInstructionNode {
  kind: "processing-instruction";
  id: NodeId;
  target: string;
  data: string;
  parent: NodeId | null;
}

/**
 * A normalized node variant in an SVG document (TDD §3).
 */
export type SvgNode =
  ElementNode | TextNode | CommentNode | ProcessingInstructionNode;

/**
 * A retained stylesheet rule that could not be flattened to element styles (TDD §3, §5).
 */
export interface ParsedStyleRule {
  selector: string;
  declarations: Record<string, Decl>;
  sourceOrder: number;
}

/**
 * Parsed stylesheet rules retained for serialization and supported edits (TDD §3, §5).
 */
export interface ParsedSheet {
  rules: ParsedStyleRule[];
}

/**
 * A feature or selector not fully represented by the model (TDD §3, §5).
 */
export interface UnsupportedRecord {
  kind: string;
  message: string;
  nodeId?: NodeId;
  source?: string;
}

/**
 * A persistent normalized SVG document version (TDD §3).
 */
export interface SvgDocument {
  root: NodeId;
  nodes: PersistentMap<NodeId, SvgNode>;
  retainedSheets: ParsedSheet[];
  unsupported: UnsupportedRecord[];
  version: number;
}

/**
 * A sanitizer finding that makes an otherwise-clean export report non-empty (TDD §3, §14).
 */
export interface SanitizationFinding {
  kind: string;
  message: string;
  location?: string;
}

/**
 * Records modifications made while preparing hostile SVG input (TDD §3, §14).
 */
export interface SanitizationReport {
  findings: SanitizationFinding[];
}

/**
 * Original and sanitized source associated with a loaded document (TDD §3).
 */
export interface SourceMetadata {
  originalSource: string;
  sanitizedSource: string;
  originalVersion: number;
  sanitizationReport: SanitizationReport;
}

/**
 * A pure document operation; implementations must not mutate their input (TDD §9).
 */
export interface Command {
  id: string;
  label: string;
  apply(doc: SvgDocument): SvgDocument;
  mergeKey?: string;
}

/**
 * Document-version history with undo, redo, and command coalescing (TDD §9).
 */
export interface History {
  push(command: Command): void;
  undo(): SvgDocument | null;
  redo(): SvgDocument | null;
  canUndo(): boolean;
  canRedo(): boolean;
  current(): SvgDocument | null;
}

/**
 * Shared scale and translation applied to a pane viewport (TDD §7).
 */
export interface ViewTransform {
  scale: number;
  tx: number;
  ty: number;
}

/**
 * The source and declaring node for a resolved CSS property (TDD §5).
 */
export interface ResolvedStyle {
  value: string;
  source: "inline" | "stylesheet" | "presentation" | "inherited" | "default";
  important?: boolean;
  declaredOn?: NodeId;
}

/**
 * Resolves one property's effective value for a model node (TDD §5).
 */
export type ResolveStyle = (
  doc: SvgDocument,
  nodeId: NodeId,
  property: string,
) => ResolvedStyle;

/**
 * Browser geometry operations required by coordinate-dependent tools (TDD §2, §6).
 */
export interface GeometryAdapter {
  getScreenCTM(element: SVGGraphicsElement): DOMMatrix | null;
  getBBox(element: SVGGraphicsElement): DOMRect;
}

/**
 * XML parser boundary for browser-provided DOM parsing (TDD §2, §4).
 */
export interface DomParserAdapter {
  parseFromString(
    source: string,
    mimeType:
      | "text/html"
      | "text/xml"
      | "application/xml"
      | "application/xhtml+xml"
      | "image/svg+xml",
  ): XMLDocument;
}

/**
 * Monotonic time source used to coalesce nearby history commands (TDD §9).
 */
export interface ClockAdapter {
  now(): number;
}

/**
 * Node IDs affected by a document update, split by structural changes (TDD §6).
 */
export interface ModelDiff {
  previous: SvgDocument;
  next: SvgDocument;
  changedNodeIds: NodeId[];
  structuralNodeIds: NodeId[];
}

/**
 * A transient node-local preview that does not create a document version (TDD §6).
 */
export interface RendererPatch {
  nodeId: NodeId;
  attributes?: Record<string, string | null>;
  styles?: Record<string, string | null>;
}

/**
 * Imperative model-to-SVG renderer, isolated from React reconciliation (TDD §6).
 */
export interface Renderer {
  /**
   * Mounts into an empty pane container; repeated calls must be safe (TDD §6).
   */
  mount(container: Element): void;
  render(doc: SvgDocument): void;
  patch(diff: ModelDiff): void;
  preview(patch: RendererPatch): void;
  nodeToElement(id: NodeId): SVGElement | null;
  /**
   * Releases mounted resources; repeated calls must be safe (TDD §6).
   */
  destroy(): void;
}

/**
 * Sanitized source paired with the changes reported by the sanitizer (TDD §3).
 */
export interface SanitizationResult {
  sanitizedSource: string;
  report: SanitizationReport;
}

/**
 * Sanitizes untrusted SVG source before parsing or rendering (TDD §2, §3).
 */
export type Sanitizer = (
  source: string,
  maxFileBytes?: number,
) => SanitizationResult;

/**
 * Parses sanitized XML into the normalized persistent document model (TDD §2, §3).
 */
export type Parser = (source: string, adapter: DomParserAdapter) => SvgDocument;

/**
 * Serializes a normalized document to SVG source (TDD §14).
 */
export type Serializer = (doc: SvgDocument) => string;

/**
 * Listener that can be detached from a framework-free store (TDD §2, §6).
 */
export type Unsubscribe = () => void;

/**
 * Snapshot access and notifications for framework-independent state (TDD §2, §6).
 */
export interface Store<T> {
  getSnapshot(): T;
  subscribe(listener: () => void): Unsubscribe;
}

/**
 * Selected node identifiers held independently of React state (TDD §6, §11).
 */
export interface SelectionState {
  nodeIds: NodeId[];
}

/**
 * Pane transforms and whether both panes share one transform (TDD §7).
 */
export interface ViewState {
  linked: boolean;
  original: ViewTransform;
  edited: ViewTransform;
}

/**
 * Snapshot of the editor's document, history availability, selection, and views (TDD §6, §7).
 */
export interface EditorState {
  document: SvgDocument | null;
  metadata: SourceMetadata | null;
  canUndo: boolean;
  canRedo: boolean;
  selection: SelectionState;
  view: ViewState;
}

/**
 * Names a pane whose view transform can be changed independently (TDD §7).
 */
export type Pane = "original" | "edited";

/**
 * Framework-free editor store operations consumed by React through subscriptions (TDD §2, §6).
 */
export interface EditorStore extends Store<EditorState> {
  load(document: SvgDocument, metadata: SourceMetadata): void;
  dispatch(command: Command): void;
  undo(): void;
  redo(): void;
  select(nodeIds: NodeId | NodeId[]): void;
  addToSelection(nodeId: NodeId): void;
  toggleSelection(nodeId: NodeId): void;
  clearSelection(): void;
  setViewTransform(pane: Pane, transform: ViewTransform): void;
  batch(fn: () => void): void;
  subscribeSelector<T>(
    selector: (state: EditorState) => T,
    listener: (value: T, previous: T) => void,
    equalityFn?: (a: T, b: T) => boolean,
  ): Unsubscribe;
}

/**
 * Public component options for file size, initial source, and export notification (TDD §1).
 */
export interface SvgEditorProps {
  maxFileBytes?: number;
  initialSvg?: string;
  onExport?: (svg: string, meta: { sanitized: boolean }) => void;
}

/**
 * Resolves an effective style declaration for a node/property triple (TDD §5).
 */
export declare function resolveStyle(
  doc: SvgDocument,
  nodeId: NodeId,
  property: string,
): ResolvedStyle;
