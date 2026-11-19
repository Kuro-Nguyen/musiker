"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  BATCH_COUNT_PRESETS,
  ENTITY_OPTIONS,
  ERA_OPTIONS,
  MOOD_OPTIONS,
  POPULARITY_OPTIONS,
  REGION_OPTIONS,
} from "@/lib/constants";
import { cn, getDiscoveryLevelMeta } from "@/lib/utils";
import type { EntityType, QuickFilters, TasteProfile } from "@/types/music";

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
        className="h-11 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2.5 text-base font-medium text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--text-secondary)] focus:border-[#FF5500] cursor-pointer sm:h-9 sm:text-xs"
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

interface ControlPanelProps {
  filters: QuickFilters;
  discoveryLevel: number;
  batchCount: number;
  isDiscovering: boolean;
  autoPlayOnRandom: boolean;
  isLiveSearchOpen: boolean;
  tasteProfile: TasteProfile;
  isMobileExpanded?: boolean;
  onToggleMobileExpanded?: () => void;
  onChangeEntityType: (entityType: EntityType) => void;
  onChangeFilters: (updater: (prev: QuickFilters) => QuickFilters) => void;
  onResetFilters: () => void;
  onChangeDiscoveryLevel: (level: number) => void;
  onChangeBatchCount: (count: number) => void;
  onToggleAutoPlay: () => void;
  onToggleLiveSearch: () => void;
  onOpenQuiz: () => void;
  onRandomize: () => void;
}

