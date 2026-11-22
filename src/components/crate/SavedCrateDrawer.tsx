"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  Check,
  Cloud,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  Loader2,
  Pause,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { EqualizerBars } from "@/components/discovery/MusicCard";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import { useSavedCrateStore } from "@/store/useSavedCrateStore";
import type { EntityType, MusicResultItem } from "@/types/music";

type CrateFilter = "all" | EntityType;

const FILTER_TABS: Array<{ value: CrateFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "album", label: "Album" },
  { value: "track", label: "Bài hát" },
  { value: "artist", label: "Nghệ sĩ" },
];

function getExportDateSlug(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatCrateAsText(items: MusicResultItem[], dateSlug: string): string {
  const header = `MUZIKER — SAVED CRATE (${dateSlug})\nTổng cộng: ${items.length} mục\n${"=".repeat(44)}`;
  const lines = items.map((item, idx) => {
    const typeLabel =
      item.type === "album"
        ? "ALBUM"
        : item.type === "track"
          ? "TRACK"
          : "ARTIST";
    const metaParts = [item.releaseYear, item.genre].filter(Boolean).join(" • ");
    return [
      `${String(idx + 1).padStart(2, "0")}. [${typeLabel}] ${item.title} — ${item.subtitle}${metaParts ? ` (${metaParts})` : ""}`,
      `    Gợi ý: ${item.discoveryReason}`,
      `    Nghe bản đầy đủ: ${item.externalUrl}`,
    ].join("\n");
  });
  return `${header}\n\n${lines.join("\n\n")}\n`;
}

function downloadFileBlob(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

interface SavedCrateDrawerProps {
  onPlayItem: (item: MusicResultItem) => void;
}

export function SavedCrateDrawer({ onPlayItem }: SavedCrateDrawerProps) {
  const { isCrateOpen, closeCrate } = usePreferenceStore();
  const { user } = useAuthStore();
  const {
    savedItems,
    isSyncing,
    syncError,
    removeSavedItem,
    clearSavedItems,
  } = useSavedCrateStore();
  const { currentTrack, isPlaying, playTrack } = usePlayerStore();

  const [activeFilter, setActiveFilter] = React.useState<CrateFilter>("all");
  const [copied, setCopied] = React.useState<boolean>(false);
  const [confirmClear, setConfirmClear] = React.useState<boolean>(false);

  // Body scroll lock & ESC key handling
  React.useEffect(() => {
    if (!isCrateOpen) {
      setConfirmClear(false);
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCrate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCrateOpen, closeCrate]);

  // Auto-reset 2-step clear confirmation after 4s
  React.useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const filteredItems = React.useMemo(() => {
    if (activeFilter === "all") return savedItems;
    return savedItems.filter((item) => item.type === activeFilter);
  }, [savedItems, activeFilter]);

  const countsByType = React.useMemo(() => {
    return {
      all: savedItems.length,
      album: savedItems.filter((i) => i.type === "album").length,
      track: savedItems.filter((i) => i.type === "track").length,
      artist: savedItems.filter((i) => i.type === "artist").length,
    };
  }, [savedItems]);

  const handlePlayAll = () => {
    if (filteredItems.length === 0) return;
    const queue = filteredItems.map((item) => item.featuredTrack);
    void playTrack(queue[0], {
      contextItem: filteredItems[0],
      queue,
    });
  };

  const handleExportJson = () => {
    const slug = getExportDateSlug();
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        total: savedItems.length,
        items: savedItems,
      },
      null,
      2
    );
    downloadFileBlob(
      payload,
      `muziker-crate-${slug}.json`,
      "application/json;charset=utf-8"
    );
  };

  const handleExportText = () => {
    const slug = getExportDateSlug();
    const text = formatCrateAsText(savedItems, slug);
    downloadFileBlob(
      text,
      `muziker-crate-${slug}.txt`,
      "text/plain;charset=utf-8"
    );
  };

  const handleCopyText = async () => {
    const slug = getExportDateSlug();
    const text = formatCrateAsText(savedItems, slug);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored gracefully
    }
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearSavedItems();
    setConfirmClear(false);
  };

  return (
    <AnimatePresence>
      {isCrateOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="saved-crate-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCrate();
          }}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="flex h-dvh w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="border-b border-[var(--border-subtle)] px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-3.5 sm:px-5 sm:py-4">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Archive className="h-4 w-4 shrink-0 text-[#FF5500]" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2
                        id="saved-crate-title"
                        className="truncate font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] sm:tracking-[0.14em]"
                      >
                        SAVED CRATE // {savedItems.length}
                      </h2>
                      {isSyncing ? (
                        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-[#FF5500]" />
                      ) : (
                        <span
                          title="Đồng bộ Cloud Firestore"
                          className="inline-flex items-center gap-0.5 rounded bg-emerald-500/12 px-1 py-0.5 font-mono text-[9px] font-semibold text-emerald-600 dark:text-emerald-400"
                        >
                          <Cloud className="h-2.5 w-2.5" />
                          <span>SYNC</span>
                        </span>
                      )}
                    </div>
                    {user?.email && (
                      <p className="truncate font-mono text-[10px] text-[var(--text-secondary)]">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {filteredItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handlePlayAll}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#FF5500] px-3 text-xs font-semibold text-white hover:bg-[#E64D00] cursor-pointer sm:h-8"
                    >
                      <Play className="h-3 w-3" />
                      <span>Phát tất cả</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeCrate}
                    aria-label="Đóng tủ nhạc"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer sm:h-8 sm:w-8"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1">
                {FILTER_TABS.map((tab) => {
                  const active = activeFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setActiveFilter(tab.value)}
                      className={cn(
                        "whitespace-nowrap rounded-md px-1 py-2 text-[11px] font-semibold transition-colors cursor-pointer sm:px-2 sm:py-1.5",
                        active
                          ? "bg-[var(--accent-primary)] text-[var(--accent-foreground)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {tab.label}{" "}
                      <span className="font-mono text-[10px] opacity-75">
                        ({countsByType[tab.value]})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saved Items List */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 sm:px-5 sm:py-4">
              {syncError && (
                <div className="mb-3 rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                  {syncError}
                </div>
              )}
              {filteredItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 p-8 text-center">
                  <Archive className="h-8 w-8 text-[var(--text-secondary)] opacity-60" />
                  <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                    {savedItems.length === 0
                      ? "Tủ nhạc của bạn đang trống"
                      : "Không có mục nào thuộc nhóm này"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Bấm biểu tượng lưu trên bất kỳ Album, Bài hát hoặc Daily Pick nào để lưu lại thưởng thức sau.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredItems.map((item) => {
                    const isItemActive =
                      currentTrack?.id === item.featuredTrack.id ||
                      Boolean(
                        item.tracklist?.some((t) => t.id === currentTrack?.id)
                      );
                    const isItemPlaying = isItemActive && isPlaying;
                    const typeBadge =
                      item.type === "album"
                        ? "ALBUM"
                        : item.type === "track"
                          ? "TRACK"
                          : "ARTIST";

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2.5 transition-colors hover:border-[var(--text-secondary)]/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                            <Image
                              src={item.coverUrl}
                              alt={`${item.title} - ${item.subtitle}`}
                              fill
                              sizes="56px"
                              unoptimized
                              className="object-cover"
                            />
                            {isItemPlaying && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                                <EqualizerBars />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[var(--text-secondary)]">
                                {typeBadge}
                              </span>
                              {item.releaseYear && (
                                <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                                  {item.releaseYear}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs font-semibold text-[var(--text-primary)]">
                              {item.title}
                            </p>
                            <p className="truncate text-[11px] text-[var(--text-secondary)]">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onPlayItem(item)}
                            aria-label={
                              isItemPlaying ? "Tạm dừng" : `Nghe thử ${item.title}`
                            }
                            className={cn(
                              "inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors cursor-pointer sm:h-8 sm:w-8",
                              isItemActive
                                ? "border-[#FF5500] bg-[#FF5500] text-white"
                                : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[#FF5500] hover:text-[#FF5500]"
                            )}
                          >
                            {isItemPlaying ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="ml-0.5 h-3.5 w-3.5" />
                            )}
                          </button>

                          <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Mở ${item.title} trên nền tảng gốc`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:h-8 sm:w-8"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() => removeSavedItem(item.id)}
                            aria-label={`Xóa ${item.title} khỏi tủ nhạc`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-red-500/50 hover:text-red-500 cursor-pointer sm:h-8 sm:w-8"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer: 3 Export Modes & Clear All */}
            {savedItems.length > 0 && (
              <div className="space-y-2.5 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/70 px-4 pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:space-y-3 sm:px-5 sm:py-4">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs font-medium text-[var(--text-primary)] hover:border-[#FF5500] hover:text-[#FF5500] cursor-pointer sm:h-9"
                  >
                    <FileJson className="h-3.5 w-3.5" />
                    <span>JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportText}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs font-medium text-[var(--text-primary)] hover:border-[#FF5500] hover:text-[#FF5500] cursor-pointer sm:h-9"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>TXT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyText()}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 text-xs font-medium text-[var(--text-primary)] hover:border-[#FF5500] hover:text-[#FF5500] cursor-pointer sm:h-9"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#FF5500]" />
                        <span className="text-[#FF5500]">Đã copy</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className={cn(
                    "flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer sm:h-9",
                    confirmClear
                      ? "border-red-500 bg-red-500/15 text-red-500"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-red-500/40 hover:text-red-500"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {confirmClear
                      ? "Bấm lần nữa để xác nhận xóa toàn bộ"
                      : "Xóa toàn bộ tủ nhạc"}
                  </span>
                </button>
              </div>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
