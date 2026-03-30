const API = "https://api.spotify.com/v1";

/** Spotify requires limit in [1, 50]; NaN/0/negative must never reach the query string. */
function clampSearchLimit(limit: number | undefined): number {
  const n = typeof limit === "number" && Number.isFinite(limit) ? Math.trunc(limit) : 20;
  return Math.max(1, Math.min(n, 50));
}

function clampPageLimit(limit: number | undefined): number {
  const n = typeof limit === "number" && Number.isFinite(limit) ? Math.trunc(limit) : 20;
  return Math.max(1, Math.min(n, 50));
}

function clampOffset(offset: number | undefined): number {
  const n = typeof offset === "number" && Number.isFinite(offset) ? Math.trunc(offset) : 0;
  return Math.max(0, n);
}

function headers(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

async function spotifyFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(accessToken), ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`Spotify ${res.status}: ${await res.text()}`);
  }
  return res;
}

export async function getSavedTracks(accessToken: string, offset = 0, limit = 20) {
  const o = clampOffset(offset);
  const l = clampPageLimit(limit);
  const res = await spotifyFetch(
    `${API}/me/tracks?offset=${o}&limit=${l}`,
    accessToken,
  );
  return res.json();
}

export async function searchTracks(accessToken: string, query: string, limit = 20) {
  const q = typeof query === "string" ? query.trim() : "";
  if (!q) return { tracks: { items: [] } };
  const l = clampSearchLimit(limit);
  const res = await spotifyFetch(
    `${API}/search?q=${encodeURIComponent(q)}&type=track&limit=${l}`,
    accessToken,
  );
  return res.json();
}

export async function saveTrack(accessToken: string, trackId: string) {
  await spotifyFetch(`${API}/me/tracks`, accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [trackId] }),
  });
}

export async function getCurrentUser(accessToken: string) {
  const res = await spotifyFetch(`${API}/me`, accessToken);
  return res.json();
}

export async function checkSavedTracks(
  accessToken: string,
  trackIds: string[],
): Promise<boolean[]> {
  if (trackIds.length === 0) return [];
  const res = await spotifyFetch(
    `${API}/me/tracks/contains?ids=${trackIds.join(",")}`,
    accessToken,
  );
  return res.json();
}
