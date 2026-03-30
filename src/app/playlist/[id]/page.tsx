import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { PlaylistContent } from "@/components/playlist-content";
import { CollectionHeader } from "@/components/collection-header";
import { fetchPlaylistDetails } from "@/app/actions/spotify";

export default async function PlaylistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/");
  if (session.error === "RefreshTokenError") {
    await signOut({ redirectTo: "/" });
  }

  const { id } = await params;
  const playlist = await fetchPlaylistDetails(id);

  return (
    <main className="flex min-h-[100dvh] flex-col pb-24">
      <CollectionHeader title={playlist.name} backHref="/library" />
      <PlaylistContent playlistId={id} />
      <AppBottomChrome />
    </main>
  );
}
