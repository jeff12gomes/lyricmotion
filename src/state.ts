import { FONT_CATALOG, THEMES } from "./render/themes";
import type {
  Animation,
  AnimationUnit,
  FontFamily,
  LibraryData,
  Project,
  Position,
  Resolution,
  SceneStyle,
  Settings,
} from "./types";

const LIBRARY_STORAGE_KEY = "lyricmotion:biblioteca:v1";
const LEGACY_STORAGE_KEY = "lyricmotion:projeto:v1";
const DEFAULT_USER_NAME = "Equipe de Mídia";
const SAMPLE_LYRICS = [
  "Tu és fiel em cada amanhecer",
  "Teu *amor* me alcança outra vez",
  "",
  "Quando a noite parecer não ter fim",
  "Tua *luz* brilha dentro de mim",
  "",
  "Eu me rendo a Ti, Senhor",
  "Toda a *glória* é Tua",
].join("\n");

const animations: Animation[] = [
  "subir",
  "palavras",
  "zoom",
  "surgir",
  "deslizar-esq",
  "deslizar-dir",
  "expandir",
  "quicar",
  "espacar",
  "cortina",
];
const positions: Position[] = ["topo", "centro", "baixo"];
const animationUnits: AnimationUnit[] = ["letras", "palavra", "frase"];
const fonts: FontFamily[] = Object.values(FONT_CATALOG).map(({ name }) => name);
const resolutions: Resolution[] = [
  "1920x1080",
  "1280x720",
  "2560x720",
  "1080x1920",
];

export function createDefaultProject(): Project {
  return {
    version: 1,
    id: createProjectId(),
    updatedAt: Date.now(),
    title: "",
    includeTitleScene: true,
    lyrics: SAMPLE_LYRICS,
    sceneStyles: {},
    settings: {
      themeId: "aurora",
      font: "Montserrat",
      highlightFont: "Poppins",
      fontSize: 100,
      highlightFontSize: 115,
      animation: "subir",
      highlightAnim: "quicar",
      animUnit: "palavra",
      highlightAnimUnit: "letras",
      animDuration: 0.8,
      highlightAnimDuration: 1.0,
      position: "centro",
      inkColor: "#ffffff",
      highlightColor: "#ffd166",
      invertColors: false,
      uppercase: false,
      shadow: true,
      secondsPerScene: 6,
      resolution: "1920x1080",
    },
  };
}

