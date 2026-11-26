export class AudioPlayer {
  private readonly audio = new Audio();
  private audioLoaded = false;
  private internalTime = 0;
  private internalStart = 0;
  private internalPlaying = false;
  private liveMode = false;
  private objectUrl: string | null = null;
  private loadController: AbortController | null = null;
  private loadReject: ((reason: Error) => void) | null = null;
  private context: AudioContext | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;
  private source: MediaElementAudioSourceNode | null = null;

  get duration(): number | undefined {
    return this.audioLoaded ? this.audio.duration : undefined;
  }

  get hasAudio(): boolean {
    return this.audioLoaded;
  }

  get isPlaying(): boolean {
    if (this.liveMode) return false;
    return this.audioLoaded ? !this.audio.paused : this.internalPlaying;
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }

  get mediaStreamDestination(): MediaStreamAudioDestinationNode | null {
    return this.streamDestination;
  }

  now(): number {
    if (this.liveMode) return performance.now() / 1000;
    if (this.audioLoaded) return this.audio.currentTime;
    if (!this.internalPlaying) return this.internalTime;
    return this.internalTime + (performance.now() - this.internalStart) / 1000;
  }

  async loadAudio(file: File): Promise<number> {
    if (this.liveMode) {
      throw new Error("Saia do modo ao vivo antes de trocar o áudio.");
    }

    this.removeAudio();
    const objectUrl = URL.createObjectURL(file);
    this.objectUrl = objectUrl;

    return new Promise<number>((resolve, reject) => {
      const controller = new AbortController();
      this.loadController = controller;
      this.loadReject = reject;

      const fail = () => {
        if (this.loadController !== controller) return;
        controller.abort();
        this.loadController = null;
        this.loadReject = null;
        this.audioLoaded = false;
        this.audio.removeAttribute("src");
        this.audio.load();
        this.releaseObjectUrl();
        reject(new Error("Não foi possível carregar o arquivo de áudio."));
      };

      this.audio.addEventListener(
        "loadedmetadata",
        () => {
          if (this.loadController !== controller) return;
          const duration = this.audio.duration;
          if (!Number.isFinite(duration) || duration <= 0) {
            fail();
            return;
          }
          controller.abort();
          this.loadController = null;
          this.loadReject = null;
          this.audioLoaded = true;
          this.internalTime = 0;
          this.internalPlaying = false;
          resolve(duration);
        },
        { signal: controller.signal },
      );
      this.audio.addEventListener("error", fail, {
        once: true,
        signal: controller.signal,
      });

      this.audio.src = objectUrl;
      this.audio.load();
    });
  }

  removeAudio(): void {
    this.pause();
    this.loadReject?.(new Error("O carregamento do áudio foi cancelado."));
    this.loadReject = null;
    this.loadController?.abort();
    this.loadController = null;
    this.audioLoaded = false;
    this.audio.removeAttribute("src");
    this.audio.load();
    this.internalTime = 0;
    this.internalPlaying = false;
    this.releaseObjectUrl();
  }

  async play(): Promise<void> {
    if (this.liveMode) return;
    if (this.audioLoaded) {
      this.ensureAudioContext();
      const resume = this.context?.resume();
      const playback = this.audio.play();
      await Promise.all([resume, playback]);
      return;
    }
    if (!this.internalPlaying) {
      this.internalStart = performance.now();
      this.internalPlaying = true;
    }
  }

  pause(): void {
    if (this.liveMode) return;
    if (this.audioLoaded) {
      this.audio.pause();
    } else if (this.internalPlaying) {
      this.internalTime = this.now();
      this.internalPlaying = false;
    }
  }

  seek(time: number): void {
    if (this.liveMode) return;
    const nextTime = Math.max(0, time);
    if (this.audioLoaded) {
      this.audio.currentTime = Math.min(nextTime, this.audio.duration);
    } else {
      this.internalTime = nextTime;
      if (this.internalPlaying) this.internalStart = performance.now();
    }
  }

  enterLiveMode(): void {
    this.pause();
    this.liveMode = true;
  }

  exitLiveMode(): void {
    this.liveMode = false;
  }

  private ensureAudioContext(): void {
    if (this.context || !this.audioLoaded) return;
    const context = new AudioContext();
    try {
      const source = context.createMediaElementSource(this.audio);
      const destination = context.createMediaStreamDestination();
      source.connect(context.destination);
      source.connect(destination);
      this.context = context;
      this.source = source;
      this.streamDestination = destination;
    } catch (error) {
      void context.close();
      throw error;
    }
  }

  private releaseObjectUrl(): void {
    if (!this.objectUrl) return;
    URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }
}
