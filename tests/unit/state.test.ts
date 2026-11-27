import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyStyleToAllScenes,
  createDefaultProject,
  getEffectiveStyle,
  isSceneStyleCustomized,
  loadLibrary,
  loadProject,
  restoreSceneStyle,
  saveProject,
  saveProjectToLibrary,
  saveUserName,
} from "../../src/state";

const STORAGE_KEY = "lyricmotion:projeto:v1";
const LIBRARY_STORAGE_KEY = "lyricmotion:biblioteca:v1";

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
  vi.restoreAllMocks();
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
    project.settings.highlightAnim = "quicar";
    project.settings.animUnit = "frase";
    project.settings.highlightAnimUnit = "palavra";
    project.settings.position = "topo";
    project.settings.invertColors = true;
    project.settings.animDuration = 2.5;
    project.settings.highlightAnimDuration = 1.7;
    project.sceneStyles[1] = {
      themeId: "brasa-intensa",
      font: "Anton",
      anim: "quicar",
      inkColor: "#fefefe",
    };

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
      animDuration: _animDuration,
      highlightAnimDuration: _highlightAnimDuration,
      animUnit: _animUnit,
      highlightAnimUnit: _highlightAnimUnit,
      invertColors: _invertColors,
      ...legacySettings
    } = project.settings;
    stubStorage({
      [STORAGE_KEY]: JSON.stringify({ ...project, settings: legacySettings }),
    });

    expect(loadProject()).toEqual(project);
  });

  it("uses the main animation for highlights saved before a second animation existed", () => {
    const project = createDefaultProject();
    project.settings.animation = "expandir";
    project.settings.highlightAnim = "expandir";
    const { highlightAnim: _highlightAnim, ...legacySettings } = project.settings;
    stubStorage({
      [STORAGE_KEY]: JSON.stringify({ ...project, settings: legacySettings }),
    });

    expect(loadProject()).toEqual(project);
  });

  it("rejects unknown animation units", () => {
    const project = createDefaultProject();
    const invalidProject = {
      ...project,
      settings: { ...project.settings, highlightAnimUnit: "glyphs" },
    };
    stubStorage({ [STORAGE_KEY]: JSON.stringify(invalidProject) });

    expect(loadProject()).toMatchObject({
      version: 1,
      settings: { themeId: "aurora" },
    });
  });

  it("defaults color inversion to off for projects saved before the option existed", () => {
    const project = createDefaultProject();
    const { invertColors: _invertColors, ...legacySettings } = project.settings;
    stubStorage({
      [STORAGE_KEY]: JSON.stringify({ ...project, settings: legacySettings }),
    });
    expect(loadProject()).toEqual(project);
  });

  it("uses the project style by default and merges only a scene's overrides", () => {
    const project = createDefaultProject();
    project.sceneStyles[1] = {
      themeId: "brasa-intensa",
      anim: "expandir",
      highlightColor: "#ff0000",
    };

    expect(getEffectiveStyle(project, 0)).toMatchObject({
      themeId: project.settings.themeId,
      anim: project.settings.animation,
      font: project.settings.font,
    });
    expect(getEffectiveStyle(project, 1)).toMatchObject({
      themeId: "brasa-intensa",
      anim: "expandir",
      highlightColor: "#ff0000",
      font: project.settings.font,
      highlightAnim: project.settings.highlightAnim,
    });
  });

  it("persists scene-specific style overrides in localStorage", () => {
    const project = createDefaultProject();
    project.sceneStyles[2] = {
      themeId: "brasa-intensa",
      font: "Anton",
      anim: "quicar",
      position: "topo",
    };
    const { data } = stubStorage();

    saveProject(project);

    expect(JSON.parse(data.get(STORAGE_KEY) ?? "{}").sceneStyles).toEqual(
      project.sceneStyles,
    );
    expect(loadProject()).toEqual(project);
  });

  it("applies the selected scene's effective style as the project default", () => {
    const project = createDefaultProject();
    project.settings.resolution = "1280x720";
    project.settings.secondsPerScene = 8;
    project.sceneStyles[1] = {
      themeId: "brasa-intensa",
      font: "Anton",
      anim: "quicar",
      highlightColor: "#ff0000",
    };

    applyStyleToAllScenes(project, 1);

    expect(project.settings).toMatchObject({
      themeId: "brasa-intensa",
      font: "Anton",
      animation: "quicar",
      highlightColor: "#ff0000",
      resolution: "1280x720",
      secondsPerScene: 8,
    });
    expect(project.sceneStyles).toEqual({});
    expect(getEffectiveStyle(project, 0)).toEqual(getEffectiveStyle(project, 1));
  });

  it("restores a customized scene to the project default", () => {
    const project = createDefaultProject();
    project.sceneStyles[1] = { themeId: "brasa-intensa" };

    expect(isSceneStyleCustomized(project, 1)).toBe(true);
    expect(restoreSceneStyle(project, 1)).toBe(true);
    expect(isSceneStyleCustomized(project, 1)).toBe(false);
    expect(getEffectiveStyle(project, 1)).toEqual(getEffectiveStyle(project, 0));
    expect(restoreSceneStyle(project, 1)).toBe(false);
  });

  it("adds an empty scene style map when loading an older project", () => {
    const project = createDefaultProject();
    const {
      sceneStyles: _sceneStyles,
      includeTitleScene: _includeTitleScene,
      ...legacyProject
    } = project;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(legacyProject) });

    expect(loadProject()).toEqual(project);
  });

  it("keeps the title scene enabled when migrating older projects", () => {
    const project = createDefaultProject();
    const { includeTitleScene: _includeTitleScene, ...legacyProject } = project;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(legacyProject) });

    expect(loadProject().includeTitleScene).toBe(true);
  });

  it("rejects font sizes outside their supported ranges", () => {
    const project = createDefaultProject();
    project.settings.fontSize = 201;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });
    expect(loadProject()).toMatchObject({
      version: 1,
      settings: { fontSize: 100, highlightFontSize: 115 },
    });

    project.settings.fontSize = 100;
    project.settings.highlightFontSize = 251;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });
    expect(loadProject()).toMatchObject({
      version: 1,
      settings: { fontSize: 100, highlightFontSize: 115 },
    });
  });

  it("limits migrated animation durations to the saved scene duration", () => {
    const project = createDefaultProject();
    project.settings.secondsPerScene = 2;
    project.settings.animDuration = 0.8;
    project.settings.highlightAnimDuration = 1;
    const legacyProject = {
      ...project,
      settings: {
        ...project.settings,
        animDuration: 5,
        highlightAnimDuration: 6,
      },
    };
    stubStorage({ [STORAGE_KEY]: JSON.stringify(legacyProject) });

    expect(loadProject().settings.animDuration).toBe(2);
    expect(loadProject().settings.highlightAnimDuration).toBe(2);
  });

  it("clamps animation durations to their supported minimum and scene maximum", () => {
    const project = createDefaultProject();
    project.settings.animDuration = 0.1;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });
    expect(loadProject().settings.animDuration).toBe(0.2);

    project.settings.animDuration = 0.8;
    project.settings.highlightAnimDuration = 7;
    stubStorage({ [STORAGE_KEY]: JSON.stringify(project) });
    expect(loadProject().settings.highlightAnimDuration).toBe(
      project.settings.secondsPerScene,
    );
  });

  it("returns the default project when stored data is corrupt", () => {
    stubStorage({ [STORAGE_KEY]: "{not valid json" });

    expect(loadProject()).toMatchObject({
      version: 1,
      title: "",
      settings: { themeId: "aurora" },
    });
  });

  it("returns the default project when stored data has an invalid shape", () => {
    stubStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2 }) });

    expect(loadProject()).toMatchObject({
      version: 1,
      title: "",
      settings: { themeId: "aurora" },
    });
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

    expect(loadProject()).toMatchObject({
      version: 1,
      title: "",
      settings: { themeId: "aurora" },
    });
  });

  it("uses six seconds per scene by default", () => {
    expect(createDefaultProject().settings.secondsPerScene).toBe(6);
  });

  it("uses the requested default scales for both font families", () => {
    const { settings } = createDefaultProject();
    expect(settings.fontSize).toBe(100);
    expect(settings.highlightFontSize).toBe(115);
  });

  it("creates a default library with the sample song when storage is empty", () => {
    const { data } = stubStorage();
    const library = loadLibrary();

    expect(library.userName).toBe("Equipe de Mídia");
    expect(library.projects).toHaveLength(1);
    expect(library.projects[0].lyrics).toContain("Tu és fiel");
    expect(data.get(LIBRARY_STORAGE_KEY)).toBe(JSON.stringify(library));
  });

  it("saves multiple projects and replaces a project with the same id", () => {
    const { data } = stubStorage();
    const library = loadLibrary();
    const first = library.projects[0];
    first.title = "Música um";
    saveProjectToLibrary(first);

    const second = createDefaultProject();
    second.title = "Música dois";
    saveProjectToLibrary(second);

    const replacement = { ...first, title: "Música um atualizada" };
    vi.spyOn(Date, "now").mockReturnValue(first.updatedAt + 100);
    const updatedLibrary = saveProjectToLibrary(replacement);

    expect(updatedLibrary.projects).toHaveLength(2);
    expect(
      updatedLibrary.projects.find(({ id }) => id === first.id)?.title,
    ).toBe("Música um atualizada");
    expect(replacement.updatedAt).toBe(first.updatedAt + 100);
    expect(JSON.parse(data.get(LIBRARY_STORAGE_KEY) ?? "{}")).toEqual(
      updatedLibrary,
    );
    expect(loadLibrary()).toEqual(updatedLibrary);
  });

  it("migrates the existing single project into the library with an id and timestamp", () => {
    const project = createDefaultProject();
    project.title = "Projeto legado";
    const {
      id: _id,
      updatedAt: _updatedAt,
      ...legacyProject
    } = project;
    const { data } = stubStorage({
      [STORAGE_KEY]: JSON.stringify(legacyProject),
    });

    const library = loadLibrary();

    expect(library.projects).toHaveLength(1);
    expect(library.projects[0]).toMatchObject({
      title: "Projeto legado",
      lyrics: project.lyrics,
    });
    expect(library.projects[0].id).toBeTruthy();
    expect(library.projects[0].updatedAt).toEqual(expect.any(Number));
    expect(data.get(LIBRARY_STORAGE_KEY)).toBe(JSON.stringify(library));
  });

  it("saves a user name without dropping saved projects", () => {
    const { data } = stubStorage();
    const library = loadLibrary();
    saveUserName("Ana");

    expect(JSON.parse(data.get(LIBRARY_STORAGE_KEY) ?? "{}")).toEqual({
      userName: "Ana",
      projects: library.projects,
    });
  });
});
