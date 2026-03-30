import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { LibraryContent } from "@/components/library-content";
import { HeaderProfileLink } from "@/components/header-profile-link";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col min-h-[100dvh] pb-20">
      <header className="flex items-start justify-between gap-3 px-5 pt-6 pb-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-fg">Library</h1>
          <p className="text-sm text-muted mt-0.5">Your saved songs</p>
        </div>
        <HeaderProfileLink
          imageUrl={session.user?.image}
          name={session.user?.name}
        />
      </header>

      <LibraryContent />
      <Nav />
    </main>
  );
}
