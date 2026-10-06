import { describe, expect, it } from "vitest";
import { resolveStyle } from "../../../../src/components/tools/svg-editor/core/style";
import type {
  ResolvedStyle,
  SvgDocument,
} from "../../../../src/components/tools/svg-editor/contracts";
import {
  buildDocument,
  declaration,
  element,
  styleRule,
  withStyleElement,
} from "./helpers/model";

interface CascadeCase {
  name: string;
  document: SvgDocument;
  nodeId: string;
  property: string;
  expected: Pick<ResolvedStyle, "value" | "source"> &
    Partial<Pick<ResolvedStyle, "important" | "declaredOn">>;
}

const root = element("root", "svg");
const target = (options: Omit<Parameters<typeof element>[2], "parent"> = {}) =>
  element("target", "rect", { ...options, parent: "root" });
const parentAndTarget = (
  parentOptions: Omit<Parameters<typeof element>[2], "parent">,
  targetOptions: Omit<Parameters<typeof element>[2], "parent"> = {},
) => [
  element("root", "svg"),
  element("parent", "g", { ...parentOptions, parent: "root" }),
  element("target", "rect", { ...targetOptions, parent: "parent" }),
];

const cascadeCases: CascadeCase[] = [
  {
    name: "important inline beats important stylesheet",
    document: buildDocument(
      [root, target({ style: { fill: declaration("green", true) } })],
      [styleRule("rect", { fill: declaration("red", true) }, 0)],
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "green",
      source: "inline",
      important: true,
      declaredOn: "target",
    },
  },
  {
    name: "important stylesheet beats normal inline",
    document: buildDocument(
      [root, target({ style: { fill: declaration("green") } })],
      [styleRule("rect", { fill: declaration("red", true) }, 0)],
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "red",
      source: "stylesheet",
      important: true,
      declaredOn: "target",
    },
  },
  {
    name: "normal inline beats normal stylesheet",
    document: buildDocument(
      [root, target({ style: { fill: declaration("green") } })],
      [styleRule("rect", { fill: declaration("red") }, 0)],
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "green",
      source: "inline",
      declaredOn: "target",
    },
  },
  {
    name: "normal stylesheet beats a presentation attribute",
    document: buildDocument(
      [root, target({ attrs: { fill: "green" } })],
      [styleRule("rect", { fill: declaration("red") }, 0)],
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "red",
      source: "stylesheet",
      declaredOn: "target",
    },
  },
  {
    name: "presentation attribute beats an inherited value",
    document: buildDocument(
      parentAndTarget(
        { style: { fill: declaration("green") } },
        { attrs: { fill: "blue" } },
      ),
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "blue",
      source: "presentation",
      declaredOn: "target",
    },
  },
  {
    name: "inherited value wins when no child declaration exists",
    document: buildDocument(
      parentAndTarget({ style: { fill: declaration("green") } }),
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "green",
      source: "inherited",
      declaredOn: "parent",
    },
  },
  {
    name: "an inherited property uses its initial value when no ancestor declares it",
    document: buildDocument([root, target()]),
    nodeId: "target",
    property: "fill",
    expected: { value: "black", source: "default" },
  },
  {
    name: "an id selector beats class and type selectors",
    document: buildDocument(
      [
        root,
        target({
          attrs: { id: "shape-id", class: "shape" },
        }),
      ],
      [
        styleRule("rect", { fill: declaration("type") }, 0),
        styleRule(".shape", { fill: declaration("class") }, 1),
        styleRule("#shape-id", { fill: declaration("id") }, 2),
      ],
    ),
    nodeId: "target",
    property: "fill",
    expected: { value: "id", source: "stylesheet", declaredOn: "target" },
  },
  {
    name: "equal specificity is broken by later source order",
    document: buildDocument(
      [root, target({ attrs: { class: "shape" } })],
      [
        styleRule(".shape", { fill: declaration("first") }, 0),
        styleRule(".shape", { fill: declaration("last") }, 1),
      ],
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "last",
      source: "stylesheet",
      declaredOn: "target",
    },
  },
  {
    name: "a non-inherited property does not inherit and uses its initial value",
    document: buildDocument(
      parentAndTarget({ style: { opacity: declaration("0.25") } }),
    ),
    nodeId: "target",
    property: "opacity",
    expected: { value: "1", source: "default" },
  },
  {
    name: "currentColor resolves through the winning color declaration",
    document: buildDocument(
      [root, target({ style: { fill: declaration("currentColor") } })],
      [styleRule("#target", { color: declaration("navy") }, 0)],
    ),
    nodeId: "target",
    property: "fill",
    expected: { value: "navy", source: "inline", declaredOn: "target" },
  },
  {
    name: "a resolvable var() uses an inherited custom property",
    document: buildDocument(
      parentAndTarget(
        { style: { "--paint": declaration("teal") } },
        { attrs: { class: "shape" } },
      ),
      [styleRule(".shape", { fill: declaration("var(--paint)") }, 0)],
    ),
    nodeId: "target",
    property: "fill",
    expected: {
      value: "teal",
      source: "stylesheet",
      declaredOn: "target",
    },
  },
];

