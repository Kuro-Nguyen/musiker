import type {
  DailyPickData,
  EntityType,
  MusicResultItem,
  QuickFilters,
  TasteProfile,
} from "@/types/music";

export const APP_NAME = "MUZIKER";
export const DEFAULT_DISCOVERY_LEVEL = 80;
export const DEFAULT_BATCH_COUNT = 1;
export const BATCH_COUNT_PRESETS = [1, 3, 5, 10] as const;
export const MAX_SEEN_IDS = 200;

export const DEFAULT_QUICK_FILTERS: QuickFilters = {
  entityType: "album",
  region: "all",
  mood: "all",
  popularity: "all",
  era: "all",
};

export const DEFAULT_TASTE_PROFILE: TasteProfile = {
  isCompleted: false,
  updatedAt: "",
  seedArtists: [],
  preferredGenres: [],
  excludedGenres: [],
  dimensions: {
    energy: 50,
    acousticness: 50,
    mainstream: 45,
    eraPreference: "any",
  },
};

export interface DeezerGenreOption {
  id: number;
  name: string;
  labelVi: string;
}

export const DEEZER_GENRES: DeezerGenreOption[] = [
  { id: 132, name: "Pop", labelVi: "Pop" },
  { id: 152, name: "Rock", labelVi: "Rock" },
  { id: 85, name: "Alternative", labelVi: "Indie / Alternative" },
  { id: 116, name: "Rap/Hip Hop", labelVi: "Hip-Hop / Rap" },
  { id: 165, name: "R&B", labelVi: "R&B / Soul" },
  { id: 106, name: "Electro", labelVi: "Electronic / Synth" },
  { id: 129, name: "Jazz", labelVi: "Jazz" },
  { id: 98, name: "Classical", labelVi: "Cổ điển / Nhạc cụ" },
  { id: 466, name: "Folk", labelVi: "Folk / Acoustic" },
  { id: 464, name: "Metal", labelVi: "Metal / Hard Rock" },
  { id: 113, name: "Dance", labelVi: "EDM / Dance" },
  { id: 16, name: "Asian Music", labelVi: "Nhạc Châu Á (V/K/J-Pop)" },
];

