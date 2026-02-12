"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseClass =
  "rounded-full border border-transparent px-3 py-2 text-sm text-zinc-800 no-underline transition hover:border-zinc-300 hover:bg-white";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2.5">
      <Link
        href="/"
        className={`${baseClass} ${pathname === "/" ? "font-bold" : "font-medium"}`}
      >
        Home
      </Link>
      <Link
        href="/status"
        className={`${baseClass} ${pathname === "/status" ? "font-bold" : "font-medium"}`}
      >
        Status
      </Link>
    </nav>
  );
}
