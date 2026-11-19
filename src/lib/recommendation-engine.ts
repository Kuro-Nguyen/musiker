import { DEEZER_GENRES, MOCK_DISCOVERY_RESULTS } from "@/lib/constants";
import {
  getAlbumDetailsWithTracks,
  getProviderStatus,
  getRelatedArtistNames,
  searchMusicEntities,
  type MusicProvider,
} from "@/lib/deezer";
import { findItunesPreview } from "@/lib/itunes";
import { getDiscoveryLevelMeta } from "@/lib/utils";
import type {
  MusicResultItem,
  QuickFilters,
  TasteProfile,
} from "@/types/music";

export interface DiscoverRequest {
  tasteProfile: TasteProfile;
  filters: QuickFilters;
  discoveryLevel: number;
  count: number;
  seenIds: string[];
}

export interface DiscoverResponse {
  items: MusicResultItem[];
  provider: MusicProvider;
  meta: {
    candidatePoolSize: number;
    discoveryZone: "safe" | "expand" | "smart" | "chaos";
    hydratedCount: number;
  };
}

interface ArtistGraphNode {
  hop1: string[];
  hop2: string[];
  genreId: number;
}

const ARTIST_AFFINITY_GRAPH: Record<string, ArtistGraphNode> = {
  radiohead: {
    hop1: ["Thom Yorke", "Portishead", "Massive Attack", "Arcade Fire", "Interpol"],
    hop2: ["Slowdive", "Sigur Rós", "King Krule", "Black Country, New Road", "Alt-J", "Squid"],
    genreId: 85,
  },
  "frank ocean": {
    hop1: ["Daniel Caesar", "SZA", "Steve Lacy", "Blood Orange", "Brent Faiyaz"],
    hop2: ["Sampha", "Dijon", "Mk.gee", "Omar Apollo", "Moses Sumney", "Choker"],
    genreId: 165,
  },
  "tame impala": {
    hop1: ["MGMT", "Unknown Mortal Orchestra", "Pond", "Foster the People", "Toro y Moi"],
    hop2: ["Crumb", "Men I Trust", "Mild High Club", "Khruangbin", "Parcels", "Glass Beams"],
    genreId: 85,
  },
  nujabes: {
    hop1: ["J Dilla", "Uyama Hiroto", "DJ Okawari", "Nomak", "Marcus D"],
    hop2: ["Shing02", "Kenichiro Nishihara", "haruka nakamura", "Tomppabeats", "Idealism", "emancipator"],
    genreId: 116,
  },
  "sơn tùng m-tp": {
    hop1: ["Soobin", "Wren Evans", "MONO", "tlinh", "HIEUTHUHAI"],
    hop2: ["GREY D", "Low G", "MCK", "Hoàng Dũng", "Thịnh Suy", "WEAN"],
    genreId: 132,
  },
  "vũ.": {
    hop1: ["Ngọt", "Cá Hồi Hoang", "Chillies", "Đen", "Hoàng Dũng"],
    hop2: ["Thịnh Suy", "Trang", "Kiên", "Madihu", "Tiên Tiên", "Nguyên Hà"],
    genreId: 85,
  },
  hyukoh: {
    hop1: ["Sunset Rollercoaster", "SE SO NEON", "Jannabi", "The Black Skirts", "Car, the garden"],
    hop2: ["Wave to Earth", "Silica Gel", "ADOY", "Dasutt", "92914", "O3ohn"],
    genreId: 85,
  },
  "fujii kaze": {
    hop1: ["Vaundy", "King Gnu", "Kenshi Yonezu", "imase", "Official HIGE DANdism"],
    hop2: ["SIRUP", "iri", "TENDRE", "Suchmos", "Kaneko Ayano", "Nulbarich"],
    genreId: 132,
  },
  "daft punk": {
    hop1: ["Justice", "Kavinsky", "Modjo", "Röyksopp", "Air"],
    hop2: ["L'Impératrice", "Polo & Pan", "Breakbot", "Chromeo", "Bicep", "Overmono"],
    genreId: 106,
  },
  "kendrick lamar": {
    hop1: ["J. Cole", "Tyler, The Creator", "Childish Gambino", "Baby Keem", "A$AP Rocky"],
    hop2: ["Little Simz", "Saba", "Isaiah Rashad", "Vince Staples", "JPEGMAFIA", "Denzel Curry"],
    genreId: 116,
  },
  laufey: {
    hop1: ["beabadoobee", "Clairo", "Eloise", "Chet Baker", "Billie Holiday"],
    hop2: ["Samara Joy", "Bruno Major", "grentperez", "keshi", "Alice Phoebe Lou", "Rocco"],
    genreId: 129,
  },
  "norah jones": {
    hop1: ["Diana Krall", "Melody Gardot", "Madeleine Peyroux", "Corinne Bailey Rae", "Eva Cassidy"],
    hop2: ["Gregory Porter", "Esperanza Spalding", "José James", "Stacey Kent", "Lianne La Havas"],
    genreId: 129,
  },
};

