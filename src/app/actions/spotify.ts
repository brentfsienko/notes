"use server";

import { auth } from "@/auth";
import {
  getSavedTracks,
  searchTracks,
  saveTrack,
  checkSavedTracks,
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
  return searchTracks(token, query);
}

export async function saveSpotifyTrack(trackId: string) {
  const token = await getAccessToken();
  await saveTrack(token, trackId);
}

export async function checkSpotifySavedTracks(trackIds: string[]) {
  const token = await getAccessToken();
  return checkSavedTracks(token, trackIds);
}
