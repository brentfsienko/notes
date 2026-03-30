import { auth } from "@/auth";
import { getSavedTracks, getUserPlaylists } from "@/lib/spotify";

function hasPlaylistReadScopes(scope: string | undefined) {
  if (!scope) return true;
  return (
    scope.includes("playlist-read-private") ||
    scope.includes("playlist-read-collaborative")
  );
}

async function getTokenForPlaylists() {
  const session = await auth();
  if (!session?.accessToken) throw new Error("Not authenticated");
  if (session.error === "RefreshTokenError") throw new Error("TokenExpired");
  if (!hasPlaylistReadScopes(session.scope)) {
    throw new Error(
      "Spotify playlist access missing. Sign out and connect again to approve playlist permissions.",
    );
  }
  return session.accessToken;
}

/** Used by `/api/library/*` route handlers (stable URLs — avoids server-action ID skew after deploy). */
export async function loadLibraryInitial() {
  const session = await auth();
  if (!session?.accessToken) throw new Error("Not authenticated");
  if (session.error === "RefreshTokenError") throw new Error("TokenExpired");
  if (!hasPlaylistReadScopes(session.scope)) {
    throw new Error(
      "Spotify playlist access missing. Sign out and connect again to approve playlist permissions.",
    );
  }
  const token = session.accessToken;

  try {
    const savedPreview = await getSavedTracks(token, 0, 1);
    const likedTotal = (savedPreview?.total as number) ?? 0;

    const data = await getUserPlaylists(token, 0, 50);
    const raw = data.items ?? [];
    const playlists = raw.map((p: Record<string, unknown>) => ({ ...p }));
    const nextOffset = data.next ? 50 : null;

    return { likedTotal, playlists, nextOffset };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Spotify 429")) {
      throw new Error(
        "Spotify rate limited this request — wait a minute and tap retry, or close other tabs using Spotify.",
      );
    }
    throw e;
  }
}

export async function loadUserPlaylistsPage(offset = 0, limit = 50) {
  const token = await getTokenForPlaylists();
  const data = await getUserPlaylists(token, offset, limit);
  const raw = data.items ?? [];
  const items = raw.map((p: Record<string, unknown>) => ({ ...p }));
  return { ...data, items };
}
