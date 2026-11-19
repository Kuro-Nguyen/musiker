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
    <header className="sticky top-0 z-40 h-16 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 32 32"
              className="h-7 w-7 shrink-0 rounded-lg shadow-xs"
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
            <span className="text-base font-bold tracking-[0.16em] text-[var(--text-primary)]">
              {APP_NAME}
            </span>
          </div>
          <span className="inline-flex items-center border-l border-[var(--border-subtle)] pl-2.5 font-mono text-xs font-medium tracking-wider text-[var(--text-secondary)]">
            by&nbsp;
            <span className="font-semibold text-[var(--text-primary)]">
              Kuro
            </span>
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Taste Profile Quiz Trigger */}
          <button
            type="button"
            onClick={handleQuizClick}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors cursor-pointer",
              tasteCompleted
                ? "border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]"
                : "border-[#FF5500]/40 bg-[#FF5500]/8 text-[#FF5500] hover:bg-[#FF5500]/15"
            )}
          >
            {tasteCompleted ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#FF5500]" />
                <span className="hidden md:inline">
                  Gu âm nhạc: Đã thiết lập (Chỉnh sửa)
                </span>
                <span className="md:hidden">Đã thiết lập gu</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Làm trắc nghiệm gu (30s)</span>
                <span className="sm:hidden">Trắc nghiệm gu</span>
              </>
            )}
          </button>

          {/* Saved Crate Trigger */}
          <button
            type="button"
            onClick={handleCrateClick}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <Archive className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] cursor-pointer"
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