export function ControlPanel({
  filters,
  discoveryLevel,
  batchCount,
  isDiscovering,
  autoPlayOnRandom,
  isLiveSearchOpen,
  tasteProfile,
  isMobileExpanded = false,
  onToggleMobileExpanded,
  onChangeEntityType,
  onChangeFilters,
  onResetFilters,
  onChangeDiscoveryLevel,
  onChangeBatchCount,
  onToggleAutoPlay,
  onToggleLiveSearch,
  onOpenQuiz,
  onRandomize,
}: ControlPanelProps) {
  const discoveryMeta = getDiscoveryLevelMeta(discoveryLevel);

  const activeFilterCount = [
    filters.region !== "all",
    filters.mood !== "all",
    filters.popularity !== "all",
    filters.era !== "all",
  ].filter(Boolean).length;
  const hasActiveQuickFilters = activeFilterCount > 0;

  return (
    <section
      aria-label="Bảng điều khiển khám phá âm nhạc"
      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 sm:p-6"
    >
      {/* Mobile Collapsible Header Strip (< lg) */}
      <div className="flex items-center justify-between gap-2 lg:hidden">
        <button
          type="button"
          onClick={onToggleMobileExpanded}
          aria-expanded={isMobileExpanded}
          className="flex min-h-11 flex-1 items-center justify-between gap-2 text-left cursor-pointer"
        >
          <div className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#FF5500]" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Bộ lọc &amp; Tinh chỉnh Gu
              </p>
              <p className="truncate font-mono text-[10px] text-[var(--text-secondary)]">
                Khám phá {discoveryLevel}% •{" "}
                {activeFilterCount > 0
                  ? `${activeFilterCount} bộ lọc đang bật`
                  : "Chế độ mở toàn cầu"}
              </p>
            </div>
          </div>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)]">
            {isMobileExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>
      </div>

      {/* Collapsible Content on Mobile, Always Open on Desktop (lg+) */}
      <div className={cn(isMobileExpanded ? "mt-4 block border-t border-[var(--border-subtle)] pt-4 lg:mt-0 lg:border-t-0 lg:pt-0" : "hidden lg:block")}>
        {/* Row 1: Entity Segmented Control + Quick Filters */}
        <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              Loại nội dung
            </span>
            <div
              role="tablist"
              aria-label="Chọn loại nội dung"
              className="grid w-full grid-cols-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1 sm:inline-flex sm:w-auto"
            >
              {ENTITY_OPTIONS.map((option) => {
                const active = filters.entityType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChangeEntityType(option.value)}
                    className={cn(
                      "min-h-10 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer sm:min-h-0 sm:px-3.5",
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

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-4">
              <FilterSelect
                label="Vùng / Ngôn ngữ"
                value={filters.region}
                options={REGION_OPTIONS}
                onChange={(region) =>
                  onChangeFilters((prev) => ({ ...prev, region }))
                }
              />
              <FilterSelect
                label="Tâm trạng"
                value={filters.mood}
                options={MOOD_OPTIONS}
                onChange={(mood) => onChangeFilters((prev) => ({ ...prev, mood }))}
              />
              <FilterSelect
                label="Độ nổi tiếng"
                value={filters.popularity}
                options={POPULARITY_OPTIONS}
                onChange={(popularity) =>
                  onChangeFilters((prev) => ({ ...prev, popularity }))
                }
              />
              <FilterSelect
                label="Thập kỷ"
                value={filters.era}
                options={ERA_OPTIONS}
                onChange={(era) => onChangeFilters((prev) => ({ ...prev, era }))}
              />
            </div>
            {hasActiveQuickFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex min-h-9 items-center gap-1 self-start font-mono text-[11px] text-[#FF5500] hover:underline sm:min-h-0 sm:self-end sm:text-[10px] cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Đặt lại bộ lọc nhanh</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Discovery Slider (65%) + Batch Count (35%) */}
        <div className="flex flex-col gap-6 py-5 lg:flex-row lg:items-center lg:gap-8">
          {/* Discovery Slider — 65% */}
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
              onChange={(e) => onChangeDiscoveryLevel(Number(e.target.value))}
              aria-label="Thanh trượt độ khám phá"
              className="muziker-slider"
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

            {/* Taste Signal Pill next to Discovery Slider */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2">
              {tasteProfile.isCompleted ? (
                <>
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-mono font-semibold text-[#FF5500]">
                      TASTE LOCKED:
                    </span>
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {tasteProfile.seedArtists
                        .slice(0, 3)
                        .map((a) => a.name)
                        .join(", ")}
                      {tasteProfile.seedArtists.length > 3
                        ? ` +${tasteProfile.seedArtists.length - 3}`
                        : ""}
                    </span>
                    <span className="hidden font-mono text-[10px] text-[var(--text-secondary)] sm:inline">
                      • ACOUSTIC {tasteProfile.dimensions.acousticness}% / ENERGY{" "}
                      {tasteProfile.dimensions.energy}% / HITS{" "}
                      {tasteProfile.dimensions.mainstream}%
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenQuiz}
                    className="min-h-8 shrink-0 font-mono text-[11px] font-semibold text-[#FF5500] hover:underline cursor-pointer sm:min-h-0"
                  >
                    Chỉnh sửa gu
                  </button>
                </>
              ) : (
                <>
                  <span className="text-[11px] text-[var(--text-secondary)]">
                    Chưa thiết lập hồ sơ gu âm nhạc — đang dùng khám phá phổ quát.
                  </span>
                  <button
                    type="button"
                    onClick={onOpenQuiz}
                    className="inline-flex min-h-8 shrink-0 items-center gap-1 font-mono text-[11px] font-semibold text-[#FF5500] hover:underline cursor-pointer sm:min-h-0"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Làm Quiz (30s)</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Batch Count Selector — 35% */}
          <div className="w-full space-y-2.5 border-t border-[var(--border-subtle)] pt-4 lg:w-[35%] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Số lượng kết quả
              </span>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                {batchCount} / 10
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
                <button
                  type="button"
                  onClick={() => onChangeBatchCount(batchCount - 1)}
                  disabled={batchCount <= 1}
                  aria-label="Giảm số lượng"
                  className="inline-flex h-10 w-10 items-center justify-center text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed sm:h-9 sm:w-9"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center font-mono text-sm font-semibold text-[var(--text-primary)]">
                  {batchCount}
                </span>
                <button
                  type="button"
                  onClick={() => onChangeBatchCount(batchCount + 1)}
                  disabled={batchCount >= 10}
                  aria-label="Tăng số lượng"
                  className="inline-flex h-10 w-10 items-center justify-center text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed sm:h-9 sm:w-9"
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
                      onClick={() => onChangeBatchCount(preset)}
                      className={cn(
                        "h-10 min-w-[38px] rounded-lg border px-2 font-mono text-xs font-semibold transition-colors cursor-pointer sm:h-9 sm:min-w-[36px]",
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

        {/* Row 3: Primary Randomize CTA + Utility Toggles */}
        <div className="flex flex-col items-center gap-3 border-t border-[var(--border-subtle)] pt-5">
          <button
            type="button"
            onClick={onRandomize}
            disabled={isDiscovering}
            className="group inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#FF5500] px-6 text-sm font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-[#E64D00] active:scale-[0.99] disabled:opacity-75 sm:w-auto sm:min-w-[300px] cursor-pointer"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang khám phá...</span>
              </>
            ) : (
              <>
                <Shuffle className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
                <span>Randomize</span>
                <span className="rounded bg-black/20 px-1.5 py-0.5 font-mono text-[10px] font-medium">
                  {filters.entityType.toUpperCase()} × {batchCount}
                </span>
              </>
            )}
          </button>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 text-xs sm:gap-3">
            {/* Auto-Play toggle per PRD 6.2 */}
            <button
              type="button"
              role="switch"
              aria-checked={autoPlayOnRandom}
              onClick={onToggleAutoPlay}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer sm:min-h-0",
                autoPlayOnRandom
                  ? "border-[#FF5500]/50 bg-[#FF5500]/10 text-[#FF5500]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Tự động phát khi Random</span>
              <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px]">
                {autoPlayOnRandom ? "ON" : "OFF"}
              </span>
            </button>

            {/* Collapsible Live Search Toggle */}
            <button
              type="button"
              onClick={onToggleLiveSearch}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors cursor-pointer sm:min-h-0",
                isLiveSearchOpen
                  ? "border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-foreground)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Tìm kiếm trực tiếp</span>
            </button>

            <span className="hidden font-mono text-[11px] text-[var(--text-secondary)] md:inline">
              Nhấn{" "}
              <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)]">
                Space
              </kbd>{" "}
              hoặc{" "}
              <kbd className="rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)]">
                R
              </kbd>{" "}
              để Random
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
