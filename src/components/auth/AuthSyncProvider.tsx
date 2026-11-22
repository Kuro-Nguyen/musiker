"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { subscribeSavedCrate } from "@/lib/firestore-crate";
import { useAuthStore } from "@/store/useAuthStore";
import { usePreferenceStore } from "@/store/usePreferenceStore";
import { useSavedCrateStore } from "@/store/useSavedCrateStore";

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const { setAuthState, closeAuthModal, clearPendingAction } =
      useAuthStore.getState();
    const { setSavedItems, setSyncing, setSyncError, resetCrate, savePendingItemOnLogin } =
      useSavedCrateStore.getState();

    if (!isFirebaseConfigured()) {
      setAuthState(null, false);
      return;
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthState(null, false);
      return;
    }

    let unsubscribeCrate: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeCrate) {
        unsubscribeCrate();
        unsubscribeCrate = null;
      }

      if (!firebaseUser) {
        setAuthState(null, false);
        resetCrate();
        usePreferenceStore.getState().closeCrate();
        return;
      }

      setAuthState(
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        false
      );

      setSyncing(true);
      unsubscribeCrate = subscribeSavedCrate(
        firebaseUser.uid,
        (items) => {
          setSavedItems(items);
        },
        (msg) => {
          setSyncError(msg);
        }
      );

      const { pendingAction } = useAuthStore.getState();
      if (pendingAction) {
        clearPendingAction();
        closeAuthModal();
        if (pendingAction.type === "saveItem") {
          void savePendingItemOnLogin(firebaseUser.uid, pendingAction.item);
        } else if (pendingAction.type === "openCrate") {
          usePreferenceStore.getState().openCrate();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeCrate) {
        unsubscribeCrate();
      }
    };
  }, []);

  return <>{children}</>;
}
