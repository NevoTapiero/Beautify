// One-off: fills all 4 studios with identical showcase content for filming a
// commercial video — same workers, gallery images, customers, and a full
// appointment layout. Idempotent: re-running replaces the seeded content
// without touching real clients, managers, or studio branding.
//
//   node scripts/seed-showcase.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] = m[2].trim();
}
const url = readFileSync(new URL("../.env", import.meta.url), "utf8").match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SLUGS = ["demo", "tamar-nails", "noga-nails", "talia-nails"];
const IMG = (id, w = 600) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const WORKERS = [
  { name: "מאיה כהן", title: "מניקוריסטית בכירה", color: "#D9738F", avatar_url: IMG(17909398), about: "5 שנות ניסיון בבניית ציפורניים ועיצוב אקססורי.", sort_order: 0 },
  { name: "שירה לוי", title: "מומחית פדיקור ספא", color: "#9A4E72", avatar_url: IMG(5128190), about: "מתמחה בטיפולי ספא לרגליים ועיצוב ציפורניים עדין.", sort_order: 1 },
];
const SERVICES = [
  { name: "מניקור ג'ל", duration: 60, price: 130, gradient: "linear-gradient(135deg,#D9738F,#F4C9D4)", image_url: IMG(3997381), sort_order: 0 },
  { name: "בניית ציפורניים", duration: 90, price: 180, gradient: "linear-gradient(135deg,#7C2A53,#D9738F)", image_url: IMG(9099607), sort_order: 1 },
  { name: "פדיקור ספא", duration: 75, price: 150, gradient: "linear-gradient(135deg,#5E1F40,#9A4E72)", image_url: IMG(17056222), sort_order: 2 },
];
const GALLERY = [
  { id: 34835286, cap: "לק ג'ל עם נצנצים", by: "maya" },
  { id: 13038494, cap: "מניקור צרפתי קלאסי", by: "maya" },
  { id: 7066298, cap: "עיצוב ציפורניים צבעוני", by: "shira" },
  { id: 34997574, cap: "מניקור צרפתי עדין", by: "shira" },
  { id: 34885842, cap: "עיצוב פרחוני ורוד", by: "owner" },
  { id: 5240677, cap: "אמנות ציפורניים", by: "maya" },
  { id: 3997391, cap: "לק אדום קלאסי", by: "shira" },
  { id: 6524165, cap: "עיצוב לאירוע", by: "owner" },
];
const CUSTOMERS = [
  "נועה כהן", "מיכל לוי", "שירה אברהם", "תמר ביטון", "יעל פרץ", "רותם דהן",
  "אור מזרחי", "ליאור אזולאי", "הדר גבאי", "ספיר אוחיון", "אבישג חדד", "דנה שרון",
].map((name, i) => ({ name, phone: "050-300" + String(1001 + i), email: `showcase${i + 1}@beautify.demo` }));
const CUST_PHONES = CUSTOMERS.map((c) => c.phone);

// Appointment layouts (relative to today). t = "HH:MM", cos = owner|maya|shira, svc = service index.
const DAY = [
  { cos: "owner", t: "10:00", svc: 0 }, { cos: "owner", t: "13:30", svc: 2 },
  { cos: "maya", t: "09:30", svc: 1 }, { cos: "maya", t: "12:00", svc: 0 }, { cos: "maya", t: "15:00", svc: 2 },
  { cos: "shira", t: "11:00", svc: 2 }, { cos: "shira", t: "14:30", svc: 0 }, { cos: "shira", t: "16:30", svc: 1 },
];
const PAST_DAY = [
  { cos: "owner", t: "10:30", svc: 0 }, { cos: "maya", t: "11:30", svc: 1 },
  { cos: "shira", t: "13:00", svc: 2 }, { cos: "maya", t: "15:30", svc: 0 },
];

const at = (offset, hhmm) => { const [h, m] = hhmm.split(":").map(Number); const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); d.setHours(h, m, 0, 0); return d.toISOString(); };
const weekdayOf = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.getDay(); };

