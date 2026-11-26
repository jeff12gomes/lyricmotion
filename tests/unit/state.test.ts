import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDefaultProject,
  loadProject,
  saveProject,
} from "../../src/state";

const STORAGE_KEY = "lyricmotion:projeto:v1";

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
  };
  vi.stubGlobal("localStorage", storage);
  return { data, storage };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("project state", () => {
  it("saves and loads a project from localStorage", () => {
    const { data } = stubStorage();
    const project = createDefaultProject();
    project.title = "Canção de teste";
    project.lyrics = "linha 1\nlinha 2\n\nlinha 3\n\nlinha 4\nlinha 5";

    saveProject(project);

    expect(data.get(STORAGE_KEY)).toBe(JSON.stringify(project));
    expect(loadProject()).toEqual(project);
  });

  it("returns the default project when stored data is corrupt", () => {
    stubStorage({ [STORAGE_KEY]: "{not valid json" });

    expect(loadProject()).toEqual(createDefaultProject());
  });

  it("returns the default project when stored data has an invalid shape", () => {
    stubStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2 }) });

    expect(loadProject()).toEqual(createDefaultProject());
  });

  it("returns the default project when a setting references an unknown theme", () => {
    const invalidProject = createDefaultProject();
    invalidProject.settings.themeId = "unknown";
    stubStorage({ [STORAGE_KEY]: JSON.stringify(invalidProject) });

    expect(loadProject()).toEqual(createDefaultProject());
  });

  it("uses six seconds per scene by default", () => {
    expect(createDefaultProject().settings.secondsPerScene).toBe(6);
  });
});
