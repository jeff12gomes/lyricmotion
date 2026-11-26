import { AudioPlayer } from "./audio/player";
import { VideoRecorder } from "./export/recorder";
import { LiveMode } from "./live/live";
import { render, type RenderState } from "./render/renderer";
import { FONTS } from "./render/themes";
import { buildScenes, buildTimes } from "./scenes";
import { SyncController } from "./sync/sync";
import { loadProject, saveProject } from "./state";
import { mountPanels } from "./ui/panels";
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
  const syncButton = getElement<HTMLButtonElement>("#sync");
  const markButton = getElement<HTMLButtonElement>("#mark");
  const syncStatus = getElement<HTMLElement>("#syncStatus");
  const audioStatus = getElement<HTMLElement>("#audioStatus");
  const exportButton = getElement<HTMLButtonElement>("#exp");
  const cancelButton = getElement<HTMLButtonElement>("#cancel");
  const saveButton = getElement<HTMLButtonElement>("#save");
  const progressBar = getElement<HTMLDivElement>("#bar");
  const progressFill = getElement<HTMLElement>("#barFill");
  const exportStatus = getElement<HTMLElement>("#expStatus");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível iniciar o canvas 2D.");

  const project = loadProject();
  const player = new AudioPlayer();
  let scenes = buildScenes(project);
  let { times, total } = buildTimes(scenes, project);
  const [canvasWidth, canvasHeight] = project.settings.resolution
    .split("x")
    .map(Number);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  seek.value = "0";

  let seeking = false;
  let lastUiUpdate = 0;
  let audioLoading = false;
  let exportInProgress = false;
  let playbackFailedDuringExport = false;
  let recorder: VideoRecorder | null = null;
  let completedVideo: Blob | null = null;
  let completedFilename = "";
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
  let sync: SyncController;

  function updateSyncStatus(
    active = sync?.isActive ?? false,
    markedCount = sync?.markedCount ?? 0,
    sceneCount = scenes.length,
  ): void {
    syncButton.textContent = active ? "Parar sincronia" : "Começar sincronia";
    syncButton.disabled = sceneCount === 0 && !active;
    markButton.disabled = !active;
    liveButton.disabled = sceneCount === 0;
    exportButton.disabled = sceneCount === 0 || exportInProgress || audioLoading;

    if (active) {
      syncStatus.textContent = `Toque em "Marcar" (ou Espaço) quando cada linha começar. Linha ${markedCount + 1} de ${sceneCount}.`;
    } else if (project.marks.length > 0) {
      syncStatus.textContent =
        project.marks.length === sceneCount
          ? `Sincronia salva para ${sceneCount} cenas.`
          : "A letra mudou: sincronize de novo.";
    } else {
      syncStatus.textContent = "";
    }
  }

  function updateProject(): void {
    scenes = buildScenes(project);
    ({ times, total } = buildTimes(scenes, project, player.duration));
    const [width, height] = project.settings.resolution.split("x").map(Number);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    renderState.scenes = scenes;
    renderState.times = times;

    if (sync?.isActive) sync.refreshSceneCount();
    updateSyncStatus();
  }

  sync = new SyncController({
    getSceneCount: () => scenes.length,
    getSecondsPerScene: () => project.settings.secondsPerScene,
    now: () => player.now(),
    onMarksChange: (marks) => {
      project.marks = marks;
      saveProject(project);
      updateProject();
    },
    onProgress: updateSyncStatus,
  });

  mountPanels(project, updateProject, (logo) => {
    renderState.logo = logo;
  }, {
    load: async (file) => {
      if (sync.isActive) sync.stop();
      audioLoading = true;
      updateSyncStatus();
      try {
        return await player.loadAudio(file);
      } finally {
        audioLoading = false;
        updateSyncStatus();
      }
    },
    remove: () => {
      if (sync.isActive) sync.stop();
      audioLoading = false;
      player.removeAudio();
      updateSyncStatus();
    },
  });

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
    updateSyncStatus();
  }

  function resetExportUi(): void {
    exportInProgress = false;
    cancelButton.hidden = true;
    progressBar.hidden = true;
    setExportControls(false);
  }

  function filenameFor(extension: "mp4" | "webm"): string {
    const title = project.title
      .replace(/[^\p{L}\p{N} _-]/gu, "")
      .trim()
      .replace(/\s+/g, " ");
    return `${title || "letra"}.${extension}`;
  }

  function startRecording(): void {
    if (live.isActive) {
      exportStatus.textContent = "Saia do modo ao vivo antes de gravar.";
      return;
    }
    if (!VideoRecorder.isSupported(canvas)) {
      exportStatus.textContent =
        "Este navegador não grava vídeo. Abra no Chrome ou no Edge, no computador.";
      return;
    }

    if (sync.isActive) sync.stop();
    completedVideo = null;
    completedFilename = "";
    saveButton.hidden = true;
    exportStatus.textContent = "";
    progressFill.style.width = "0%";
    progressBar.setAttribute("aria-valuenow", "0");
    cancelButton.hidden = false;
    progressBar.hidden = false;
    exportInProgress = true;
    setExportControls(true);

    const currentRecorder = new VideoRecorder({
      onComplete: (blob, extension) => {
        player.pause();
        player.seek(total);
        completedVideo = blob;
        completedFilename = filenameFor(extension);
        saveButton.textContent = `Salvar ${completedFilename}`;
        saveButton.hidden = false;
        exportStatus.textContent = `Gravação pronta · ${(blob.size / 1048576).toFixed(1)} MB.`;
        resetExportUi();
      },
      onCancel: () => {
        player.pause();
        exportStatus.textContent = playbackFailedDuringExport
          ? "Não foi possível iniciar a reprodução para gravar."
          : "Gravação cancelada.";
        playbackFailedDuringExport = false;
        resetExportUi();
      },
      onError: (error) => {
        player.pause();
        exportStatus.textContent = error.message;
        resetExportUi();
      },
    });
    recorder = currentRecorder;

    try {
      player.seek(0);
      const playback = player.play();
      void playback.catch(() => {
        if (!exportInProgress) return;
        playbackFailedDuringExport = true;
        player.pause();
        currentRecorder.cancel();
      });
      currentRecorder.start(
        canvas,
        player.hasAudio ? player.mediaStreamDestination : null,
        project.settings.resolution,
      );
    } catch (error) {
      player.pause();
      exportStatus.textContent =
        error instanceof Error ? error.message : "Não foi possível iniciar a gravação.";
      resetExportUi();
    }
  }

  if (document.fonts) {
    await document.fonts.ready;
    await document.fonts.load(
      `${FONTS[project.settings.font]} 40px "${project.settings.font}"`,
    );
  }

  const togglePlayback = async () => {
    if (live.isActive) return;
    if (player.isPlaying) {
      player.pause();
      return;
    }
    if (player.now() >= total) player.seek(0);
    try {
      await player.play();
      audioStatus.textContent = "";
    } catch {
      audioStatus.textContent = "Não foi possível iniciar a reprodução.";
    }
  };

  playButton.addEventListener("click", () => {
    void togglePlayback();
  });
  seek.addEventListener("input", () => {
    player.seek((Number(seek.value) / 1000) * total);
  });
  seek.addEventListener("pointerdown", () => {
    seeking = true;
  });
  window.addEventListener("pointerup", () => {
    seeking = false;
  });

  syncButton.addEventListener("click", () => {
    if (sync.isActive) {
      sync.stop();
      return;
    }
    if (live.isActive) return;

    sync.start();
    player.seek(0);
    void player.play().catch(() => {
      audioStatus.textContent = "Não foi possível iniciar a reprodução.";
      sync.stop();
    });
  });
  markButton.addEventListener("click", () => sync.mark());
  exportButton.addEventListener("click", startRecording);
  cancelButton.addEventListener("click", () => {
    if (!exportInProgress) return;
    player.pause();
    recorder?.cancel();
  });
  saveButton.addEventListener("click", () => {
    if (!completedVideo || !completedFilename) return;
    const url = URL.createObjectURL(completedVideo);
    const link = document.createElement("a");
    link.href = url;
    link.download = completedFilename;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      audioStatus.textContent = "Não foi possível sair da tela cheia.";
    }
  };

  liveButton.addEventListener("click", () => {
    if (sync.isActive) sync.stop();
    screenWrap.classList.add("live");
    liveBar.hidden = false;
    void live.start(screenWrap).catch((error: unknown) => {
      hideLiveControls();
      audioStatus.textContent =
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
    if (sync.isActive) {
      sync.mark();
    } else {
      void togglePlayback();
    }
  });

  const frame = (timestamp: number) => {
    let time = player.now();
    let recordingFinished = false;
    if (exportInProgress && !live.isActive && time >= total) {
      player.pause();
      player.seek(total);
      time = player.now();
      recordingFinished = true;
    } else if (!live.isActive && player.isPlaying && time >= total) {
      player.pause();
      player.seek(total);
      time = player.now();
    }

    renderState.playing = player.isPlaying;
    renderState.live = live.renderState;
    render(ctx, time, renderState);
    if (recordingFinished) recorder?.finish();

    if (timestamp - lastUiUpdate >= 200) {
      lastUiUpdate = timestamp;
      playButton.textContent = player.isPlaying ? "❚❚" : "▶";
      playButton.setAttribute(
        "aria-label",
        player.isPlaying ? "Pausar" : "Tocar",
      );
      if (!live.isActive) {
        timeLabel.textContent = `${formatTime(time)} / ${formatTime(total)}`;
        if (!seeking) {
          seek.value = String(
            Math.round((time / Math.max(total, 0.001)) * 1000),
          );
        }
      } else {
        const state = live.renderState;
        if (state) liveInfo.textContent = `${state.sceneIndex + 1} / ${scenes.length}`;
      }
      if (exportInProgress) {
        const progress = Math.min(1, Math.max(0, time / Math.max(total, 0.001)));
        progressFill.style.width = `${progress * 100}%`;
        progressBar.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
        exportStatus.textContent = `Gravando… ${formatTime(time)} de ${formatTime(total)}`;
      }
    }
    requestAnimationFrame(frame);
  };

  updateSyncStatus();
  requestAnimationFrame(frame);
}

void startPreview();
