import { THEMES } from "./render/themes";
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
const fonts: FontFamily[] = [
  "Anton",
  "Caveat",
  "Dancing Script",
  "Great Vibes",
  "Montserrat",
  "Oswald",
  "Poppins",
  "Playfair Display",
  "Lora",
  "Bebas Neue",
];
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

export function loadProject(): Project {
  try {
    const stored = globalThis.localStorage.getItem(STORAGE_KEY);
    if (stored === null) return createDefaultProject();

    const project: unknown = JSON.parse(stored);
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
