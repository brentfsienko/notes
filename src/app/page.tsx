import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/library");

  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <div className="max-w-xs">
        <h1 className="text-3xl font-semibold text-fg tracking-tight">
          oto
        </h1>
        <p className="text-[15px] text-muted mt-4 leading-relaxed">
          A quiet place for the stories
          <br />
          behind your songs.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("spotify", { redirectTo: "/library" });
          }}
        >
          <button
            type="submit"
            className="mt-10 w-full py-3.5 rounded-2xl bg-sage text-bg font-medium text-[15px] active:bg-moss transition-colors"
          >
            Connect with Spotify
          </button>
        </form>

        <p className="text-faint text-xs mt-5 leading-relaxed">
          We read &amp; save to your Spotify library.
          <br />
          Notes are stored privately in this app.
        </p>
      </div>
    </main>
  );
}
