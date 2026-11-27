import { parseHighlightLines } from "../scenes";
import type { FontFamily, Project, Scene } from "../types";
import { FONT_CATALOG } from "./themes";

interface LayoutWord {
  text: string;
  width: number;
  glyphWidth: number;
  spaceAfter: number;
  highlighted: boolean;
  animation: Project["settings"]["animation"];
  font: FontFamily;
  weight: number;
  size: number;
}

interface TextLayout {
  lines: LayoutWord[][];
  lineHeights: number[];
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function ease(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function animationProgress(
  animation: Project["settings"]["animation"],
  elapsed: number,
  duration: number,
  sequenceIndex: number,
  sequenceCount: number,
): number {
  const staggerRatio =
    animation === "palavras" ? 0.35 : animation === "subir" ? 0.2 : 0;
  const staggerDuration =
    sequenceCount > 1 ? duration * staggerRatio : 0;
  const delay =
    sequenceCount > 1
      ? (staggerDuration * sequenceIndex) / (sequenceCount - 1)
      : 0;
  const tokenDuration = duration - staggerDuration;
  return ease(clamp((elapsed - delay) / tokenDuration));
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
        word.highlighted && FONT_CATALOG[settings.highlightFont].isCursive;
      const wordSize =
        size *
        (word.highlighted
          ? settings.highlightFontSize
          : settings.fontSize) /
        100;
      const wordText =
        settings.uppercase && !handwritten ? word.text.toUpperCase() : word.text;
      ctx.font = `${FONT_CATALOG[font].weight} ${wordSize}px "${font}"`;
      const spaceAfter = ctx.measureText(" ").width;
      const glyphWidth = ctx.measureText(wordText).width;
      const animation = word.highlighted
        ? settings.highlightAnim
        : settings.animation;
      const wordWidth =
        glyphWidth +
        (animation === "espacar"
          ? Math.max(0, Array.from(wordText).length - 1) * wordSize * 0.25
          : 0);
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
        glyphWidth,
        spaceAfter,
        highlighted: word.highlighted,
        animation,
        font,
        weight: FONT_CATALOG[font].weight,
        size: wordSize,
      });
      lineWidth += wordWidth;
    }
  }

  const nonEmptyLines = lines.filter((line) => line.length);
  return {
    lines: nonEmptyLines,
    lineHeights: nonEmptyLines.map(
      (line) => Math.max(...line.map((word) => word.size)) * 1.22,
    ),
  };
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
  let layout: TextLayout = { lines: [], lineHeights: [] };

  for (let attempt = 0; attempt < 32; attempt += 1) {
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

  const totalHeight = layout.lineHeights.reduce(
    (total, lineHeight) => total + lineHeight,
    0,
  );
  const centerY =
    settings.position === "centro"
      ? height / 2
      : height - totalHeight / 2 - height * 0.09;
  const wordCounts = new Map<Project["settings"]["animation"], number>();
  const lineIndexes = new Map<number, number>();
  let subirLineCount = 0;
  for (const [lineIndex, line] of layout.lines.entries()) {
    let hasSubir = false;
    for (const word of line) {
      if (word.animation === "palavras") {
        wordCounts.set(
          "palavras",
          (wordCounts.get("palavras") ?? 0) + 1,
        );
      }
      if (word.animation === "subir") hasSubir = true;
    }
    if (hasSubir) lineIndexes.set(lineIndex, subirLineCount++);
  }

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  if (settings.shadow) {
    ctx.shadowColor = "rgba(0,0,0,.5)";
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
  }

  let wordAnimationIndex = 0;
  let lineTop = centerY - totalHeight / 2;
  layout.lines.forEach((line, lineIndex) => {
    const lineHeight = layout.lineHeights[lineIndex];
    const lineWidth = line.reduce(
      (sum, word, index) =>
        sum + word.width + (index < line.length - 1 ? word.spaceAfter : 0),
      0,
    );
    let x = width / 2 - lineWidth / 2;
    const y = lineTop + lineHeight / 2;

    for (const [wordLineIndex, word] of line.entries()) {
      const animationIndex =
        word.animation === "palavras" ? wordAnimationIndex : lineIndex;
      const animationCount =
        word.animation === "palavras"
          ? (wordCounts.get("palavras") ?? 1)
          : word.animation === "subir"
            ? subirLineCount
            : 1;
      const sequenceIndex =
        word.animation === "subir"
          ? (lineIndexes.get(lineIndex) ?? 0)
          : animationIndex;
      const duration = word.highlighted
        ? settings.highlightAnimDuration
        : settings.animDuration;
      const progress = animationProgress(
        word.animation,
        elapsed,
        duration,
        sequenceIndex,
        animationCount,
      );
      const remaining = 1 - progress;
      const offsetX =
        word.animation === "deslizar-esq"
          ? -word.width * 0.55 * remaining
          : word.animation === "deslizar-dir"
            ? word.width * 0.55 * remaining
            : 0;
      const offsetY =
        word.animation === "subir" ? size * 0.45 * remaining : 0;
      let scaleX = 1;
      let scaleY = 1;
      if (word.animation === "zoom") {
        scaleX = scaleY = 1 + remaining * 0.12;
      } else if (word.animation === "expandir") {
        scaleX = scaleY = 0.65 + progress * 0.35;
      } else if (word.animation === "quicar") {
        const overshoot = Math.sin(progress * Math.PI) * remaining * 0.38;
        scaleX = scaleY = 0.76 + progress * 0.24 + overshoot;
      }

      ctx.globalAlpha = alpha * (word.animation === "cortina" ? 1 : progress);
      ctx.font = `${word.weight} ${word.size}px "${word.font}"`;
      ctx.fillStyle = word.highlighted
        ? settings.highlightColor
        : settings.inkColor;

      ctx.save();
      ctx.translate(x + word.width / 2 + offsetX, y + offsetY);
      ctx.scale(scaleX, scaleY);
      if (word.animation === "cortina") {
        ctx.beginPath();
        ctx.rect(
          -word.width / 2 - word.size,
          word.size * 0.75 - word.size * 1.5 * progress,
          word.width + word.size * 2,
          word.size * 1.5 * progress,
        );
        ctx.clip();
      }

      if (word.animation === "espacar") {
        const characters = Array.from(word.text);
        const tracking = word.size * 0.25 * remaining;
        const drawnWidth =
          word.glyphWidth +
          Math.max(0, characters.length - 1) * tracking;
        let characterX = -word.width / 2 + (word.width - drawnWidth) / 2;
        for (const character of characters) {
          ctx.fillText(character, characterX, 0);
          characterX += ctx.measureText(character).width + tracking;
        }
      } else {
        ctx.fillText(word.text, -word.width / 2, 0);
      }
      ctx.restore();

      x += word.width + (wordLineIndex < line.length - 1 ? word.spaceAfter : 0);
      if (word.animation === "palavras") wordAnimationIndex += 1;
    }
    lineTop += lineHeight;
  });
  ctx.restore();
}
