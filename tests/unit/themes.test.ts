import { describe, expect, it } from "vitest";
import { FONT_CATALOG, THEMES } from "../../src/render/themes";

describe("theme library", () => {
  it("keeps all 15 existing and new themes available", () => {
    expect(THEMES).toHaveLength(15);
    expect(THEMES.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "Sublime",
        "Coral Urbano",
        "Redenção",
        "Céu Profundo",
        "Brasa Intensa",
        "Louvor Carmim",
        "Feixes de Glória",
        "Aurora",
        "Luz do Céu",
        "Bokeh",
        "Noite Estrelada",
        "Águas",
        "Fogo",
        "Claro",
        "Chroma Verde",
      ]),
    );
    expect(THEMES.filter(({ bg }) => bg === "chapado")).toHaveLength(1);
  });

  describe("font catalog", () => {
    it("includes the 20 added fonts in their categories with exact weights", () => {
      const fonts = Object.values(FONT_CATALOG);
      expect(fonts).toHaveLength(30);
      expect(fonts.map(({ name }) => name)).toEqual(
        expect.arrayContaining([
          "Pacifico",
          "Satisfy",
          "Kaushan Script",
          "Allura",
          "Archivo Black",
          "Alfa Slab One",
          "Russo One",
          "Black Ops One",
          "Syne",
          "Space Grotesk",
          "Chakra Petch",
          "Righteous",
          "Permanent Marker",
          "Cinzel Decorative",
          "Rubik Glitch",
          "Josefin Sans",
          "Raleway",
          "Cormorant Garamond",
          "Outfit",
          "Julius Sans One",
        ]),
      );
      expect(fonts.filter(({ category }) => category === "Manuscritas")).toHaveLength(7);
      expect(fonts.filter(({ category }) => category === "Cheias")).toHaveLength(7);
      expect(fonts.filter(({ category }) => category === "Underground")).toHaveLength(8);
      expect(fonts.filter(({ category }) => category === "Finas")).toHaveLength(8);
      expect(FONT_CATALOG.Syne.weight).toBe(800);
      expect(FONT_CATALOG["Space Grotesk"].weight).toBe(700);
      expect(FONT_CATALOG["Josefin Sans"].weight).toBe(300);
      expect(FONT_CATALOG.Pacifico.isCursive).toBe(true);
      expect(FONT_CATALOG["Rubik Glitch"].isCursive).toBe(false);
    });
  });
});
