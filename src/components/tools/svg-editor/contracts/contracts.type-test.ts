import {
  resolveStyle,
  type ClockAdapter,
  type CommentNode,
  type Command,
  type Decl,
  type DomParserAdapter,
  type EditorState,
  type EditorStore,
  type ElementNode,
  type GeometryAdapter,
  type History,
  type ModelDiff,
  type Pane,
  type ParsedSheet,
  type ParsedStyleRule,
  type Parser,
  type PersistentMap,
  type ProcessingInstructionNode,
  type Renderer,
  type RendererPatch,
  type ResolvedStyle,
  type SanitizationFinding,
  type SanitizationReport,
  type SanitizationResult,
  type Sanitizer,
  type SelectionState,
  type Serializer,
  type SourceMetadata,
  type Store,
  type SvgDocument,
  type SvgEditorProps,
  type SvgNode,
  type TextNode,
  type Unsubscribe,
  type UnsupportedRecord,
  type ViewState,
  type ViewTransform,
} from "./index";

const persistentMap: PersistentMap<string, SvgNode> = {
  size: 0,
  get: () => undefined,
  has: () => false,
  set: () => persistentMap,
  delete: () => persistentMap,
  entries: () => [][Symbol.iterator](),
};

const declaration: Decl = { value: "red", important: false };
const textNode: TextNode = {
  kind: "text",
  id: "text-1",
  value: "label",
  parent: "root",
};
const commentNode: CommentNode = {
  kind: "comment",
  id: "comment-1",
  value: " preserved ",
  parent: "root",
};
const processingInstructionNode: ProcessingInstructionNode = {
  kind: "processing-instruction",
  id: "instruction-1",
  target: "xml-stylesheet",
  data: 'href="style.css"',
  parent: null,
};
const elementNode: ElementNode = {
  kind: "element",
  id: "root",
  tag: "svg",
  attrs: {},
  style: {},
  children: ["text-1"],
  parent: null,
};
const svgNode: SvgNode = elementNode;
const unsupported: UnsupportedRecord = {
  kind: "selector",
  message: "Selector is not modeled.",
};
const styleRule: ParsedStyleRule = {
  selector: ".shape",
  declarations: { fill: declaration },
  sourceOrder: 0,
};
const parsedSheet: ParsedSheet = { rules: [styleRule] };
const documentModel: SvgDocument = {
  root: "root",
  nodes: persistentMap,
  retainedSheets: [parsedSheet],
  unsupported: [unsupported],
  version: 0,
};
const sanitizationFinding: SanitizationFinding = {
  kind: "removed-element",
  message: "An unsafe element was removed.",
};
const sanitizationReport: SanitizationReport = {
  findings: [sanitizationFinding],
};
const metadata: SourceMetadata = {
  originalSource: "<svg/>",
  sanitizedSource: "<svg/>",
  originalVersion: 0,
  sanitizationReport,
};
const command: Command = {
  id: "noop",
  label: "No operation",
  apply: (doc) => doc,
};
const history: History = {
  push: () => {},
  undo: () => documentModel,
  redo: () => documentModel,
  canUndo: () => false,
  canRedo: () => false,
  current: () => documentModel,
};
const transform: ViewTransform = { scale: 1, tx: 0, ty: 0 };
const pane: Pane = "original";
const style: ResolvedStyle = { value: "red", source: "presentation" };
const geometryAdapter: GeometryAdapter = {
  getScreenCTM: (element) => element.getScreenCTM(),
  getBBox: (element) => element.getBBox(),
};
const domParserAdapter: DomParserAdapter = {
  parseFromString: (source, mimeType) =>
    new DOMParser().parseFromString(source, mimeType),
};
const clockAdapter: ClockAdapter = { now: () => 0 };
const modelDiff: ModelDiff = {
  previous: documentModel,
  next: documentModel,
  changedNodeIds: [],
  structuralNodeIds: [],
};
const rendererPatch: RendererPatch = { nodeId: "root" };
const renderer: Renderer = {
  mount: () => {},
  render: () => {},
  patch: () => {},
  preview: () => {},
  nodeToElement: () => null,
  destroy: () => {},
};
const sanitizationResult: SanitizationResult = {
  sanitizedSource: "<svg/>",
  report: sanitizationReport,
};
const sanitizer: Sanitizer = () => sanitizationResult;
const parser: Parser = () => documentModel;
const serializer: Serializer = () => "<svg/>";
const unsubscribe: Unsubscribe = () => {};
const store: Store<SvgDocument> = {
  getSnapshot: () => documentModel,
  subscribe: () => unsubscribe,
};
const selection: SelectionState = { nodeIds: [] };
const view: ViewState = {
  linked: true,
  original: transform,
  edited: transform,
};
const editorState: EditorState = {
  document: documentModel,
  metadata,
  canUndo: false,
  canRedo: false,
  selection,
  view,
};
const editorStore: EditorStore = {
  getSnapshot: () => editorState,
  subscribe: () => unsubscribe,
  load: () => {},
  dispatch: () => {},
  undo: () => {},
  redo: () => {},
  select: () => {},
  addToSelection: () => {},
  toggleSelection: () => {},
  clearSelection: () => {},
  setViewTransform: () => {},
  batch: (fn) => fn(),
  subscribeSelector: () => unsubscribe,
};
const props: SvgEditorProps = {
  maxFileBytes: 10_000_000,
  initialSvg: "<svg/>",
  onExport: () => {},
};
const resolve: typeof resolveStyle = () => style;

void [
  declaration,
  textNode,
  commentNode,
  processingInstructionNode,
  elementNode,
  svgNode,
  command,
  history,
  pane,
  geometryAdapter,
  domParserAdapter,
  clockAdapter,
  modelDiff,
  rendererPatch,
  renderer,
  sanitizationResult,
  sanitizer,
  parser,
  serializer,
  store,
  editorStore,
  props,
  resolve,
];
