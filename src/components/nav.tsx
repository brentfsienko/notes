"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();

  const tab = (
    href: string,
    label: string,
    active: boolean,
    icon: React.ReactNode,
  ) => (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[10px] tracking-wider transition-colors ${
        active ? "text-fg" : "text-faint"
      }`}
    >
      <span className={active ? "text-fg" : "text-faint"}>{icon}</span>
      {label}
    </Link>
  );

  return (
    <nav className="border-t border-border/60 bg-bg pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1">
      <div className="mx-auto flex max-w-lg">
        {tab(
          "/library",
          "library",
          pathname === "/library",
          <svg className="h-5 w-5" fill={pathname === "/library" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={pathname === "/library" ? 0 : 1.5}>
            {pathname === "/library" ? (
              <path d="M3 3h7v18H3V3zm11 0h7v11h-7V3z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            )}
          </svg>,
        )}
        {tab(
          "/search",
          "search",
          pathname === "/search",
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>,
        )}
      </div>
    </nav>
  );
}
