import {
  findItunesPreview,
  upgradeItunesArtwork,
  type QuizArtistResult,
} from "@/lib/itunes";
import type { EntityType, MusicResultItem, TrackItem } from "@/types/music";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";
const REQUEST_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 250;
const AUTH_BACKOFF_MS = 5 * 60 * 1000;

interface TokenState {
  accessToken: string;
  expiresAt: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

let cachedToken: TokenState | null = null;
let authCircuitOpenUntil = 0;
const spotifyCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = spotifyCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    spotifyCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): void {
  if (spotifyCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = spotifyCache.keys().next().value;
    if (oldestKey) {
      spotifyCache.delete(oldestKey);
    }
  }
  spotifyCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function cleanEnv(value?: string): string {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

function getCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = cleanEnv(process.env.SPOTIFY_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.SPOTIFY_CLIENT_SECRET);
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function isSpotifyConfigured(): boolean {
  return getCredentials() !== null && Date.now() >= authCircuitOpenUntil;
}

export function stripSpotifyPrefix(id: string): string {
  return id.replace(/^sp-(album-|track-|artist-)?/i, "");
}

export function isSpotifyEntityId(id: string): boolean {
  return /^sp-/i.test(id) || /^[0-9A-Za-z]{22}$/.test(id);
}

function createSpotifyFallbackSvg(label: string): string {
  const safeLabel = label.replace(/[<>&"']/g, "").slice(0, 18) || "SPOTIFY";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#141417"/>
    <circle cx="300" cy="300" r="145" fill="none" stroke="#F4F4F6" stroke-opacity="0.2" stroke-width="2"/>
    <circle cx="300" cy="300" r="88" fill="#FF5500" fill-opacity="0.9"/>
    <circle cx="300" cy="300" r="22" fill="#141417"/>
    <text x="48" y="544" font-family="monospace" font-size="22" fill="#F4F4F6" fill-opacity="0.75">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function getSpotifyAccessToken(): Promise<string | null> {
  const creds = getCredentials();
  if (!creds) return null;
  if (Date.now() < authCircuitOpenUntil) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  try {
    const basic = Buffer.from(
      `${creds.clientId}:${creds.clientSecret}`
    ).toString("base64");
    const response = await fetch(SPOTIFY_ACCOUNTS_URL, {
      method: "POST",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        authCircuitOpenUntil = Date.now() + AUTH_BACKOFF_MS;
      }
      return null;
    }

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!payload.access_token) return null;

    cachedToken = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    };
    return cachedToken.accessToken;
  } catch {
    return null;
  }
}

async function fetchSpotifyJson<T>(pathWithQuery: string): Promise<T | null> {
  const cacheKey = `sp:${pathWithQuery}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const token = await getSpotifyAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${SPOTIFY_API_BASE_URL}${pathWithQuery}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (response.status === 401) {
      cachedToken = null;
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as T;
    setCached(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

interface SpotifyImage {
  url: string;
  height?: number | null;
  width?: number | null;
}

interface SpotifyArtistSimple {
  id: string;
  name: string;
  external_urls?: { spotify?: string };
}

interface SpotifyArtistFull extends SpotifyArtistSimple {
  genres?: string[];
  popularity?: number;
  images?: SpotifyImage[];
}

interface SpotifyAlbumSimple {
  id: string;
  name: string;
  album_type?: string;
  total_tracks?: number;
  release_date?: string;
  images?: SpotifyImage[];
  artists?: SpotifyArtistSimple[];
  external_urls?: { spotify?: string };
}

interface SpotifyTrackSimple {
  id: string;
  name: string;
  duration_ms?: number;
  preview_url?: string | null;
  track_number?: number;
  artists?: SpotifyArtistSimple[];
  external_urls?: { spotify?: string };
}

interface SpotifyTrackFull extends SpotifyTrackSimple {
  popularity?: number;
  album?: SpotifyAlbumSimple;
}

interface SpotifyAlbumFull extends SpotifyAlbumSimple {
  genres?: string[];
  popularity?: number;
  tracks?: {
    items?: SpotifyTrackSimple[];
  };
}

interface SpotifySearchResponse {
  artists?: { items?: SpotifyArtistFull[] };
  albums?: { items?: SpotifyAlbumSimple[] };
  tracks?: { items?: SpotifyTrackFull[] };
}

function pickSpotifyCover(images?: SpotifyImage[], fallbackLabel = "MUZIKER"): string {
  const best = images?.find((img) => Boolean(img.url))?.url;
  if (best) return best;
  return createSpotifyFallbackSvg(fallbackLabel);
}

export function isSpotifyMultiTrackAlbum(album: SpotifyAlbumSimple): boolean {
  if (album.total_tracks !== undefined && album.total_tracks < 2) {
    return false;
  }
  if (/\s-\s*single$/i.test((album.name ?? "").trim())) {
    return false;
  }
  return true;
}

function mapSpotifyTrackToTrackItem(
  track: SpotifyTrackSimple & { popularity?: number; album?: SpotifyAlbumSimple },
  fallbackAlbum?: { id: string; title: string; coverUrl: string },
  rankOverride?: number
): TrackItem {
  const primaryArtist = track.artists?.[0];
  const coverUrl =
    track.album?.images?.[0]?.url ??
    fallbackAlbum?.coverUrl ??
    createSpotifyFallbackSvg(track.name);

  return {
    id: `sp-track-${track.id}`,
    title: track.name,
    duration: Math.max(1, Math.round((track.duration_ms ?? 30000) / 1000)),
    rank:
      rankOverride ??
      (track.popularity ? track.popularity * 10000 : 820000),
    previewUrl: track.preview_url ?? null,
    artistName:
      track.artists?.map((a) => a.name).join(", ") || "Unknown Artist",
    artistId: primaryArtist?.id ? `sp-artist-${primaryArtist.id}` : "0",
    albumId: track.album?.id
      ? `sp-${track.album.id}`
      : fallbackAlbum?.id,
    albumTitle: track.album?.name ?? fallbackAlbum?.title,
    coverUrl,
  };
}

export async function searchSpotifyArtists(
  query: string,
  limit = 8
): Promise<{ artists: QuizArtistResult[]; items: MusicResultItem[] }> {
  const trimmed = query.trim();
  if (!trimmed || !isSpotifyConfigured()) {
    return { artists: [], items: [] };
  }

  const safeLimit = Math.max(1, Math.min(10, limit));
  const data = await fetchSpotifyJson<SpotifySearchResponse>(
    `/search?q=${encodeURIComponent(trimmed)}&type=artist&limit=${safeLimit}`
  );

  const rawArtists = (data?.artists?.items ?? []).filter(
    (a) => Boolean(a.id && a.name)
  );
  if (rawArtists.length === 0) {
    return { artists: [], items: [] };
  }

  const artists: QuizArtistResult[] = [];
  const items: MusicResultItem[] = [];

  for (let index = 0; index < rawArtists.length; index += 1) {
    const artist = rawArtists[index];
    const coverUrl = pickSpotifyCover(artist.images, artist.name);
    const primaryGenre = artist.genres?.[0];
    const externalUrl =
      artist.external_urls?.spotify ??
      `https://open.spotify.com/artist/${artist.id}`;

    artists.push({
      id: `sp-artist-${artist.id}`,
      name: artist.name,
      pictureUrl: coverUrl,
      genre: primaryGenre,
      externalUrl,
    });

    items.push({
      id: `sp-artist-${artist.id}`,
      type: "artist",
      title: artist.name,
      subtitle: primaryGenre ?? "Nghệ sĩ Spotify",
      coverUrl,
      genre: primaryGenre,
      popularityScore: artist.popularity ?? Math.max(58, 92 - index * 4),
      discoveryReason: "Nghệ sĩ trên Spotify",
      featuredTrack: {
        id: `sp-artist-top-${artist.id}`,
        title: artist.name,
        duration: 30,
        rank: (artist.popularity ?? 78) * 10000,
        previewUrl: null,
        artistName: artist.name,
        artistId: `sp-artist-${artist.id}`,
        coverUrl,
      },
      externalUrl,
    });
  }

  return { artists, items };
}

export async function searchSpotifyTracks(
  query: string,
  limit = 8,
  offset = 0
): Promise<MusicResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed || !isSpotifyConfigured()) return [];

  const safeLimit = Math.max(1, Math.min(10, limit));
  const safeOffset = Math.max(0, Math.min(50, offset));
  const data = await fetchSpotifyJson<SpotifySearchResponse>(
    `/search?q=${encodeURIComponent(trimmed)}&type=track&limit=${safeLimit}&offset=${safeOffset}`
  );

  const rawTracks = (data?.tracks?.items ?? []).filter(
    (t) => Boolean(t.id && t.name)
  );

  return rawTracks.map((track, index) => {
    const trackItem = mapSpotifyTrackToTrackItem(
      track,
      undefined,
      (track.popularity ?? Math.max(55, 92 - index * 3)) * 10000
    );
    const artistNames =
      track.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
    const coverUrl = pickSpotifyCover(track.album?.images, track.name);

    return {
      id: `sp-track-${track.id}`,
      type: "track" as EntityType,
      title: track.name,
      subtitle: artistNames,
      coverUrl,
      releaseYear: track.album?.release_date?.slice(0, 4),
      popularityScore: track.popularity ?? Math.max(52, 92 - index * 4),
      discoveryReason: "Bài hát trên Spotify • Nghe thử 30s",
      featuredTrack: {
        ...trackItem,
        coverUrl,
      },
      externalUrl:
        track.external_urls?.spotify ??
        `https://open.spotify.com/track/${track.id}`,
    };
  });
}

