import { supabase, isSupabaseReady } from "./supabase";

export const STUDIO_SLUG = "demo";

// ─── Auth ────────────────────────────────────────────────────────────────────

// Called once on app start. Gives the visitor a real (anonymous) identity so
// RLS policies can verify them. Returns the Supabase user object or null.
export async function ensureAnonSession() {
  if (!isSupabaseReady) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.user;
  } catch (err) {
    console.error("[Beautify] ensureAnonSession failed:", err);
    return null;
  }
}

// ─── Studio + services ───────────────────────────────────────────────────────

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

// ─── Clients ─────────────────────────────────────────────────────────────────

// Creates a client row linked to the current anonymous user.
// Returns the new client's DB id, or null on failure.
export async function registerClient(studioId, { name, phone, email }) {
  if (!isSupabaseReady) return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("clients")
      .insert({
        studio_id: studioId,
        auth_user_id: user?.id,
        name,
        phone,
        email,
        health_signed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error("[Beautify] registerClient failed:", err);
    return null;
  }
}

// ─── Appointments ─────────────────────────────────────────────────────────────

// Converts the UI's (dayOffset, "HH:MM") into a real UTC timestamp.
function toTimestamp(dayOffset, timeStr) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// Writes one appointment row. Returns the new row id or null.
export async function saveAppointment(studioId, clientId, serviceId, dayOffset, timeStr, paid) {
  if (!isSupabaseReady) return null;
  try {
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        studio_id: studioId,
        client_id: clientId,
        service_id: serviceId,
        starts_at: toTimestamp(dayOffset, timeStr),
        status: "confirmed",
        paid,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error("[Beautify] saveAppointment failed:", err);
    return null;
  }
}

// Loads all upcoming appointments for the current client from the DB.
export async function loadMyAppointments(clientId) {
  if (!isSupabaseReady || !clientId) return null;
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, services(name, duration, price, gradient)")
      .eq("client_id", clientId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at");
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("[Beautify] loadMyAppointments failed:", err);
    return null;
  }
}
