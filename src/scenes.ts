import type { HighlightWord, Project, Scene } from "./types";

export function buildScenes(project: Project): Scene[] {
  const lines = project.lyrics
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const scenes: Scene[] = [];

  if (project.title.trim()) {
    scenes.push({ text: project.title.trim(), title: true });
  }

  const linesPerScene = project.settings.twoLines ? 2 : 1;
  for (let index = 0; index < lines.length; index += linesPerScene) {
    scenes.push({
      text: lines.slice(index, index + linesPerScene).join("\n"),
    });
  }

  return scenes;
}

export function buildTimes(
  scenes: Scene[],
  project: Project,
  audioDuration?: number,
): { times: number[]; total: number } {
  const marksAreComplete = project.marks.length === scenes.length;
  const times = marksAreComplete
    ? [...project.marks]
    : scenes.map((_, index) => index * project.settings.secondsPerScene);
  const lastTime = times[times.length - 1] ?? 0;
  const total =
    audioDuration ?? lastTime + project.settings.secondsPerScene;

  return { times, total };
}

export function parseHighlights(text: string): HighlightWord[] {
  return parseHighlightLines(text).flat();
}

export function parseHighlightLines(text: string): HighlightWord[][] {
  let highlighted = false;

  return text.split("\n").map((row) => {
    const words: HighlightWord[] = [];
    for (let word of row.split(/\s+/).filter(Boolean)) {
      let wordIsHighlighted: boolean = highlighted;
      if (word.startsWith("*")) {
        wordIsHighlighted = true;
        word = word.slice(1);
      }

      if (word.endsWith("*")) {
        word = word.slice(0, -1);
        highlighted = false;
      } else {
        highlighted = wordIsHighlighted;
      }

      if (word) {
        words.push({ text: word, highlighted: wordIsHighlighted });
      }
    }

    return words;
  });
}
