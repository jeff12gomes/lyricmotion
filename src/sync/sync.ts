export function completeMarks(
  marks: number[],
  sceneCount: number,
  secondsPerScene: number,
): number[] {
  const count = Math.max(0, Math.floor(sceneCount));
  const completed = marks.slice(0, count);
  if (completed.length === 0) return completed;

  while (completed.length < count) {
    completed.push(
      completed[completed.length - 1] + secondsPerScene,
    );
  }
  return completed;
}

interface SyncControllerOptions {
  getSceneCount: () => number;
  getSecondsPerScene: () => number;
  now: () => number;
  onMarksChange: (marks: number[]) => void;
  onProgress: (active: boolean, markedCount: number, sceneCount: number) => void;
}

export class SyncController {
  private active = false;
  private marks: number[] = [];

  constructor(private readonly options: SyncControllerOptions) {}

  get isActive(): boolean {
    return this.active;
  }

  get markedCount(): number {
    return this.marks.length;
  }

  start(): void {
    if (this.active) return;
    this.active = true;
    this.marks = [];
    this.options.onMarksChange([]);
    this.updateProgress();
    if (this.options.getSceneCount() === 0) this.stop();
  }

  mark(): void {
    if (!this.active) return;
    this.marks.push(this.options.now());

    if (this.marks.length >= this.options.getSceneCount()) {
      this.stop();
    } else {
      this.updateProgress();
    }
  }

  stop(): void {
    if (!this.active) return;
    const completed = completeMarks(
      this.marks,
      this.options.getSceneCount(),
      this.options.getSecondsPerScene(),
    );
    this.active = false;
    this.marks = [];
    this.options.onMarksChange(completed);
    this.updateProgress();
  }

  refreshSceneCount(): void {
    if (!this.active) return;
    if (this.marks.length >= this.options.getSceneCount()) {
      this.stop();
      return;
    }
    this.updateProgress();
  }

  private updateProgress(): void {
    this.options.onProgress(
      this.active,
      this.marks.length,
      this.options.getSceneCount(),
    );
  }
}
