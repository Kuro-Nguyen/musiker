"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Disc3,
  ExternalLink,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MiniPlayer } from "@/components/layout/MiniPlayer";
import {
  BATCH_COUNT_PRESETS,
  DEFAULT_BATCH_COUNT,
  DEFAULT_DISCOVERY_LEVEL,
  DEFAULT_QUICK_FILTERS,
  ENTITY_OPTIONS,
  ERA_OPTIONS,
  MOCK_DAILY_PICK,
  MOCK_DISCOVERY_RESULTS,
  MOOD_OPTIONS,
  POPULARITY_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/constants";
import { cn, formatDuration, getDiscoveryLevelMeta } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";
import type {
  EntityType,
  MusicResultItem,
  QuickFilters,
  TrackItem,
} from "@/types/music";

const LIVE_SEARCH_SUGGESTIONS = [
  "Frank Ocean",
  "Nujabes",
  "Sơn Tùng M-TP",
  "Radiohead",
  "Daft Punk",
];

function EqualizerBars({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex h-3.5 items-end gap-[2px]", className)}
    >
      <span className="eq-bar-1 h-full w-[3px] rounded-full bg-[#FF5500]" />
      <span className="eq-bar-2 h-full w-[3px] rounded-full bg-[#FF5500]" />
      <span className="eq-bar-3 h-full w-[3px] rounded-full bg-[#FF5500]" />
    </span>
  );
}

function buildPreviewBatch(
  entityType: EntityType,
  count: number,
  seed: number
): MusicResultItem[] {
  const pool = MOCK_DISCOVERY_RESULTS.filter((item) => item.type === entityType);
  const source = pool.length > 0 ? pool : MOCK_DISCOVERY_RESULTS;
  const shifted = source.map(
    (_, idx) => source[(idx + seed) % source.length]
  );

  const results: MusicResultItem[] = [];
  for (let i = 0; i < count; i += 1) {
    results.push(shifted[i % shifted.length]);
  }
  return results;
}

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 text-xs font-medium text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--text-secondary)] focus:border-[#FF5500] cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface DailyPickItemCardProps {
  badgeLabel: string;
  item: MusicResultItem;
  isPlaying: boolean;
  isHydrating: boolean;
  isSaved: boolean;
  onPlayItem: (item: MusicResultItem) => void;
  onToggleSave: (id: string) => void;
}

