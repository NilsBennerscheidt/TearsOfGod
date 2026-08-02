import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Post } from "@/types/content";

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
    <article className="border-b border-ash py-6 first:pt-0 last:border-b-0">
      <p className="text-meta font-mono tracking-wide text-steel-text uppercase">{date}</p>
      <h2 className="font-display mt-1 text-2xl text-gold uppercase">
        <Link href={`/news/${post.slug}`} className="hover:text-gold-hi">
          {post.title}
        </Link>
      </h2>
      <p className="text-body mt-2 max-w-prose text-bone/85">{post.excerpt}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag} className="text-meta font-mono tracking-wide text-steel-text uppercase">
                #{tag}
              </li>
            ))}
          </ul>
        )}
        <Link href={`/news/${post.slug}`} className="text-meta font-mono tracking-wide text-gold uppercase">
          {t("readMore")}
        </Link>
      </div>
    </article>
  );
}