const GENRE_SEEDS: Record<number, { hop1: string[]; hop2: string[] }> = {
  132: {
    hop1: ["Dua Lipa", "The Weeknd", "Charli xcx", "Carly Rae Jepsen", "Sabrina Carpenter"],
    hop2: ["Magdalena Bay", "Rina Sawayama", "Caroline Polachek", "Jessie Ware", "Remi Wolf"],
  },
  152: {
    hop1: ["Arctic Monkeys", "The Strokes", "Queens of the Stone Age", "Fleetwood Mac", "Muse"],
    hop2: ["Fontaines D.C.", "Turnstile", "Wet Leg", "Parquet Courts", "Alvvays"],
  },
  85: {
    hop1: ["Mitski", "Phoebe Bridgers", "Mac DeMarco", "Beach House", "Bon Iver"],
    hop2: ["Japanese Breakfast", "Faye Webster", "Big Thief", "Alex G", "Alvvays"],
  },
  116: {
    hop1: ["Nas", "OutKast", "MF DOOM", "Freddie Gibbs", "Joey Bada$$"],
    hop2: ["Noname", "Billy Woods", "Mach-Hommy", "Boldy James", "MIKE"],
  },
  165: {
    hop1: ["Anderson .Paak", "D'Angelo", "Erykah Badu", "Solange", "H.E.R."],
    hop2: ["Cleo Sol", "SAULT", "Hiatus Kaiyote", "Kelela", "Ravyn Lenae"],
  },
  106: {
    hop1: ["Fred again..", "Four Tet", "Jamie xx", "Caribou", "Disclosure"],
    hop2: ["Floating Points", "Jon Hopkins", "Bicep", "Rival Consoles", "Kelly Lee Owens"],
  },
  129: {
    hop1: ["Miles Davis", "Bill Evans", "John Coltrane", "Kamasi Washington", "Robert Glasper"],
    hop2: ["Yussef Dayes", "Alfa Mist", "Nubya Garcia", "GoGo Penguin", "Kamaal Williams"],
  },
  98: {
    hop1: ["Ludovico Einaudi", "Max Richter", "Ryuichi Sakamoto", "Joe Hisaishi", "Nils Frahm"],
    hop2: ["Ólafur Arnalds", "Joep Beving", "Hania Rani", "Alexis Ffrench", "Dustin O'Halloran"],
  },
  466: {
    hop1: ["Nick Drake", "Fleet Foxes", "Iron & Wine", "Sufjan Stevens", "Phoebe Bridgers"],
    hop2: ["Adrianne Lenker", "Laura Marling", "Gregory Alan Isakov", "Nick Mulvey", "Haley Heynderickx"],
  },
  464: {
    hop1: ["Deftones", "Tool", "System of a Down", "Gojira", "Opeth"],
    hop2: ["Alcest", "Deafheaven", "Russian Circles", "Loathe", "Mastodon"],
  },
  113: {
    hop1: ["Kaytranada", "Peggy Gou", "SG Lewis", "RÜFÜS DU SOL", "Channel Tres"],
    hop2: ["Barry Can't Swim", "Folamour", "Romy", "TSHA", "Mall Grab"],
  },
  16: {
    hop1: ["Vũ.", "Hyukoh", "Fujii Kaze", "Sơn Tùng M-TP", "Tatsuro Yamashita"],
    hop2: ["Wave to Earth", "Thịnh Suy", "Lamp", "Ichiko Aoba", "Sunset Rollercoaster"],
  },
};

