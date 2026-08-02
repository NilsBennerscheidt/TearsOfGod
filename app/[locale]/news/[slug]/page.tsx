import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { getPostBySlug, getPosts } from "@/lib/content/posts";

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
  const post = await getPostBySlug(locale as AppLocale, slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [t, post] = await Promise.all([getTranslations("News"), getPostBySlug(locale as AppLocale, slug)]);

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
        <p className="text-meta mt-6 font-mono tracking-wide text-steel-text uppercase">{date}</p>
        <h1 className="font-display mt-2 mb-2 text-3xl text-gold uppercase">{post.title}</h1>
        {/* Safe: bodyHtml is rendered from this repo's own markdown files, not user input. */}
        <div className="tog-prose" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      </div>
      <Footer variant="live" />
    </>
  );
}
