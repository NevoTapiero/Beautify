// Makes the app installable as *each beautician's own* home-screen app.
// One codebase, but the manifest (name, icon, colors, start link) is built at
// runtime from the studio loaded by her link, so the installed icon is hers.

import { resolveStudioSlug } from "./api";

// A branded fallback icon (rounded square in her wine color + her initial),
// used when the studio has no uploaded logo. Returned as an SVG data URI.
function fallbackIcon(name, color) {
  const letter = (name || "B").trim().charAt(0).toUpperCase() || "B";
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>` +
    `<rect width='512' height='512' rx='112' fill='${color || "#7C2A53"}'/>` +
    `<text x='256' y='350' font-size='280' fill='white' text-anchor='middle' ` +
    `font-family='Georgia,serif'>${letter}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function upsertLink(rel, href, attrs = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
  el.href = href;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function upsertMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.name = name; document.head.appendChild(el); }
  el.content = content;
}

// Rebuild the page's identity (title, manifest, icons, theme) for this studio.
export function applyStudioPWA(studio) {
  if (!studio) return;
  const slug = resolveStudioSlug();
  const startUrl = `/${slug}`;
  const color = studio.color_primary || "#7C2A53";
  const icon = studio.logo_url || fallbackIcon(studio.name, color);
  const iconType = studio.logo_url ? undefined : "image/svg+xml";

  document.title = studio.name || "Beautify";

  const manifest = {
    // An explicit id (defaults to start_url per spec, but set it anyway) is
    // what lets the OS tell two studios' installed apps apart on one origin.
    id: startUrl,
    name: studio.name || "Beautify",
    short_name: studio.name || "Beautify",
    start_url: startUrl,
    scope: startUrl,
    display: "standalone",
    orientation: "portrait",
    lang: "he",
    dir: "rtl",
    background_color: "#FBEFEA",
    theme_color: color,
    icons: [
      { src: icon, sizes: "192x192", ...(iconType && { type: iconType }), purpose: "any" },
      { src: icon, sizes: "512x512", ...(iconType && { type: iconType }), purpose: "any maskable" },
    ],
  };

  // A manifest must be reachable by URL, so serve it from an in-memory Blob.
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" });
  const url = URL.createObjectURL(blob);
  const existing = document.querySelector('link[rel="manifest"]');
  if (existing?.dataset.blob) URL.revokeObjectURL(existing.href);
  const link = upsertLink("manifest", url);
  link.dataset.blob = "1";

  upsertMeta("theme-color", color);
  upsertMeta("apple-mobile-web-app-capable", "yes");
  upsertMeta("apple-mobile-web-app-status-bar-style", "default");
  upsertMeta("apple-mobile-web-app-title", studio.name || "Beautify");
  upsertLink("apple-touch-icon", icon);
  upsertLink("icon", icon, iconType ? { type: iconType } : {});
}

// Register the service worker (installability + offline shell + auto-update).
// Scoped to this studio's own path (not the site root) so each beautician's
// installed app is a genuinely separate OS-level app — a shared root scope
// meant Android treated every studio as the same installed app and just
// renamed/re-iconed it to whichever studio page you opened last.
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    const scope = `/${resolveStudioSlug()}`;
    navigator.serviceWorker.register("/sw.js", { scope }).then((reg) => {
      // Pull the newest worker right away so beauticians always get the latest
      // version without manually clearing anything.
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) {
            w.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch((err) => console.error("[Beautify] SW register failed:", err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