export async function searchSpotifyAlbums(
  query: string,
  limit = 8,
  offset = 0
): Promise<MusicResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed || !isSpotifyConfigured()) return [];

  const safeLimit = Math.max(1, Math.min(10, limit));
  const safeOffset = Math.max(0, Math.min(50, offset));
  const data = await fetchSpotifyJson<SpotifySearchResponse>(
    `/search?q=${encodeURIComponent(trimmed)}&type=album&limit=10&offset=${safeOffset}`
  );

  const rawAlbums = (data?.albums?.items ?? [])
    .filter(
      (album) =>
        Boolean(album.id && album.name) && isSpotifyMultiTrackAlbum(album)
    )
    .slice(0, safeLimit);

  return rawAlbums.map((album, index) => {
    const albumId = `sp-${album.id}`;
    const artistName =
      album.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
    const primaryArtistId = album.artists?.[0]?.id
      ? `sp-artist-${album.artists[0].id}`
      : "0";
    const coverUrl = pickSpotifyCover(album.images, album.name);

    return {
      id: albumId,
      type: "album" as EntityType,
      title: album.name,
      subtitle: artistName,
      coverUrl,
      releaseYear: album.release_date?.slice(0, 4),
      popularityScore: Math.max(54, 92 - index * 4),
      discoveryReason: `Album (${album.total_tracks ?? "EP"} bài) • Spotify`,
      featuredTrack: {
        id: `sp-album-featured-${album.id}`,
        title: album.name,
        duration: 30,
        rank: 910000 - index * 15000,
        previewUrl: null,
        artistName,
        artistId: primaryArtistId,
        albumId,
        albumTitle: album.name,
        coverUrl,
      },
      externalUrl:
        album.external_urls?.spotify ??
        `https://open.spotify.com/album/${album.id}`,
    };
  });
}

