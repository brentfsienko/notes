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

function isSpotify403(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Spotify 403:");
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

export async function getUserPlaylists(accessToken: string, offset = 0, limit = 50) {
  const o = clampOffset(offset);
  const l = clampPageLimit(limit);
  const res = await spotifyFetch(
    `${API}/me/playlists?offset=${o}&limit=${l}`,
    accessToken,
  );
  return res.json();
}

export async function getPlaylistDetails(accessToken: string, playlistId: string) {
  const narrow = `${API}/playlists/${encodeURIComponent(playlistId)}?fields=id,name,description,images,owner(display_name),tracks(total)`;
  try {
    const res = await spotifyFetch(narrow, accessToken);
    return res.json();
  } catch (e) {
    if (isSpotify403(e)) {
      const res = await spotifyFetch(
        `${API}/playlists/${encodeURIComponent(playlistId)}`,
        accessToken,
      );
      return res.json();
    }
    throw e;
  }
}

/**
 * Fetch tracks for a playlist.
 *
 * Spotify's `/playlists/{id}/tracks` endpoint returns 403 for many
 * development-mode apps. The workaround is to use `GET /playlists/{id}`
 * which embeds the first 100 tracks in the response and always works.
 */
export async function getPlaylistTracks(accessToken: string, playlistId: string, offset = 0, limit = 50) {
  const o = clampOffset(offset);
  const l = clampPageLimit(limit);
  const base = `${API}/playlists/${encodeURIComponent(playlistId)}/tracks`;

  // Try the dedicated tracks endpoint first (cheapest).
  try {
    const params = new URLSearchParams({
      offset: String(o),
      limit: String(l),
      additional_types: "track",
    });
    const res = await spotifyFetch(`${base}?${params}`, accessToken);
    return res.json();
  } catch (e) {
    if (!isSpotify403(e)) throw e;
  }

  // Fallback: GET /playlists/{id} (full object) always returns 200
  // and includes `tracks` with up to 100 items.
  const res = await spotifyFetch(
    `${API}/playlists/${encodeURIComponent(playlistId)}`,
    accessToken,
  );
  const data = await res.json();

  if (!data?.tracks) {
    throw new Error("Spotify returned no tracks for this playlist");
  }

  const tracks = data.tracks as {
    items: unknown[];
    next: string | null;
    total: number;
    offset: number;
  };

  // The full-playlist endpoint starts at offset 0 with up to 100 items.
  // If the caller asked for offset 0, we can return it directly (sliced to limit).
  if (o === 0) {
    return {
      items: tracks.items.slice(0, l),
      next: tracks.items.length > l ? "more" : tracks.next,
      total: tracks.total,
      offset: 0,
    };
  }

  // For offset > 0: the full-playlist response only has items 0-99.
  // Return the slice if available, otherwise return empty to signal "no more".
  if (o < tracks.items.length) {
    const slice = tracks.items.slice(o, o + l);
    return {
      items: slice,
      next: o + l < tracks.items.length ? "more" : null,
      total: tracks.total,
      offset: o,
    };
  }

  // Offset is beyond what the full-playlist response includes.
  return { items: [], next: null, total: tracks.total, offset: o };
}
