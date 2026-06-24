import { supabaseClient, supabaseManager, isSupabaseReady } from "./supabase";

// Each beautician has her own link: beautify-roan.vercel.app/<her-slug>
// (e.g. /dana). The first path segment IS the studio. When the link has no
// segment (the bare domain) we fall back to the demo studio. A few reserved
// words are ignored so app routes never get mistaken for a studio name.
const RESERVED_SEGMENTS = new Set(["assets", "manifest", "sw", "favicon", "api", "index.html"]);

export function resolveStudioSlug() {
  try {
    const seg = (window.location.pathname || "/").split("/").filter(Boolean)[0];
    if (!seg) return "demo";
    const slug = decodeURIComponent(seg).toLowerCase();
    if (RESERVED_SEGMENTS.has(slug) || slug.includes(".")) return "demo";
    return slug;
  } catch { return "demo"; }
}

// Kept for backwards-compat; now resolved from the URL on each call.
export const STUDIO_SLUG = "demo";

// Returning clients log in with phone + password. Under the hood that's a
// Supabase email/password account using a synthetic address, so no SMS is
// needed yet. (SMS one-time-code comes later.)
const phoneDigits = (phone) => (phone || "").replace(/\D/g, "");
const phoneToEmail = (phone) => `${phoneDigits(phone)}@clients.beautify.app`;

const log = (where, err) => console.error(`[Beautify] ${where} failed:`, err?.message || err);

// ─── Time helpers ────────────────────────────────────────────────────────────

function toTimestamp(dayOffset, timeStr) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  const [h, m] = timeStr.split(":").map(Number);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// Shapes a DB appointment row (with joined client + service) into the UI object.
function shapeAppt(row) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(row.starts_at);
  const dayOffset = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000);
  const time = d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
  return {
    id: row.id,
    clientId: row.clients?.id ?? row.client_id,
    clientName: row.clients?.name,
    clientPhone: row.clients?.phone,
    employeeId: row.employees?.id ?? row.employee_id,
    employeeName: row.employees?.name,
    service: row.services?.id ?? row.service_id,
    serviceName: row.services?.name,
    serviceDur: row.services?.duration,
    servicePrice: row.services?.price,
    serviceGrad: row.services?.gradient,
    starts_at: row.starts_at,
    time,
    day: dayOffset,
    dayLabel: dayOffset === 0 ? "היום" : dayOffset === 1 ? "מחר" : dayOffset > 0 ? `בעוד ${dayOffset} ימים` : "עבר",
    status: row.status,
    arrival: row.arrival_confirmed,
    paid: row.paid,
    _live: true,
  };
}

// ─── Studio + services ───────────────────────────────────────────────────────

export async function loadStudioBundle() {
  if (!isSupabaseReady) return null;
  try {
    const slug = resolveStudioSlug();
    const { data: studio, error: e1 } = await supabaseClient
      .from("studios").select("*").eq("slug", slug).single();
    if (e1 || !studio) throw e1 || new Error("studio not found");

    const { data: services, error: e2 } = await supabaseClient
      .from("services").select("*").eq("studio_id", studio.id)
      .eq("active", true).order("sort_order");
    if (e2) throw e2;

    // Employees (business edition). Safe to load always — empty for private studios.
    const { data: employees } = await supabaseClient
      .from("employees").select("*").eq("studio_id", studio.id)
      .eq("active", true).order("sort_order");

    return {
      studio,
      services: (services || []).map((s) => ({
        id: s.id, name: s.name, dur: s.duration, price: s.price, grad: s.gradient, img: s.image_url,
      })),
      employees: (employees || []).map((e) => ({
        id: e.id, name: e.name, title: e.title, color: e.color,
      })),
    };
  } catch (err) { log("loadStudioBundle", err); return null; }
}

export async function updateStudioSettings(studioId, settings) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("studios").update(settings).eq("id", studioId);
    if (error) throw error;
    return true;
  } catch (err) { log("updateStudioSettings", err); return false; }
}

// ─── Services (manager-managed, notes 20, 25) ────────────────────────────────

