import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Grain } from "@/components/brand/Grain";
import { GoldFoilDefs } from "@/components/brand/GoldFoilDefs";
import { Header } from "@/components/layout/Header";
import { band } from "@/content/band";
import { parseLocale, routing } from "@/i18n/routing";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_URL = "https://tearsofgod.net";

/**
 * generateMetadata (not a static `metadata` export): `alternates.canonical`
 * and `alternates.languages` are per-locale — routing.localePrefix is
 * "always" (i18n/routing.ts), so /de and /en are two distinct, both-
 * indexable URLs and search engines need the hreflang pair declared to
 * treat them as translations of each other rather than duplicate content.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: parseLocale(locale), namespace: "Landing" });

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: band.name, template: `%s — ${band.name}` },
    description: t("bandBody"),
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      type: "website",
      locale,
      siteName: band.name,
      title: band.name,
      description: t("bandBody"),
      images: band.groupPhoto ? [{ url: band.groupPhoto }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: band.name,
      description: t("bandBody"),
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Let the dark design run edge-to-edge on notched devices; the
  // `gutter-x` / `safe-b` utilities keep content clear of the notch,
  // rounded corners, and home indicator.
  viewportFit: "cover",
  // Without this, mobile browser chrome stays default light and frames
  // an otherwise fully dark site.
  themeColor: "#131210",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for this request — see
  // https://next-intl.dev/docs/getting-started/app-router/with-i18n-routing
  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations("Nav");

  // Only Nav/News/Media are ever read by a Client Component
  // (SiteNav/MobileNavToggle/nav-items.ts, ShareButton, PhotoLightbox —
  // see the grep-verified list in each). The rest of the catalogue is
  // read exclusively by Server Components via getTranslations(), which
  // doesn't go through this provider at all — shipping it to the client
  // anyway would just be dead weight in every page's initial payload.
  const clientMessages = {
    Nav: messages.Nav,
    News: messages.News,
    Media: messages.Media,
  };

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={clientMessages}>
          <GoldFoilDefs />
          {/* One fixed, whole-viewport texture layer — not per-section like the mockup's per-artboard <Grain>. Low z-index and pointer-events:none so it never sits above or blocks real content. */}
          <Grain className="fixed z-0" />
          <a
            href="#main-content"
            className="focus:bg-gold focus:text-pitch focus:font-display sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2"
          >
            {t("skipToContent")}
          </a>
          <Header locale={locale} />
          <main id="main-content">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
