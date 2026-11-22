"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  BookmarkCheck,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  X,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

type AuthMode = "signin" | "signup" | "reset";

function GoogleLogoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      fill="none"
    >
      <path
        d="M21.805 12.23c0-.68-.06-1.36-.187-2.022H12.24v3.83h5.37a4.59 4.59 0 0 1-1.99 3.01v2.495h3.218c1.883-1.734 2.967-4.294 2.967-7.313Z"
        fill="#4285F4"
      />
      <path
        d="M12.24 21.96c2.688 0 4.953-.884 6.604-2.404l-3.218-2.496c-.894.6-2.047.95-3.386.95-2.598 0-4.8-1.754-5.588-4.115H3.332v2.575a9.97 9.97 0 0 0 8.908 5.49Z"
        fill="#34A853"
      />
      <path
        d="M6.652 13.895a5.982 5.982 0 0 1 0-3.79V7.53H3.332a9.97 9.97 0 0 0 0 8.94l3.32-2.575Z"
        fill="#FBBC05"
      />
      <path
        d="M12.24 5.99a5.41 5.41 0 0 1 3.82 1.494l2.845-2.845C17.185 3.028 14.92 2.04 12.24 2.04A9.97 9.97 0 0 0 3.332 7.53l3.32 2.575c.788-2.36 2.99-4.115 5.588-4.115Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalReason,
    pendingAction,
    isConfigured,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
  } = useAuthStore();

  const [mode, setMode] = React.useState<AuthMode>("signin");
  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isAuthModalOpen) return;
    setMode("signin");
    setPassword("");
    setShowPassword(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [isAuthModalOpen]);

  React.useEffect(() => {
    if (!isAuthModalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  const handleModeSwitch = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    const res = await signInWithGoogle();
    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? "Đăng nhập Google thất bại.");
      return;
    }
    if (!pendingAction) {
      closeAuthModal();
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    if (mode === "reset") {
      const res = await sendPasswordReset(email);
      setIsSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error ?? "Không thể gửi email đặt lại mật khẩu.");
        return;
      }
      setSuccessMsg(
        "Đã gửi liên kết đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn."
      );
      return;
    }

    const res =
      mode === "signup"
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

    setIsSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error ?? "Xác thực thất bại.");
      return;
    }

    if (!pendingAction) {
      closeAuthModal();
    }
  };

  const submitLabel =
    mode === "signin"
      ? "Đăng nhập"
      : mode === "signup"
        ? "Tạo tài khoản"
        : "Gửi email đặt lại mật khẩu";

  return (
    <AnimatePresence>
      {isAuthModalOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAuthModal();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl sm:rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#FF5500]" />
                <h2
                  id="auth-modal-title"
                  className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)]"
                >
                  {APP_NAME} {"//"} ACCOUNT SYNC
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAuthModal}
                aria-label="Đóng cửa sổ đăng nhập"
                className="touch-target inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-5">
              {/* Contextual auth gate message */}
              {authModalReason && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FF5500]/35 bg-[#FF5500]/8 px-3.5 py-2.5 text-xs text-[var(--text-primary)]">
                  {pendingAction?.type === "saveItem" ? (
                    <BookmarkCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5500]" />
                  ) : (
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5500]" />
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-medium">{authModalReason}</p>
                    {pendingAction?.type === "saveItem" && (
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Sau khi đăng nhập, mục này sẽ tự động được lưu vào Cloud Firestore của bạn.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Firebase Config Warning when env vars are missing */}
              {!isConfigured && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2.5 text-xs text-[var(--text-primary)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Firebase chưa được cấu hình. Hãy điền các biến{" "}
                    <code className="font-mono text-[var(--text-primary)]">
                      NEXT_PUBLIC_FIREBASE_*
                    </code>{" "}
                    vào file <code className="font-mono">.env.local</code> theo hướng dẫn trong{" "}
                    <code className="font-mono">README.md</code>.
                  </p>
                </div>
              )}

              {/* Mode Tabs */}
              {mode !== "reset" ? (
                <div
                  role="tablist"
                  aria-label="Chọn chế độ tài khoản"
                  className="grid grid-cols-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    onClick={() => handleModeSwitch("signin")}
                    className={cn(
                      "min-h-10 rounded-md text-xs font-semibold transition-colors cursor-pointer sm:min-h-8",
                      mode === "signin"
                        ? "bg-[var(--accent-primary)] text-[var(--accent-foreground)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    onClick={() => handleModeSwitch("signup")}
                    className={cn(
                      "min-h-10 rounded-md text-xs font-semibold transition-colors cursor-pointer sm:min-h-8",
                      mode === "signup"
                        ? "bg-[var(--accent-primary)] text-[var(--accent-foreground)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    Đăng ký
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">
                    Khôi phục mật khẩu
                  </p>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch("signin")}
                    className="font-mono text-[11px] text-[#FF5500] hover:underline cursor-pointer"
                  >
                    Quay lại đăng nhập
                  </button>
                </div>
              )}

              {/* Google Federated Sign-In (visible in Sign-In and Sign-Up) */}
              {mode !== "reset" && (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting || !isConfigured}
                    onClick={() => void handleGoogleAuth()}
                    className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed sm:h-10"
                  >
                    <GoogleLogoIcon />
                    <span>Tiếp tục với Google</span>
                  </button>

                  <div className="relative flex items-center py-0.5">
                    <div className="flex-grow border-t border-[var(--border-subtle)]" />
                    <span className="mx-3 shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                      hoặc dùng Email
                    </span>
                    <div className="flex-grow border-t border-[var(--border-subtle)]" />
                  </div>
                </>
              )}

              {/* Email / Password Auth Form (Best practice autofill attributes) */}
              <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-email"
                    className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      spellCheck={false}
                      required
                      enterKeyHint={mode === "reset" ? "done" : "next"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] pl-9 pr-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[#FF5500] sm:h-10 sm:text-xs"
                    />
                  </div>
                </div>

                {mode !== "reset" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        className="block font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)]"
                      >
                        Mật khẩu
                      </label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => handleModeSwitch("reset")}
                          className="font-mono text-[11px] text-[var(--text-secondary)] hover:text-[#FF5500] cursor-pointer"
                        >
                          Quên mật khẩu?
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                      <input
                        id={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        name={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        type={showPassword ? "text" : "password"}
                        autoComplete={
                          mode === "signup"
                            ? "new-password"
                            : "current-password"
                        }
                        minLength={6}
                        required
                        enterKeyHint="done"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          mode === "signup"
                            ? "Tạo mật khẩu (tối thiểu 6 ký tự)"
                            : "Nhập mật khẩu của bạn"
                        }
                        className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] pl-9 pr-11 text-base text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none transition-colors focus:border-[#FF5500] sm:h-10 sm:text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                        }
                        className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer sm:h-8 sm:w-8"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-xs text-red-500"
                  >
                    {errorMsg}
                  </p>
                )}

                {successMsg && (
                  <p
                    role="status"
                    className="rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400"
                  >
                    {successMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !isConfigured}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF5500] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#E64D00] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed sm:h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>{submitLabel}</span>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
