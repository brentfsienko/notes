import { redirect } from "next/navigation";

/** Old entry URL; library is the default logged-in home. */
export default function HomeRedirectPage() {
  redirect("/library");
}
