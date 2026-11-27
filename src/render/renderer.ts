import { drawBackground } from "./backgrounds";
import { drawText } from "./text";
import { THEMES } from "./themes";
import type { Project, Scene } from "../types";

export interface RenderState {
  project: Project;
  scenes: Scene[];
  times: number[];
  playing: boolean;
  pausedTime?: number;
  logo: HTMLImageElement | null;
  live: {
    sceneIndex: number;
    previousIndex: number;
    sceneStart: number;
  } | null;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function render(
  ctx: CanvasRenderingContext2D,
  time: number,
  renderState: RenderState,
): void {
  const { project, scenes, times, playing } = renderState;
  const theme =
    THEMES.find(({ id }) => id === project.settings.themeId) ?? THEMES[0];
  drawBackground(ctx, time, theme);

  let sceneIndex = renderState.live?.sceneIndex ?? -1;
  if (!renderState.live) {
    for (let index = 0; index < times.length; index += 1) {
      if (times[index] <= time) sceneIndex = index;
    }
  }

  if (sceneIndex >= 0 && scenes[sceneIndex]) {
    const elapsed = renderState.live
      ? time - renderState.live.sceneStart
      : playing
        ? (renderState.pausedTime ?? time) - (times[sceneIndex] ?? 0)
        : project.settings.secondsPerScene;
    const previousIndex =
      renderState.live?.previousIndex ?? sceneIndex - 1;
    if (previousIndex >= 0 && scenes[previousIndex] && elapsed < 0.35) {
      drawText(
        ctx,
        scenes[previousIndex],
        9,
        1 - elapsed / 0.35,
        project,
      );
    }
    drawText(ctx, scenes[sceneIndex], elapsed, 1, project);
  }

  if (renderState.logo) {
    const height = ctx.canvas.height * 0.09;
    const width = (height * renderState.logo.width) / renderState.logo.height;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.drawImage(
      renderState.logo,
      ctx.canvas.width - width - ctx.canvas.width * 0.03,
      ctx.canvas.height * 0.045,
      width,
      height,
    );
    ctx.restore();
  }
}
