# Vendor processing register (Art. 28 GDPR)

**Internal document — not published.** This file lives outside `content/legal/`, which is
the only directory the site renders (see `lib/content/legal.ts` — it serves exactly
`impressum` and `datenschutz`). Nothing here reaches the website.

Purpose: track which vendors process personal data on our behalf, whether a written
processing agreement is in place as Art. 28(3) GDPR requires, and where the evidence is
filed if a supervisory authority or a data subject ever asks.

Keep this current. When a vendor is added, changed, or dropped, update the table, add or
amend its detail block, and note it in the change log at the bottom.

---

## Status at a glance

| Vendor | Role | Personal data | Agreement | Status | Confirmed | Next review |
|---|---|---|---|---|---|---|
| Vercel Inc. | Hosting, edge delivery, server logs | Visitor IP, user-agent, request metadata | Data Processing Addendum | ❌ **Not available on our plan** | 2026-09-10 | On plan change |
| Google Ireland Ltd. | Email (Google Workspace) | Sender address, message content, mail headers | Cloud Data Processing Addendum (CDPA) | ✅ **Accepted** | 2026-09-10 | 2027-09-10 |
| Squarespace Domains II LLC | Domain registrar | Registrant details only — no visitor data | None required | ➖ **Not a processor** | 2026-09-10 | On transfer |

Status key: ✅ in place · ⚠️ partial or expiring · ❌ missing · ➖ not applicable

---

## 1. Vercel Inc.

