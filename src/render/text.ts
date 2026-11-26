import { parseHighlightLines } from "../scenes";
import type { Project, Scene } from "../types";
import { FONTS } from "./themes";

interface LayoutWord {
  text: string;
  width: number;
  highlighted: boolean;
}

interface TextLayout {
  lines: LayoutWord[][];
  spaceWidth: number;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function ease(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  weight: number,
  size: number,
  maxWidth: number,
): TextLayout {
  ctx.font = `${weight} ${size}px "${font}"`;
  const spaceWidth = ctx.measureText(" ").width;
  const lines: LayoutWord[][] = [[]];
  let lineWidth = 0;

  for (const row of parseHighlightLines(text)) {
    if (lines[lines.length - 1].length) {
      lines.push([]);
      lineWidth = 0;
    }

    for (const word of row) {
      const width = ctx.measureText(word.text).width;
      if (lineWidth > 0 && lineWidth + spaceWidth + width > maxWidth) {
        lines.push([]);
        lineWidth = 0;
      }
      lines[lines.length - 1].push({
        text: word.text,
        width,
        highlighted: word.highlighted,
      });
      lineWidth += (lineWidth ? spaceWidth : 0) + width;
    }
  }

  return { lines: lines.filter((line) => line.length), spaceWidth };
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  elapsed: number,
  alpha: number,
  project: Project,
): void {
  const { settings } = project;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  const text = settings.uppercase ? scene.text.toUpperCase() : scene.text;
  let size = Math.min(height * 0.085, width * 0.062) * (scene.title ? 1.3 : 1);
  let layout: TextLayout = { lines: [], spaceWidth: 0 };

  for (let attempt = 0; attempt < 7; attempt += 1) {
    layout = layoutText(
      ctx,
      text,
      settings.font,
      FONTS[settings.font],
      size,
      width * 0.84,
    );
    if (layout.lines.length <= (settings.twoLines ? 4 : 3)) break;
    size *= 0.88;
  }

  const lineHeight = size * 1.22;
  const totalHeight = layout.lines.length * lineHeight;
  const centerY =
    settings.position === "centro"
      ? height / 2
      : height - totalHeight / 2 - height * 0.09;

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (settings.animation === "zoom") {
    const scale = 1 + (1 - ease(clamp(elapsed / 0.8))) * 0.12;
    ctx.translate(width / 2, centerY);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -centerY);
  }
  if (settings.shadow) {
    ctx.shadowColor = "rgba(0,0,0,.5)";
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
  }

  let wordIndex = 0;
  layout.lines.forEach((line, lineIndex) => {
    const lineWidth =
      line.reduce((sum, word) => sum + word.width, 0) +
      layout.spaceWidth * (line.length - 1);
    let x = width / 2 - lineWidth / 2;
    const y =
      centerY - totalHeight / 2 + lineHeight / 2 + lineIndex * lineHeight;

    for (const word of line) {
      let progress: number;
      let offsetY = 0;
      if (settings.animation === "palavras") {
        progress = ease(clamp((elapsed - wordIndex * 0.07) / 0.4));
        offsetY = (1 - progress) * size * 0.25;
      } else if (settings.animation === "zoom") {
        progress = ease(clamp(elapsed / 0.8));
      } else {
        progress = ease(clamp((elapsed - lineIndex * 0.12) / 0.6));
        offsetY = (1 - progress) * size * 0.45;
      }

      ctx.globalAlpha = alpha * progress;
      ctx.fillStyle = word.highlighted
        ? settings.highlightColor
        : settings.inkColor;
      ctx.fillText(word.text, x, y + offsetY);
      x += word.width + layout.spaceWidth;
      wordIndex += 1;
    }
  });
  ctx.restore();
}
