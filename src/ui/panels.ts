import { saveProject } from "../state";
import { THEMES, FONTS } from "../render/themes";
import type {
  Animation,
  FontFamily,
  Position,
  Project,
  Resolution,
  Scene,
  Theme,
} from "../types";

const LOGO_STORAGE_KEY = "lyricmotion:logo:v1";
const FONT_OPTIONS: FontFamily[] = [
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Lora",
  "Bebas Neue",
  "Anton",
  "Oswald",
  "Dancing Script",
  "Great Vibes",
  "Caveat",
];
const ANIMATION_OPTIONS: Animation[] = ["subir", "palavras", "zoom"];
const POSITION_OPTIONS: Position[] = ["centro", "baixo"];
const RESOLUTION_OPTIONS: Resolution[] = [
  "1920x1080",
  "1280x720",
  "2560x720",
  "1080x1920",
];

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  }
  return element;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("O arquivo de imagem não pôde ser lido."));
      }
    });
    reader.addEventListener("error", () => {
      reject(reader.error ?? new Error("O arquivo de imagem não pôde ser lido."));
    });
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener(
      "error",
      () => reject(new Error("A imagem não pôde ser carregada.")),
      { once: true },
    );
    image.src = source;
  });
}

export function mountPanels(
  project: Project,
  onProjectChange: () => void,
  onLogoChange: (logo: HTMLImageElement | null) => void,
): void {
  const titleInput = getElement<HTMLInputElement>("#title");
  const lyricsInput = getElement<HTMLTextAreaElement>("#lyrics");
  const themeGrid = getElement<HTMLDivElement>("#themes");
  const fontSelect = getElement<HTMLSelectElement>("#font");
  const highlightFontSelect =
    getElement<HTMLSelectElement>("#highlightFont");
  const animationSelect = getElement<HTMLSelectElement>("#anim");
  const positionSelect = getElement<HTMLSelectElement>("#pos");
  const inkInput = getElement<HTMLInputElement>("#ink");
  const highlightInput = getElement<HTMLInputElement>("#hl");
  const uppercaseInput = getElement<HTMLInputElement>("#up");
  const shadowInput = getElement<HTMLInputElement>("#shadow");
  const secondsInput = getElement<HTMLInputElement>("#dur");
  const resolutionSelect = getElement<HTMLSelectElement>("#res");
  const logoInput = getElement<HTMLInputElement>("#logo");
  const removeLogoButton = getElement<HTMLButtonElement>("#logoOff");
  const logoStatus = getElement<HTMLElement>("#logoStatus");
  let logoRequestId = 0;

  const commit = () => {
    saveProject(project);
    onProjectChange();
  };

  for (const font of FONT_OPTIONS) {
    const option = document.createElement("option");
    option.value = font;
    option.textContent = font;
    fontSelect.append(option);

    const highlightOption = document.createElement("option");
    highlightOption.value = font;
    highlightOption.textContent = font;
    highlightFontSelect.append(highlightOption);
  }

  function updateThemeButtons(): void {
    for (const button of themeGrid.querySelectorAll<HTMLButtonElement>(".theme")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeId === project.settings.themeId),
      );
    }
  }

  function syncSettings(): void {
    fontSelect.value = project.settings.font;
    highlightFontSelect.value = project.settings.highlightFont;
    animationSelect.value = project.settings.animation;
    positionSelect.value = project.settings.position;
    inkInput.value = project.settings.inkColor;
    highlightInput.value = project.settings.highlightColor;
    uppercaseInput.checked = project.settings.uppercase;
    shadowInput.checked = project.settings.shadow;
    secondsInput.value = String(project.settings.secondsPerScene);
    resolutionSelect.value = project.settings.resolution;
    updateThemeButtons();
  }

  for (const theme of THEMES) {
    const button = document.createElement("button");
    const sample = document.createElement("span");
    const sampleStart = document.createElement("span");
    const sampleHighlight = document.createElement("span");
    const name = document.createElement("span");
    button.type = "button";
    button.className = "theme";
    button.dataset.themeId = theme.id;
    button.dataset.background = theme.bg;
    button.setAttribute("aria-label", `Prévia do tema ${theme.name}`);
    button.setAttribute("aria-pressed", "false");
    button.style.background = `linear-gradient(135deg, ${theme.c[0]}, ${theme.c[1]} 60%, ${theme.c[2]})`;
    button.style.color = theme.ink;
    button.style.setProperty("--theme-a", theme.c[0]);
    button.style.setProperty("--theme-b", theme.c[1]);
    button.style.setProperty("--theme-c", theme.c[2]);
    sample.className = "theme-sample";
    sampleStart.textContent = "TÃO ";
    sampleStart.style.fontFamily = `"${theme.font}", sans-serif`;
    sampleStart.style.fontWeight = String(FONTS[theme.font]);
    sampleHighlight.textContent = theme.name;
    sampleHighlight.style.fontFamily = `"${theme.highlightFont}", cursive`;
    sampleHighlight.style.fontWeight = String(FONTS[theme.highlightFont]);
    sampleHighlight.style.color = theme.hl;
    name.className = "theme-name";
    name.textContent = theme.name;
    sample.append(sampleStart, sampleHighlight);
    button.append(sample, name);
    themeGrid.append(button);
  }

  titleInput.value = project.title;
  lyricsInput.value = project.lyrics;
  syncSettings();

  titleInput.addEventListener("input", () => {
    project.title = titleInput.value;
    commit();
  });
  lyricsInput.addEventListener("input", () => {
    project.lyrics = lyricsInput.value;
    commit();
  });
  themeGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(".theme");
    const themeId = button?.dataset.themeId;
    const theme = THEMES.find((candidate) => candidate.id === themeId);
    if (!theme) return;

    applyTheme(project, theme);
    syncSettings();
    commit();
    loadSelectedFont(project, onProjectChange);
  });

  fontSelect.addEventListener("change", () => {
    const font = FONT_OPTIONS.find((candidate) => candidate === fontSelect.value);
    if (!font) return;
    project.settings.font = font;
    commit();
    loadSelectedFont(project, onProjectChange);
  });
  highlightFontSelect.addEventListener("change", () => {
    const font = FONT_OPTIONS.find(
      (candidate) => candidate === highlightFontSelect.value,
    );
    if (!font) return;
    project.settings.highlightFont = font;
    commit();
    loadSelectedFont(project, onProjectChange);
  });
  animationSelect.addEventListener("change", () => {
    const animation = ANIMATION_OPTIONS.find(
      (candidate) => candidate === animationSelect.value,
    );
    if (!animation) return;
    project.settings.animation = animation;
    commit();
  });
  positionSelect.addEventListener("change", () => {
    const position = POSITION_OPTIONS.find(
      (candidate) => candidate === positionSelect.value,
    );
    if (!position) return;
    project.settings.position = position;
    commit();
  });
  inkInput.addEventListener("input", () => {
    project.settings.inkColor = inkInput.value;
    commit();
  });
  highlightInput.addEventListener("input", () => {
    project.settings.highlightColor = highlightInput.value;
    commit();
  });
  uppercaseInput.addEventListener("change", () => {
    project.settings.uppercase = uppercaseInput.checked;
    commit();
  });
  shadowInput.addEventListener("change", () => {
    project.settings.shadow = shadowInput.checked;
    commit();
  });
  const updateSeconds = (normalize: boolean) => {
    const value = secondsInput.valueAsNumber;
    if (!Number.isFinite(value)) {
      if (normalize) {
        secondsInput.value = String(project.settings.secondsPerScene);
      }
      return;
    }
    let seconds = Math.min(30, Math.max(2, value));
    if (normalize) {
      seconds = Math.round(seconds * 2) / 2;
      secondsInput.value = String(seconds);
    }
    project.settings.secondsPerScene = seconds;
    commit();
  };
  secondsInput.addEventListener("input", () => updateSeconds(false));
  secondsInput.addEventListener("change", () => updateSeconds(true));
  resolutionSelect.addEventListener("change", () => {
    const resolution = RESOLUTION_OPTIONS.find(
      (candidate) => candidate === resolutionSelect.value,
    );
    if (!resolution) return;
    project.settings.resolution = resolution;
    commit();
  });

  logoInput.addEventListener("change", () => {
    const file = logoInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      logoStatus.textContent = "Selecione um arquivo de imagem.";
      return;
    }
    const requestId = ++logoRequestId;
    logoInput.value = "";
    void uploadLogo(file, requestId);
  });

  removeLogoButton.addEventListener("click", () => {
    logoRequestId += 1;
    onLogoChange(null);
    logoInput.value = "";
    removeLogoButton.hidden = true;
    logoStatus.textContent = "";
    saveProject(project);
    try {
      globalThis.localStorage.removeItem(LOGO_STORAGE_KEY);
    } catch {
      logoStatus.textContent = "Não foi possível remover o logo salvo neste navegador.";
    }
  });

  async function uploadLogo(file: File, requestId: number): Promise<void> {
    try {
      const dataUrl = await fileToDataUrl(file);
      const image = await loadImage(dataUrl);
      if (requestId !== logoRequestId) return;
      onLogoChange(image);
      removeLogoButton.hidden = false;
      saveProject(project);

      try {
        globalThis.localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
        logoStatus.textContent = "Logo carregado e salvo neste navegador.";
      } catch {
        logoStatus.textContent =
          "Logo carregado, mas não foi possível salvá-lo neste navegador.";
      }
    } catch {
      if (requestId === logoRequestId) {
        logoStatus.textContent = "Não foi possível carregar esta imagem.";
      }
    }
  }

  const restoreRequestId = logoRequestId;
  try {
    const storedLogo = globalThis.localStorage.getItem(LOGO_STORAGE_KEY);
    if (storedLogo) {
      void loadImage(storedLogo).then(
        (image) => {
          if (restoreRequestId !== logoRequestId) return;
          onLogoChange(image);
          removeLogoButton.hidden = false;
          logoStatus.textContent = "Logo salvo neste navegador.";
        },
        () => {
          if (restoreRequestId === logoRequestId) {
            logoStatus.textContent = "Não foi possível restaurar o logo salvo.";
          }
        },
      );
    }
  } catch {
    logoStatus.textContent = "Não foi possível restaurar o logo salvo.";
  }
}

