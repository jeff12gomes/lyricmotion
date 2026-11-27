import { describe, expect, it, vi } from "vitest";
import { drawBackground } from "../../src/render/backgrounds";
import { THEMES } from "../../src/render/themes";

describe("drawBackground color inversion", () => {
  it("inverts theme colors but leaves Chroma Verde unchanged", () => {
    let fillStyle = "";
    const ctx = {
      canvas: { width: 1920, height: 1080 },
      set fillStyle(value: string) {
        fillStyle = value;
      },
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    const chroma = THEMES.find(({ id }) => id === "chroma");
    if (!chroma) throw new Error("Tema Chroma Verde não encontrado");
    const customTheme = {
      ...chroma,
      id: "custom-green",
      c: ["#123456", "#123456", "#123456"] as [string, string, string],
    };

    drawBackground(ctx, 0, customTheme, true);
    expect(fillStyle).toBe("#edcba9");

    drawBackground(ctx, 0, chroma, true);
    expect(fillStyle).toBe("#00b140");
  });
});
