import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { PhotoGrid } from "@/components/sections/PhotoGrid";
import { PostEmbed } from "@/components/sections/PostEmbed";
import { TagList } from "@/components/sections/TagList";
import { ShareButton } from "@/components/ui/ShareButton";
import { Link } from "@/i18n/navigation";
import { parseLocale, routing } from "@/i18n/routing";
import { getPostBySlug, getPostNeighbours, getPosts } from "@/lib/content/posts";

// Renders Footer, whose copyright year is `new Date().getFullYear()` —
// see the fuller comment on app/[locale]/tour/page.tsx's revalidate.
export const revalidate = 3600;

export async function generateStaticParams() {
  const paramsByLocale = await Promise.all(
    routing.locales.map(async (locale) => {
      const posts = await getPosts(locale);
      return posts.map((post) => ({ locale, slug: post.slug }));
    }),
  );
  return paramsByLocale.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await getPostBySlug(parseLocale(locale), slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/${locale}/news/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: post.cover ? [{ url: post.cover.src, width: post.cover.width, height: post.cover.height }] : [],
    },
    twitter: {
      card: post.cover ? "summary_large_image" : "summary",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const appLocale = parseLocale(locale);
  const [t, post, { older, newer }] = await Promise.all([
    getTranslations("News"),
    getPostBySlug(appLocale, slug),
    getPostNeighbours(appLocale, slug),
  ]);

  if (!post) notFound();

  const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(post.date),
  );

  return (
    <>
      <div className="gutter-x mx-auto max-w-2xl pt-12 md:pt-16">
        <Link href="/news" className="text-meta font-mono tracking-wide text-gold uppercase">
          {t("back")}
        </Link>

        {post.cover && (
          <figure className="mt-6">
            <Image
              src={post.cover.src}
              alt={post.cover.alt}
              width={post.cover.width}
              height={post.cover.height}
              sizes="(min-width: 768px) 42rem, 100vw"
              className="w-full border border-ash object-cover"
              priority
            />
            {post.cover.credit && (
              <figcaption className="text-meta mt-1 text-steel-text uppercase">{post.cover.credit}</figcaption>
            )}
          </figure>
        )}

        <p className="text-meta mt-6 font-mono tracking-wide text-steel-text uppercase">{date}</p>
        <h1 className="font-display mt-2 mb-2 text-3xl text-gold uppercase">{post.title}</h1>
        <TagList tags={post.tags} />

        {/* Safe: bodyHtml is rendered from this repo's own markdown files, not user input. */}
        <div className="tog-prose mt-4" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

        {post.embed && (
          <div className="mt-8">
            <PostEmbed embed={post.embed} />
          </div>
        )}

        {post.gallery.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display mb-4 text-xl text-gold uppercase">{t("galleryHeading")}</h2>
            <PhotoGrid photos={post.gallery} />
          </section>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-ash pt-6">
          <ShareButton title={post.title} />
        </div>

        {(older || newer) && (
          <nav className="mt-4 flex items-center justify-between gap-4 border-t border-ash pt-6">
            {older ? (
              <Link
                href={`/news/${older.slug}`}
                className="text-meta font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
              >
                {t("prevPost")}
              </Link>
            ) : (
              <span />
            )}
            {newer && (
              <Link
                href={`/news/${newer.slug}`}
                className="text-meta font-mono tracking-wide text-gold uppercase hover:text-gold-hi"
              >
                {t("nextPost")}
              </Link>
            )}
          </nav>
        )}
      </div>
      <Footer variant="live" />
    </>
  );
}
