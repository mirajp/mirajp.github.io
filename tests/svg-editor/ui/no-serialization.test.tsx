import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import SvgEditor from "../../../src/components/tools/svg-editor/ui/SvgEditor";

const { serializeSpy } = vi.hoisted(() => ({
  serializeSpy: vi.fn(),
}));

vi.mock(
  "../../../src/components/tools/svg-editor/io/serialize",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/components/tools/svg-editor/io/serialize")
      >();
    return {
      ...actual,
      serialize: (...args: Parameters<typeof actual.serialize>) => {
        serializeSpy(...args);
        return actual.serialize(...args);
      },
    };
  },
);

const SVG_SOURCE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="tomato"/></svg>';

it("does not serialize while zooming or panning either pane", async () => {
  const { container } = render(<SvgEditor initialSvg={SVG_SOURCE} />);
  await screen.findByText("SVG loaded.");
  const viewport = screen.getByTestId("edited-viewport");

  fireEvent.wheel(viewport, { deltaY: -50, clientX: 40, clientY: 30 });
  fireEvent.pointerDown(viewport, {
    button: 1,
    pointerId: 12,
    clientX: 40,
    clientY: 30,
  });
  fireEvent.pointerMove(document, {
    pointerId: 12,
    clientX: 57,
    clientY: 44,
  });
  fireEvent.pointerUp(document, { pointerId: 12 });

  expect(container.querySelectorAll("[data-pane-host]")).toHaveLength(2);
  expect(serializeSpy).not.toHaveBeenCalled();
});
