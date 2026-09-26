# Publishing the Flame On audit app

This folder **is** the website. Once it is published, every auditor opens one web address instead of
passing an HTML file around — which is what caused audits to reset, photos to vanish and findings not
to save on the phones.

Current build: **v8.0.5 (2026-09-26)**, with the baked questionnaires, branch list and admin login.

---

## What you need

A free GitHub account. Nothing else — no software to install.

---

## Steps (about 5 minutes)

1. Go to **github.com** and sign in (or create a free account).
2. Click **+** (top right) → **New repository**.
   - Repository name: `flameon-audit`
   - Select **Public**. (Anyone with the link can open the app. Audit data never leaves the auditor's
     phone — only this app's code is public. The admin login is in the file, so treat it as a lock on
     the door, not a safe: see "About the login" below.)
   - Do **not** tick "Add a README".
   - Click **Create repository**.
3. On the next page click **uploading an existing file**.
4. Open this folder on your computer and drag these in:
   - `index.html`
   - `manifest.webmanifest`
   - `sw.js`
   - `.nojekyll`
   - the whole `icons` folder
5. Click **Commit changes**.
6. Go to the repository's **Settings** → **Pages** (left sidebar).
   - Under "Build and deployment", Source = **Deploy from a branch**
   - Branch = **main**, folder = **/ (root)** → **Save**
7. Wait 1–2 minutes, then reload that page. It shows the live address:

   `https://<your-username>.github.io/flameon-audit/`

That address is the app. Send it to the auditors.

---

## What the auditors do (once each)

1. Open the link in **Chrome**.
2. Tap **📲 Install app** in the toolbar (or Chrome's ⋮ menu → "Add to Home screen").
3. From then on they open it from the **home-screen icon** — never from a WhatsApp message.

After that it behaves like a normal app, works with no signal, and every audit on that phone stays in
one place.

---

## Updating the app later

1. In the repository, click `index.html` → the pencil (Edit) → paste the new version → **Commit**.
   (Or use "Add file → Upload files" and drop the new `index.html` in to replace it.)
2. **Also edit `sw.js` and change the `CACHE` line**, e.g. `flameon-audit-v8.0.5` → `flameon-audit-v8.0.6`.

   This step is not optional. Installed phones keep serving the cached copy until that name changes,
   so skipping it means auditors silently keep running the old questionnaire.
3. Auditors get a "A newer version is ready — Reload now" banner on their next launch. Their drafts,
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
