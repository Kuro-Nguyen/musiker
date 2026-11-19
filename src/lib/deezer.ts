import {
  findItunesPreview,
  getItunesAlbumDetails,
  searchItunesAlbums,
  searchItunesArtists,
  searchItunesTracks,
  type QuizArtistResult,
} from "@/lib/itunes";
import type { EntityType, MusicResultItem, TrackItem } from "@/types/music";

const DEEZER_BASE_URL = "https://api.deezer.com";
const DEEZER_TIMEOUT_MS = 2000;
const CIRCUIT_BREAKER_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 250;

export type MusicProvider = "deezer" | "itunes";

let deezerCircuitOpenUntil = 0;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const deezerCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = deezerCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    deezerCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): void {
  if (deezerCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = deezerCache.keys().next().value;
    if (oldestKey) {
      deezerCache.delete(oldestKey);
    }
  }
  deezerCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function getProviderStatus(): {
  activeProvider: MusicProvider;
  circuitOpen: boolean;
  circuitReopensAt: number | null;
} {
  const circuitOpen = Date.now() < deezerCircuitOpenUntil;
  return {
    activeProvider: circuitOpen ? "itunes" : "deezer",
    circuitOpen,
    circuitReopensAt: circuitOpen ? deezerCircuitOpenUntil : null,
  };
}

function isDeezerCircuitOpen(): boolean {
  return Date.now() < deezerCircuitOpenUntil;
}

function tripDeezerCircuit(): void {
  deezerCircuitOpenUntil = Date.now() + CIRCUIT_BREAKER_MS;
}

interface DeezerErrorPayload {
  error?: {
    type?: string;
    message?: string;
    code?: number;
  };
}

interface DeezerArtistRaw {
  id: number;
  name: string;
  link?: string;
  picture?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  nb_fan?: number;
}

interface DeezerAlbumRaw {
  id: number;
  title: string;
  link?: string;
  cover?: string;
  cover_medium?: string;
  cover_big?: string;
  cover_xl?: string;
  release_date?: string;
  fans?: number;
  genres?: { data?: Array<{ id: number; name: string }> };
  artist?: {
    id: number;
    name: string;
    picture_medium?: string;
  };
  tracks?: {
    data?: DeezerTrackRaw[];
  };
}

interface DeezerTrackRaw {
  id: number;
  title: string;
  link?: string;
  duration?: number;
  rank?: number;
  preview?: string;
  artist?: {
    id: number;
    name: string;
  };
  album?: {
    id: number;
    title: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
    release_date?: string;
  };
}

interface DeezerSearchResponse<T> extends DeezerErrorPayload {
  data?: T[];
}

async function fetchDeezerJson<T extends DeezerErrorPayload>(
  path: string
): Promise<T> {
  const cached = getCached<T>(path);
  if (cached) return cached;

  if (isDeezerCircuitOpen()) {
    throw new Error("DEEZER_CIRCUIT_OPEN");
  }

  try {
    const response = await fetch(`${DEEZER_BASE_URL}${path}`, {
      signal: AbortSignal.timeout(DEEZER_TIMEOUT_MS),
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status >= 500) {
        tripDeezerCircuit();
      }
      throw new Error(`Deezer HTTP ${response.status}`);
    }

    const payload = (await response.json()) as T;
    if (payload.error) {
      throw new Error(payload.error.message ?? "Deezer API Error");
    }

    setCached(path, payload);
    return payload;
  } catch (err) {
    // Trip 10-minute circuit breaker on network/TLS/DNS/timeout failure
    if (
      err instanceof Error &&
      err.message !== "DEEZER_CIRCUIT_OPEN" &&
      !err.message.startsWith("Deezer HTTP 4")
    ) {
      tripDeezerCircuit();
    }
    throw err;
  }
}

function normalizeDeezerScore(rankOrFans?: number): number {
  if (!rankOrFans || rankOrFans <= 0) return 65;
  if (rankOrFans > 100000) {
    return Math.min(99, Math.max(45, Math.round((rankOrFans / 1000000) * 100)));
  }
  return Math.min(98, Math.max(40, Math.round(Math.log10(rankOrFans + 1) * 18)));
}

function mapDeezerTrack(raw: DeezerTrackRaw, fallbackCover?: string): TrackItem {
  const cover =
    raw.album?.cover_big ??
    raw.album?.cover_xl ??
    raw.album?.cover_medium ??
    fallbackCover ??
    "";

  return {
    id: String(raw.id),
    title: raw.title,
    duration: raw.duration ?? 30,
    rank: raw.rank ?? 500000,
    previewUrl: raw.preview && raw.preview.length > 0 ? raw.preview : null,
    artistName: raw.artist?.name ?? "Unknown Artist",
    artistId: String(raw.artist?.id ?? "0"),
    albumId: raw.album?.id ? String(raw.album.id) : undefined,
    albumTitle: raw.album?.title,
    coverUrl: cover,
  };
}

export async function searchArtistsForQuiz(
  query: string,
  limit = 8
): Promise<{
  artists: QuizArtistResult[];
  items: MusicResultItem[];
  provider: MusicProvider;
}> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      artists: [],
      items: [],
      provider: getProviderStatus().activeProvider,
    };
  }

  try {
    const res = await fetchDeezerJson<DeezerSearchResponse<DeezerArtistRaw>>(
      `/search/artist?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    );
    const rawArtists = res.data ?? [];

    const artists: QuizArtistResult[] = rawArtists.map((a) => ({
      id: String(a.id),
      name: a.name,
      pictureUrl: a.picture_big ?? a.picture_medium ?? a.picture ?? "",
      externalUrl: a.link ?? `https://www.deezer.com/artist/${a.id}`,
    }));

    const items: MusicResultItem[] = await Promise.all(
      rawArtists.map(async (artist) => {
        const picture =
          artist.picture_xl ?? artist.picture_big ?? artist.picture_medium ?? "";
        let featuredTrack: TrackItem = {
          id: `dz-artist-${artist.id}`,
          title: artist.name,
          duration: 30,
          rank: artist.nb_fan ?? 700000,
          previewUrl: null,
          artistName: artist.name,
          artistId: String(artist.id),
          coverUrl: picture,
        };

        try {
          const topRes = await fetchDeezerJson<DeezerSearchResponse<DeezerTrackRaw>>(
            `/artist/${artist.id}/top?limit=1`
          );
          const topTrack = topRes.data?.[0];
          if (topTrack) {
            featuredTrack = mapDeezerTrack(topTrack, picture);
          }
        } catch {
          // Non-fatal: preview fallback handles hydration later
        }

        return {
          id: String(artist.id),
          type: "artist",
          title: artist.name,
          subtitle: "Nghệ sĩ",
          coverUrl: picture,
          popularityScore: normalizeDeezerScore(artist.nb_fan),
          discoveryReason: "Kết quả tìm kiếm trực tiếp • Deezer API",
          featuredTrack,
          externalUrl: artist.link ?? `https://www.deezer.com/artist/${artist.id}`,
        };
      })
    );

    return { artists, items, provider: "deezer" };
  } catch {
    const itunesRes = await searchItunesArtists(trimmed, limit);
    return { ...itunesRes, provider: "itunes" };
  }
}

