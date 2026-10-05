export interface PaneHost extends HTMLElement {
  readonly rendererContainer: HTMLDivElement;
}

const PANE_STYLES = `
  :host {
    all: initial;
    display: block;
    color: #1f2937;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;
    direction: ltr;
    visibility: visible;
  }

  [data-pane-container] {
    display: block;
    min-width: 0;
    min-height: 0;
  }

  [data-pane-container] > svg {
    display: block;
    max-width: 100%;
  }
`;

/**
 * Creates an isolated pane host and exposes its in-shadow renderer mount element.
 */
export function createPaneHost(ownerDocument: Document = document): PaneHost {
  const host = ownerDocument.createElement("div") as HTMLDivElement &
    Partial<PaneHost>;
  host.style.setProperty("all", "initial", "important");
  host.style.setProperty("display", "block", "important");
  host.style.setProperty("color", "#1f2937", "important");
  host.style.setProperty(
    "font-family",
    "Arial, Helvetica, sans-serif",
    "important",
  );
  host.style.setProperty("font-size", "16px", "important");
  host.style.setProperty("direction", "ltr", "important");
  host.style.setProperty("visibility", "visible", "important");
  const shadowRoot = host.attachShadow({ mode: "open" });
  const styles = ownerDocument.createElement("style");
  styles.textContent = PANE_STYLES;

  const rendererContainer = ownerDocument.createElement("div");
  rendererContainer.setAttribute("data-pane-container", "");

  shadowRoot.append(styles, rendererContainer);
  Object.defineProperty(host, "rendererContainer", {
    configurable: false,
    enumerable: false,
    value: rendererContainer,
    writable: false,
  });
  return host as PaneHost;
}
