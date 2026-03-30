"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavIcons() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addIntent = searchParams.get("add") === "1";

  const homeActive = pathname === "/home";
  const libraryActive = pathname === "/library";
  const searchActive = pathname === "/search" && !addIntent;
  const createActive = pathname === "/search" && addIntent;

  const tab = (
    href: string,
    label: string,
    active: boolean,
    icon: React.ReactNode,
  ) => (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium tracking-wide transition-colors ${
        active ? "text-fg" : "text-muted"
      }`}
    >
      <span className={active ? "text-fg" : "text-muted"}>{icon}</span>
      {label}
    </Link>
  );

  return (
    <div className="flex max-w-lg mx-auto">
      {tab(
        "/home",
        "Home",
        homeActive,
        <svg className="h-6 w-6" fill={homeActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={homeActive ? 0 : 1.5}>
          {homeActive ? (
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          )}
        </svg>,
      )}
      {tab(
        "/search",
        "Search",
        searchActive,
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>,
      )}
      {tab(
        "/library",
        "Your Library",
        libraryActive,
        <svg className="h-6 w-6" fill={libraryActive ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={libraryActive ? 0 : 1.5}>
          {libraryActive ? (
            <path d="M3 3h7v18H3V3zm11 0h7v11h-7V3z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
          )}
        </svg>,
      )}
      {tab(
        "/search?add=1",
        "Create",
        createActive,
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>,
      )}
    </div>
  );
}

function NavFallback() {
  return <div className="flex h-[52px] max-w-lg mx-auto items-center justify-center text-xs text-muted">…</div>;
}

export function Nav() {
  return (
    <nav className="border-t border-border bg-bg pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
      <Suspense fallback={<NavFallback />}>
        <NavIcons />
      </Suspense>
    </nav>
  );
}
