import type { Metadata } from "next";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks Generator",
  description: "Mini planning tool for feature specs and engineering tasks"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[radial-gradient(circle_at_12%_-10%,#dfe3e8_0%,transparent_36%),radial-gradient(circle_at_90%_10%,#eceff3_0%,transparent_30%),linear-gradient(135deg,rgba(31,41,55,0.06),rgba(17,17,17,0.03))] bg-[#f3f4f6] text-zinc-900 antialiased"
      >
        <header className="sticky top-0 z-40 border-b border-zinc-300/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex min-h-15.5 w-[min(1080px,94vw)] items-center justify-between">
            <Link href="/" className="text-base font-extrabold tracking-[0.2px] text-zinc-900 no-underline">
              Tasks Generator
            </Link>
            <NavLinks />
          </div>
        </header>
        <main className="mx-auto w-[min(1080px,94vw)]">{children}</main>
      </body>
    </html>
  );
}
