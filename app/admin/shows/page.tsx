"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTimeField } from "@/app/admin/_components/DateTimeField";
import { routing } from "@/i18n/routing";
import { formatStored } from "@/lib/admin/datetime";
import { fetchJson } from "@/lib/admin/fetch-json";
import { COUNTRY_CODES, countryName, HOME_COUNTRY } from "@/lib/countries";
import type { ShowStatus } from "@/lib/schemas/show";
import type { Show } from "@/types/content";

const STATUSES: ShowStatus[] = ["available", "few-left", "sold-out"];

type View = { kind: "list" } | { kind: "new" } | { kind: "edit"; slug: string };

/** Mirrors isShowPublished() in lib/content/shows.ts — the list needs the same answer the site computes, for a badge. */
function visibility(show: Show): { label: string; tone: "hidden" | "scheduled" | "live" } {
  if (show.hidden) return { label: "Hidden", tone: "hidden" };
  if (show.hiddenUntil && Date.parse(show.hiddenUntil) > Date.now()) {
    return { label: `Hidden until ${formatStored(show.hiddenUntil)}`, tone: "scheduled" };
  }
  return { label: "Live", tone: "live" };
}

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
          {shows.map((show) => {
            const state = visibility(show);
            const missingNotes = routing.locales.filter((locale) => !show.note[locale]);

            return (
              <li key={show.slug} className="flex items-center justify-between border border-ash p-3">
                <div>
                  <p className="font-display text-gold">
                    {show.city}
                    {show.country !== HOME_COUNTRY && ` (${show.country})`} — {show.venue}
                  </p>
                  <p className="text-meta text-steel-text">
                    {formatStored(show.date)} · {show.status}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-2">
                    <span
                      className={
                        state.tone === "hidden"
                          ? "text-meta border-blood-text text-blood-text border px-1 uppercase"
                          : state.tone === "scheduled"
                            ? "text-meta border-gold text-gold border px-1 uppercase"
                            : "text-meta border-ash text-steel-text border px-1 uppercase"
                      }
                    >
                      {state.label}
                    </span>
                    {missingNotes.length > 0 && missingNotes.length < routing.locales.length && (
                      <span className="text-meta text-blood-text uppercase">
                        No {missingNotes.join("/")} note
                      </span>
                    )}
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
            );
          })}
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
  const [country, setCountry] = useState<string>(HOME_COUNTRY);
  const [venue, setVenue] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ShowStatus>("available");
  const [ticketUrl, setTicketUrl] = useState("");
  const [advance, setAdvance] = useState("");
  const [door, setDoor] = useState("");
  const [hidden, setHidden] = useState(false);
  const [hiddenUntil, setHiddenUntil] = useState("");
  const [noteDe, setNoteDe] = useState("");
  const [noteEn, setNoteEn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(mode === "create");

  useEffect(() => {
    if (mode !== "edit" || !initialSlug) return;
    fetchJson<{ frontmatter: Record<string, unknown> }>(`/api/admin/shows/${initialSlug}`)
      .then(({ frontmatter }) => {
        setDate(String(frontmatter.date ?? ""));
        setCity(String(frontmatter.city ?? ""));
        // Files written before the country field existed have none — the
        // schema defaults those to HOME_COUNTRY, so the form does too.
        setCountry(String(frontmatter.country ?? HOME_COUNTRY));
        setVenue(String(frontmatter.venue ?? ""));
        setName(String(frontmatter.name ?? ""));
        setStatus((frontmatter.status as ShowStatus) ?? "available");
        setTicketUrl(String(frontmatter.ticketUrl ?? ""));
        const price = frontmatter.price as { advance: number; door: number } | undefined;
        setAdvance(price ? String(price.advance) : "");
        setDoor(price ? String(price.door) : "");
        setHidden(frontmatter.hidden === true);
        setHiddenUntil(String(frontmatter.hiddenUntil ?? ""));
        const note = (frontmatter.note ?? {}) as { de?: string; en?: string };
        setNoteDe(note.de ?? "");
        setNoteEn(note.en ?? "");
        setLoaded(true);
      })
      .catch((err: Error) => setError(`Couldn't load this show: ${err.message}`));
  }, [mode, initialSlug]);

  // Alphabetical by the name a person reading this admin sees, not by
  // code — "Czechia" is nowhere near "CZ" in a sorted list.
  const countryOptions = useMemo(() => {
    const codes: string[] = COUNTRY_CODES.includes(country as (typeof COUNTRY_CODES)[number])
      ? [...COUNTRY_CODES]
      : // A hand-edited file may carry a code the curated list doesn't —
        // keep it selectable rather than silently rewriting the show.
        [country, ...COUNTRY_CODES];
    return codes
      .map((code) => ({ code, label: countryName(code, "en") }))
      .sort((a, b) => a.label.localeCompare(b.label, "en"));
  }, [country]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const frontmatter = {
      date,
      city,
      country,
      venue,
      name: name || undefined,
      status,
      ticketUrl: ticketUrl || undefined,
      price: advance && door ? { advance: Number(advance), door: Number(door), currency: "EUR" } : undefined,
      hidden,
      hiddenUntil: hiddenUntil || undefined,
      // Empty textarea means "no note in this language", not an empty
      // one — the schema rejects "" so the two can't be confused, and the
      // site renders no note rather than an empty block.
      note: { de: noteDe.trim() || undefined, en: noteEn.trim() || undefined },
    };

    setBusy(true);
    try {
      if (mode === "create") {
        await fetchJson("/api/admin/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, frontmatter }),
        });
      } else {
        await fetchJson(`/api/admin/shows/${initialSlug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frontmatter }),
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

      <DateTimeField label="Date and start time" value={date} onChange={setDate} required />

      <div className="flex flex-wrap gap-4">
        <Field label="City">
          <input value={city} onChange={(e) => setCity(e.target.value)} required className="w-64 border border-ash bg-transparent px-2 py-1" />
        </Field>

        <Field label="Country">
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="border border-ash bg-transparent px-2 py-1">
            {countryOptions.map(({ code, label }) => (
              <option key={code} value={code} className="bg-pitch">
                {label} ({code})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Venue">
        <input value={venue} onChange={(e) => setVenue(e.target.value)} required className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Bill/event name (optional)">
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-ash bg-transparent px-2 py-1" />
      </Field>

      <Field label="Status">
        <select value={status} onChange={(e) => setStatus(e.target.value as ShowStatus)} className="border border-ash bg-transparent px-2 py-1">
          {STATUSES.map((s) => (
            <option key={s} value={s} className="bg-pitch">
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

      <fieldset className="flex flex-col gap-3 border border-ash p-3">
        <legend className="text-meta text-gold px-1 uppercase">Visibility</legend>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} />
          <span className="text-sm">Hidden — never shown on the site</span>
        </label>

        <DateTimeField
          label="Hidden until (optional — announces itself at this moment)"
          value={hiddenUntil}
          onChange={setHiddenUntil}
          emptyHint="No schedule — this show's visibility is whatever the checkbox above says."
        />

        <p className="text-meta text-steel-text">
          {hidden
            ? "“Hidden” wins over the schedule below — this show stays off the site until you untick it."
            : hiddenUntil
              ? "Goes live on its own at that timestamp. /tour and the landing page revalidate hourly, so allow up to an hour."
              : "Visible on /tour and eligible to be the landing page’s next show."}
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3 border border-ash p-3">
        <legend className="text-meta text-gold px-1 uppercase">Note</legend>
        <p className="text-meta text-steel-text">
          Short Markdown blurb shown under the venue on /tour. Written per language — a language you leave empty
          simply shows no note there, it does not fall back to the other one.
        </p>

        <Field label="Note — Deutsch">
          <textarea value={noteDe} onChange={(e) => setNoteDe(e.target.value)} rows={4} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
        </Field>

        <Field label="Note — English">
          <textarea value={noteEn} onChange={(e) => setNoteEn(e.target.value)} rows={4} className="w-full border border-ash bg-transparent px-2 py-1 font-mono text-xs" />
        </Field>
      </fieldset>

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
