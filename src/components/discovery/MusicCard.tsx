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
  Sparkles,
} from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import type { MusicResultItem, TrackItem } from "@/types/music";

export type MusicCardVariant = "featured" | "medium" | "compact";

function getExternalSourceLabel(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("spotify.com")) return "Spotify";
  if (lower.includes("apple.com")) return "Apple Music";
  return "Deezer";
}

export function EqualizerBars({ className }: { className?: string }) {
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

interface TracklistPanelProps {
  tracks: TrackItem[];
  topTrackId: string;
  activeTrackId: string | null;
  isGlobalPlaying: boolean;
  isHydratingAlbum: boolean;
  showHeader?: boolean;
  maxHeightClass?: string;
  onSelectTrack: (track: TrackItem) => void;
}

function TracklistPanel({
  tracks,
  topTrackId,
  activeTrackId,
  isGlobalPlaying,
  isHydratingAlbum,
  showHeader = false,
  maxHeightClass = "max-h-52",
  onSelectTrack,
}: TracklistPanelProps) {
  if (tracks.length === 0) return null;

  return (
    <div className="space-y-1">
      {showHeader && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            Tracklist ({tracks.length} bài nổi bật)
          </span>
          {isHydratingAlbum && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF5500]" />
          )}
        </div>
      )}
      <div className={cn("space-y-1 overflow-y-auto pr-1", maxHeightClass)}>
        {tracks.map((track, idx) => {
          const isTrackActive = activeTrackId === track.id;
          const isTrackPlaying = isTrackActive && isGlobalPlaying;
          const isTopTrack = track.id === topTrackId;

          return (
            <button
              key={track.id}
              type="button"
              onClick={() => onSelectTrack(track)}
              className={cn(
                "flex min-h-[40px] w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors cursor-pointer sm:min-h-0 sm:py-1.5",
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
                {isTopTrack && (
                  <span className="shrink-0 rounded bg-[#FF5500]/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[#FF5500]">
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
    </div>
  );
}

interface MusicCardProps {
  item: MusicResultItem;
  variant?: MusicCardVariant;
  featured?: boolean;
  activeTrackId: string | null;
  isGlobalPlaying: boolean;
  isGlobalLoading: boolean;
  isHydratingAlbum: boolean;
  playerError?: string | null;
  isSaved: boolean;
  onPlayItem: (item: MusicResultItem) => void;
  onPlaySpecificTrack: (track: TrackItem, item: MusicResultItem) => void;
  onExpandAlbumTracklist: (item: MusicResultItem) => Promise<void>;
  onToggleSave: (item: MusicResultItem) => void;
}

export function MusicCard({
  item,
  variant,
  featured = false,
  activeTrackId,
  isGlobalPlaying,
  isGlobalLoading,
  isHydratingAlbum,
  playerError,
  isSaved,
  onPlayItem,
  onPlaySpecificTrack,
  onExpandAlbumTracklist,
  onToggleSave,
}: MusicCardProps) {
  const resolvedVariant: MusicCardVariant =
    variant ?? (featured ? "featured" : "medium");
  const isFeatured = resolvedVariant === "featured";
  const isCompact = resolvedVariant === "compact";

  const [tracklistOpen, setTracklistOpen] = React.useState(isFeatured);

  React.useEffect(() => {
    setTracklistOpen(isFeatured);
  }, [isFeatured, item.id]);

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

  const hasAnyHydratedPreview =
    Boolean(item.featuredTrack.previewUrl) ||
    sortedTracks.some((t) => Boolean(t.previewUrl));

  const isHydrationFinishedWithoutPreview =
    (item.type !== "album" || sortedTracks.length > 0) &&
    !hasAnyHydratedPreview;

  const showNoPreviewFallback =
    !isCardBusy &&
    (isHydrationFinishedWithoutPreview ||
      (isTrackInCardActive && Boolean(playerError)));

  const entityBadge =
    item.type === "album"
      ? "ALBUM"
      : item.type === "track"
        ? "TRACK"
        : "ARTIST";
  const externalSourceLabel = getExternalSourceLabel(item.externalUrl);

  const handleToggleTracklist = () => {
    const nextOpen = !tracklistOpen;
    setTracklistOpen(nextOpen);
    if (nextOpen) {
      void onExpandAlbumTracklist(item);
    }
  };

  const renderFloatingPlayTrigger = (compactSize = false) => {
    if (showNoPreviewFallback) {
      return (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Mở trên ${externalSourceLabel}`}
          aria-label={`Mở trên ${externalSourceLabel}`}
          className={cn(
            "absolute bottom-1.5 right-1.5 inline-flex items-center justify-center rounded-full bg-black/80 text-[#FF5500] shadow transition-transform hover:scale-105",
            compactSize
              ? "h-9 w-9 sm:h-8 sm:w-8"
              : "bottom-2.5 right-2.5 h-9 gap-1.5 border border-white/20 px-3 text-[11px] font-medium text-white backdrop-blur-sm"
          )}
        >
          <ExternalLink className="h-3.5 w-3.5 text-[#FF5500]" />
          {!compactSize && <span>Mở ngoài</span>}
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onPlayItem(item)}
        disabled={isHydratingAlbum}
        aria-label={isCardPlaying ? "Tạm dừng" : "Nghe thử"}
        className={cn(
          "absolute inline-flex items-center justify-center rounded-full shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-80",
          compactSize
            ? "bottom-1.5 right-1.5 h-9 w-9 sm:h-8 sm:w-8"
            : "bottom-2.5 right-2.5 h-10 w-10",
          isTrackInCardActive
            ? "bg-[#FF5500] text-white"
            : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
        )}
      >
        {isCardBusy ? (
          <Loader2 className={compactSize ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} />
        ) : isCardPlaying ? (
          <Pause className={compactSize ? "h-3.5 w-3.5" : "h-4 w-4"} />
        ) : (
          <Play className={compactSize ? "ml-0.5 h-3.5 w-3.5" : "ml-0.5 h-4 w-4"} />
        )}
      </button>
    );
  };

  const renderBookmarkButton = (compactSize = false) => (
    <button
      type="button"
      onClick={() => onToggleSave(item)}
      aria-label={isSaved ? "Bỏ khỏi tủ nhạc" : "Lưu vào tủ"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center border transition-colors cursor-pointer",
        compactSize
          ? "h-9 w-9 rounded-md sm:h-7 sm:w-7"
          : "h-10 w-10 rounded-lg sm:h-8 sm:w-8",
        isSaved
          ? "border-[#FF5500]/40 bg-[#FF5500]/10 text-[#FF5500]"
          : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      )}
    >
      {isSaved ? (
        <BookmarkCheck className={compactSize ? "h-3.5 w-3.5" : "h-4 w-4"} />
      ) : (
        <Bookmark className={compactSize ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
    </button>
  );

  // Horizontal Compact Density for 4-10 results
  if (isCompact) {
    return (
      <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors hover:border-[var(--text-secondary)]/50">
        <div className="flex items-start gap-3 p-3">
          {/* 88x88 Square Artwork */}
          <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <Image
              src={item.coverUrl}
              alt={`${item.title} - ${item.subtitle}`}
              fill
              sizes="88px"
              unoptimized
              className="object-cover"
            />
            {isCardPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <EqualizerBars />
              </div>
            )}

            {renderFloatingPlayTrigger(true)}
          </div>

          {/* Right Info Column */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {entityBadge}
                </span>
                {item.releaseYear && (
                  <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {item.releaseYear}
                  </span>
                )}
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                  • POP {item.popularityScore}
                </span>
              </div>

              {renderBookmarkButton(true)}
            </div>

            <h3 className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {item.title}
            </h3>
            <p className="truncate text-xs text-[var(--text-secondary)]">
              {item.subtitle}
              {item.genre ? ` • ${item.genre}` : ""}
            </p>
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-[var(--text-secondary)]">
              <Sparkles className="h-3 w-3 shrink-0 text-[#FF5500]" />
              <span className="truncate">{item.discoveryReason}</span>
            </p>
          </div>
        </div>

        {/* Bottom Compact Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/60 px-3 py-2 sm:py-1.5">
          {item.type === "album" ? (
            <button
              type="button"
              onClick={handleToggleTracklist}
              className="inline-flex min-h-8 items-center gap-1.5 text-[11px] font-medium text-[var(--text-primary)] hover:text-[#FF5500] cursor-pointer sm:min-h-0"
            >
              <span>
                {sortedTracks.length > 0
                  ? `Tracklist (${sortedTracks.length} bài)`
                  : "Xem Tracklist"}
              </span>
              {isHydratingAlbum ? (
                <Loader2 className="h-3 w-3 animate-spin text-[#FF5500]" />
              ) : tracklistOpen ? (
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
            className="inline-flex min-h-8 shrink-0 items-center gap-1 font-mono text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:min-h-0"
          >
            <span>Mở ngoài</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>

        {item.type === "album" && tracklistOpen && sortedTracks.length > 0 && (
          <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2">
            <TracklistPanel
              tracks={sortedTracks}
              topTrackId={topTrackId}
              activeTrackId={activeTrackId}
              isGlobalPlaying={isGlobalPlaying}
              isHydratingAlbum={isHydratingAlbum}
              maxHeightClass="max-h-44"
              onSelectTrack={(track) => onPlaySpecificTrack(track, item)}
            />
          </div>
        )}
      </div>
    );
  }

  // Featured (count === 1) & Medium (count === 2-3) Cards
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-colors",
        isFeatured ? "mx-auto max-w-3xl md:flex-row" : "h-full"
      )}
    >
      {/* Mobile Compact Hero Row for Featured Card (< md) so Cover + Title + Play + Tracklist fit above the fold */}
      {isFeatured && (
        <div className="flex items-start gap-3 border-b border-[var(--border-subtle)] p-3.5 md:hidden">
          <div className="relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
            <Image
              src={item.coverUrl}
              alt={`${item.title} - ${item.subtitle}`}
              fill
              sizes="104px"
              unoptimized
              className="object-cover"
            />
            {isCardPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <EqualizerBars />
              </div>
            )}
            {renderFloatingPlayTrigger(true)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {entityBadge}
                </span>
                {item.releaseYear && (
                  <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                    {item.releaseYear}
                  </span>
                )}
              </div>
              {renderBookmarkButton(false)}
            </div>

            <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug tracking-tight text-[var(--text-primary)]">
              {item.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
              {item.subtitle}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {item.genre && (
                <span className="max-w-full truncate rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                  {item.genre}
                </span>
              )}
              <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                POP {item.popularityScore}/100
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Artwork Frame (for Featured md+ and all viewports of Medium cards) */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-[var(--bg-elevated)]",
          isFeatured
            ? "hidden aspect-square w-[260px] border-r border-[var(--border-subtle)] md:block"
            : "aspect-[4/3] w-full border-b border-[var(--border-subtle)]"
        )}
      >
        <Image
          src={item.coverUrl}
          alt={`${item.title} - ${item.subtitle}`}
          fill
          sizes={
            isFeatured
              ? "260px"
              : "(max-width: 640px) 100vw, 320px"
          }
          unoptimized
          className="object-cover"
        />

        {/* Top-left Metadata Pill */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
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
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 rounded-md border border-white/15 bg-black/80 px-2 py-1 backdrop-blur-sm">
            <EqualizerBars />
            <span className="font-mono text-[10px] font-medium text-white">
              PLAYING
            </span>
          </div>
        )}

        {/* Floating Play/Pause or External Fallback */}
        {renderFloatingPlayTrigger(false)}
      </div>

      {/* Card Body */}
      <div
        className={cn(
          "flex flex-1 flex-col justify-between",
          isFeatured ? "p-3.5 sm:p-5" : "p-3.5"
        )}
      >
        <div>
          <div
            className={cn(
              "items-start justify-between gap-2.5",
              isFeatured ? "hidden md:flex" : "flex"
            )}
          >
            <div className="min-w-0">
              <h3
                className={cn(
                  "font-semibold tracking-tight text-[var(--text-primary)]",
                  isFeatured ? "text-lg sm:text-xl" : "truncate text-sm"
                )}
              >
                {item.title}
              </h3>
              <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                {item.subtitle}
              </p>
            </div>

            {renderBookmarkButton(false)}
          </div>

          {/* Technical Spec Row */}
          <div
            className={cn(
              "mt-2 flex-wrap items-center gap-1.5",
              isFeatured ? "hidden md:flex" : "flex"
            )}
          >
            {item.genre && (
              <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                {item.genre}
              </span>
            )}
            <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
              POP {item.popularityScore}/100
            </span>
          </div>

          {/* Discovery Reason */}
          <p
            className={cn(
              "flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]",
              isFeatured ? "mt-0 md:mt-2" : "mt-2"
            )}
          >
            <Sparkles className="h-3 w-3 shrink-0 text-[#FF5500]" />
            <span className={cn(!isFeatured && "truncate")}>
              {item.discoveryReason}
            </span>
          </p>

          {/* Featured Track Pill */}
          {showNoPreviewFallback ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#FF5500]/30 bg-[#FF5500]/8 px-2.5 py-1.5">
              <span className="truncate font-mono text-[10px] text-[#FF5500]">
                KHÔNG CÓ PREVIEW 30S
              </span>
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded bg-[#FF5500] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#E64D00]"
              >
                <span>Mở ngoài</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 py-1.5">
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
                  <p className="font-mono text-[9px] text-[var(--text-secondary)]">
                    FEATURED • 0:30 PREVIEW
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-[var(--text-secondary)]">
                {formatDuration(item.featuredTrack.duration)}
              </span>
            </div>
          )}

          {/* Album Tracklist Section */}
          {item.type === "album" && (
            <div className="mt-3">
              {!isFeatured && (
                <button
                  type="button"
                  onClick={handleToggleTracklist}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
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
                    !isFeatured &&
                      "mt-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2"
                  )}
                >
                  <TracklistPanel
                    tracks={sortedTracks}
                    topTrackId={topTrackId}
                    activeTrackId={activeTrackId}
                    isGlobalPlaying={isGlobalPlaying}
                    isHydratingAlbum={isHydratingAlbum}
                    showHeader={isFeatured}
                    maxHeightClass={isFeatured ? "max-h-48" : "max-h-40"}
                    onSelectTrack={(track) => onPlaySpecificTrack(track, item)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            {item.type === "album" ? "ALBUM-FIRST" : "DIRECT STREAM"}
          </span>
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <span>Mở trên {externalSourceLabel}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
