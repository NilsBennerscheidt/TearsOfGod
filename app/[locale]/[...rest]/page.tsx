import { notFound } from "next/navigation";
import { parseLocale } from "@/i18n/routing";

/**
 * Catch-all whose only job is to 404 *inside* the locale segment.
 *
 * Without it, an unmatched path — `/de/voellig-kaputt`, a mistyped or
 * link-rotted URL, which is the most common way anyone reaches a 404 at
 * all — matches no route under app/[locale]/, so app/[locale]/layout.tsx
 * never runs and Next falls through to the root app/not-found.tsx: a
 * German visitor gets the English fallback with no header, no footer,
 * and no way back into their own language. Matching here means the
 * layout renders first, so notFound() is caught by the sibling
 * app/[locale]/not-found.tsx and the visitor gets the translated, fully
 * chromed 404 instead.
 *
 * Static routes beat a catch-all in Next's route matching, so this never
 * shadows a real page — it is only ever reached once everything else has
 * failed to match. `parseLocale` still runs first: /xx/anything is an
 * invalid *locale*, not a missing page under a valid one, and that case
 * belongs to the root fallback (see the note in app/not-found.tsx).
 */
export default async function CatchAllNotFound({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  parseLocale(locale);
  notFound();
}
