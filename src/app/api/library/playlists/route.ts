import { NextResponse } from "next/server";
import { loadUserPlaylistsPage } from "@/lib/spotify-library-load";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offsetRaw = searchParams.get("offset") ?? "0";
  const limitRaw = searchParams.get("limit") ?? "50";
  const offset = Number.parseInt(offsetRaw, 10);
  const limit = Number.parseInt(limitRaw, 10);
  if (!Number.isFinite(offset) || offset < 0) {
    return NextResponse.json({ error: "invalid offset" }, { status: 400 });
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ error: "invalid limit" }, { status: 400 });
  }

  try {
    const data = await loadUserPlaylistsPage(offset, limit);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Not authenticated" || msg === "TokenExpired") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg.includes("playlist access missing")) {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