export async function searchMusicEntities(
  query: string,
  type: EntityType,
  limit = 8
): Promise<{ items: MusicResultItem[]; provider: MusicProvider }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { items: [], provider: getProviderStatus().activeProvider };
  }

  if (type === "artist") {
    const res = await searchArtistsForQuiz(trimmed, limit);
    return { items: res.items, provider: res.provider };
  }

  try {
    if (type === "track") {
      const res = await fetchDeezerJson<DeezerSearchResponse<DeezerTrackRaw>>(
        `/search/track?q=${encodeURIComponent(trimmed)}&limit=${limit}`
      );
      const items: MusicResultItem[] = await Promise.all(
        (res.data ?? []).map(async (track) => {
          const mappedTrack = mapDeezerTrack(track);
          if (!mappedTrack.previewUrl) {
            const fallback = await findItunesPreview(
              mappedTrack.artistName,
              mappedTrack.title
            );
            mappedTrack.previewUrl = fallback.previewUrl;
          }
          return {
            id: String(track.id),
            type: "track",
            title: track.title,
            subtitle: track.artist?.name ?? "Unknown Artist",
            coverUrl: mappedTrack.coverUrl,
            releaseYear: track.album?.release_date?.slice(0, 4),
            popularityScore: normalizeDeezerScore(track.rank),
            discoveryReason: "Bài hát từ Deezer Search • Preview 30s",
            featuredTrack: mappedTrack,
            externalUrl: track.link ?? `https://www.deezer.com/track/${track.id}`,
          };
        })
      );
      return { items, provider: "deezer" };
    }

    // type === 'album'
    const res = await fetchDeezerJson<DeezerSearchResponse<DeezerAlbumRaw>>(
      `/search/album?q=${encodeURIComponent(trimmed)}&limit=${limit}`
    );

    const items: MusicResultItem[] = (res.data ?? []).map((album) => {
      const coverUrl =
        album.cover_xl ?? album.cover_big ?? album.cover_medium ?? album.cover ?? "";
      const artistName = album.artist?.name ?? "Unknown Artist";
      return {
        id: String(album.id),
        type: "album",
        title: album.title,
        subtitle: artistName,
        coverUrl,
        releaseYear: album.release_date?.slice(0, 4),
        genre: album.genres?.data?.[0]?.name,
        popularityScore: normalizeDeezerScore(album.fans),
        discoveryReason: "Album từ Deezer Search • Bấm Play để nghe bài nổi bật",
        featuredTrack: {
          id: `dz-album-${album.id}`,
          title: album.title,
          duration: 30,
          rank: album.fans ?? 750000,
          previewUrl: null,
          artistName,
          artistId: String(album.artist?.id ?? "0"),
          albumId: String(album.id),
          albumTitle: album.title,
          coverUrl,
        },
        externalUrl: album.link ?? `https://www.deezer.com/album/${album.id}`,
      };
    });

    return { items, provider: "deezer" };
  } catch {
    const items =
      type === "track"
        ? await searchItunesTracks(trimmed, limit)
        : await searchItunesAlbums(trimmed, limit);
    return { items, provider: "itunes" };
  }
}

