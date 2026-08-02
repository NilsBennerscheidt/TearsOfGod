import { getTranslations } from "next-intl/server";
import type { PostEmbed as PostEmbedData } from "@/lib/schemas/post";

interface PostEmbedProps {
  embed: PostEmbedData;
}

/**
 * A post's optional embed: a self-hosted <video>, or a link/CTA out to a
 * release — never an inline Spotify player. Same reasoning as
 * VideoGrid's doc comment: a third-party iframe loads trackers on
 * render, which would make the current Datenschutz page's text
 * inaccurate and require a consent gate. `embed.kind` already
 * discriminates the two shapes at the schema level (lib/schemas/post.ts).
 */
export async function PostEmbed({ embed }: PostEmbedProps) {
  const t = await getTranslations("News");

  if (embed.kind === "video") {
    return (
      <video
        controls
        preload="metadata"
        poster={embed.poster}
        width={embed.width}
        height={embed.height}
        className="w-full border border-ash"
      >
        <source src={embed.src} />
      </video>
    );
  }

  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="border-gold text-gold hover:text-gold-hi inline-block border px-4 py-2 font-mono text-xs tracking-wide uppercase"
    >
      {t("listenOn")}
    </a>
  );
}