function createEditorialCoverSvg(
  code: string,
  title: string,
  subtitle: string,
  bgHex: string,
  fgHex: string,
  accentHex: string
): string {
  const safeCode = code.replace(/[<>&"']/g, "");
  const safeTitle = title.replace(/[<>&"']/g, "").slice(0, 20);
  const safeSub = subtitle.replace(/[<>&"']/g, "").slice(0, 24);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" fill="${bgHex}"/>
    <rect x="28" y="28" width="544" height="544" fill="none" stroke="${fgHex}" stroke-opacity="0.16" stroke-width="1.5"/>
    <line x1="28" y1="120" x2="572" y2="120" stroke="${fgHex}" stroke-opacity="0.14" stroke-width="1"/>
    <line x1="28" y1="480" x2="572" y2="480" stroke="${fgHex}" stroke-opacity="0.14" stroke-width="1"/>
    <circle cx="300" cy="300" r="142" fill="none" stroke="${fgHex}" stroke-opacity="0.22" stroke-width="1.5"/>
    <circle cx="300" cy="300" r="96" fill="${accentHex}" fill-opacity="0.92"/>
    <circle cx="300" cy="300" r="24" fill="${bgHex}"/>
    <circle cx="300" cy="300" r="6" fill="${fgHex}"/>
    <rect x="52" y="56" width="10" height="10" rx="5" fill="${accentHex}"/>
    <text x="74" y="66" font-family="monospace" font-size="18" letter-spacing="2" fill="${fgHex}" fill-opacity="0.72">${safeCode}</text>
    <text x="52" y="520" font-family="sans-serif" font-weight="700" font-size="28" fill="${fgHex}">${safeTitle}</text>
    <text x="52" y="550" font-family="monospace" font-size="16" fill="${fgHex}" fill-opacity="0.65">${safeSub}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface PresetSeedArtist {
  id: string;
  name: string;
  pictureUrl: string;
  genreId: number;
  tag: string;
}

export const PRESET_SEED_ARTISTS: PresetSeedArtist[] = [
  {
    id: "399",
    name: "Radiohead",
    pictureUrl: createEditorialCoverSvg("ART.01", "RADIOHEAD", "ALT / ART ROCK", "#141417", "#F4F4F6", "#FF5500"),
    genreId: 85,
    tag: "Art Rock",
  },
  {
    id: "416239",
    name: "Frank Ocean",
    pictureUrl: createEditorialCoverSvg("ART.02", "FRANK OCEAN", "ALT R&B / SOUL", "#EFECE6", "#111111", "#FF5500"),
    genreId: 165,
    tag: "Alt R&B",
  },
  {
    id: "144227",
    name: "Tame Impala",
    pictureUrl: createEditorialCoverSvg("ART.03", "TAME IMPALA", "PSYCH POP", "#1D1B22", "#F4F4F6", "#E06D3B"),
    genreId: 85,
    tag: "Psych Pop",
  },
  {
    id: "14427",
    name: "Nujabes",
    pictureUrl: createEditorialCoverSvg("ART.04", "NUJABES", "JAZZ HOP / LO-FI", "#EAE6DF", "#111111", "#4A6B5D"),
    genreId: 116,
    tag: "Jazz Hop",
  },
  {
    id: "5486538",
    name: "Sơn Tùng M-TP",
    pictureUrl: createEditorialCoverSvg("ART.05", "SON TUNG M-TP", "V-POP", "#111111", "#F4F4F6", "#FF5500"),
    genreId: 132,
    tag: "V-Pop",
  },
  {
    id: "13039233",
    name: "Vũ.",
    pictureUrl: createEditorialCoverSvg("ART.06", "VU.", "INDIE VIET", "#F2EFE9", "#111111", "#3D5A80"),
    genreId: 85,
    tag: "Indie Việt",
  },
  {
    id: "7027690",
    name: "Hyukoh",
    pictureUrl: createEditorialCoverSvg("ART.07", "HYUKOH", "K-INDIE ROCK", "#1B1D1A", "#F4F4F6", "#D97736"),
    genreId: 85,
    tag: "K-Indie",
  },
  {
    id: "79025782",
    name: "Fujii Kaze",
    pictureUrl: createEditorialCoverSvg("ART.08", "FUJII KAZE", "J-POP / SOUL", "#EBE9E4", "#111111", "#FF5500"),
    genreId: 132,
    tag: "J-Pop",
  },
  {
    id: "27",
    name: "Daft Punk",
    pictureUrl: createEditorialCoverSvg("ART.09", "DAFT PUNK", "FRENCH ELECTRO", "#101012", "#F4F4F6", "#C89B3C"),
    genreId: 106,
    tag: "Electronic",
  },
  {
    id: "525046",
    name: "Kendrick Lamar",
    pictureUrl: createEditorialCoverSvg("ART.10", "KENDRICK LAMAR", "HIP-HOP", "#161414", "#F4F4F6", "#FF5500"),
    genreId: 116,
    tag: "Hip-Hop",
  },
  {
    id: "96071192",
    name: "Laufey",
    pictureUrl: createEditorialCoverSvg("ART.11", "LAUFEY", "JAZZ / CLASSICAL", "#F4EFE6", "#111111", "#8C5E58"),
    genreId: 129,
    tag: "Vocal Jazz",
  },
  {
    id: "331",
    name: "Norah Jones",
    pictureUrl: createEditorialCoverSvg("ART.12", "NORAH JONES", "ACOUSTIC JAZZ", "#E9ECEF", "#111111", "#495057"),
    genreId: 129,
    tag: "Acoustic",
  },
];

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export const ENTITY_OPTIONS: SelectOption<EntityType>[] = [
  { value: "album", label: "Album" },
  { value: "track", label: "Bài hát" },
  { value: "artist", label: "Nghệ sĩ" },
];

export const REGION_OPTIONS: SelectOption<QuickFilters["region"]>[] = [
  { value: "all", label: "Tất cả vùng" },
  { value: "us_uk", label: "US-UK" },
  { value: "vpop", label: "V-Pop" },
  { value: "kpop", label: "K-Pop" },
  { value: "jpop", label: "J-Pop" },
  { value: "latin", label: "Latin" },
  { value: "instrumental", label: "Không lời" },
];

export const MOOD_OPTIONS: SelectOption<QuickFilters["mood"]>[] = [
  { value: "all", label: "Mọi tâm trạng" },
  { value: "chill", label: "Chill & Focus" },
  { value: "upbeat", label: "Upbeat & Energy" },
  { value: "melancholic", label: "Melancholic / Đêm muộn" },
  { value: "groovy", label: "Groovy / Indie" },
];

export const POPULARITY_OPTIONS: SelectOption<QuickFilters["popularity"]>[] = [
  { value: "all", label: "Mọi độ nổi tiếng" },
  { value: "mainstream", label: "Mainstream" },
  { value: "hidden_gems", label: "Hidden Gems" },
];

export const ERA_OPTIONS: SelectOption<QuickFilters["era"]>[] = [
  { value: "all", label: "Mọi thập kỷ" },
  { value: "2020s", label: "2020s" },
  { value: "2010s", label: "2010s" },
  { value: "2000s", label: "2000s" },
  { value: "classic", label: "90s & Cũ hơn" },
];

const COVER_BLONDE = createEditorialCoverSvg(
  "LP-014 // 2016",
  "BLONDE",
  "FRANK OCEAN",
  "#F1EFEA",
  "#111111",
  "#FF5500"
);

const COVER_MODAL_SOUL = createEditorialCoverSvg(
  "LP-008 // 2005",
  "MODAL SOUL",
  "NUJABES",
  "#181A1B",
  "#F4F4F6",
  "#FF5500"
);

const COVER_CURRENTS = createEditorialCoverSvg(
  "LP-022 // 2015",
  "CURRENTS",
  "TAME IMPALA",
  "#1E1B24",
  "#F4F4F6",
  "#E06D3B"
);

const COVER_MOT_VAN = createEditorialCoverSvg(
  "LP-031 // 2022",
  "MOT VAN NAM",
  "VU.",
  "#ECE8E1",
  "#111111",
  "#3D5A80"
);

const COVER_IN_RAINBOWS = createEditorialCoverSvg(
  "LP-007 // 2007",
  "IN RAINBOWS",
  "RADIOHEAD",
  "#141417",
  "#F4F4F6",
  "#FF5500"
);

const COVER_HELP_EVER = createEditorialCoverSvg(
  "LP-045 // 2020",
  "HELP EVER HURT",
  "FUJII KAZE",
  "#EBE9E3",
  "#111111",
  "#FF5500"
);

export const MOCK_DISCOVERY_RESULTS: MusicResultItem[] = [
  {
    id: "mock-album-blonde",
    type: "album",
    title: "Blonde",
    subtitle: "Frank Ocean",
    coverUrl: COVER_BLONDE,
    releaseYear: "2016",
    genre: "Alternative R&B",
    popularityScore: 92,
    discoveryReason: "Gần gu với Frank Ocean • Độ khám phá 80%",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-blonde-1",
      title: "Nights",
      duration: 307,
      rank: 965000,
      previewUrl: null,
      artistName: "Frank Ocean",
      artistId: "416239",
      albumId: "mock-album-blonde",
      albumTitle: "Blonde",
      coverUrl: COVER_BLONDE,
    },
    tracklist: [
      {
        id: "t-blonde-1",
        title: "Nights",
        duration: 307,
        rank: 965000,
        previewUrl: null,
        artistName: "Frank Ocean",
        artistId: "416239",
        albumId: "mock-album-blonde",
        albumTitle: "Blonde",
        coverUrl: COVER_BLONDE,
      },
      {
        id: "t-blonde-2",
        title: "Pink + White",
        duration: 184,
        rank: 938000,
        previewUrl: null,
        artistName: "Frank Ocean",
        artistId: "416239",
        albumId: "mock-album-blonde",
        albumTitle: "Blonde",
        coverUrl: COVER_BLONDE,
      },
      {
        id: "t-blonde-3",
        title: "Ivy",
        duration: 249,
        rank: 892000,
        previewUrl: null,
        artistName: "Frank Ocean",
        artistId: "416239",
        albumId: "mock-album-blonde",
        albumTitle: "Blonde",
        coverUrl: COVER_BLONDE,
      },
      {
        id: "t-blonde-4",
        title: "Self Control",
        duration: 249,
        rank: 874000,
        previewUrl: null,
        artistName: "Frank Ocean",
        artistId: "416239",
        albumId: "mock-album-blonde",
        albumTitle: "Blonde",
        coverUrl: COVER_BLONDE,
      },
      {
        id: "t-blonde-5",
        title: "White Ferrari",
        duration: 248,
        rank: 851000,
        previewUrl: null,
        artistName: "Frank Ocean",
        artistId: "416239",
        albumId: "mock-album-blonde",
        albumTitle: "Blonde",
        coverUrl: COVER_BLONDE,
      },
    ],
  },
  {
    id: "mock-album-modal-soul",
    type: "album",
    title: "Modal Soul",
    subtitle: "Nujabes",
    coverUrl: COVER_MODAL_SOUL,
    releaseYear: "2005",
    genre: "Jazz Hop / Instrumental",
    popularityScore: 76,
    discoveryReason: "Gần gu với J Dilla & Nujabes • Độ khám phá 80%",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-modal-1",
      title: "Feather (feat. Cise Starr & Akin)",
      duration: 175,
      rank: 840000,
      previewUrl: null,
      artistName: "Nujabes",
      artistId: "14427",
      albumId: "mock-album-modal-soul",
      albumTitle: "Modal Soul",
      coverUrl: COVER_MODAL_SOUL,
    },
    tracklist: [
      {
        id: "t-modal-1",
        title: "Feather (feat. Cise Starr & Akin)",
        duration: 175,
        rank: 840000,
        previewUrl: null,
        artistName: "Nujabes",
        artistId: "14427",
        albumId: "mock-album-modal-soul",
        albumTitle: "Modal Soul",
        coverUrl: COVER_MODAL_SOUL,
      },
      {
        id: "t-modal-2",
        title: "Luv(sic.), Pt. 3 (feat. Shing02)",
        duration: 336,
        rank: 815000,
        previewUrl: null,
        artistName: "Nujabes",
        artistId: "14427",
        albumId: "mock-album-modal-soul",
        albumTitle: "Modal Soul",
        coverUrl: COVER_MODAL_SOUL,
      },
      {
        id: "t-modal-3",
        title: "Reflection Eternal",
        duration: 257,
        rank: 772000,
        previewUrl: null,
        artistName: "Nujabes",
        artistId: "14427",
        albumId: "mock-album-modal-soul",
        albumTitle: "Modal Soul",
        coverUrl: COVER_MODAL_SOUL,
      },
      {
        id: "t-modal-4",
        title: "Horizon",
        duration: 440,
        rank: 710000,
        previewUrl: null,
        artistName: "Nujabes",
        artistId: "14427",
        albumId: "mock-album-modal-soul",
        albumTitle: "Modal Soul",
        coverUrl: COVER_MODAL_SOUL,
      },
    ],
  },
  {
    id: "mock-album-in-rainbows",
    type: "album",
    title: "In Rainbows",
    subtitle: "Radiohead",
    coverUrl: COVER_IN_RAINBOWS,
    releaseYear: "2007",
    genre: "Art Rock / Alternative",
    popularityScore: 89,
    discoveryReason: "Khớp trục Năng lượng & Acoustic • Thập kỷ 2000s",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-rainbows-1",
      title: "Weird Fishes / Arpeggi",
      duration: 318,
      rank: 910000,
      previewUrl: null,
      artistName: "Radiohead",
      artistId: "399",
      albumId: "mock-album-in-rainbows",
      albumTitle: "In Rainbows",
      coverUrl: COVER_IN_RAINBOWS,
    },
    tracklist: [
      {
        id: "t-rainbows-1",
        title: "Weird Fishes / Arpeggi",
        duration: 318,
        rank: 910000,
        previewUrl: null,
        artistName: "Radiohead",
        artistId: "399",
        albumId: "mock-album-in-rainbows",
        albumTitle: "In Rainbows",
        coverUrl: COVER_IN_RAINBOWS,
      },
      {
        id: "t-rainbows-2",
        title: "Jigsaw Falling Into Place",
        duration: 249,
        rank: 885000,
        previewUrl: null,
        artistName: "Radiohead",
        artistId: "399",
        albumId: "mock-album-in-rainbows",
        albumTitle: "In Rainbows",
        coverUrl: COVER_IN_RAINBOWS,
      },
      {
        id: "t-rainbows-3",
        title: "Nude",
        duration: 255,
        rank: 860000,
        previewUrl: null,
        artistName: "Radiohead",
        artistId: "399",
        albumId: "mock-album-in-rainbows",
        albumTitle: "In Rainbows",
        coverUrl: COVER_IN_RAINBOWS,
      },
    ],
  },
  {
    id: "mock-album-currents",
    type: "album",
    title: "Currents",
    subtitle: "Tame Impala",
    coverUrl: COVER_CURRENTS,
    releaseYear: "2015",
    genre: "Psychedelic Pop",
    popularityScore: 87,
    discoveryReason: "Chất liệu Synth / Groove • Độ khám phá 80%",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-currents-1",
      title: "Let It Happen",
      duration: 467,
      rank: 928000,
      previewUrl: null,
      artistName: "Tame Impala",
      artistId: "144227",
      albumId: "mock-album-currents",
      albumTitle: "Currents",
      coverUrl: COVER_CURRENTS,
    },
    tracklist: [
      {
        id: "t-currents-1",
        title: "Let It Happen",
        duration: 467,
        rank: 928000,
        previewUrl: null,
        artistName: "Tame Impala",
        artistId: "144227",
        albumId: "mock-album-currents",
        albumTitle: "Currents",
        coverUrl: COVER_CURRENTS,
      },
      {
        id: "t-currents-2",
        title: "The Less I Know The Better",
        duration: 216,
        rank: 912000,
        previewUrl: null,
        artistName: "Tame Impala",
        artistId: "144227",
        albumId: "mock-album-currents",
        albumTitle: "Currents",
        coverUrl: COVER_CURRENTS,
      },
      {
        id: "t-currents-3",
        title: "Eventually",
        duration: 318,
        rank: 845000,
        previewUrl: null,
        artistName: "Tame Impala",
        artistId: "144227",
        albumId: "mock-album-currents",
        albumTitle: "Currents",
        coverUrl: COVER_CURRENTS,
      },
    ],
  },
  {
    id: "mock-album-mot-van-nam",
    type: "album",
    title: "Một Vạn Năm",
    subtitle: "Vũ.",
    coverUrl: COVER_MOT_VAN,
    releaseYear: "2022",
    genre: "Indie Việt / Acoustic",
    popularityScore: 74,
    discoveryReason: "Gần gu Acoustic & Melancholic • V-Pop Indie",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-mvn-1",
      title: "Bước Qua Nhau",
      duration: 258,
      rank: 805000,
      previewUrl: null,
      artistName: "Vũ.",
      artistId: "13039233",
      albumId: "mock-album-mot-van-nam",
      albumTitle: "Một Vạn Năm",
      coverUrl: COVER_MOT_VAN,
    },
    tracklist: [
      {
        id: "t-mvn-1",
        title: "Bước Qua Nhau",
        duration: 258,
        rank: 805000,
        previewUrl: null,
        artistName: "Vũ.",
        artistId: "13039233",
        albumId: "mock-album-mot-van-nam",
        albumTitle: "Một Vạn Năm",
        coverUrl: COVER_MOT_VAN,
      },
      {
        id: "t-mvn-2",
        title: "Những Lời Hứa Bỏ Quên",
        duration: 242,
        rank: 788000,
        previewUrl: null,
        artistName: "Vũ.",
        artistId: "13039233",
        albumId: "mock-album-mot-van-nam",
        albumTitle: "Một Vạn Năm",
        coverUrl: COVER_MOT_VAN,
      },
      {
        id: "t-mvn-3",
        title: "Anh Nhớ Ra",
        duration: 229,
        rank: 742000,
        previewUrl: null,
        artistName: "Vũ.",
        artistId: "13039233",
        albumId: "mock-album-mot-van-nam",
        albumTitle: "Một Vạn Năm",
        coverUrl: COVER_MOT_VAN,
      },
    ],
  },
  {
    id: "mock-track-shinunoga",
    type: "track",
    title: "Shinunoga E-Wa",
    subtitle: "Fujii Kaze",
    coverUrl: COVER_HELP_EVER,
    releaseYear: "2020",
    genre: "J-Pop / Neo-Soul",
    popularityScore: 84,
    discoveryReason: "Ngẫu nhiên từ J-Pop & Groovy • Độ khám phá 80%",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-kaze-1",
      title: "Shinunoga E-Wa",
      duration: 185,
      rank: 890000,
      previewUrl: null,
      artistName: "Fujii Kaze",
      artistId: "79025782",
      albumId: "mock-album-help-ever",
      albumTitle: "HELP EVER HURT NEVER",
      coverUrl: COVER_HELP_EVER,
    },
  },
  {
    id: "mock-track-let-it-happen",
    type: "track",
    title: "Let It Happen",
    subtitle: "Tame Impala",
    coverUrl: COVER_CURRENTS,
    releaseYear: "2015",
    genre: "Psychedelic Synth",
    popularityScore: 88,
    discoveryReason: "Mạch điện tử Psychedelic • Độ khám phá 80%",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-currents-1",
      title: "Let It Happen",
      duration: 467,
      rank: 928000,
      previewUrl: null,
      artistName: "Tame Impala",
      artistId: "144227",
      albumId: "mock-album-currents",
      albumTitle: "Currents",
      coverUrl: COVER_CURRENTS,
    },
  },
  {
    id: "mock-artist-hyukoh",
    type: "artist",
    title: "HYUKOH",
    subtitle: "K-Indie Rock / Alternative",
    coverUrl: PRESET_SEED_ARTISTS[6].pictureUrl,
    releaseYear: "2014–",
    genre: "K-Indie Rock",
    popularityScore: 73,
    discoveryReason: "Nghệ sĩ liên quan bậc 2 từ Radiohead • Indie Asia",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-hyukoh-1",
      title: "TOMBOY",
      duration: 243,
      rank: 812000,
      previewUrl: null,
      artistName: "HYUKOH",
      artistId: "7027690",
      albumTitle: "23",
      coverUrl: PRESET_SEED_ARTISTS[6].pictureUrl,
    },
  },
  {
    id: "mock-artist-laufey",
    type: "artist",
    title: "Laufey",
    subtitle: "Vocal Jazz / Chamber Pop",
    coverUrl: PRESET_SEED_ARTISTS[10].pictureUrl,
    releaseYear: "2021–",
    genre: "Jazz / Classical",
    popularityScore: 81,
    discoveryReason: "Nhánh nhạc cụ mộc & Jazz cổ điển • Độ khám phá 80%",
    externalUrl: "https://www.deezer.com",
    featuredTrack: {
      id: "t-laufey-1",
      title: "From The Start",
      duration: 169,
      rank: 865000,
      previewUrl: null,
      artistName: "Laufey",
      artistId: "96071192",
      albumTitle: "Bewitched",
      coverUrl: PRESET_SEED_ARTISTS[10].pictureUrl,
    },
  },
];

export const MOCK_DAILY_PICK: DailyPickData = {
  date: "2026-11-18",
  album: MOCK_DISCOVERY_RESULTS[1], // Modal Soul — Nujabes
  track: MOCK_DISCOVERY_RESULTS[5], // Shinunoga E-Wa — Fujii Kaze
};

