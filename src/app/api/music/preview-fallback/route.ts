import { NextRequest, NextResponse } from "next/server";
import { findItunesPreview } from "@/lib/itunes";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const artist = (searchParams.get("artist") ?? "").trim();
    const title = (searchParams.get("title") ?? "").trim();
    const q = (searchParams.get("q") ?? "").trim();

    if (!artist && !title && !q) {
      return NextResponse.json(
        { error: "Cần truyền tham số artist/title hoặc q để tìm audio preview." },
        { status: 400 }
      );
    }

    const result = await findItunesPreview(artist, title || q);
    return NextResponse.json({
      ...result,
      provider: "itunes",
    });
  } catch (error) {
    console.error("[API /api/music/preview-fallback] Error:", error);
    return NextResponse.json(
      { error: "Không thể tìm link nghe thử dự phòng." },
      { status: 500 }
    );
  }
}

