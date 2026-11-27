import { describe, expect, it } from "vitest";
import { THEMES } from "../../src/render/themes";

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
});
