// Tracks per-device "last seen" counts so we can show "new since your last
// visit" badges (V5) without any database changes. Stored in localStorage,
// namespaced by studio + a key, so different studios/devices stay separate.

const key = (studioId, name) => `bf-seen:${studioId || "x"}:${name}`;

export function getSeen(studioId, name) {
  try { return Number(localStorage.getItem(key(studioId, name)) || 0); }
  catch { return 0; }
}

export function setSeen(studioId, name, value) {
  try { localStorage.setItem(key(studioId, name), String(value)); }
  catch { /* ignore (private mode / disabled storage) */ }
}