export async function addService(studioId, { name, duration, price, gradient, image_url, sort }) {
  if (!isSupabaseReady) return null;
  try {
    const { data, error } = await supabaseManager.from("services")
      .insert({ studio_id: studioId, name, duration, price, gradient, image_url: image_url || null, sort_order: sort || 0, active: true })
      .select("*").single();
    if (error) throw error;
    return data;
  } catch (err) { log("addService", err); return null; }
}

export async function updateService(id, fields) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("services").update(fields).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("updateService", err); return false; }
}

// Hard-delete; if past appointments reference it, soft-delete (hide) instead.
export async function deleteService(id) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("services").delete().eq("id", id);
    if (error) await supabaseManager.from("services").update({ active: false }).eq("id", id);
    return true;
  } catch (err) { log("deleteService", err); return false; }
}

// ─── Manager auth ────────────────────────────────────────────────────────────

export async function managerSignIn(email, password) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  const { data, error } = await supabaseManager.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  return { user: data.user };
}

export async function managerSignOut() {
  if (!isSupabaseReady) return;
  await supabaseManager.auth.signOut();
}

export async function getManagerSession() {
  if (!isSupabaseReady) return null;
  const { data } = await supabaseManager.auth.getSession();
  return data?.session?.user || null;
}

// ─── Client auth (phone + password) ──────────────────────────────────────────

// Registers a new client: creates the auth account, then the client row.
// Returns { client } or { error }.
export async function clientRegister(studioId, { name, phone, email, password }) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  try {
    // Block enforcement (note 42): refuse if this contact is blocked.
    const blocked = await isContactBlocked(studioId, { phone, email, name });
    if (blocked) return { error: "מספר/אימייל זה חסום בסטודיו. פני לסטודיו." };

    const { data: auth, error: e1 } = await supabaseClient.auth.signUp({
      email: phoneToEmail(phone), password,
    });
    if (e1) {
      if (e1.message?.includes("already")) return { error: "מספר הטלפון כבר רשום. נסי להתחבר." };
      throw e1;
    }
    const { data: client, error: e2 } = await supabaseClient
      .from("clients")
      .insert({
        studio_id: studioId, auth_user_id: auth.user?.id,
        name, phone, email, health_signed_at: new Date().toISOString(),
      })
      .select("*").single();
    if (e2) throw e2;
    return { client };
  } catch (err) { log("clientRegister", err); return { error: "ההרשמה נכשלה, נסי שוב." }; }
}

// Logs an existing client in by phone + password.
export async function clientSignIn(studioId, phone, password) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  try {
    const { data: auth, error } = await supabaseClient.auth.signInWithPassword({
      email: phoneToEmail(phone), password,
    });
    if (error) return { error: "טלפון או סיסמה שגויים." };
    const { data: client } = await supabaseClient
      .from("clients").select("*").eq("auth_user_id", auth.user.id).maybeSingle();
    if (!client) return { error: "לא נמצא פרופיל ללקוחה זו." };
    if (client.blocked) { await supabaseClient.auth.signOut(); return { error: "החשבון חסום. פני לסטודיו." }; }
    return { client };
  } catch (err) { log("clientSignIn", err); return { error: "ההתחברות נכשלה." }; }
}

export async function clientSignOut() {
  if (!isSupabaseReady) return;
  await supabaseClient.auth.signOut();
}

// Restores the client profile for an existing session (page reload).
export async function getCurrentClient() {
  if (!isSupabaseReady) return null;
  try {
    const { data } = await supabaseClient.auth.getSession();
    const uid = data?.session?.user?.id;
    if (!uid) return null;
    const { data: client } = await supabaseClient
      .from("clients").select("*").eq("auth_user_id", uid).maybeSingle();
    return client || null;
  } catch (err) { log("getCurrentClient", err); return null; }
}

export async function updateClientProfile(clientId, fields) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseClient.from("clients").update(fields).eq("id", clientId);
    if (error) throw error;
    return true;
  } catch (err) { log("updateClientProfile", err); return false; }
}

