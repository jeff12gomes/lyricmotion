import { describe, expect, it } from "vitest";
import { ANIMATED_BACKGROUND_TYPES } from "../../src/render/backgrounds";
import { FONT_CATALOG, THEMES } from "../../src/render/themes";

describe("theme library", () => {
  it("keeps all 21 existing and new themes available", () => {
    expect(THEMES).toHaveLength(21);
    expect(THEMES.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "Sublime",
        "Coral Urbano",
        "Redenção",
        "Céu Profundo",
        "Brasa Intensa",
        "Louvor Carmim",
        "Feixes de Glória",
        "Glória Azul",
        "Valente de Deus",
        "Chama do Altar",
        "Celebração Urbana",
        "O Rei Chegou",
        "O Noivo Vem",
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
    const themeBackgrounds = new Set(THEMES.map(({ bg }) => bg));
    expect(themeBackgrounds).toEqual(
      new Set([...ANIMATED_BACKGROUND_TYPES, "chapado"]),
    );
    expect(
      THEMES.filter(({ bg }) => bg === "chapado").map(({ id }) => id),
    ).toEqual(["chroma"]);
  });

  it("configures Glória Azul with its cloud palette, fonts, and animations", () => {
    const theme = THEMES.find(({ id }) => id === "gloria-azul");
    expect(theme).toMatchObject({
      name: "Glória Azul",
      bg: "nuvens-azuis",
      c: ["#040c1a", "#0d2b5c", "#3b82f6"],
      font: "Chakra Petch",
      highlightFont: "Allura",
      ink: "#ffffff",
      hl: "#f59e0b",
      anim: "espacar",
      highlightAnim: "surgir",
      up: true,
      shadow: true,
    });
    expect(FONT_CATALOG["Chakra Petch"]).toBeDefined();
    expect(FONT_CATALOG.Allura).toBeDefined();
  });

  it("configures Valente de Deus with carmine smoke and its serif fonts", () => {
    const theme = THEMES.find(({ id }) => id === "valente-de-deus");
    expect(theme).toMatchObject({
      name: "Valente de Deus",
      bg: "fumaca-carmim",
      c: ["#060102", "#7a0612", "#d9162a"],
      font: "Playfair Display",
      highlightFont: "Cormorant Garamond",
      ink: "#ffffff",
      hl: "#f5b041",
      anim: "surgir",
      highlightAnim: "surgir",
      up: true,
      shadow: true,
    });
    expect(FONT_CATALOG["Playfair Display"]).toBeDefined();
    expect(FONT_CATALOG["Cormorant Garamond"]).toBeDefined();
  });

  it("configures Chama do Altar with diagonal ember beams and impact typography", () => {
    const theme = THEMES.find(({ id }) => id === "chama-do-altar");
    expect(theme).toMatchObject({
      name: "Chama do Altar",
      bg: "feixes-brasa",
      c: ["#090202", "#8f110b", "#e63b19"],
      font: "Archivo Black",
      highlightFont: "Archivo Black",
      ink: "#ffffff",
      hl: "#ff1e1e",
      anim: "espacar",
      highlightAnim: "quicar",
      up: true,
      shadow: true,
    });
    expect(FONT_CATALOG["Archivo Black"]).toBeDefined();
  });

  it("configures Celebração Urbana with animated ink splashes and brush lettering", () => {
    const theme = THEMES.find(({ id }) => id === "celebracao-urbana");
    expect(theme).toMatchObject({
      name: "Celebração Urbana",
      bg: "respingos-tinta",
      c: ["#ebe9e4", "#dedad2", "#e84a1b"],
      font: "Montserrat",
      highlightFont: "Permanent Marker",
      ink: "#171619",
      hl: "#e84a1b",
      anim: "palavras",
      highlightAnim: "quicar",
      up: true,
      shadow: false,
    });
    expect(FONT_CATALOG.Montserrat).toBeDefined();
    expect(FONT_CATALOG["Permanent Marker"]).toBeDefined();
  });

  it("configures O Rei Chegou with fire silk waves and majestic typography", () => {
    const theme = THEMES.find(({ id }) => id === "o-rei-chegou");
    expect(theme).toMatchObject({
      name: "O Rei Chegou",
      bg: "seda-fogo",
      c: ["#120202", "#b91c1c", "#f97316"],
      font: "Anton",
      highlightFont: "Playfair Display",
      ink: "#ffffff",
      hl: "#fef08a",
      anim: "palavras",
      highlightAnim: "expandir",
      up: true,
      shadow: true,
    });
    expect(FONT_CATALOG.Anton).toBeDefined();
    expect(FONT_CATALOG["Playfair Display"]).toBeDefined();
  });

  it("configures O Noivo Vem with silver smoke and icy highlight typography", () => {
    const theme = THEMES.find(({ id }) => id === "o-noivo-vem");
    expect(theme).toMatchObject({
      name: "O Noivo Vem",
      bg: "fumaca-prata",
      c: ["#07080a", "#2c3038", "#7c8594"],
      font: "Anton",
      highlightFont: "Allura",
      ink: "#ffffff",
      hl: "#cffafe",
      anim: "zoom",
      highlightAnim: "surgir",
      up: true,
      shadow: true,
    });
    expect(FONT_CATALOG.Anton).toBeDefined();
    expect(FONT_CATALOG.Allura).toBeDefined();
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
