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

    const tasteProfile: TasteProfile =
      body.tasteProfile ?? DEFAULT_TASTE_PROFILE;
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
