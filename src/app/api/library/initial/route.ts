import { NextResponse } from "next/server";
import { loadLibraryInitial } from "@/lib/spotify-library-load";

export async function GET() {
  try {
    const data = await loadLibraryInitial();
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
