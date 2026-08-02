import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { Post } from "@/types/content";
import { TagList } from "./TagList";

interface PostCardProps {
  post: Post;
  locale: string;
}

export async function PostCard({ post, locale }: PostCardProps) {
  const t = await getTranslations("News");
  const date = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(post.date),
  );

  return (
    <article className="flex gap-4 border-b border-ash py-6 first:pt-0 last:border-b-0">
      {post.cover && (
        // aria-hidden + tabIndex=-1: this links to the same place as the
        // title below it — a redundant stop for keyboard/AT users rather
        // than a second meaningful destination, same treatment
        // SpinnableTearHalo gives its own decorative/duplicate link.
        <Link href={`/news/${post.slug}`} aria-hidden="true" tabIndex={-1} className="hidden shrink-0 sm:block">
          <Image
            src={post.cover.src}
            alt=""
            width={post.cover.width}
            height={post.cover.height}
            sizes="128px"
            className="aspect-square w-32 border border-ash object-cover"
          />
        </Link>
      )}
      <div className="min-w-0">
        <p className="text-meta font-mono tracking-wide text-steel-text uppercase">{date}</p>
        <h2 className="font-display mt-1 text-2xl text-gold uppercase">
          <Link href={`/news/${post.slug}`} className="hover:text-gold-hi">
            {post.title}
          </Link>
        </h2>
        <p className="text-body mt-2 max-w-prose text-bone/85">{post.excerpt}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <TagList tags={post.tags} />
          <Link href={`/news/${post.slug}`} className="text-meta font-mono tracking-wide text-gold uppercase">
            {t("readMore")}
          </Link>
        </div>
      </div>
    </article>
  );
}
