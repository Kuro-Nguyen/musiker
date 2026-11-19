import type { EntityType, MusicResultItem, TrackItem } from "@/types/music";

const ITUNES_BASE_URL = "https://itunes.apple.com";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 300;
const REQUEST_TIMEOUT_MS = 8000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): void {
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function createFallbackCoverSvg(label: string): string {
  const safeLabel = label.replace(/[<>&"']/g, "").slice(0, 18) || "MUSIKER";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="#141417"/>
    <circle cx="300" cy="300" r="145" fill="none" stroke="#F4F4F6" stroke-opacity="0.2" stroke-width="2"/>
    <circle cx="300" cy="300" r="88" fill="#FF5500" fill-opacity="0.9"/>
    <circle cx="300" cy="300" r="22" fill="#141417"/>
    <text x="48" y="544" font-family="monospace" font-size="22" fill="#F4F4F6" fill-opacity="0.75">${safeLabel}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Upgrade iTunes artwork URL (default 100x100bb) to high-resolution square art (600x600bb).
 */
export function upgradeItunesArtwork(
  url?: string,
  size = 600,
  fallbackLabel = "MUSIKER"
): string {
  if (!url) {
    return createFallbackCoverSvg(fallbackLabel);
  }
  return url.replace(
    /\/\d+x\d+(bb|sr|bf)?\.(jpg|jpeg|png|webp)$/i,
    `/${size}x${size}bb.$2`
  );
}

interface ItunesSearchResponse<T> {
  resultCount: number;
  results: T[];
}

interface ItunesRawArtist {
  wrapperType?: string;
  artistType?: string;
  artistId?: number;
  artistName?: string;
  artistLinkUrl?: string;
  primaryGenreName?: string;
}

interface ItunesRawCollection {
  wrapperType?: string;
  collectionType?: string;
  artistId?: number;
  collectionId?: number;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  collectionViewUrl?: string;
  artistViewUrl?: string;
  trackCount?: number;
}

interface ItunesRawTrack {
  wrapperType?: string;
  kind?: string;
  artistId?: number;
  collectionId?: number;
  trackId?: number;
  artistName?: string;
  collectionName?: string;
  trackName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
}

async function fetchItunesJson<T>(pathWithQuery: string): Promise<T> {
  const cacheKey = `itunes:${pathWithQuery}`;
  const cached = getCached<T>(cacheKey);
  if (cached) return cached;

  const response = await fetch(`${ITUNES_BASE_URL}${pathWithQuery}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`iTunes API responded with status ${response.status}`);
  }

  const data = (await response.json()) as T;
  setCached(cacheKey, data);
  return data;
}

function mapItunesRawTrackToTrackItem(
  raw: ItunesRawTrack,
  rankScore: number
): TrackItem {
  const artistName = raw.artistName ?? "Unknown Artist";
  const trackTitle = raw.trackName ?? "Unknown Track";
  return {
    id: String(raw.trackId ?? `${raw.collectionId ?? "0"}-${trackTitle}`),
    title: trackTitle,
    duration: Math.max(1, Math.round((raw.trackTimeMillis ?? 30000) / 1000)),
    rank: rankScore,
    previewUrl: raw.previewUrl ?? null,
    artistName,
    artistId: String(raw.artistId ?? "0"),
    albumId: raw.collectionId ? String(raw.collectionId) : undefined,
    albumTitle: raw.collectionName,
    coverUrl: upgradeItunesArtwork(raw.artworkUrl100 ?? raw.artworkUrl60, 600, trackTitle),
  };
}

export interface QuizArtistResult {
  id: string;
  name: string;
  pictureUrl: string;
  genre?: string;
  externalUrl: string;
}

export async function searchItunesArtists(
  query: string,
  limit = 8
): Promise<{ artists: QuizArtistResult[]; items: MusicResultItem[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { artists: [], items: [] };

  const safeLimit = Math.max(1, Math.min(20, limit));

  const [artistRes, songRes] = await Promise.all([
    fetchItunesJson<ItunesSearchResponse<ItunesRawArtist>>(
      `/search?term=${encodeURIComponent(trimmed)}&entity=musicArtist&limit=${safeLimit}`
    ),
    fetchItunesJson<ItunesSearchResponse<ItunesRawTrack>>(
      `/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=25`
    ),
  ]);

  const songByArtistId = new Map<number, ItunesRawTrack>();
  for (const song of songRes.results) {
    if (!song.artistId) continue;
    const existing = songByArtistId.get(song.artistId);
    if (!existing || (!existing.previewUrl && song.previewUrl)) {
      songByArtistId.set(song.artistId, song);
    }
  }

  const rawArtists = artistRes.results.filter(
    (a): a is ItunesRawArtist & { artistId: number; artistName: string } =>
      Boolean(a.artistId && a.artistName)
  );

  // Lookup top song for any matched artist missing from the parallel song query
  const missingIds = rawArtists
    .filter((a) => !songByArtistId.has(a.artistId))
    .slice(0, 5)
    .map((a) => a.artistId);

  if (missingIds.length > 0) {
    await Promise.all(
      missingIds.map(async (artistId) => {
        try {
          const lookup = await fetchItunesJson<
            ItunesSearchResponse<ItunesRawTrack | ItunesRawArtist>
          >(`/lookup?id=${artistId}&entity=song&limit=2`);
          const song = lookup.results.find(
            (r): r is ItunesRawTrack =>
              (r as ItunesRawTrack).wrapperType === "track"
          );
          if (song) {
            songByArtistId.set(artistId, song);
          }
        } catch {
          // Ignore individual lookup errors gracefully
        }
      })
    );
  }

  const artists: QuizArtistResult[] = [];
  const items: MusicResultItem[] = [];

  rawArtists.forEach((artist, index) => {
    const topSong = songByArtistId.get(artist.artistId);
    const coverUrl = upgradeItunesArtwork(
      topSong?.artworkUrl100 ?? topSong?.artworkUrl60,
      600,
      artist.artistName
    );
    const externalUrl =
      artist.artistLinkUrl ??
      topSong?.trackViewUrl ??
      "https://music.apple.com";

    artists.push({
      id: String(artist.artistId),
      name: artist.artistName,
      pictureUrl: coverUrl,
      genre: artist.primaryGenreName ?? topSong?.primaryGenreName,
      externalUrl,
    });

    const featuredTrack: TrackItem = topSong
      ? mapItunesRawTrackToTrackItem(topSong, 900000 - index * 20000)
      : {
          id: `artist-top-${artist.artistId}`,
          title: artist.artistName,
          duration: 30,
          rank: 750000,
          previewUrl: null,
          artistName: artist.artistName,
          artistId: String(artist.artistId),
          coverUrl,
        };

    items.push({
      id: String(artist.artistId),
      type: "artist",
      title: artist.artistName,
      subtitle: artist.primaryGenreName ?? topSong?.primaryGenreName ?? "Nghệ sĩ",
      coverUrl,
      genre: artist.primaryGenreName ?? topSong?.primaryGenreName,
      popularityScore: Math.max(55, 92 - index * 4),
      discoveryReason: `Kết quả tìm kiếm trực tiếp • iTunes API`,
      featuredTrack,
      externalUrl,
    });
  });

  return { artists, items };
}

export async function searchItunesTracks(
  query: string,
  limit = 8
): Promise<MusicResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const safeLimit = Math.max(1, Math.min(20, limit));
  const data = await fetchItunesJson<ItunesSearchResponse<ItunesRawTrack>>(
    `/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=${safeLimit}`
  );

  return data.results
    .filter((r) => Boolean(r.trackId && r.trackName))
    .map((track, index) => {
      const rankScore = 920000 - index * 18000;
      const trackItem = mapItunesRawTrackToTrackItem(track, rankScore);
      return {
        id: String(track.trackId),
        type: "track" as EntityType,
        title: track.trackName ?? "Unknown Track",
        subtitle: track.artistName ?? "Unknown Artist",
        coverUrl: trackItem.coverUrl,
        releaseYear: track.releaseDate ? track.releaseDate.slice(0, 4) : undefined,
        genre: track.primaryGenreName,
        popularityScore: Math.max(48, 94 - index * 4),
        discoveryReason: "Bài hát từ iTunes Search • Preview 30s",
        featuredTrack: trackItem,
        externalUrl:
          track.trackViewUrl ??
          track.collectionViewUrl ??
          "https://music.apple.com",
      };
    });
}

export function isItunesMultiTrackAlbum(col: ItunesRawCollection): boolean {
  if (col.trackCount !== undefined && col.trackCount < 2) {
    return false;
  }
  const title = (col.collectionName ?? "").trim();
  if (/\s-\s*single$/i.test(title)) {
    return false;
  }
  return true;
}

export async function searchItunesAlbums(
  query: string,
  limit = 8
): Promise<MusicResultItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const safeLimit = Math.max(1, Math.min(20, limit));
  const rawLimit = Math.min(40, Math.max(safeLimit * 3, 18));
  const data = await fetchItunesJson<ItunesSearchResponse<ItunesRawCollection>>(
    `/search?term=${encodeURIComponent(trimmed)}&entity=album&limit=${rawLimit}`
  );

  return data.results
    .filter(
      (col) =>
        Boolean(col.collectionId && col.collectionName) &&
        isItunesMultiTrackAlbum(col)
    )
    .slice(0, safeLimit)
    .map((col, index) => {
      const albumId = String(col.collectionId);
      const albumTitle = col.collectionName ?? "Unknown Album";
      const artistName = col.artistName ?? "Unknown Artist";
      const coverUrl = upgradeItunesArtwork(
        col.artworkUrl100 ?? col.artworkUrl60,
        600,
        albumTitle
      );

      return {
        id: albumId,
        type: "album" as EntityType,
        title: albumTitle,
        subtitle: artistName,
        coverUrl,
        releaseYear: col.releaseDate ? col.releaseDate.slice(0, 4) : undefined,
        genre: col.primaryGenreName,
        popularityScore: Math.max(50, 93 - index * 4),
        discoveryReason: "Album từ iTunes Search • Bấm Play hoặc Tracklist để nghe",
        featuredTrack: {
          id: `album-featured-${albumId}`,
          title: albumTitle,
          duration: 30,
          rank: 900000 - index * 15000,
          previewUrl: null,
          artistName,
          artistId: String(col.artistId ?? "0"),
          albumId,
          albumTitle,
          coverUrl,
        },
        externalUrl:
          col.collectionViewUrl ?? col.artistViewUrl ?? "https://music.apple.com",
      };
    });
}

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export async function getItunesAlbumDetails(
  collectionId: string,
  fallbackQuery?: { title?: string; artist?: string }
): Promise<MusicResultItem | null> {
  let targetCollectionId = /^\d+$/.test(collectionId) ? collectionId : "";
  let lookupResults: Array<ItunesRawCollection | ItunesRawTrack> = [];

  if (targetCollectionId) {
    try {
      const lookup = await fetchItunesJson<
        ItunesSearchResponse<ItunesRawCollection | ItunesRawTrack>
      >(`/lookup?id=${targetCollectionId}&entity=song&limit=25`);
      lookupResults = lookup.results ?? [];
    } catch {
      lookupResults = [];
    }
  }

  const rawTracksInitial = lookupResults.filter(
    (entry) => (entry as ItunesRawTrack).wrapperType === "track"
  );
  const hasMultiTracks = rawTracksInitial.length >= 2;
  const initialCollection = lookupResults.find(
    (entry): entry is ItunesRawCollection =>
      (entry as ItunesRawCollection).wrapperType === "collection"
  );
  const searchArtistOrTitle =
    fallbackQuery?.artist ||
    initialCollection?.artistName ||
    fallbackQuery?.title;

  // Fallback search for multi-track EP/Album if ID is mock/Deezer or resolved to a 1-track Single
  if (!hasMultiTracks && searchArtistOrTitle) {
    const searchTerm = [
      fallbackQuery?.artist ?? initialCollection?.artistName,
      rawTracksInitial.length === 0 ? fallbackQuery?.title : undefined,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (searchTerm) {
      const searchRes = await fetchItunesJson<
        ItunesSearchResponse<ItunesRawCollection>
      >(`/search?term=${encodeURIComponent(searchTerm)}&entity=album&limit=12`);

      const multiTrackCols = searchRes.results.filter(
        (col) => Boolean(col.collectionId) && isItunesMultiTrackAlbum(col)
      );
      const candidates =
        multiTrackCols.length > 0 ? multiTrackCols : searchRes.results;

      const targetTitle = normalizeMatchText(fallbackQuery?.title ?? "");
      const targetArtist = normalizeMatchText(
        fallbackQuery?.artist ?? initialCollection?.artistName ?? ""
      );

      const matched =
        candidates.find((col) => {
          const colTitle = normalizeMatchText(col.collectionName ?? "");
          const colArtist = normalizeMatchText(col.artistName ?? "");
          return (
            (!targetTitle ||
              rawTracksInitial.length === 1 ||
              colTitle.includes(targetTitle)) &&
            (!targetArtist || colArtist.includes(targetArtist))
          );
        }) ?? candidates[0];

      if (matched?.collectionId && String(matched.collectionId) !== targetCollectionId) {
        targetCollectionId = String(matched.collectionId);
        const lookup = await fetchItunesJson<
          ItunesSearchResponse<ItunesRawCollection | ItunesRawTrack>
        >(`/lookup?id=${targetCollectionId}&entity=song&limit=25`);
        if ((lookup.results?.length ?? 0) > 0) {
          lookupResults = lookup.results;
        }
      }
    }
  }

  if (lookupResults.length === 0) {
    return null;
  }

  const collectionInfo = lookupResults.find(
    (r): r is ItunesRawCollection =>
      (r as ItunesRawCollection).wrapperType === "collection"
  );

  const rawTracks = lookupResults
    .filter(
      (r): r is ItunesRawTrack =>
        (r as ItunesRawTrack).wrapperType === "track" &&
        Boolean((r as ItunesRawTrack).trackName)
    )
    .slice(0, 15);

  if (rawTracks.length === 0 && !collectionInfo) {
    return null;
  }

  const firstTrack = rawTracks[0];
  const albumTitle =
    collectionInfo?.collectionName ??
    firstTrack?.collectionName ??
    fallbackQuery?.title ??
    "Unknown Album";
  const artistName =
    collectionInfo?.artistName ??
    firstTrack?.artistName ??
    fallbackQuery?.artist ??
    "Unknown Artist";
  const coverUrl = upgradeItunesArtwork(
    collectionInfo?.artworkUrl100 ?? firstTrack?.artworkUrl100,
    600,
    albumTitle
  );
  const albumId = String(
    collectionInfo?.collectionId ??
      firstTrack?.collectionId ??
      targetCollectionId
  );

  const tracklist: TrackItem[] = rawTracks.map((track, idx) => {
    const baseRank = 950000 - idx * 22000;
    const rankWithPreviewBoost = track.previewUrl ? baseRank : baseRank - 200000;
    return mapItunesRawTrackToTrackItem(track, rankWithPreviewBoost);
  });

  const sortedByRank = [...tracklist].sort((a, b) => b.rank - a.rank);
  const featuredTrack: TrackItem =
    sortedByRank.find((t) => Boolean(t.previewUrl)) ??
    sortedByRank[0] ?? {
      id: `album-featured-${albumId}`,
      title: albumTitle,
      duration: 30,
      rank: 850000,
      previewUrl: null,
      artistName,
      artistId: String(collectionInfo?.artistId ?? "0"),
      albumId,
      albumTitle,
      coverUrl,
    };

  const releaseDate = collectionInfo?.releaseDate ?? firstTrack?.releaseDate;

  return {
    id: albumId,
    type: "album",
    title: albumTitle,
    subtitle: artistName,
    coverUrl,
    releaseYear: releaseDate ? releaseDate.slice(0, 4) : undefined,
    genre: collectionInfo?.primaryGenreName ?? firstTrack?.primaryGenreName,
    popularityScore: 86,
    discoveryReason: `Tracklist ${tracklist.length} bài • Nguồn iTunes API`,
    featuredTrack,
    tracklist,
    externalUrl:
      collectionInfo?.collectionViewUrl ??
      firstTrack?.collectionViewUrl ??
      "https://music.apple.com",
  };
}

export interface PreviewFallbackResult {
  previewUrl: string | null;
  duration: number;
  coverUrl: string;
  trackId: string;
  externalUrl: string;
  artistName: string;
  title: string;
}

export async function findItunesPreview(
  artistName: string,
  trackTitle: string
): Promise<PreviewFallbackResult> {
  const query = `${artistName} ${trackTitle}`.trim();
  if (!query) {
    return {
      previewUrl: null,
      duration: 30,
      coverUrl: createFallbackCoverSvg("NO PREVIEW"),
      trackId: "",
      externalUrl: "https://music.apple.com",
      artistName,
      title: trackTitle,
    };
  }

  const data = await fetchItunesJson<ItunesSearchResponse<ItunesRawTrack>>(
    `/search?term=${encodeURIComponent(query)}&entity=song&limit=6`
  );

  const normArtist = normalizeMatchText(artistName);
  const normTitle = normalizeMatchText(trackTitle);

  const scored = data.results
    .filter((r) => Boolean(r.trackName))
    .map((r) => {
      let score = r.previewUrl ? 10 : 0;
      const rTitle = normalizeMatchText(r.trackName ?? "");
      const rArtist = normalizeMatchText(r.artistName ?? "");
      if (normTitle && rTitle === normTitle) score += 8;
      else if (normTitle && rTitle.includes(normTitle)) score += 4;
      if (normArtist && rArtist === normArtist) score += 8;
      else if (normArtist && rArtist.includes(normArtist)) score += 4;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = scored[0]?.r;

  if (!best) {
    return {
      previewUrl: null,
      duration: 30,
      coverUrl: createFallbackCoverSvg(trackTitle || artistName),
      trackId: "",
      externalUrl: "https://music.apple.com",
      artistName,
      title: trackTitle,
    };
  }

  return {
    previewUrl: best.previewUrl ?? null,
    duration: Math.max(1, Math.round((best.trackTimeMillis ?? 30000) / 1000)),
    coverUrl: upgradeItunesArtwork(
      best.artworkUrl100 ?? best.artworkUrl60,
      600,
      best.trackName ?? trackTitle
    ),
    trackId: String(best.trackId ?? ""),
    externalUrl:
      best.trackViewUrl ?? best.collectionViewUrl ?? "https://music.apple.com",
    artistName: best.artistName ?? artistName,
    title: best.trackName ?? trackTitle,
  };
}

