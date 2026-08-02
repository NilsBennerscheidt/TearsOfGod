interface TagListProps {
  tags: string[];
}

/** The `#tag` list shared by PostCard (listing) and the news detail page — one implementation instead of two copies that could drift in markup. */
export function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag} className="text-meta font-mono tracking-wide text-steel-text uppercase">
          #{tag}
        </li>
      ))}
    </ul>
  );
}
