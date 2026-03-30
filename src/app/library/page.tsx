import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { LibraryContent } from "@/components/library-content";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col min-h-[100dvh] pb-20">
      <header className="flex items-center justify-between px-5 pt-6 pb-3">
        <div>
          <h1 className="text-lg font-semibold text-charcoal">Library</h1>
          <p className="text-sm text-bark mt-0.5">Your saved songs</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="text-xs text-stone active:text-bark transition-colors py-1 px-2"
          >
            Sign out
          </button>
        </form>
      </header>

      <LibraryContent />
      <Nav />
    </main>
  );
}