const REGION_SEEDS: Record<Exclude<QuickFilters["region"], "all">, string[]> = {
  us_uk: ["Radiohead", "Frank Ocean", "Arctic Monkeys", "Phoebe Bridgers", "Kendrick Lamar", "Fred again.."],
  vpop: ["Vũ.", "Ngọt", "Cá Hồi Hoang", "Chillies", "Mỹ Tâm", "Hà Anh Tuấn", "Hoàng Dũng", "Thịnh Suy", "tlinh", "MCK", "Hoàng Thùy Linh", "Sơn Tùng M-TP"],
  kpop: ["Hyukoh", "Wave to Earth", "IU", "NewJeans", "SE SO NEON", "DEAN", "Jannabi"],
  jpop: ["Fujii Kaze", "Vaundy", "Yoasobi", "Tatsuro Yamashita", "Lamp", "Kenshi Yonezu", "Ichiko Aoba"],
  latin: ["Rosalía", "Natalia Lafourcade", "Bad Bunny", "Buena Vista Social Club", "C. Tangana", "Jorge Drexler"],
  instrumental: ["Nujabes", "Khruangbin", "Ryuichi Sakamoto", "Ludovico Einaudi", "Yussef Dayes", "Joe Hisaishi"],
};

const MOOD_SEEDS: Record<Exclude<QuickFilters["mood"], "all">, string[]> = {
  chill: ["Nujabes", "Men I Trust", "Cigarettes After Sex", "Khruangbin", "Ólafur Arnalds", "Laufey"],
  upbeat: ["Daft Punk", "Parcels", "Dua Lipa", "Kaytranada", "Disclosure", "Justice"],
  melancholic: ["Radiohead", "Phoebe Bridgers", "Bon Iver", "Vũ.", "Mitski", "Slowdive"],
  groovy: ["Anderson .Paak", "Tame Impala", "Thundercat", "Vulfpeck", "L'Impératrice", "Steve Lacy"],
};

const GLOBAL_CHAOS_SEEDS = [
  "Frank Ocean",
  "Nujabes",
  "Radiohead",
  "Khruangbin",
  "Fujii Kaze",
  "Vũ.",
  "Hyukoh",
  "Daft Punk",
  "Laufey",
  "Rosalía",
  "Yussef Dayes",
  "Little Simz",
  "Magdalena Bay",
  "Lamp",
];

interface QuerySeed {
  term: string;
  reasonLabel: string;
  hopWeight: number;
  expectedArtist?: string;
  isDeepCut?: boolean;
}

function pickRandomSample<T>(list: T[], maxItems: number): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(maxItems, copy.length));
}

function resolveArtistGraphNode(
  artist: TasteProfile["seedArtists"][number]
): ArtistGraphNode {
  const key = artist.name.trim().toLowerCase();
  if (ARTIST_AFFINITY_GRAPH[key]) {
    return ARTIST_AFFINITY_GRAPH[key];
  }
  if (artist.genreId && GENRE_SEEDS[artist.genreId]) {
    return {
      ...GENRE_SEEDS[artist.genreId],
      genreId: artist.genreId,
    };
  }
  return {
    hop1: [artist.name, "Tame Impala", "Frank Ocean"],
    hop2: ["Men I Trust", "Khruangbin", "Sampha", "Wave to Earth"],
    genreId: 85,
  };
}

