import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { LibraryContent } from "@/components/library-content";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col min-h-[100dvh] pb-20">
      <header className="px-5 pt-6 pb-3">
        <h1 className="text-lg font-semibold text-fg">Library</h1>
        <p className="text-sm text-muted mt-0.5">Your saved songs</p>
      </header>

      <LibraryContent />
      <Nav />
    </main>
  );
}
