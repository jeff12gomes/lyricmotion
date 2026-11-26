import type { AudioPlayer } from "../audio/player";

export interface LiveRenderState {
  sceneIndex: number;
  previousIndex: number;
  sceneStart: number;
}

export class LiveMode {
  private active = false;
  private sceneIndex = 0;
  private previousIndex = -1;
  private sceneStart = 0;

  constructor(
    private readonly player: AudioPlayer,
    private readonly getSceneCount: () => number,
  ) {}

  get isActive(): boolean {
    return this.active;
  }

  get renderState(): LiveRenderState | null {
    if (!this.active) return null;
    return {
      sceneIndex: this.sceneIndex,
      previousIndex: this.previousIndex,
      sceneStart: this.sceneStart,
    };
  }

  async start(screen: HTMLElement): Promise<void> {
    if (this.active) return;
    if (this.getSceneCount() === 0) {
      throw new Error("Adicione cenas antes de iniciar o modo ao vivo.");
    }
    const requestFullscreen = screen.requestFullscreen;
    if (!requestFullscreen) {
      throw new Error("Tela cheia não está disponível neste navegador.");
    }

    this.player.pause();
    this.player.enterLiveMode();
    this.active = true;
    this.sceneIndex = 0;
    this.previousIndex = -1;
    this.sceneStart = this.player.now();

    try {
      await requestFullscreen.call(screen);
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  async exit(): Promise<void> {
    if (!this.active) return;
    this.stop();
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    this.player.exitLiveMode();
  }

  next(): void {
    this.step(1);
  }

  previous(): void {
    this.step(-1);
  }

  private step(direction: number): void {
    if (!this.active) return;
    const nextIndex = Math.min(
      this.getSceneCount() - 1,
      Math.max(0, this.sceneIndex + direction),
    );
    if (nextIndex === this.sceneIndex) return;
    this.previousIndex = this.sceneIndex;
    this.sceneIndex = nextIndex;
    this.sceneStart = this.player.now();
  }
}
