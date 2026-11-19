"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  BookmarkCheck,
  Disc3,
  Loader2,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react";
import { ControlPanel } from "@/components/discovery/ControlPanel";
import { EqualizerBars } from "@/components/discovery/MusicCard";
import { ResultGrid } from "@/components/discovery/ResultGrid";
import { Header } from "@/components/layout/Header";
import { MiniPlayer } from "@/components/layout/MiniPlayer";
import { TasteQuizModal } from "@/components/quiz/TasteQuizModal";
import {
  DEFAULT_BATCH_COUNT,
  DEFAULT_DISCOVERY_LEVEL,
  DEFAULT_QUICK_FILTERS,
  DEFAULT_TASTE_PROFILE,
  ENTITY_OPTIONS,
  MOCK_DAILY_PICK,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import type {
  EntityType,
  MusicResultItem,
  QuickFilters,
  TasteProfile,
  TrackItem,
} from "@/types/music";

const LIVE_SEARCH_SUGGESTIONS = [
  "Frank Ocean",
  "Nujabes",
  "Sơn Tùng M-TP",
  "Radiohead",
  "Daft Punk",
];

interface DailyPickItemCardProps {
  badgeLabel: string;
  item: MusicResultItem;
  isPlaying: boolean;
  isHydrating: boolean;
  isSaved: boolean;
  onPlayItem: (item: MusicResultItem) => void;
  onToggleSave: (item: MusicResultItem) => void;
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
          onClick={() => onToggleSave(item)}
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

interface DiscoverApiResult {
  items: MusicResultItem[];
  provider: string;
  meta: {
    candidatePoolSize: number;
    discoveryZone: string;
    hydratedCount: number;
  };
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
  const [autoPlayOnRandom, setAutoPlayOnRandom] =
    React.useState<boolean>(false);
  const [isLiveSearchOpen, setIsLiveSearchOpen] =
    React.useState<boolean>(false);
  const [animationSeed, setAnimationSeed] = React.useState<number>(0);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);
  const [todayDate, setTodayDate] = React.useState<string>(
    MOCK_DAILY_PICK.date
  );

  // Stage 4: Live Discovery Engine State
  const [discoveredItems, setDiscoveredItems] = React.useState<
    MusicResultItem[]
  >([]);
  const [isDiscovering, setIsDiscovering] = React.useState<boolean>(true);
  const [discoverProvider, setDiscoverProvider] = React.useState<string | null>(
    null
  );
  const [discoverPoolSize, setDiscoverPoolSize] = React.useState<number | null>(
    null
  );

  // Stage 2: Collapsible Live API Search & Lazy Hydration state
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

  const discoverReqIdRef = React.useRef<number>(0);
  const hasInitialDiscoveredRef = React.useRef<boolean>(false);

  const {
    tasteProfile,
    savedItems,
    seenIds,
    hasHydrated,
    openQuiz,
    toggleSaveItem,
    addSeenIds,
  } = usePreferenceStore();

  const {
    currentTrack,
    isPlaying: isGlobalPlaying,
    isLoading: isGlobalLoading,
    error: playerError,
    playTrack,
  } = usePlayerStore();

  React.useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setTodayDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  const effectiveTaste = hasHydrated ? tasteProfile : DEFAULT_TASTE_PROFILE;
  const effectiveSeenIds = React.useMemo(
    () => (hasHydrated ? seenIds : []),
    [hasHydrated, seenIds]
  );
  const savedIdSet = React.useMemo(
    () => new Set(hasHydrated ? savedItems.map((item) => item.id) : []),
    [hasHydrated, savedItems]
  );

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
              id: item.id,
              discoveryReason: item.discoveryReason || data.album.discoveryReason,
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

  const runDiscover = React.useCallback(
    async (params?: {
      overrideTaste?: TasteProfile;
      overrideFilters?: QuickFilters;
      overrideLevel?: number;
      overrideCount?: number;
      userInitiated?: boolean;
      noticePrefix?: string;
    }) => {
      const reqId = ++discoverReqIdRef.current;
      const targetTaste = params?.overrideTaste ?? effectiveTaste;
      const targetFilters = params?.overrideFilters ?? filters;
      const targetLevel = params?.overrideLevel ?? discoveryLevel;
      const targetCount = params?.overrideCount ?? batchCount;

      setLiveResults(null);
      setLiveProvider(null);
      setIsDiscovering(true);

      try {
        const res = await fetch("/api/music/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasteProfile: targetTaste,
            filters: targetFilters,
            discoveryLevel: targetLevel,
            count: targetCount,
            seenIds: effectiveSeenIds,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as DiscoverApiResult;
        if (reqId !== discoverReqIdRef.current) return;

        const items = data.items ?? [];
        setDiscoveredItems(items);
        setDiscoverProvider(data.provider ?? "itunes");
        setDiscoverPoolSize(data.meta?.candidatePoolSize ?? null);
        setAnimationSeed((prev) => prev + 1);

        if (items.length > 0) {
          addSeenIds(items.map((item) => item.id));
        }

        if (params?.noticePrefix) {
          setStatusNotice(params.noticePrefix);
        }

        if (params?.userInitiated && autoPlayOnRandom && items.length > 0) {
          void handlePlayItem(items[0]);
        }
      } catch {
        if (reqId !== discoverReqIdRef.current) return;
        setStatusNotice(
          "Không thể kết nối /api/music/discover lúc này. Vui lòng thử lại."
        );
      } finally {
        if (reqId === discoverReqIdRef.current) {
          setIsDiscovering(false);
        }
      }
    },
    [
      effectiveTaste,
      filters,
      discoveryLevel,
      batchCount,
      effectiveSeenIds,
      autoPlayOnRandom,
      addSeenIds,
      handlePlayItem,
    ]
  );

  // Auto-run Discovery Engine once client localStorage hydrates
  React.useEffect(() => {
    if (!hasHydrated || hasInitialDiscoveredRef.current) return;
    hasInitialDiscoveredRef.current = true;
    void runDiscover({ userInitiated: false });
  }, [hasHydrated, runDiscover]);

  const handleRandomize = React.useCallback(() => {
    setStatusNotice(null);
    void runDiscover({ userInitiated: true });
  }, [runDiscover]);

  const handleChangeEntityType = React.useCallback(
    (entityType: EntityType) => {
      const nextFilters: QuickFilters = { ...filters, entityType };
      setFilters(nextFilters);
      setStatusNotice(null);
      void runDiscover({
        overrideFilters: nextFilters,
        userInitiated: false,
      });
    },
    [filters, runDiscover]
  );

  const handleResetFilters = React.useCallback(() => {
    const nextFilters: QuickFilters = {
      ...DEFAULT_QUICK_FILTERS,
      entityType: filters.entityType,
    };
    setFilters(nextFilters);
    void runDiscover({
      overrideFilters: nextFilters,
      userInitiated: false,
    });
  }, [filters.entityType, runDiscover]);

  const handleQuizComplete = React.useCallback(
    (newProfile: TasteProfile) => {
      const names = newProfile.seedArtists.map((a) => a.name).join(", ");
      void runDiscover({
        overrideTaste: newProfile,
        userInitiated: false,
        noticePrefix: `Đã lưu Gu âm nhạc (${names}) và tạo lượt đề xuất mới bằng 2-Hop Graph Engine!`,
      });
    },
    [runDiscover]
  );

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
            `Không tìm thấy kết quả "${trimmed}" theo loại ${typeToRun}.`
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

  const handleBatchCountChange = (next: number) => {
    const clamped = Math.max(1, Math.min(10, next));
    setBatchCount(clamped);
  };

  const displayedResults = React.useMemo(() => {
    const source = liveResults !== null ? liveResults : discoveredItems;
    return source.map((item) => hydratedAlbums[item.id] ?? item);
  }, [liveResults, discoveredItems, hydratedAlbums]);

  const dailyAlbum =
    hydratedAlbums[MOCK_DAILY_PICK.album.id] ?? MOCK_DAILY_PICK.album;
  const dailyTrack =
    hydratedAlbums[MOCK_DAILY_PICK.track.id] ?? MOCK_DAILY_PICK.track;

  const isFeaturedLayout = liveResults === null && batchCount === 1;
  const activeResultsLoading = liveResults !== null ? isSearching : isDiscovering;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Zone 1: Top Navigation Bar (64px) */}
      <Header
        onCrateClick={() => {
          setStatusNotice(
            `Tủ nhạc đã lưu trên localStorage hiện có ${savedIdSet.size} mục. Ngăn kéo SavedCrateDrawer (quản lý & xuất JSON/Text) sẽ hoàn thiện ở Giai đoạn 5.`
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
              2-HOP ENGINE ONLINE
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
              isSaved={savedIdSet.has(dailyAlbum.id)}
              onPlayItem={(item) => void handlePlayItem(item)}
              onToggleSave={toggleSaveItem}
            />
            <DailyPickItemCard
              badgeLabel="Bài hát hôm nay"
              item={dailyTrack}
              isPlaying={
                isGlobalPlaying &&
                currentTrack?.id === dailyTrack.featuredTrack.id
              }
              isHydrating={hydratingId === dailyTrack.id}
              isSaved={savedIdSet.has(dailyTrack.id)}
              onPlayItem={(item) => void handlePlayItem(item)}
              onToggleSave={toggleSaveItem}
            />
          </div>
        </section>

        {/* Zone 3: Discovery Control Panel */}
        <ControlPanel
          filters={filters}
          discoveryLevel={discoveryLevel}
          batchCount={batchCount}
          isDiscovering={isDiscovering}
          autoPlayOnRandom={autoPlayOnRandom}
          isLiveSearchOpen={isLiveSearchOpen}
          tasteProfile={effectiveTaste}
          onChangeEntityType={handleChangeEntityType}
          onChangeFilters={(updater) => setFilters(updater)}
          onResetFilters={handleResetFilters}
          onChangeDiscoveryLevel={setDiscoveryLevel}
          onChangeBatchCount={handleBatchCountChange}
          onToggleAutoPlay={() => setAutoPlayOnRandom((prev) => !prev)}
          onToggleLiveSearch={() => setIsLiveSearchOpen((prev) => !prev)}
          onOpenQuiz={openQuiz}
          onRandomize={handleRandomize}
        />

        {/* Collapsible Live Music Search Strip */}
        <AnimatePresence>
          {isLiveSearchOpen && (
            <motion.section
              aria-label="Tìm kiếm nhạc trực tiếp qua API"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-5">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-[#FF5500]" />
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        Tìm kiếm nhanh Live Music API
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
                        <span>Quay lại Discovery Engine</span>
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
                          <span>Tìm</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                      Gợi ý:
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
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Zone 4: Results Area */}
        <section aria-label="Kết quả khám phá" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Disc3 className="h-4 w-4 text-[#FF5500]" />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                {liveResults !== null
                  ? `LIVE SEARCH RESULTS // ${displayedResults.length} ITEMS`
                  : isFeaturedLayout
                    ? "FEATURED DISCOVERY"
                    : `DISCOVERY GRID // ${displayedResults.length} ITEMS`}
              </h2>
            </div>

            <span className="font-mono text-[11px] uppercase text-[var(--text-secondary)]">
              {liveResults !== null
                ? `LIVE SEARCH // ${liveProvider ?? "ITUNES"}`
                : discoverProvider
                  ? `DISCOVER ENGINE // ${discoverProvider}${discoverPoolSize ? ` (${discoverPoolSize} CANDIDATES)` : ""}`
                  : "DISCOVER ENGINE // INITIALIZING"}
            </span>
          </div>

          <ResultGrid
            items={displayedResults}
            isLoading={activeResultsLoading}
            expectedCount={liveResults !== null ? 4 : batchCount}
            isFeaturedLayout={isFeaturedLayout}
            activeTrackId={currentTrack?.id ?? null}
            isGlobalPlaying={isGlobalPlaying}
            isGlobalLoading={isGlobalLoading}
            playerError={playerError}
            hydratingId={hydratingId}
            savedIdSet={savedIdSet}
            animationKey={`${animationSeed}-${filters.entityType}-${batchCount}`}
            onPlayItem={(item) => void handlePlayItem(item)}
            onPlaySpecificTrack={(track, item) =>
              void handlePlaySpecificTrack(track, item)
            }
            onExpandAlbumTracklist={handleExpandAlbumTracklist}
            onToggleSave={toggleSaveItem}
            onResetEmpty={
              liveResults !== null
                ? handleClearLiveSearch
                : () => void runDiscover({ userInitiated: false })
            }
          />
        </section>
      </main>

      {/* Taste Quiz Modal (5 Steps -> localStorage) */}
      <TasteQuizModal onComplete={handleQuizComplete} />

      {/* Singleton Audio Mini-Player */}
      <MiniPlayer />
    </div>
  );
}
