import { createClient } from "@supabase/supabase-js";

// Read config from the .env file (Vite exposes only vars prefixed with VITE_).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// While the prototype still runs on in-memory demo data, the keys may be empty.
// We guard so the app keeps working until Supabase is wired in screen-by-screen.
export const isSupabaseReady = Boolean(url && anonKey);

export const supabase = isSupabaseReady
  ? createClient(url, anonKey)
  : null;

if (!isSupabaseReady && typeof window !== "undefined") {
  // Friendly heads-up in the browser console, not a crash.
  console.info(
    "[Beautify] Supabase not configured yet — running on in-memory demo data. " +
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to connect."
  );
}