function createProjectId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `projeto-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createDefaultLibrary(): LibraryData {
  return {
    userName: DEFAULT_USER_NAME,
    projects: [createDefaultProject()],
  };
}

export function getEffectiveStyle(
  project: Project,
  sceneIndex: number,
): SceneStyle {
  const { settings } = project;
  return {
    themeId: settings.themeId,
    font: settings.font,
    highlightFont: settings.highlightFont,
    fontSize: settings.fontSize,
    highlightFontSize: settings.highlightFontSize,
    anim: settings.animation,
    highlightAnim: settings.highlightAnim,
    animUnit: settings.animUnit,
    highlightAnimUnit: settings.highlightAnimUnit,
    animDuration: settings.animDuration,
    highlightAnimDuration: settings.highlightAnimDuration,
    position: settings.position,
    inkColor: settings.inkColor,
    highlightColor: settings.highlightColor,
    invertColors: settings.invertColors,
    uppercase: settings.uppercase,
    shadow: settings.shadow,
    ...project.sceneStyles[sceneIndex],
  };
}

export function isSceneStyleCustomized(
  project: Project,
  sceneIndex: number,
): boolean {
  return Object.keys(project.sceneStyles[sceneIndex] ?? {}).length > 0;
}

export function applyStyleToAllScenes(
  project: Project,
  sceneIndex: number,
): void {
  const { anim, ...style } = getEffectiveStyle(project, sceneIndex);
  Object.assign(project.settings, style, { animation: anim });
  project.sceneStyles = {};
}

export function restoreSceneStyle(
  project: Project,
  sceneIndex: number,
): boolean {
  if (!isSceneStyleCustomized(project, sceneIndex)) return false;
  delete project.sceneStyles[sceneIndex];
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): value is T {
  return typeof value === "string" && options.some((option) => option === value);
}

function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;

  return (
    typeof value.themeId === "string" &&
    THEMES.some((theme) => theme.id === value.themeId) &&
    typeof value.secondsPerScene === "number" &&
    Number.isFinite(value.secondsPerScene) &&
    value.secondsPerScene >= 2 &&
    value.secondsPerScene <= 30 &&
    isOneOf(value.font, fonts) &&
    isOneOf(value.highlightFont, fonts) &&
    typeof value.fontSize === "number" &&
    Number.isFinite(value.fontSize) &&
    value.fontSize >= 50 &&
    value.fontSize <= 200 &&
    typeof value.highlightFontSize === "number" &&
    Number.isFinite(value.highlightFontSize) &&
    value.highlightFontSize >= 50 &&
    value.highlightFontSize <= 250 &&
    isOneOf(value.animation, animations) &&
    isOneOf(value.highlightAnim, animations) &&
    isOneOf(value.animUnit, animationUnits) &&
    isOneOf(value.highlightAnimUnit, animationUnits) &&
    typeof value.animDuration === "number" &&
    Number.isFinite(value.animDuration) &&
    value.animDuration >= 0.2 &&
    value.animDuration <= value.secondsPerScene &&
    typeof value.highlightAnimDuration === "number" &&
    Number.isFinite(value.highlightAnimDuration) &&
    value.highlightAnimDuration >= 0.2 &&
    value.highlightAnimDuration <= value.secondsPerScene &&
    isOneOf(value.position, positions) &&
    typeof value.inkColor === "string" &&
    typeof value.highlightColor === "string" &&
    typeof value.invertColors === "boolean" &&
    typeof value.uppercase === "boolean" &&
    typeof value.shadow === "boolean" &&
    isOneOf(value.resolution, resolutions)
  );
}

function settingsWithSceneStyle(
  settings: Settings,
  style: Partial<SceneStyle>,
): unknown {
  const { anim, ...styleWithoutAnim } = style;
  return {
    ...settings,
    ...styleWithoutAnim,
    ...(anim === undefined ? {} : { animation: anim }),
  };
}

function isSceneStyles(
  value: unknown,
  settings: Settings,
): value is Record<number, Partial<SceneStyle>> {
  if (!isRecord(value)) return false;
  const validKeys = new Set<keyof SceneStyle>([
    "themeId",
    "font",
    "highlightFont",
    "fontSize",
    "highlightFontSize",
    "anim",
    "highlightAnim",
    "animDuration",
    "highlightAnimDuration",
    "animUnit",
    "highlightAnimUnit",
    "position",
    "inkColor",
    "highlightColor",
    "invertColors",
    "uppercase",
    "shadow",
  ]);
  return Object.entries(value).every(([index, style]) => {
    if (!/^(0|[1-9]\d*)$/.test(index) || !isRecord(style)) return false;
    if (!Object.keys(style).every((key) => validKeys.has(key as keyof SceneStyle))) {
      return false;
    }
    return isSettings(settingsWithSceneStyle(settings, style) as unknown);
  });
}

function isProject(value: unknown): value is Project & Record<string, unknown> {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.updatedAt === "number" &&
    Number.isFinite(value.updatedAt) &&
    typeof value.title === "string" &&
    typeof value.includeTitleScene === "boolean" &&
    typeof value.lyrics === "string" &&
    isSettings(value.settings) &&
    isSceneStyles(value.sceneStyles, value.settings)
  );
}

function sanitizeProject(value: Project & Record<string, unknown>): Project {
  const { settings } = value;
  return {
    version: 1,
    id: value.id,
    updatedAt: value.updatedAt,
    title: value.title,
    includeTitleScene: value.includeTitleScene,
    lyrics: value.lyrics,
    sceneStyles: Object.fromEntries(
      Object.entries(value.sceneStyles).map(([index, style]) => [
        Number(index),
        { ...style },
      ]),
    ),
    settings: {
      themeId: settings.themeId,
      font: settings.font,
      highlightFont: settings.highlightFont,
      fontSize: settings.fontSize,
      highlightFontSize: settings.highlightFontSize,
      animation: settings.animation,
      highlightAnim: settings.highlightAnim,
      animUnit: settings.animUnit,
      highlightAnimUnit: settings.highlightAnimUnit,
      animDuration: settings.animDuration,
      highlightAnimDuration: settings.highlightAnimDuration,
      position: settings.position,
      inkColor: settings.inkColor,
      highlightColor: settings.highlightColor,
      invertColors: settings.invertColors,
      uppercase: settings.uppercase,
      shadow: settings.shadow,
      secondsPerScene: settings.secondsPerScene,
      resolution: settings.resolution,
    },
  };
}

function migrateProject(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.settings)) return value;
  const settings = value.settings;
  const theme = THEMES.find(({ id }) => id === settings.themeId);
  const sceneStyles = isRecord(value.sceneStyles) ? value.sceneStyles : {};
  const additions: Partial<
    Pick<
      Settings,
      | "highlightFont"
      | "fontSize"
      | "highlightFontSize"
      | "highlightAnim"
      | "animUnit"
      | "highlightAnimUnit"
      | "animDuration"
      | "highlightAnimDuration"
      | "invertColors"
    >
  > = {};
  if (!("highlightFont" in settings) && theme) {
    additions.highlightFont = theme.highlightFont;
  }
  if (!("fontSize" in settings)) additions.fontSize = 100;
  if (!("highlightFontSize" in settings)) additions.highlightFontSize = 115;
  if (!("highlightAnim" in settings) && isOneOf(settings.animation, animations)) {
    additions.highlightAnim = settings.animation;
  }
  if (!("animUnit" in settings)) additions.animUnit = "palavra";
  if (!("highlightAnimUnit" in settings)) {
    additions.highlightAnimUnit = "letras";
  }
  const maxDuration =
    typeof settings.secondsPerScene === "number" &&
    Number.isFinite(settings.secondsPerScene)
      ? settings.secondsPerScene
      : Number.POSITIVE_INFINITY;
  if (!("animDuration" in settings)) additions.animDuration = 0.8;
  else if (typeof settings.animDuration === "number") {
    additions.animDuration = Math.min(
      maxDuration,
      Math.max(0.2, settings.animDuration),
    );
  }
  if (!("highlightAnimDuration" in settings)) {
    additions.highlightAnimDuration = 1.0;
  } else if (typeof settings.highlightAnimDuration === "number") {
    additions.highlightAnimDuration = Math.min(
      maxDuration,
      Math.max(0.2, settings.highlightAnimDuration),
    );
  }
  if (!("invertColors" in settings)) additions.invertColors = false;
  const includeTitleScene =
    typeof value.includeTitleScene === "boolean"
      ? value.includeTitleScene
      : true;
  const id =
    typeof value.id === "string" && value.id.length > 0
      ? value.id
      : createProjectId();
  const updatedAt =
    typeof value.updatedAt === "number" && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : Date.now();
  if (
    Object.keys(additions).length === 0 &&
    isRecord(value.sceneStyles) &&
    typeof value.includeTitleScene === "boolean" &&
    typeof value.id === "string" &&
    typeof value.updatedAt === "number" &&
    Number.isFinite(value.updatedAt)
  ) {
    return value;
  }

  return {
    ...value,
    id,
    updatedAt,
    includeTitleScene,
    sceneStyles,
    settings: { ...settings, ...additions },
  };
}

export function loadProject(): Project {
  try {
    const stored = globalThis.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (stored === null) return createDefaultProject();

    const project = migrateProject(JSON.parse(stored));
    return isProject(project)
      ? sanitizeProject(project)
      : createDefaultProject();
  } catch {
    return createDefaultProject();
  }
}

export function saveProject(project: Project): void {
  try {
    const projectToSave = isProject(project) ? project : createDefaultProject();
    globalThis.localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify(projectToSave),
    );
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function loadLibrary(): LibraryData {
  try {
    const storedLibrary =
      globalThis.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (storedLibrary !== null) {
      const parsed: unknown = JSON.parse(storedLibrary);
      if (isRecord(parsed) && typeof parsed.userName === "string") {
        const projects = Array.isArray(parsed.projects)
          ? parsed.projects
              .map(migrateProject)
              .filter(isProject)
              .map(sanitizeProject)
          : [];
        if (projects.length > 0) {
          return { userName: parsed.userName, projects };
        }

        const library = createDefaultLibrary();
        globalThis.localStorage.setItem(
          LIBRARY_STORAGE_KEY,
          JSON.stringify(library),
        );
        return library;
      }
    }

    const legacyProjectData =
      globalThis.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyProjectData !== null) {
      const migrated = migrateProject(JSON.parse(legacyProjectData));
      if (isProject(migrated)) {
        const library = {
          userName: DEFAULT_USER_NAME,
          projects: [sanitizeProject(migrated)],
        };
        globalThis.localStorage.setItem(
          LIBRARY_STORAGE_KEY,
          JSON.stringify(library),
        );
        return library;
      }
    }

    const library = createDefaultLibrary();
    globalThis.localStorage.setItem(
      LIBRARY_STORAGE_KEY,
      JSON.stringify(library),
    );
    return library;
  } catch {
    return createDefaultLibrary();
  }
}

export function saveProjectToLibrary(project: Project): LibraryData {
  const library = loadLibrary();
  const existingIndex = library.projects.findIndex(
    ({ id }) => id === project.id,
  );
  const existingProject =
    existingIndex < 0 ? undefined : library.projects[existingIndex];
  project.updatedAt = Math.max(
    Date.now(),
    (existingProject?.updatedAt ?? project.updatedAt) + 1,
  );
  if (existingIndex < 0) {
    library.projects.push(project);
  } else {
    library.projects[existingIndex] = project;
  }
  globalThis.localStorage.setItem(
    LIBRARY_STORAGE_KEY,
    JSON.stringify(library),
  );
  return library;
}

export function saveUserName(name: string): void {
  const library = loadLibrary();
  library.userName = name;
  globalThis.localStorage.setItem(
    LIBRARY_STORAGE_KEY,
    JSON.stringify(library),
  );
}
