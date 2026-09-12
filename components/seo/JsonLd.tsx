/**
 * One <script type="application/ld+json"> block.
 *
 * Exists so the several pages that emit structured data don't each
 * hand-roll a dangerouslySetInnerHTML, and so the "why is this safe"
 * argument lives in one place instead of being restated (or quietly
 * dropped) at every call site.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      /*
       * Safe: every value reaching here is authored in this repo — Zod-
       * validated markdown frontmatter, content/*.ts, or message
       * catalogues. None of it is user input. JSON.stringify escapes the
       * quotes; the one sequence it would not escape is "</script>",
       * which cannot appear in any of those sources.
       */
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