| Field | Value |
|---|---|
| **Legal entity** | Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA |
| **Service** | Website hosting, edge delivery, server logging |
| **Role** | Processor (Art. 4(8) GDPR) |
| **Personal data** | Visitor IP address, user-agent, timestamp, requested path — transient, in server logs |
| **Agreement** | [Data Processing Addendum](https://vercel.com/legal/dpa) |
| **Status** | ❌ **Not available.** Scoped by its own terms to Enterprise and Pro plans; we are on the free (Hobby) tier |
| **Date confirmed** | 2026-09-10 |
| **Transfer mechanism** | Per Vercel's [privacy notice](https://vercel.com/legal/privacy-policy): Standard Contractual Clauses and EU-U.S. DPF participation. Note the 2021 EU SCCs sit in Schedule 3 *of the DPA*, so they do not reach our plan through that route |
| **Log retention** | One hour, per the free-tier plan — stated in `datenschutz.{de,en}.md` § 2. Re-check if the plan ever changes, since the published figure depends on it |
| **Evidence filed** | _Not yet captured._ Save a dated copy of <https://vercel.com/legal/dpa> showing the Enterprise/Pro scoping clause into `docs/vendor-evidence/` using the naming convention below — this is the evidence that the gap is a vendor limitation rather than an oversight on our part |
| **Disclosed in policy** | Yes — `datenschutz.{de,en}.md` § 2 |

**Open risk.** No Art. 28(3) contract is in place and none can be obtained on this plan.
Documented deliberately rather than ignored. Upgrading to Pro incorporates the DPA — and
the SCCs in its Schedule 3 — automatically, with no signature required.

**Accepted, for now.** Confirmed 2026-09-10 that the band operates non-commercially, which
removes the Hobby terms-of-service concern and leaves the Art. 28 gap as the only reason to
upgrade. Given that the site has no accounts, no forms and no analytics, and that Vercel
discards logs after an hour, the residual exposure is low and the gap is accepted
deliberately. **Revisit immediately if any of these change:** direct merch sales, paid
bookings taken through the site, a contact or mailing-list form, or any feature that stores
visitor data. Any one of them makes both the ToS and the Art. 28 question live again.

**Verbatim scoping clause**, for the file:

> "This Addendum applies to Vercel's Processing of Personal Data as a Processor under the
> Agreement for Customers who are on Enterprise and Pro plans."

---

## 2. Google Ireland Limited (Google Workspace)

| Field | Value |
|---|---|
| **Legal entity** | Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland |
| **Service** | Google Workspace — email for `info@tearsofgod.net` (MX: `aspmx.l.google.com`) |
| **Role** | Processor (Art. 4(8) GDPR) |
| **Personal data** | Sender address, message content, mail headers, attachments — for anyone who emails us |
| **Agreement** | [Cloud Data Processing Addendum (Customers)](https://cloud.google.com/terms/data-processing-addendum) — the CDPA, formerly the "Data Processing Amendment" under a Workspace agreement |
| **Status** | ✅ **Accepted** |
| **Date confirmed** | 2026-09-10 |
| **How incorporated** | Incorporated into the Google Workspace agreement rather than separately signed: *"This Cloud Data Processing Addendum … is incorporated into the Agreement(s) … between Google and Customer."* |
| **Transfer mechanism** | Per Google: Standard Contractual Clauses and EU-U.S. DPF participation |
| **Evidence filed** | [`docs/vendor-evidence/2026-09-10-google-cloud-data-processing-addendum.html`](vendor-evidence/2026-09-10-google-cloud-data-processing-addendum.html) — saved copy of the CDPA as it stood on the date of confirmation. **Still to add:** a dated screenshot of the acceptance state in the Workspace Admin console — confirmed 2026-09-10 as existing but held on another machine. This is the part that evidences *our* acceptance rather than the document's contents, so it is the more important half; copy it into `docs/vendor-evidence/` as `2026-09-10-google-workspace-cdpa-acceptance.png` |
| **Disclosed in policy** | Yes — `datenschutz.{de,en}.md` § 6 |

**To verify once.** Confirm the contracting entity on our account really is Google Ireland
Limited and not Google LLC — it depends where the account was originally created, and the
privacy statement names Ireland. It is visible in the Workspace Admin console under the
account's billing and legal details.

---

## 3. Squarespace Domains II LLC

| Field | Value |
|---|---|
| **Legal entity** | Squarespace Domains II LLC (IANA registrar ID 895) |
| **Service** | Registrar for `tearsofgod.net` — inherited when Squarespace acquired Google Domains in 2023 |
| **Role** | **Not a processor for this website** |
| **Personal data** | Registrant contact details only — our own data, not visitors' |
| **Agreement** | None required |
| **Date confirmed** | 2026-09-10 |
| **Evidence filed** | _Not yet captured._ `whois tearsofgod.net > docs/vendor-evidence/2026-09-10-tearsofgod-net-whois.txt` captures the registrar and the 2023-06-20 creation date in one command |
| **Disclosed in policy** | Not required — no visitor data reaches Squarespace |

**Why no DPA.** Registrar handling of registrant data runs on the ICANN registration
agreement, not on our website processing. No Squarespace hostname appears in any DNS
record or in any resource the browser loads. Registrant data is `REDACTED FOR PRIVACY` in
public WHOIS, which is the correct posture.

Note that DNS is still served by Google Cloud DNS (`ns-cloud-d1`–`d4.googledomains.com`).
If DNS ever moves, record the new provider here.

---

## Where evidence lives

Supporting documents go in `docs/vendor-evidence/`, named `YYYY-MM-DD-<vendor>-<document>.<ext>`
where the date is the day the evidence was captured — not the document's own date. That
makes it obvious at a glance how stale a snapshot is, and it keeps the file sorted next to
the register entry that cites it.

Capture the vendor's terms *as they stood on the day you confirmed them*. Vendors revise
these pages without notice, and "this is what the DPA said when we checked" is the claim
you need to be able to make later — a live link cannot make it.

Two distinct things are worth holding for each vendor, and they are easy to conflate:

- **The document** — what the vendor's terms say. A saved page or PDF.
- **Our acceptance of it** — that it actually applies to our account. Usually a screenshot
  of an admin console or a confirmation email. This is the half people forget, and it is
  the half that matters under Art. 28(3).

## Adding a vendor

Copy this block, fill it in, add a row to the table above, and log the change.

```markdown
## N. <Vendor legal name>

| Field | Value |
|---|---|
| **Legal entity** | <full legal name and registered address> |
| **Service** | <what we use it for> |
| **Role** | Processor / joint controller / not a processor |
| **Personal data** | <categories — be specific> |
| **Agreement** | <name of the DPA/CDPA/addendum, with link> |
| **Status** | ✅ / ⚠️ / ❌ / ➖ |
| **Date confirmed** | YYYY-MM-DD |
| **How incorporated** | signed / auto-incorporated / requested |
| **Transfer mechanism** | SCCs / DPF / adequacy decision / none needed (EEA only) |
| **Evidence filed** | <where the PDF or screenshot lives> |
| **Disclosed in policy** | Yes (§ n) / No / Not required |
```

Before adding one, ask the three questions that decide whether it belongs here at all:

1. **Does it receive personal data?** An IP address in a log counts. A registrar holding
   only our own contact details does not.
2. **On whose instruction?** A processor acts on ours. A party deciding its own purposes is
   a separate controller and needs different treatment — not a DPA.
3. **Does the privacy statement need updating too?** If visitors' data reaches it, the
   answer is almost always yes.

---

## Change log

| Date | Change |
|---|---|
| 2026-09-10 | Register created. Vercel, Google Workspace and Squarespace entered. |
| 2026-09-10 | Vercel DPA confirmed unavailable on free tier; recorded as an open risk. |
| 2026-09-10 | Google Workspace CDPA confirmed accepted. |
| 2026-09-10 | CDPA evidence copy filed at `docs/vendor-evidence/`; evidence-filing convention added. |
| 2026-09-10 | Non-commercial status confirmed; Hobby ToS concern closed, Art. 28 gap formally accepted. Vercel log retention (1 h) recorded and published. |
