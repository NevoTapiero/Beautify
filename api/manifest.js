// Serves a real, independently-fetchable manifest per studio, at a stable
// URL (/api/manifest?slug=<slug>) — NOT a client-side blob: URL.
//
// This matters specifically for Android: installing a PWA mints a WebAPK,
// and that minting process fetches the manifest from its own servers to
// verify/repackage it. A blob: URL only exists inside the tab that created
// it, so Android couldn't independently read a per-studio manifest — it
// fell back to treating every studio's install as "the same app", so
// installing a second studio silently overwrote the first one's home-screen
// icon instead of creating a separate one.

function fallbackIcon(name, color) {
  const letter = (name || "B").trim().charAt(0).toUpperCase() || "B";
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>` +
    `<rect width='512' height='512' rx='112' fill='${color || "#7C2A53"}'/>` +
    `<text x='256' y='350' font-size='280' fill='white' text-anchor='middle' ` +
    `font-family='Georgia,serif'>${letter}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

export default async function handler(req, res) {
  const raw = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const slug = String(raw || "demo").toLowerCase().replace(/[^a-z0-9-]/g, "") || "demo";

  const supaUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  let studio = null;
  if (supaUrl && anonKey) {
    try {
      const r = await fetch(
        `${supaUrl}/rest/v1/studios?slug=eq.${encodeURIComponent(slug)}&select=name,brand_name,logo_url,color_primary`,
        { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
      );
      const rows = await r.json();
      studio = Array.isArray(rows) ? rows[0] : null;
    } catch { /* fall through to defaults below */ }
  }

  const appName = studio?.brand_name || studio?.name || "Beautify";
  const color = (studio?.color_primary || "").trim() || "#7C2A53";
  const icon = studio?.logo_url || fallbackIcon(studio?.name, color);

  const manifest = {
    id: `/${slug}`,
    name: appName,
    short_name: appName,
    start_url: `/${slug}`,
    scope: `/${slug}`,
    display: "standalone",
    orientation: "portrait",
    lang: "he",
    dir: "rtl",
    background_color: "#FBEFEA",
    theme_color: color,
    icons: [
      { src: icon, sizes: "192x192", purpose: "any" },
      { src: icon, sizes: "512x512", purpose: "any" },
    ],
  };

  res.setHeader("Content-Type", "application/manifest+json");
  res.setHeader("Cache-Control", "public, max-age=300, must-revalidate");
  res.status(200).json(manifest);
}