export async function getSpotifyAlbumDetails(
  albumId: string,
  fallbackQuery?: { title?: string; artist?: string }
): Promise<MusicResultItem | null> {
  if (!isSpotifyConfigured()) return null;
  const rawId = stripSpotifyPrefix(albumId);
  if (!/^[0-9A-Za-z]{22}$/.test(rawId)) return null;

  const album = await fetchSpotifyJson<SpotifyAlbumFull>(
    `/albums/${rawId}`
  );
  if (!album || !album.name) return null;

  const prefixedAlbumId = `sp-${album.id}`;
  const artistName =
    album.artists?.map((a) => a.name).join(", ") ||
    fallbackQuery?.artist ||
    "Unknown Artist";
  const coverUrl = pickSpotifyCover(album.images, album.name);
  const rawTracks = (album.tracks?.items ?? []).slice(0, 15);

  const tracklist: TrackItem[] = rawTracks.map((track, idx) =>
    mapSpotifyTrackToTrackItem(
      track,
      { id: prefixedAlbumId, title: album.name, coverUrl },
      950000 - idx * 20000
    )
  );

  // Hydrate top 3 tracks missing Spotify preview_url in parallel within 2s via iTunes
  const previewTargets = tracklist
    .map((track, idx) => ({ track, idx }))
    .filter(({ track }) => !track.previewUrl)
    .slice(0, 3);

  if (previewTargets.length > 0) {
    await Promise.race([
      Promise.all(
        previewTargets.map(async ({ track, idx }) => {
          try {
            const fallback = await findItunesPreview(
              track.artistName || artistName,
              track.title
            );
            if (fallback.previewUrl) {
              tracklist[idx] = {
                ...tracklist[idx],
                previewUrl: fallback.previewUrl,
                duration: fallback.duration || tracklist[idx].duration,
              };
            }
          } catch {
            // Keep track playable on Spotify external link if iTunes preview misses
          }
        })
      ),
      new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      }),
    ]);
  }

  let featuredTrack: TrackItem =
    tracklist.find((t) => Boolean(t.previewUrl)) ??
    tracklist[0] ?? {
      id: `sp-album-featured-${album.id}`,
      title: album.name,
      duration: 30,
      rank: 860000,
      previewUrl: null,
      artistName,
      artistId: album.artists?.[0]?.id
        ? `sp-artist-${album.artists[0].id}`
        : "0",
      albumId: prefixedAlbumId,
      albumTitle: album.name,
      coverUrl,
    };

  if (!featuredTrack.previewUrl) {
    try {
      const fallback = await Promise.race([
        findItunesPreview(
          featuredTrack.artistName || artistName,
          featuredTrack.title
        ),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 1500);
        }),
      ]);
      if (fallback?.previewUrl) {
        featuredTrack = {
          ...featuredTrack,
          previewUrl: fallback.previewUrl,
          duration: fallback.duration || featuredTrack.duration,
        };
      }
    } catch {
      // Keep playable external link even if preview lookup fails
    }
  }

  return {
    id: prefixedAlbumId,
    type: "album",
    title: album.name,
    subtitle: artistName,
    coverUrl:
      coverUrl.startsWith("data:") && fallbackQuery?.title
        ? upgradeItunesArtwork(undefined, 600, fallbackQuery.title)
        : coverUrl,
    releaseYear: album.release_date?.slice(0, 4),
    genre: album.genres?.[0],
    popularityScore: album.popularity ?? 85,
    discoveryReason: `Album • ${tracklist.length} bài • Spotify`,
    featuredTrack,
    tracklist,
    externalUrl:
      album.external_urls?.spotify ??
      `https://open.spotify.com/album/${album.id}`,
  };
}