async function seedStudio(studio) {
  const sid = studio.id;

  // 1) Workers — reuse if present, else insert. Map name -> id.
  const empId = {};
  const { data: existingEmp } = await db.from("employees").select("id,name").eq("studio_id", sid);
  for (const w of WORKERS) {
    let row = (existingEmp || []).find((e) => e.name === w.name);
    if (!row) { const { data } = await db.from("employees").insert({ studio_id: sid, active: true, ...w }).select("id").single(); row = data; }
    empId[w.name] = row.id;
  }
  const cosId = { owner: null, maya: empId["מאיה כהן"], shira: empId["שירה לוי"] };

  // 2) Work hours: owner + each worker, Sun–Thu 09–19, Fri 09–14, Sat closed. Don't clobber existing.
  const hoursRows = [];
  for (const eId of [null, cosId.maya, cosId.shira]) {
    for (let wd = 0; wd <= 6; wd++) {
      hoursRows.push({ studio_id: sid, weekday: wd, employee_id: eId,
        is_open: wd !== 6, start_time: wd === 5 ? "09:00" : "09:00", end_time: wd === 5 ? "14:00" : "19:00" });
    }
  }
  await db.from("work_hours").upsert(hoursRows, { onConflict: "studio_id,weekday,employee_id", ignoreDuplicates: true });

  // 3) Services — reuse the active canonical ones, else insert. Collect 3 ids.
  const svcId = [];
  const { data: existingSvc } = await db.from("services").select("id,name,active").eq("studio_id", sid);
  for (const s of SERVICES) {
    let row = (existingSvc || []).find((x) => x.name === s.name && x.active);
    if (!row) { const { data } = await db.from("services").insert({ studio_id: sid, active: true, ...s }).select("id").single(); row = data; }
    svcId.push(row.id);
  }

  // 4) Gallery — wipe + insert the 8 canonical photos (approved).
  await db.from("gallery").delete().eq("studio_id", sid);
  await db.from("gallery").insert(GALLERY.map((g) => ({
    studio_id: sid, image_url: IMG(g.id, 800), caption: g.cap, status: "approved",
    uploaded_by: g.by === "maya" ? "מאיה כהן" : g.by === "shira" ? "שירה לוי" : studio.name,
    employee_id: g.by === "maya" ? cosId.maya : g.by === "shira" ? cosId.shira : null,
  })));

  // 5) Appointments — wipe all, then rebuild the layout. (Before deleting clients, since appts reference them.)
  await db.from("appointments").delete().eq("studio_id", sid);

  // 6) Customers — remove any from a previous run of this seed, then insert 12 fresh.
  await db.from("clients").delete().eq("studio_id", sid).in("phone", CUST_PHONES);
  const { data: clients } = await db.from("clients").insert(CUSTOMERS.map((c) => ({
    studio_id: sid, name: c.name, phone: c.phone, email: c.email, health_signed_at: new Date().toISOString(),
  }))).select("id");
  const custIds = clients.map((c) => c.id);

  // 7) Build appointments.
  let ci = 0;
  const nextCust = () => custIds[ci++ % custIds.length];
  const appts = [];
  // Upcoming: today .. +7 days (skip Saturdays).
  for (let off = 0; off <= 7; off++) {
    if (weekdayOf(off) === 6) continue;
    DAY.forEach((a, k) => {
      appts.push({
        studio_id: sid, client_id: nextCust(), service_id: svcId[a.svc], employee_id: cosId[a.cos],
        starts_at: at(off, a.t), status: "confirmed",
        paid: (k % 3 === 0), arrival_confirmed: off <= 1 && k % 2 === 0,
      });
    });
  }
  // Past two weeks (for the weekly reports): completed, mostly paid.
  for (let off = -13; off <= -8; off++) {
    if (weekdayOf(off) === 6) continue;
    PAST_DAY.forEach((a, k) => {
      appts.push({
        studio_id: sid, client_id: nextCust(), service_id: svcId[a.svc], employee_id: cosId[a.cos],
        starts_at: at(off, a.t), status: k === 3 ? "no_show" : "completed",
        paid: k !== 3, arrival_confirmed: true,
      });
    });
  }
  await db.from("appointments").insert(appts);

  // 8) Ensure business mode.
  await db.from("studios").update({ business_mode: true }).eq("id", sid);

  return { workers: WORKERS.length, services: svcId.length, gallery: GALLERY.length, customers: custIds.length, appointments: appts.length };
}

const { data: studios } = await db.from("studios").select("id,slug,name");
for (const slug of SLUGS) {
  const studio = studios.find((s) => s.slug === slug);
  if (!studio) { console.log(`${slug}: MISSING — skipped`); continue; }
  const r = await seedStudio(studio);
  console.log(`${slug.padEnd(13)} | workers:${r.workers} services:${r.services} gallery:${r.gallery} customers:${r.customers} appointments:${r.appointments}`);
}
console.log("Done.");
