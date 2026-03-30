import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

const SCOPES = [
  "user-library-read",
  "user-library-modify",
  "user-read-email",
  "user-read-private",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Spotify({
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(SCOPES)}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token as string,
          refreshToken: account.refresh_token as string,
          expiresAt: account.expires_at as number,
          spotifyId: account.providerAccountId,
        };
      }

      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.spotifyId = token.spotifyId as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});

async function refreshAccessToken(
  token: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
        client_id: process.env.AUTH_SPOTIFY_ID!,
        client_secret: process.env.AUTH_SPOTIFY_SECRET!,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw data;

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  } catch {
    return { ...token, error: "RefreshTokenError" };
  }
}
