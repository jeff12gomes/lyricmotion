import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../../src/state";
import { drawText } from "../../src/render/text";
import type { Animation } from "../../src/types";

function renderWords(
  text: string,
  highlightFont: "Dancing Script" | "Poppins",
  fontSize = 100,
  highlightFontSize = 115,
  animation: Animation = "subir",
  highlightAnim: Animation = "quicar",
  animDuration = 0.8,
  highlightAnimDuration = 1,
  elapsed = 1,
): Array<{
  text: string;
  font: string;
  x: number;
  y: number;
  width: number;
  alpha: number;
}> {
  let activeFont = "";
  let activeAlpha = 1;
  let transform = { x: 0, y: 0, scaleX: 1, scaleY: 1 };
  const transforms: typeof transform[] = [];
  const drawnWords: Array<{
    text: string;
    font: string;
    x: number;
    y: number;
    width: number;
    alpha: number;
  }> = [];
  const context = {
    canvas: { width: 1920, height: 1080 },
    get font() {
      return activeFont;
    },
    set font(value: string) {
      activeFont = value;
    },
    measureText: (value: string) => {
      const size = Number.parseFloat(activeFont.match(/[\d.]+px/)?.[0] ?? "0");
      return { width: value.length * size };
    },
    save: () => transforms.push({ ...transform }),
    restore: () => {
      transform = transforms.pop() ?? { x: 0, y: 0, scaleX: 1, scaleY: 1 };
    },
    translate: (x: number, y: number) => {
      transform.x += x * transform.scaleX;
      transform.y += y * transform.scaleY;
    },
    scale: (scaleX: number, scaleY: number) => {
      transform.scaleX *= scaleX;
      transform.scaleY *= scaleY;
    },
    beginPath: () => undefined,
    rect: () => undefined,
    clip: () => undefined,
    fillText: (value: string, x: number, y: number) => {
      const size = Number.parseFloat(activeFont.match(/[\d.]+px/)?.[0] ?? "0");
      drawnWords.push({
        text: value,
        font: activeFont,
        x: transform.x + x * transform.scaleX,
        y: transform.y + y * transform.scaleY,
        width: value.length * size * transform.scaleX,
        alpha: activeAlpha,
      });
    },
    textBaseline: "middle",
    textAlign: "left",
    get globalAlpha() {
      return activeAlpha;
    },
    set globalAlpha(value: number) {
      activeAlpha = value;
    },
    fillStyle: "",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
  } as unknown as CanvasRenderingContext2D;
  const project = createDefaultProject();
  project.settings.uppercase = true;
  project.settings.highlightFont = highlightFont;
  project.settings.fontSize = fontSize;
  project.settings.highlightFontSize = highlightFontSize;
  project.settings.animation = animation;
  project.settings.highlightAnim = highlightAnim;
  project.settings.animDuration = animDuration;
  project.settings.highlightAnimDuration = highlightAnimDuration;

  drawText(context, { text }, elapsed, 1, project);
  return drawnWords;
}

describe("drawText", () => {
  it("uses the handwritten font at a larger size without uppercasing highlighted words", () => {
    const words = renderWords("NÃO *Tenho* MEDO", "Dancing Script");

    expect(words.map(({ text }) => text)).toEqual(["NÃO", "Tenho", "MEDO"]);
    expect(words[0].font).toContain('"Montserrat"');
    expect(words[1].font).toContain('"Dancing Script"');
    expect(words[2].font).toContain('"Montserrat"');
    const normalSize = Number.parseFloat(words[0].font.match(/[\d.]+px/)?.[0] ?? "0");
    const scriptSize = Number.parseFloat(words[1].font.match(/[\d.]+px/)?.[0] ?? "0");
    expect(scriptSize / normalSize).toBeCloseTo(1.15);
  });

  it("applies uppercase to highlighted words in non-handwritten fonts", () => {
    const words = renderWords("NÃO *Tenho* MEDO", "Poppins");

    expect(words.map(({ text }) => text)).toEqual(["NÃO", "TENHO", "MEDO"]);
    expect(words[1].font).toContain('"Poppins"');
  });

  it("scales each token independently and keeps the larger highlight clear of adjacent words", () => {
    const words = renderWords("NÃO *Tenho* MEDO", "Poppins", 75, 160);
    const baseSize = 91.8;
    const normalSize = Number.parseFloat(words[0].font.match(/[\d.]+px/)?.[0] ?? "0");
    const highlightSize = Number.parseFloat(words[1].font.match(/[\d.]+px/)?.[0] ?? "0");

    expect(normalSize / baseSize).toBeCloseTo(0.75);
    expect(highlightSize / baseSize).toBeCloseTo(1.6);
    expect(words[0].x + words[0].width).toBeLessThan(words[1].x);
    expect(words[1].x + words[1].width).toBeLessThan(words[2].x);
  });

  it("wraps wide text to four lines or fewer within the 8% side margins", () => {
    const text = Array.from({ length: 48 }, (_, index) =>
      index % 4 === 1 ? `*palavra${index}*` : `palavra${index}`,
    ).join(" ");
    const words = renderWords(text, "Poppins", 100, 250);
    const rows = new Set(words.map(({ y }) => y));

    expect(rows.size).toBeLessThanOrEqual(4);
    expect(words.every(({ x, width }) => x >= 1920 * 0.08 && x + width <= 1920 * 0.92)).toBe(true);
  });

  it("renders tokens with all ten animation choices", () => {
    const animations: Animation[] = [
      "subir",
      "palavras",
      "zoom",
      "surgir",
      "deslizar-esq",
      "deslizar-dir",
      "expandir",
      "quicar",
      "espacar",
      "cortina",
    ];

    for (const animation of animations) {
      const words = renderWords(
        "Texto *destacado*",
        "Poppins",
        100,
        115,
        animation,
        animation,
      );
      expect(words.map(({ text }) => text).join("")).toBe("TEXTODESTACADO");
      if (animation === "espacar") expect(words.length).toBeGreaterThan(2);
      else expect(words).toHaveLength(2);
    }
  });

  it("uses each duration independently and scales word staggering to finish within its duration", () => {
    const fast = renderWords(
      "Um *dois* três quatro",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      0.3,
      2.5,
      0.3,
    );
    expect(fast[0].alpha).toBe(1);
    expect(fast[1].alpha).toBeCloseTo(1 - Math.pow(1 - 0.3 / 2.5, 3));

    const staggeredAtEnd = renderWords(
      "Um dois três quatro",
      "Poppins",
      100,
      115,
      "palavras",
      "surgir",
      2.5,
      1,
      2.5,
    );
    expect(staggeredAtEnd.at(-1)?.alpha).toBeCloseTo(1);
    const staggeredInProgress = renderWords(
      "Um dois três quatro",
      "Poppins",
      100,
      115,
      "palavras",
      "surgir",
      2.5,
      1,
      1,
    );
    expect(staggeredInProgress[0].alpha).toBeGreaterThan(
      staggeredInProgress.at(-1)!.alpha,
    );
  });
});
