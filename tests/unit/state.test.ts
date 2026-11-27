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
    project.settings.highlightFont = "Great Vibes";
    project.settings.fontSize = 75;
    project.settings.highlightFontSize = 160;

    saveProject(project);

    expect(data.get(STORAGE_KEY)).toBe(JSON.stringify(project));
    expect(loadProject()).toEqual(project);
  });

  it("adds the theme highlight font when loading a project saved before the setting existed", () => {
    const project = createDefaultProject();
    project.settings.themeId = "sublime";
    project.settings.font = "Anton";
    project.settings.highlightFont = "Dancing Script";
    const { highlightFont: _highlightFont, ...legacySettings } = project.settings;
    const legacyProject = { ...project, settings: legacySettings };
    stubStorage({ [STORAGE_KEY]: JSON.stringify(legacyProject) });

    expect(loadProject()).toEqual(project);
  });

  it("adds default font sizes to projects saved before size controls existed", () => {
    const project = createDefaultProject();
    const {
      fontSize: _fontSize,
      highlightFontSize: _highlightFontSize,
      ...legacySettings
    } = project.settings;
    stubStorage({
      [STORAGE_KEY]: JSON.stringify({ ...project, settings: legacySettings }),
    });

    expect(loadProject()).toEqual(project);
  });

  it("rejects font sizes outside their supported ranges", () => {
    const project = createDefaultProject();
    project.settings.fontSize = 201;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });
    expect(loadProject()).toEqual(createDefaultProject());

    project.settings.fontSize = 100;
    project.settings.highlightFontSize = 251;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });
    expect(loadProject()).toEqual(createDefaultProject());
  });

  it("returns the default project when stored data is corrupt", () => {
    stubStorage({ [STORAGE_KEY]: "{not valid json" });

    expect(loadProject()).toEqual(createDefaultProject());
  });

  it("returns the default project when stored data has an invalid shape", () => {
    stubStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2 }) });

    expect(loadProject()).toEqual(createDefaultProject());
  });

  it("loads projects using fonts introduced by the new themes", () => {
    const project = createDefaultProject();
    project.settings.themeId = "sublime";
    project.settings.font = "Anton";
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });

    expect(loadProject()).toEqual(project);
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

  it("uses the requested default scales for both font families", () => {
    const { settings } = createDefaultProject();
    expect(settings.fontSize).toBe(100);
    expect(settings.highlightFontSize).toBe(115);
  });
});
