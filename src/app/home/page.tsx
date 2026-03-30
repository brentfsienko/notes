import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";

export default async function HomeAppPage() {
  const session = await auth();
  if (!session) redirect("/");

  const first = session.user?.name?.split(" ")?.[0] ?? "there";

  return (
    <main className="flex min-h-[100dvh] flex-col px-4 pb-[11rem] pt-4">
      <h1 className="text-2xl font-bold tracking-tight text-fg">
        Good evening, {first}
      </h1>
      <p className="mt-2 text-sm text-muted">Jump back in</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/library"
          className="flex aspect-[5/2] items-center rounded-md bg-chip px-4 text-left text-sm font-semibold text-fg active:bg-elevated"
        >
          Your Library
        </Link>
        <Link
          href="/search"
          className="flex aspect-[5/2] items-center rounded-md bg-chip px-4 text-left text-sm font-semibold text-fg active:bg-elevated"
        >
          Search
        </Link>
        <Link
          href="/search?add=1"
          className="flex aspect-[5/2] items-center rounded-md bg-chip px-4 text-left text-sm font-semibold text-fg active:bg-elevated"
        >
          Add songs
        </Link>
        <Link
          href="/profile"
          className="flex aspect-[5/2] items-center rounded-md bg-chip px-4 text-left text-sm font-semibold text-fg active:bg-elevated"
        >
          Profile
        </Link>
      </div>

      <AppBottomChrome />
    </main>
  );
}
