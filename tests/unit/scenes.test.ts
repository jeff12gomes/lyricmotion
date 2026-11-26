import { describe, expect, it } from "vitest";
import { buildScenes, buildTimes, parseHighlights } from "../../src/scenes";
import { createDefaultProject } from "../../src/state";

describe("buildScenes", () => {
  it("creates one scene for each block separated by a blank line", () => {
    const project = createDefaultProject();
    project.lyrics =
      "linha 1\nlinha 2\n\nlinha 3\n\nlinha 4\nlinha 5";

    expect(buildScenes(project)).toEqual([
      { text: "linha 1\nlinha 2" },
      { text: "linha 3" },
      { text: "linha 4\nlinha 5" },
    ]);
  });

  it("ignores repeated blank lines and trims block lines", () => {
    const project = createDefaultProject();
    project.lyrics = "  Primeira  \n\n   \n Segunda ";

    expect(buildScenes(project)).toEqual([
      { text: "Primeira" },
      { text: "Segunda" },
    ]);
  });

  it("preserves line breaks inside a block", () => {
    const project = createDefaultProject();
    project.lyrics = "Um\nDois\nTrês";

    expect(buildScenes(project)).toEqual([
      { text: "Um\nDois\nTrês" },
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
  it("assigns each scene the configured fixed duration", () => {
    const project = createDefaultProject();
    project.settings.secondsPerScene = 3;

    expect(
      buildTimes([{ text: "Um" }, { text: "Dois" }, { text: "Três" }], project),
    ).toEqual({
      times: [0, 3, 6],
      total: 9,
    });
  });

  it("has no total duration when the project has no scenes", () => {
    expect(buildTimes([], createDefaultProject())).toEqual({
      times: [],
      total: 0,
    });
  });
});
