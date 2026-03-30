# oto — Spotify library notes

Minimal Next.js app: connect Spotify, browse liked songs, search tracks, and save **private notes** next to each track. Likes sync to Spotify; notes live only in this app’s database.

## Setup

1. Copy `.env.local.example` to `.env.local`.
2. Create a [Spotify app](https://developer.spotify.com/dashboard) and set redirect URI to `http://localhost:3000/api/auth/callback/spotify` (Spotify allows `http` for `localhost`).
3. Set `AUTH_SPOTIFY_ID`, `AUTH_SPOTIFY_SECRET`, and `AUTH_SECRET` (e.g. `openssl rand -base64 32`).
4. `npm install` then `npm run db:migrate` (SQLite file `dev.db` is gitignored).

## Scripts

- `npm run dev` — local dev
- `npm run build` / `npm start` — production
- `npm run db:migrate` — Prisma migrations
- `npm run db:studio` — Prisma Studio

## Deploy (e.g. Vercel)

Use a hosted database (Turso/libsql or Postgres) and set `DATABASE_URL` plus the same auth env vars. Update the Spotify redirect URI to your production URL.