// ─── Clients (manager) ───────────────────────────────────────────────────────

export async function loadClients(studioId) {
  if (!isSupabaseReady || !studioId) return null;
  try {
    const { data, error } = await supabaseManager
      .from("clients").select("*").eq("studio_id", studioId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((c) => ({
      id: c.id, name: c.name, phone: c.phone, email: c.email,
      blocked: c.blocked, avatar: c.avatar_url,
      visits: 0, last: "—",
    }));
  } catch (err) { log("loadClients", err); return null; }
}

// A client's appointment history for the manager's client card (note 33).
export async function loadClientHistory(clientId) {
  if (!isSupabaseReady || !clientId) return [];
  try {
    const { data, error } = await supabaseManager
      .from("appointments")
      .select("id, starts_at, status, services(name, price)")
      .eq("client_id", clientId).neq("status", "cancelled")
      .order("starts_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((a) => {
      const d = new Date(a.starts_at);
      return {
        id: a.id,
        when: d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        time: d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false }),
        service: a.services?.name, price: a.services?.price,
        status: a.status, past: d <= new Date(),
      };
    });
  } catch (err) { log("loadClientHistory", err); return []; }
}

export async function setClientBlocked(clientId, blocked, useManager = true) {
  if (!isSupabaseReady) return false;
  try {
    const db = useManager ? supabaseManager : supabaseClient;
    const { error } = await db.from("clients").update({ blocked }).eq("id", clientId);
    if (error) throw error;
    return true;
  } catch (err) { log("setClientBlocked", err); return false; }
}

// Fully deletes a client — including her login account — so the phone number
// is freed for re-registration (note 31). Runs via a SECURITY DEFINER function.
export async function deleteClient(clientId) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.rpc("manager_delete_client", { p_client: clientId });
    if (error) throw error;
    return true;
  } catch (err) { log("deleteClient", err); return false; }
}

// Returns true if a blocked client with matching phone OR email exists.
// Uses a SECURITY DEFINER function so it works for not-yet-authenticated
// visitors at registration time (RLS would otherwise hide blocked rows).
export async function isContactBlocked(studioId, { phone, email }) {
  if (!isSupabaseReady) return false;
  try {
    const { data, error } = await supabaseClient.rpc("is_contact_blocked", {
      p_studio: studioId, p_phone: phone, p_email: email || "",
    });
    if (error) throw error;
    return !!data;
  } catch (err) { log("isContactBlocked", err); return false; }
}

// ─── Appointments ────────────────────────────────────────────────────────────

export async function saveAppointment(studioId, clientId, serviceId, dayOffset, timeStr, paid, employeeId) {
  if (!isSupabaseReady) return null;
  try {
    const { data, error } = await supabaseClient
      .from("appointments")
      .insert({
        studio_id: studioId, client_id: clientId, service_id: serviceId,
        starts_at: toTimestamp(dayOffset, timeStr), status: "confirmed", paid,
        employee_id: employeeId || null,
      })
      .select("*, clients(id,name,phone), services(id,name,duration,price,gradient), employees(id,name)")
      .single();
    if (error) throw error;
    return shapeAppt(data);
  } catch (err) { log("saveAppointment", err); return null; }
}

// Manager view: all non-cancelled appointments in the next 7 days.
export async function loadManagerAppointments(studioId) {
  if (!isSupabaseReady || !studioId) return null;
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    const { data, error } = await supabaseManager
      .from("appointments")
      .select("id, starts_at, status, paid, arrival_confirmed, client_id, service_id, employee_id, clients(id,name,phone), services(id,name,duration,price,gradient), employees(id,name)")
      .eq("studio_id", studioId).neq("status", "cancelled")
      .gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString())
      .order("starts_at");
    if (error) throw error;
    return (data || []).map(shapeAppt);
  } catch (err) { log("loadManagerAppointments", err); return null; }
}

