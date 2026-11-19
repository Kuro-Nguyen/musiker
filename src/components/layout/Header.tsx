"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Archive,
  CheckCircle2,
  Moon,
  Sparkles,
  Sun,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePreferenceStore } from "@/store/usePreferenceStore";

interface HeaderProps {
  tasteCompleted?: boolean;
  savedCount?: number;
  onQuizClick?: () => void;
  onCrateClick?: () => void;
}

export function Header({
  tasteCompleted: tasteCompletedProp,
  savedCount: savedCountProp,
  onQuizClick,
  onCrateClick,
}: HeaderProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const {
    tasteProfile,
    savedItems,
    hasHydrated,
    openQuiz,
    openCrate,
  } = usePreferenceStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const tasteCompleted =
    tasteCompletedProp ?? (hasHydrated ? tasteProfile.isCompleted : false);
  const savedCount =
    savedCountProp ?? (hasHydrated ? savedItems.length : 0);
  const handleQuizClick = onQuizClick ?? openQuiz;
  const handleCrateClick = onCrateClick ?? openCrate;

  const isDark = mounted && resolvedTheme === "dark";

  const handleToggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/92 backdrop-blur-md safe-top safe-x">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:min-h-16 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 32 32"
              className="h-6 w-6 shrink-0 rounded-lg shadow-xs sm:h-7 sm:w-7"
              fill="none"
            >
              <rect
                x="1"
                y="1"
                width="30"
                height="30"
                rx="7"
                fill="#111111"
                stroke="#27272A"
                strokeWidth="1"
              />
              <circle
                cx="16"
                cy="16"
                r="10.5"
                stroke="#F4F4F6"
                strokeOpacity="0.24"
                strokeWidth="1.25"
              />
              <circle
                cx="16"
                cy="16"
                r="7.5"
                stroke="#F4F4F6"
                strokeOpacity="0.14"
                strokeWidth="1"
                strokeDasharray="10 4"
              />
              <circle cx="16" cy="16" r="4.2" fill="#FF5500" />
              <circle cx="16" cy="16" r="1.4" fill="#111111" />
              <circle cx="25" cy="7" r="1.75" fill="#FF5500" />
            </svg>
            <span className="text-sm font-bold tracking-[0.12em] text-[var(--text-primary)] sm:text-base sm:tracking-[0.16em]">
              {APP_NAME}
            </span>
          </div>
          <span className="inline-flex shrink-0 items-center whitespace-nowrap border-l border-[var(--border-subtle)] pl-2 font-mono text-[10px] font-medium tracking-wider text-[var(--text-secondary)] sm:pl-2.5 sm:text-xs">
            by&nbsp;
            <span className="font-semibold text-[var(--text-primary)]">
              Kuro
            </span>
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Taste Profile Quiz Trigger */}
          <button
            type="button"
            onClick={handleQuizClick}
            aria-label={
              tasteCompleted
                ? "Chỉnh sửa trắc nghiệm gu âm nhạc"
                : "Làm trắc nghiệm gu âm nhạc 30 giây"
            }
            className={cn(
              "touch-target inline-flex h-10 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer sm:h-9 sm:gap-2 sm:px-3",
              tasteCompleted
                ? "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]"
                : "border-[#FF5500]/40 bg-[#FF5500]/8 text-[#FF5500] hover:bg-[#FF5500]/15"
            )}
          >
            {tasteCompleted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FF5500]" />
                <span className="hidden md:inline">
                  Gu âm nhạc: Đã thiết lập (Chỉnh sửa)
                </span>
                <span className="hidden sm:inline md:hidden">Đã thiết lập gu</span>
                <span className="sm:hidden">Gu</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Làm trắc nghiệm gu (30s)</span>
                <span className="sm:hidden">Gu</span>
              </>
            )}
          </button>

          {/* Saved Crate Trigger */}
          <button
            type="button"
            onClick={handleCrateClick}
            aria-label={`Tủ nhạc đã lưu (${savedCount})`}
            className="touch-target inline-flex h-10 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer sm:h-9 sm:gap-2 sm:px-3"
          >
            <Archive className="h-3.5 w-3.5 shrink-0 text-[var(--text-secondary)]" />
            <span className="hidden sm:inline">Tủ nhạc đã lưu</span>
            <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-primary)]">
              {savedCount}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={
              isDark ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"
            }
            title={isDark ? "Light Mode" : "Dark Mode"}
            className="touch-target inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer sm:h-9 sm:w-9"
          >
            {mounted ? (
              isDark ? (
                <Sun className="h-4 w-4 text-[#FF5500]" />
              ) : (
                <Moon className="h-4 w-4 text-[var(--text-primary)]" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

