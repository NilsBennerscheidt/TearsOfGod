"use client";

import { useEffect, useState } from "react";
import { routing } from "@/i18n/routing";
import type { Post } from "@/types/content";

interface ListItem {
  slug: string;
  translations: Record<string, Post>;
  missingLocales: string[];
}

type View = { kind: "list" } | { kind: "new" } | { kind: "edit"; locale: string; slug: string };

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
  const [view, setView] = useState<View>({ kind: "list" });

  function load() {
    fetch("/api/admin/posts")
      .then((res) => res.json())
      .then((json) => setItems(json.items));
  }

  // Mount effect: `items` already starts at null, so there's nothing to
  // reset synchronously here — only the async .then() eventually calls
  // setState, which is the pattern the effect-purity lint expects.
  useEffect(load, []);

  // Used by the "save"/"cancel" callbacks below (event handlers, not an
  // effect body) — there, synchronously resetting to a loading state
  // before re-fetching is fine.
  function reload() {
    setItems(null);
    load();
  }

  if (view.kind !== "list") {
    return (
      <PostForm
        key={view.kind === "edit" ? `${view.locale}/${view.slug}` : "new"}
        mode={view.kind === "edit" ? "edit" : "create"}
        initialLocale={view.kind === "edit" ? view.locale : undefined}
        initialSlug={view.kind === "edit" ? view.slug : undefined}
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

      {!items ? (
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
                    <span key={locale} className="text-meta text-steel-text uppercase">
                      No {locale} file
                    </span>
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
  onDone: () => void;
  onCancel: () => void;
}

function PostForm({ mode, initialLocale, initialSlug, onDone, onCancel }: PostFormProps) {
  const [locale, setLocale] = useState(initialLocale ?? routing.locales[0]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [coverJson, setCoverJson] = useState("");
  const [galleryJson, setGalleryJson] = useState("");
  const [embedJson, setEmbedJson] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(mode === "create");

  useEffect(() => {
    if (mode !== "edit" || !initialLocale || !initialSlug) return;
    fetch(`/api/admin/posts/${initialLocale}/${initialSlug}`)
      .then((res) => res.json())
      .then(({ frontmatter, body: markdownBody }) => {
        setTitle(frontmatter.title);
        setDate(frontmatter.date);
        setExcerpt(frontmatter.excerpt);
        setTags((frontmatter.tags ?? []).join(", "));
        setCoverJson(frontmatter.cover ? JSON.stringify(frontmatter.cover, null, 2) : "");
        setGalleryJson(frontmatter.gallery?.length ? JSON.stringify(frontmatter.gallery, null, 2) : "");
        setEmbedJson(frontmatter.embed ? JSON.stringify(frontmatter.embed, null, 2) : "");
        setBody(markdownBody.trim());
        setLoaded(true);
      });
  }, [mode, initialLocale, initialSlug]);

  async function handlePreview() {
    const res = await fetch("/api/admin/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: body }),
    });
    const json = await res.json();
    setPreview(res.ok ? json.html : `<p>${json.error}</p>`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let frontmatter: Record<string, unknown>;
    try {
      frontmatter = {
        title,
        date,
        slug,
        excerpt,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        cover: coverJson.trim() ? JSON.parse(coverJson) : undefined,
        gallery: galleryJson.trim() ? JSON.parse(galleryJson) : [],
        embed: embedJson.trim() ? JSON.parse(embedJson) : undefined,
      };
    } catch {
      setError("cover/gallery/embed must be valid JSON (or left blank).");
      return;
    }

    setBusy(true);
    const res =
      mode === "create"
        ? await fetch("/api/admin/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale, frontmatter, body }),
          })
        : await fetch(`/api/admin/posts/${initialLocale}/${initialSlug}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frontmatter, body }),
          });

    setBusy(false);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong.");
      return;
    }
    onDone();
  }

  async function handleDelete() {
    if (!initialLocale || !initialSlug) return;
    if (!confirm(`Delete ${initialSlug} (${initialLocale})? This can't be undone from here.`)) return;
    setBusy(true);
    await fetch(`/api/admin/posts/${initialLocale}/${initialSlug}`, { method: "DELETE" });
    setBusy(false);
    onDone();
  }

  if (!loaded) return <p>Loading…</p>;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-gold uppercase">{mode === "create" ? "New post" : "Edit post"}</h1>
        <button type="button" onClick={onCancel} className="text-meta text-steel-text uppercase">
          ← Back to list
        </button>
      </div>

      {mode === "create" && (
        <Field label="Locale">
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className="border border-ash bg-transparent px-2 py-1">
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

      <Field label="Date (ISO 8601, e.g. 2026-04-22T09:00:00+02:00)">
        <input value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Slug (lowercase-kebab-case)">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          disabled={mode === "edit"}
          className="w-full border border-ash bg-transparent px-2 py-1 disabled:opacity-50"
        />
      </Field>

      <Field label="Excerpt">
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required rows={2} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Tags (comma-separated)">
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Cover (JSON, optional — {id, src, alt, width, height, credit?})">
        <textarea value={coverJson} onChange={(e) => setCoverJson(e.target.value)} rows={4} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
      </Field>

      <Field label="Gallery (JSON array, optional)">
        <textarea value={galleryJson} onChange={(e) => setGalleryJson(e.target.value)} rows={4} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
      </Field>

      <Field label='Embed (JSON, optional — {"kind":"spotify","url":"..."} or {"kind":"video",...})'>
        <textarea value={embedJson} onChange={(e) => setEmbedJson(e.target.value)} rows={3} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
      </Field>

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
