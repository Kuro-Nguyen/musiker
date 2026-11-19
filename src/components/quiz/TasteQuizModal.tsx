"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  DEEZER_GENRES,
  DEFAULT_TASTE_PROFILE,
  PRESET_SEED_ARTISTS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import type { TasteProfile } from "@/types/music";

type SeedArtist = TasteProfile["seedArtists"][number];
type NumericDimensionKey = "acousticness" | "energy" | "mainstream";

interface QuizArtistApiResult {
  id: string;
  name: string;
  pictureUrl: string;
  genre?: string;
}

interface DimensionMilestone {
  value: number;
  label: string;
  hint: string;
}

interface DimensionConfig {
  step: 2 | 3 | 4;
  key: NumericDimensionKey;
  code: string;
  title: string;
  subtitle: string;
  leftPole: string;
  rightPole: string;
  milestones: DimensionMilestone[];
}

const DIMENSION_STEPS: DimensionConfig[] = [
  {
    step: 2,
    key: "acousticness",
    code: "DIM.01 // TEXTURE",
    title: "Chất liệu âm thanh ưa thích?",
    subtitle:
      "Chọn nhanh một mốc bên dưới hoặc kéo thanh fader để tinh chỉnh độ mộc của nhạc cụ.",
    leftPole: "0% Điện tử / Synth / Beat",
    rightPole: "100% Mộc / Acoustic / Band",
    milestones: [
      {
        value: 15,
        label: "Thuần Điện tử / Synth",
        hint: "Synthesizer, drum machine, beat điện tử hiện đại",
      },
      {
        value: 35,
        label: "Nghiêng Electronic & Beat",
        hint: "Sản xuất hiện đại pha chút nhạc cụ",
      },
      {
        value: 50,
        label: "Cân bằng (Hybrid 50/50)",
        hint: "Kết hợp hài hòa giữa nhạc cụ thật và synth/beat",
      },
      {
        value: 75,
        label: "Nghiêng Nhạc cụ thật & Band",
        hint: "Guitar, piano, trống thật làm chủ đạo",
      },
      {
        value: 90,
        label: "Thuần Mộc / Acoustic",
        hint: "Unplugged, mộc mạc, giàu chất liệu tự nhiên",
      },
    ],
  },
  {
    step: 3,
    key: "energy",
    code: "DIM.02 // ENERGY",
    title: "Năng lượng & Nhịp điệu mong muốn?",
    subtitle:
      "Độ sôi động và tiết tấu trung bình mà bạn thường tìm kiếm khi khám phá nhạc mới.",
    leftPole: "0% Chill / Thư giãn / Tập trung",
    rightPole: "100% Bùng nổ / Tiết tấu nhanh",
    milestones: [
      {
        value: 15,
        label: "Tĩnh lặng / Đêm muộn",
        hint: "Ambient, ballad chậm, thư giãn sâu",
      },
      {
        value: 35,
        label: "Chill & Tập trung",
        hint: "Lo-fi, mid-slow, nhẹ nhàng để làm việc/đọc sách",
      },
      {
        value: 50,
        label: "Nhịp độ Vừa phải",
        hint: "Cân bằng, dễ nghe mọi thời điểm trong ngày",
      },
      {
        value: 75,
        label: "Sôi động & Groovy",
        hint: "Nhịp điệu bắt tai, funk/groove, giàu năng lượng",
      },
      {
        value: 90,
        label: "Bùng nổ / Tiết tấu nhanh",
        hint: "Upbeat, cao trào, thúc đẩy cảm xúc mạnh",
      },
    ],
  },
  {
    step: 4,
    key: "mainstream",
    code: "DIM.03 // POPULARITY",
    title: "Vùng an toàn & Độ phổ biến?",
    subtitle:
      "Bạn muốn ưu tiên những bản hit quen thuộc hay đào sâu những viên ngọc ẩn ít người biết?",
    leftPole: "0% Indie / Underground",
    rightPole: "100% Top Hits / Dễ nghe",
    milestones: [
      {
        value: 15,
        label: "Thuần Underground / Obscure",
        hint: "Ưu tiên nghệ sĩ độc lập, bản thu hiếm ít người biết",
      },
      {
        value: 35,
        label: "Indie & Hidden Gems",
        hint: "Nhạc chất lượng ẩn mình ngoài bảng xếp hạng",
      },
      {
        value: 50,
        label: "Giao thoa Indie & Mainstream",
        hint: "Vừa nghe nghệ sĩ lớn vừa thích khám phá tên tuổi mới",
      },
      {
        value: 75,
        label: "Quen thuộc & Được yêu thích",
        hint: "Các album/bài hát có độ nhận diện cao, dễ tiếp cận",
      },
      {
        value: 90,
        label: "Top Hits & Mainstream",
        hint: "Tập trung vào các bản hit nổi bật nhất trên bảng xếp hạng",
      },
    ],
  },
];