async function buildQuerySeeds(req: DiscoverRequest): Promise<QuerySeed[]> {
  const { tasteProfile, filters, discoveryLevel } = req;
  const seeds: QuerySeed[] = [];
  const hasRegionFilter = filters.region !== "all";
  const hasMoodFilter = filters.mood !== "all";

  // Explicit Quick Filters (Region / Mood) get strong priority so filter selections feel immediate
  if (filters.region !== "all") {
    const regionKey = filters.region;
    const regionPool = REGION_SEEDS[regionKey];
    for (const artistName of pickRandomSample(regionPool, 4)) {
      seeds.push({
        term: artistName,
        reasonLabel: `Bộ lọc vùng ${regionKey.toUpperCase()}`,
        hopWeight: 1.45,
        expectedArtist: artistName,
      });
    }
  }

  if (filters.mood !== "all") {
    const moodKey = filters.mood;
    const moodPool = MOOD_SEEDS[moodKey];
    for (const artistName of pickRandomSample(moodPool, hasRegionFilter ? 1 : 4)) {
      seeds.push({
        term: artistName,
        reasonLabel: `Tâm trạng ${moodKey}`,
        hopWeight: hasRegionFilter ? 0.9 : 1.35,
        expectedArtist: artistName,
      });
    }
  }

  const shouldUseChaos = !tasteProfile.isCompleted || discoveryLevel >= 90;

  if (shouldUseChaos) {
    // If region/mood filter is active, stay strictly within filtered seeds
    if (hasRegionFilter || hasMoodFilter) {
      return seeds.slice(0, 6);
    }

    const chaosSample = pickRandomSample(GLOBAL_CHAOS_SEEDS, 5);
    for (const artistName of chaosSample) {
      seeds.push({
        term: artistName,
        reasonLabel: `Khám phá ngẫu nhiên toàn cầu • Độ khám phá ${discoveryLevel}%`,
        hopWeight: 1.0,
        expectedArtist: artistName,
        isDeepCut: discoveryLevel >= 65,
      });
    }
    return seeds;
  }

  // Case 2: Personalized Graph Walk (discoveryLevel 0 - 85)
  const chosenSeeds = pickRandomSample(tasteProfile.seedArtists, 2);

  if (discoveryLevel <= 35) {
    // 0% - 35%: Direct seed artists + 1-hop related
    for (const seedArtist of chosenSeeds) {
      seeds.push({
        term: seedArtist.name,
        reasonLabel: `Sát gu với ${seedArtist.name} • Độ khám phá ${discoveryLevel}%`,
        hopWeight: 1.5,
        expectedArtist: seedArtist.name,
      });
      const node = resolveArtistGraphNode(seedArtist);
      const liveRelated = await getRelatedArtistNames(seedArtist.id, 4);
      const hop1Pool = liveRelated.length > 0 ? liveRelated : node.hop1;
      for (const rel of pickRandomSample(hop1Pool, 1)) {
        seeds.push({
          term: rel,
          reasonLabel: `Liên quan bậc 1 từ ${seedArtist.name} • Độ khám phá ${discoveryLevel}%`,
          hopWeight: 1.3,
          expectedArtist: rel,
        });
      }
    }
  } else if (discoveryLevel <= 65) {
    // 40% - 65%: 30% 1-hop + 70% 2-hop + preferredGenres
    for (const seedArtist of chosenSeeds) {
      const node = resolveArtistGraphNode(seedArtist);
      const liveRelated = await getRelatedArtistNames(seedArtist.id, 4);
      const hop1Pool = liveRelated.length > 0 ? liveRelated : node.hop1;
      const hop1Pick = pickRandomSample(hop1Pool, 1)[0];
      if (hop1Pick) {
        seeds.push({
          term: hop1Pick,
          reasonLabel: `Mở rộng từ ${seedArtist.name} • Độ khám phá ${discoveryLevel}%`,
          hopWeight: 1.15,
          expectedArtist: hop1Pick,
        });
      }
      for (const hop2Pick of pickRandomSample(node.hop2, 2)) {
        seeds.push({
          term: hop2Pick,
          reasonLabel: `Nhánh phụ từ ${seedArtist.name} → ${hop1Pick ?? "Related"} • ${discoveryLevel}%`,
          hopWeight: 1.35,
          expectedArtist: hop2Pick,
          isDeepCut: true,
        });
      }
    }
  } else {
    // 70% - 85% (Default 80%): 2-hop Graph Walk + Genre discovery with deep offset
    for (const seedArtist of chosenSeeds) {
      const node = resolveArtistGraphNode(seedArtist);
      const hop1Bridge = pickRandomSample(node.hop1, 1)[0] ?? seedArtist.name;
      for (const hop2Target of pickRandomSample(node.hop2, 2)) {
        seeds.push({
          term: hop2Target,
          reasonLabel: `2-hop từ ${seedArtist.name} → ${hop1Bridge} • Độ khám phá ${discoveryLevel}%`,
          hopWeight: 1.45,
          expectedArtist: hop2Target,
          isDeepCut: true,
        });
      }
    }

    if (tasteProfile.preferredGenres.length > 0) {
      const randomGenreId = pickRandomSample(tasteProfile.preferredGenres, 1)[0];
      const genreSeedPool = GENRE_SEEDS[randomGenreId]?.hop2;
      if (genreSeedPool) {
        const genrePick = pickRandomSample(genreSeedPool, 1)[0];
        const genreMeta = DEEZER_GENRES.find((g) => g.id === randomGenreId);
        seeds.push({
          term: genrePick,
          reasonLabel: `Khám phá ${genreMeta?.labelVi ?? "cùng gu"} • Độ khám phá ${discoveryLevel}%`,
          hopWeight: 1.25,
          expectedArtist: genrePick,
          isDeepCut: true,
        });
      }
    }
  }

  return seeds.slice(0, 6);
}

