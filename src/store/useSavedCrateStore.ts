"use client";

import { create } from "zustand";
import {
  clearUserCrate,
  removeItemFromCrate,
  saveItemToCrate,
} from "@/lib/firestore-crate";
import { useAuthStore } from "@/store/useAuthStore";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import type { MusicResultItem } from "@/types/music";

interface SavedCrateState {
  savedItems: MusicResultItem[];
  isSyncing: boolean;
  mutatingIds: Record<string, boolean>;
  syncError: string | null;
  toastMessage: string | null;

  setSavedItems: (items: MusicResultItem[]) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncError: (error: string | null) => void;
  clearToast: () => void;
  resetCrate: () => void;

  requestToggleSaveItem: (item: MusicResultItem) => Promise<void>;
  savePendingItemOnLogin: (uid: string, item: MusicResultItem) => Promise<void>;
  removeSavedItem: (itemId: string) => Promise<void>;
  clearSavedItems: () => Promise<void>;
  requestOpenCrate: () => void;
}

export const useSavedCrateStore = create<SavedCrateState>()((set, get) => ({
  savedItems: [],
  isSyncing: false,
  mutatingIds: {},
  syncError: null,
  toastMessage: null,

  setSavedItems: (items) =>
    set({
      savedItems: items,
      isSyncing: false,
      syncError: null,
    }),

  setSyncing: (isSyncing) => set({ isSyncing }),

  setSyncError: (syncError) =>
    set({
      syncError,
      isSyncing: false,
    }),

  clearToast: () => set({ toastMessage: null }),

  resetCrate: () =>
    set({
      savedItems: [],
      isSyncing: false,
      mutatingIds: {},
      syncError: null,
    }),

  requestToggleSaveItem: async (item) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      useAuthStore.getState().openAuthModal({
        reason: `Đăng nhập để lưu "${item.title}" vào Tủ nhạc của bạn.`,
        pendingAction: { type: "saveItem", item },
      });
      return;
    }

    if (get().mutatingIds[item.id]) return;

    const prevItems = get().savedItems;
    const exists = prevItems.some((entry) => entry.id === item.id);
    const optimisticItems = exists
      ? prevItems.filter((entry) => entry.id !== item.id)
      : [item, ...prevItems];

    set((state) => ({
      savedItems: optimisticItems,
      syncError: null,
      mutatingIds: { ...state.mutatingIds, [item.id]: true },
    }));

    try {
      if (exists) {
        await removeItemFromCrate(user.uid, item.id);
      } else {
        await saveItemToCrate(user.uid, item);
      }
    } catch (error) {
      console.error("[SavedCrateStore] Toggle save failed:", error);
      set({
        savedItems: prevItems,
        syncError: "Không thể cập nhật Tủ nhạc trên Firestore. Vui lòng thử lại.",
      });
    } finally {
      set((state) => {
        const nextMutating = { ...state.mutatingIds };
        delete nextMutating[item.id];
        return { mutatingIds: nextMutating };
      });
    }
  },

  savePendingItemOnLogin: async (uid, item) => {
    const alreadyExists = get().savedItems.some((entry) => entry.id === item.id);
    if (!alreadyExists) {
      set((state) => ({
        savedItems: [item, ...state.savedItems],
        syncError: null,
      }));
    }

    try {
      await saveItemToCrate(uid, item);
      set({
        toastMessage: `Đã lưu "${item.title}" vào Tủ nhạc của bạn.`,
      });
    } catch (error) {
      console.error("[SavedCrateStore] Pending save failed:", error);
      set({
        syncError: `Không thể tự động lưu "${item.title}". Vui lòng bấm Lưu lại.`,
      });
    }
  },

  removeSavedItem: async (itemId) => {
    const { user } = useAuthStore.getState();
    if (!user) {
      useAuthStore.getState().openAuthModal({
        reason: "Vui lòng đăng nhập để chỉnh sửa Tủ nhạc đã lưu.",
      });
      return;
    }

    const prevItems = get().savedItems;
    set((state) => ({
      savedItems: prevItems.filter((entry) => entry.id !== itemId),
      syncError: null,
      mutatingIds: { ...state.mutatingIds, [itemId]: true },
    }));

    try {
      await removeItemFromCrate(user.uid, itemId);
    } catch (error) {
      console.error("[SavedCrateStore] Remove item failed:", error);
      set({
        savedItems: prevItems,
        syncError: "Không thể xóa mục này khỏi Firestore. Vui lòng thử lại.",
      });
    } finally {
      set((state) => {
        const nextMutating = { ...state.mutatingIds };
        delete nextMutating[itemId];
        return { mutatingIds: nextMutating };
      });
    }
  },

  clearSavedItems: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    const prevItems = get().savedItems;
    if (prevItems.length === 0) return;

    set({ savedItems: [], syncError: null, isSyncing: true });

    try {
      await clearUserCrate(
        user.uid,
        prevItems.map((entry) => entry.id)
      );
      set({ isSyncing: false });
    } catch (error) {
      console.error("[SavedCrateStore] Clear crate failed:", error);
      set({
        savedItems: prevItems,
        isSyncing: false,
        syncError: "Không thể xóa toàn bộ Tủ nhạc trên Firestore.",
      });
    }
  },

  requestOpenCrate: () => {
    const { user } = useAuthStore.getState();
    if (!user) {
      useAuthStore.getState().openAuthModal({
        reason: "Đăng nhập để mở và đồng bộ Tủ nhạc yêu thích của bạn.",
        pendingAction: { type: "openCrate" },
      });
      return;
    }

    usePreferenceStore.getState().openCrate();
  },
}));
