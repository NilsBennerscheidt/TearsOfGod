import Link from "next/link";
import { routing } from "@/i18n/routing";
import { getMedia } from "@/lib/content/media";
import { getPosts } from "@/lib/content/posts";
import { getShows } from "@/lib/content/shows";

/**
 * Dashboard: counts per content type plus a warning list of things a
 * human should probably look at — computed straight from the same
 * getPosts()/getShows()/getMedia() the public site reads with, not a
 * separate admin-only data path, so "what the dashboard sees" and "what
 * the site renders" can't drift apart.
 */
export default async function AdminHomePage() {
  const [postsByLocale, shows, media] = await Promise.all([
    Promise.all(routing.locales.map(async (locale) => ({ locale, posts: await getPosts(locale) }))),
    getShows(),
    getMedia(),
  ]);

  const allSlugs = Array.from(new Set(postsByLocale.flatMap(({ posts }) => posts.map((p) => p.slug))));
  const missingTranslations = allSlugs
    .map((slug) => ({
      slug,
      missing: postsByLocale.filter(({ posts }) => !posts.some((p) => p.slug === slug)).map((l) => l.locale),
    }))
    .filter((entry) => entry.missing.length > 0);

  const now = new Date().getTime();
  const stalePastShows = shows.filter(
    (show) => Date.parse(show.date) < now && show.status !== "sold-out",
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Posts" value={allSlugs.length} href="/admin/news" />
        <StatCard label="Shows" value={shows.length} href="/admin/shows" />
        <StatCard label="Photos" value={media.photos.length} href="/admin/media" />
        <StatCard label="Videos" value={media.videos.length} href="/admin/media" />
      </section>

      {(missingTranslations.length > 0 || stalePastShows.length > 0) && (
        <section className="border border-gold p-4">
          <h2 className="font-display mb-3 text-lg text-gold uppercase">Needs attention</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {missingTranslations.map((entry) => (
              <li key={entry.slug}>
                <Link href="/admin/news" className="text-gold hover:text-gold-hi underline">
                  {entry.slug}
                </Link>{" "}
                is missing a translation for: {entry.missing.join(", ")}
              </li>
            ))}
            {stalePastShows.map((show) => (
              <li key={show.slug}>
                <Link href="/admin/shows" className="text-gold hover:text-gold-hi underline">
                  {show.city} — {show.venue}
                </Link>{" "}
                already happened but is still marked &ldquo;{show.status}&rdquo;.
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="text-meta text-steel-text">
        Edits here write straight to files in <code>content/</code> and <code>public/media/</code>. They&apos;re
        working-tree changes like any other — review with <code>git status</code>/<code>git diff</code> and commit
        when ready. Nothing here deploys on its own.
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: "/admin/news" | "/admin/media" | "/admin/shows" }) {
  return (
    <Link href={href} className="border border-ash p-4 hover:border-gold">
      <p className="font-display text-3xl text-gold">{value}</p>
      <p className="text-meta text-steel-text uppercase">{label}</p>
    </Link>
  );
}
