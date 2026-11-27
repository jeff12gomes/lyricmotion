import { describe, expect, it } from "vitest";
import { createDefaultProject } from "../../src/state";
import { drawText } from "../../src/render/text";

function renderWords(
  text: string,
  highlightFont: "Dancing Script" | "Poppins",
): Array<{ text: string; font: string }> {
  let activeFont = "";
  const drawnWords: Array<{ text: string; font: string }> = [];
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
    fillText: (value: string) => drawnWords.push({ text: value, font: activeFont }),
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
    expect(scriptSize / normalSize).toBeCloseTo(1.25);
  });

  it("applies uppercase to highlighted words in non-handwritten fonts", () => {
    const words = renderWords("NÃO *Tenho* MEDO", "Poppins");

    expect(words.map(({ text }) => text)).toEqual(["NÃO", "TENHO", "MEDO"]);
    expect(words[1].font).toContain('"Poppins"');
  });
});
