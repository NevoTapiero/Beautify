// Makes the app installable as *each beautician's own* home-screen app.
// One codebase, but the manifest (name, icon, colors, start link) is built at
// runtime from the studio loaded by her link, so the installed icon is hers.

import { resolveStudioSlug } from "./api";

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
//
// The manifest itself is NOT built here — it links to /api/manifest?slug=…,
// a real serverless endpoint (see api/manifest.js). It used to be an
// in-memory Blob URL, which broke Android installs: minting a WebAPK
// requires Google's servers to independently fetch the manifest, and a
// blob: URL only exists inside the tab that created it — so Android
// couldn't tell two studios' installs apart and collapsed them into one
// (installing the second studio silently overwrote the first one's icon).
export function applyStudioPWA(studio) {
  if (!studio) return;
  const slug = resolveStudioSlug();
  const color = (studio.color_primary || "").trim() || "#7C2A53";
  const icon = studio.logo_url || "/icon-mark.png";

  const appName = studio.brand_name || studio.name || "Beautify";
  document.title = appName;

  upsertLink("manifest", `/api/manifest?slug=${encodeURIComponent(slug)}`);

  upsertMeta("theme-color", color);
  upsertMeta("apple-mobile-web-app-capable", "yes");
  upsertMeta("apple-mobile-web-app-status-bar-style", "default");
  upsertMeta("apple-mobile-web-app-title", appName);
  upsertLink("apple-touch-icon", icon);
  upsertLink("icon", icon);
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
