import Link from "next/link";
import { SadMask } from "@/components/brand/SadMask";
import { CtaButton } from "@/components/ui/CtaButton";
import { spotifyUrl, youtubeUrl } from "@/content/social";
import "./globals.css";

/**
 * Root-level fallback — only reached when notFound() is thrown by
 * app/[locale]/layout.tsx itself (an invalid `locale` URL segment), since
 * that layout never finishes rendering and so its own
 * app/[locale]/not-found.tsx boundary can't be used for that specific
 * case (see the comment there). Every other 404 on the site — a stale
 * news slug, a removed show — is caught inside a valid locale and uses
 * that richer, site-styled boundary instead.
 *
 * It renders its own <html>, outside every layout, so it pulls in
 * globals.css directly — that's what lets it share the real mask, type,
 * and palette with the locale boundary instead of the hand-written
 * inline styles this used to carry. Copy stays English-only and
 * untranslated: by definition there is no valid locale to translate
 * into here, which is also why the two locale homepages are offered
 * rather than a single "home" link.
 */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body>
        <div className="gutter-x mx-auto max-w-2xl py-24 text-center">
          <p className="text-meta font-mono tracking-widest text-gold uppercase">
            404
          </p>
          <SadMask size={132} title="The mask, crying" className="mt-8" />
          <h1 className="font-display mt-8 text-3xl text-bone uppercase">
            This is not the site you have been looking for
          </h1>
          <p className="text-body mt-3 text-bone/80">
            This page doesn&apos;t exist — the link may be out of date.
          </p>

          <p className="text-body mt-12 text-bone">Check out our nice music</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <CtaButton href={spotifyUrl}>Spotify →</CtaButton>
            <CtaButton href={youtubeUrl} variant="outline">
              YouTube →
            </CtaButton>
          </div>

          <div className="mt-8 flex justify-center gap-6">
            <Link
              href="/de"
              className="text-meta font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
            >
              DE →
            </Link>
            <Link
              href="/en"
              className="text-meta font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
            >
              EN →
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