function DailyPickItemCard({
  badgeLabel,
  item,
  isPlaying,
  isHydrating,
  isSaved,
  onPlayItem,
  onToggleSave,
}: DailyPickItemCardProps) {
  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 transition-colors hover:border-[var(--text-secondary)]/50">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <Image
            src={item.coverUrl}
            alt={`${item.title} - ${item.subtitle}`}
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
              <EqualizerBars />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
              {badgeLabel}
            </span>
            {item.releaseYear && (
              <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                {item.releaseYear}
              </span>
            )}
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
            {item.title}
          </h3>
          <p className="truncate text-xs text-[var(--text-secondary)]">
            {item.subtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPlayItem(item)}
          disabled={isHydrating}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer disabled:opacity-70",
            isPlaying
              ? "bg-[#FF5500] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[#FF5500] hover:text-[#FF5500]"
          )}
        >
          {isHydrating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="hidden sm:inline">Đang tải...</span>
            </>
          ) : isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tạm dừng</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nghe thử ngay</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => onToggleSave(item.id)}
          aria-label={isSaved ? "Bỏ khỏi tủ nhạc" : "Lưu vào tủ"}
          title={isSaved ? "Đã lưu vào tủ" : "Lưu vào tủ"}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer",
            isSaved
              ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-[#FF5500]"
              : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

interface ResultCardProps {
  item: MusicResultItem;
  featured?: boolean;
  activeTrackId: string | null;
  isGlobalPlaying: boolean;
  isGlobalLoading: boolean;
  isHydratingAlbum: boolean;
  isSaved: boolean;
  onPlayItem: (item: MusicResultItem) => void;
  onPlaySpecificTrack: (track: TrackItem, item: MusicResultItem) => void;
  onExpandAlbumTracklist: (item: MusicResultItem) => Promise<void>;
  onToggleSave: (id: string) => void;
}

function ResultCard({
  item,
  featured = false,
  activeTrackId,
  isGlobalPlaying,
  isGlobalLoading,
  isHydratingAlbum,
  isSaved,
  onPlayItem,
  onPlaySpecificTrack,
  onExpandAlbumTracklist,
  onToggleSave,
}: ResultCardProps) {
  const [tracklistOpen, setTracklistOpen] = React.useState(featured);

  React.useEffect(() => {
    setTracklistOpen(featured);
  }, [featured, item.id]);

  const sortedTracks = React.useMemo(() => {
    if (!item.tracklist || item.tracklist.length === 0) return [];
    return [...item.tracklist].sort((a, b) => b.rank - a.rank);
  }, [item.tracklist]);

  const topTrackId = sortedTracks[0]?.id ?? item.featuredTrack.id;
  const isTrackInCardActive =
    activeTrackId === item.featuredTrack.id ||
    sortedTracks.some((t) => t.id === activeTrackId);

  const isCardPlaying = isTrackInCardActive && isGlobalPlaying;
  const isCardBusy =
    isHydratingAlbum || (isTrackInCardActive && isGlobalLoading);

  const entityBadge =
    item.type === "album"
      ? "ALBUM"
      : item.type === "track"
        ? "TRACK"
        : "ARTIST";

  const handleToggleTracklist = () => {
    const nextOpen = !tracklistOpen;
    setTracklistOpen(nextOpen);
    if (nextOpen) {
      void onExpandAlbumTracklist(item);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors",
        featured ? "mx-auto max-w-4xl md:flex-row" : "h-full"
      )}
    >
      {/* Square Cover Artwork */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-[var(--bg-elevated)]",
          featured
            ? "aspect-square w-full border-b border-[var(--border-subtle)] md:w-[340px] md:border-b-0 md:border-r"
            : "aspect-square w-full border-b border-[var(--border-subtle)]"
        )}
      >
        <Image
          src={item.coverUrl}
          alt={`${item.title} - ${item.subtitle}`}
          fill
          sizes={
            featured
              ? "(max-width: 768px) 100vw, 340px"
              : "(max-width: 640px) 100vw, 320px"
          }
          unoptimized
          className="object-cover"
        />

        {/* Top-left Metadata Pill */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[10px] font-medium tracking-wider text-white backdrop-blur-sm">
            {entityBadge}
          </span>
          {item.releaseYear && (
            <span className="rounded-md border border-white/15 bg-black/75 px-2 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-sm">
              {item.releaseYear}
            </span>
          )}
        </div>

        {/* Equalizer Overlay when Playing */}
        {isCardPlaying && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md border border-white/15 bg-black/80 px-2 py-1 backdrop-blur-sm">
            <EqualizerBars />
            <span className="font-mono text-[10px] font-medium text-white">
              PLAYING
            </span>
          </div>
        )}

        {/* Floating Play/Pause Button */}
        <button
          type="button"
          onClick={() => onPlayItem(item)}
          disabled={isHydratingAlbum}
          aria-label={isCardPlaying ? "Tạm dừng" : "Nghe thử"}
          className={cn(
            "absolute bottom-3 right-3 inline-flex h-11 w-11 items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-80",
            isTrackInCardActive
              ? "bg-[#FF5500] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
          )}
        >
          {isCardBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isCardPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="ml-0.5 h-4 w-4" />
          )}
        </button>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-semibold tracking-tight text-[var(--text-primary)]",
                  featured ? "text-xl sm:text-2xl" : "truncate text-base"
                )}
              >
                {item.title}
              </h3>
              <p className="mt-0.5 truncate text-sm text-[var(--text-secondary)]">
                {item.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleSave(item.id)}
              aria-label={isSaved ? "Bỏ khỏi tủ nhạc" : "Lưu vào tủ"}
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer",
                isSaved
                  ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-[#FF5500]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Technical Spec Row */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.genre && (
              <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
                {item.genre}
              </span>
            )}
            <span className="rounded-md bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
              POP {item.popularityScore}/100
            </span>
          </div>

          {/* Discovery Reason */}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FF5500]" />
            <span>{item.discoveryReason}</span>
          </p>

          {/* Featured Track Pill */}
          <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => onPlayItem(item)}
                disabled={isHydratingAlbum}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FF5500] text-white cursor-pointer disabled:opacity-70"
                aria-label={`Phát ${item.featuredTrack.title}`}
              >
                {isCardBusy ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : activeTrackId === item.featuredTrack.id && isGlobalPlaying ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="ml-0.5 h-3 w-3" />
                )}
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {item.featuredTrack.title}
                </p>
                <p className="font-mono text-[10px] text-[var(--text-secondary)]">
                  FEATURED • 0:30 PREVIEW
                </p>
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-[var(--text-secondary)]">
              {formatDuration(item.featuredTrack.duration)}
            </span>
          </div>

          {/* Album Tracklist Section */}
          {item.type === "album" && (
            <div className="mt-4">
              {!featured && (
                <button
                  type="button"
                  onClick={handleToggleTracklist}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>
                      {sortedTracks.length > 0
                        ? `Tracklist (${sortedTracks.length} bài)`
                        : "Xem Tracklist Album"}
                    </span>
                    {isHydratingAlbum && (
                      <Loader2 className="h-3 w-3 animate-spin text-[#FF5500]" />
                    )}
                  </span>
                  {tracklistOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  )}
                </button>
              )}

              {tracklistOpen && sortedTracks.length > 0 && (
                <div
                  className={cn(
                    "space-y-1",
                    !featured &&
                      "mt-2 max-h-60 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2"
                  )}
                >
                  {featured && (
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                        Tracklist ({sortedTracks.length} bài nổi bật)
                      </span>
                      {isHydratingAlbum && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF5500]" />
                      )}
                    </div>
                  )}
                  {sortedTracks.map((track, idx) => {
                    const isTrackActive = activeTrackId === track.id;
                    const isTrackPlaying = isTrackActive && isGlobalPlaying;
                    const isTopTrack = track.id === topTrackId;

                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => onPlaySpecificTrack(track, item)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer",
                          isTrackActive
                            ? "bg-[#FF5500]/12 text-[#FF5500]"
                            : "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-4 shrink-0 font-mono text-[10px] text-[var(--text-secondary)]">
                            {isTrackPlaying ? (
                              <EqualizerBars className="h-3" />
                            ) : (
                              String(idx + 1).padStart(2, "0")
                            )}
                          </span>
                          <span className="truncate font-medium">
                            {track.title}
                          </span>
                          {isTopTrack && (
                            <span className="shrink-0 rounded bg-[#FF5500]/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#FF5500]">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[11px] text-[var(--text-secondary)]">
                          {formatDuration(track.duration)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            {item.type === "album" ? "ALBUM-FIRST MODE" : "DIRECT STREAM"}
          </span>
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <span>Nghe bản đầy đủ</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [filters, setFilters] = React.useState<QuickFilters>(
    DEFAULT_QUICK_FILTERS
  );
  const [discoveryLevel, setDiscoveryLevel] = React.useState<number>(
    DEFAULT_DISCOVERY_LEVEL
  );
  const [batchCount, setBatchCount] = React.useState<number>(
    DEFAULT_BATCH_COUNT
  );
  const [shuffleSeed, setShuffleSeed] = React.useState<number>(0);
  const [tasteCompleted, setTasteCompleted] = React.useState<boolean>(false);
  const [savedIds, setSavedIds] = React.useState<string[]>([]);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);
  const [todayDate, setTodayDate] = React.useState<string>(
    MOCK_DAILY_PICK.date
  );

  // Stage 2: Live API Search & Album Hydration state
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchType, setSearchType] = React.useState<EntityType>("album");
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  const [liveResults, setLiveResults] = React.useState<MusicResultItem[] | null>(
    null
  );
  const [liveProvider, setLiveProvider] = React.useState<string | null>(null);
  const [hydratedAlbums, setHydratedAlbums] = React.useState<
    Record<string, MusicResultItem>
  >({});
  const [hydratingId, setHydratingId] = React.useState<string | null>(null);

  const {
    currentTrack,
    isPlaying: isGlobalPlaying,
    isLoading: isGlobalLoading,
    playTrack,
  } = usePlayerStore();

  React.useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setTodayDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const discoveryMeta = getDiscoveryLevelMeta(discoveryLevel);

  const previewBatch = React.useMemo(
    () => buildPreviewBatch(filters.entityType, batchCount, shuffleSeed),
    [filters.entityType, batchCount, shuffleSeed]
  );

  const displayedResults = React.useMemo(() => {
    const source = liveResults !== null ? liveResults : previewBatch;
    return source.map((item) => hydratedAlbums[item.id] ?? item);
  }, [liveResults, previewBatch, hydratedAlbums]);

  const dailyAlbum = hydratedAlbums[MOCK_DAILY_PICK.album.id] ?? MOCK_DAILY_PICK.album;
  const dailyTrack = hydratedAlbums[MOCK_DAILY_PICK.track.id] ?? MOCK_DAILY_PICK.track;

  const hydrateAlbum = React.useCallback(
    async (item: MusicResultItem): Promise<MusicResultItem> => {
      if (item.type !== "album") return item;
      const existing = hydratedAlbums[item.id];
      if (
        existing?.tracklist &&
        existing.tracklist.some((t) => Boolean(t.previewUrl))
      ) {
        return existing;
      }

      if (
        item.tracklist &&
        item.tracklist.some((t) => Boolean(t.previewUrl))
      ) {
        return item;
      }

      setHydratingId(item.id);
      try {
        const params = new URLSearchParams({
          title: item.title,
          artist: item.subtitle,
        });
        const res = await fetch(
          `/api/music/album/${encodeURIComponent(item.id)}?${params.toString()}`
        );
        if (res.ok) {
          const data = (await res.json()) as {
            album?: MusicResultItem;
            provider?: string;
          };
          if (data.album) {
            const merged: MusicResultItem = {
              ...data.album,
              // Keep initial item ID key so UI mapping & saved state stay stable
              id: item.id,
              discoveryReason: item.id.startsWith("mock-")
                ? `${item.discoveryReason} • ${data.album.tracklist?.length ?? 0} bài (${data.provider?.toUpperCase()})`
                : data.album.discoveryReason,
            };
            setHydratedAlbums((prev) => ({
              ...prev,
              [item.id]: merged,
            }));
            return merged;
          }
        }
      } catch {
        // Fallback smoothly to single track preview
      } finally {
        setHydratingId((curr) => (curr === item.id ? null : curr));
      }

      return item;
    },
    [hydratedAlbums]
  );

  const handlePlayItem = React.useCallback(
    async (item: MusicResultItem) => {
      let resolvedItem = item;
      if (
        item.type === "album" &&
        (!item.tracklist || !item.tracklist.some((t) => Boolean(t.previewUrl)))
      ) {
        resolvedItem = await hydrateAlbum(item);
      }

      await playTrack(resolvedItem.featuredTrack, {
        contextItem: resolvedItem,
        queue: resolvedItem.tracklist,
      });
    },
    [hydrateAlbum, playTrack]
  );

  const handlePlaySpecificTrack = React.useCallback(
    async (track: TrackItem, item: MusicResultItem) => {
      const resolvedItem = hydratedAlbums[item.id] ?? item;
      await playTrack(track, {
        contextItem: resolvedItem,
        queue: resolvedItem.tracklist,
      });
    },
    [hydratedAlbums, playTrack]
  );

  const handleExpandAlbumTracklist = React.useCallback(
    async (item: MusicResultItem) => {
      await hydrateAlbum(item);
    },
    [hydrateAlbum]
  );

  const runLiveSearch = React.useCallback(
    async (queryToRun: string, typeToRun: EntityType) => {
      const trimmed = queryToRun.trim();
      if (!trimmed) {
        setLiveResults(null);
        setLiveProvider(null);
        return;
      }

      setIsSearching(true);
      setStatusNotice(null);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          type: typeToRun,
          limit: "8",
        });
        const res = await fetch(`/api/music/search?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Search failed");
        }
        const data = (await res.json()) as {
          items?: MusicResultItem[];
          provider?: string;
        };
        const items = data.items ?? [];
        setLiveResults(items);
        setLiveProvider(data.provider ?? "itunes");

        if (items.length === 0) {
          setStatusNotice(
            `Không tìm thấy kết quả "${trimmed}" theo loại ${typeToRun}. Thử từ khóa khác nhé.`
          );
        }
      } catch {
        setStatusNotice("Lỗi kết nối khi gọi /api/music/search.");
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runLiveSearch(searchQuery, searchType);
  };

  const handleClearLiveSearch = () => {
    setSearchQuery("");
    setLiveResults(null);
    setLiveProvider(null);
    setStatusNotice(null);
  };

  const handleRandomize = React.useCallback(() => {
    setLiveResults(null);
    setLiveProvider(null);
    setShuffleSeed((prev) => prev + 1);
    setStatusNotice(
      `Đã tạo ${batchCount} gợi ý ${filters.entityType.toUpperCase()} ở mức khám phá ${discoveryLevel}%. Bấm Play để nghe âm thanh 30s thật từ API!`
    );
  }, [batchCount, filters.entityType, discoveryLevel]);

  // Keyboard shortcut: Space or R triggers Randomize when not focused on form inputs
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        tag === "button" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space" || event.key.toLowerCase() === "r") {
        event.preventDefault();
        handleRandomize();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRandomize]);

  const handleToggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchCountChange = (next: number) => {
    const clamped = Math.max(1, Math.min(10, next));
    setBatchCount(clamped);
  };

  const isSingleFeatured =
    liveResults === null && batchCount === 1 && displayedResults.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Zone 1: Top Navigation Bar (64px) */}
      <Header
        tasteCompleted={tasteCompleted}
        savedCount={savedIds.length}
        onQuizClick={() => {
          setTasteCompleted((prev) => !prev);
          setStatusNotice(
            !tasteCompleted
              ? "Preview: Đã đánh dấu thiết lập Gu âm nhạc. Modal Taste Quiz 5 bước sẽ được triển khai ở Giai đoạn 3."
              : "Preview: Đã đặt lại trạng thái chưa làm trắc nghiệm gu."
          );
        }}
        onCrateClick={() => {
          setStatusNotice(
            `Tủ nhạc đã lưu hiện có ${savedIds.length} mục. SavedCrateDrawer sẽ hoàn thiện ở Giai đoạn 5.`
          );
        }}
      />

      <main
        className={cn(
          "mx-auto max-w-7xl space-y-8 px-4 pt-6 sm:px-6 lg:px-8",
          currentTrack ? "pb-36 sm:pb-28" : "pb-20"
        )}
      >
        {/* Status Banner */}
        {statusNotice && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FF5500]/30 bg-[#FF5500]/8 px-4 py-2.5 text-xs text-[var(--text-primary)]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF5500]" />
              <span>{statusNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="shrink-0 font-mono text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              [ĐÓNG]
            </button>
          </div>
        )}

        {/* Zone 2: Hero / Daily Pick Strip */}
        <section aria-labelledby="daily-pick-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF5500]" />
              <h2
                id="daily-pick-heading"
                className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
              >
                DAILY PICK • {todayDate}
              </h2>
            </div>
            <span className="font-mono text-[11px] text-[var(--text-secondary)]">
              LIVE AUDIO PREVIEW ENABLED
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DailyPickItemCard
              badgeLabel="Album hôm nay"
              item={dailyAlbum}
              isPlaying={
                isGlobalPlaying &&
                (currentTrack?.id === dailyAlbum.featuredTrack.id ||
                  Boolean(
                    dailyAlbum.tracklist?.some((t) => t.id === currentTrack?.id)
                  ))
              }
              isHydrating={hydratingId === dailyAlbum.id}
              isSaved={savedIds.includes(dailyAlbum.id)}
              onPlayItem={(item) => void handlePlayItem(item)}
              onToggleSave={handleToggleSave}
            />
            <DailyPickItemCard
              badgeLabel="Bài hát hôm nay"
              item={dailyTrack}
              isPlaying={
                isGlobalPlaying &&
                currentTrack?.id === dailyTrack.featuredTrack.id
              }
              isHydrating={hydratingId === dailyTrack.id}
              isSaved={savedIds.includes(dailyTrack.id)}
              onPlayItem={(item) => void handlePlayItem(item)}
              onToggleSave={handleToggleSave}
            />
          </div>
        </section>

        {/* Zone 3: Discovery Control Box */}
        <section
          aria-label="Bảng điều khiển khám phá âm nhạc"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6"
        >
          {/* Row 1: Entity Segmented Control + Quick Filters */}
          <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                Loại nội dung
              </span>
              <div
                role="tablist"
                aria-label="Chọn loại nội dung"
                className="inline-flex rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1"
              >
                {ENTITY_OPTIONS.map((option) => {
                  const active = filters.entityType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setLiveResults(null);
                        setFilters((prev) => ({
                          ...prev,
                          entityType: option.value,
                        }));
                      }}
                      className={cn(
                        "rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                        active
                          ? "bg-[var(--accent-primary)] text-[var(--accent-foreground)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FilterSelect
                label="Vùng / Ngôn ngữ"
                value={filters.region}
                options={REGION_OPTIONS}
                onChange={(region) =>
                  setFilters((prev) => ({ ...prev, region }))
                }
              />
              <FilterSelect
                label="Tâm trạng"
                value={filters.mood}
                options={MOOD_OPTIONS}
                onChange={(mood) => setFilters((prev) => ({ ...prev, mood }))}
              />
              <FilterSelect
                label="Độ nổi tiếng"
                value={filters.popularity}
                options={POPULARITY_OPTIONS}
                onChange={(popularity) =>
                  setFilters((prev) => ({ ...prev, popularity }))
                }
              />
              <FilterSelect
                label="Thập kỷ"
                value={filters.era}
                options={ERA_OPTIONS}
                onChange={(era) => setFilters((prev) => ({ ...prev, era }))}
              />
            </div>
          </div>

          {/* Row 2: Discovery Slider (65%) + Batch Count (35%) */}
          <div className="flex flex-col gap-6 py-5 lg:flex-row lg:items-center lg:gap-8">
            <div className="w-full space-y-3 lg:w-[65%]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[#FF5500]" />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    Độ Khám Phá (Discovery Slider)
                  </span>
                  <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--text-secondary)]">
                    {discoveryMeta.badge}
                  </span>
                </div>
                <span className="font-mono text-lg font-bold tracking-tight text-[#FF5500]">
                  {discoveryLevel}%
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={discoveryLevel}
                onChange={(e) => setDiscoveryLevel(Number(e.target.value))}
                aria-label="Thanh trượt độ khám phá"
                className="musiker-slider"
                style={{
                  background: `linear-gradient(to right, #FF5500 0%, #FF5500 ${discoveryLevel}%, var(--border-subtle) ${discoveryLevel}%, var(--border-subtle) 100%)`,
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {discoveryMeta.title}:
                  </span>{" "}
                  {discoveryMeta.description}
                </p>
                <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--text-secondary)]">
                  <span>0%</span>
                  <span>25%</span>
                  <span>60%</span>
                  <span className="font-semibold text-[#FF5500]">80%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2.5 border-t border-[var(--border-subtle)] pt-4 lg:w-[35%] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Số lượng kết quả
                </span>
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  {batchCount} / 10
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                  <button
                    type="button"
                    onClick={() => handleBatchCountChange(batchCount - 1)}
                    disabled={batchCount <= 1}
                    aria-label="Giảm số lượng"
                    className="inline-flex h-9 w-9 items-center justify-center text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-9 text-center font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {batchCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBatchCountChange(batchCount + 1)}
                    disabled={batchCount >= 10}
                    aria-label="Tăng số lượng"
                    className="inline-flex h-9 w-9 items-center justify-center text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {BATCH_COUNT_PRESETS.map((preset) => {
                    const active = batchCount === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setLiveResults(null);
                          setBatchCount(preset);
                        }}
                        className={cn(
                          "h-9 min-w-[36px] rounded-lg border px-2 font-mono text-xs font-semibold transition-colors cursor-pointer",
                          active
                            ? "border-[#FF5500] bg-[#FF5500]/12 text-[#FF5500]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Primary Randomize CTA */}
          <div className="flex flex-col items-center gap-2.5 border-t border-[var(--border-subtle)] pt-5">
            <button
              type="button"
              onClick={handleRandomize}
              className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FF5500] px-6 text-sm font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-[#E64D00] active:scale-[0.99] sm:w-auto sm:min-w-[280px] cursor-pointer"
            >
              <Shuffle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              <span>Randomize</span>
              <span className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] font-medium">
                {filters.entityType.toUpperCase()} × {batchCount}
              </span>
            </button>

            <p className="font-mono text-[11px] text-[var(--text-secondary)]">
              Nhấn{" "}
              <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)]">
                Space
              </kbd>{" "}
              hoặc{" "}
              <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)]">
                R
              </kbd>{" "}
              để Random
            </p>
          </div>
        </section>

        {/* Stage 2: Live API Search & Audio Verification Strip */}
        <section
          aria-label="Tìm kiếm nhạc trực tiếp qua API"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Tìm kiếm Live Music API
                </span>
                <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                  /api/music/search
                </span>
              </div>
              {liveResults !== null && (
                <button
                  type="button"
                  onClick={handleClearLiveSearch}
                  className="inline-flex items-center gap-1 font-mono text-[11px] text-[#FF5500] hover:underline cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  <span>Quay lại Discovery mẫu</span>
                </button>
              )}
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-col gap-2.5 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm Album, Bài hát hoặc Nghệ sĩ thật (VD: Frank Ocean, Nujabes, Sơn Tùng M-TP)..."
                  aria-label="Từ khóa tìm kiếm nhạc"
                  className="h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] pl-3.5 pr-9 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[#FF5500]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearLiveSearch}
                    aria-label="Xóa từ khóa"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="inline-flex shrink-0 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1">
                {ENTITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSearchType(option.value);
                      if (searchQuery.trim()) {
                        void runLiveSearch(searchQuery, option.value);
                      }
                    }}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer",
                      searchType === option.value
                        ? "bg-[var(--accent-primary)] text-[var(--accent-foreground)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-3.5 w-3.5" />
                    <span>Tìm qua API</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                Thử nhanh:
              </span>
              {LIVE_SEARCH_SUGGESTIONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip);
                    void runLiveSearch(chip, searchType);
                  }}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] transition-colors hover:border-[#FF5500] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Zone 4: Results Area */}
        <section aria-label="Kết quả khám phá" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Disc3 className="h-4 w-4 text-[#FF5500]" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                {liveResults !== null
                  ? `LIVE SEARCH RESULTS // ${displayedResults.length} ITEMS`
                  : isSingleFeatured
                    ? "FEATURED DISCOVERY"
                    : `DISCOVERY GRID // ${displayedResults.length} ITEMS`}
              </h2>
            </div>
            <span className="font-mono text-[11px] uppercase text-[var(--text-secondary)]">
              {liveProvider
                ? `LIVE API // ${liveProvider}`
                : "AUDIO ENGINE READY"}
            </span>
          </div>

          {displayedResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-12 text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Không có kết quả nào khớp với từ khóa tìm kiếm.
              </p>
              <button
                type="button"
                onClick={handleClearLiveSearch}
                className="mt-3 rounded-lg bg-[#FF5500] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                Quay lại gợi ý mặc định
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {isSingleFeatured ? (
                <motion.div
                  key={`featured-${displayedResults[0].id}-${shuffleSeed}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <ResultCard
                    item={displayedResults[0]}
                    featured
                    activeTrackId={currentTrack?.id ?? null}
                    isGlobalPlaying={isGlobalPlaying}
                    isGlobalLoading={isGlobalLoading}
                    isHydratingAlbum={hydratingId === displayedResults[0].id}
                    isSaved={savedIds.includes(displayedResults[0].id)}
                    onPlayItem={(item) => void handlePlayItem(item)}
                    onPlaySpecificTrack={(track, item) =>
                      void handlePlaySpecificTrack(track, item)
                    }
                    onExpandAlbumTracklist={handleExpandAlbumTracklist}
                    onToggleSave={handleToggleSave}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`grid-${liveResults ? "live" : filters.entityType}-${displayedResults.length}-${shuffleSeed}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {displayedResults.map((item, idx) => (
                    <motion.div
                      key={`${item.id}-${idx}-${shuffleSeed}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.24,
                        delay: Math.min(idx * 0.04, 0.32),
                        ease: "easeOut",
                      }}
                    >
                      <ResultCard
                        item={item}
                        activeTrackId={currentTrack?.id ?? null}
                        isGlobalPlaying={isGlobalPlaying}
                        isGlobalLoading={isGlobalLoading}
                        isHydratingAlbum={hydratingId === item.id}
                        isSaved={savedIds.includes(item.id)}
                        onPlayItem={(target) => void handlePlayItem(target)}
                        onPlaySpecificTrack={(track, target) =>
                          void handlePlaySpecificTrack(track, target)
                        }
                        onExpandAlbumTracklist={handleExpandAlbumTracklist}
                        onToggleSave={handleToggleSave}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>

      {/* Singleton Audio Mini-Player */}
      <MiniPlayer savedIds={savedIds} onToggleSave={handleToggleSave} />
    </div>
  );
}
