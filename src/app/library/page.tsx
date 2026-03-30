import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import {
  LibraryContent,
  type LibraryServerPayload,
  type Playlist,
} from "@/components/library-content";
import { LibraryHeader } from "@/components/library-header";
import { loadLibraryInitial } from "@/lib/spotify-library-load";

/** Spotify + cold start can exceed default serverless limits on Hobby. */
export const maxDuration = 60;

export default async function LibraryPage() {
  let session;
  try {
    session = await auth();
  } catch {
    redirect("/auth/signout");
  }

  if (!session) redirect("/");
  if (session.error === "RefreshTokenError") redirect("/auth/signout");

  let initialLibrary: LibraryServerPayload | null = null;
  let initialError: string | null = null;
  try {
    const data = await loadLibraryInitial();
    initialLibrary = {
      likedTotal: data.likedTotal,
      playlists: data.playlists as Playlist[],
      nextOffset: data.nextOffset,
    };
  } catch (e) {
    initialError = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="flex min-h-[100dvh] flex-col pb-24">
      <LibraryHeader
        imageUrl={session.user?.image}
        name={session.user?.name}
      />
      <LibraryContent
        initialLibrary={initialLibrary}
        initialError={initialError}
      />
      <AppBottomChrome />
    </main>
  );
}
