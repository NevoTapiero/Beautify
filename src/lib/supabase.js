import { createClient } from "@supabase/supabase-js";

// Read config from the .env file (Vite exposes only vars prefixed with VITE_).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseReady = Boolean(url && anonKey);

// Two independent auth sessions in the same browser: one for the manager,
// one for the client. This lets the demo stay "logged in" as both at once
// (manager view + client view) without one signing the other out.
// detectSessionInUrl is off on both — with two client instances sharing one
// tab, both would otherwise race to consume the same password-recovery URL
// fragment. Password-reset links are handled manually instead (see
// resolvePendingRecovery in lib/api.js), which picks exactly one instance
// based on a `reset=client|manager` query param we control ourselves.
function make(storageKey) {
  if (!isSupabaseReady) return null;
  return createClient(url, anonKey, {
    auth: { storageKey, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
}

export const supabaseClient  = make("bf-client");
export const supabaseManager = make("bf-manager");

// Default client (used for public reads + client-side operations).
export const supabase = supabaseClient;

if (!isSupabaseReady && typeof window !== "undefined") {
  console.info(
    "[Beautify] Supabase not configured — add VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_ANON_KEY to .env to connect."
  );
}