// Client view: all of this client's non-cancelled appointments.
export async function loadMyAppointments(clientId) {
  if (!isSupabaseReady || !clientId) return null;
  try {
    const { data, error } = await supabaseClient
      .from("appointments")
      .select("id, starts_at, status, paid, arrival_confirmed, client_id, service_id, employee_id, clients(id,name,phone), services(id,name,duration,price,gradient), employees(id,name)")
      .eq("client_id", clientId).neq("status", "cancelled")
      .order("starts_at");
    if (error) throw error;
    return (data || []).map(shapeAppt);
  } catch (err) { log("loadMyAppointments", err); return null; }
}

// Soft-cancel: keeps the row but hides it from both sides. `useManager` picks
// which session does it (manager cancelling vs client cancelling).
export async function cancelAppointment(id, useManager = false) {
  if (!isSupabaseReady) return false;
  try {
    const db = useManager ? supabaseManager : supabaseClient;
    const { error } = await db.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("cancelAppointment", err); return false; }
}

export async function confirmArrival(id) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseClient
      .from("appointments").update({ arrival_confirmed: true }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("confirmArrival", err); return false; }
}

// Manager marks an appointment 'completed' / 'no_show' / 'reschedule_requested' (notes 38, 26-29).
export async function setAppointmentStatus(id, status) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("appointments").update({ status }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("setAppointmentStatus", err); return false; }
}

// Client moves her own appointment to a new slot (note 27) — back to confirmed.
export async function rescheduleAppointment(id, dayOffset, timeStr) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseClient.from("appointments")
      .update({ starts_at: toTimestamp(dayOffset, timeStr), status: "confirmed", arrival_confirmed: false })
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("rescheduleAppointment", err); return false; }
}

// Mark paid (note 22 — pay-later; Bit is still simulated so this just flips paid).
export async function payAppointment(id) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseClient
      .from("appointments").update({ paid: true }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("payAppointment", err); return false; }
}

// ─── Breaks (note 39) ────────────────────────────────────────────────────────

export async function loadBreaks(studioId) {
  if (!isSupabaseReady || !studioId) return null;
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(start); end.setDate(start.getDate() + 7);
    const { data, error } = await supabaseClient
      .from("breaks").select("*").eq("studio_id", studioId)
      .gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString())
      .order("starts_at");
    if (error) throw error;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return (data || []).map((b) => {
      const d = new Date(b.starts_at), e = new Date(b.ends_at);
      const day = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - today) / 86400000);
      const fmt = (x) => x.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false });
      return { id: b.id, title: b.title, day, time: fmt(d), endTime: fmt(e), starts_at: b.starts_at, _break: true };
    });
  } catch (err) { log("loadBreaks", err); return null; }
}

export async function addBreak(studioId, dayOffset, startStr, endStr, title) {
  if (!isSupabaseReady) return null;
  try {
    const { data, error } = await supabaseManager
      .from("breaks")
      .insert({ studio_id: studioId, starts_at: toTimestamp(dayOffset, startStr), ends_at: toTimestamp(dayOffset, endStr), title: title || "הפסקה" })
      .select("*").single();
    if (error) throw error;
    return data;
  } catch (err) { log("addBreak", err); return null; }
}

export async function deleteBreak(id) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("breaks").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("deleteBreak", err); return false; }
}

// ─── Working hours (notes 15, 20) ────────────────────────────────────────────

// Weekly defaults: 7 rows (weekday 0=Sun .. 6=Sat).
export async function loadWeeklyHours(studioId) {
  if (!isSupabaseReady || !studioId) return [];
  try {
    const { data, error } = await supabaseClient
      .from("work_hours").select("*").eq("studio_id", studioId).order("weekday");
    if (error) throw error;
    return data || [];
  } catch (err) { log("loadWeeklyHours", err); return []; }
}

export async function setWeeklyHours(studioId, weekday, fields) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("work_hours")
      .upsert({ studio_id: studioId, weekday, ...fields }, { onConflict: "studio_id,weekday" });
    if (error) throw error;
    return true;
  } catch (err) { log("setWeeklyHours", err); return false; }
}

