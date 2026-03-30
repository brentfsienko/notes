"use server";

import { auth } from "@/auth";
import {
  getSavedTracks,
  searchTracks,
  saveTrack,
  checkSavedTracks,
  getCurrentUser,
  getUserPlaylists,
  getAllUserPlaylists,
  getPlaylistDetails,
  getPlaylistTracks,
} from "@/lib/spotify";

/** When scope is missing (legacy JWT), allow the request — Spotify will 403 if needed. */
function hasPlaylistReadScopes(scope: string | undefined) {
  if (!scope) return true;
  return (
    scope.includes("playlist-read-private") ||
    scope.includes("playlist-read-collaborative")
  );
}

async function getAccessToken() {
  const session = await auth();
  if (!session?.accessToken) throw new Error("Not authenticated");
  if (session.error === "RefreshTokenError") throw new Error("TokenExpired");
  return session.accessToken;
}

async function getAccessTokenForPlaylists() {
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

export async function fetchSavedTracks(offset = 0, limit = 20) {
  const token = await getAccessToken();
  return getSavedTracks(token, offset, limit);
}

export async function searchSpotifyTracks(query: string) {
  const token = await getAccessToken();
  const q = typeof query === "string" ? query.trim() : "";
  if (!q) return { tracks: { items: [] } };
  return searchTracks(token, q);
}

export async function saveSpotifyTrack(trackId: string) {
  const token = await getAccessToken();
  await saveTrack(token, trackId);
}

export async function checkSpotifySavedTracks(trackIds: string[]) {
  const token = await getAccessToken();
  return checkSavedTracks(token, trackIds);
}

export async function fetchSpotifyProfile() {
  const token = await getAccessToken();
  return getCurrentUser(token);
}

export async function fetchSavedTracksTotal() {
  const token = await getAccessToken();
  const data = await getSavedTracks(token, 0, 1);
  return (data?.total as number) ?? 0;
}

/** Keep small to avoid 429 when many playlists lack `tracks.total` in list responses. */
const ENRICH_TOTALS_CHUNK = 6;

async function enrichPlaylistItemsWithTotals(
  token: string,
  merged: Record<string, unknown>[],
) {
  const sparse = merged
    .map((p: Record<string, unknown>, index: number) => ({ p, index }))
    .filter(
      (row: { p: Record<string, unknown>; index: number }) =>
        typeof row.p.id === "string" &&
        typeof (row.p.tracks as { total?: number } | undefined)?.total !== "number",
    );
  if (sparse.length === 0) return;

  for (let i = 0; i < sparse.length; i += ENRICH_TOTALS_CHUNK) {
    const chunk = sparse.slice(i, i + ENRICH_TOTALS_CHUNK);
    await Promise.all(
      chunk.map(async (row: { p: Record<string, unknown>; index: number }) => {
        const { p, index } = row;
        try {
          const d = await getPlaylistDetails(token, p.id as string);
          const total = d?.tracks?.total;
          if (typeof total === "number") {
            const cur = merged[index] as { tracks?: { href?: string; total?: number } };
            merged[index] = {
              ...cur,
              tracks: { ...cur.tracks, total },
            };
          }
        } catch {
          /* ignore */
        }
      }),
    );
    /* Small gap between batches so we do not stack bursts on top of list paging. */
    if (i + ENRICH_TOTALS_CHUNK < sparse.length) {
      await new Promise((r) => setTimeout(r, 80));
    }
  }
}

/** One server action for library: sequential Spotify calls where possible to reduce 429s. */
export async function fetchLibraryData() {
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
    const bundle = await getAllUserPlaylists(token);

    const likedTotal = (savedPreview?.total as number) ?? 0;
    const raw = bundle.items ?? [];
    const merged = raw.map((p: Record<string, unknown>) => ({ ...p }));
    await enrichPlaylistItemsWithTotals(token, merged);

    return { likedTotal, playlists: merged };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Spotify 429")) {
      throw new Error(
        "Spotify rate limited this request — wait a minute and tap retry, or try again with fewer tabs open.",
      );
    }
    throw e;
  }
}

export async function fetchUserPlaylists(offset = 0, limit = 50) {
  const token = await getAccessTokenForPlaylists();
  const data = await getUserPlaylists(token, offset, limit);
  const items = data.items ?? [];
  const merged = items.map((p: Record<string, unknown>) => ({ ...p }));
  await enrichPlaylistItemsWithTotals(token, merged);
  return { ...data, items: merged };
}

export async function fetchPlaylistDetails(playlistId: string) {
  const token = await getAccessTokenForPlaylists();
  return getPlaylistDetails(token, playlistId);
}

export async function fetchPlaylistTracks(playlistId: string, offset = 0, limit = 50) {
  const token = await getAccessTokenForPlaylists();
  return getPlaylistTracks(token, playlistId, offset, limit);
}
