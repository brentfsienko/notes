import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/library");

  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
      <div className="max-w-xs">
        <h1 className="text-3xl font-light text-fg tracking-widest lowercase">
          oto
        </h1>
        <p className="text-[15px] text-muted mt-6 leading-relaxed font-light">
          a quiet place for the stories
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
            className="mt-12 w-full rounded-lg border border-accent/40 bg-accent/10 py-3.5 text-[15px] font-medium text-accent active:bg-accent/20 transition-colors"
          >
            connect with spotify
          </button>
        </form>

        <p className="text-faint text-xs mt-6 leading-relaxed">
          we read &amp; save to your spotify library.
          <br />
          notes are stored privately in this app.
        </p>
      </div>
    </main>
  );
}