interface CandidateEntry {
  item: MusicResultItem;
  hopWeight: number;
  reasonLabel: string;
}

function matchesExcludedGenre(
  itemGenre: string | undefined,
  excludedGenres: number[]
): boolean {
  if (!itemGenre || excludedGenres.length === 0) return false;
  const lower = itemGenre.toLowerCase();
  return excludedGenres.some((id) => {
    const genre = DEEZER_GENRES.find((g) => g.id === id);
    if (!genre) return false;
    return (
      lower.includes(genre.name.toLowerCase()) ||
      lower.includes(genre.labelVi.toLowerCase())
    );
  });
}

function matchesPreferredGenre(
  itemGenre: string | undefined,
  preferredGenres: number[]
): boolean {
  if (!itemGenre || preferredGenres.length === 0) return false;
  const lower = itemGenre.toLowerCase();
  return preferredGenres.some((id) => {
    const genre = DEEZER_GENRES.find((g) => g.id === id);
    if (!genre) return false;
    return (
      lower.includes(genre.name.toLowerCase()) ||
      lower.includes(genre.labelVi.toLowerCase())
    );
  });
}

function matchesEraFilter(
  releaseYear: string | undefined,
  era: QuickFilters["era"]
): boolean {
  if (era === "all" || !releaseYear) return true;
  const year = Number(releaseYear.slice(0, 4));
  if (!Number.isFinite(year) || year <= 0) return true;
  switch (era) {
    case "2020s":
      return year >= 2020;
    case "2010s":
      return year >= 2010 && year <= 2019;
    case "2000s":
      return year >= 2000 && year <= 2009;
    case "classic":
      return year < 2000;
    default:
      return true;
  }
}

function matchesPopularityFilter(
  score: number,
  popularity: QuickFilters["popularity"]
): boolean {
  if (popularity === "all") return true;
  if (popularity === "mainstream") return score >= 75;
  return score <= 84;
}

function isSingleTrackTitle(title: string): boolean {
  return /\s-\s*single$/i.test(title.trim());
}

