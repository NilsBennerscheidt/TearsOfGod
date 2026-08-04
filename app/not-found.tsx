import Link from "next/link";

/**
 * Root-level fallback — only reached when notFound() is thrown by
 * app/[locale]/layout.tsx itself (an invalid `locale` URL segment), since
 * that layout never finishes rendering and so its own
 * app/[locale]/not-found.tsx boundary can't be used for that specific
 * case (see the comment there). Every other 404 on the site — a stale
 * news slug, a removed show — is caught inside a valid locale and uses
 * that richer, site-styled boundary instead; an invalid locale segment
 * is rare enough (a typo'd URL, not a stale link) that a plain fallback
 * is an acceptable trade for not needing a second app/layout.tsx just to
 * give this one case a locale to render translated chrome in.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ background: "#131210", color: "#f1ece0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 32 + "rem", margin: "0 auto", padding: "6rem 1.5rem", textAlign: "center" }}>
          <p style={{ letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>404</p>
          <h1 style={{ marginTop: "0.5rem", fontSize: "1.75rem", textTransform: "uppercase" }}>Page not found</h1>
          <p style={{ marginTop: "0.75rem", opacity: 0.85 }}>
            This page doesn&apos;t exist. Try the German or English site instead.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
            <Link href="/de" style={{ color: "#d9b25a" }}>
              DE →
            </Link>
            <Link href="/en" style={{ color: "#d9b25a" }}>
              EN →
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
