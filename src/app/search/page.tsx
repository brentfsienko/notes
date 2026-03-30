import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { SearchContent } from "@/components/search-content";

export default async function SearchPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex min-h-[100dvh] flex-col pb-[11rem]">
      <h1 className="px-4 pt-4 text-2xl font-bold tracking-tight text-fg">
        Search
      </h1>
      <SearchContent />
      <AppBottomChrome />
    </main>
  );
}
