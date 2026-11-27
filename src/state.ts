import { FONT_CATALOG, THEMES } from "./render/themes";
import type {
  Animation,
  FontFamily,
  Project,
  Position,
  Resolution,
  Settings,
} from "./types";

const STORAGE_KEY = "lyricmotion:projeto:v1";
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

const animations: Animation[] = ["subir", "palavras", "zoom"];
const positions: Position[] = ["centro", "baixo"];
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
    title: "",
    lyrics: SAMPLE_LYRICS,
    settings: {
      themeId: "aurora",
      font: "Montserrat",
      highlightFont: "Poppins",
      fontSize: 100,
      highlightFontSize: 115,
      animation: "subir",
      position: "centro",
      inkColor: "#ffffff",
      highlightColor: "#ffd166",
      uppercase: false,
      shadow: true,
      secondsPerScene: 6,
      resolution: "1920x1080",
    },
  };
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
    isOneOf(value.position, positions) &&
    typeof value.inkColor === "string" &&
    typeof value.highlightColor === "string" &&
    typeof value.uppercase === "boolean" &&
    typeof value.shadow === "boolean" &&
    typeof value.secondsPerScene === "number" &&
    Number.isFinite(value.secondsPerScene) &&
    value.secondsPerScene >= 2 &&
    value.secondsPerScene <= 30 &&
    isOneOf(value.resolution, resolutions)
  );
}

function isProject(value: unknown): value is Project & Record<string, unknown> {
  return (
    isRecord(value) &&
    value.version === 1 &&
    typeof value.title === "string" &&
    typeof value.lyrics === "string" &&
    isSettings(value.settings)
  );
}

function sanitizeProject(value: Project & Record<string, unknown>): Project {
  const { settings } = value;
  return {
    version: 1,
    title: value.title,
    lyrics: value.lyrics,
    settings: {
      themeId: settings.themeId,
      font: settings.font,
      highlightFont: settings.highlightFont,
      fontSize: settings.fontSize,
      highlightFontSize: settings.highlightFontSize,
      animation: settings.animation,
      position: settings.position,
      inkColor: settings.inkColor,
      highlightColor: settings.highlightColor,
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
  const additions: Partial<
    Pick<Settings, "highlightFont" | "fontSize" | "highlightFontSize">
  > = {};
  if (!("highlightFont" in settings) && theme) {
    additions.highlightFont = theme.highlightFont;
  }
  if (!("fontSize" in settings)) additions.fontSize = 100;
  if (!("highlightFontSize" in settings)) additions.highlightFontSize = 115;
  if (Object.keys(additions).length === 0) return value;

  return {
    ...value,
    settings: { ...settings, ...additions },
  };
}

export function loadProject(): Project {
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
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
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(projectToSave));
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}
