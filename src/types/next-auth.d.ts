import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    spotifyId: string;
    error?: string;
    /** Space-separated OAuth scopes granted for this session. */
    scope?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    spotifyId: string;
    error?: string;
    scope?: string;
  }
}
