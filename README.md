# Flame On — Operations Audit (installable app)

Doc **FO-STD-001** · app **v8.1** · questionnaire sets `full v2 · daily v2 · warehouse v1 · warehouse-daily v1`

The Flame On branch audit tool, packaged as an installable web app. Auditors open one link, add it
to their home screen, and run daily checks and weekly/monthly/quarterly audits offline. Completed
audits upload themselves to a head-office Google Sheet as soon as there is a signal.

**Setup instructions: [DEPLOY.md](DEPLOY.md).**

## What's in here

| File | |
|---|---|
| `index.html` | The whole app — questionnaires, scoring engine, CAPA register, dashboard, A4 print. Self-contained. |
| `sw.js` | Service worker: makes the app work offline. **Bump `CACHE` on every deploy.** |
| `manifest.webmanifest` | Makes it installable (name, icon, standalone window). |
| `icons/` | Home-screen icons, rendered from the brand flame mark. |
| `apps-script/Code.gs` | The head-office receiver — paste into a Google Sheet's Apps Script. |

## How it behaves

- **Offline-first.** Everything needed to run a full audit is cached on install. A complete audit
  can be taken with the phone in aeroplane mode.
- **Nothing is lost to a bad connection.** A completed audit is saved and locked on the device
  first, then queued. Failed uploads retry on reconnect, on next launch, and on demand (⇪ Sync).
  The ⛃ Backup JSON file remains the manual fallback and still contains everything.
- **Data lives on the auditor's device** (localStorage + IndexedDB for photos) until it is sent.
  Clearing browser data for the site erases unsent audits — the app warns about this.
- **Re-sending is safe.** Head office keys on the audit ID and updates that audit's row rather than
  duplicating it, so an auditor can hit Re-send freely.
- **Locked audits are immutable.** Amending one creates a new record that supersedes it; both are
  kept, and the amendment reason and admin name travel with it.

## Head office gets

- **Audits** sheet — one row per audit: branch, date, score, grade, tier, auto-fail, findings,
  open CAPAs, auditor, and a link to the full record.
- **Findings** sheet — one row per failed line with its corrective action, owner, due date and
  status. This is the chase list.
- **Drive folder** — the complete JSON record per audit plus evidence photos, filed by branch.

## Development notes

- Written in ES5-style plain JS, no build step, no dependencies. Keep it that way — the whole point
  is a file that opens and runs anywhere, including from a USB stick.
- After editing, syntax-check the extracted `<script>` with `node --check`. No backticks, no
  literal `</script>` in strings (the admin "Save edited tool" bake re-serializes the document).
- The four question sets carry embedded version stamps (`QS_FILE`). Bump the relevant one when you
  change questionnaire *content*, so devices holding an older cached set refresh it.
- `Downloads/CLAUDE.md` is the authoritative project brief for the audit programme as a whole.
