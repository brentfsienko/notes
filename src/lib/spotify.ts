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
 * Spotify often returns 403 for playlist items depending on `market`.
 * Try several query shapes (reports vary: no market vs from_token vs ISO country).
 */
export async function getPlaylistTracks(accessToken: string, playlistId: string, offset = 0, limit = 50) {
  const o = clampOffset(offset);
  const l = clampPageLimit(limit);
  const base = `${API}/playlists/${encodeURIComponent(playlistId)}/tracks`;

  const paramVariants: URLSearchParams[] = [
    // Only request tracks to avoid episodes/local-episode edge cases.
    new URLSearchParams({ offset: String(o), limit: String(l), additional_types: "track" }),
    new URLSearchParams({ offset: String(o), limit: String(l), market: "from_token", additional_types: "track" }),
  ];

  let last403: Error | null = null;

  for (const params of paramVariants) {
    try {
      const res = await spotifyFetch(`${base}?${params.toString()}`, accessToken);
      return res.json();
    } catch (e) {
      if (isSpotify403(e)) {
        last403 = e instanceof Error ? e : new Error(String(e));
        continue;
      }
      throw e;
    }
  }

  let country: string | undefined;
  try {
    const me = await getCurrentUser(accessToken);
    country = typeof me.country === "string" ? me.country : undefined;
  } catch {
    /* ignore */
  }

  if (country) {
    try {
      const params = new URLSearchParams({
        offset: String(o),
        limit: String(l),
        market: country,
        additional_types: "track",
      });
      const res = await spotifyFetch(`${base}?${params.toString()}`, accessToken);
      return res.json();
    } catch (e) {
      if (!isSpotify403(e)) throw e;
      last403 = e instanceof Error ? e : new Error(String(e));
    }
  }

  // Final fallback: use the playlist's tracks.href (some accounts work only via this URL).
  try {
    const details = await getPlaylistDetails(accessToken, playlistId);
    const href = typeof details?.tracks?.href === "string" ? (details.tracks.href as string) : undefined;
    if (href) {
      const u = new URL(href);
      u.searchParams.set("offset", String(o));
      u.searchParams.set("limit", String(l));
      u.searchParams.set("additional_types", "track");
      // If market wasn't already set by Spotify, try from_token first.
      if (!u.searchParams.get("market")) u.searchParams.set("market", "from_token");
      const res = await spotifyFetch(u.toString(), accessToken);
      return res.json();
    }
  } catch (e) {
    if (!isSpotify403(e)) throw e;
    last403 = e instanceof Error ? e : new Error(String(e));
  }

  throw last403 ?? new Error("Spotify 403: could not load playlist tracks");
}
