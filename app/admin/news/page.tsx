"use client";

import { useEffect, useState } from "react";
import { DateTimeField } from "@/app/admin/_components/DateTimeField";
import { JsonField } from "@/app/admin/_components/JsonField";
import { routing } from "@/i18n/routing";
import { fetchJson } from "@/lib/admin/fetch-json";
import { COVER_TEMPLATES, EMBED_TEMPLATES, GALLERY_TEMPLATES, LINKS_TEMPLATES } from "@/lib/admin/json-templates";
import type { Post } from "@/types/content";

interface ListItem {
  slug: string;
  translations: Record<string, Post>;
  missingLocales: string[];
}

type View =
  | { kind: "list" }
  | { kind: "new"; locale?: string; slug?: string; seedLocale?: string }
  | { kind: "edit"; locale: string; slug: string };

/**
 * List + inline create/edit, one page rather than a route per action —
 * keeps the admin's page count small. `cover`/`gallery`/`embed` are
 * edited as raw JSON here rather than full nested photo-picker forms:
 * they're still validated server-side against the exact schema the site
 * reads with (postFrontmatterSchema), so a malformed value is rejected
 * with the same error a broken content file would throw at build time —
 * this is a scope cut on the *form*, not a gap in what gets checked.
 */
export default function NewsAdminPage() {
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "list" });

  // No synchronous setState here — `items`/`loadError` already start at
  // their reset values, and the effect-purity lint (react-hooks/set-state-
  // in-effect) flags any setState called directly in an effect body, only
  // exempting the async .then()/.catch() callbacks below.
  function load() {
    fetchJson<{ items: ListItem[] }>("/api/admin/posts")
      .then((json) => setItems(json.items))
      .catch((err: Error) => setLoadError(err.message));
  }

  useEffect(load, []);

  // Used by the "save"/"cancel" callbacks below (event handlers, not an
  // effect body) — there, synchronously resetting to a loading state
  // before re-fetching is fine.
  function reload() {
    setItems(null);
    setLoadError(null);
    load();
  }

  if (view.kind !== "list") {
    return (
      <PostForm
        key={view.kind === "edit" ? `${view.locale}/${view.slug}` : `new/${view.locale ?? ""}/${view.slug ?? ""}`}
        mode={view.kind === "edit" ? "edit" : "create"}
        initialLocale={view.locale}
        initialSlug={view.slug}
        seedLocale={view.kind === "new" ? view.seedLocale : undefined}
        onDone={() => {
          setView({ kind: "list" });
          reload();
        }}
        onCancel={() => setView({ kind: "list" })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-gold uppercase">Posts</h1>
        <button
          type="button"
          onClick={() => setView({ kind: "new" })}
          className="border-gold text-gold hover:text-gold-hi border px-3 py-1 font-mono text-xs uppercase"
        >
          New post
        </button>
      </div>

      {loadError ? (
        <p className="text-blood-text text-sm">Couldn&apos;t load posts: {loadError}</p>
      ) : !items ? (
        <p>Loading…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.slug} className="border border-ash p-3">
              <p className="font-display text-gold">{item.slug}</p>
              {item.missingLocales.length > 0 && (
                <p className="text-meta text-blood-text">Missing: {item.missingLocales.join(", ")}</p>
              )}
              <div className="mt-2 flex gap-4">
                {routing.locales.map((locale) => {
                  const post = item.translations[locale];
                  return post ? (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => setView({ kind: "edit", locale, slug: item.slug })}
                      className="text-meta text-gold hover:text-gold-hi uppercase underline"
                    >
                      Edit ({locale}): {post.title}
                    </button>
                  ) : (
                    <button
                      key={locale}
                      type="button"
                      onClick={() =>
                        setView({
                          kind: "new",
                          locale,
                          slug: item.slug,
                          seedLocale: routing.locales.find((l) => item.translations[l]),
                        })
                      }
                      className="text-meta text-blood-text hover:text-gold-hi uppercase underline"
                    >
                      Add {locale} translation
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface PostFormProps {
  mode: "create" | "edit";
  initialLocale?: string;
  initialSlug?: string;
  /** Create mode only: locale of an existing translation to copy date/tags/media from. */
  seedLocale?: string;
  onDone: () => void;
  onCancel: () => void;
}

function PostForm({ mode, initialLocale, initialSlug, seedLocale, onDone, onCancel }: PostFormProps) {
  const [locale, setLocale] = useState(initialLocale ?? routing.locales[0]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [coverJson, setCoverJson] = useState("");
  const [galleryJson, setGalleryJson] = useState("");
  const [embedJson, setEmbedJson] = useState("");
  const [linksJson, setLinksJson] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(mode === "create" && !seedLocale);

  useEffect(() => {
    const isEdit = mode === "edit";
    const sourceLocale = isEdit ? initialLocale : seedLocale;
    if (!sourceLocale || !initialSlug) return;
    fetchJson<{ frontmatter: Record<string, unknown>; body: string }>(
      `/api/admin/posts/${sourceLocale}/${initialSlug}`,
    )
      .then(({ frontmatter, body: markdownBody }) => {
        // Seeding a translation copies only the language-neutral fields;
        // title, excerpt and body stay empty for the translator to write.
        if (isEdit) {
          setTitle(String(frontmatter.title ?? ""));
          setExcerpt(String(frontmatter.excerpt ?? ""));
          setBody(markdownBody.trim());
        }
        setDate(String(frontmatter.date ?? ""));
        setTags((Array.isArray(frontmatter.tags) ? frontmatter.tags : []).join(", "));
        setCoverJson(frontmatter.cover ? JSON.stringify(frontmatter.cover, null, 2) : "");
        const gallery = Array.isArray(frontmatter.gallery) ? frontmatter.gallery : [];
        setGalleryJson(gallery.length ? JSON.stringify(gallery, null, 2) : "");
        setEmbedJson(frontmatter.embed ? JSON.stringify(frontmatter.embed, null, 2) : "");
        const links = Array.isArray(frontmatter.links) ? frontmatter.links : [];
        setLinksJson(links.length ? JSON.stringify(links, null, 2) : "");
        setLoaded(true);
      })
      .catch((err: Error) => setError(`Couldn't load this post: ${err.message}`));
  }, [mode, initialLocale, initialSlug, seedLocale]);

  async function handlePreview() {
    try {
      const json = await fetchJson<{ html: string }>("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: body }),
      });
      setPreview(json.html);
    } catch (err) {
      setPreview(`<p>${err instanceof Error ? err.message : "Preview failed."}</p>`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let frontmatter: Record<string, unknown>;
    try {
      frontmatter = {
        title,
        date,
        excerpt,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        cover: coverJson.trim() ? JSON.parse(coverJson) : undefined,
        gallery: galleryJson.trim() ? JSON.parse(galleryJson) : [],
        embed: embedJson.trim() ? JSON.parse(embedJson) : undefined,
        links: linksJson.trim() ? JSON.parse(linksJson) : [],
      };
    } catch {
      setError("cover/gallery/embed/links must be valid JSON (or left blank).");
      return;
    }

    setBusy(true);
    try {
      if (mode === "create") {
        await fetchJson("/api/admin/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, slug, frontmatter, body }),
        });
      } else {
        await fetchJson(`/api/admin/posts/${initialLocale}/${initialSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontmatter, body }),
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!initialLocale || !initialSlug) return;
    if (!confirm(`Delete ${initialSlug} (${initialLocale})? This can't be undone from here.`)) return;
    setBusy(true);
    try {
      await fetchJson(`/api/admin/posts/${initialLocale}/${initialSlug}`, { method: "DELETE" });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return <p>{error ? <span className="text-blood-text">{error}</span> : "Loading…"}</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-gold uppercase">{mode === "create" ? "New post" : "Edit post"}</h1>
        <button type="button" onClick={onCancel} className="text-meta text-steel-text uppercase">
          ← Back to list
        </button>
      </div>

      {mode === "create" && seedLocale && (
        <p className="text-meta text-steel-text">
          Translation of the {seedLocale} post — date, tags and media were copied; write title, excerpt and body.
        </p>
      )}

      {mode === "create" && (
        <Field label="Locale">
          <select value={locale} onChange={(e) => setLocale(e.target.value)} disabled={!!seedLocale} className="border border-ash bg-transparent px-2 py-1">
            {routing.locales.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <DateTimeField label="Publication date and time" value={date} onChange={setDate} required />

      <Field label="Slug / filename (lowercase-kebab-case)">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          disabled={mode === "edit" || !!seedLocale}
          className="w-full border border-ash bg-transparent px-2 py-1 disabled:opacity-50"
        />
      </Field>

      <Field label="Excerpt">
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required rows={2} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Tags (comma-separated)">
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <JsonField label="Cover (optional)" value={coverJson} onChange={setCoverJson} templates={COVER_TEMPLATES} pick="photo" />

      <JsonField label="Gallery (JSON array, optional)" value={galleryJson} onChange={setGalleryJson} templates={GALLERY_TEMPLATES} pick="photos" />

      <JsonField label="Embed (optional)" value={embedJson} onChange={setEmbedJson} templates={EMBED_TEMPLATES} pick="video" rows={3} />

      <JsonField
        label='Links (JSON array, optional — {"platform":"youtube","url":"...","label"?: "..."})'
        value={linksJson}
        onChange={setLinksJson}
        templates={LINKS_TEMPLATES}
        rows={5}
      />

      <Field label="Body (Markdown)">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
      </Field>

      <div className="flex items-center gap-3">
        <button type="button" onClick={handlePreview} className="border border-ash px-3 py-1 font-mono text-xs uppercase">
          Preview body
        </button>
      </div>
      {preview && <div className="tog-prose border border-ash p-4" dangerouslySetInnerHTML={{ __html: preview }} />}

      {error && <p className="text-blood-text text-sm">{error}</p>}

      <div className="flex items-center gap-4 border-t border-ash pt-4">
        <button type="submit" disabled={busy} className="border-gold text-gold hover:text-gold-hi border px-4 py-2 font-mono text-xs uppercase disabled:opacity-50">
          {busy ? "Saving…" : "Save"}
        </button>
        {mode === "edit" && (
          <button type="button" onClick={handleDelete} disabled={busy} className="border-blood-text text-blood-text border px-4 py-2 font-mono text-xs uppercase">
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-meta text-steel-text uppercase">{label}</span>
      {children}
    </label>
  );
}
