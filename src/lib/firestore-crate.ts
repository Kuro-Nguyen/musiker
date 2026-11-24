import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { MusicResultItem, TrackItem } from "@/types/music";

const MAX_CRATE_ITEMS = 200;
const BATCH_DELETE_CHUNK_SIZE = 400;

export function toFirestoreDocId(itemId: string): string {
  const sanitized = itemId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 128);
  return sanitized || "item";
}

export function stripUndefinedDeep<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefinedDeep(entry)) as T;
  }
  const cleanObj: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      cleanObj[key] = stripUndefinedDeep(val);
    }
  }
  return cleanObj as T;
}

function normalizeHttpUrl(value: string | undefined, fallback: string, maxLen: number): string {
  const trimmed = (value ?? "").trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.slice(0, maxLen);
  }
  return fallback;
}

function normalizeCoverUrl(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (
    trimmed === "" ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("data:image/svg+xml")
  ) {
    return trimmed.slice(0, 4096);
  }
  return "";
}

function sanitizeTrackForFirestore(track: TrackItem): TrackItem {
  const rawPreview = track.previewUrl ? track.previewUrl.trim() : null;
  const safePreview =
    rawPreview === null || rawPreview === "" || /^https?:\/\//i.test(rawPreview)
      ? rawPreview?.slice(0, 2048) ?? null
      : null;

  return stripUndefinedDeep({
    id: String(track.id || "").slice(0, 128) || "track",
    title: (track.title || "Unknown Track").slice(0, 300),
    duration: Number.isFinite(track.duration)
      ? Math.min(86400, Math.max(0, Math.round(track.duration)))
      : 30,
    rank: Number.isFinite(track.rank)
      ? Math.min(1_000_000_000_000, Math.max(0, Math.round(track.rank)))
      : 500000,
    previewUrl: safePreview,
    artistName: (track.artistName || "Unknown Artist").slice(0, 300),
    artistId: String(track.artistId || "0").slice(0, 128) || "0",
    albumId: track.albumId ? String(track.albumId).slice(0, 128) : undefined,
    albumTitle: track.albumTitle ? String(track.albumTitle).slice(0, 300) : undefined,
    coverUrl: normalizeCoverUrl(track.coverUrl),
  });
}

function sanitizeMusicItemForFirestore(item: MusicResultItem): MusicResultItem {
  return stripUndefinedDeep({
    id: String(item.id || "").slice(0, 128) || "item",
    type: item.type,
    title: (item.title || "Untitled").slice(0, 300),
    subtitle: (item.subtitle || "Unknown Artist").slice(0, 300),
    coverUrl: normalizeCoverUrl(item.coverUrl),
    releaseYear: item.releaseYear ? item.releaseYear.slice(0, 20) : undefined,
    genre: item.genre ? item.genre.slice(0, 100) : undefined,
    popularityScore: Math.min(
      100,
      Math.max(0, Math.round(Number.isFinite(item.popularityScore) ? item.popularityScore : 75))
    ),
    discoveryReason: (item.discoveryReason || "Saved item").slice(0, 300),
    featuredTrack: sanitizeTrackForFirestore(item.featuredTrack),
    tracklist: item.tracklist
      ? item.tracklist.slice(0, 25).map(sanitizeTrackForFirestore)
      : undefined,
    externalUrl: normalizeHttpUrl(
      item.externalUrl,
      "https://music.apple.com",
      2048
    ),
  });
}

function mapFirestoreDocToMusicItem(data: Record<string, unknown>, fallbackId: string): MusicResultItem | null {
  if (!data || typeof data.title !== "string" || typeof data.subtitle !== "string") {
    return null;
  }
  const rawType = data.type;
  const type =
    rawType === "album" || rawType === "track" || rawType === "artist"
      ? rawType
      : "album";

  return {
    id: typeof data.id === "string" ? data.id : fallbackId,
    type,
    title: data.title,
    subtitle: data.subtitle,
    coverUrl: typeof data.coverUrl === "string" ? data.coverUrl : "",
    releaseYear: typeof data.releaseYear === "string" ? data.releaseYear : undefined,
    genre: typeof data.genre === "string" ? data.genre : undefined,
    popularityScore: typeof data.popularityScore === "number" ? data.popularityScore : 75,
    discoveryReason: typeof data.discoveryReason === "string" ? data.discoveryReason : "",
    featuredTrack: data.featuredTrack as TrackItem,
    tracklist: Array.isArray(data.tracklist) ? (data.tracklist as TrackItem[]) : undefined,
    externalUrl: typeof data.externalUrl === "string" ? data.externalUrl : "",
  };
}

export function subscribeSavedCrate(
  uid: string,
  onItems: (items: MusicResultItem[]) => void,
  onError: (message: string) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    return () => {};
  }

  const colRef = collection(db, "users", uid, "savedItems");
  const q = query(colRef, orderBy("savedAt", "desc"), limit(MAX_CRATE_ITEMS));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: MusicResultItem[] = [];
      snapshot.forEach((docSnap) => {
        const mapped = mapFirestoreDocToMusicItem(
          docSnap.data() as Record<string, unknown>,
          docSnap.id
        );
        if (mapped) {
          items.push(mapped);
        }
      });
      onItems(items);
    },
    (err) => {
      console.error("[Firestore SavedCrate] Subscription error:", err);
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code ?? "")
          : "";
      onError(
        code === "permission-denied"
          ? "Bạn không có quyền truy cập Tủ nhạc này."
          : "Không thể đồng bộ Tủ nhạc trực tuyến lúc này."
      );
    }
  );
}

export async function saveItemToCrate(
  uid: string,
  item: MusicResultItem
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error("Không thể kết nối dịch vụ đồng bộ lúc này.");
  }

  const docId = toFirestoreDocId(item.id);
  const sanitized = sanitizeMusicItemForFirestore(item);
  const docRef = doc(db, "users", uid, "savedItems", docId);

  await setDoc(docRef, {
    ...sanitized,
    ownerUid: uid,
    savedAt: serverTimestamp(),
  });
}

export async function removeItemFromCrate(
  uid: string,
  itemId: string
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error("Không thể kết nối dịch vụ đồng bộ lúc này.");
  }

  const docId = toFirestoreDocId(itemId);
  await deleteDoc(doc(db, "users", uid, "savedItems", docId));
}

export async function clearUserCrate(
  uid: string,
  itemIds: string[]
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) {
    throw new Error("Không thể kết nối dịch vụ đồng bộ lúc này.");
  }

  for (let i = 0; i < itemIds.length; i += BATCH_DELETE_CHUNK_SIZE) {
    const chunk = itemIds.slice(i, i + BATCH_DELETE_CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, "users", uid, "savedItems", toFirestoreDocId(id)));
    }
    await batch.commit();
  }
}
