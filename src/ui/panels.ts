import {
  applyStyleToAllScenes,
  getEffectiveStyle,
  isSceneStyleCustomized,
  restoreSceneStyle,
  saveProject,
} from "../state";
import { FONT_CATALOG, THEMES } from "../render/themes";
import { buildScenes } from "../scenes";
import type {
  Animation,
  AnimationUnit,
  FontFamily,
  Position,
  Project,
  Resolution,
  SceneStyle,
  Scene,
  Theme,
} from "../types";

const LOGO_STORAGE_KEY = "lyricmotion:logo:v1";
const FONT_CATEGORIES = [
  "Cheias",
  "Manuscritas",
  "Underground",
  "Finas",
] as const;
const ANIMATION_OPTIONS: Array<{ value: Animation; label: string }> = [
  { value: "subir", label: "Subir suave" },
  { value: "palavras", label: "Palavra por palavra" },
  { value: "zoom", label: "Aproximar" },
  { value: "surgir", label: "Surgimento suave" },
  { value: "deslizar-esq", label: "Deslizar da esquerda" },
  { value: "deslizar-dir", label: "Deslizar da direita" },
  { value: "expandir", label: "Expandir" },
  { value: "quicar", label: "Quicar" },
  { value: "espacar", label: "Espaçar letras" },
  { value: "cortina", label: "Cortina de baixo para cima" },
];
const ANIMATION_UNIT_OPTIONS: Array<{ value: AnimationUnit; label: string }> = [
  { value: "letras", label: "Letras" },
  { value: "palavra", label: "Palavra" },
  { value: "frase", label: "Frase" },
];
const POSITION_OPTIONS: Position[] = ["topo", "centro", "baixo"];
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

function mountFontPicker(
  root: HTMLElement,
  setting: keyof Pick<SceneStyle, "font" | "highlightFont">,
  getSelectedFont: () => FontFamily,
  onSelect: (font: FontFamily) => void,
): { sync: () => void } {
  const trigger = root.querySelector<HTMLButtonElement>(".font-picker-trigger");
  const listbox = root.querySelector<HTMLDivElement>('[role="listbox"]');
  if (!trigger || !listbox) {
    throw new Error("O seletor visual de fonte está incompleto.");
  }
  const pickerTrigger = trigger;
  const pickerListbox = listbox;

  const labels = {
    font: "Fonte principal",
    highlightFont: "Fonte do destaque",
  };
  const options = Object.values(FONT_CATALOG);

  for (const category of FONT_CATEGORIES) {
    const group = document.createElement("div");
    group.className = "font-picker-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-label", category);

    const heading = document.createElement("span");
    heading.className = "font-picker-category";
    heading.textContent = category;
    group.append(heading);

    for (const font of options.filter((option) => option.category === category)) {
      const option = document.createElement("button");
      const sample = document.createElement("span");
      const name = document.createElement("span");
      option.type = "button";
      option.className = "font-picker-option";
      option.dataset.fontName = font.name;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");
      option.style.fontFamily = `"${font.name}", sans-serif`;
      option.style.fontWeight = String(font.weight);
      sample.className = "font-picker-sample";
      sample.textContent = "TÃO Coração Glória! Bênção";
      name.className = "font-picker-name";
      name.textContent = font.name;
      option.append(sample, name);
      group.append(option);
    }

    pickerListbox.append(group);
  }

  function sync(): void {
    const selected = getSelectedFont();
    const font = FONT_CATALOG[selected];
    const sample = document.createElement("span");
    const arrow = document.createElement("span");
    sample.className = "font-picker-current";
    sample.textContent = font.name;
    sample.style.fontFamily = `"${font.name}", sans-serif`;
    sample.style.fontWeight = String(font.weight);
    arrow.className = "font-picker-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "▾";
    pickerTrigger.replaceChildren(sample, arrow);
    pickerTrigger.setAttribute("aria-label", `${labels[setting]}: ${font.name}`);

    for (const option of pickerListbox.querySelectorAll<HTMLButtonElement>(
      ".font-picker-option",
    )) {
      option.setAttribute(
        "aria-selected",
        String(option.dataset.fontName === selected),
      );
    }
  }

  function setOpen(open: boolean, focusSelected = false): void {
    pickerListbox.hidden = !open;
    pickerTrigger.setAttribute("aria-expanded", String(open));
    if (open && focusSelected) {
      pickerListbox
        .querySelector<HTMLButtonElement>('[aria-selected="true"]')
        ?.focus();
    }
  }

  pickerTrigger.addEventListener("click", () => {
    const open = pickerListbox.hidden === true;
    setOpen(open, open);
  });
  pickerTrigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true, true);
    }
  });
  pickerListbox.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const option = event.target.closest<HTMLButtonElement>(
      ".font-picker-option",
    );
    const fontName = option?.dataset.fontName;
    const font = options.find((candidate) => candidate.name === fontName);
    if (!font) return;

    setOpen(false);
    onSelect(font.name);
    pickerTrigger.focus();
  });
  pickerListbox.addEventListener("keydown", (event) => {
    if (!(event.target instanceof Element)) return;
    const option = event.target.closest<HTMLButtonElement>(
      ".font-picker-option",
    );
    if (!option) return;
    const items = Array.from(
      pickerListbox.querySelectorAll<HTMLButtonElement>(".font-picker-option"),
    );
    const currentIndex = items.indexOf(option);
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") nextIndex = Math.min(items.length - 1, currentIndex + 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    else return;

    event.preventDefault();
    items[nextIndex]?.focus();
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !root.contains(event.target)) {
      setOpen(false);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || pickerListbox.hidden) return;
    event.preventDefault();
    setOpen(false);
    pickerTrigger.focus();
  });

  sync();
  return { sync };
}

