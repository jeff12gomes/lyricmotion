import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../../src/state";
import { drawText } from "../../src/render/text";

function renderWords(
  text: string,
  highlightFont: "Dancing Script" | "Poppins",
  fontSize = 100,
  highlightFontSize = 115,
): Array<{ text: string; font: string; x: number; y: number; width: number }> {
  let activeFont = "";
  const drawnWords: Array<{
    text: string;
    font: string;
    x: number;
    y: number;
    width: number;
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
    save: () => undefined,
    restore: () => undefined,
    fillText: (value: string, x: number, y: number) => {
      const size = Number.parseFloat(activeFont.match(/[\d.]+px/)?.[0] ?? "0");
      drawnWords.push({
        text: value,
        font: activeFont,
        x,
        y,
        width: value.length * size,
      });
    },
    textBaseline: "middle",
    textAlign: "left",
    globalAlpha: 1,
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

  drawText(context, { text }, 1, 1, project);
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
});