// Per-date override (replaces the weekly default for one date).
export async function getDayOverride(studioId, dateStr) {
  if (!isSupabaseReady) return null;
  try {
    const { data } = await supabaseClient.from("work_overrides")
      .select("*").eq("studio_id", studioId).eq("date", dateStr).maybeSingle();
    return data || null;
  } catch (err) { log("getDayOverride", err); return null; }
}

export async function setDayOverride(studioId, dateStr, fields) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("work_overrides")
      .upsert({ studio_id: studioId, date: dateStr, ...fields }, { onConflict: "studio_id,date" });
    if (error) throw error;
    return true;
  } catch (err) { log("setDayOverride", err); return false; }
}

export async function clearDayOverride(studioId, dateStr) {
  if (!isSupabaseReady) return false;
  try {
    await supabaseManager.from("work_overrides").delete()
      .eq("studio_id", studioId).eq("date", dateStr);
    return true;
  } catch (err) { log("clearDayOverride", err); return false; }
}

// The free start-times for a service of `durationMin` on a given date —
// computed server-side from working hours minus appointments and breaks.
export async function availableSlots(studioId, dateStr, durationMin, employeeId) {
  if (!isSupabaseReady || !studioId) return [];
  try {
    const { data, error } = await supabaseClient.rpc("available_slots", {
      p_studio: studioId, p_date: dateStr, p_duration: durationMin, p_employee: employeeId || null,
    });
    if (error) throw error;
    return data || [];
  } catch (err) { log("availableSlots", err); return []; }
}

// ─── Employees + invoices (business edition) ─────────────────────────────────

export async function addEmployee(studioId, { name, title, color, sort }) {
  if (!isSupabaseReady) return null;
  try {
    const { data, error } = await supabaseManager.from("employees")
      .insert({ studio_id: studioId, name, title: title || null, color: color || "#D9738F", sort_order: sort || 0, active: true })
      .select("*").single();
    if (error) throw error;
    return data;
  } catch (err) { log("addEmployee", err); return null; }
}

export async function updateEmployee(id, fields) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("employees").update(fields).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("updateEmployee", err); return false; }
}

export async function deleteEmployee(id) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("employees").delete().eq("id", id);
    if (error) await supabaseManager.from("employees").update({ active: false }).eq("id", id);
    return true;
  } catch (err) { log("deleteEmployee", err); return false; }
}

// Issue an invoice for an appointment (sequential per studio, idempotent).
export async function issueInvoice(appointmentId) {
  if (!isSupabaseReady) return { error: "אין חיבור" };
  try {
    const { data, error } = await supabaseManager.rpc("issue_invoice", { p_appointment: appointmentId });
    if (error) throw error;
    return { invoice: data };
  } catch (err) { log("issueInvoice", err); return { error: "הפקת החשבונית נכשלה" }; }
}

