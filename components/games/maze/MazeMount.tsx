"use client";

import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/**
 * The client half of the two-file game mount — see WhackMount's doc
 * comment for why this split is required (ssr:false can't be called
 * from a Server Component) rather than stylistic.
 */
const MazeGame = dynamic(() => import("./MazeGame").then((mod) => mod.MazeGame), {
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

export function MazeMount() {
  return <MazeGame />;
}
