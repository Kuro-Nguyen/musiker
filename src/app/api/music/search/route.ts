import { NextRequest, NextResponse } from "next/server";
import {
  getProviderStatus,
  searchArtistsForQuiz,
  searchMusicEntities,
} from "@/lib/deezer";
import type { EntityType } from "@/types/music";

const VALID_ENTITY_TYPES = new Set<EntityType>(["album", "track", "artist"]);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = (searchParams.get("q") ?? "").trim();
    const rawType = (searchParams.get("type") ?? "artist") as EntityType;
    const type: EntityType = VALID_ENTITY_TYPES.has(rawType)
      ? rawType
      : "artist";
    const mode = searchParams.get("mode") ?? "full";
    const rawLimit = Number(searchParams.get("limit") ?? "8");
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(20, rawLimit))
      : 8;

    if (!query) {
      return NextResponse.json({
        items: [],
        artists: [],
        provider: getProviderStatus().activeProvider,
      });
    }

    if (mode === "quiz" || type === "artist") {
      const result = await searchArtistsForQuiz(query, limit);
      return NextResponse.json({
        artists: result.artists,
        items: result.items,
        provider: result.provider,
      });
    }

    const result = await searchMusicEntities(query, type, limit);
    return NextResponse.json({
      artists: [],
      items: result.items,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[API /api/music/search] Error:", error);
    return NextResponse.json(
      { error: "Không thể tìm kiếm dữ liệu âm nhạc lúc này." },
      { status: 500 }
    );
  }
}

