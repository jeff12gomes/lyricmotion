import type { HighlightWord, Project, Scene } from "./types";

export function buildScenes(project: Project): Scene[] {
  const scenes: Scene[] = [];

  if (project.includeTitleScene && project.title.trim()) {
    scenes.push({ text: project.title.trim(), title: true });
  }

  let block: string[] = [];
  const addBlock = () => {
    if (block.length > 0) scenes.push({ text: block.join("\n") });
    block = [];
  };

  for (const line of project.lyrics.split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (trimmedLine === "") {
      addBlock();
    } else {
      block.push(trimmedLine);
    }
  }
  addBlock();

  return scenes;
}

export function buildTimes(
  scenes: Scene[],
  project: Project,
): { times: number[]; total: number } {
  const secondsPerScene = project.settings.secondsPerScene;
  return {
    times: scenes.map((_, index) => index * secondsPerScene),
    total: scenes.length * secondsPerScene,
  };
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
