import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultProject } from "../../src/state";
import { render, type RenderState } from "../../src/render/renderer";

const { drawBackground, drawText } = vi.hoisted(() => ({
  drawBackground: vi.fn(),
  drawText: vi.fn(),
}));

vi.mock("../../src/render/backgrounds", () => ({
  drawBackground: (...args: unknown[]) => drawBackground(...args),
}));
vi.mock("../../src/render/text", () => ({
  drawText: (...args: unknown[]) => drawText(...args),
}));

describe("render playback state", () => {
  beforeEach(() => {
    drawBackground.mockClear();
    drawText.mockClear();
  });

  it("renders paused text at its final animation state", () => {
    const state: RenderState = {
      project: createDefaultProject(),
      scenes: [{ text: "Uma frase *destacada*" }],
      times: [0],
      playing: false,
      pausedTime: 0.1,
      logo: null,
      live: null,
    };

    render(
      { canvas: { width: 1920, height: 1080 } } as CanvasRenderingContext2D,
      0.1,
      state,
    );

    expect(drawText).toHaveBeenCalledWith(
      expect.anything(),
      state.scenes[0],
      state.project.settings.secondsPerScene,
      1,
      state.project,
    );
  });
});
