import JSZip from "jszip";
import { PlaybackClock } from "./audio/player";
import { VideoRecorder } from "./export/recorder";
import { LiveMode } from "./live/live";
import { render, type RenderState } from "./render/renderer";
import { FONT_CATALOG } from "./render/themes";
import { buildScenes, buildTimes } from "./scenes";
import { getEffectiveStyle, loadProject } from "./state";
import {
  mountPanels,
  renderSceneVideos,
  type GeneratedVideo,
} from "./ui/panels";
import type { Scene } from "./types";
import "./ui/styles.css";

function getElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  }
  return element;
}

function formatTime(seconds: number): string {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

async function startPreview(): Promise<void> {
  const screenWrap = getElement<HTMLDivElement>("#screenWrap");
  const canvas = getElement<HTMLCanvasElement>("#screen");
  const playButton = getElement<HTMLButtonElement>("#play");
  const seek = getElement<HTMLInputElement>("#seek");
  const timeLabel = getElement<HTMLElement>("#time");
  const liveButton = getElement<HTMLButtonElement>("#goLive");
  const liveBar = getElement<HTMLDivElement>("#liveBar");
  const liveInfo = getElement<HTMLElement>("#liveInfo");
  const previousButton = getElement<HTMLButtonElement>("#livePrev");
  const nextButton = getElement<HTMLButtonElement>("#liveNext");
  const exitLiveButton = getElement<HTMLButtonElement>("#liveExit");
  const status = getElement<HTMLElement>("#status");
  const exportButton = getElement<HTMLButtonElement>("#exp");
  const saveChangesButton = getElement<HTMLButtonElement>("#saveChanges");
  const cancelButton = getElement<HTMLButtonElement>("#cancel");
  const saveButton = getElement<HTMLButtonElement>("#save");
  const progressBar = getElement<HTMLDivElement>("#bar");
  const progressFill = getElement<HTMLElement>("#barFill");
  const exportStatus = getElement<HTMLElement>("#expStatus");
  const videoList = getElement<HTMLOListElement>("#sceneVideos");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível iniciar o canvas 2D.");

  const project = loadProject();
  const player = new PlaybackClock();
  let scenes = buildScenes(project);
  let times = buildTimes(scenes, project).times;
  let selectedSceneIndex = 0;
  let hasUnsavedChanges = false;
  let stylePanel: { syncSceneStyle: () => void } | null = null;
  const [canvasWidth, canvasHeight] = project.settings.resolution
    .split("x")
    .map(Number);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  seek.value = "0";

  let seeking = false;
  let previewStarted = false;
  let lastUiUpdate = 0;
  let exportInProgress = false;
  let generatedVideos: GeneratedVideo[] = [];
  let batch: {
    scenes: Scene[];
    sceneIndexes: number[];
    index: number;
    duration: number;
    recorder: VideoRecorder | null;
    startedAt: number | null;
    timer: number | null;
    cancelled: boolean;
    downloadIndividual: boolean;
    downloadZip: boolean;
  } | null = null;
  let previousControlStates: Array<{
    control:
      | HTMLButtonElement
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    disabled: boolean;
  }> = [];
  const renderState: RenderState = {
    project,
    scenes,
    times,
    playing: false,
    logo: null,
    live: null,
  };
  const live = new LiveMode(player, () => scenes.length);

  function markUnsavedChanges(): void {
    hasUnsavedChanges = true;
    saveChangesButton.classList.toggle(
      "has-unsaved-changes",
      hasUnsavedChanges,
    );
  }

  function updatePlaybackControls(sceneCount = scenes.length): void {
    liveButton.disabled = sceneCount === 0;
    exportButton.disabled = sceneCount === 0 || exportInProgress;
  }

  function updateProject(): void {
    scenes = buildScenes(project);
    times = buildTimes(scenes, project).times;
    selectedSceneIndex = Math.min(selectedSceneIndex, Math.max(0, scenes.length - 1));
    player.pause();
    player.seek(0);
    previewStarted = false;
    const [width, height] = project.settings.resolution.split("x").map(Number);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    renderState.scenes = scenes;
    renderState.times = times;
    generatedVideos = [];
    saveButton.hidden = true;
    renderSceneVideos(
      videoList,
      scenes,
      selectedSceneIndex,
      generatedVideos,
      selectScene,
      downloadIndividual,
      project,
    );
    stylePanel?.syncSceneStyle();
    updatePlaybackControls();
  }

  stylePanel = mountPanels(
    project,
    updateProject,
    (logo) => {
      renderState.logo = logo;
    },
    () => selectedSceneIndex,
    markUnsavedChanges,
  );

  function setExportControls(disabled: boolean): void {
    if (disabled) {
      const controls = document.querySelectorAll<
        | HTMLButtonElement
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
      >("button, input, select, textarea");
      previousControlStates = Array.from(controls)
        .filter((control) => control.id !== "cancel")
        .map((control) => ({ control, disabled: control.disabled }));
      for (const { control } of previousControlStates) {
        control.disabled = true;
      }
      cancelButton.disabled = false;
      return;
    }

    for (const { control, disabled: wasDisabled } of previousControlStates) {
      control.disabled = wasDisabled;
    }
    previousControlStates = [];
    updatePlaybackControls();
  }

  function resetExportUi(): void {
    exportInProgress = false;
    cancelButton.hidden = true;
    progressBar.hidden = true;
    setExportControls(false);
  }

  function cleanFilenamePart(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ");
  }

  function filenameFor(
    scene: Scene,
    index: number,
    extension: "mp4" | "webm",
  ): string {
    const snippet = cleanFilenamePart(scene.text.split(/\s+/).slice(0, 7).join(" "));
    return `${String(index + 1).padStart(2, "0")} - ${snippet || "cena"}.${extension}`;
  }

  function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function updateSceneList(): void {
    renderSceneVideos(
      videoList,
      scenes,
      selectedSceneIndex,
      generatedVideos,
      selectScene,
      downloadIndividual,
      project,
    );
  }

  function selectScene(index: number): void {
    if (!scenes[index] || exportInProgress) return;
    player.pause();
    selectedSceneIndex = index;
    stylePanel?.syncSceneStyle();
    player.seek(0);
    previewStarted = true;
    player.play();
    updateSceneList();
  }

  function downloadIndividual(index: number): void {
    const video = generatedVideos.find((candidate) => candidate.sceneIndex === index);
    if (video) {
      downloadBlob(video.blob, video.filename);
      return;
    }
    startRecording([index], true);
  }

  async function downloadZip(): Promise<void> {
    if (generatedVideos.length !== scenes.length) {
      startRecording(
        scenes.map((_, index) => index),
        false,
        true,
      );
      return;
    }
    saveButton.disabled = true;
    exportStatus.textContent = "Preparando arquivo .zip…";
    try {
      const archive = new JSZip();
      for (const video of generatedVideos) {
        archive.file(video.filename, video.blob);
      }
      const blob = await archive.generateAsync({
        type: "blob",
        compression: "DEFLATE",
      });
      const title = cleanFilenamePart(project.title) || "letra";
      downloadBlob(blob, `${title}.zip`);
      exportStatus.textContent = "Pacote .zip pronto para baixar.";
    } catch (error) {
      exportStatus.textContent =
        error instanceof Error
          ? `Não foi possível criar o arquivo .zip: ${error.message}`
          : "Não foi possível criar o arquivo .zip.";
    } finally {
      saveButton.disabled = false;
    }
  }

  function finishCancelledBatch(currentBatch: NonNullable<typeof batch>): void {
    if (batch !== currentBatch) return;
    if (currentBatch.timer !== null) window.clearTimeout(currentBatch.timer);
    batch = null;
    updateSceneList();
    saveButton.hidden = true;
    exportStatus.textContent = "Gravação cancelada.";
    resetExportUi();
  }

  function failBatch(currentBatch: NonNullable<typeof batch>, error: Error): void {
    if (batch !== currentBatch) return;
    if (currentBatch.timer !== null) window.clearTimeout(currentBatch.timer);
    if (currentBatch.recorder?.isRecording) currentBatch.recorder.cancel();
    batch = null;
    updateSceneList();
    saveButton.hidden = true;
    exportStatus.textContent = error.message;
    resetExportUi();
  }

  function startRecording(
    sceneIndexes = scenes.map((_, index) => index),
    downloadIndividualAfter = false,
    downloadZipAfter = false,
  ): void {
    if (live.isActive) {
      exportStatus.textContent = "Saia do modo ao vivo antes de gravar.";
      return;
    }
    if (!VideoRecorder.isSupported(canvas)) {
      exportStatus.textContent =
        "Este navegador não grava vídeo. Abra no Chrome ou no Edge, no computador.";
      return;
    }

    exportStatus.textContent = "";
    progressFill.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", "0");
    cancelButton.hidden = false;
    progressBar.hidden = false;
    exportInProgress = true;
    setExportControls(true);
    player.pause();
    batch = {
      scenes: sceneIndexes.map((index) => scenes[index]).filter((scene) => scene !== undefined),
      sceneIndexes: [...sceneIndexes],
      index: 0,
      duration: project.settings.secondsPerScene,
      recorder: null,
      startedAt: null,
      timer: null,
      cancelled: false,
      downloadIndividual: downloadIndividualAfter,
      downloadZip: downloadZipAfter,
    };
    exportStatus.textContent = `Gravando vídeo 1 de ${sceneIndexes.length}…`;
  }

  if (document.fonts) {
    await document.fonts.ready;
    const fontFamilies = new Set(
      scenes.flatMap((_, index) => {
        const style = getEffectiveStyle(project, index);
        return [style.font, style.highlightFont];
      }),
    );
    await Promise.all(
      [...fontFamilies].map((font) =>
        document.fonts.load(`${FONT_CATALOG[font].weight} 40px "${font}"`),
      ),
    );
  }

  const togglePlayback = () => {
    if (live.isActive) return;
    if (player.isPlaying) {
      player.pause();
      return;
    }
    previewStarted = true;
    if (player.now() >= project.settings.secondsPerScene) player.seek(0);
    player.play();
  };

  playButton.addEventListener("click", () => {
    togglePlayback();
  });
  seek.addEventListener("input", () => {
    previewStarted = true;
    player.seek((Number(seek.value) / 1000) * project.settings.secondsPerScene);
  });
  seek.addEventListener("pointerdown", () => {
    seeking = true;
  });
  window.addEventListener("pointerup", () => {
    seeking = false;
  });

  exportButton.addEventListener("click", () =>
    startRecording(
      scenes.map((_, index) => index),
      false,
      true,
    ),
  );
  cancelButton.addEventListener("click", () => {
    if (!exportInProgress) return;
    const currentBatch = batch;
    if (!currentBatch) return;
    currentBatch.cancelled = true;
    if (currentBatch.timer !== null) window.clearTimeout(currentBatch.timer);
    if (currentBatch.recorder?.isRecording) {
      currentBatch.recorder.cancel();
    } else {
      finishCancelledBatch(currentBatch);
    }
  });
  saveButton.addEventListener("click", async () => {
    await downloadZip();
  });

  const hideLiveControls = () => {
    screenWrap.classList.remove("live");
    liveBar.hidden = true;
  };

  const exitLive = async () => {
    hideLiveControls();
    try {
      await live.exit();
    } catch {
      status.textContent = "Não foi possível sair da tela cheia.";
    }
  };

  liveButton.addEventListener("click", () => {
    screenWrap.classList.add("live");
    liveBar.hidden = false;
    void live.start(screenWrap).catch((error: unknown) => {
      hideLiveControls();
      status.textContent =
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o modo ao vivo.";
    });
  });
  previousButton.addEventListener("click", () => live.previous());
  nextButton.addEventListener("click", () => live.next());
  exitLiveButton.addEventListener("click", () => {
    void exitLive();
  });
  canvas.addEventListener("click", () => live.next());

  document.addEventListener("fullscreenchange", () => {
    if (live.isActive && document.fullscreenElement !== screenWrap) {
      live.stop();
      hideLiveControls();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (exportInProgress) {
      if (event.key === " ") event.preventDefault();
      return;
    }

    const activeElement = document.activeElement;
    const textEntryFocused =
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement ||
      (activeElement instanceof HTMLInputElement && activeElement.type !== "range");
    if (textEntryFocused) return;

    if (live.isActive) {
      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === " "
      ) {
        event.preventDefault();
        if (event.repeat && event.key === " ") return;
        live.next();
      } else if (
        event.key === "ArrowLeft" ||
        event.key === "PageUp"
      ) {
        event.preventDefault();
        live.previous();
      } else if (event.key === "Escape") {
        event.preventDefault();
        void exitLive();
      }
      return;
    }

    if (event.key !== " ") return;

    event.preventDefault();
    if (event.repeat) return;
    togglePlayback();
  });

  const frame = (timestamp: number) => {
    let time = player.now();
    const sceneDuration = project.settings.secondsPerScene;
    if (!live.isActive && player.isPlaying && time >= sceneDuration) {
      player.pause();
      player.seek(sceneDuration);
      time = player.now();
    }

    const currentBatch = batch;
    if (currentBatch) {
      const scene = currentBatch.scenes[currentBatch.index];
      if (scene) {
        const elapsed =
          currentBatch.startedAt === null
            ? 0
            : Math.min(
                currentBatch.duration,
                Math.max(0, (timestamp - currentBatch.startedAt) / 1000),
              );
        render(ctx, elapsed, {
          ...renderState,
          scenes: [scene],
          times: [0],
          sceneIndexes: [currentBatch.sceneIndexes[currentBatch.index]],
          playing: true,
          live: null,
        });

        if (currentBatch.startedAt === null && !currentBatch.recorder) {
          const clipRecorder = new VideoRecorder({
            onComplete: (blob, extension) => {
              if (batch !== currentBatch || currentBatch.cancelled) return;
              if (currentBatch.timer !== null) {
                window.clearTimeout(currentBatch.timer);
                currentBatch.timer = null;
              }
              const sceneIndex = currentBatch.sceneIndexes[currentBatch.index];
              generatedVideos = generatedVideos.filter(
                (video) => video.sceneIndex !== sceneIndex,
              );
              generatedVideos.push({
                sceneIndex,
                filename: filenameFor(scene, sceneIndex, extension),
                sceneText: scene.text,
                blob,
              });
              currentBatch.index += 1;
              if (currentBatch.index === currentBatch.scenes.length) {
                batch = null;
                updateSceneList();
                saveButton.hidden = generatedVideos.length !== scenes.length;
                exportStatus.textContent = `${generatedVideos.length} vídeos prontos para baixar.`;
                progressFill.style.width = "100%";
                progressBar.setAttribute("aria-valuenow", "100");
                resetExportUi();
                if (currentBatch.downloadIndividual) {
                  const completedVideo = generatedVideos.find(
                    (video) => video.sceneIndex === sceneIndex,
                  );
                  if (completedVideo) {
                    downloadBlob(completedVideo.blob, completedVideo.filename);
                  }
                } else if (currentBatch.downloadZip) {
                  void downloadZip();
                }
                return;
              }
              currentBatch.recorder = null;
              currentBatch.startedAt = null;
              exportStatus.textContent =
                `Gravando vídeo ${currentBatch.index + 1} de ${currentBatch.scenes.length}…`;
            },
            onCancel: () => finishCancelledBatch(currentBatch),
            onError: (error) => failBatch(currentBatch, error),
          });
          currentBatch.recorder = clipRecorder;
          try {
            clipRecorder.start(canvas, null, project.settings.resolution);
            currentBatch.startedAt = timestamp;
            currentBatch.timer = window.setTimeout(
              () => clipRecorder.finish(),
              currentBatch.duration * 1000,
            );
          } catch (error) {
            failBatch(
              currentBatch,
              error instanceof Error
                ? error
                : new Error("Não foi possível iniciar a gravação."),
            );
          }
        }
      }
    } else if (live.isActive) {
      renderState.playing = false;
      renderState.live = live.renderState;
      render(ctx, time, renderState);
    } else {
      render(ctx, time, {
        ...renderState,
        scenes: scenes[selectedSceneIndex] ? [scenes[selectedSceneIndex]] : [],
        times: [0],
        sceneIndexes: [selectedSceneIndex],
        playing: player.isPlaying,
        pausedTime: previewStarted ? time : undefined,
        live: null,
      });
    }

    if (timestamp - lastUiUpdate >= 200) {
      lastUiUpdate = timestamp;
      playButton.textContent = player.isPlaying ? "❚❚" : "▶";
      playButton.setAttribute(
        "aria-label",
        player.isPlaying ? "Pausar" : "Tocar",
      );
      if (!live.isActive) {
        timeLabel.textContent = `${formatTime(time)} / ${formatTime(sceneDuration)}`;
        if (!seeking) {
          seek.value = String(
            Math.round((time / Math.max(sceneDuration, 0.001)) * 1000),
          );
        }
      } else {
        const state = live.renderState;
        if (state) liveInfo.textContent = `${state.sceneIndex + 1} / ${scenes.length}`;
      }
      if (exportInProgress) {
        const activeBatch = batch;
        const clipProgress =
          activeBatch?.startedAt === null || !activeBatch
            ? 0
            : Math.min(
                1,
                Math.max(0, (timestamp - activeBatch.startedAt) / 1000 / activeBatch.duration),
              );
        const progress = activeBatch
          ? (activeBatch.index + clipProgress) / activeBatch.scenes.length
          : 0;
        progressFill.style.width = `${progress * 100}%`;
        progressBar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
        if (activeBatch) {
          exportStatus.textContent =
            `Gravando vídeo ${activeBatch.index + 1} de ${activeBatch.scenes.length}…`;
        }
      }
    }
    requestAnimationFrame(frame);
  };

  updatePlaybackControls();
  updateSceneList();
  requestAnimationFrame(frame);
}

void startPreview();
