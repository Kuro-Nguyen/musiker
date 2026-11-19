"use client";

import * as React from "react";
import Image from "next/image";
import {
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { EqualizerBars } from "@/components/discovery/MusicCard";
import { DEFAULT_QUICK_FILTERS, MOCK_DAILY_PICK } from "@/lib/constants";
import { cn, formatDuration } from "@/lib/utils";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import type {
  DailyPickData,
  MusicResultItem,
  TrackItem,
} from "@/types/music";

interface DailyPickBannerProps {
  activeTrackId: string | null;
  isGlobalPlaying: boolean;
  hydratingId: string | null;
  savedIdSet: Set<string>;
  onPlayItem: (item: MusicResultItem) => void;
  onPlaySpecificTrack: (track: TrackItem, item: MusicResultItem) => void;
  onToggleSave: (item: MusicResultItem) => void;
}

function getLocalDateKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function DailyPickSkeletonCard() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="h-16 w-16 shrink-0 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-24 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
      </div>
      <div className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
    </div>
  );
}

interface DailyPickCardProps {
  badgeLabel: string;
  item: MusicResultItem;
  activeTrackId: string | null;
  isGlobalPlaying: boolean;
  isHydrating: boolean;
  isSaved: boolean;
  onPlayItem: (item: MusicResultItem) => void;
  onPlaySpecificTrack: (track: TrackItem, item: MusicResultItem) => void;
  onToggleSave: (item: MusicResultItem) => void;
}

