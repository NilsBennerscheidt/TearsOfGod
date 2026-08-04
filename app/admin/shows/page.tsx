"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/admin/fetch-json";
import type { Show } from "@/types/content";
import type { ShowStatus } from "@/lib/schemas/show";

const STATUSES: ShowStatus[] = ["available", "few-left", "sold-out"];

type View = { kind: "list" } | { kind: "new" } | { kind: "edit"; slug: string };

export default function ShowsAdminPage() {
  const [shows, setShows] = useState<Show[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({ kind: "list" });

  // No synchronous setState here — see the identical comment in
  // app/admin/news/page.tsx's `load` (react-hooks/set-state-in-effect).
  function load() {
    fetchJson<{ items: Show[] }>("/api/admin/shows")
      .then((json) => setShows(json.items))
      .catch((err: Error) => setLoadError(err.message));
  }

  useEffect(load, []);

  function reload() {
    setShows(null);
    setLoadError(null);
    load();
  }

  if (view.kind !== "list") {
    return (
      <ShowForm
        key={view.kind === "edit" ? view.slug : "new"}
        mode={view.kind === "edit" ? "edit" : "create"}
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
        <h1 className="font-display text-2xl text-gold uppercase">Shows</h1>
        <button
          type="button"
          onClick={() => setView({ kind: "new" })}
          className="border-gold text-gold hover:text-gold-hi border px-3 py-1 font-mono text-xs uppercase"
        >
          New show
        </button>
      </div>

      {loadError ? (
        <p className="text-blood-text text-sm">Couldn&apos;t load shows: {loadError}</p>
      ) : !shows ? (
        <p>Loading…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {shows.map((show) => (
            <li key={show.slug} className="flex items-center justify-between border border-ash p-3">
              <div>
                <p className="font-display text-gold">
                  {show.city} — {show.venue}
                </p>
                <p className="text-meta text-steel-text">
                  {show.date} · {show.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView({ kind: "edit", slug: show.slug })}
                className="text-meta text-gold hover:text-gold-hi uppercase underline"
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ShowFormProps {
  mode: "create" | "edit";
  initialSlug?: string;
  onDone: () => void;
  onCancel: () => void;
}

function ShowForm({ mode, initialSlug, onDone, onCancel }: ShowFormProps) {
  const [slug, setSlug] = useState(initialSlug ?? "");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ShowStatus>("available");
  const [ticketUrl, setTicketUrl] = useState("");
  const [advance, setAdvance] = useState("");
  const [door, setDoor] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(mode === "create");

  useEffect(() => {
    if (mode !== "edit" || !initialSlug) return;
    fetchJson<{ frontmatter: Record<string, unknown>; body: string }>(`/api/admin/shows/${initialSlug}`)
      .then(({ frontmatter, body: markdownBody }) => {
        setDate(String(frontmatter.date ?? ""));
        setCity(String(frontmatter.city ?? ""));
        setVenue(String(frontmatter.venue ?? ""));
        setName(String(frontmatter.name ?? ""));
        setStatus((frontmatter.status as ShowStatus) ?? "available");
        setTicketUrl(String(frontmatter.ticketUrl ?? ""));
        const price = frontmatter.price as { advance: number; door: number } | undefined;
        setAdvance(price ? String(price.advance) : "");
        setDoor(price ? String(price.door) : "");
        setBody(markdownBody.trim());
        setLoaded(true);
      })
      .catch((err: Error) => setError(`Couldn't load this show: ${err.message}`));
  }, [mode, initialSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const frontmatter = {
      date,
      city,
      venue,
      name: name || undefined,
      status,
      ticketUrl: ticketUrl || undefined,
      price: advance && door ? { advance: Number(advance), door: Number(door), currency: "EUR" } : undefined,
    };

    setBusy(true);
    try {
      if (mode === "create") {
        await fetchJson("/api/admin/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, frontmatter, body }),
        });
      } else {
        await fetchJson(`/api/admin/shows/${initialSlug}`, {
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
    if (!initialSlug) return;
    if (!confirm(`Delete ${initialSlug}? This can't be undone from here.`)) return;
    setBusy(true);
    try {
      await fetchJson(`/api/admin/shows/${initialSlug}`, { method: "DELETE" });
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
        <h1 className="font-display text-2xl text-gold uppercase">{mode === "create" ? "New show" : "Edit show"}</h1>
        <button type="button" onClick={onCancel} className="text-meta text-steel-text uppercase">
          ← Back to list
        </button>
      </div>

      <Field label="Slug / filename (lowercase-kebab-case, e.g. 2026-10-31-viersen-halloween-12)">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          disabled={mode === "edit"}
          className="w-full border border-ash bg-transparent px-2 py-1 disabled:opacity-50"
        />
      </Field>

      <Field label="Date (ISO 8601, e.g. 2026-10-31T18:45:00+02:00)">
        <input value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="City">
        <input value={city} onChange={(e) => setCity(e.target.value)} required className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Venue">
        <input value={venue} onChange={(e) => setVenue(e.target.value)} required className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Bill/event name (optional)">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as ShowStatus)} className="border border-ash bg-transparent px-2 py-1">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Ticket URL (optional)">
        <input value={ticketUrl} onChange={(e) => setTicketUrl(e.target.value)} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <div className="flex gap-4">
        <Field label="Advance price (EUR, optional)">
          <input type="number" value={advance} onChange={(e) => setAdvance(e.target.value)} className="w-32 border border-ash bg-transparent px-2 py-1" />
        </Field>
        <Field label="Door price (EUR, optional)">
          <input type="number" value={door} onChange={(e) => setDoor(e.target.value)} className="w-32 border border-ash bg-transparent px-2 py-1" />
        </Field>
      </div>

      <Field label="Body (Markdown, optional)">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
      </Field>

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
