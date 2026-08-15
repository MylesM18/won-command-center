# WON Member Command Center, hosted version

A live dashboard that reads member data from your **WON Member Sync** Google Sheet and shows
today's picture: guests to convert, new arrivals to welcome, members fading, the engagement
pie, and the Road to 1,000. One permanent URL. The sheet refreshes every morning from Circle
via a Google Apps Script on a daily trigger; this site reads the sheet on every load.

---

## The data flow

```
Circle  ->  Apps Script (daily, 7am PT)  ->  WON Member Sync (Google Sheet)  ->  this site  ->  one URL
```

The site never holds data of its own. It reads the sheet. Refresh the sheet, refresh the numbers.

The sync itself lives in a separate Apps Script project attached to the spreadsheet
(Extensions > Apps Script from the sheet). Nothing in this repo talks to Circle.

---

## What is in this folder

- `index.html` is the dashboard, the whole front end.
- `api/members.js` is a small serverless function that reads the published sheet **server side**,
  so the browser never hits a CORS wall.
- `README.md` is this file.

No build step, no framework, no dependencies.

---

## Deploy in 4 steps

### 1. Publish the sheet as a CSV feed
In the **WON Member Sync** Google Sheet:
- **File > Share > Publish to web**
- In the dialog, choose the **`members`** tab, not "Entire document"
- Choose **Comma-separated values (.csv)**
- Click **Publish**, confirm, and **copy the URL** it gives you.
  It looks like: `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv`

> This URL is read only and contains only the non-sensitive columns in the sheet
> (name, join date, activity, tags). No emails, no phone numbers. Anyone with the URL can read
> it, which is why the sheet is deliberately limited to those eight fields.

> The `single=true&gid=` pin matters. It exposes the `members` tab only. The sync also writes a
> `sync_log` tab, and that tab is never published because new tabs are not auto-published.

### 2. Push this folder to a Git repo
Put these files in a GitHub or GitLab repo, or drag the folder into Vercel's uploader.

### 3. Import to Vercel
- New Project, import the repo.
- Framework preset: **Other**, since this is a static site with a serverless function.
- Before deploying, add an **Environment Variable**:
  - **Name:** `SHEET_CSV_URL`
  - **Value:** the published CSV URL from step 1
- Deploy.

### 4. Open your URL
Vercel gives you a permanent URL, for example `won-command-center.vercel.app`. That is the link
you share with the team. It will not change. You can add a custom domain later in Vercel settings.

---

## How updating works

- The **Apps Script sync** rewrites the sheet every morning. Google fires time based triggers
  inside a one hour window, so the 7am trigger lands somewhere between 7:00 and 8:00 Pacific.
  If you open the dashboard right at 7 you may still be looking at yesterday's numbers.
- This site reads the sheet fresh on **every** visit. The serverless function sets a 30 minute
  edge cache header, but the dashboard appends a cache busting timestamp to each request, so in
  practice every page load goes straight to Google. That is fine at this volume.
- The **Refresh** button in the top right re-reads the sheet on demand.
- **Day counts** (windows, warmth) always compute against today's date, so they are never stale
  even between syncs.

---

## Notes and limits, honest

- **The sheet must stay published** for the site to read it. If you ever hit unpublish, the
  site shows a friendly error until you republish.
- **Row 1 must stay exactly as it is.** The site reads by header name, not by column position,
  so it needs `id, name, joined, last_seen, posts, comments, tags, level` intact. The Apps
  Script checks row 1 before every run and refuses to write if it does not match, so a broken
  header fails loudly rather than corrupting the sheet.
- **Dates are guaranteed text.** The sync writes with `valueInputOption: RAW` and verifies after
  every run that the `joined` and `last_seen` columns are still text rather than Google dates.
  If a member ever shows a weird "Day ?", her date cell is still the first thing to check, but
  this should no longer happen on its own.
- **Profile links** are not in this version, since the sheet is deliberately limited to eight
  non-sensitive fields. Adding a `profile_url` column would mean changing the sync's column
  contract, which the dashboard reads by position downstream of the header lookup.
- **Notes and cleared touches** save in each person's browser (localStorage), not centrally. If
  the team needs shared notes across devices, that is a later upgrade.
- **Legacy members are hidden from every panel.** Anyone tagged `Legacy Member` in Circle is
  filtered out of the active view. As of the last check that is 85 of 153 members, and 15 of
  those were seen within 30 days, including all four Directors and both Team accounts. So
  "Active members" currently means active members excluding leadership. If that is not what you
  want, the rule to change is `activeMembers()` in `index.html`.

---

## If something breaks

- **"Couldn't reach the data feed"** means the sheet is not published, or `SHEET_CSV_URL` is
  wrong or missing in Vercel. Re-check steps 1 and 3.
- **"Waiting for the first sync"** means the site reached the sheet but found no member rows.
  Open the Apps Script project and run `syncMembers` by hand.
- **Numbers look stale or wrong** means the sync is the place to look, not this site. Check the
  `sync_log` tab in the spreadsheet for the last run's status and row count. The sync emails
  natalieamagee@gmail.com on any failure, so also check that inbox.
- **The sync refused to run** is by design in two cases: the pull came back under 50 members, or
  it came back under 70 percent of what was already in the sheet. Both leave the sheet untouched
  and send an email. If the drop is real, run `syncMembers` manually to accept it.
- **Weird day counts** means checking the date columns in the sheet for reformatting.
