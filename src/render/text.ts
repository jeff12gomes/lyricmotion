import { parseHighlightLines } from "../scenes";
import type { FontFamily, Project, Scene } from "../types";
import { FONTS } from "./themes";

interface LayoutWord {
  text: string;
  width: number;
  spaceAfter: number;
  highlighted: boolean;
  font: FontFamily;
  weight: number;
  size: number;
}

interface TextLayout {
  lines: LayoutWord[][];
}

const HANDWRITTEN_FONTS: FontFamily[] = [
  "Dancing Script",
  "Great Vibes",
  "Caveat",
];

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function ease(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function layoutText(
  ctx: CanvasRenderingContext2D,
  text: string,
  project: Project,
  size: number,
  maxWidth: number,
): TextLayout {
  const lines: LayoutWord[][] = [[]];
  let lineWidth = 0;
  const { settings } = project;

  for (const row of parseHighlightLines(text)) {
    if (lines[lines.length - 1].length) {
      lines.push([]);
      lineWidth = 0;
    }

    for (const word of row) {
      const font = word.highlighted ? settings.highlightFont : settings.font;
      const handwritten =
        word.highlighted && HANDWRITTEN_FONTS.includes(settings.highlightFont);
      const wordSize = size * (handwritten ? 1.25 : 1);
      const wordText =
        settings.uppercase && !handwritten ? word.text.toUpperCase() : word.text;
      ctx.font = `${FONTS[font]} ${wordSize}px "${font}"`;
      const spaceAfter = ctx.measureText(" ").width;
      const wordWidth = ctx.measureText(wordText).width;
      const currentLine = lines[lines.length - 1];
      const precedingSpace = currentLine.length
        ? currentLine[currentLine.length - 1].spaceAfter
        : 0;
      if (lineWidth > 0 && lineWidth + precedingSpace + wordWidth > maxWidth) {
        lines.push([]);
        lineWidth = 0;
      }
      const line = lines[lines.length - 1];
      if (line.length) lineWidth += line[line.length - 1].spaceAfter;
      line.push({
        text: wordText,
        width: wordWidth,
        spaceAfter,
        highlighted: word.highlighted,
        font,
        weight: FONTS[font],
        size: wordSize,
      });
      lineWidth += wordWidth;
    }
  }

  return { lines: lines.filter((line) => line.length) };
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
  let size = Math.min(height * 0.085, width * 0.062) * (scene.title ? 1.3 : 1);
  let layout: TextLayout = { lines: [] };

  for (let attempt = 0; attempt < 7; attempt += 1) {
    layout = layoutText(
      ctx,
      scene.text,
      project,
      size,
      width * 0.84,
    );
    if (layout.lines.length <= 4) break;
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
    const lineWidth = line.reduce(
      (sum, word, index) =>
        sum + word.width + (index < line.length - 1 ? word.spaceAfter : 0),
      0,
    );
    let x = width / 2 - lineWidth / 2;
    const y =
      centerY - totalHeight / 2 + lineHeight / 2 + lineIndex * lineHeight;

    for (const [wordLineIndex, word] of line.entries()) {
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
      ctx.font = `${word.weight} ${word.size}px "${word.font}"`;
      ctx.fillStyle = word.highlighted
        ? settings.highlightColor
        : settings.inkColor;
      ctx.fillText(word.text, x, y + offsetY);
      x += word.width + (wordLineIndex < line.length - 1 ? word.spaceAfter : 0);
      wordIndex += 1;
    }
  });
  ctx.restore();
}
