// Serverless function: fetches the published Google Sheet CSV server-side
// and returns it to the dashboard. Reading server-side avoids browser CORS issues.
//
// Set the environment variable SHEET_CSV_URL in Vercel to your sheet's
// "Publish to web -> CSV" link. See README for how to get it.

export default async function handler(req, res) {
  const CSV_URL = process.env.SHEET_CSV_URL;

  if (!CSV_URL) {
    res.status(500).json({
      error: "SHEET_CSV_URL is not set. Add it in Vercel > Settings > Environment Variables."
    });
    return;
  }

  try {
    const upstream = await fetch(CSV_URL, { redirect: "follow" });
    if (!upstream.ok) {
      res.status(502).json({ error: "Could not read the sheet feed (" + upstream.status + "). Is it published to web as CSV?" });
      return;
    }
    const csv = await upstream.text();
    // cache at the edge for 30 min so we are not hammering Google on every visit
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(csv);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
