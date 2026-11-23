import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function cleanEnv(value?: string): string {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  ),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

/**
 * Checks whether all mandatory Firebase Web SDK public keys are configured.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

/**
 * Lazily returns the singleton Firebase App instance on the client only.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) {
    return null;
  }
  if (!cachedApp) {
    cachedApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

/**
 * Returns the singleton Firebase Auth instance when running in a configured browser.
 */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!cachedAuth) {
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

/**
 * Returns the singleton Cloud Firestore instance when running in a configured browser.
 */
export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (!cachedDb) {
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}