async function generateCandidatePool(
  req: DiscoverRequest
): Promise<{ candidates: CandidateEntry[]; provider: MusicProvider }> {
  const seeds = await buildQuerySeeds(req);
  const fetchLimit = req.discoveryLevel >= 65 || req.filters.popularity === "hidden_gems" ? 12 : 8;

  const responses = await Promise.all(
    seeds.map(async (seed) => {
      try {
        const res = await searchMusicEntities(
          seed.term,
          req.filters.entityType,
          fetchLimit
        );
        return { seed, items: res.items, provider: res.provider };
      } catch {
        return {
          seed,
          items: [] as MusicResultItem[],
          provider: getProviderStatus().activeProvider,
        };
      }
    })
  );

  const activeProvider =
    responses.find((r) => r.items.length > 0)?.provider ??
    getProviderStatus().activeProvider;

  const dedupMap = new Map<string, CandidateEntry>();
  const homonymBackup: CandidateEntry[] = [];

  for (const { seed, items } of responses) {
    let artistMatched = items;
    if (seed.expectedArtist) {
      const expectedLower = seed.expectedArtist.toLowerCase();
      const matched = items.filter((item) => {
        const haystack =
          item.type === "artist"
            ? item.title.toLowerCase()
            : item.subtitle.toLowerCase();
        return haystack.includes(expectedLower);
      });
      if (matched.length > 0) {
        artistMatched = matched;
      } else {
        for (const item of items) {
          if (req.filters.entityType === "album" && isSingleTrackTitle(item.title)) {
            continue;
          }
          homonymBackup.push({
            item,
            hopWeight: 0.25,
            reasonLabel: seed.reasonLabel,
          });
        }
        continue;
      }
    }

    // When exploring deeply or looking for hidden gems, skip top 1 hit if enough items exist
    const sliced =
      seed.isDeepCut && artistMatched.length > 3
        ? artistMatched.slice(1)
        : artistMatched;

    for (const item of sliced) {
      if (req.filters.entityType === "album" && isSingleTrackTitle(item.title)) {
        continue;
      }
      const dedupKey = `${item.type}:${item.title.toLowerCase()}::${item.subtitle.toLowerCase()}`;
      if (!dedupMap.has(dedupKey)) {
        dedupMap.set(dedupKey, {
          item,
          hopWeight: seed.hopWeight,
          reasonLabel: seed.reasonLabel,
        });
      }
    }
  }

  if (dedupMap.size < req.count && homonymBackup.length > 0) {
    for (const entry of homonymBackup) {
      const dedupKey = `${entry.item.type}:${entry.item.title.toLowerCase()}::${entry.item.subtitle.toLowerCase()}`;
      if (!dedupMap.has(dedupKey)) {
        dedupMap.set(dedupKey, entry);
      }
    }
  }

  return {
    candidates: Array.from(dedupMap.values()),
    provider: activeProvider,
  };
}

function filterAndRelaxCandidates(
  candidates: CandidateEntry[],
  req: DiscoverRequest
): CandidateEntry[] {
  const { tasteProfile, filters, count, seenIds } = req;
  const seenSet = new Set(seenIds);

  const withoutSingleIfAlbum =
    filters.entityType === "album"
      ? candidates.filter((c) => !isSingleTrackTitle(c.item.title))
      : candidates;
  const candidateSource =
    withoutSingleIfAlbum.length > 0 ? withoutSingleIfAlbum : candidates;

  // Never violate excludedGenres unless literally zero items remain
  const withoutExcluded = candidateSource.filter(
    (c) => !matchesExcludedGenre(c.item.genre, tasteProfile.excludedGenres)
  );
  const basePool = withoutExcluded.length > 0 ? withoutExcluded : candidateSource;

  // Strict pass: unseen + era + popularity
  const strict = basePool.filter(
    (c) =>
      !seenSet.has(c.item.id) &&
      matchesEraFilter(c.item.releaseYear, filters.era) &&
      matchesPopularityFilter(c.item.popularityScore, filters.popularity)
  );
  if (strict.length >= count) return strict;

  // Fallback 1: relax era & popularity, keep unseen
  const relaxedFilters = basePool.filter((c) => !seenSet.has(c.item.id));
  if (relaxedFilters.length >= count) {
    const strictIds = new Set(strict.map((c) => c.item.id));
    return [
      ...strict,
      ...relaxedFilters.filter((c) => !strictIds.has(c.item.id)),
    ];
  }

  // Fallback 2: allow seenIds if candidate pool is still below count
  if (basePool.length >= count) {
    const existingIds = new Set(relaxedFilters.map((c) => c.item.id));
    return [
      ...relaxedFilters,
      ...basePool.filter((c) => !existingIds.has(c.item.id)),
    ];
  }

  // Fallback 3: emergency fallback from local constants if network returned < count
  const existingIds = new Set(basePool.map((c) => c.item.id));
  const mockMatches = MOCK_DISCOVERY_RESULTS.filter(
    (m) => m.type === filters.entityType && !existingIds.has(m.id)
  );
  const emergency = (
    mockMatches.length > 0 ? mockMatches : MOCK_DISCOVERY_RESULTS
  ).map((item) => ({
    item,
    hopWeight: 0.5,
    reasonLabel: `Đề xuất dự phòng • Độ khám phá ${req.discoveryLevel}%`,
  }));

  return [...basePool, ...emergency];
}

