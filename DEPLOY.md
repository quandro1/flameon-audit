# Deploying the Flame On audit app

Two pieces, done in this order:

1. **Head office receiver** — a Google Sheet that collects every completed audit. (~10 min, once)
2. **The app itself** — published on GitHub Pages, installed by auditors from one link. (~10 min, once)

You only ever do this once. After that, updating the app is three commands (§4).

---

## 1. Head office receiver (Google Sheet + Apps Script)

1. Go to [sheets.new](https://sheets.new) and name the sheet **Flame On — Audit submissions**.
   Do not add any tabs or headers — the script builds them itself.
2. **Extensions → Apps Script**. Delete the sample `function myFunction() {}`.
3. Open `apps-script/Code.gs` from this folder, copy **all** of it, paste it in, and save (Ctrl+S).
4. Near the top, change the token to a phrase of your own:

   ```js
   var SHARED_TOKEN = 'CHANGE-ME';        →   var SHARED_TOKEN = 'flameon-2026-abbottabad';
   ```

   Write this phrase down — the app needs the identical text in step 3 below.
5. **Deploy → New deployment**. Click the gear next to "Select type" and pick **Web app**.
   - Description: `audit receiver v1`
   - **Execute as: Me**
   - **Who has access: Anyone** ← must be *Anyone*, not "Anyone with Google account". Auditors are not signed in.
6. Click **Deploy**, then **Authorize access** and allow it (it needs Sheets + Drive to file the audits).
   Google will warn that the app "isn't verified" — this is your own script; choose
   **Advanced → Go to Flame On — Audit submissions (unsafe)** and continue.
7. Copy the **Web app URL**. It ends in **`/exec`**.

   > There is also a `/dev` URL. It only works while *you* are signed in as the owner — an auditor
   > using it gets a login page instead of a submission. Always use `/exec`.

Paste the `/exec` URL into a browser now. You should see
`{"ok":true,"msg":"Flame On audit receiver is live"...}`. If you see anything else, redo step 5.

---

## 2. Publish the app on GitHub Pages

1. Create a GitHub account if you don't have one, then create a **new, public** repository named
   `flameon-audit`. Do not add a README — the repo already has one.
2. From this folder, push it:

   ```bash
   cd "C:/Users/huzaifa/Downloads/flameon-audit-app"
   git remote add origin https://github.com/YOUR-USERNAME/flameon-audit.git
   git branch -M main
   git push -u origin main
   ```

3. In the repo on github.com: **Settings → Pages**. Under "Build and deployment", set
   **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and Save.
4. Wait ~1 minute. Your link is:

   ```
   https://YOUR-USERNAME.github.io/flameon-audit/
   ```

That link is what you send to auditors. It works on any phone, no Google account, no app store.

> **Public repo, public link.** Anyone with the URL can open the app. That is fine — it ships with
> no data in it. What it does *not* contain: audits, photos, the admin password, or your sheet.
> The one thing that does travel in it is the submission token (step 3), which only permits
> *appending* audits. Do not commit real audit data or the admin password to this repo.

---

## 3. Point the app at your sheet

**The easy way — every auditor configured automatically.** Before pushing (or edit and push again),
open `index.html` and fill in the two lines near the top of the script (search for `SUBMIT_URL`):

```js
var SUBMIT_URL="https://script.google.com/macros/s/AKfy…/exec";
var SUBMIT_TOKEN="flameon-2026-abbottabad";
```

Every auditor who installs the app is then already pointed at head office, with nothing to type.

**The per-device way.** Leave those blank and instead, on each device: **Admin → Head-office
submission** → paste link + token → **Save** → **⇄ Test connection**. Use this if you would rather
the endpoint never appear in a public repo.

Either way, hit **⇄ Test connection** once. It should say `✓ Connected`.

---

## 4. Sending an update later

Change `index.html`, then — **this step is not optional** —

```bash
# 1. bump the cache name in sw.js, e.g. v8.1.0 → v8.1.1
# 2.
git add -A && git commit -m "questionnaire update" && git push
```

Installed apps keep serving their cached copy until **`CACHE` in `sw.js` changes**. If you skip the
bump, auditors keep running the old questionnaire and you will not find out until the scores look
wrong. Change it every single time.

Auditors get the new version the next time they open the app with a signal, and see a
"newer version is ready — Reload now" banner if they had it open. Their drafts, completed audits
and photos survive updates untouched.

If you edit `apps-script/Code.gs`, re-deploy it as **Deploy → Manage deployments → pencil icon →
Version: New version → Deploy**. Creating a *new deployment* instead would issue a new URL and
every installed app would stop submitting.

---

## 5. What to send the auditors

> **Flame On audit app**
>
> Open this link on your phone: `https://YOUR-USERNAME.github.io/flameon-audit/`
>
> **Android/Chrome:** tap the ⋮ menu → *Add to Home screen* → *Install*.
> **iPhone/Safari:** tap the Share button → *Add to Home Screen*.
>
> A Flame On icon appears on your home screen. Open the audit from that icon from now on.
>
> It works with no internet — do the whole audit offline if the branch has no signal. Completed
> audits send themselves to head office as soon as you have a connection. The ⇪ button at the top
> shows anything still waiting.
>
> Your audits are stored on your own phone until they are sent, so **do not clear your browser
> data**, and do not uninstall the app with audits still waiting.

---

## Troubleshooting

| What you see | What it means |
|---|---|
| `✗ head office replied 401/403` | Deployment access is not **Anyone**. Redo §1 step 5. |
| `✗ unexpected reply — check the Apps Script is deployed…` | You used the `/dev` URL, or the deployment was never authorized. |
| `✗ token does not match head office` | The token in the app and in `Code.gs` differ. They are case-sensitive. |
| `⚠ not sent — upload timed out` | Slow link with photos attached. It retries by itself; or Admin → uncheck *Include evidence photos*. |
| The ⇪ button shows a number that never clears | The device has no path to the endpoint at all. Use **⛃ Backup** and send the file, then investigate. |
| Auditor sees an old questionnaire | You pushed without bumping `CACHE` in `sw.js`. Bump it and push again. |
| No install prompt on Android | The page must be opened over `https://` (GitHub Pages always is) and visited once before Chrome offers it. |
