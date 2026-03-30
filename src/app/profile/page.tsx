import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { ProfileContent } from "@/components/profile-content";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex flex-col min-h-[100dvh] pb-20">
      <header className="px-5 pt-6 pb-1">
        <h1 className="text-lg font-semibold text-fg">Profile</h1>
      </header>

      <ProfileContent />

      <div className="mt-auto px-5 pb-6">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full py-3 rounded-xl border border-border text-muted text-sm font-medium active:bg-elevated transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      <Nav />
    </main>
  );
}
