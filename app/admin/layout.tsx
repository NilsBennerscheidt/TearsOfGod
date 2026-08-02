import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { assertAdminAllowed } from "@/lib/admin/guards";
import "../globals.css";

/**
 * Its own root layout (this app has no top-level app/layout.tsx, so this
 * is a fresh `<html><body>` root for the /admin subtree, entirely
 * independent of app/[locale]/layout.tsx) — not a route inside
 * app/[locale]/, because this tool edits the band site's content, it
 * isn't a page of it. No Header, no NextIntlClientProvider, no <Grain>:
 * hardcoded English throughout, since a local content-editing tool has
 * no audience to localize for.
 *
 * assertAdminAllowed() is the page-level half of the admin's guard —
 * every API route under app/api/admin/** additionally calls adminGuard()
 * itself, since a layout only protects pages, not the fetch calls a page
 * makes.
 */
export const metadata: Metadata = {
  title: "Tears of God — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await assertAdminAllowed();

  return (
    <html lang="en">
      <body className="bg-pitch text-bone min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-8 flex items-center justify-between border-b border-ash pb-4">
            <Link href="/admin" className="font-display text-xl text-gold uppercase">
              Tears of God — Admin
            </Link>
            <nav className="flex gap-6 font-mono text-xs tracking-wide text-steel-text uppercase">
              <Link href="/admin/news" className="hover:text-gold">
                News
              </Link>
              <Link href="/admin/shows" className="hover:text-gold">
                Shows
              </Link>
              <Link href="/admin/media" className="hover:text-gold">
                Media
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