function DailyPickCard({
  badgeLabel,
  item,
  activeTrackId,
  isGlobalPlaying,
  isHydrating,
  isSaved,
  onPlayItem,
  onPlaySpecificTrack,
  onToggleSave,
}: DailyPickCardProps) {
  const [tracklistOpen, setTracklistOpen] = React.useState(false);

  const sortedTracks = React.useMemo(() => {
    if (!item.tracklist || item.tracklist.length === 0) return [];
    return [...item.tracklist].sort((a, b) => b.rank - a.rank);
  }, [item.tracklist]);

  const topTrackId = sortedTracks[0]?.id ?? item.featuredTrack.id;
  const isItemActive =
    activeTrackId === item.featuredTrack.id ||
    sortedTracks.some((t) => t.id === activeTrackId);
  const isCardPlaying = isItemActive && isGlobalPlaying;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--text-secondary)]/50">
      <div className="flex items-center justify-between gap-3 p-3.5">
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
            {isCardPlaying && (
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
              isCardPlaying
                ? "bg-[#FF5500] text-white"
                : "border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[#FF5500] hover:text-[#FF5500]"
            )}
          >
            {isHydrating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Đang tải...</span>
              </>
            ) : isCardPlaying ? (
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

      {/* Bottom strip: Tracklist toggle for Album or Track info + external link */}
      <div className="flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 px-3.5 py-1.5">
        {item.type === "album" && sortedTracks.length > 0 ? (
          <button
            type="button"
            onClick={() => setTracklistOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)] hover:text-[#FF5500] cursor-pointer"
          >
            <span>Tracklist ({sortedTracks.length} bài)</span>
            {tracklistOpen ? (
              <ChevronUp className="h-3 w-3 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="h-3 w-3 text-[var(--text-secondary)]" />
            )}
          </button>
        ) : (
          <span className="truncate font-mono text-[10px] text-[var(--text-secondary)]">
            {item.featuredTrack.title} • {formatDuration(item.featuredTrack.duration)}
          </span>
        )}

        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <span>Mở ngoài</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      {item.type === "album" && tracklistOpen && sortedTracks.length > 0 && (
        <div className="max-h-44 space-y-1 overflow-y-auto border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2">
          {sortedTracks.map((track, idx) => {
            const isTrackActive = activeTrackId === track.id;
            const isTrackPlaying = isTrackActive && isGlobalPlaying;
            const isTop = track.id === topTrackId;

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onPlaySpecificTrack(track, item)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors cursor-pointer",
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
                  <span className="truncate font-medium">{track.title}</span>
                  {isTop && (
                    <span className="shrink-0 rounded bg-[#FF5500]/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase text-[#FF5500]">
                      Popular
                    </span>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[10px] text-[var(--text-secondary)]">
                  {formatDuration(track.duration)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DailyPickBanner({
  activeTrackId,
  isGlobalPlaying,
  hydratingId,
  savedIdSet,
  onPlayItem,
  onPlaySpecificTrack,
  onToggleSave,
}: DailyPickBannerProps) {
  const { dailyPick, tasteProfile, seenIds, hasHydrated, setDailyPick } =
    usePreferenceStore();

  const [todayDate, setTodayDate] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  const generatingDateRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setTodayDate(getLocalDateKey());
  }, []);

  // Strict daily lock: generate once per YYYY-MM-DD and keep immutable in localStorage until 00:00
  React.useEffect(() => {
    if (!hasHydrated || !todayDate) return;

    const alreadyLockedToday =
      dailyPick?.date === todayDate &&
      Boolean(dailyPick.album) &&
      Boolean(dailyPick.track);

    if (alreadyLockedToday) return;
    if (generatingDateRef.current === todayDate) return;

    generatingDateRef.current = todayDate;
    let cancelled = false;

    const generateDailyPick = async () => {
      setIsGenerating(true);
      try {
        const [albumRes, trackRes] = await Promise.all([
          fetch("/api/music/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tasteProfile,
              filters: { ...DEFAULT_QUICK_FILTERS, entityType: "album" },
              discoveryLevel: 80,
              count: 1,
              seenIds,
            }),
          }),
          fetch("/api/music/discover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tasteProfile,
              filters: { ...DEFAULT_QUICK_FILTERS, entityType: "track" },
              discoveryLevel: 80,
              count: 1,
              seenIds,
            }),
          }),
        ]);

        if (cancelled) return;

        const albumJson = albumRes.ok
          ? ((await albumRes.json()) as { items?: MusicResultItem[] })
          : null;
        const trackJson = trackRes.ok
          ? ((await trackRes.json()) as { items?: MusicResultItem[] })
          : null;

        const pickedAlbum = albumJson?.items?.[0] ?? MOCK_DAILY_PICK.album;
        const pickedTrack = trackJson?.items?.[0] ?? MOCK_DAILY_PICK.track;

        const lockedPick: DailyPickData = {
          date: todayDate,
          album: pickedAlbum,
          track: pickedTrack,
        };
        setDailyPick(lockedPick);
      } catch {
        if (cancelled) return;
        setDailyPick({
          date: todayDate,
          album: MOCK_DAILY_PICK.album,
          track: MOCK_DAILY_PICK.track,
        });
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    };

    void generateDailyPick();

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, todayDate, dailyPick, tasteProfile, seenIds, setDailyPick]);

  const showLoading =
    !hasHydrated ||
    !todayDate ||
    isGenerating ||
    !dailyPick ||
    dailyPick.date !== todayDate;

  return (
    <section
      aria-labelledby="daily-pick-heading"
      className="space-y-3 border-t border-[var(--border-subtle)] pt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF5500]" />
          <h2
            id="daily-pick-heading"
            className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]"
          >
            DAILY PICK • {todayDate || MOCK_DAILY_PICK.date}
          </h2>
        </div>
        <span className="font-mono text-[11px] text-[var(--text-secondary)]">
          DISCOVERY 80% // LOCKED UNTIL 00:00
        </span>
      </div>

      {showLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DailyPickSkeletonCard />
          <DailyPickSkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DailyPickCard
            badgeLabel="Album hôm nay"
            item={dailyPick.album}
            activeTrackId={activeTrackId}
            isGlobalPlaying={isGlobalPlaying}
            isHydrating={hydratingId === dailyPick.album.id}
            isSaved={savedIdSet.has(dailyPick.album.id)}
            onPlayItem={onPlayItem}
            onPlaySpecificTrack={onPlaySpecificTrack}
            onToggleSave={onToggleSave}
          />
          <DailyPickCard
            badgeLabel="Bài hát hôm nay"
            item={dailyPick.track}
            activeTrackId={activeTrackId}
            isGlobalPlaying={isGlobalPlaying}
            isHydrating={hydratingId === dailyPick.track.id}
            isSaved={savedIdSet.has(dailyPick.track.id)}
            onPlayItem={onPlayItem}
            onPlaySpecificTrack={onPlaySpecificTrack}
            onToggleSave={onToggleSave}
          />
        </div>
      )}
    </section>
  );
}
