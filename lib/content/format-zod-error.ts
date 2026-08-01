import type { ZodError } from "zod";

/**
 * Formats a ZodError as a readable multi-line list via the stable
 * `.issues` array, rather than a version-specific pretty-printer helper —
 * keeps working across zod point releases without chasing API renames.
 */
export function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}