export async function getAlbumDetailsWithTracks(
  albumId: string,
  fallbackQuery?: { title?: string; artist?: string }
): Promise<{ album: MusicResultItem | null; provider: MusicProvider }> {
  const isMockOrInvalidNumeric = !/^\d+$/.test(albumId);

  if (!isMockOrInvalidNumeric && !isDeezerCircuitOpen()) {
    try {
      const album = await fetchDeezerJson<DeezerAlbumRaw & DeezerErrorPayload>(
        `/album/${albumId}`
      );
      const coverUrl =
        album.cover_xl ?? album.cover_big ?? album.cover_medium ?? album.cover ?? "";
      const rawTracks = album.tracks?.data ?? [];

      const tracklist = rawTracks
        .map((t) =>
          mapDeezerTrack(
            {
              ...t,
              artist: t.artist ?? album.artist,
              album: {
                id: album.id,
                title: album.title,
                cover_big: coverUrl,
              },
            },
            coverUrl
          )
        )
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 15);

      let featuredTrack =
        tracklist.find((t) => Boolean(t.previewUrl)) ?? tracklist[0];

      if (featuredTrack && !featuredTrack.previewUrl) {
        const fb = await findItunesPreview(
          featuredTrack.artistName,
          featuredTrack.title
        );
        featuredTrack = { ...featuredTrack, previewUrl: fb.previewUrl };
      }

      if (featuredTrack) {
        return {
          album: {
            id: String(album.id),
            type: "album",
            title: album.title,
            subtitle: album.artist?.name ?? "Unknown Artist",
            coverUrl,
            releaseYear: album.release_date?.slice(0, 4),
            genre: album.genres?.data?.[0]?.name,
            popularityScore: normalizeDeezerScore(album.fans),
            discoveryReason: `Tracklist ${tracklist.length} bài • Nguồn Deezer API`,
            featuredTrack,
            tracklist,
            externalUrl: album.link ?? `https://www.deezer.com/album/${album.id}`,
          },
          provider: "deezer",
        };
      }
    } catch {
      // Fail over seamlessly to iTunes Lookup API
    }
  }

  const itunesAlbum = await getItunesAlbumDetails(albumId, fallbackQuery);
  return { album: itunesAlbum, provider: "itunes" };
}