interface FlattenMergeCase {
  name: string;
  document: SvgDocument;
  expected: CascadeCase["expected"];
}

function flattenMergeCase(
  name: string,
  inline: ReturnType<typeof declaration>,
  flattened: ReturnType<typeof declaration>,
  expected: FlattenMergeCase["expected"],
): FlattenMergeCase {
  return {
    name,
    document: buildDocument(
      [
        root,
        target({
          attrs: { class: "shape" },
          style: { fill: inline },
        }),
      ],
      [styleRule(".shape", { fill: flattened }, 0)],
    ),
    expected,
  };
}

const flattenMergeCases: FlattenMergeCase[] = [
  flattenMergeCase(
    "existing inline declaration beats a flattened normal rule",
    declaration("inline"),
    declaration("flattened"),
    { value: "inline", source: "inline", declaredOn: "target" },
  ),
  flattenMergeCase(
    "flattened important rule beats a non-important inline declaration",
    declaration("inline"),
    declaration("flattened", true),
    {
      value: "flattened",
      source: "stylesheet",
      important: true,
      declaredOn: "target",
    },
  ),
  flattenMergeCase(
    "inline important declaration beats a flattened important rule",
    declaration("inline", true),
    declaration("flattened", true),
    {
      value: "inline",
      source: "inline",
      important: true,
      declaredOn: "target",
    },
  ),
];

const disputedCurrentColorCase =
  "currentColor resolves through the winning color declaration";
const executableCascadeCases = cascadeCases.filter(
  ({ name }) => name !== disputedCurrentColorCase,
);
const disputedCascadeCases = cascadeCases.filter(
  ({ name }) => name === disputedCurrentColorCase,
);

describe("style cascade tables", () => {
  it.each(executableCascadeCases)(
    "$name",
    ({ document, nodeId, property, expected }) => {
      expect(resolveStyle(document, nodeId, property)).toMatchObject(expected);
    },
  );

  it.skip.each(disputedCascadeCases)(
    "$name (disputed: internal node ID is not a CSS id attribute)",
    ({ document, nodeId, property, expected }) => {
      expect(resolveStyle(document, nodeId, property)).toMatchObject(expected);
    },
  );

  it.each(flattenMergeCases)(
    "flatten merge: $name",
    ({ document, expected }) => {
      expect(resolveStyle(document, "target", "fill")).toMatchObject(expected);
    },
  );

  it("parses style element text and matches descendant and attribute selectors", () => {
    const document = withStyleElement(
      buildDocument([
        element("root", "svg"),
        element("parent", "g", {
          attrs: { class: "group" },
          parent: "root",
        }),
        element("target", "rect", {
          attrs: { "data-kind": "leaf" },
          parent: "parent",
        }),
      ]),
      'svg > g.group > rect[data-kind="leaf"] { fill: orchid; }',
    );

    expect(resolveStyle(document, "target", "fill")).toMatchObject({
      value: "orchid",
      source: "stylesheet",
      declaredOn: "target",
    });
  });

  it("preserves !important when parsing style element declarations", () => {
    const document = withStyleElement(
      buildDocument([root, target({ style: { fill: declaration("green") } })]),
      "rect { fill: red !important; }",
    );

    expect(resolveStyle(document, "target", "fill")).toMatchObject({
      value: "red",
      source: "stylesheet",
      important: true,
    });
  });

  it("resolves currentColor from the winning color declaration", () => {
    const document = buildDocument(
      [
        root,
        target({
          attrs: { id: "shape-id" },
          style: { fill: declaration("currentColor") },
        }),
      ],
      [styleRule("#shape-id", { color: declaration("navy") }, 0)],
    );

    expect(resolveStyle(document, "target", "fill")).toMatchObject({
      value: "navy",
      source: "inline",
      declaredOn: "target",
    });
  });

  it("records unsupported selectors and at-rules without applying them", () => {
    const document = withStyleElement(
      buildDocument([root, target()]),
      "rect:hover { fill: red; } @media screen { rect { fill: blue; } }",
    );

    expect(resolveStyle(document, "target", "fill")).toMatchObject({
      value: "black",
      source: "default",
    });
    expect(document.unsupported).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "style-selector" }),
        expect.objectContaining({
          kind: "style-construct",
          message: expect.stringContaining("@media"),
        }),
      ]),
    );
  });
});
