import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/Footer";
import { PageHeader } from "@/components/sections/PageHeader";
import { PostCard } from "@/components/sections/PostCard";
import { PressKit } from "@/components/sections/PressKit";
import { getPosts } from "@/lib/content/posts";
import { parseLocale } from "@/i18n/routing";

// Renders Footer, whose copyright year is `new Date().getFullYear()` —
// see the fuller comment on app/[locale]/tour/page.tsx's revalidate.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("News");
  return { title: t("title") };
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, posts] = await Promise.all([getTranslations("News"), getPosts(parseLocale(locale))]);

  return (
    <>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="gutter-x flex flex-col gap-12 py-10 md:py-14">
        <section>
          {posts.length === 0 ? (
            <p className="text-body text-bone/80">{t("noPosts")}</p>
          ) : (
            <div>
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          )}
        </section>
        <PressKit locale={locale} />
      </div>
      <Footer variant="live" />
    </>
  );
}
