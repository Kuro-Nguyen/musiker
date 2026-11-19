"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_TASTE_PROFILE, MAX_SEEN_IDS } from "@/lib/constants";
import type {
  DailyPickData,
  MusicResultItem,
  TasteProfile,
} from "@/types/music";

interface PreferenceState {
  // Persisted to localStorage
  tasteProfile: TasteProfile;
  dailyPick: DailyPickData | null;
  seenIds: string[];
  savedItems: MusicResultItem[];

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

  toggleSaveItem: (item: MusicResultItem) => void;
  removeSavedItem: (id: string) => void;
  clearSavedItems: () => void;

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
      savedItems: [],

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

      toggleSaveItem: (item) =>
        set((state) => {
          const exists = state.savedItems.some((entry) => entry.id === item.id);
          return {
            savedItems: exists
              ? state.savedItems.filter((entry) => entry.id !== item.id)
              : [item, ...state.savedItems],
          };
        }),

      removeSavedItem: (id) =>
        set((state) => ({
          savedItems: state.savedItems.filter((entry) => entry.id !== id),
        })),

      clearSavedItems: () => set({ savedItems: [] }),

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
      name: "musiker-preferences-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasteProfile: state.tasteProfile,
        dailyPick: state.dailyPick,
        seenIds: state.seenIds,
        savedItems: state.savedItems,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

