import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { LibraryContent } from "@/components/library-content";
import { LibraryHeader } from "@/components/library-header";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/");

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
