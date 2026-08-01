# WON Member Command Center — Hosted Version

A live dashboard that reads member data from your **WON Member Sync** Google Sheet and shows
today's picture: guests to convert, new arrivals to welcome, members fading, the engagement
pie, and the Road to 1,000. One permanent URL. The sheet refreshes every morning from Circle
(via your Cowork task); this site reads the sheet on every load.

---

## The data flow

```
Circle  ->  Cowork daily task  ->  WON Member Sync (Google Sheet)  ->  this site  ->  one URL
```

The site never holds data of its own. It reads the sheet. Refresh the sheet, refresh the numbers.

---

## What's in this folder

- `index.html` — the dashboard (the whole front end).
- `api/members.js` — a tiny serverless function that reads your published sheet **server-side**,
  so the browser never hits a CORS wall.
- `README.md` — this file.

No build step, no framework, no dependencies.

---

## Deploy in 4 steps

### 1. Publish the sheet as a CSV feed
In the **WON Member Sync** Google Sheet:
- **File → Share → Publish to web**
- In the dialog, choose the **`members`** tab (not "Entire document")
- Choose **Comma-separated values (.csv)**
- Click **Publish**, confirm, and **copy the URL** it gives you.
  It looks like: `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`

> This URL is read-only and contains only the non-sensitive columns you put in the sheet
> (name, join date, activity, tags). No emails. Anyone with the URL can read it, which is why
> the sheet is deliberately limited to those fields.

### 2. Push this folder to a Git repo
Put these files in a GitHub/GitLab repo (or drag the folder into Vercel's uploader).

### 3. Import to Vercel
- New Project → import the repo.
- Framework preset: **Other** (it's a static site with a serverless function).
- Before deploying, add an **Environment Variable**:
  - **Name:** `SHEET_CSV_URL`
  - **Value:** the published CSV URL from step 1
- Deploy.

### 4. Open your URL
Vercel gives you a permanent URL (e.g. `won-command-center.vercel.app`). That's the link you
share with the team. It will not change. You can add a custom domain later in Vercel settings.

---

## How updating works

- Your **Cowork task** rewrites the sheet every morning at 7am Pacific.
- This site reads the sheet fresh on each visit (cached at the edge for ~30 min).
- The **Refresh** button in the top right re-reads the sheet on demand — it now genuinely pulls
  the latest data, because there's a real source behind it.
- **Day-counts** (windows, warmth) always compute against today's date, so they're never stale
  even between syncs.

---

## Notes & limits (honest)

- **The sheet must stay published** for the site to read it. If you ever hit "unpublish," the
  site shows a friendly error until you republish.
- **Column order matters.** The site reads by the header names in row 1
  (`id, name, joined, last_seen, posts, comments, tags, level`). Keep row 1 exactly as is.
  The Cowork task is written to preserve it.
- **Dates:** keep the `joined` and `last_seen` cells as plain text/ISO if you can. The site
  parses common formats, but odd date reformatting in Sheets is the most likely thing to confuse
  a day-count. If a member shows a weird "Day ?" , her date cell is the thing to check.
- **Profile links** aren't in this version (we kept the sheet to 8 non-sensitive fields). If you
  want "open in Circle" links later, add a `profile_url` column and I'll wire it in.
- **Notes and cleared touches** save in each person's browser (localStorage), not centrally. If
  the team needs shared notes across devices, that's a later upgrade (a second small write-back).
- **Legacy members:** apply the `Legacy Member` tag in Circle to pre-March members so they drop
  out of the active view. Until then they'll read as active.

---

## If something breaks

- **"Couldn't reach the data feed"** → the sheet isn't published, or `SHEET_CSV_URL` is wrong/missing
  in Vercel. Re-check steps 1 and 3.
- **"Waiting for the first sync"** → the site reached the sheet but it has no member rows yet.
  Run the Cowork task once and refresh.
- **Weird day counts** → check the date columns in the sheet aren't reformatted oddly.
