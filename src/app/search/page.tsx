import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SearchContent } from "@/components/search-content";
import { HeaderProfileLink } from "@/components/header-profile-link";

export default async function SearchPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col min-h-[100dvh] pb-20">
      <header className="flex items-center justify-between gap-3 px-5 pt-6 pb-1">
        <h1 className="text-lg font-semibold text-fg">Search</h1>
        <HeaderProfileLink
          imageUrl={session.user?.image}
          name={session.user?.name}
        />
      </header>

      <SearchContent />
      <Nav />
    </main>
  );
}
