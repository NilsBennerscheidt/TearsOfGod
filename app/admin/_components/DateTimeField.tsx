"use client";

import { useId, useState } from "react";
import { browserOffsetFor, joinIso, parseIso } from "@/lib/admin/datetime";

/**
 * The offsets a booking plausibly lands in, labelled by where they apply
 * rather than left as bare numbers — "+02:00" is unmemorable, "Germany in
 * summer" is not. Not exhaustive: an offset already in a file that isn't
 * listed here is added to the dropdown at render time, so nothing becomes
 * uneditable just because it's unusual.
 */
const OFFSET_OPTIONS: { value: string; label: string }[] = [
  { value: "-08:00", label: "-08:00 · US Pacific" },
  { value: "-07:00", label: "-07:00 · US Mountain" },
  { value: "-06:00", label: "-06:00 · US Central" },
  { value: "-05:00", label: "-05:00 · US Eastern" },
  { value: "-04:00", label: "-04:00 · Atlantic Canada" },
  { value: "+00:00", label: "+00:00 · UTC · UK, Ireland, Portugal (winter)" },
  { value: "+01:00", label: "+01:00 · CET · Germany and most of Europe (winter)" },
  { value: "+02:00", label: "+02:00 · CEST · Germany and most of Europe (summer)" },
  { value: "+03:00", label: "+03:00 · EEST · Finland, Greece (summer)" },
];

interface DateTimeFieldProps {
  label: string;
  /** ISO 8601 with offset, or "" when unset. */
  value: string;
  /** Receives ISO 8601 with offset, or "" while the picker holds no complete value. */
  onChange: (iso: string) => void;
  required?: boolean;
  /** Shown under the picker while no value is set — say what an empty field means here. */
  emptyHint?: string;
}

/**
 * A datetime picker plus a UTC offset select, over one ISO-8601 string.
 *
 * Wall clock and offset are edited separately because they're separate
 * decisions: doors at 18:45 is a fact about the venue's clock, and which
 * clock that is depends on the country and the season. Changing the
 * offset therefore keeps the time on the face and moves the instant —
 * "18:45, but in Helsinki" — rather than the reverse.
 *
 * A new date defaults to the offset the editor's own machine is in at
 * that moment, which is DST-correct by construction (see
 * browserOffsetFor) and right for the home shows that are most of them.
 *
 * The draft state exists because re-deriving the picker's text from the
 * ISO value on every keystroke would fight the person typing: a
 * half-entered date joins to "", which would blank the field mid-entry.
 * So the raw text is kept next to the ISO it produced and reused while
 * the parent still holds that ISO; when the value changes from elsewhere
 * (the edit form's fetch landing), it re-derives. All at render time — no
 * effect, so nothing here trips the effect-purity lint the admin forms
 * document.
 */
export function DateTimeField({ label, value, onChange, required, emptyHint }: DateTimeFieldProps) {
  const labelId = useId();
  const [draft, setDraft] = useState<{ local: string; iso: string } | null>(null);
  // Remembers an offset chosen before a date exists — until then there's
  // no ISO string to carry it.
  const [pendingOffset, setPendingOffset] = useState<string | null>(null);

  const parsed = parseIso(value);
  const local = draft && draft.iso === value ? draft.local : (parsed?.local ?? "");
  const offset = parsed?.offset ?? pendingOffset ?? browserOffsetFor(local);

  const options = OFFSET_OPTIONS.some((option) => option.value === offset)
    ? OFFSET_OPTIONS
    : [{ value: offset, label: offset }, ...OFFSET_OPTIONS];

  function emit(nextLocal: string, nextOffset: string) {
    const iso = joinIso(nextLocal, nextOffset);
    setDraft({ local: nextLocal, iso });
    onChange(iso);
  }

  return (
    <div className="flex flex-col gap-1">
      <span id={labelId} className="text-meta text-steel-text uppercase">
        {label}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={local}
          required={required}
          aria-labelledby={labelId}
          onChange={(e) => {
            // A date typed before any offset was picked gets the one the
            // editor's clock is in *at that date* — not at today's date,
            // so booking a July show in January still writes +02:00.
            emit(e.target.value, parsed?.offset ?? pendingOffset ?? browserOffsetFor(e.target.value));
          }}
          className="w-64 border border-ash bg-transparent px-2 py-1"
        />

        <select
          value={offset}
          aria-label={`${label} — UTC offset`}
          onChange={(e) => {
            setPendingOffset(e.target.value);
            if (local) emit(local, e.target.value);
          }}
          className="border border-ash bg-transparent px-2 py-1"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-pitch">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <span className="text-meta text-steel-text">
        {value ? `Stored as ${value}` : (emptyHint ?? "No date set.")}
      </span>
    </div>
  );
}
