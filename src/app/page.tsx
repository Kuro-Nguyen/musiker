"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Disc3,
  Loader2,
  Minus,
  Plus,
  Search,
  Shuffle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { SavedCrateDrawer } from "@/components/crate/SavedCrateDrawer";
import { AuthModal } from "@/components/auth/AuthModal";
import { ControlPanel } from "@/components/discovery/ControlPanel";
import { DailyPickBanner } from "@/components/discovery/DailyPickBanner";
import { ResultGrid } from "@/components/discovery/ResultGrid";
import { Header } from "@/components/layout/Header";
import { MiniPlayer } from "@/components/layout/MiniPlayer";
import { TasteQuizModal } from "@/components/quiz/TasteQuizModal";
import {
  BATCH_COUNT_PRESETS,
  DEFAULT_BATCH_COUNT,
  DEFAULT_DISCOVERY_LEVEL,
  DEFAULT_QUICK_FILTERS,
  DEFAULT_TASTE_PROFILE,
  ENTITY_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import { useSavedCrateStore } from "@/store/useSavedCrateStore";
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] =
    React.useState<boolean>(false);
  const [animationSeed, setAnimationSeed] = React.useState<number>(0);
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null);
  const controlsSectionRef = React.useRef<HTMLDivElement | null>(null);

  // Stage 4: Live Discovery Engine State
  const [discoveredItems, setDiscoveredItems] = React.useState<
    MusicResultItem[]
  >([]);
  const [isDiscovering, setIsDiscovering] = React.useState<boolean>(true);

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
    seenIds,
    hasHydrated,
    isQuizOpen,
    isCrateOpen,
    openQuiz,
    addSeenIds,
  } = usePreferenceStore();
  const { user, isAuthModalOpen } = useAuthStore();
  const {
    savedItems,
    toastMessage: crateToastMessage,
    clearToast: clearCrateToast,
    requestToggleSaveItem,
  } = useSavedCrateStore();

  const {
    currentTrack,
    isPlaying: isGlobalPlaying,
    isLoading: isGlobalLoading,
    error: playerError,
    playTrack,
  } = usePlayerStore();

  React.useEffect(() => {
    if (!crateToastMessage) return;
    setStatusNotice(crateToastMessage);
    clearCrateToast();
  }, [crateToastMessage, clearCrateToast]);

  const effectiveTaste = hasHydrated ? tasteProfile : DEFAULT_TASTE_PROFILE;
  const effectiveSeenIds = React.useMemo(
    () => (hasHydrated ? seenIds : []),
    [hasHydrated, seenIds]
  );
  const savedIdSet = React.useMemo(
    () => new Set(user ? savedItems.map((item) => item.id) : []),
    [user, savedItems]
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
          "Không thể tải gợi ý âm nhạc lúc này. Vui lòng thử lại."
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
        noticePrefix: `Đã lưu Gu âm nhạc (${names}) và cập nhật gợi ý mới dành cho bạn!`,
      });
    },
    [runDiscover]
  );

  // Keyboard shortcut: Space or R triggers Randomize when modals/drawers & inputs are inactive
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isQuizOpen || isCrateOpen || isAuthModalOpen) return;

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
  }, [handleRandomize, isQuizOpen, isCrateOpen, isAuthModalOpen]);

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
        setStatusNotice("Không thể tìm kiếm lúc này. Vui lòng thử lại.");
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

  const handleQuickBatchPreset = (preset: number) => {
    setBatchCount(preset);
    setStatusNotice(null);
    void runDiscover({
      overrideCount: preset,
      userInitiated: false,
    });
  };

  const displayedResults = React.useMemo(() => {
    const source = liveResults !== null ? liveResults : discoveredItems;
    return source.map((item) => hydratedAlbums[item.id] ?? item);
  }, [liveResults, discoveredItems, hydratedAlbums]);

  const isFeaturedLayout = liveResults === null && batchCount === 1;
  const activeResultsLoading = liveResults !== null ? isSearching : isDiscovering;
  const activeFilterCount = [
    filters.region !== "all",
    filters.mood !== "all",
    filters.popularity !== "all",
    filters.era !== "all",
    discoveryLevel !== DEFAULT_DISCOVERY_LEVEL,
  ].filter(Boolean).length;

  const handleOpenMobileFilters = () => {
    setIsMobileFiltersOpen((prev) => {
      const next = !prev;
      if (next) {
        window.requestAnimationFrame(() => {
          controlsSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Zone 1: Top Navigation Bar */}
      <Header />

      <main
        className={cn(
          "mx-auto max-w-7xl space-y-5 px-3 pt-4 sm:space-y-8 sm:px-6 sm:pt-6 lg:px-8",
          currentTrack ? "pb-36 sm:pb-28" : "pb-16"
        )}
      >
        {/* Status Banner */}
        {statusNotice && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FF5500]/30 bg-[#FF5500]/8 px-3.5 py-2.5 text-xs text-[var(--text-primary)] sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#FF5500]" />
              <span className="min-w-0 break-words">{statusNotice}</span>
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

        {/* Zone 1 (Top Priority): Quick Action Bar + Results Area */}
        <section aria-label="Kết quả khám phá" className="space-y-3.5 sm:space-y-4">
          {/* Quick Action Bar right above results */}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start sm:gap-2.5">
              <div className="flex items-center gap-2">
                <Disc3 className="h-4 w-4 shrink-0 text-[#FF5500]" />
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  {liveResults !== null
                    ? `KẾT QUẢ TÌM KIẾM // ${displayedResults.length}`
                    : isFeaturedLayout
                      ? "ĐỀ XUẤT NỔI BẬT"
                      : `KHÁM PHÁ // ${displayedResults.length} MỤC`}
                </h2>
              </div>
              <span className="rounded bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--text-secondary)]">
                {liveResults !== null
                  ? liveProvider === "hybrid"
                    ? "SPOTIFY & APPLE"
                    : liveProvider === "spotify"
                      ? "SPOTIFY"
                      : liveProvider === "deezer"
                        ? "DEEZER"
                        : "APPLE MUSIC"
                  : `KHÁM PHÁ ${discoveryLevel}%`}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              {/* Quick Entity Switcher */}
              <div
                role="tablist"
                aria-label="Chọn nhanh loại nội dung"
                className="grid w-full grid-cols-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1 sm:inline-flex sm:w-auto sm:p-0.5"
              >
                {ENTITY_OPTIONS.map((option) => {
                  const active = filters.entityType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleChangeEntityType(option.value)}
                      className={cn(
                        "min-h-9 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer sm:min-h-0 sm:text-[11px]",
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

              {/* Count Controls + Mobile Filters / Search Shortcut */}
              <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                    <button
                      type="button"
                      onClick={() => handleBatchCountChange(batchCount - 1)}
                      disabled={batchCount <= 1}
                      aria-label="Giảm số lượng nhanh"
                      className="inline-flex h-9 w-8 items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-35 cursor-pointer sm:h-8 sm:w-7"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-semibold text-[var(--text-primary)]">
                      {batchCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBatchCountChange(batchCount + 1)}
                      disabled={batchCount >= 10}
                      aria-label="Tăng số lượng nhanh"
                      className="inline-flex h-9 w-8 items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-35 cursor-pointer sm:h-8 sm:w-7"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {BATCH_COUNT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleQuickBatchPreset(preset)}
                        className={cn(
                          "h-9 min-w-[32px] rounded-lg border px-1.5 font-mono text-[11px] font-semibold transition-colors cursor-pointer sm:h-8 sm:min-w-[30px]",
                          batchCount === preset
                            ? "border-[#FF5500] bg-[#FF5500]/12 text-[#FF5500]"
                            : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile-only Filter Drawer Toggle (< lg) */}
                <div className="flex items-center gap-1.5 lg:hidden">
                  <button
                    type="button"
                    onClick={handleOpenMobileFilters}
                    aria-expanded={isMobileFiltersOpen}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium transition-colors cursor-pointer",
                      isMobileFiltersOpen || activeFilterCount > 0
                        ? "border-[#FF5500]/50 bg-[#FF5500]/10 text-[#FF5500]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Bộ lọc</span>
                    {activeFilterCount > 0 && (
                      <span className="rounded bg-[#FF5500] px-1 font-mono text-[10px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Randomize CTA + Desktop Filter Jump */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRandomize}
                  disabled={isDiscovering}
                  className="group inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#FF5500] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E64D00] active:scale-[0.99] disabled:opacity-75 cursor-pointer sm:h-8 sm:flex-none sm:px-3.5"
                >
                  {isDiscovering ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Shuffle className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
                  )}
                  <span>Randomize</span>
                  <kbd className="hidden rounded bg-black/20 px-1 py-0.5 font-mono text-[9px] md:inline">
                    SPACE
                  </kbd>
                </button>

                <a
                  href="#controls-panel"
                  className="hidden h-8 items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:inline-flex"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Bộ lọc &amp; Gu</span>
                </a>
              </div>
            </div>
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
            onToggleSave={(item) => void requestToggleSaveItem(item)}
            onResetEmpty={
              liveResults !== null
                ? handleClearLiveSearch
                : () => void runDiscover({ userInitiated: false })
            }
          />
        </section>

        {/* Zone 2: Detailed Control Panel & Live Search */}
        <div
          id="controls-panel"
          ref={controlsSectionRef}
          className="scroll-mt-20 space-y-4"
        >
          <ControlPanel
            filters={filters}
            discoveryLevel={discoveryLevel}
            batchCount={batchCount}
            isDiscovering={isDiscovering}
            autoPlayOnRandom={autoPlayOnRandom}
            isLiveSearchOpen={isLiveSearchOpen}
            tasteProfile={effectiveTaste}
            isMobileExpanded={isMobileFiltersOpen}
            onToggleMobileExpanded={() =>
              setIsMobileFiltersOpen((prev) => !prev)
            }
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
                aria-label="Tìm kiếm nhạc"
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
                          Tìm kiếm nhanh Album, Bài hát & Nghệ sĩ
                        </span>
                      </div>
                      {liveResults !== null && (
                        <button
                          type="button"
                          onClick={handleClearLiveSearch}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#FF5500] hover:underline cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                          <span>Quay lại khám phá ngẫu nhiên</span>
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
                          placeholder="Tìm Album, Bài hát hoặc Nghệ sĩ (VD: Frank Ocean, Nujabes, Sơn Tùng M-TP)..."
                          aria-label="Từ khóa tìm kiếm nhạc"
                          className="h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] pl-3.5 pr-10 text-base text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[#FF5500] sm:h-10 sm:pr-9 sm:text-xs"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={handleClearLiveSearch}
                            aria-label="Xóa từ khóa"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer sm:right-2.5"
                          >
                            <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid shrink-0 grid-cols-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1 sm:inline-flex">
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
                              "min-h-9 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer sm:min-h-0 sm:text-[11px]",
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
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed sm:h-10"
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
        </div>

        {/* Zone 3 (Bottom): Daily Pick Strip (Locked per YYYY-MM-DD) */}
        <DailyPickBanner
          activeTrackId={currentTrack?.id ?? null}
          isGlobalPlaying={isGlobalPlaying}
          hydratingId={hydratingId}
          savedIdSet={savedIdSet}
          onPlayItem={(item) => void handlePlayItem(item)}
          onPlaySpecificTrack={(track, item) =>
            void handlePlaySpecificTrack(track, item)
          }
          onToggleSave={(item) => void requestToggleSaveItem(item)}
        />
      </main>

      {/* Taste Quiz Modal (5 Steps -> localStorage) */}
      <TasteQuizModal onComplete={handleQuizComplete} />

      {/* Auth Modal (Firebase Google Sign-In & Email/Password) */}
      <AuthModal />

      {/* Saved Crate Drawer (Play All + JSON/TXT/Copy Export) */}
      <SavedCrateDrawer onPlayItem={(item) => void handlePlayItem(item)} />

      {/* Singleton Audio Mini-Player */}
      <MiniPlayer />
    </div>
  );
}
