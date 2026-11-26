import { describe, expect, it } from "vitest";
import { buildScenes, buildTimes, parseHighlights } from "../../src/scenes";
import { createDefaultProject } from "../../src/state";

describe("buildScenes", () => {
  it("creates one scene per line", () => {
    const project = createDefaultProject();
    project.lyrics = Array.from({ length: 10 }, (_, index) => `Linha ${index + 1}`).join(
      "\n",
    );

    expect(buildScenes(project)).toHaveLength(10);
  });

  it("ignores blank lines and trims non-empty lines", () => {
    const project = createDefaultProject();
    project.lyrics = "  Primeira  \n\n   \n Segunda ";

    expect(buildScenes(project)).toEqual([
      { text: "Primeira" },
      { text: "Segunda" },
    ]);
  });

  it("groups two lines into each scene", () => {
    const project = createDefaultProject();
    project.lyrics = "Um\nDois\nTrês";
    project.settings.twoLines = true;

    expect(buildScenes(project)).toEqual([
      { text: "Um\nDois" },
      { text: "Três" },
    ]);
  });

  it("adds a title scene before the lyrics when a title is provided", () => {
    const project = createDefaultProject();
    project.title = "  Minha canção  ";
    project.lyrics = "Primeira linha";

    expect(buildScenes(project)).toEqual([
      { text: "Minha canção", title: true },
      { text: "Primeira linha" },
    ]);
  });
});

describe("parseHighlights", () => {
  it("marks the words between asterisks as highlighted", () => {
    expect(parseHighlights("Teu *grande amor* me alcança")).toEqual([
      { text: "Teu", highlighted: false },
      { text: "grande", highlighted: true },
      { text: "amor", highlighted: true },
      { text: "me", highlighted: false },
      { text: "alcança", highlighted: false },
    ]);
  });
});

describe("buildTimes", () => {
  it("uses the interval when there are no complete synchronization marks", () => {
    const project = createDefaultProject();
    project.settings.secondsPerScene = 3;
    project.marks = [2];

    expect(buildTimes([{ text: "Um" }, { text: "Dois" }, { text: "Três" }], project)).toEqual({
      times: [0, 3, 6],
      total: 9,
    });
  });

  it("uses complete synchronization marks and audio duration when provided", () => {
    const project = createDefaultProject();
    project.settings.secondsPerScene = 4;
    project.marks = [1.5, 6];

    expect(buildTimes([{ text: "Um" }, { text: "Dois" }], project)).toEqual({
      times: [1.5, 6],
      total: 10,
    });
    expect(buildTimes([{ text: "Um" }, { text: "Dois" }], project, 12)).toEqual({
      times: [1.5, 6],
      total: 12,
    });
  });
});
