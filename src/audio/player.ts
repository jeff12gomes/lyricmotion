export class PlaybackClock {
  private internalTime = 0;
  private internalStart = 0;
  private internalPlaying = false;
  private liveMode = false;

  get isPlaying(): boolean {
    if (this.liveMode) return false;
    return this.internalPlaying;
  }

  now(): number {
    if (this.liveMode) return performance.now() / 1000;
    if (!this.internalPlaying) return this.internalTime;
    return this.internalTime + (performance.now() - this.internalStart) / 1000;
  }

  play(): void {
    if (this.liveMode) return;
    if (!this.internalPlaying) {
      this.internalStart = performance.now();
      this.internalPlaying = true;
    }
  }

  pause(): void {
    if (this.liveMode) return;
    if (this.internalPlaying) {
      this.internalTime = this.now();
      this.internalPlaying = false;
    }
  }

  seek(time: number): void {
    if (this.liveMode) return;
    const nextTime = Math.max(0, time);
    this.internalTime = nextTime;
    if (this.internalPlaying) this.internalStart = performance.now();
  }

  enterLiveMode(): void {
    this.pause();
    this.liveMode = true;
  }

  exitLiveMode(): void {
    this.liveMode = false;
  }
}
