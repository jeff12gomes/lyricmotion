import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../../src/state";
import { drawText } from "../../src/render/text";
import type { Animation, AnimationUnit, Position } from "../../src/types";

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
  animUnit: AnimationUnit = "frase",
  highlightAnimUnit: AnimationUnit = "frase",
  position: Position = "centro",
  invertColors = false,
  inkColor = "#ffffff",
  highlightColor = "#ffd166",
): Array<{
  text: string;
  font: string;
  x: number;
  y: number;
  width: number;
  alpha: number;
  fillStyle: string;
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
    fillStyle: string;
  }> = [];
  let activeFillStyle = "";
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
      return { width: Array.from(value).length * size };
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
        width: Array.from(value).length * size * transform.scaleX,
        alpha: activeAlpha,
        fillStyle: activeFillStyle,
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
    get fillStyle() {
      return activeFillStyle;
    },
    set fillStyle(value: string) {
      activeFillStyle = value;
    },
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
  project.settings.animUnit = animUnit;
  project.settings.highlightAnimUnit = highlightAnimUnit;
  project.settings.position = position;
  project.settings.invertColors = invertColors;
  project.settings.inkColor = inkColor;
  project.settings.highlightColor = highlightColor;

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
      for (const unit of ["letras", "palavra", "frase"] as const) {
        const words = renderWords(
          "Texto *destacado*",
          "Poppins",
          100,
          115,
          animation,
          animation,
          1,
          1,
          1,
          unit,
          unit,
        );
        expect(words.map(({ text }) => text).join("")).toBe("TEXTODESTACADO");
        if (unit === "letras" || animation === "espacar") {
          expect(words.length).toBeGreaterThan(2);
        } else {
          expect(words).toHaveLength(2);
        }
      }
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
      "palavra",
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
      "palavra",
    );
    expect(staggeredInProgress[0].alpha).toBeGreaterThan(
      staggeredInProgress.at(-1)!.alpha,
    );
  });

  it("animates every normal word together when the unit is phrase", () => {
    const words = renderWords(
      "Um dois três",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      2,
      1,
      0.5,
      "frase",
      "frase",
    );

    expect(new Set(words.map(({ alpha }) => alpha)).size).toBe(1);
    expect(words[0].alpha).toBeGreaterThan(0);
    expect(words[0].alpha).toBeLessThan(1);
  });

  it("staggered words complete at the end of their configured duration", () => {
    const words = renderWords(
      "Um dois três quatro",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      2,
      1,
      0.8,
      "palavra",
      "frase",
    );
    expect(words[0].alpha).toBeGreaterThan(words.at(-1)!.alpha);

    const finished = renderWords(
      "Um dois três quatro",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      2,
      1,
      2,
      "palavra",
      "frase",
    );
    expect(finished.every(({ alpha }) => alpha === 1)).toBe(true);
  });

  it("draws accented and non-BMP highlighted text character by character", () => {
    const text = "Ação🌟";
    const words = renderWords(
      `*${text}*`,
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      2,
      1,
      0.25,
      "frase",
      "letras",
    );

    expect(words.map(({ text: character }) => character)).toEqual(
      Array.from(text.toUpperCase()),
    );
    expect(words.every(({ alpha }) => alpha < 1)).toBe(true);
    expect(words.every(({ alpha }) => alpha >= 0)).toBe(true);
    expect(words.slice(1).every((word, index) => word.x > words[index].x)).toBe(
      true,
    );
    const finished = renderWords(
      `*${text}*`,
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      2,
      1,
      1,
      "frase",
      "letras",
    );
    expect(finished.every(({ alpha }) => alpha === 1)).toBe(true);
  });

  it("positions the text block inside the 10% top and bottom safe margins", () => {
    const topWords = renderWords(
      "ÃGUA É VIDA",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      0.8,
      1,
      1,
      "frase",
      "frase",
      "topo",
    );
    const fontSize = Number.parseFloat(
      topWords[0].font.match(/[\d.]+px/)?.[0] ?? "0",
    );
    const lineHeight = fontSize * 1.22;
    expect(topWords[0].y - lineHeight / 2).toBeCloseTo(108);

    const bottomWords = renderWords(
      "ÃGUA É VIDA",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      0.8,
      1,
      1,
      "frase",
      "frase",
      "baixo",
    );
    expect(bottomWords[0].y + lineHeight / 2).toBeCloseTo(1080 - 108);

    const centeredWords = renderWords(
      "ÃGUA É VIDA",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      0.8,
      1,
      1,
      "frase",
      "frase",
      "centro",
    );
    expect(centeredWords[0].y).toBeCloseTo(1080 / 2);
  });

  it("inverts rendered text colors without changing the saved color settings", () => {
    const words = renderWords(
      "Principal *Destaque*",
      "Poppins",
      100,
      115,
      "surgir",
      "surgir",
      0.8,
      1,
      1,
      "frase",
      "frase",
      "centro",
      true,
      "#123456",
      "#abcdef",
    );

    expect(words[0].fillStyle).toBe("#edcba9");
    expect(words[1].fillStyle).toBe("#543210");
  });
});
