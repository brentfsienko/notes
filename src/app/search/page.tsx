import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { SearchContent } from "@/components/search-content";

export default async function SearchPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex min-h-[100dvh] flex-col pb-24">
      <h1 className="px-4 pt-4 pb-1 text-xl font-light tracking-wide text-fg lowercase">
        search
      </h1>
      <SearchContent />
      <AppBottomChrome />
    </main>
  );
}
