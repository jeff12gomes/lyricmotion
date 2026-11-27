import type { Resolution } from "../types";

const MIME_TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm",
];

export interface RecorderCallbacks {
  onComplete: (blob: Blob, extension: "mp4" | "webm") => void;
  onCancel: () => void;
  onError: (error: Error) => void;
}

export class VideoRecorder {
  private recorder: MediaRecorder | null = null;
  private videoTracks: MediaStreamTrack[] = [];
  private chunks: Blob[] = [];
  private mimeType = "";
  private cancelled = false;
  private failure: Error | null = null;
  private finalized = false;

  constructor(private readonly callbacks: RecorderCallbacks) {}

  static isSupported(canvas: HTMLCanvasElement): boolean {
    return (
      typeof MediaRecorder !== "undefined" &&
      typeof canvas.captureStream === "function" &&
      this.supportedMimeType() !== null
    );
  }

  get isRecording(): boolean {
    return this.recorder?.state === "recording";
  }

  start(
    canvas: HTMLCanvasElement,
    audioDestination: MediaStreamAudioDestinationNode | null,
    resolution: Resolution,
  ): void {
    const mimeType = VideoRecorder.supportedMimeType();
    if (
      typeof MediaRecorder === "undefined" ||
      typeof canvas.captureStream !== "function" ||
      !mimeType
    ) {
      throw new Error(
        "Este navegador não grava vídeo. Abra no Chrome ou no Edge, no computador.",
      );
    }

    const videoStream = canvas.captureStream(30);
    this.videoTracks = videoStream.getVideoTracks();
    if (this.videoTracks.length === 0) {
      throw new Error("Não foi possível capturar o canvas.");
    }

    try {
      const audioTracks = audioDestination?.stream.getAudioTracks() ?? [];
      const stream = new MediaStream([...this.videoTracks, ...audioTracks]);
      const bitrate = resolution === "1280x720" ? 6_000_000 : 10_000_000;
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate,
      });
      this.recorder = recorder;
      this.mimeType = mimeType;
      this.chunks = [];
      this.cancelled = false;
      this.failure = null;
      this.finalized = false;
      recorder.addEventListener("dataavailable", this.handleData);
      recorder.addEventListener("error", this.handleError, { once: true });
      recorder.addEventListener("stop", this.handleStop, { once: true });
      recorder.start();
    } catch (error) {
      this.stopVideoTracks();
      this.recorder = null;
      throw error;
    }
  }

  finish(): void {
    if (this.recorder?.state === "recording") {
      this.recorder.stop();
    }
  }

  cancel(): void {
    this.cancelled = true;
    if (this.recorder?.state === "recording") {
      this.recorder.stop();
    }
  }

  private readonly handleData = (event: Event): void => {
    if (!(event instanceof BlobEvent) || event.data.size === 0) return;
    this.chunks.push(event.data);
  };

  private readonly handleError = (): void => {
    this.failure = new Error("O navegador encontrou um erro ao gravar o vídeo.");
  };

  private readonly handleStop = (): void => {
    if (this.finalized) return;
    this.finalized = true;
    this.recorder = null;
    this.stopVideoTracks();

    if (this.cancelled) {
      this.chunks = [];
      this.callbacks.onCancel();
      return;
    }
    if (this.failure) {
      this.chunks = [];
      this.callbacks.onError(this.failure);
      return;
    }

    const chunks = this.chunks;
    this.chunks = [];
    const blob = new Blob(chunks, { type: this.mimeType });
    if (blob.size === 0) {
      this.callbacks.onError(new Error("A gravação não produziu um vídeo."));
      return;
    }

    const extension = this.mimeType.includes("mp4") ? "mp4" : "webm";
    this.callbacks.onComplete(blob, extension);
  };

  private stopVideoTracks(): void {
    for (const track of this.videoTracks) {
      track.stop();
    }
    this.videoTracks = [];
  }

  private static supportedMimeType(): string | null {
    if (
      typeof MediaRecorder === "undefined" ||
      typeof MediaRecorder.isTypeSupported !== "function"
    ) {
      return null;
    }
    return MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? null;
  }
}
