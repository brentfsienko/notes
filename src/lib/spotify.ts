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

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Spotify applies a rolling ~30s window per app; 429 responses usually include
 * `Retry-After` (seconds). See:
 * https://developer.spotify.com/documentation/web-api/concepts/rate-limits
 */
function parseRetryAfterSeconds(header: string | null): number | null {
  if (!header) return null;
  const n = Number.parseFloat(header.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  /** Cap a single wait so a bad header cannot hang the serverless function. */
  return Math.min(n, 120);
}

function retryAfterJitterMs(): number {
  return Math.floor(Math.random() * 400);
}

/** Retries 429: wait `Retry-After` seconds (per Spotify docs), else exponential backoff. */
async function spotifyFetch(url: string, accessToken: string, init?: RequestInit) {
  const maxAttempts = 8;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: { ...headers(accessToken), ...init?.headers },
    });

    if (res.status === 429) {
      const body = await res.text();
      if (attempt + 1 >= maxAttempts) {
        throw new Error(`Spotify 429 (${url}): ${body}`);
      }
      const sec = parseRetryAfterSeconds(res.headers.get("Retry-After"));
      const waitMs =
        sec !== null
          ? sec * 1000 + retryAfterJitterMs()
          : Math.min(750 * 2 ** attempt, 15_000) + retryAfterJitterMs();
      await sleep(waitMs);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Spotify ${res.status} (${url}): ${await res.text()}`);
    }
    return res;
  }
  throw new Error(`Spotify: too many retries (${url})`);
}

/** Must match `spotifyFetch` errors: `Spotify 403 (url): ...` — note there is no colon after 403. */
function isSpotify403(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Spotify 403");
}

/**
 * Playlist pages return `items[]` where each row is usually `{ added_at, track }`.
 * The newer `/items` API may use `{ added_at, item }` for the playable object instead.
 * Normalize to `{ added_at, track }` so the rest of the app stays unchanged.
 */
function normalizePlaylistItemsPage(data: {
  items?: unknown[];
  next?: string | null;
  total?: number;
  limit?: number;
  offset?: number;
}): {
  items: unknown[];
  next: string | null;
  total?: number;
  limit?: number;
  offset?: number;
} {
  const raw = data.items ?? [];
  const items = raw.map((row) => {
    if (!row || typeof row !== "object") return row;
    const r = row as Record<string, unknown>;
    if (r.track && typeof r.track === "object") return r;
    const inner = r.item;
    if (inner && typeof inner === "object") {
      const t = inner as { type?: string };
      if (t.type === "episode") return { ...r, track: null };
      return { ...r, track: inner };
    }
    return r;
  });
  return {
    ...data,
    items,
    next: data.next ?? null,
  };
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
  const params = new URLSearchParams({
    offset: String(o),
    limit: String(l),
    /** Ask for `tracks.total` explicitly; default responses sometimes omit it. */
    fields:
      "items(id,name,images,owner(id,display_name),collaborative,public,tracks(href,total)),next,previous,total",
  });
  try {
    const res = await spotifyFetch(`${API}/me/playlists?${params}`, accessToken);
    return res.json();
  } catch (e) {
    if (e instanceof Error && e.message.includes("Spotify 400")) {
      const res = await spotifyFetch(
        `${API}/me/playlists?offset=${o}&limit=${l}`,
        accessToken,
      );
      return res.json();
    }
    throw e;
  }
}

export async function getPlaylistDetails(accessToken: string, playlistId: string) {
  const narrowParams = new URLSearchParams({
    fields: "id,name,description,images,owner(display_name),tracks(total)",
    market: "from_token",
  });
  const narrow = `${API}/playlists/${encodeURIComponent(playlistId)}?${narrowParams}`;
  try {
    const res = await spotifyFetch(narrow, accessToken);
    return res.json();
  } catch (e) {
    if (isSpotify403(e)) {
      const fallback = new URLSearchParams({ market: "from_token" });
      const res = await spotifyFetch(
        `${API}/playlists/${encodeURIComponent(playlistId)}?${fallback}`,
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
 * Spotify recommends `GET /playlists/{id}/items` ("Get playlist items").
 * The older `/tracks` path is deprecated but kept as a secondary try.
 * If both 403, fall back to `GET /playlists/{id}` with `fields` so embedded
 * `tracks.items` may still load.
 */
export async function getPlaylistTracks(accessToken: string, playlistId: string, offset = 0, limit = 50) {
  const o = clampOffset(offset);
  const l = clampPageLimit(limit);
  const id = encodeURIComponent(playlistId);
  const itemsUrl = `${API}/playlists/${id}/items`;
  const tracksLegacyUrl = `${API}/playlists/${id}/tracks`;

  /** Do not send `additional_types=track` alone — Spotify treats it as *extra* types beyond the default track and it can yield bad/empty pages. */
  const listParams = () =>
    new URLSearchParams({
      offset: String(o),
      limit: String(l),
      market: "from_token",
    });

  // 1) Current API: /items
  try {
    const res = await spotifyFetch(`${itemsUrl}?${listParams()}`, accessToken);
    return normalizePlaylistItemsPage(await res.json());
  } catch (e) {
    if (!isSpotify403(e)) throw e;
  }

  // 2) Deprecated alias: /tracks (some stacks still route differently)
  try {
    const res = await spotifyFetch(`${tracksLegacyUrl}?${listParams()}`, accessToken);
    return normalizePlaylistItemsPage(await res.json());
  } catch (e) {
    if (!isSpotify403(e)) throw e;
  }

  // 3) Fallback: request the playlist itself, but *force* Spotify to include track items.
  const playlistParams = new URLSearchParams({
    offset: String(o),
    limit: String(l),
    market: "from_token",
    // Request full `tracks.items` cells so Spotify returns both `track` and/or `item` shapes.
    fields: "tracks.items,tracks.next,tracks.total",
  });
  const res = await spotifyFetch(
    `${API}/playlists/${encodeURIComponent(playlistId)}?${playlistParams.toString()}`,
    accessToken,
  );
  const data = await res.json();

  const tracks = (data?.tracks ?? null) as
    | {
        items?: unknown[];
        next?: string | null;
        total?: number;
        offset?: number;
      }
    | null;

  // Some playlists return metadata but omit embedded track items.
  // Don't crash the page—return an empty list so the UI can render.
  if (!tracks || !Array.isArray(tracks.items)) {
    return {
      items: [],
      next: null,
      total: typeof tracks?.total === "number" ? tracks.total : 0,
      offset: o,
    };
  }

  const normalizedItems = normalizePlaylistItemsPage({
    items: tracks.items,
    next: tracks.next ?? null,
    total: tracks.total,
  }).items;

  // The full-playlist endpoint starts at offset 0 with up to 100 items.
  // If the caller asked for offset 0, we can return it directly (sliced to limit).
  if (o === 0) {
    return {
      items: normalizedItems.slice(0, l),
      next: normalizedItems.length > l ? "more" : (tracks.next ?? null),
      total: typeof tracks.total === "number" ? tracks.total : normalizedItems.length,
      offset: 0,
    };
  }

  // For offset > 0: the full-playlist response only has items 0-99.
  // Return the slice if available, otherwise return empty to signal "no more".
  if (o < normalizedItems.length) {
    const slice = normalizedItems.slice(o, o + l);
    return {
      items: slice,
      next: o + l < normalizedItems.length ? "more" : null,
      total: typeof tracks.total === "number" ? tracks.total : normalizedItems.length,
      offset: o,
    };
  }

  // Offset is beyond what the full-playlist response includes.
  return {
    items: [],
    next: null,
    total: typeof tracks.total === "number" ? tracks.total : normalizedItems.length,
    offset: o,
  };
}
