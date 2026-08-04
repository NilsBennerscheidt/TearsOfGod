"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Segment-level error boundary for /[locale]/** — without this, an
 * uncaught render error (a bad markdown file, a schema edge case that
 * slipped past validation) fell through to Next's default unstyled error
 * screen, outside the site's own layout entirely. Must be a Client
 * Component (Next's error.js contract — it needs the error/reset props
 * React only passes to a boundary rendered on the client).
 *
 * Hardcoded English rather than next-intl: the error that triggers this
 * boundary might originate above NextIntlClientProvider in the tree
 * (layout.tsx itself throwing), so nothing here can assume a message
 * catalogue is actually available — same reasoning as app/admin/layout.tsx
 * being unlocalized.
 */
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // The dynamic `[locale]` segment of the current route — not
  // next-intl's own locale (see the doc comment above on why this can't
  // assume that context exists), just enough to link home in the same
  // locale instead of switching the visitor's language on top of
  // whatever just went wrong. `next/navigation`'s useParams reads it off
  // the URL directly, independent of any provider.
  const params = useParams<{ locale?: string }>();
  const locale = params.locale ?? "de";

  useEffect(() => {
    // The only visibility into a render error this boundary has — no
    // error-reporting service is wired up yet for this project to
    // forward to instead.
    console.error(error);
  }, [error]);

  return (
    <div className="gutter-x mx-auto flex max-w-2xl flex-col items-center py-24 text-center">
      <p className="text-meta font-mono tracking-widest text-gold uppercase">Error</p>
      <h1 className="font-display mt-2 text-3xl text-bone uppercase">Something went wrong</h1>
      <p className="text-body mt-3 text-bone/80">
        This page hit an unexpected error. It&apos;s been logged — try again, or head back home.
      </p>
      <div className="mt-6 flex items-center gap-6">
        <button
          type="button"
          onClick={reset}
          className="text-meta font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
        >
          Try again
        </button>
        <Link href={`/${locale}`} className="text-meta font-mono tracking-wide text-gold uppercase hover:text-gold-hi">
          Home →
        </Link>
      </div>
    </div>
  );
}
