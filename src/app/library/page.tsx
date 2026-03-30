import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { LibraryContent } from "@/components/library-content";
import { LibraryHeader } from "@/components/library-header";

export default async function LibraryPage() {
  let session;
  try {
    session = await auth();
  } catch {
    redirect("/auth/signout");
  }

  if (!session) redirect("/");
  if (session.error === "RefreshTokenError") redirect("/auth/signout");

  return (
    <main className="flex min-h-[100dvh] flex-col pb-24">
      <LibraryHeader
        imageUrl={session.user?.image}
        name={session.user?.name}
      />
      <LibraryContent />
      <AppBottomChrome />
    </main>
  );
}