const ERA_CHOICES: Array<{
  value: TasteProfile["dimensions"]["eraPreference"];
  title: string;
  desc: string;
}> = [
  {
    value: "modern",
    title: "2020s — Hiện đại",
    desc: "Âm thanh mới nhất thập kỷ này",
  },
  {
    value: "2000s_2010s",
    title: "2000s – 2010s",
    desc: "Kỷ nguyên Indie, R&B & Pop hiện đại",
  },
  {
    value: "classic",
    title: "Thập niên 90 trở về trước",
    desc: "90s, 80s, 70s & Classic vượt thời gian",
  },
  {
    value: "any",
    title: "Mọi thời đại",
    desc: "Không giới hạn năm phát hành",
  },
];

function inferGenreIdFromText(genreText?: string): number | undefined {
  if (!genreText) return undefined;
  const normalized = genreText.toLowerCase();

  if (normalized.includes("k-pop") || normalized.includes("j-pop") || normalized.includes("v-pop") || normalized.includes("asian")) {
    return 16;
  }
  if (normalized.includes("hip-hop") || normalized.includes("hip hop") || normalized.includes("rap")) {
    return 116;
  }
  if (normalized.includes("r&b") || normalized.includes("soul")) {
    return 165;
  }
  if (normalized.includes("alternative") || normalized.includes("indie")) {
    return 85;
  }
  if (normalized.includes("electronic") || normalized.includes("electro") || normalized.includes("synth")) {
    return 106;
  }
  if (normalized.includes("dance") || normalized.includes("edm") || normalized.includes("house")) {
    return 113;
  }
  if (normalized.includes("jazz")) {
    return 129;
  }
  if (normalized.includes("classical")) {
    return 98;
  }
  if (normalized.includes("folk") || normalized.includes("acoustic") || normalized.includes("singer/songwriter")) {
    return 466;
  }
  if (normalized.includes("metal")) {
    return 464;
  }
  if (normalized.includes("rock")) {
    return 152;
  }
  if (normalized.includes("pop")) {
    return 132;
  }
  return undefined;
}

function inferGenresFromSeeds(
  artists: SeedArtist[],
  excludedGenres: number[]
): number[] {
  const excludedSet = new Set(excludedGenres);
  const inferred = new Set<number>();
  for (const artist of artists) {
    if (artist.genreId && !excludedSet.has(artist.genreId)) {
      inferred.add(artist.genreId);
    }
  }
  return Array.from(inferred);
}

interface DimensionStepViewProps {
  config: DimensionConfig;
  value: number;
  onChange: (value: number) => void;
}

