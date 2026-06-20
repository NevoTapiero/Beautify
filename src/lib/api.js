import { supabase, isSupabaseReady } from "./supabase";

// The pilot runs on a single studio. Later this comes from the URL/subdomain
// (e.g. dana.beautify.co.il → slug "dana").
export const STUDIO_SLUG = "demo";

// Loads the studio's branding + active services from Supabase.
// Returns null if Supabase isn't configured or the call fails, so the app
// can fall back to in-memory demo data without crashing.
export async function loadStudioBundle() {
  if (!isSupabaseReady) return null;
  try {
    const { data: studio, error: e1 } = await supabase
      .from("studios")
      .select("*")
      .eq("slug", STUDIO_SLUG)
      .single();
    if (e1 || !studio) throw e1 || new Error("studio not found");

    const { data: services, error: e2 } = await supabase
      .from("services")
      .select("*")
      .eq("studio_id", studio.id)
      .eq("active", true)
      .order("sort_order");
    if (e2) throw e2;

    return {
      studio,
      // Normalize DB columns to the shape the UI already uses.
      services: (services || []).map((s) => ({
        id: s.id,
        name: s.name,
        dur: s.duration,
        price: s.price,
        grad: s.gradient,
      })),
    };
  } catch (err) {
    console.error("[Beautify] loadStudioBundle failed:", err);
    return null;
  }
}
