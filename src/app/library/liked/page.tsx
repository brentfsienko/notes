import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { LikedContent } from "@/components/liked-content";
import { CollectionHeader } from "@/components/collection-header";

export default async function LikedSongsPage() {
  const session = await auth();
  if (!session) redirect("/");
  if (session.error === "RefreshTokenError") redirect("/auth/signout");

  return (
    <main className="flex min-h-[100dvh] flex-col pb-24">
      <CollectionHeader title="liked songs" backHref="/library" />
      <LikedContent />
      <AppBottomChrome />
    </main>
  );
}
