"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/**
 * The client half of the two-file game mount.
 *
 * `next/dynamic` with `ssr: false` cannot be called from a Server
 * Component — so the route's page.tsx stays a Server Component (metadata,
 * translations, static rendering) and delegates to this thin client file,
 * which is the only place allowed to declare the game client-only.
 *
 * Two things fall out of that. The game and its engine land in their own
 * chunk, fetched only by someone who actually opens /games/whack rather
 * than by every visitor to the site. And nothing in the game ever runs
 * during SSR, so the localStorage read, the rAF loop, and the pointer
 * handlers have no server pass to disagree with.
 *
 * LoadingSpinner's "cycle" variant is the project's existing answer for
 * a wait long enough that a constant spin stops reading as progress —
 * exactly a chunk fetch on a phone connection.
 */
const WhackGame = dynamic(() => import("./WhackGame").then((mod) => mod.WhackGame), {
  ssr: false,
  loading: () => <GameLoading />,
});

function GameLoading() {
  const t = useTranslations("Games");
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingSpinner variant="cycle" size={56} label={t("loading")} />
    </div>
  );
}

export function WhackMount() {
  return <WhackGame />;
}
