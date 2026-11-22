"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { create } from "zustand";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { MusicResultItem } from "@/types/music";

export interface AuthUserSummary {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type PendingAuthAction =
  | { type: "saveItem"; item: MusicResultItem }
  | { type: "openCrate" };

export interface AuthActionResult {
  ok: boolean;
  error?: string;
}

interface AuthState {
  user: AuthUserSummary | null;
  isAuthLoading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalReason: string | null;
  pendingAction: PendingAuthAction | null;

  openAuthModal: (options?: {
    reason?: string;
    pendingAction?: PendingAuthAction;
  }) => void;
  closeAuthModal: () => void;
  clearPendingAction: () => void;
  setAuthState: (user: AuthUserSummary | null, isAuthLoading: boolean) => void;

  signInWithGoogle: () => Promise<AuthActionResult>;
  signInWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthActionResult>;
  sendPasswordReset: (email: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
}

function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email hoặc mật khẩu không chính xác.";
    case "auth/email-already-in-use":
      return "Email này đã được sử dụng cho một tài khoản khác.";
    case "auth/weak-password":
      return "Mật khẩu cần có tối thiểu 6 ký tự.";
    case "auth/invalid-email":
      return "Địa chỉ email không đúng định dạng.";
    case "auth/popup-closed-by-user":
      return "Bạn đã đóng cửa sổ đăng nhập Google.";
    case "auth/cancelled-popup-request":
      return "Yêu cầu đăng nhập trước đó đã bị hủy. Vui lòng thử lại.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn pop-up Google. Hãy cho phép pop-up cho trang này và thử lại.";
    case "auth/unauthorized-domain":
      return "Tên miền hiện tại chưa được thêm vào Authorized domains trong Firebase Console.";
    case "auth/too-many-requests":
      return "Thử lại quá nhiều lần. Vui lòng đợi một lát rồi đăng nhập lại.";
    case "auth/network-request-failed":
      return "Không thể kết nối máy chủ Firebase. Vui lòng kiểm tra kết nối mạng.";
    default:
      return "Không thể xác thực tài khoản lúc này. Vui lòng thử lại.";
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthLoading: true,
  isConfigured: isFirebaseConfigured(),
  isAuthModalOpen: false,
  authModalReason: null,
  pendingAction: null,

  openAuthModal: (options) =>
    set({
      isAuthModalOpen: true,
      authModalReason: options?.reason ?? null,
      pendingAction: options?.pendingAction ?? null,
    }),

  closeAuthModal: () =>
    set({
      isAuthModalOpen: false,
      authModalReason: null,
      pendingAction: null,
    }),

  clearPendingAction: () => set({ pendingAction: null }),

  setAuthState: (user, isAuthLoading) =>
    set({
      user,
      isAuthLoading,
      isConfigured: isFirebaseConfigured(),
    }),

  signInWithGoogle: async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        ok: false,
        error: "Firebase chưa được cấu hình trong .env.local.",
      };
    }

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapFirebaseAuthError(error) };
    }
  },

  signInWithEmail: async (email, password) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        ok: false,
        error: "Firebase chưa được cấu hình trong .env.local.",
      };
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapFirebaseAuthError(error) };
    }
  },

  signUpWithEmail: async (email, password) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        ok: false,
        error: "Firebase chưa được cấu hình trong .env.local.",
      };
    }

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapFirebaseAuthError(error) };
    }
  },

  sendPasswordReset: async (email) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      return {
        ok: false,
        error: "Firebase chưa được cấu hình trong .env.local.",
      };
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapFirebaseAuthError(error) };
    }
  },

  logout: async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  },
}));