export async function loadInvoices(studioId) {
  if (!isSupabaseReady || !studioId) return [];
  try {
    const { data, error } = await supabaseManager
      .from("invoices").select("*").eq("studio_id", studioId).order("number", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) { log("loadInvoices", err); return []; }
}

// ─── Standing (recurring) weekly appointments (V5 notes B + G) ───────────────

// Client requests a fixed weekly slot.
export async function requestStanding(studioId, serviceId, weekday, time) {
  if (!isSupabaseReady) return { error: "אין חיבור" };
  try {
    const { error } = await supabaseClient.rpc("request_standing", {
      p_studio: studioId, p_service: serviceId, p_weekday: weekday, p_time: time,
    });
    if (error) throw error;
    return {};
  } catch (err) {
    log("requestStanding", err);
    return { error: /already has/.test(err?.message || "") ? "כבר קיימת בקשה לתור קבוע" : "הבקשה נכשלה" };
  }
}

export async function myStanding() {
  if (!isSupabaseReady) return [];
  try {
    const { data, error } = await supabaseClient.rpc("my_standing");
    if (error) throw error;
    return data || [];
  } catch (err) { log("myStanding", err); return []; }
}

export async function managerStanding(studioId) {
  if (!isSupabaseReady || !studioId) return [];
  try {
    const { data, error } = await supabaseManager.rpc("manager_standing", { p_studio: studioId });
    if (error) throw error;
    return data || [];
  } catch (err) { log("managerStanding", err); return []; }
}

export async function approveStanding(id) {
  if (!isSupabaseReady) return false;
  try { const { error } = await supabaseManager.rpc("approve_standing", { p_id: id }); if (error) throw error; return true; }
  catch (err) { log("approveStanding", err); return false; }
}

export async function declineStanding(id) {
  if (!isSupabaseReady) return false;
  try { const { error } = await supabaseManager.rpc("decline_standing", { p_id: id }); if (error) throw error; return true; }
  catch (err) { log("declineStanding", err); return false; }
}

// Cancel works for the owning client (supabaseClient) or the manager (supabaseManager).
export async function cancelStanding(id, asManager = false) {
  if (!isSupabaseReady) return false;
  try {
    const c = asManager ? supabaseManager : supabaseClient;
    const { error } = await c.rpc("cancel_standing", { p_id: id });
    if (error) throw error; return true;
  } catch (err) { log("cancelStanding", err); return false; }
}

// Keep the rolling horizon topped up (called on manager app load).
export async function topupStanding(studioId) {
  if (!isSupabaseReady || !studioId) return;
  try { await supabaseManager.rpc("topup_standing", { p_studio: studioId }); }
  catch (err) { log("topupStanding", err); }
}

// ─── Notifications (notes 26, 37) ────────────────────────────────────────────

export async function sendNotification(studioId, clientId, { type, title, body, appointmentId }) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("notifications").insert({
      studio_id: studioId, client_id: clientId, type, title, body, appointment_id: appointmentId || null,
    });
    if (error) throw error;
    return true;
  } catch (err) { log("sendNotification", err); return false; }
}

export async function loadNotifications(clientId) {
  if (!isSupabaseReady || !clientId) return null;
  try {
    const { data, error } = await supabaseClient
      .from("notifications").select("*").eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) { log("loadNotifications", err); return null; }
}

export async function markNotificationRead(id) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseClient.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("markNotificationRead", err); return false; }
}

// ─── Gallery + photos ────────────────────────────────────────────────────────

// Uploads a file to a storage bucket and returns its public URL.
async function uploadFile(db, bucket, path, file) {
  const { error } = await db.storage.from(bucket).upload(path, file, { upsert: true, cacheControl: "3600" });
  if (error) throw error;
  return db.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

const safeName = (n) => (n || "photo").replace(/[^\w.\-]/g, "_");

// Client uploads work → lands as 'pending' for the manager to approve (note 15).
// Goes through the share_photo() SECURITY DEFINER function rather than a direct
// gallery insert: the direct path is blocked by a stale RLS plan in Supabase's
// API layer, and the function also stops a client forging another's id/status.
export async function uploadClientPhoto(studioId, client, file, caption, employeeId) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  try {
    const path = `${studioId}/${client.id}/${Date.now()}_${safeName(file.name)}`;
    const url = await uploadFile(supabaseClient, "gallery", path, file);
    const { data, error } = await supabaseClient.rpc("share_photo", {
      p_studio: studioId, p_image_url: url, p_caption: caption || "", p_employee: employeeId || null,
    });
    if (error) throw error;
    return { photo: data };
  } catch (err) { log("uploadClientPhoto", err); return { error: "העלאת התמונה נכשלה." }; }
}

// Manager uploads her own work → immediately 'approved' (note 47).
export async function uploadManagerPhoto(studioId, studioName, file, caption, employeeId) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  try {
    const path = `${studioId}/studio/${Date.now()}_${safeName(file.name)}`;
    const url = await uploadFile(supabaseManager, "gallery", path, file);
    const { data, error } = await supabaseManager.from("gallery").insert({
      studio_id: studioId, image_url: url, caption: caption || "עבודה חדשה",
      uploaded_by: studioName || "הסטודיו", status: "approved", employee_id: employeeId || null,
    }).select("*").single();
    if (error) throw error;
    return { photo: data };
  } catch (err) { log("uploadManagerPhoto", err); return { error: "העלאת התמונה נכשלה." }; }
}

