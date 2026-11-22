"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { DEFAULT_TASTE_PROFILE, MAX_SEEN_IDS } from "@/lib/constants";
import type {
  DailyPickData,
  TasteProfile,
} from "@/types/music";

const STORAGE_KEY = "muziker-preferences-v1";
const LEGACY_STORAGE_KEY = "musiker-preferences-v1";

function createMigratingStorage(): StateStorage {
  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      const current = window.localStorage.getItem(name);
      if (current !== null) return current;
      const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy !== null) {
        window.localStorage.setItem(name, legacy);
      }
      return legacy;
    },
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(name, value);
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    },
  };
}

interface PreferenceState {
  // Persisted to localStorage (guest-safe preferences only)
  tasteProfile: TasteProfile;
  dailyPick: DailyPickData | null;
  seenIds: string[];

  // Transient UI / hydration state
  hasHydrated: boolean;
  isQuizOpen: boolean;
  isCrateOpen: boolean;

  // Actions
  setHasHydrated: (hydrated: boolean) => void;
  openQuiz: () => void;
  closeQuiz: () => void;
  openCrate: () => void;
  closeCrate: () => void;

  saveTasteProfile: (profile: TasteProfile) => void;
  resetTasteProfile: () => void;

  addSeenIds: (ids: string[]) => void;
  clearSeenIds: () => void;

  setDailyPick: (pick: DailyPickData | null) => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      tasteProfile: DEFAULT_TASTE_PROFILE,
      dailyPick: null,
      seenIds: [],

      hasHydrated: false,
      isQuizOpen: false,
      isCrateOpen: false,

      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      openQuiz: () => set({ isQuizOpen: true }),
      closeQuiz: () => set({ isQuizOpen: false }),
      openCrate: () => set({ isCrateOpen: true }),
      closeCrate: () => set({ isCrateOpen: false }),

      saveTasteProfile: (profile) =>
        set({
          tasteProfile: {
            ...profile,
            isCompleted: true,
            updatedAt: new Date().toISOString(),
          },
        }),

      resetTasteProfile: () =>
        set({
          tasteProfile: {
            ...DEFAULT_TASTE_PROFILE,
            updatedAt: "",
          },
        }),

      addSeenIds: (ids) => {
        if (ids.length === 0) return;
        set((state) => {
          const incomingSet = new Set(ids);
          const preserved = state.seenIds.filter((id) => !incomingSet.has(id));
          const uniqueIncoming = Array.from(incomingSet);
          const merged = [...preserved, ...uniqueIncoming];
          return {
            seenIds: merged.slice(-MAX_SEEN_IDS),
          };
        });
      },

      clearSeenIds: () => set({ seenIds: [] }),

      setDailyPick: (pick) => set({ dailyPick: pick }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => createMigratingStorage()),
      partialize: (state) => ({
        tasteProfile: state.tasteProfile,
        dailyPick: state.dailyPick,
        seenIds: state.seenIds,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