export function mountPanels(
  project: Project,
  onProjectChange: () => void,
  onLogoChange: (logo: HTMLImageElement | null) => void,
  getSelectedSceneIndex: () => number,
  onEdit: () => void,
): { syncSceneStyle: () => void } {
  const titleInput = getElement<HTMLInputElement>("#title");
  const includeTitleSceneInput =
    getElement<HTMLInputElement>("#includeTitleScene");
  const lyricsInput = getElement<HTMLTextAreaElement>("#lyrics");
  const themeGrid = getElement<HTMLDivElement>("#themes");
  const editingSceneLabel = getElement<HTMLElement>("#editingScene");
  const applyStyleAllButton =
    getElement<HTMLButtonElement>("#applyStyleAll");
  const restoreSceneStyleButton =
    getElement<HTMLButtonElement>("#restoreSceneStyle");
  const sceneStyleStatus = getElement<HTMLElement>("#sceneStyleStatus");
  const invertColorsInput =
    getElement<HTMLInputElement>("#invertColors");
  const commit = () => {
    saveProject(project);
    onEdit();
    onProjectChange();
  };
  const activeStyle = () =>
    getEffectiveStyle(project, getSelectedSceneIndex());
  const updateStyle = (patch: Partial<SceneStyle>) => {
    const sceneIndex = getSelectedSceneIndex();
    const existing = project.sceneStyles[sceneIndex] ?? {};
    const wasCustomized = Object.keys(existing).length > 0;
    project.sceneStyles[sceneIndex] = { ...existing, ...patch };
    if (sceneIndex === 0 && !wasCustomized) {
      const { anim, ...defaultPatch } = patch;
      Object.assign(project.settings, defaultPatch);
      if (anim !== undefined) project.settings.animation = anim;
    }
    commit();
  };
  const fontPicker = mountFontPicker(
    getElement<HTMLElement>("#fontPicker"),
    "font",
    () => activeStyle().font,
    (font) => {
      updateStyle({ font });
      loadSelectedFont(activeStyle(), onProjectChange);
    },
  );
  const highlightFontPicker = mountFontPicker(
    getElement<HTMLElement>("#highlightFontPicker"),
    "highlightFont",
    () => activeStyle().highlightFont,
    (font) => {
      updateStyle({ highlightFont: font });
      loadSelectedFont(activeStyle(), onProjectChange);
    },
  );
  const fontSizeInput = getElement<HTMLInputElement>("#fontSize");
  const fontSizeOutput = getElement<HTMLOutputElement>("#fontSizeValue");
  const highlightFontSizeInput =
    getElement<HTMLInputElement>("#highlightFontSize");
  const highlightFontSizeOutput =
    getElement<HTMLOutputElement>("#highlightFontSizeValue");
  const animationSelect = getElement<HTMLSelectElement>("#anim");
  const highlightAnimationSelect =
    getElement<HTMLSelectElement>("#highlightAnim");
  const animationUnitSelect = getElement<HTMLSelectElement>("#animUnit");
  const highlightAnimationUnitSelect =
    getElement<HTMLSelectElement>("#highlightAnimUnit");
  const animationDurationInput =
    getElement<HTMLInputElement>("#animDuration");
  const highlightAnimationDurationInput =
    getElement<HTMLInputElement>("#highlightAnimDuration");
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

  for (const { value, label } of ANIMATION_OPTIONS) {
    for (const select of [animationSelect, highlightAnimationSelect]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
  }
  for (const { value, label } of ANIMATION_UNIT_OPTIONS) {
    for (const select of [animationUnitSelect, highlightAnimationUnitSelect]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
  }

  function syncAnimationDurations(): void {
    const max = project.settings.secondsPerScene;
    const style = activeStyle();
    animationDurationInput.max = String(max);
    highlightAnimationDurationInput.max = String(max);
    animationDurationInput.value = String(style.animDuration);
    highlightAnimationDurationInput.value = String(
      style.highlightAnimDuration,
    );
  }

  function updateThemeButtons(): void {
    const themeId = activeStyle().themeId;
    for (const button of themeGrid.querySelectorAll<HTMLButtonElement>(".theme")) {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.themeId === themeId),
      );
    }
  }

  function syncSettings(): void {
    const style = activeStyle();
    const sceneIndex = getSelectedSceneIndex();
    fontPicker.sync();
    highlightFontPicker.sync();
    fontSizeInput.value = String(style.fontSize);
    fontSizeOutput.value = `${style.fontSize}%`;
    highlightFontSizeInput.value = String(style.highlightFontSize);
    highlightFontSizeOutput.value = `${style.highlightFontSize}%`;
    animationSelect.value = style.anim;
    highlightAnimationSelect.value = style.highlightAnim;
    animationUnitSelect.value = style.animUnit;
    highlightAnimationUnitSelect.value = style.highlightAnimUnit;
    syncAnimationDurations();
    positionSelect.value = style.position;
    inkInput.value = style.inkColor;
    highlightInput.value = style.highlightColor;
    uppercaseInput.checked = style.uppercase;
    invertColorsInput.checked = style.invertColors;
    shadowInput.checked = style.shadow;
    secondsInput.value = String(project.settings.secondsPerScene);
    resolutionSelect.value = project.settings.resolution;
    includeTitleSceneInput.checked = project.includeTitleScene;
    editingSceneLabel.textContent =
      `Editando: Cena ${String(sceneIndex + 1).padStart(2, "0")}`;
    restoreSceneStyleButton.hidden = !isSceneStyleCustomized(
      project,
      sceneIndex,
    );
    applyStyleAllButton.disabled = buildScenes(project).length === 0;
    sceneStyleStatus.textContent = "";
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
    sampleStart.style.fontWeight = String(FONT_CATALOG[theme.font].weight);
    sampleHighlight.textContent = theme.name;
    sampleHighlight.style.fontFamily = `"${theme.highlightFont}", cursive`;
    sampleHighlight.style.fontWeight = String(
      FONT_CATALOG[theme.highlightFont].weight,
    );
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
  includeTitleSceneInput.addEventListener("change", () => {
    project.includeTitleScene = includeTitleSceneInput.checked;
    commit();
  });
  lyricsInput.addEventListener("input", () => {
    project.lyrics = lyricsInput.value;
    commit();
  });
  const updateAnimationDuration = (
    input: HTMLInputElement,
    setting: "animDuration" | "highlightAnimDuration",
    normalize: boolean,
  ) => {
    const value = input.valueAsNumber;
    if (!Number.isFinite(value)) {
      if (normalize) input.value = String(activeStyle()[setting]);
      return;
    }
    const rounded = Math.round(value * 10) / 10;
    const duration = Math.min(
      project.settings.secondsPerScene,
      Math.max(0.2, rounded),
    );
    input.value = String(duration);
    updateStyle({ [setting]: duration });
  };
  animationDurationInput.addEventListener("input", () =>
    updateAnimationDuration(animationDurationInput, "animDuration", false),
  );
  animationDurationInput.addEventListener("change", () =>
    updateAnimationDuration(animationDurationInput, "animDuration", true),
  );
  highlightAnimationDurationInput.addEventListener("input", () =>
    updateAnimationDuration(
      highlightAnimationDurationInput,
      "highlightAnimDuration",
      false,
    ),
  );
  highlightAnimationDurationInput.addEventListener("change", () =>
    updateAnimationDuration(
      highlightAnimationDurationInput,
      "highlightAnimDuration",
      true,
    ),
  );
  fontSizeInput.addEventListener("input", () => {
    const value = fontSizeInput.valueAsNumber;
    if (!Number.isFinite(value)) return;
    const fontSize = Math.min(200, Math.max(50, value));
    fontSizeOutput.value = `${fontSize}%`;
    updateStyle({ fontSize });
  });
  highlightFontSizeInput.addEventListener("input", () => {
    const value = highlightFontSizeInput.valueAsNumber;
    if (!Number.isFinite(value)) return;
    const highlightFontSize = Math.min(250, Math.max(50, value));
    highlightFontSizeOutput.value = `${highlightFontSize}%`;
    updateStyle({ highlightFontSize });
  });
  themeGrid.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(".theme");
    const themeId = button?.dataset.themeId;
    const theme = THEMES.find((candidate) => candidate.id === themeId);
    if (!theme) return;

    updateStyle(themeStyle(theme));
    syncSettings();
    loadSelectedFont(activeStyle(), onProjectChange);
  });

  animationSelect.addEventListener("change", () => {
    const animation = ANIMATION_OPTIONS.find(({ value }) => value === animationSelect.value)
      ?.value;
    if (!animation) return;
    updateStyle({ anim: animation });
  });
  highlightAnimationSelect.addEventListener("change", () => {
    const animation = ANIMATION_OPTIONS.find(
      ({ value }) => value === highlightAnimationSelect.value,
    )?.value;
    if (!animation) return;
    updateStyle({ highlightAnim: animation });
  });
  animationUnitSelect.addEventListener("change", () => {
    const unit = ANIMATION_UNIT_OPTIONS.find(
      ({ value }) => value === animationUnitSelect.value,
    )?.value;
    if (!unit) return;
    updateStyle({ animUnit: unit });
  });
  highlightAnimationUnitSelect.addEventListener("change", () => {
    const unit = ANIMATION_UNIT_OPTIONS.find(
      ({ value }) => value === highlightAnimationUnitSelect.value,
    )?.value;
    if (!unit) return;
    updateStyle({ highlightAnimUnit: unit });
  });
  positionSelect.addEventListener("change", () => {
    const position = POSITION_OPTIONS.find(
      (candidate) => candidate === positionSelect.value,
    );
    if (!position) return;
    updateStyle({ position });
  });
  inkInput.addEventListener("input", () => {
    updateStyle({ inkColor: inkInput.value });
  });
  highlightInput.addEventListener("input", () => {
    updateStyle({ highlightColor: highlightInput.value });
  });
  uppercaseInput.addEventListener("change", () => {
    updateStyle({ uppercase: uppercaseInput.checked });
  });
  shadowInput.addEventListener("change", () => {
    updateStyle({ shadow: shadowInput.checked });
  });
  invertColorsInput.addEventListener("change", () => {
    updateStyle({ invertColors: invertColorsInput.checked });
  });
  applyStyleAllButton.addEventListener("click", () => {
    const sceneCount = buildScenes(project).length;
    if (sceneCount === 0) return;
    applyStyleToAllScenes(project, getSelectedSceneIndex());
    commit();
    sceneStyleStatus.textContent =
      `Estilo aplicado a todas as ${sceneCount} cenas!`;
  });
  restoreSceneStyleButton.addEventListener("click", () => {
    if (!restoreSceneStyle(project, getSelectedSceneIndex())) return;
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
    project.settings.animDuration = Math.min(project.settings.animDuration, seconds);
    project.settings.highlightAnimDuration = Math.min(
      project.settings.highlightAnimDuration,
      seconds,
    );
    for (const style of Object.values(project.sceneStyles)) {
      if (style.animDuration !== undefined) {
        style.animDuration = Math.min(style.animDuration, seconds);
      }
      if (style.highlightAnimDuration !== undefined) {
        style.highlightAnimDuration = Math.min(
          style.highlightAnimDuration,
          seconds,
        );
      }
    }
    syncAnimationDurations();
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
    onEdit();
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
      onEdit();

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
  return { syncSceneStyle: syncSettings };
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
  project: Project,
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
    const customized = isSceneStyleCustomized(project, index);
    selectButton.setAttribute(
      "aria-label",
      `Selecionar cena ${index + 1}${customized ? ", estilo personalizado" : ""}: ${snippet}`,
    );
    const description = document.createElement("span");
    description.textContent = `${String(index + 1).padStart(2, "0")} · ${snippet}`;
    selectButton.append(description);
    if (customized) {
      const marker = document.createElement("span");
      marker.className = "scene-customized";
      marker.textContent = "Personalizada";
      selectButton.append(marker);
    }
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

function themeStyle(theme: Theme): Partial<SceneStyle> {
  return {
    themeId: theme.id,
    font: theme.font,
    highlightFont: theme.highlightFont,
    fontSize: 100,
    highlightFontSize: FONT_CATALOG[theme.highlightFont].isCursive ? 120 : 100,
    anim: theme.anim,
    highlightAnim: theme.anim,
    inkColor: theme.ink,
    highlightColor: theme.hl,
    uppercase: theme.up,
    shadow: theme.shadow,
  };
}

function loadSelectedFont(
  style: SceneStyle,
  onProjectChange: () => void,
): void {
  if (!document.fonts) return;
  const fonts = [style.font, style.highlightFont];
  void Promise.all(
    fonts.map((font) =>
      document.fonts.load(`${FONT_CATALOG[font].weight} 40px "${font}"`),
    ),
  )
    .then(onProjectChange, onProjectChange);
}
