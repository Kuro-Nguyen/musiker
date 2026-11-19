"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import { cn, formatDuration } from "@/lib/utils";
import type { MusicResultItem, TrackItem } from "@/types/music";

function buildSaveableResultItem(
  track: TrackItem,
  contextItem: MusicResultItem | null
): MusicResultItem {
  if (contextItem) return contextItem;
  return {
    id: track.albumId ?? track.id,
    type: track.albumId ? "album" : "track",
    title: track.albumTitle ?? track.title,
    subtitle: track.artistName,
    coverUrl: track.coverUrl,
    popularityScore: 75,
    discoveryReason: "Lưu từ trình phát nhạc 30s",
    featuredTrack: track,
    externalUrl: "https://www.deezer.com",
  };
}

export function MiniPlayer() {
  const {
    currentTrack,
    contextItem,
    queue,
    queueIndex,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    playNext,
    playPrev,
    closePlayer,
  } = usePlayerStore();
  const { savedItems, hasHydrated, toggleSaveItem } = usePreferenceStore();

  const effectiveDuration = duration > 0 ? duration : 30;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / effectiveDuration) * 100)
  );
  const volumePercent = Math.round((isMuted ? 0 : volume) * 100);

  const saveTargetId =
    contextItem?.id ?? currentTrack?.albumId ?? currentTrack?.id ?? "";
  const isSaved = Boolean(
    hasHydrated &&
      saveTargetId &&
      savedItems.some((item) => item.id === saveTargetId)
  );

  const handleSave = () => {
    if (!currentTrack) return;
    toggleSaveItem(buildSaveableResultItem(currentTrack, contextItem));
  };

  const hasQueue = queue.length > 1;
  const canPrev = currentTime > 3 || queueIndex > 0;
  const canNext = hasQueue && queueIndex >= 0 && queueIndex + 1 < queue.length;

  const renderScrubber = (compact = false) => (
    <div
      className={cn(
        "flex flex-1 items-center",
        compact ? "gap-2" : "gap-2.5"
      )}
    >
      <span className="w-8 shrink-0 text-right font-mono text-[10px] text-[var(--text-secondary)] sm:w-9 sm:text-[11px]">
        {formatDuration(currentTime)}
      </span>
      <input
        type="range"
        min={0}
        max={effectiveDuration}
        step={0.1}
        value={Math.min(currentTime, effectiveDuration)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Thanh tiến trình 30 giây"
        className="muziker-slider"
        style={{
          background: `linear-gradient(to right, #FF5500 0%, #FF5500 ${progressPercent}%, var(--border-subtle) ${progressPercent}%, var(--border-subtle) 100%)`,
        }}
      />
      <span className="w-8 shrink-0 font-mono text-[10px] text-[var(--text-secondary)] sm:w-9 sm:text-[11px]">
        {formatDuration(effectiveDuration)}
      </span>
    </div>
  );

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.aside
          aria-label="Trình phát nhạc nghe thử 30 giây"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] lg:pb-0"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-3 pt-2 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-3">
            {/* Row 1 (All screens): Cover + Metadata + Mobile Primary Controls */}
            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3 lg:w-[32%]">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] sm:h-12 sm:w-12">
                {currentTrack.coverUrl && (
                  <Image
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    fill
                    sizes="48px"
                    unoptimized
                    className="object-cover"
                  />
                )}
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-3.5 items-end gap-[2px]"
                    >
                      <span className="eq-bar-1 h-full w-[3px] rounded-full bg-[#FF5500]" />
                      <span className="eq-bar-2 h-full w-[3px] rounded-full bg-[#FF5500]" />
                      <span className="eq-bar-3 h-full w-[3px] rounded-full bg-[#FF5500]" />
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
                    {currentTrack.title}
                  </p>
                  {hasQueue && queueIndex >= 0 && (
                    <span className="hidden shrink-0 rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)] sm:inline-block">
                      {String(queueIndex + 1).padStart(2, "0")}/
                      {String(queue.length).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {error ? (
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="truncate text-[11px] font-medium text-[#FF5500] sm:text-xs">
                      {error}
                    </p>
                    {contextItem?.externalUrl && (
                      <a
                        href={contextItem.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] underline text-[var(--text-primary)]"
                      >
                        <span>Mở ngoài</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="truncate text-[11px] text-[var(--text-secondary)] sm:text-xs">
                    {currentTrack.artistName}
                    {currentTrack.albumTitle
                      ? ` • ${currentTrack.albumTitle}`
                      : ""}
                  </p>
                )}
              </div>

              {/* Mobile Compact Action Cluster (Spotify-like) */}
              <div className="flex shrink-0 items-center gap-1 lg:hidden">
                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  aria-label={isPlaying ? "Tạm dừng" : "Phát"}
                  className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5500] text-white shadow-sm active:scale-95 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void playNext()}
                  disabled={!canNext}
                  aria-label="Bài tiếp theo"
                  className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={closePlayer}
                  aria-label="Đóng trình phát nhạc"
                  className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Row 2 (Mobile < lg): Prev + Slim 30s Scrubber + Save */}
            <div className="flex items-center gap-1.5 py-0.5 lg:hidden">
              <button
                type="button"
                onClick={() => void playPrev()}
                disabled={!canPrev}
                aria-label="Bài trước"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>

              {renderScrubber(true)}

              {saveTargetId && (
                <button
                  type="button"
                  onClick={handleSave}
                  aria-label={isSaved ? "Bỏ khỏi tủ nhạc" : "Lưu vào tủ"}
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors cursor-pointer",
                    isSaved
                      ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-[#FF5500]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                  )}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Center (Desktop lg+): Controls + 30s Scrubbing Bar */}
            <div className="hidden flex-1 items-center gap-3 lg:flex">
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void playPrev()}
                  disabled={!canPrev}
                  aria-label="Bài trước"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => void togglePlay()}
                  aria-label={isPlaying ? "Tạm dừng" : "Phát"}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5500] text-white shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="ml-0.5 h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => void playNext()}
                  disabled={!canNext}
                  aria-label="Bài tiếp theo"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
              </div>

              {renderScrubber(false)}
            </div>

            {/* Right: Volume + Save to Crate + Close (Desktop) */}
            <div className="hidden shrink-0 items-center gap-3 lg:flex lg:w-[24%] lg:justify-end">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-[#FF5500]" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label="Âm lượng"
                  className="muziker-slider !w-20"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${volumePercent}%, var(--border-subtle) ${volumePercent}%, var(--border-subtle) 100%)`,
                  }}
                />
              </div>

              {saveTargetId && (
                <button
                  type="button"
                  onClick={handleSave}
                  aria-label={isSaved ? "Bỏ khỏi tủ nhạc" : "Lưu vào tủ"}
                  title={isSaved ? "Đã lưu vào Crate" : "Lưu vào Crate"}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer",
                    isSaved
                      ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-[#FF5500]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" />
                  )}
                  <span>{isSaved ? "Đã lưu" : "Lưu"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={closePlayer}
                aria-label="Đóng trình phát nhạc"
                title="Đóng trình phát"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

