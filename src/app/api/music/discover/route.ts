import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_DISCOVERY_LEVEL,
  DEFAULT_QUICK_FILTERS,
  DEFAULT_TASTE_PROFILE,
} from "@/lib/constants";
import { discoverMusic } from "@/lib/recommendation-engine";
import type { QuickFilters, TasteProfile } from "@/types/music";

interface DiscoverPayload {
  tasteProfile?: TasteProfile;
  filters?: QuickFilters;
  discoveryLevel?: number;
  count?: number;
  seenIds?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as DiscoverPayload;

    const rawTaste = body.tasteProfile;
    const tasteProfile: TasteProfile = {
      ...DEFAULT_TASTE_PROFILE,
      ...(rawTaste ?? {}),
      seedArtists: Array.isArray(rawTaste?.seedArtists)
        ? rawTaste.seedArtists
        : DEFAULT_TASTE_PROFILE.seedArtists,
      preferredGenres: Array.isArray(rawTaste?.preferredGenres)
        ? rawTaste.preferredGenres
        : DEFAULT_TASTE_PROFILE.preferredGenres,
      excludedGenres: Array.isArray(rawTaste?.excludedGenres)
        ? rawTaste.excludedGenres
        : DEFAULT_TASTE_PROFILE.excludedGenres,
      dimensions: {
        ...DEFAULT_TASTE_PROFILE.dimensions,
        ...(rawTaste?.dimensions ?? {}),
      },
    };
    const filters: QuickFilters = {
      ...DEFAULT_QUICK_FILTERS,
      ...(body.filters ?? {}),
    };
    const discoveryLevel =
      typeof body.discoveryLevel === "number"
        ? body.discoveryLevel
        : DEFAULT_DISCOVERY_LEVEL;
    const count =
      typeof body.count === "number" ? Math.max(1, Math.min(10, body.count)) : 1;
    const seenIds = Array.isArray(body.seenIds) ? body.seenIds : [];

    const result = await discoverMusic({
      tasteProfile,
      filters,
      discoveryLevel,
      count,
      seenIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/music/discover] Error:", error);
    return NextResponse.json(
      { error: "Không thể tạo danh sách đề xuất âm nhạc lúc này." },
      { status: 500 }
    );
  }
}