function scoreAndSampleCandidates(
  pool: CandidateEntry[],
  req: DiscoverRequest
): MusicResultItem[] {
  const { tasteProfile, count } = req;

  const weighted = pool.map((entry) => {
    let weight = entry.hopWeight;
    const { item } = entry;

    if (tasteProfile.isCompleted) {
      const mainstreamPref = tasteProfile.dimensions.mainstream;
      if (mainstreamPref < 40 && item.popularityScore <= 78) {
        weight += 0.45;
      } else if (mainstreamPref > 70 && item.popularityScore >= 78) {
        weight += 0.45;
      }

      if (matchesPreferredGenre(item.genre, tasteProfile.preferredGenres)) {
        weight += 0.4;
      }

      if (tasteProfile.dimensions.eraPreference !== "any" && item.releaseYear) {
        const mappedEra: QuickFilters["era"] =
          tasteProfile.dimensions.eraPreference === "modern"
            ? "2020s"
            : tasteProfile.dimensions.eraPreference === "classic"
              ? "classic"
              : "2010s";
        if (matchesEraFilter(item.releaseYear, mappedEra)) {
          weight += 0.25;
        }
      }
    }

    // Small random jitter to keep every spin fresh
    weight = Math.max(0.1, weight + Math.random() * 0.5);

    return {
      item: {
        ...item,
        discoveryReason: entry.reasonLabel,
      },
      weight,
    };
  });

  // Weighted random sampling without replacement, preferring distinct artists
  const remaining = [...weighted];
  const chosen: MusicResultItem[] = [];
  const pickedArtists = new Set<string>();
  const targetCount = Math.min(count, remaining.length);

  while (chosen.length < targetCount && remaining.length > 0) {
    const distinctPool = remaining.filter(
      (entry) => !pickedArtists.has(entry.item.subtitle.trim().toLowerCase())
    );
    const activePool = distinctPool.length > 0 ? distinctPool : remaining;

    const totalWeight = activePool.reduce((sum, entry) => sum + entry.weight, 0);
    let threshold = Math.random() * totalWeight;
    let pickedEntry = activePool[0];

    for (let i = 0; i < activePool.length; i += 1) {
      threshold -= activePool[i].weight;
      if (threshold <= 0) {
        pickedEntry = activePool[i];
        break;
      }
    }

    const removeIdx = remaining.indexOf(pickedEntry);
    if (removeIdx >= 0) {
      remaining.splice(removeIdx, 1);
    }
    pickedArtists.add(pickedEntry.item.subtitle.trim().toLowerCase());
    chosen.push(pickedEntry.item);
  }

  return chosen;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallbackValue: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallbackValue), ms);
    }),
  ]);
}

async function hydrateSingleResult(
  item: MusicResultItem
): Promise<MusicResultItem> {
  if (item.type === "album") {
    const hydrated = await withTimeout(
      getAlbumDetailsWithTracks(item.id, {
        title: item.title,
        artist: item.subtitle,
      }).then((res) => res.album),
      2500,
      null
    );

    if (hydrated) {
      return {
        ...hydrated,
        popularityScore: item.popularityScore || hydrated.popularityScore,
        discoveryReason: item.discoveryReason,
      };
    }
    return item;
  }

  if (!item.featuredTrack.previewUrl) {
    const fallback = await withTimeout(
      findItunesPreview(
        item.featuredTrack.artistName,
        item.featuredTrack.title
      ),
      2000,
      null
    );
    if (fallback?.previewUrl) {
      return {
        ...item,
        featuredTrack: {
          ...item.featuredTrack,
          previewUrl: fallback.previewUrl,
          duration: fallback.duration || item.featuredTrack.duration,
        },
      };
    }
  }

  return item;
}