function DimensionStepView({
  config,
  value,
  onChange,
}: DimensionStepViewProps) {
  return (
    <div className="space-y-5">
      <div>
        <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#FF5500]">
          {config.code}
        </span>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
          {config.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {config.subtitle}
        </p>
      </div>

      {/* 5 Quick Milestone Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {config.milestones.map((milestone, idx) => {
          const isExact = value === milestone.value;
          const isClosest =
            !config.milestones.some((m) => m.value === value) &&
            Math.abs(value - milestone.value) <= 10;

          return (
            <button
              key={milestone.value}
              type="button"
              onClick={() => onChange(milestone.value)}
              className={cn(
                "flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer",
                idx === 4 && "sm:col-span-2",
                isExact
                  ? "border-[#FF5500] bg-[#FF5500]/10"
                  : isClosest
                    ? "border-[var(--text-secondary)]/60 bg-[var(--bg-elevated)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]"
              )}
            >
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    isExact ? "text-[#FF5500]" : "text-[var(--text-primary)]"
                  )}
                >
                  {milestone.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  {milestone.hint}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold",
                  isExact
                    ? "bg-[#FF5500] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                )}
              >
                {milestone.value}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Precision Fader */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
            TINH CHỈNH FADER
          </span>
          <span className="font-mono text-base font-bold text-[#FF5500]">
            {value}%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={config.title}
          className="musiker-slider"
          style={{
            background: `linear-gradient(to right, #FF5500 0%, #FF5500 ${value}%, var(--border-subtle) ${value}%, var(--border-subtle) 100%)`,
          }}
        />

        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
          <span>{config.leftPole}</span>
          <span className="text-right">{config.rightPole}</span>
        </div>
      </div>
    </div>
  );
}

interface TasteQuizModalProps {
  onComplete?: (profile: TasteProfile) => void;
}

export function TasteQuizModal({ onComplete }: TasteQuizModalProps) {
  const {
    isQuizOpen,
    closeQuiz,
    tasteProfile,
    saveTasteProfile,
    resetTasteProfile,
  } = usePreferenceStore();

  const [step, setStep] = React.useState<number>(1);
  const [seedArtists, setSeedArtists] = React.useState<SeedArtist[]>([]);
  const [dimensions, setDimensions] = React.useState<TasteProfile["dimensions"]>(
    DEFAULT_TASTE_PROFILE.dimensions
  );
  const [preferredGenres, setPreferredGenres] = React.useState<number[]>([]);
  const [excludedGenres, setExcludedGenres] = React.useState<number[]>([]);
  const [userEditedPreferred, setUserEditedPreferred] =
    React.useState<boolean>(false);

  // Step 1 realtime artist search state
  const [artistQuery, setArtistQuery] = React.useState<string>("");
  const [searchResults, setSearchResults] = React.useState<SeedArtist[]>([]);
  const [isSearching, setIsSearching] = React.useState<boolean>(false);
  const [stepWarning, setStepWarning] = React.useState<string | null>(null);

  // Sync draft state when modal opens
  React.useEffect(() => {
    if (!isQuizOpen) return;
    setStep(1);
    setSeedArtists(tasteProfile.seedArtists);
    setDimensions(tasteProfile.dimensions);
    setPreferredGenres(tasteProfile.preferredGenres);
    setExcludedGenres(tasteProfile.excludedGenres);
    setUserEditedPreferred(tasteProfile.isCompleted);
    setArtistQuery("");
    setSearchResults([]);
    setStepWarning(null);
  }, [isQuizOpen, tasteProfile]);

  // Body scroll lock & ESC key handling
  React.useEffect(() => {
    if (!isQuizOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeQuiz();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isQuizOpen, closeQuiz]);

  // Debounced artist search for Step 1
  React.useEffect(() => {
    if (!isQuizOpen) return;
    const trimmed = artistQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          q: trimmed,
          type: "artist",
          mode: "quiz",
          limit: "8",
        });
        const res = await fetch(`/api/music/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Search error");
        const data = (await res.json()) as {
          artists?: QuizArtistApiResult[];
        };
        const mapped: SeedArtist[] = (data.artists ?? []).map((a) => ({
          id: a.id,
          name: a.name,
          pictureUrl: a.pictureUrl,
          genreId: inferGenreIdFromText(a.genre),
        }));
        setSearchResults(mapped);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [artistQuery, isQuizOpen]);

  // Automatically infer preferredGenres from Step 1 artists until user edits manually
  React.useEffect(() => {
    if (!isQuizOpen || userEditedPreferred) return;
    setPreferredGenres(inferGenresFromSeeds(seedArtists, excludedGenres));
  }, [isQuizOpen, seedArtists, excludedGenres, userEditedPreferred]);

  const handleToggleSeedArtist = (artist: SeedArtist) => {
    setStepWarning(null);
    setSeedArtists((prev) => {
      const exists = prev.some((a) => a.id === artist.id || a.name === artist.name);
      if (exists) {
        return prev.filter((a) => a.id !== artist.id && a.name !== artist.name);
      }
      if (prev.length >= 5) {
        setStepWarning("Bạn đã chọn đủ tối đa 5 nghệ sĩ hạt giống.");
        return prev;
      }
      return [...prev, artist];
    });
  };

  const handleTogglePreferredGenre = (genreId: number) => {
    setUserEditedPreferred(true);
    setPreferredGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setExcludedGenres((prev) => prev.filter((id) => id !== genreId));
  };

  const handleToggleExcludedGenre = (genreId: number) => {
    setUserEditedPreferred(true);
    setExcludedGenres((prev) =>
      prev.includes(genreId)
        ? prev.filter((id) => id !== genreId)
        : [...prev, genreId]
    );
    setPreferredGenres((prev) => prev.filter((id) => id !== genreId));
  };

  const handleNext = () => {
    if (step === 1 && seedArtists.length < 3) {
      setStepWarning("Hãy chọn tối thiểu 3 nghệ sĩ để thuật toán xác định gu chính xác.");
      return;
    }
    setStepWarning(null);
    setStep((prev) => Math.min(5, prev + 1));
  };

  const handlePrev = () => {
    setStepWarning(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinish = () => {
    const completedProfile: TasteProfile = {
      isCompleted: true,
      updatedAt: new Date().toISOString(),
      seedArtists,
      preferredGenres,
      excludedGenres,
      dimensions,
    };
    saveTasteProfile(completedProfile);
    closeQuiz();
    onComplete?.(completedProfile);
  };

  const handleReset = () => {
    resetTasteProfile();
    setSeedArtists([]);
    setDimensions(DEFAULT_TASTE_PROFILE.dimensions);
    setPreferredGenres([]);
    setExcludedGenres([]);
    setUserEditedPreferred(false);
    setStep(1);
    setStepWarning(null);
  };

  const activeDimensionConfig = DIMENSION_STEPS.find((d) => d.step === step);

  const displayedArtistPool: Array<SeedArtist & { tag?: string }> =
    artistQuery.trim().length > 0 ? searchResults : PRESET_SEED_ARTISTS;

  return (
    <AnimatePresence>
      {isQuizOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="taste-quiz-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeQuiz();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl"
          >
            {/* Modal Header */}
            <div className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF5500]" />
                  <h2
                    id="taste-quiz-title"
                    className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]"
                  >
                    TASTE PROFILE // STEP 0{step} / 05
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  {tasteProfile.isCompleted && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Đặt lại</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeQuiz}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    <span>Bỏ qua</span>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* 5-Segment Progress Bar */}
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      idx <= step ? "bg-[#FF5500]" : "bg-[var(--border-subtle)]"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`quiz-step-${step}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.16 }}
                >
                  {/* Step 1: 3-5 Seed Artists */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#FF5500]">
                          SEED.01 // ARTISTS
                        </span>
                        <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
                          Chọn 3–5 nghệ sĩ &ldquo;tủ&rdquo; của bạn
                        </h3>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          Đây là hạt giống quan trọng nhất để thuật toán tìm những nghệ sĩ có chung DNA âm nhạc.
                        </p>
                      </div>

                      {/* Realtime Search Input */}
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <input
                          type="text"
                          value={artistQuery}
                          onChange={(e) => setArtistQuery(e.target.value)}
                          placeholder="Tìm nghệ sĩ bất kỳ (VD: Arctic Monkeys, Ngọt, Tyler, The Creator)..."
                          className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] pl-9 pr-9 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[#FF5500]"
                        />
                        {artistQuery && (
                          <button
                            type="button"
                            onClick={() => setArtistQuery("")}
                            aria-label="Xóa tìm kiếm nghệ sĩ"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Selected Artists Tray */}
                      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                            ĐÃ CHỌN ({seedArtists.length}/5 • TỐI THIỂU 3)
                          </span>
                          {seedArtists.length >= 3 && (
                            <span className="font-mono text-[10px] font-semibold text-[#FF5500]">
                              ĐÃ ĐỦ HẠT GIỐNG ✓
                            </span>
                          )}
                        </div>

                        {seedArtists.length === 0 ? (
                          <p className="mt-2 text-xs text-[var(--text-secondary)]">
                            Bấm vào các nghệ sĩ bên dưới hoặc tìm kiếm để thêm vào danh sách.
                          </p>
                        ) : (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {seedArtists.map((artist) => (
                              <button
                                key={artist.id}
                                type="button"
                                onClick={() => handleToggleSeedArtist(artist)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5500]/40 bg-[#FF5500]/10 px-2.5 py-1 text-xs font-medium text-[#FF5500] cursor-pointer"
                              >
                                <span>{artist.name}</span>
                                <X className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Artist Pool */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                            {artistQuery.trim()
                              ? "KẾT QUẢ TÌM KIẾM TRỰC TIẾP"
                              : "12 NGHỆ SĨ GỢI Ý ĐA THỂ LOẠI"}
                          </span>
                          {isSearching && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF5500]" />
                          )}
                        </div>

                        {displayedArtistPool.length === 0 && !isSearching ? (
                          <div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-6 text-center text-xs text-[var(--text-secondary)]">
                            Không tìm thấy nghệ sĩ phù hợp. Thử tên khác hoặc quay lại danh sách gợi ý.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                            {displayedArtistPool.map((artist) => {
                              const selected = seedArtists.some(
                                (s) => s.id === artist.id || s.name === artist.name
                              );
                              return (
                                <button
                                  key={artist.id}
                                  type="button"
                                  onClick={() => handleToggleSeedArtist(artist)}
                                  className={cn(
                                    "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors cursor-pointer",
                                    selected
                                      ? "border-[#FF5500] bg-[#FF5500]/10"
                                      : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]"
                                  )}
                                >
                                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                                    {artist.pictureUrl && (
                                      <Image
                                        src={artist.pictureUrl}
                                        alt={artist.name}
                                        fill
                                        sizes="40px"
                                        unoptimized
                                        className="object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                                      {artist.name}
                                    </p>
                                    {artist.tag && (
                                      <p className="truncate font-mono text-[10px] text-[var(--text-secondary)]">
                                        {artist.tag}
                                      </p>
                                    )}
                                  </div>
                                  {selected && (
                                    <Check className="h-3.5 w-3.5 shrink-0 text-[#FF5500]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Steps 2, 3, 4: Dimension Quick Picks + Fader */}
                  {activeDimensionConfig && (
                    <DimensionStepView
                      config={activeDimensionConfig}
                      value={dimensions[activeDimensionConfig.key]}
                      onChange={(nextVal) =>
                        setDimensions((prev) => ({
                          ...prev,
                          [activeDimensionConfig.key]: nextVal,
                        }))
                      }
                    />
                  )}

                  {/* Step 5: Era + Preferred Genres + Excluded Dealbreakers */}
                  {step === 5 && (
                    <div className="space-y-5">
                      <div>
                        <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-[#FF5500]">
                          ERA &amp; DEALBREAKERS // 05
                        </span>
                        <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] sm:text-xl">
                          Thập kỷ &amp; Thể loại âm nhạc
                        </h3>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          Chọn giai đoạn ưa thích, kiểm tra thể loại gợi ý và tích bỏ những thể loại bạn không muốn nghe.
                        </p>
                      </div>

                      {/* Era Selection */}
                      <div className="space-y-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                          Giai đoạn yêu thích
                        </span>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {ERA_CHOICES.map((era) => {
                            const active =
                              dimensions.eraPreference === era.value;
                            return (
                              <button
                                key={era.value}
                                type="button"
                                onClick={() =>
                                  setDimensions((prev) => ({
                                    ...prev,
                                    eraPreference: era.value,
                                  }))
                                }
                                className={cn(
                                  "rounded-xl border p-3 text-left transition-colors cursor-pointer",
                                  active
                                    ? "border-[#FF5500] bg-[#FF5500]/10"
                                    : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-secondary)]"
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-xs font-semibold",
                                    active
                                      ? "text-[#FF5500]"
                                      : "text-[var(--text-primary)]"
                                  )}
                                >
                                  {era.title}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                                  {era.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Preferred Genres (Auto-suggested from Step 1) */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                            Thể loại yêu thích ({preferredGenres.length})
                          </span>
                          <span className="font-mono text-[10px] text-[#FF5500]">
                            Gợi ý từ nghệ sĩ Bước 1 • Bấm để sửa
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {DEEZER_GENRES.map((genre) => {
                            const active = preferredGenres.includes(genre.id);
                            return (
                              <button
                                key={genre.id}
                                type="button"
                                onClick={() =>
                                  handleTogglePreferredGenre(genre.id)
                                }
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                  active
                                    ? "border-[#FF5500] bg-[#FF5500]/12 text-[#FF5500]"
                                    : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                )}
                              >
                                {active && <Check className="h-3 w-3" />}
                                <span>{genre.labelVi}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Excluded Genres (Dealbreakers) */}
                      <div className="space-y-2 border-t border-[var(--border-subtle)] pt-4">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                          Thể loại tuyệt đối không nghe ({excludedGenres.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {DEEZER_GENRES.map((genre) => {
                            const excluded = excludedGenres.includes(genre.id);
                            return (
                              <button
                                key={genre.id}
                                type="button"
                                onClick={() =>
                                  handleToggleExcludedGenre(genre.id)
                                }
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                                  excluded
                                    ? "border-red-500/60 bg-red-500/10 text-red-500"
                                    : "border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                )}
                              >
                                {excluded && <Ban className="h-3 w-3" />}
                                <span>{genre.labelVi}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/60 px-5 py-3.5 sm:px-6">
              {stepWarning && (
                <p className="mb-2.5 text-xs font-medium text-[#FF5500]">
                  {stepWarning}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <div>
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Quay lại</span>
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {seedArtists.length < 3
                        ? `Chọn thêm ${3 - seedArtists.length} nghệ sĩ nữa`
                        : "Sẵn sàng sang bước tiếp theo"}
                    </span>
                  )}
                </div>

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={step === 1 && seedArtists.length < 3}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[var(--accent-primary)] px-5 text-xs font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#FF5500] px-5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E64D00] cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Hoàn tất &amp; Tạo gợi ý</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

