import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SvgRenderer } from "../../../src/components/tools/svg-editor/render/renderer";
import SvgEditor from "../../../src/components/tools/svg-editor/ui/SvgEditor";

const SVG_SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="tomato"/></svg>';

describe("SVG editor UI", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders accessible upload controls and both empty panes", () => {
    render(<SvgEditor />);
    expect(screen.getByRole("region", { name: "SVG editor" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose SVG" })).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Original SVG pane" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("region", { name: "Edited SVG pane" }),
    ).toBeTruthy();
    expect(screen.getByTestId("zoom-level").textContent).toBe("100%");
  });

  it("keeps exactly one renderer in each pane under StrictMode and cleans up", async () => {
    const mount = vi.spyOn(SvgRenderer.prototype, "mount");
    const destroy = vi.spyOn(SvgRenderer.prototype, "destroy");
    const { container, unmount } = render(
      <StrictMode>
        <SvgEditor initialSvg={SVG_SOURCE} />
      </StrictMode>,
    );

    await waitFor(() => {
      expect(container.querySelectorAll("[data-pane-host]")).toHaveLength(2);
      expect(
        Array.from(container.querySelectorAll<HTMLElement>("[data-pane-host]"))
          .map((host) => host.shadowRoot?.querySelector("svg"))
          .filter(Boolean),
      ).toHaveLength(2);
    });
    expect(mount).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenCalledTimes(0);
    unmount();
    expect(destroy).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll("[data-pane-host]")).toHaveLength(0);
  });

  it("updates zoom and linked-view controls from toolbar actions", async () => {
    render(<SvgEditor initialSvg={SVG_SOURCE} />);
    await screen.findByText("SVG loaded.");
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => {
      expect(screen.getByTestId("zoom-level").textContent).not.toBe("100%");
    });
    const linkButton = screen.getByRole("button", { name: "Link views" });
    expect(linkButton.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(linkButton);
    expect(linkButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("accepts pasted SVG source and reports sanitizer removals", async () => {
    render(<SvgEditor />);
    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        getData: () =>
          '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><rect width="10" height="10"/></svg>',
      },
    });
    fireEvent(screen.getByTestId("upload-zone"), pasteEvent);

    expect(
      await screen.findByText(/unsafe item removed before loading/i),
    ).toBeTruthy();
    const hosts = document.querySelectorAll<HTMLElement>("[data-pane-host]");
    expect(hosts).toHaveLength(2);
    expect(
      Array.from(hosts).every(
        (host) => !host.shadowRoot?.querySelector("script"),
      ),
    ).toBe(true);
  });

  it("shows clear errors for malformed XML and files over the size limit", async () => {
    const firstRender = render(<SvgEditor />);
    const file = new File(
      ['<svg xmlns="http://www.w3.org/2000/svg"><rect></svg>'],
      "malformed.svg",
      { type: "image/svg+xml" },
    );
    fireEvent.change(screen.getByLabelText("Choose an SVG file"), {
      target: { files: [file] },
    });
    expect(await screen.findByRole("alert")).toBeTruthy();

    firstRender.unmount();
    render(<SvgEditor maxFileBytes={8} />);
    const oversized = new File([SVG_SOURCE], "large.svg", {
      type: "image/svg+xml",
    });
    fireEvent.change(screen.getByLabelText("Choose an SVG file"), {
      target: { files: [oversized] },
    });
    expect((await screen.findByRole("alert")).textContent).toContain(
      "exceeds the 8-byte limit",
    );
  });

  it("attaches and removes document pointer listeners only during a drag", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<SvgEditor initialSvg={SVG_SOURCE} />);
    await screen.findByText("SVG loaded.");

    fireEvent.pointerDown(screen.getByTestId("original-viewport"), {
      button: 1,
      pointerId: 7,
      clientX: 10,
      clientY: 20,
    });
    expect(add.mock.calls.some(([type]) => type === "pointermove")).toBe(true);
    fireEvent.pointerUp(document, { pointerId: 7 });
    expect(remove.mock.calls.some(([type]) => type === "pointermove")).toBe(
      true,
    );
    unmount();
  });

  it("does not forward the command-palette shortcut from inside the editor", () => {
    const outsideHandler = vi.fn();
    document.addEventListener("keydown", outsideHandler);
    render(<SvgEditor />);
    fireEvent.keyDown(screen.getByRole("region", { name: "SVG editor" }), {
      key: "k",
      ctrlKey: true,
    });
    expect(outsideHandler).not.toHaveBeenCalled();
    document.removeEventListener("keydown", outsideHandler);
  });
});
