import { describe, expect, it } from "vitest";
import type {
  DomParserAdapter,
  SvgDocument,
} from "../../../../src/components/tools/svg-editor/contracts";
import { parse } from "../../../../src/components/tools/svg-editor/io/parse";
import { SvgRenderer } from "../../../../src/components/tools/svg-editor/render/renderer";
import { createPaneHost } from "../../../../src/components/tools/svg-editor/render/pane";

const svgNamespace = "http://www.w3.org/2000/svg";
const adapter: DomParserAdapter = {
  parseFromString(source, mimeType) {
    return new DOMParser().parseFromString(source, mimeType) as XMLDocument;
  },
};

function makeDocument(source: string): SvgDocument {
  return parse(source, adapter).doc;
}

function mountPane(source: string): {
  host: ReturnType<typeof createPaneHost>;
  renderer: SvgRenderer;
  document: SvgDocument;
} {
  const host = createPaneHost();
  document.body.append(host);
  const renderer = new SvgRenderer();
  renderer.mount(host.rendererContainer);
  const documentModel = makeDocument(source);
  renderer.render(documentModel);
  return { host, renderer, document: documentModel };
}

async function sampleSvgPixel(
  svg: SVGElement,
  x: number,
  y: number,
): Promise<number[]> {
  const source = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml" }),
  );
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 50;
    canvas.height = 50;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is unavailable");
    context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(x, y, 1, 1).data);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function setNodeAttribute(
  doc: SvgDocument,
  id: string,
  name: string,
  value: string,
): SvgDocument {
  const node = doc.nodes.get(id);
  if (!node || node.kind !== "element")
    throw new Error(`Missing element ${id}`);
  return {
    ...doc,
    version: doc.version + 1,
    nodes: doc.nodes.set(id, {
      ...node,
      attrs: { ...node.attrs, [name]: value },
    }),
  };
}

describe("isolated SVG pane hosts", () => {
  it("isolates duplicate gradient and clipPath IDs between two panes", async () => {
    const source = (start: string, end: string) =>
      `<svg xmlns="${svgNamespace}" width="50" height="50" viewBox="0 0 50 50"><defs><linearGradient id="paint" x2="0" y2="1"><stop offset="0" stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient><clipPath id="clip"><circle cx="25" cy="25" r="20"/></clipPath></defs><rect data-testid="painted" width="50" height="50" fill="url(#paint)" clip-path="url(#clip)"/></svg>`;
    const left = mountPane(source("#ff0000", "#ff0000"));
    const right = mountPane(source("#0000ff", "#0000ff"));

    try {
      const leftSvg = left.renderer.nodeToElement(left.document.root);
      const rightSvg = right.renderer.nodeToElement(right.document.root);
      expect(leftSvg).not.toBeNull();
      expect(rightSvg).not.toBeNull();
      expect(left.host.shadowRoot).not.toBe(right.host.shadowRoot);
      expect(left.host.shadowRoot?.querySelector("#paint")).not.toBe(
        right.host.shadowRoot?.querySelector("#paint"),
      );
      expect(left.host.shadowRoot?.querySelector("#clip")).not.toBe(
        right.host.shadowRoot?.querySelector("#clip"),
      );

      const leftPixelBefore = await sampleSvgPixel(leftSvg!, 25, 10);
      const rightPixelBefore = await sampleSvgPixel(rightSvg!, 25, 10);
      expect(leftPixelBefore[0]).toBeGreaterThan(leftPixelBefore[2]);
      expect(rightPixelBefore[2]).toBeGreaterThan(rightPixelBefore[0]);

      const stop = Array.from(left.document.nodes.entries())
        .map(([, node]) => node)
        .find(
          (node) =>
            node.kind === "element" &&
            node.tag === "stop" &&
            node.attrs["stop-color"] === "#ff0000",
        );
      if (!stop) throw new Error("Gradient stop missing");
      const updated = setNodeAttribute(
        left.document,
        stop.id,
        "stop-color",
        "#00ff00",
      );
      left.renderer.render(updated);

      const leftPixelAfter = await sampleSvgPixel(
        left.renderer.nodeToElement(left.document.root)!,
        25,
        10,
      );
      const rightPixelAfter = await sampleSvgPixel(
        right.renderer.nodeToElement(right.document.root)!,
        25,
        10,
      );
      expect(leftPixelAfter[1]).toBeGreaterThan(leftPixelAfter[0]);
      expect(rightPixelAfter).toEqual(rightPixelBefore);
      const rightStop = Array.from(right.document.nodes.entries())
        .map(([id, node]) => ({ id, node }))
        .find(
          ({ node }) =>
            node.kind === "element" &&
            node.tag === "stop" &&
            node.attrs["stop-color"] === "#0000ff",
        );
      expect(
        rightStop
          ? right.renderer
              .nodeToElement(rightStop.id)
              ?.getAttribute("stop-color")
          : null,
      ).toBe("#0000ff");
    } finally {
      left.renderer.destroy();
      right.renderer.destroy();
      left.host.remove();
      right.host.remove();
    }
  });

  it("prevents page color and font styles from changing pane currentColor or text", () => {
    const pageStyle = document.createElement("style");
    pageStyle.textContent = "body { color: rgb(255, 0, 0); font: 40px serif; }";
    document.head.append(pageStyle);
    const pane = mountPane(
      `<svg xmlns="${svgNamespace}" width="100" height="30"><text id="sample" x="1" y="20" fill="currentColor">Pane text</text></svg>`,
    );

    try {
      const text = pane.renderer.nodeToElement("n1");
      expect(text).not.toBeNull();
      expect(getComputedStyle(pane.host).color).not.toBe("rgb(255, 0, 0)");
      expect(getComputedStyle(text!).color).not.toBe("rgb(255, 0, 0)");
      expect(getComputedStyle(text!).fontFamily).toBe(
        getComputedStyle(pane.host).fontFamily,
      );
      expect(getComputedStyle(text!).fontSize).not.toBe("40px");
      expect(getComputedStyle(text!).fill).toBe(
        getComputedStyle(pane.host).color,
      );
    } finally {
      pane.renderer.destroy();
      pane.host.remove();
      pageStyle.remove();
    }
  });

  it("keeps uploaded body and universal CSS inside the pane instead of affecting the app", () => {
    const app = document.createElement("p");
    app.id = "outside-pane";
    app.textContent = "Application content";
    document.body.append(app);
    const pane = mountPane(
      `<svg xmlns="${svgNamespace}" width="100" height="30"><style>body { color: rgb(255, 0, 0); font-size: 99px; } * { color: rgb(0, 255, 0); font-size: 88px; }</style><text x="1" y="20">Pane</text></svg>`,
    );

    try {
      const beforeColor = getComputedStyle(app).color;
      const beforeFontSize = getComputedStyle(app).fontSize;
      const paneText = Array.from(
        pane.host.shadowRoot!.querySelectorAll("text"),
      )[0];

      expect(paneText).toBeDefined();
      expect(getComputedStyle(paneText).color).toBe("rgb(0, 255, 0)");
      expect(getComputedStyle(paneText).fontSize).toBe("88px");
      expect(getComputedStyle(app).color).toBe(beforeColor);
      expect(getComputedStyle(app).fontSize).toBe(beforeFontSize);
      expect(document.body.style.color).toBe("");
    } finally {
      pane.renderer.destroy();
      pane.host.remove();
      app.remove();
    }
  });
});
