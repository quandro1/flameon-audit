# Publishing the Flame On audit app

This folder **is** the website. Once it is published, every auditor opens one web address instead of
passing an HTML file around — which is what caused audits to reset, photos to vanish and findings not
to save on the phones.

Current build: **v8.0.5 (2026-09-26)**, with the baked questionnaires, branch list and admin login.

---

## It is live

**https://quandro1.github.io/flameon-audit/**

Published 2026-09-26 from this folder (GitHub repo `quandro1/flameon-audit`, Pages on `main` / root).
Send that link to the auditors.

---

## What the auditors do (once each)

1. Open the link in **Chrome**.
2. Tap **📲 Install app** in the toolbar (or Chrome's ⋮ menu → "Add to Home screen").
3. From then on they open it from the **home-screen icon** — never from a WhatsApp message.

After that it behaves like a normal app, works with no signal, and every audit on that phone stays in
one place.

---

## Updating the app later

1. Edit `index.html` in this folder.
2. **Also change the `CACHE` line in `sw.js`**, e.g. `flameon-audit-v8.0.5` → `flameon-audit-v8.0.6`.
3. From this folder: `git add -A && git commit -m "..." && git push origin main`
   (The GitHub CLI is installed and already signed in as `quandro1`, so the push just works.)
   The live site updates about a minute later.

   This step is not optional. Installed phones keep serving the cached copy until that name changes,
   so skipping it means auditors silently keep running the old questionnaire.
4. Auditors get a "A newer version is ready — Reload now" banner on their next launch. Their drafts,
   completed audits and photos are untouched by an update.

---

## About the login

The admin login gates the questionnaire editor and amendments. It is client-side: anyone who can open
the page could read its source. That is fine for stopping casual edits by staff — it is not access
control. Keep the questionnaire master copy off the phone too.

---

## Notes

- `DEPLOY.md`, `README.md` and `SETUP-GUIDE.html/pdf` in this folder date from the earlier v8.1 build
  and describe a head-office submission feature (Google Sheet + Apps Script) that is **not** in this
  build. Ignore them for now; that feature can be added back on top of v8.0.5 when you want central
  collection. The v8.1 file itself is still in this repository's git history.
- Audit data stays on each phone. Collection today is via the `FO-Audit-….json` file each completed
  audit saves, which imports into any copy through **History → ⤒ Import audit file**.
