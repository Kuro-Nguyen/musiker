"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MusicCard,
  type MusicCardVariant,
} from "@/components/discovery/MusicCard";
import type { MusicResultItem, TrackItem } from "@/types/music";

interface ResultGridProps {
  items: MusicResultItem[];
  isLoading: boolean;
  expectedCount: number;
  isFeaturedLayout: boolean;
  activeTrackId: string | null;
  isGlobalPlaying: boolean;
  isGlobalLoading: boolean;
  playerError: string | null;
  hydratingId: string | null;
  savedIdSet: Set<string>;
  animationKey: string;
  onPlayItem: (item: MusicResultItem) => void;
  onPlaySpecificTrack: (track: TrackItem, item: MusicResultItem) => void;
  onExpandAlbumTracklist: (item: MusicResultItem) => Promise<void>;
  onToggleSave: (item: MusicResultItem) => void;
  onResetEmpty?: () => void;
}

function FeaturedSkeleton() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] md:flex-row">
      {/* Mobile Compact Hero Skeleton */}
      <div className="flex items-start gap-3 border-b border-[var(--border-subtle)] p-3.5 md:hidden">
        <div className="h-[104px] w-[104px] shrink-0 animate-pulse rounded-xl bg-[var(--bg-elevated)]" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-5 w-4/5 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3.5 w-1/2 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
      </div>
      {/* Desktop Side Cover Skeleton */}
      <div className="hidden aspect-square w-[260px] shrink-0 animate-pulse border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] md:block" />
      <div className="flex flex-1 flex-col justify-between space-y-3 p-3.5 sm:p-5">
        <div className="hidden space-y-2 md:block">
          <div className="h-5 w-2/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="h-9 w-full animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
        <div className="space-y-1.5">
          <div className="h-7 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-7 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-7 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
      </div>
    </div>
  );
}

function MediumCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="aspect-[4/3] w-full animate-pulse border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]" />
      <div className="flex flex-1 flex-col justify-between space-y-2.5 p-3.5">
        <div className="space-y-1.5">
          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3.5 w-1/2 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="h-9 w-full animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
      </div>
    </div>
  );
}

function CompactCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="flex items-start gap-3 p-3">
        <div className="h-[88px] w-[88px] shrink-0 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
      </div>
      <div className="h-7 w-full animate-pulse border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60" />
    </div>
  );
}

export function ResultGrid({
  items,
  isLoading,
  expectedCount,
  isFeaturedLayout,
  activeTrackId,
  isGlobalPlaying,
  isGlobalLoading,
  playerError,
  hydratingId,
  savedIdSet,
  animationKey,
  onPlayItem,
  onPlaySpecificTrack,
  onExpandAlbumTracklist,
  onToggleSave,
  onResetEmpty,
}: ResultGridProps) {
  const effectiveCount = isLoading ? expectedCount : items.length;
  const densityVariant: MusicCardVariant =
    isFeaturedLayout && effectiveCount === 1
      ? "featured"
      : effectiveCount >= 4
        ? "compact"
        : "medium";

  if (isLoading) {
    if (densityVariant === "featured") {
      return <FeaturedSkeleton />;
    }
    const skeletonTotal = Math.max(1, Math.min(10, expectedCount));
    if (densityVariant === "compact") {
      return (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: skeletonTotal }).map((_, idx) => (
            <CompactCardSkeleton key={`skeleton-compact-${idx}`} />
          ))}
        </div>
      );
    }
    return (
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: skeletonTotal }).map((_, idx) => (
          <MediumCardSkeleton key={`skeleton-medium-${idx}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-10 text-center">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.
        </p>
        {onResetEmpty && (
          <button
            type="button"
            onClick={onResetEmpty}
            className="mt-3 rounded-lg bg-[#FF5500] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
          >
            Thử lại gợi ý
          </button>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {densityVariant === "featured" ? (
        <motion.div
          key={`featured-${items[0].id}-${animationKey}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <MusicCard
            item={items[0]}
            variant="featured"
            activeTrackId={activeTrackId}
            isGlobalPlaying={isGlobalPlaying}
            isGlobalLoading={isGlobalLoading}
            isHydratingAlbum={hydratingId === items[0].id}
            playerError={playerError}
            isSaved={savedIdSet.has(items[0].id)}
            onPlayItem={onPlayItem}
            onPlaySpecificTrack={onPlaySpecificTrack}
            onExpandAlbumTracklist={onExpandAlbumTracklist}
            onToggleSave={onToggleSave}
          />
        </motion.div>
      ) : (
        <motion.div
          key={`grid-${densityVariant}-${animationKey}-${items.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={
            densityVariant === "compact"
              ? "grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3"
              : "mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {items.map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}-${animationKey}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                delay: Math.min(idx * 0.035, 0.28),
                ease: "easeOut",
              }}
            >
              <MusicCard
                item={item}
                variant={densityVariant}
                activeTrackId={activeTrackId}
                isGlobalPlaying={isGlobalPlaying}
                isGlobalLoading={isGlobalLoading}
                isHydratingAlbum={hydratingId === item.id}
                playerError={playerError}
                isSaved={savedIdSet.has(item.id)}
                onPlayItem={onPlayItem}
                onPlaySpecificTrack={onPlaySpecificTrack}
                onExpandAlbumTracklist={onExpandAlbumTracklist}
                onToggleSave={onToggleSave}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
