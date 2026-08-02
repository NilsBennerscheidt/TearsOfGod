import type { MediaVideo } from "@/types/content";

interface VideoGridProps {
  videos: MediaVideo[];
  emptyLabel: string;
}

/**
 * Self-hosted <video>, not YouTube/Instagram iframes — an embed would
 * load third-party trackers on page render, which would make the
 * Datenschutz page's current text inaccurate and require a consent gate.
 * The channel links in the socials section below cover that need instead.
 */
export function VideoGrid({ videos, emptyLabel }: VideoGridProps) {
  if (videos.length === 0) {
    return <p className="text-body text-bone/80">{emptyLabel}</p>;
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2">
      {videos.map((video) => (
        <li key={video.id}>
          <video
            controls
            preload="metadata"
            poster={video.poster}
            width={video.width}
            height={video.height}
            className="w-full border border-ash"
          >
            <source src={video.src} />
          </video>
          <p className="font-display mt-2 text-gold uppercase">{video.title}</p>
        </li>
      ))}
    </ul>
  );
}
