import { drawBackground } from "./backgrounds";
import { drawText } from "./text";
import { THEMES } from "./themes";
import { getEffectiveStyle } from "../state";
import type { Project, Scene, SceneStyle } from "../types";

export interface RenderState {
  project: Project;
  scenes: Scene[];
  sceneIndexes?: number[];
  times: number[];
  backgroundTime?: number;
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

function projectWithStyle(project: Project, style: SceneStyle): Project {
  const { anim, ...sceneStyle } = style;
  return {
    ...project,
    settings: {
      ...project.settings,
      ...sceneStyle,
      animation: anim,
    },
  };
}

export function render(
  ctx: CanvasRenderingContext2D,
  time: number,
  renderState: RenderState,
): void {
  const { project, scenes, times, playing } = renderState;
  let sceneIndex = renderState.live?.sceneIndex ?? -1;
  if (!renderState.live) {
    for (let index = 0; index < times.length; index += 1) {
      if (times[index] <= time) sceneIndex = index;
    }
  }

  const projectSceneIndex =
    sceneIndex >= 0
      ? (renderState.sceneIndexes?.[sceneIndex] ?? sceneIndex)
      : 0;
  const activeProject = projectWithStyle(
    project,
    getEffectiveStyle(project, projectSceneIndex),
  );
  const theme =
    THEMES.find(({ id }) => id === activeProject.settings.themeId) ?? THEMES[0];
  drawBackground(
    ctx,
    renderState.backgroundTime ?? time,
    theme,
    activeProject.settings.invertColors,
  );

  if (sceneIndex >= 0 && scenes[sceneIndex]) {
    const elapsed = renderState.live
      ? time - renderState.live.sceneStart
      : playing
        ? (renderState.pausedTime ?? time) - (times[sceneIndex] ?? 0)
        : project.settings.secondsPerScene;
    const previousIndex =
      renderState.live?.previousIndex ?? sceneIndex - 1;
    if (previousIndex >= 0 && scenes[previousIndex] && elapsed < 0.35) {
      const previousProject = projectWithStyle(
        project,
        getEffectiveStyle(
          project,
          renderState.sceneIndexes?.[previousIndex] ?? previousIndex,
        ),
      );
      drawText(
        ctx,
        scenes[previousIndex],
        9,
        1 - elapsed / 0.35,
        previousProject,
      );
    }
    drawText(ctx, scenes[sceneIndex], elapsed, 1, activeProject);
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
