import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Grain } from "@/components/brand/Grain";
import { GoldFoilDefs } from "@/components/brand/GoldFoilDefs";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";
import { band } from "@/content/band";
import { parseLocale, routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/site";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Site-wide metadata only: metadataBase, the title template, and a
 * description that acts as a fallback for any route that somehow ships
 * without its own.
 *
 * Deliberately NO `alternates` and no `openGraph` here. Both are replaced
 * wholesale by a child rather than merged, so anything set at this level
 * is inherited verbatim by every page that doesn't override it — which is
 * how /en/tour, /en/band and /en/news each ended up declaring
 * `canonical: /en` and an og:title of just "Tears of God". Pages build
 * their own via pageMetadata() (lib/seo/metadata.ts), which derives
 * canonical, hreflang and og:url from a single path.
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

  // Only Nav/News/Media/Games are ever read by a Client Component
  // (SiteNav/MobileNavToggle/nav-items.ts, ShareButton, PhotoLightbox,
  // and the arcade's GameShell/GameOverCard/WhackGame — see the
  // grep-verified list in each). The rest of the catalogue is read
  // exclusively by Server Components via getTranslations(), which
  // doesn't go through this provider at all — shipping it to the client
  // anyway would just be dead weight in every page's initial payload.
  //
  // Games is small (~25 strings) and paid for on every route, which is
  // the cost of the allow-list being global. If the arcade's catalogue
  // grows, move it behind its own NextIntlClientProvider inside
  // app/[locale]/games/layout.tsx rather than letting it ride along on
  // the landing page's payload.
  const clientMessages = {
    Nav: messages.Nav,
    News: messages.News,
    Media: messages.Media,
    Games: messages.Games,
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
          <main id="main-content">
            <PageTransition>{children}</PageTransition>
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
