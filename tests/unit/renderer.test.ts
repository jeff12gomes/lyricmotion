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
      expect.objectContaining({
        settings: expect.objectContaining({
          themeId: state.project.settings.themeId,
        }),
      }),
    );
  });

  it("passes the color inversion setting to the shared background renderer", () => {
    const state: RenderState = {
      project: createDefaultProject(),
      scenes: [],
      times: [],
      playing: false,
      logo: null,
      live: null,
    };
    state.project.settings.invertColors = true;

    render(
      { canvas: { width: 1920, height: 1080 } } as CanvasRenderingContext2D,
      0,
      state,
    );

    expect(drawBackground).toHaveBeenCalledWith(
      expect.anything(),
      0,
      expect.anything(),
      true,
    );
  });

  it("renders a selected scene using its effective style", () => {
    const project = createDefaultProject();
    project.sceneStyles[1] = {
      themeId: "brasa-intensa",
      anim: "quicar",
      inkColor: "#00ff00",
    };
    const state: RenderState = {
      project,
      scenes: [{ text: "Cena personalizada" }],
      sceneIndexes: [1],
      times: [0],
      playing: false,
      logo: null,
      live: null,
    };

    render(
      { canvas: { width: 1920, height: 1080 } } as CanvasRenderingContext2D,
      0,
      state,
    );

    expect(drawBackground.mock.calls.at(-1)?.[2]).toMatchObject({
      id: "brasa-intensa",
    });
    expect(drawText.mock.calls.at(-1)?.[4]).toMatchObject({
      settings: expect.objectContaining({
        themeId: "brasa-intensa",
        animation: "quicar",
        inkColor: "#00ff00",
      }),
    });
  });
});
