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

async function getAccessToken() {
  const session = await auth();
  if (!session?.accessToken) throw new Error("Not authenticated");
  if (session.error === "RefreshTokenError") throw new Error("Token expired");
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
  return data.total as number;
}

export async function fetchUserPlaylists(offset = 0, limit = 50) {
  const token = await getAccessToken();
  return getUserPlaylists(token, offset, limit);
}

export async function fetchPlaylistDetails(playlistId: string) {
  const token = await getAccessToken();
  return getPlaylistDetails(token, playlistId);
}

export async function fetchPlaylistTracks(playlistId: string, offset = 0, limit = 50) {
  const token = await getAccessToken();
  return getPlaylistTracks(token, playlistId, offset, limit);
}
