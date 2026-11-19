"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MusicCard } from "@/components/discovery/MusicCard";
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
    <div className="mx-auto flex max-w-4xl flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] md:flex-row">
      <div className="aspect-square w-full shrink-0 animate-pulse bg-[var(--bg-elevated)] md:w-[340px]" />
      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
        <div className="space-y-2.5">
          <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="flex gap-2 pt-2">
            <div className="h-5 w-20 animate-pulse rounded bg-[var(--bg-elevated)]" />
            <div className="h-5 w-20 animate-pulse rounded bg-[var(--bg-elevated)]" />
          </div>
          <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
        </div>
        <div className="space-y-2 pt-2">
          <div className="h-8 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-8 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-8 w-full animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <div className="aspect-square w-full animate-pulse border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]" />
      <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--bg-elevated)]" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--bg-elevated)]" />
        </div>
        <div className="h-11 w-full animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
      </div>
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
  if (isLoading) {
    if (expectedCount === 1 && isFeaturedLayout) {
      return <FeaturedSkeleton />;
    }
    const skeletonTotal = Math.max(1, Math.min(10, expectedCount));
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonTotal }).map((_, idx) => (
          <CardSkeleton key={`skeleton-${idx}`} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-12 text-center">
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
      {isFeaturedLayout && items.length === 1 ? (
        <motion.div
          key={`featured-${items[0].id}-${animationKey}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <MusicCard
            item={items[0]}
            featured
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
          key={`grid-${animationKey}-${items.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {items.map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}-${animationKey}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.24,
                delay: Math.min(idx * 0.04, 0.32),
                ease: "easeOut",
              }}
            >
              <MusicCard
                item={item}
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