// Service cover image (V6.1 note 43) → returns its public URL.
export async function uploadServiceImage(studioId, file) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  try {
    const path = `${studioId}/services/${Date.now()}_${safeName(file.name)}`;
    const url = await uploadFile(supabaseManager, "gallery", path, file);
    return { url };
  } catch (err) { log("uploadServiceImage", err); return { error: "העלאת התמונה נכשלה." }; }
}

// Client profile photo (note 9).
export async function uploadClientAvatar(clientId, file) {
  if (!isSupabaseReady) return { error: "Supabase not configured" };
  try {
    const path = `${clientId}/${Date.now()}_${safeName(file.name)}`;
    const url = await uploadFile(supabaseClient, "avatars", path, file);
    await supabaseClient.from("clients").update({ avatar_url: url }).eq("id", clientId);
    return { url };
  } catch (err) { log("uploadClientAvatar", err); return { error: "העלאת התמונה נכשלה." }; }
}

// Loads approved photos for the public gallery + like counts + liked-by-me.
export async function loadGallery(studioId, myClientId) {
  if (!isSupabaseReady || !studioId) return null;
  try {
    const { data, error } = await supabaseClient
      .from("gallery").select("*, gallery_likes(client_id)")
      .eq("studio_id", studioId).eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((g) => ({
      id: g.id, img: g.image_url, cap: g.caption, by: g.uploaded_by, created: g.created_at,
      employeeId: g.employee_id,
      likes: (g.gallery_likes || []).length,
      likedByMe: myClientId ? (g.gallery_likes || []).some((l) => l.client_id === myClientId) : false,
    }));
  } catch (err) { log("loadGallery", err); return null; }
}

// Manager: pending photos awaiting approval.
export async function loadPendingPhotos(studioId) {
  if (!isSupabaseReady || !studioId) return null;
  try {
    const { data, error } = await supabaseManager
      .from("gallery").select("*").eq("studio_id", studioId).eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((g) => ({ id: g.id, img: g.image_url, cap: g.caption, by: g.uploaded_by, employeeId: g.employee_id }));
  } catch (err) { log("loadPendingPhotos", err); return null; }
}

// Client: my uploads with their status (notes 19, 11). Uses a SECURITY DEFINER
// RPC so the client reliably sees her OWN photos at any status (pending too).
export async function loadMyUploads() {
  if (!isSupabaseReady) return null;
  try {
    const { data, error } = await supabaseClient.rpc("my_uploads");
    if (error) throw error;
    return (data || []).map((g) => ({ id: g.id, img: g.image_url, cap: g.caption, status: g.status }));
  } catch (err) { log("loadMyUploads", err); return null; }
}

export async function updatePhotoCaption(id, caption) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("gallery").update({ caption }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("updatePhotoCaption", err); return false; }
}

export async function setPhotoStatus(id, status) {
  if (!isSupabaseReady) return false;
  try {
    const { error } = await supabaseManager.from("gallery").update({ status }).eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("setPhotoStatus", err); return false; }
}

export async function deletePhoto(id, useManager = true) {
  if (!isSupabaseReady) return false;
  try {
    const db = useManager ? supabaseManager : supabaseClient;
    const { error } = await db.from("gallery").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) { log("deletePhoto", err); return false; }
}

// Toggle a like on/off for the current client (note 17). Returns new liked state.
export async function toggleLike(galleryId, clientId, currentlyLiked) {
  if (!isSupabaseReady || !clientId) return currentlyLiked;
  try {
    if (currentlyLiked) {
      await supabaseClient.from("gallery_likes").delete()
        .eq("gallery_id", galleryId).eq("client_id", clientId);
      return false;
    }
    await supabaseClient.from("gallery_likes").insert({ gallery_id: galleryId, client_id: clientId });
    return true;
  } catch (err) { log("toggleLike", err); return currentlyLiked; }
}
