"use server";

import { auth } from "@/auth";
import {
  getSavedTracks,
  searchTracks,
  saveTrack,
  checkSavedTracks,
  getCurrentUser,
  getUserPlaylists,
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

/**
 * One server action for the whole library: single `auth()`, then sequential Spotify calls.
 * Replaces N+1 client round-trips (each re-authenticating) that amplified rate limits.
 */
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
    const likedTotal = (savedPreview?.total as number) ?? 0;

    const pageSize = 50;
    const maxPages = 80;
    const playlists: Record<string, unknown>[] = [];
    let offset = 0;
    for (let page = 0; page < maxPages; page++) {
      const data = await getUserPlaylists(token, offset, pageSize);
      const raw = data.items ?? [];
      playlists.push(...raw.map((p: Record<string, unknown>) => ({ ...p })));
      if (!data.next) break;
      offset += pageSize;
    }

    return { likedTotal, playlists };
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

/** One `/me/playlists` page — prefer `fetchLibraryData` for the library screen to avoid duplicate auth. */
export async function fetchUserPlaylists(offset = 0, limit = 50) {
  const token = await getAccessTokenForPlaylists();
  const data = await getUserPlaylists(token, offset, limit);
  const raw = data.items ?? [];
  const items = raw.map((p: Record<string, unknown>) => ({ ...p }));
  return { ...data, items };
}

/**
 * Profile header: `/me` + liked count in one action (one `auth()`), sequential Spotify calls.
 */
export async function fetchProfileSpotifySummary() {
  const token = await getAccessToken();
  const profile = await getCurrentUser(token);
  const savedPreview = await getSavedTracks(token, 0, 1);
  const likedTotal = (savedPreview?.total as number) ?? 0;
  return { profile, likedTotal };
}

export async function fetchPlaylistDetails(playlistId: string) {
  const token = await getAccessTokenForPlaylists();
  return getPlaylistDetails(token, playlistId);
}

export async function fetchPlaylistTracks(playlistId: string, offset = 0, limit = 50) {
  const token = await getAccessTokenForPlaylists();
  return getPlaylistTracks(token, playlistId, offset, limit);
}
