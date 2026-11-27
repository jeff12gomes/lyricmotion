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

describe("drawBackground animation", () => {
  function drawTrace(theme: (typeof THEMES)[number], time: number): unknown[] {
    const calls: unknown[] = [];
    const context = new Proxy(
      { canvas: { width: 1280, height: 720 } },
      {
        get(target, property, receiver) {
          if (property in target) return Reflect.get(target, property, receiver);
          if (
            property === "createLinearGradient" ||
            property === "createRadialGradient"
          ) {
            return (...args: number[]) => {
              calls.push([property, ...args]);
              return {
                addColorStop: (...stopArgs: [number, string]) =>
                  calls.push(["addColorStop", ...stopArgs]),
              };
            };
          }
          return (...args: unknown[]) => calls.push([property, ...args]);
        },
        set(target, property, value, receiver) {
          if (typeof value !== "object") calls.push(["set", property, value]);
          return Reflect.set(target, property, value, receiver);
        },
      },
    ) as unknown as CanvasRenderingContext2D;

    drawBackground(context, time, theme);
    return calls;
  }

  it("changes the rendered background over a short scene for every animated theme", () => {
    for (const theme of THEMES.filter(({ bg }) => bg !== "chapado")) {
      expect(drawTrace(theme, 0), theme.name).not.toEqual(drawTrace(theme, 4));
    }
  });
});
