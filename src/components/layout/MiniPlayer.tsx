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
import { cn, formatDuration } from "@/lib/utils";

interface MiniPlayerProps {
  savedIds?: string[];
  onToggleSave?: (id: string) => void;
}

export function MiniPlayer({
  savedIds = [],
  onToggleSave,
}: MiniPlayerProps) {
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

  const effectiveDuration = duration > 0 ? duration : 30;
  const progressPercent = Math.min(
    100,
    Math.max(0, (currentTime / effectiveDuration) * 100)
  );
  const volumePercent = Math.round((isMuted ? 0 : volume) * 100);

  const saveTargetId =
    contextItem?.id ?? currentTrack?.albumId ?? currentTrack?.id ?? "";
  const isSaved = Boolean(saveTargetId && savedIds.includes(saveTargetId));

  const hasQueue = queue.length > 1;
  const canPrev = currentTime > 3 || queueIndex > 0;
  const canNext = hasQueue && queueIndex >= 0 && queueIndex + 1 < queue.length;

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.aside
          aria-label="Trình phát nhạc nghe thử 30 giây"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8">
            {/* Left: Cover 48x48 + Metadata */}
            <div className="flex min-w-0 items-center gap-3 lg:w-[32%]">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
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
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
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
                    <p className="truncate text-xs font-medium text-[#FF5500]">
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
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    {currentTrack.artistName}
                    {currentTrack.albumTitle
                      ? ` • ${currentTrack.albumTitle}`
                      : ""}
                  </p>
                )}
              </div>

              {/* Mobile quick actions */}
              <div className="flex items-center gap-1 lg:hidden">
                {onToggleSave && saveTargetId && (
                  <button
                    type="button"
                    onClick={() => onToggleSave(saveTargetId)}
                    aria-label={isSaved ? "Bỏ khỏi tủ nhạc" : "Lưu vào tủ"}
                    className={cn(
                      "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer",
                      isSaved
                        ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-[#FF5500]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    )}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4" />
                    ) : (
                      <Bookmark className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closePlayer}
                  aria-label="Đóng trình phát nhạc"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Center: Controls + 30s Scrubbing Bar */}
            <div className="flex flex-1 items-center gap-3">
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

              {/* Scrubbing Progress Bar */}
              <div className="flex flex-1 items-center gap-2.5">
                <span className="w-9 shrink-0 text-right font-mono text-[11px] text-[var(--text-secondary)]">
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
                  className="musiker-slider"
                  style={{
                    background: `linear-gradient(to right, #FF5500 0%, #FF5500 ${progressPercent}%, var(--border-subtle) ${progressPercent}%, var(--border-subtle) 100%)`,
                  }}
                />
                <span className="w-9 shrink-0 font-mono text-[11px] text-[var(--text-secondary)]">
                  {formatDuration(effectiveDuration)}
                </span>
              </div>
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
                  className="musiker-slider !w-20"
                  style={{
                    background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${volumePercent}%, var(--border-subtle) ${volumePercent}%, var(--border-subtle) 100%)`,
                  }}
                />
              </div>

              {onToggleSave && saveTargetId && (
                <button
                  type="button"
                  onClick={() => onToggleSave(saveTargetId)}
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

