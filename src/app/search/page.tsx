import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SearchContent } from "@/components/search-content";

export default async function SearchPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col min-h-[100dvh] pb-20">
      <header className="px-5 pt-6 pb-1">
        <h1 className="text-lg font-semibold text-charcoal">Search</h1>
      </header>

      <SearchContent />
      <Nav />
    </main>
  );
}
