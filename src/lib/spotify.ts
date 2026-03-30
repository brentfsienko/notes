const API = "https://api.spotify.com/v1";

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
  const res = await spotifyFetch(
    `${API}/me/tracks?offset=${offset}&limit=${limit}`,
    accessToken,
  );
  return res.json();
}

export async function searchTracks(accessToken: string, query: string, limit = 20) {
  const res = await spotifyFetch(
    `${API}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
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
