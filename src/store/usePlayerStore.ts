"use client";

import { create } from "zustand";
import type { MusicResultItem, TrackItem } from "@/types/music";

interface PlayTrackOptions {
  contextItem?: MusicResultItem;
  queue?: TrackItem[];
}

interface PlayerState {
  currentTrack: TrackItem | null;
  contextItem: MusicResultItem | null;
  queue: TrackItem[];
  queueIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;

  playTrack: (track: TrackItem, options?: PlayTrackOptions) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  playNext: () => Promise<void>;
  playPrev: () => Promise<void>;
  closePlayer: () => void;
}

let audioElement: HTMLAudioElement | null = null;
let listenersBound = false;
let activePlayRequestId = 0;

function getOrCreateAudio(
  get: () => PlayerState,
  set: (partial: Partial<PlayerState>) => void
): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;

  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = "auto";
  }

  if (!listenersBound) {
    listenersBound = true;

    audioElement.addEventListener("loadedmetadata", () => {
      if (!audioElement) return;
      const dur = audioElement.duration;
      if (Number.isFinite(dur) && dur > 0) {
        set({ duration: dur });
      }
    });

    audioElement.addEventListener("timeupdate", () => {
      if (!audioElement) return;
      const dur = audioElement.duration;
      set({
        currentTime: audioElement.currentTime,
        duration: Number.isFinite(dur) && dur > 0 ? dur : get().duration,
      });
    });

    audioElement.addEventListener("playing", () => {
      set({ isPlaying: true, isLoading: false, error: null });
    });

    audioElement.addEventListener("pause", () => {
      set({ isPlaying: false });
    });

    audioElement.addEventListener("ended", () => {
      const { queue, queueIndex, playNext } = get();
      if (queue.length > 1 && queueIndex >= 0 && queueIndex + 1 < queue.length) {
        void playNext();
      } else {
        set({ isPlaying: false, currentTime: 0 });
      }
    });

    audioElement.addEventListener("error", () => {
      const { currentTrack } = get();
      if (!currentTrack) return;
      set({
        isPlaying: false,
        isLoading: false,
        error: "Không thể phát đoạn nghe thử 30s của bài hát này.",
      });
    });
  }

  return audioElement;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  contextItem: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 30,
  volume: 0.85,
  isMuted: false,
  error: null,

  playTrack: async (track, options) => {
    const state = get();

    // Clicking the currently loaded track toggles Play/Pause unless it failed earlier
    if (state.currentTrack?.id === track.id && !state.error && !state.isLoading) {
      await state.togglePlay();
      return;
    }

    const requestId = ++activePlayRequestId;
    const audio = getOrCreateAudio(get, set);
    if (!audio) return;

    const nextContext = options?.contextItem ?? state.contextItem;
    const candidateQueue =
      options?.queue ??
      (options?.contextItem?.tracklist && options.contextItem.tracklist.length > 0
        ? options.contextItem.tracklist
        : state.queue.some((t) => t.id === track.id)
          ? state.queue
          : [track]);

    const foundIdx = candidateQueue.findIndex((t) => t.id === track.id);
    const queue = foundIdx >= 0 ? candidateQueue : [track];
    const queueIndex = foundIdx >= 0 ? foundIdx : 0;

    audio.pause();
    set({
      currentTrack: track,
      contextItem: nextContext ?? null,
      queue,
      queueIndex,
      isPlaying: false,
      isLoading: true,
      currentTime: 0,
      duration: 30,
      error: null,
    });

    let resolvedTrack = track;

    if (!resolvedTrack.previewUrl) {
      try {
        const params = new URLSearchParams({
          artist: resolvedTrack.artistName,
          title: resolvedTrack.title,
        });
        const res = await fetch(`/api/music/preview-fallback?${params.toString()}`);
        if (requestId !== activePlayRequestId) return;

        if (res.ok) {
          const fallback = (await res.json()) as {
            previewUrl?: string | null;
            coverUrl?: string;
          };
          if (fallback.previewUrl) {
            resolvedTrack = {
              ...resolvedTrack,
              previewUrl: fallback.previewUrl,
              coverUrl: resolvedTrack.coverUrl || fallback.coverUrl || "",
            };
            const updatedQueue = queue.map((item, idx) =>
              idx === queueIndex ? resolvedTrack : item
            );
            set({ currentTrack: resolvedTrack, queue: updatedQueue });
          }
        }
      } catch {
        if (requestId !== activePlayRequestId) return;
      }
    }

    if (requestId !== activePlayRequestId) return;

    if (!resolvedTrack.previewUrl) {
      set({
        isPlaying: false,
        isLoading: false,
        error:
          "Bài hát chưa có audio preview 30s. Vui lòng mở trực tiếp trên Deezer / Apple Music.",
      });
      return;
    }

    try {
      audio.src = resolvedTrack.previewUrl;
      audio.currentTime = 0;
      audio.volume = get().isMuted ? 0 : get().volume;
      await audio.play();
    } catch (err) {
      if (requestId !== activePlayRequestId) return;
      const isAutoplayBlocked =
        err instanceof DOMException && err.name === "NotAllowedError";
      set({
        isPlaying: false,
        isLoading: false,
        error: isAutoplayBlocked
          ? "Trình duyệt chặn tự động phát. Hãy bấm Play lại để nghe."
          : "Không thể phát tệp âm thanh nghe thử.",
      });
    }
  },

  togglePlay: async () => {
    const { currentTrack, isPlaying, error, playTrack } = get();
    if (!currentTrack) return;

    if (error || !currentTrack.previewUrl) {
      await playTrack(currentTrack);
      return;
    }

    const audio = getOrCreateAudio(get, set);
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      set({ isPlaying: false });
      return;
    }

    try {
      if (!audio.src) {
        audio.src = currentTrack.previewUrl;
      }
      audio.volume = get().isMuted ? 0 : get().volume;
      await audio.play();
    } catch (err) {
      const isAutoplayBlocked =
        err instanceof DOMException && err.name === "NotAllowedError";
      set({
        isPlaying: false,
        error: isAutoplayBlocked
          ? "Trình duyệt chặn tự động phát. Hãy bấm Play trực tiếp."
          : "Không thể tiếp tục phát nhạc.",
      });
    }
  },

  seek: (seconds) => {
    const audio = getOrCreateAudio(get, set);
    const { duration } = get();
    const maxDuration = duration > 0 ? duration : 30;
    const clamped = Math.max(0, Math.min(maxDuration, seconds));
    if (audio && audio.readyState >= 1) {
      audio.currentTime = clamped;
    }
    set({ currentTime: clamped });
  },

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const audio = getOrCreateAudio(get, set);
    if (audio) {
      audio.volume = clamped;
    }
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted, volume } = get();
    const nextMuted = !isMuted;
    const restoredVolume = volume > 0 ? volume : 0.85;
    const audio = getOrCreateAudio(get, set);
    if (audio) {
      audio.volume = nextMuted ? 0 : restoredVolume;
    }
    set({
      isMuted: nextMuted,
      volume: nextMuted ? volume : restoredVolume,
    });
  },

  playNext: async () => {
    const { queue, queueIndex, contextItem, playTrack } = get();
    if (queueIndex + 1 >= queue.length) return;
    await playTrack(queue[queueIndex + 1], {
      contextItem: contextItem ?? undefined,
      queue,
    });
  },

  playPrev: async () => {
    const { queue, queueIndex, contextItem, currentTime, seek, playTrack } =
      get();
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (queueIndex - 1 < 0) return;
    await playTrack(queue[queueIndex - 1], {
      contextItem: contextItem ?? undefined,
      queue,
    });
  },

  closePlayer: () => {
    activePlayRequestId += 1;
    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
    }
    set({
      currentTrack: null,
      contextItem: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 30,
      error: null,
    });
  },
}));

