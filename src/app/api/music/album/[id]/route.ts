import { NextRequest, NextResponse } from "next/server";
import { getAlbumDetailsWithTracks } from "@/lib/deezer";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get("title") ?? undefined;
    const artist = searchParams.get("artist") ?? undefined;

    if (!id) {
      return NextResponse.json(
        { error: "Thiếu mã định danh Album." },
        { status: 400 }
      );
    }

    const result = await getAlbumDetailsWithTracks(id, { title, artist });

    if (!result.album) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin Album hoặc Tracklist." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      album: result.album,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[API /api/music/album/[id]] Error:", error);
    return NextResponse.json(
      { error: "Không thể tải chi tiết Album lúc này." },
      { status: 500 }
    );
  }
}