export interface GeneratedVideo {
  sceneIndex: number;
  filename: string;
  sceneText: string;
  blob: Blob;
}

export function renderSceneVideos(
  container: HTMLElement,
  scenes: Scene[],
  selectedIndex: number,
  videos: GeneratedVideo[],
  onSelect: (index: number) => void,
  onDownload: (index: number) => void,
): void {
  container.replaceChildren();
  for (const [index, scene] of scenes.entries()) {
    const item = document.createElement("li");
    const selectButton = document.createElement("button");
    const snippet = scene.text.split(/\s+/).slice(0, 8).join(" ");
    const downloadButton = document.createElement("button");
    const video = videos.find((candidate) => candidate.sceneIndex === index);

    selectButton.type = "button";
    selectButton.className = "scene-select";
    selectButton.setAttribute("aria-pressed", String(index === selectedIndex));
    selectButton.setAttribute("aria-label", `Selecionar cena ${index + 1}: ${snippet}`);
    const description = document.createElement("span");
    description.textContent = `${String(index + 1).padStart(2, "0")} · ${snippet}`;
    selectButton.append(description);
    selectButton.addEventListener("click", () => onSelect(index));

    downloadButton.type = "button";
    downloadButton.className = "scene-download";
    downloadButton.textContent = "Baixar";
    downloadButton.setAttribute(
      "aria-label",
      video ? `Baixar ${video.filename}` : `Gerar vídeo da cena ${index + 1}`,
    );
    downloadButton.addEventListener("click", () => onDownload(index));
    item.append(selectButton, downloadButton);
    container.append(item);
  }
}

function applyTheme(project: Project, theme: Theme): void {
  Object.assign(project.settings, {
    themeId: theme.id,
    font: theme.font,
    highlightFont: theme.highlightFont,
    animation: theme.anim,
    inkColor: theme.ink,
    highlightColor: theme.hl,
    uppercase: theme.up,
    shadow: theme.shadow,
  });
}

function loadSelectedFont(
  project: Project,
  onProjectChange: () => void,
): void {
  if (!document.fonts) return;
  const fonts = [project.settings.font, project.settings.highlightFont];
  void Promise.all(
    fonts.map((font) => document.fonts.load(`${FONTS[font]} 40px "${font}"`)),
  )
    .then(onProjectChange, onProjectChange);
}
