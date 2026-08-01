import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { getLegalPage } from "@/lib/content/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = await getLegalPage("datenschutz", locale as AppLocale);
  return { title: page.title };
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = await getLegalPage("datenschutz", locale as AppLocale);

  return (
    <article>
      <h1 className="font-display mb-2 text-3xl text-bone uppercase">{page.title}</h1>
      {/* Safe: bodyHtml is rendered from this repo's own markdown files, not user input. */}
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: page.bodyHtml }} />
    </article>
  );
}
