import { describe, expect, it, vi } from "vitest";
import { completeMarks, SyncController } from "../../src/sync/sync";

describe("synchronization marks", () => {
  it("fills incomplete marks using the fixed scene interval", () => {
    expect(completeMarks([1, 6], 4, 4)).toEqual([1, 6, 10, 14]);
  });

  it("keeps the recorded marks and fills the remainder when sync is stopped", () => {
    const onMarksChange = vi.fn();
    const onProgress = vi.fn();
    let time = 2;
    const sync = new SyncController({
      getSceneCount: () => 3,
      getSecondsPerScene: () => 4,
      now: () => time,
      onMarksChange,
      onProgress,
    });

    sync.start();
    sync.mark();
    time = 5;
    sync.mark();
    sync.stop();

    expect(sync.isActive).toBe(false);
    expect(onMarksChange).toHaveBeenLastCalledWith([2, 5, 9]);
  });

  it("finishes automatically after the last scene is marked", () => {
    const onMarksChange = vi.fn();
    let time = 0;
    const sync = new SyncController({
      getSceneCount: () => 2,
      getSecondsPerScene: () => 4,
      now: () => time,
      onMarksChange,
      onProgress: vi.fn(),
    });

    sync.start();
    sync.mark();
    time = 3.5;
    sync.mark();

    expect(sync.isActive).toBe(false);
    expect(onMarksChange).toHaveBeenLastCalledWith([0, 3.5]);
  });

  it("leaves marks empty when synchronization is cancelled before the first mark", () => {
    const onMarksChange = vi.fn();
    const sync = new SyncController({
      getSceneCount: () => 2,
      getSecondsPerScene: () => 4,
      now: () => 0,
      onMarksChange,
      onProgress: vi.fn(),
    });

    sync.start();
    sync.stop();

    expect(sync.isActive).toBe(false);
    expect(onMarksChange).toHaveBeenLastCalledWith([]);
  });
});
