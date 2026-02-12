import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks Generator",
  description: "Mini planning tool for feature specs and engineering tasks"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <header className="site-header">
          <div className="container header-row">
            <a href="/" className="brand">
              Tasks Generator
            </a>
            <nav className="header-nav">
              <a href="/">Home</a>
              <a href="/status">Status</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
