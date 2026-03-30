import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { AppBottomChrome } from "@/components/app-bottom-chrome";
import { ProfileContent } from "@/components/profile-content";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <main className="flex min-h-[100dvh] flex-col pb-[11rem]">
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Profile</h1>
      </header>

      <ProfileContent />

      <div className="mt-auto px-4 pb-4">
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-full border border-border py-3.5 text-sm font-semibold text-fg active:bg-chip"
          >
            Sign out
          </button>
        </form>
      </div>

      <AppBottomChrome />
    </main>
  );
}