function isValidMultiTrackAlbumItem(item: MusicResultItem): boolean {
  if (item.type !== "album") return true;
  if (isSingleTrackTitle(item.title)) return false;
  if (item.tracklist && item.tracklist.length < 2) return false;
  return true;
}

async function hydrateSelectedResults(
  selected: MusicResultItem[],
  backupPool: CandidateEntry[],
  entityType: QuickFilters["entityType"]
): Promise<MusicResultItem[]> {
  const initialHydrated = await Promise.all(selected.map(hydrateSingleResult));

  if (entityType !== "album") {
    return initialHydrated;
  }

  // Ensure 100% of returned albums are multi-track EPs/Albums (>= 2 tracks)
  const validItems = initialHydrated.filter(isValidMultiTrackAlbumItem);
  if (validItems.length >= selected.length) {
    return validItems.slice(0, selected.length);
  }

  const usedKeys = new Set(
    initialHydrated.map(
      (i) => `${i.id}::${i.title.toLowerCase()}::${i.subtitle.toLowerCase()}`
    )
  );
  const unusedBackups = backupPool
    .map((entry) => ({
      ...entry.item,
      discoveryReason: entry.reasonLabel,
    }))
    .filter((candidate) => {
      const key = `${candidate.id}::${candidate.title.toLowerCase()}::${candidate.subtitle.toLowerCase()}`;
      return !usedKeys.has(key) && !isSingleTrackTitle(candidate.title);
    });

  const needed = selected.length - validItems.length;
  const replacementBatch = unusedBackups.slice(0, Math.min(needed * 2, 10));
  if (replacementBatch.length > 0) {
    const hydratedReplacements = await Promise.all(
      replacementBatch.map(hydrateSingleResult)
    );
    for (const rep of hydratedReplacements) {
      if (validItems.length >= selected.length) break;
      if (isValidMultiTrackAlbumItem(rep)) {
        validItems.push(rep);
      }
    }
  }

  // If still fewer than requested (e.g., an artist only had singles), fall back to multi-track mock EPs/Albums
  if (validItems.length < selected.length) {
    for (const mock of MOCK_DISCOVERY_RESULTS) {
      if (validItems.length >= selected.length) break;
      if (
        mock.type === "album" &&
        (mock.tracklist?.length ?? 0) >= 2 &&
        !validItems.some((v) => v.id === mock.id)
      ) {
        const hydratedMock = await hydrateSingleResult(mock);
        if (isValidMultiTrackAlbumItem(hydratedMock)) {
          validItems.push(hydratedMock);
        }
      }
    }
  }

  return validItems.slice(0, selected.length);
}

/**
 * 4-step music discovery pipeline:
 * 1. Candidate pool generation via 2-hop artist affinity graph + filters
 * 2. Quick filters, dealbreaker exclusion, seenIds avoidance & graceful fallback
 * 3. Multi-dimension scoring & weighted random sampling
 * 4. Parallel server-side hydration within 2.5s budget
 */
export async function discoverMusic(
  req: DiscoverRequest
): Promise<DiscoverResponse> {
  const clampedCount = Math.max(1, Math.min(10, Math.round(req.count || 1)));
  const clampedLevel = Math.max(
    0,
    Math.min(100, Math.round(req.discoveryLevel ?? 80))
  );

  const normalizedReq: DiscoverRequest = {
    ...req,
    count: clampedCount,
    discoveryLevel: clampedLevel,
  };

  const { candidates, provider } = await generateCandidatePool(normalizedReq);
  const filteredPool = filterAndRelaxCandidates(candidates, normalizedReq);
  const sampled = scoreAndSampleCandidates(filteredPool, normalizedReq);
  const hydratedItems = await hydrateSelectedResults(
    sampled,
    filteredPool,
    normalizedReq.filters.entityType
  );

  const hydratedCount = hydratedItems.filter((item) =>
    Boolean(item.featuredTrack.previewUrl)
  ).length;

  return {
    items: hydratedItems,
    provider,
    meta: {
      candidatePoolSize: candidates.length,
      discoveryZone: getDiscoveryLevelMeta(clampedLevel).zone,
      hydratedCount,
    },
  };
}
