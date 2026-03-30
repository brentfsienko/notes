import { auth } from "@/auth";
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
  if (session.error === "RefreshTokenError") redirect("/auth/signout");

  const { id } = await params;
  let title = "playlist";
  let reportedTrackTotal: number | null = null;
  try {
    const playlist = await fetchPlaylistDetails(id);
    if (playlist?.name && typeof playlist.name === "string") {
      title = playlist.name;
    }
    const t = playlist?.tracks?.total;
    if (typeof t === "number" && Number.isFinite(t)) {
      reportedTrackTotal = t;
    }
  } catch {
    /* Client still loads tracks; header falls back if metadata is forbidden. */
  }

  return (
    <main className="flex min-h-[100dvh] flex-col pb-24">
      <CollectionHeader title={title} backHref="/library" />
      <PlaylistContent playlistId={id} reportedTrackTotal={reportedTrackTotal} />
      <AppBottomChrome />
    </main>
  );
}
