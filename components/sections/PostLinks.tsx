import type { PostLink } from "@/lib/schemas/post";
import { postLinkText } from "@/lib/post-links";

/** A post's outbound platform links (YouTube, Instagram, TikTok, …) as plain buttons — no third-party embeds. */
export function PostLinks({ links }: { links: PostLink[] }) {
  return (
    <ul className="flex flex-wrap gap-3">
      {links.map((link) => (
        <li key={`${link.platform}-${link.url}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-gold text-gold hover:text-gold-hi inline-block border px-4 py-2 font-mono text-xs tracking-wide uppercase"
          >
            {postLinkText(link)} ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
