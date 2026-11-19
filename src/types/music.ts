export type EntityType = 'album' | 'track' | 'artist';

export interface TrackItem {
  id: string;
  title: string;
  duration: number; // seconds
  rank: number; // Chỉ số độ phổ biến từ Deezer (càng cao càng nổi tiếng)
  previewUrl: string | null; // Link MP3/M4A 30s
  artistName: string;
  artistId: string;
  albumId?: string;
  albumTitle?: string;
  coverUrl: string;
}

export interface MusicResultItem {
  id: string;
  type: EntityType;
  title: string; // Tên Album, tên Bài hát, hoặc tên Nghệ sĩ
  subtitle: string; // Tên Nghệ sĩ (nếu là Album/Track) hoặc Thể loại chính (nếu là Artist)
  coverUrl: string; // Ảnh bìa vuông độ phân giải cao (500x500 hoặc 1000x1000)
  releaseYear?: string;
  genre?: string;
  popularityScore: number; // 0 - 100 (chuẩn hóa từ rank/fans)
  discoveryReason: string; // Giải thích ngắn gọn, VD: "Gần gu với Frank Ocean • Độ khám phá 80%"
  featuredTrack: TrackItem; // BẮT BUỘC: Bài hát nổi bật nhất để phát ngay khi bấm Play
  tracklist?: TrackItem[]; // Danh sách các bài trong album (nếu type === 'album')
  externalUrl: string; // Link mở trên Deezer/Web
}

export interface TasteProfile {
  isCompleted: boolean;
  updatedAt: string;
  seedArtists: Array<{
    id: string;
    name: string;
    pictureUrl: string;
    genreId?: number;
  }>; // 3 - 5 nghệ sĩ gốc
  preferredGenres: number[]; // Danh sách Deezer Genre IDs
  excludedGenres: number[]; // Thể loại không muốn nghe
  dimensions: {
    energy: number; // 0 (Chill/Tĩnh lặng) -> 100 (Sôi động/Mạnh mẽ)
    acousticness: number; // 0 (Điện tử/Synth/Beat) -> 100 (Mộc/Nhạc cụ thật)
    mainstream: number; // 0 (Underground/Indie) -> 100 (Hits phổ biến)
    eraPreference: 'classic' | '2000s_2010s' | 'modern' | 'any';
  };
}

export interface QuickFilters {
  entityType: EntityType; // Mặc định: 'album'
  region: 'all' | 'us_uk' | 'vpop' | 'kpop' | 'jpop' | 'latin' | 'instrumental';
  mood: 'all' | 'chill' | 'upbeat' | 'melancholic' | 'groovy';
  popularity: 'all' | 'mainstream' | 'hidden_gems';
  era: 'all' | '2020s' | '2010s' | '2000s' | 'classic';
}

export interface DailyPickData {
  date: string; // Format: 'YYYY-MM-DD'
  album: MusicResultItem;
  track: MusicResultItem;
}

