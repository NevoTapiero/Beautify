// Derives the full app color theme from a studio's two Supabase-set colors
// (color_primary, color_accent). Everything else — the darker shade for
// headers, the soft tint for chips/hovers, the background tint, and a safe
// text color for gradient buttons — is computed so any color pair a studio
// picks stays legible instead of needing a designer to hand-tune six values.

function hexToRgb(hex) {
  const h = (hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (full.length !== 6 || Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s; const l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  if (s === 0) { const v = l * 255; return { r: v, g: v, b: v }; }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return { r: hue2rgb(p, q, h + 1 / 3) * 255, g: hue2rgb(p, q, h) * 255, b: hue2rgb(p, q, h - 1 / 3) * 255 };
}

// WCAG relative luminance — used to pick a readable text color automatically.
function relativeLuminance({ r, g, b }) {
  const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function withLightness(hex, targetL) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  return rgbToHex(hslToRgb({ ...hsl, l: targetL }));
}

function darken(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  return rgbToHex(hslToRgb({ ...hsl, l: Math.max(0, hsl.l - amount) }));
}

function lighten(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb);
  return rgbToHex(hslToRgb({ ...hsl, l: Math.min(1, hsl.l + amount) }));
}

const DEFAULT_PRIMARY = "#7C2A53";
const DEFAULT_ACCENT = "#D9738F";

// Builds the CSS custom-property overrides for a studio's theme. Falls back
// to Beautify's own default palette if a studio hasn't set colors (or set an
// invalid value), so every existing studio looks exactly as it does today.
export function buildThemeVars(studio) {
  const primary = hexToRgb(studio?.color_primary) ? studio.color_primary : DEFAULT_PRIMARY;
  const accent = hexToRgb(studio?.color_accent) ? studio.color_accent : DEFAULT_ACCENT;

  const plumDeep = darken(primary, 0.12);
  const roseSoft = withLightness(accent, 0.85);
  const blush = withLightness(accent, 0.955);

  // Gradient/solid surfaces built from the primary color need readable text.
  // Default white; switch to the app's ink color if the primary is too light
  // for white text to stay legible (covers a studio picking a pastel color).
  const btnInk = relativeLuminance(hexToRgb(primary)) > 0.5 ? "#2A1A2E" : "#ffffff";

  return {
    "--plum": primary,
    "--plum-deep": plumDeep,
    "--rose": accent,
    "--rose-soft": roseSoft,
    "--blush": blush,
    "--btn-ink": btnInk,
  };
}
