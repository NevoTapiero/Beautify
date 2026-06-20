import React, { useState, useMemo, useEffect } from "react";
import { loadStudioBundle, ensureAnonSession, registerClient, saveAppointment } from "./lib/api";
import {
  Home, CalendarDays, Users, Image as ImageIcon, Settings, Phone, Bell,
  Check, X, Plus, ChevronLeft, ChevronRight, Search, Trash2, Ban, Sparkles,
  CreditCard, ShieldCheck, Heart, CheckCircle2, Camera, Clock, User, ArrowLeft,
  MoreHorizontal, LogOut, Wallet
} from "lucide-react";

/* ============================================================
   Beautify — visual prototype
   One app, two sides (manager / client), connected by shared state.
   Book as a client → it appears on the manager's calendar.
   Upload a photo as a client → it lands in the manager's approvals.
   ============================================================ */

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Frank+Ruhl+Libre:wght@400;500;700;900&display=swap');
.bf-root *{ box-sizing:border-box; }
.bf-root{
  --ink:#2A1A2E; --plum:#7C2A53; --plum-deep:#5E1F40; --rose:#D9738F;
  --rose-soft:#F4C9D4; --blush:#FBEFEA; --sand:#EADDD4; --gold:#B4893E;
  --surface:#FFFFFF; --muted:#9A8490;
  font-family:'Assistant', system-ui, -apple-system, sans-serif;
  color:var(--ink); min-height:100vh; width:100%;
  background:
    radial-gradient(120% 75% at 100% 0%, #F7E3DC 0%, rgba(247,227,220,0) 55%),
    radial-gradient(120% 75% at 0% 100%, #F2D9E1 0%, rgba(242,217,225,0) 55%),
    #FBEFEA;
  display:flex; flex-direction:column; align-items:center;
  padding:22px 14px 40px;
}
.bf-display{ font-family:'Frank Ruhl Libre', serif; }
.bf-root :focus-visible{ outline:2px solid var(--rose); outline-offset:2px; border-radius:10px; }

.bf-mark{ width:22px; height:28px; background:linear-gradient(160deg,#ffffff,var(--rose-soft));
  border-radius:50% 50% 45% 45% / 64% 64% 36% 36%;
  box-shadow: inset 0 -7px 9px -5px rgba(124,42,83,.35); display:inline-block; flex:none; }

.bf-roleswitch{ display:inline-flex; background:#fff; border:1px solid var(--sand);
  border-radius:999px; padding:5px; gap:4px; box-shadow:0 6px 18px -12px rgba(42,26,46,.5); }
.bf-roleswitch button{ border:none; background:none; padding:9px 20px; border-radius:999px;
  font-weight:700; font-size:14px; color:var(--muted); cursor:pointer; transition:.18s; font-family:inherit; }
.bf-roleswitch button.active{ background:linear-gradient(135deg,var(--plum),var(--rose)); color:#fff;
  box-shadow:0 8px 18px -10px rgba(124,42,83,.7); }

.bf-phone{ width:392px; max-width:100%; height:792px; max-height:86vh; background:var(--blush);
  border:1px solid var(--sand); border-radius:42px; overflow:hidden; display:flex; flex-direction:column;
  position:relative; box-shadow:0 50px 90px -40px rgba(42,26,46,.55), 0 0 0 10px #ffffff, 0 0 0 11px var(--sand); }
.bf-screen{ flex:1; overflow-y:auto; }
.bf-screen::-webkit-scrollbar{ width:0; }
.bf-pad{ padding:18px 16px 26px; }

.bf-appbar{ background:linear-gradient(135deg,var(--plum-deep),var(--plum)); color:#fff;
  padding:16px 18px 16px; position:relative; overflow:hidden; flex:none; }
.bf-appbar::after{ content:''; position:absolute; inset:0 0 55% 0;
  background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,0)); pointer-events:none; }
.bf-appbar h1{ font-size:21px; margin:0; line-height:1.15; position:relative; }
.bf-appbar .sub{ font-size:12.5px; opacity:.82; margin-top:2px; position:relative; }

.bf-nav{ display:flex; background:var(--surface); border-top:1px solid var(--sand); flex:none; padding-bottom:2px; }
.bf-nav button{ flex:1; background:none; border:none; padding:9px 2px 9px; cursor:pointer;
  display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--muted);
  font-size:10.5px; font-weight:700; font-family:inherit; transition:.15s; }
.bf-nav button.active{ color:var(--plum); }
.bf-nav .ndot{ width:5px; height:5px; border-radius:50%; background:var(--plum); }

.bf-card{ background:var(--surface); border:1px solid var(--sand); border-radius:18px; }
.bf-btn{ font-family:inherit; font-weight:700; border:none; cursor:pointer; border-radius:14px;
  padding:13px 16px; font-size:15px; transition:transform .14s ease, box-shadow .2s ease; width:100%;
  display:inline-flex; align-items:center; justify-content:center; gap:7px; }
.bf-btn:active{ transform:scale(.985); }
.bf-btn-primary{ color:#fff; background:linear-gradient(135deg,var(--plum),var(--rose));
  box-shadow:0 12px 24px -12px rgba(124,42,83,.75); position:relative; overflow:hidden; }
.bf-btn-primary::after{ content:''; position:absolute; inset:0 0 52% 0;
  background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0)); pointer-events:none; }
.bf-btn-primary:disabled{ background:var(--sand); color:#fff; box-shadow:none; cursor:not-allowed; }
.bf-btn-ghost{ background:var(--surface); color:var(--plum); border:1px solid var(--sand); }
.bf-btn-soft{ background:var(--rose-soft); color:var(--plum-deep); }
.bf-btn-sm{ padding:8px 12px; font-size:13px; border-radius:11px; width:auto; }

.bf-chip{ font-size:11.5px; font-weight:700; padding:4px 10px; border-radius:999px;
  display:inline-flex; align-items:center; gap:4px; }
.bf-chip-ok{ background:#E7F3EC; color:#2E7D52; }
.bf-chip-wait{ background:#FBEFD6; color:#9A6B14; }
.bf-chip-rose{ background:var(--rose-soft); color:var(--plum-deep); }

.bf-avatar{ width:42px; height:42px; border-radius:50%; flex:none; display:flex;
  align-items:center; justify-content:center; font-weight:800; font-size:15px; color:#fff;
  background:linear-gradient(135deg,var(--plum),var(--rose)); }

.bf-input{ width:100%; background:var(--surface); border:1px solid var(--sand); border-radius:13px;
  padding:13px 14px; font-family:inherit; font-size:15px; color:var(--ink); }
.bf-input::placeholder{ color:#C2B0B8; }
.bf-input:focus{ outline:none; border-color:var(--rose); box-shadow:0 0 0 3px rgba(217,115,143,.18); }
.bf-label{ font-size:13px; font-weight:700; color:var(--muted); margin:0 2px 6px; display:block; }

.bf-tile{ aspect-ratio:1; border-radius:16px; position:relative; overflow:hidden; cursor:pointer;
  box-shadow: inset 0 -22px 30px -22px rgba(0,0,0,.4); }
.bf-tile .cap{ position:absolute; inset:auto 0 0 0; padding:8px 9px; color:#fff; font-size:11.5px;
  font-weight:700; background:linear-gradient(0deg,rgba(0,0,0,.42),rgba(0,0,0,0)); display:flex;
  align-items:center; justify-content:space-between; }
.bf-tile .glow{ position:absolute; inset:0 0 60% 0; background:linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0)); }

.bf-seg{ display:flex; background:#F3E7E0; border-radius:13px; padding:4px; gap:3px; }
.bf-seg button{ flex:1; border:none; background:none; padding:9px; border-radius:10px; cursor:pointer;
  font-family:inherit; font-weight:700; font-size:13.5px; color:var(--muted); transition:.15s; }
.bf-seg button.active{ background:#fff; color:var(--plum); box-shadow:0 4px 10px -6px rgba(42,26,46,.4); }

.bf-day{ min-width:50px; border:1px solid var(--sand); background:#fff; border-radius:14px; padding:9px 0;
  text-align:center; cursor:pointer; transition:.15s; flex:none; }
.bf-day.active{ background:linear-gradient(135deg,var(--plum),var(--rose)); border-color:transparent; color:#fff; }
.bf-day .dn{ font-size:18px; font-weight:800; line-height:1; }
.bf-day .dl{ font-size:11px; font-weight:700; opacity:.8; margin-top:3px; }

.bf-slot{ border:1px solid var(--sand); background:#fff; border-radius:12px; padding:11px 0; text-align:center;
  cursor:pointer; font-weight:700; font-size:14.5px; color:var(--ink); transition:.15s; }
.bf-slot.active{ background:var(--plum); border-color:var(--plum); color:#fff; }
.bf-slot:disabled{ color:#CFC0C7; background:#F6EFEC; cursor:not-allowed; }

.bf-modalwrap{ position:absolute; inset:0; background:rgba(42,26,46,.5); display:flex; align-items:flex-end;
  justify-content:center; z-index:40; animation:bf-fade .2s ease; }
.bf-sheet{ background:var(--surface); width:100%; border-radius:26px 26px 0 0; padding:20px 18px 22px;
  max-height:92%; overflow-y:auto; animation:bf-up .26s cubic-bezier(.2,.8,.2,1); }
@keyframes bf-up{ from{ transform:translateY(40px); opacity:.6 } to{ transform:translateY(0); opacity:1 } }
@keyframes bf-fade{ from{ opacity:0 } to{ opacity:1 } }

.bf-toast{ position:absolute; left:50%; transform:translateX(-50%); bottom:78px; z-index:60;
  background:var(--ink); color:#fff; padding:11px 16px; border-radius:13px; font-size:13.5px; font-weight:600;
  display:flex; align-items:center; gap:8px; box-shadow:0 14px 30px -12px rgba(0,0,0,.5);
  animation:bf-up .26s ease; max-width:86%; }

.bf-hint{ font-size:12.5px; color:var(--muted); margin-top:10px; text-align:center; }
@media (prefers-reduced-motion: reduce){ .bf-root *{ animation:none !important; transition:none !important; } }
`;

/* ----------------------------- mock data ----------------------------- */
const SERVICES = [
  { id: "gel",   name: "לק ג'ל",        dur: 60,  price: 120, grad: "linear-gradient(135deg,#D9738F,#F4C9D4)" },
  { id: "fill",  name: "מילוי ג'ל",     dur: 90,  price: 160, grad: "linear-gradient(135deg,#7C2A53,#D9738F)" },
  { id: "acryl", name: "בנייה באקריל",  dur: 120, price: 220, grad: "linear-gradient(135deg,#5E1F40,#9A4E72)" },
  { id: "mani",  name: "מניקור",         dur: 45,  price: 90,  grad: "linear-gradient(135deg,#C98AA6,#F0D7DF)" },
  { id: "pedi",  name: "פדיקור",         dur: 60,  price: 130, grad: "linear-gradient(135deg,#9A4E72,#E0AFC0)" },
];
// Service lookup resolves from a live index (DB services first, demo as
// fallback) so existing demo appointments and new DB-backed ones both render.
let SERVICE_INDEX = [...SERVICES];
const setServiceIndex = (list) => { SERVICE_INDEX = [...list, ...SERVICES]; };
const svc = (id) => SERVICE_INDEX.find((s) => s.id === id);

const CLIENTS0 = [
  { id: 1, name: "נועה כהן",    phone: "050-1234567", email: "noa@mail.com",   visits: 9, last: "לפני שבועיים", blocked: false },
  { id: 2, name: "שיר לוי",     phone: "052-7654321", email: "shir@mail.com",  visits: 4, last: "לפני 3 שבועות", blocked: false },
  { id: 3, name: "מאיה ביטון",  phone: "054-9988776", email: "maya@mail.com",  visits: 12, last: "לפני שבוע",    blocked: false },
  { id: 4, name: "יעל אזולאי",  phone: "053-4455667", email: "yael@mail.com",  visits: 2, last: "לפני חודש",     blocked: false },
  { id: 5, name: "רותם דהן",    phone: "058-1122334", email: "rotem@mail.com", visits: 6, last: "לפני 10 ימים",  blocked: false },
];

const APPTS0 = [
  { id: 1, clientId: 1, service: "gel",   time: "09:30", day: 0, dayLabel: "היום", status: "confirmed", arrival: true,  paid: true },
  { id: 2, clientId: 2, service: "fill",  time: "11:00", day: 0, dayLabel: "היום", status: "confirmed", arrival: false, paid: false },
  { id: 3, clientId: 3, service: "acryl", time: "13:30", day: 0, dayLabel: "היום", status: "confirmed", arrival: true,  paid: true },
  { id: 4, clientId: 4, service: "mani",  time: "16:00", day: 0, dayLabel: "היום", status: "pending",   arrival: false, paid: false },
  { id: 5, clientId: 1, service: "gel",   time: "10:30", day: 1, dayLabel: "מחר",  status: "confirmed", arrival: false, paid: false },
];
const PAST0 = [
  { id: 91, clientId: 1, service: "fill", time: "11:00", dateLabel: "12 במאי", status: "done" },
  { id: 92, clientId: 1, service: "gel",  time: "10:00", dateLabel: "21 באפריל", status: "done" },
];

const G = [
  "linear-gradient(135deg,#D9738F,#F4C9D4)", "linear-gradient(135deg,#7C2A53,#C98AA6)",
  "linear-gradient(135deg,#5E1F40,#D9738F)", "linear-gradient(135deg,#E0AFC0,#9A4E72)",
  "linear-gradient(135deg,#F4C9D4,#B4893E)", "linear-gradient(135deg,#9A4E72,#2A1A2E)",
];
const GALLERY0 = [
  { id: 1, grad: G[0], cap: "פרנץ' ורוד",   by: "הסטודיו", likes: 24 },
  { id: 2, grad: G[1], cap: "ויין מאט",      by: "הסטודיו", likes: 41 },
  { id: 3, grad: G[2], cap: "אומברה שקיעה",  by: "נועה כהן", likes: 18 },
  { id: 4, grad: G[3], cap: "נוד קלאסי",      by: "הסטודיו", likes: 33 },
  { id: 5, grad: G[4], cap: "כרום זהב",       by: "הסטודיו", likes: 57 },
  { id: 6, grad: G[5], cap: "חתול שחור",      by: "מאיה ביטון", likes: 29 },
];
const PENDING0 = [
  { id: 101, grad: G[2], cap: "אומברה ורוד", by: "שיר לוי" },
  { id: 102, grad: G[4], cap: "גליטר חגיגי",  by: "רותם דהן" },
];

const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

const DOW = ["א","ב","ג","ד","ה","ו","ש"];
const next7 = () => {
  const out = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(now.getDate() + i);
    out.push({ offset: i, dn: d.getDate(), dl: i === 0 ? "היום" : i === 1 ? "מחר" : DOW[d.getDay()] });
  }
  return out;
};
const TIMES = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

/* ----------------------------- small UI bits ----------------------------- */
function Avatar({ name }) { return <div className="bf-avatar">{initials(name)}</div>; }
function StatusChip({ a }) {
  if (a.status === "pending") return <span className="bf-chip bf-chip-wait"><Clock size={12} /> ממתין לאישורך</span>;
  if (a.arrival) return <span className="bf-chip bf-chip-ok"><CheckCircle2 size={12} /> אישרה הגעה</span>;
  return <span className="bf-chip bf-chip-rose"><Bell size={12} /> טרם אישרה</span>;
}
function GalleryTile({ item, onLike }) {
  return (
    <div className="bf-tile" style={{ background: item.grad }} onClick={onLike}>
      <span className="glow" />
      <span className="cap">
        <span>{item.cap}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Heart size={12} /> {item.likes}</span>
      </span>
    </div>
  );
}

/* ----------------------------- root ----------------------------- */
export default function App() {
  const [role, setRole] = useState("manager");

  // live data loaded from Supabase (falls back to demo data if unavailable)
  const [studio, setStudio] = useState(null);
  const [dbServices, setDbServices] = useState([]);
  // DB id of the registered client (null until registration completes)
  const [dbClientId, setDbClientId] = useState(null);

  useEffect(() => {
    ensureAnonSession();
    loadStudioBundle().then((b) => {
      if (!b) return;
      setServiceIndex(b.services);
      setDbServices(b.services);
      setStudio(b.studio);
    });
  }, []);

  // shared, connected state
  const [clients, setClients] = useState(CLIENTS0);
  const [appts, setAppts] = useState(APPTS0);
  const [gallery, setGallery] = useState(GALLERY0);
  const [pending, setPending] = useState(PENDING0);
  const [seq, setSeq] = useState(200);
  const [registered, setRegistered] = useState(false);
  const ME = 1; // demo client id for manager-side display

  const [toast, setToast] = useState(null);
  const ping = (msg) => { setToast(msg); window.clearTimeout(window.__bft); window.__bft = window.setTimeout(() => setToast(null), 2400); };

  // Called by Register screen on completion — persists the client to DB.
  const handleRegister = async ({ name, phone, email }) => {
    if (studio) {
      const id = await registerClient(studio.id, { name, phone, email });
      if (id) setDbClientId(id);
    }
    setRegistered(true);
    ping("ברוכה הבאה ל-Beautify 🤍");
  };

  const book = (serviceId, offset, time, paid = false) => {
    const id = seq + 1; setSeq(id);
    // Optimistic local update — UI responds instantly.
    setAppts((p) => [...p, {
      id, clientId: ME, service: serviceId, time,
      day: offset, dayLabel: offset === 0 ? "היום" : offset === 1 ? "מחר" : `בעוד ${offset} ימים`,
      status: "confirmed", arrival: false, paid,
    }]);
    // Persist to DB in the background (non-blocking).
    if (studio && dbClientId) {
      saveAppointment(studio.id, dbClientId, serviceId, offset, time, paid);
    }
    return id;
  };
  const confirmArrival = (id) => setAppts((p) => p.map((a) => a.id === id ? { ...a, arrival: true } : a));
  const cancelAppt = (id) => setAppts((p) => p.filter((a) => a.id !== id));
  const approvePhoto = (ph) => { setPending((p) => p.filter((x) => x.id !== ph.id)); setGallery((g) => [{ ...ph, id: ph.id, likes: 0 }, ...g]); };
  const rejectPhoto = (id) => setPending((p) => p.filter((x) => x.id !== id));
  const addPending = (cap, by) => { const id = seq + 1; setSeq(id); setPending((p) => [...p, { id, grad: G[id % G.length], cap, by }]); };
  const likePhoto = (id) => setGallery((g) => g.map((x) => x.id === id ? { ...x, likes: x.likes + 1 } : x));

  const studioName = studio?.name || "הסטודיו של דנה";
  const services = dbServices.length ? dbServices : SERVICES;
  const shared = { clients, setClients, appts, book, confirmArrival, cancelAppt, gallery, pending, approvePhoto, rejectPhoto, addPending, likePhoto, ping, ME, registered, handleRegister, studioName, services };

  return (
    <div className="bf-root">
      <style>{STYLE}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <span className="bf-mark" />
        <span className="bf-display" style={{ fontSize: 30, fontWeight: 700, letterSpacing: ".5px", color: "var(--plum-deep)" }}>Beautify</span>
      </div>

      <div className="bf-roleswitch" role="tablist" aria-label="תצוגה">
        <button className={role === "manager" ? "active" : ""} onClick={() => setRole("manager")}>תצוגת מנהלת</button>
        <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>תצוגת לקוחה</button>
      </div>
      <div className="bf-hint">הדגמה חיה — קבעי תור בצד הלקוחה והוא יופיע מיד ביומן המנהלת</div>

      <div className="bf-phone" style={{ marginTop: 16 }} dir="rtl">
        {role === "manager" ? <ManagerApp {...shared} /> : <ClientApp {...shared} />}
        {toast && <div className="bf-toast"><CheckCircle2 size={16} /> {toast}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   MANAGER
   ============================================================ */
function ManagerApp(props) {
  const { clients, appts, cancelAppt, gallery, pending, approvePhoto, rejectPhoto, ping } = props;
  const [tab, setTab] = useState("home");
  const titles = { home: ["בוקר טוב, דנה", "הנה היום שלך"], cal: ["יומן תורים", "ניהול הלו\"ז שלך"], clients: ["הלקוחות שלך", `${clients.length} לקוחות רשומות`], gallery: ["הגלריה שלך", "תיק העבודות שלך"], settings: ["הגדרות", "אוטומציות והעדפות"] };
  const t = titles[tab];

  return (
    <>
      <div className="bf-appbar"><h1 className="bf-display">{t[0]}</h1><div className="sub">{t[1]}</div></div>
      <div className="bf-screen">
        {tab === "home" && <MgrHome {...props} go={setTab} />}
        {tab === "cal" && <MgrCalendar appts={appts} clients={clients} cancelAppt={cancelAppt} ping={ping} />}
        {tab === "clients" && <MgrClients {...props} />}
        {tab === "gallery" && <MgrGallery gallery={gallery} pending={pending} approvePhoto={approvePhoto} rejectPhoto={rejectPhoto} ping={ping} />}
        {tab === "settings" && <MgrSettings ping={ping} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["home", Home, "בית"], ["cal", CalendarDays, "יומן"], ["clients", Users, "לקוחות"],
        ["gallery", ImageIcon, "גלריה"], ["settings", Settings, "הגדרות"],
      ]} />
    </>
  );
}

function MgrHome({ appts, clients, pending, go }) {
  const today = appts.filter((a) => a.day === 0).sort((x, y) => x.time.localeCompare(y.time));
  const needConfirm = today.filter((a) => !a.arrival && a.status !== "pending").length;
  const Stat = ({ n, l, c }) => (
    <div className="bf-card" style={{ flex: 1, padding: "12px 10px", textAlign: "center" }}>
      <div className="bf-display" style={{ fontSize: 26, fontWeight: 800, color: c }}>{n}</div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{l}</div>
    </div>
  );
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <Stat n={today.length} l="תורים היום" c="var(--plum)" />
        <Stat n={needConfirm} l="טרם אישרו הגעה" c="var(--rose)" />
        <Stat n={pending.length} l="תמונות לאישור" c="var(--gold)" />
      </div>

      <div>
        <SectionTitle icon={CalendarDays}>הלו"ז של היום</SectionTitle>
        {today.length === 0 && <Empty>אין עדיין תורים להיום — יום פנוי 🤍</Empty>}
        <div style={{ display: "grid", gap: 9 }}>
          {today.map((a) => { const c = clients.find((x) => x.id === a.clientId); const s = svc(a.service); return (
            <div key={a.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ textAlign: "center", minWidth: 46 }}>
                <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)" }}>{a.time}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{s.dur} ד׳</div>
              </div>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: s.grad }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{c?.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{s.name} · ₪{s.price}</div>
              </div>
              <StatusChip a={a} />
            </div> ); })}
        </div>
      </div>

      {pending.length > 0 && (
        <div className="bf-card" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: pending[0].grad }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{pending.length} תמונות מחכות לאישורך</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>לקוחות שיתפו את התוצאה</div>
            </div>
          </div>
          <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => go("gallery")}>לאישור</button>
        </div>
      )}
    </div>
  );
}

function MgrCalendar({ appts, clients, cancelAppt, ping }) {
  const days = next7();
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState(null);
  const list = appts.filter((a) => a.day === sel).sort((x, y) => x.time.localeCompare(y.time));
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
        {days.map((d) => (
          <div key={d.offset} className={"bf-day" + (sel === d.offset ? " active" : "")} onClick={() => setSel(d.offset)}>
            <div className="dn">{d.dn}</div><div className="dl">{d.dl}</div>
          </div>
        ))}
      </div>
      {list.length === 0 && <Empty>אין תורים ביום הזה</Empty>}
      <div style={{ display: "grid", gap: 9 }}>
        {list.map((a) => { const c = clients.find((x) => x.id === a.clientId); const s = svc(a.service); return (
          <button key={a.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", border: "1px solid var(--sand)" }} onClick={() => setOpen(a)}>
            <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)", minWidth: 46, textAlign: "center" }}>{a.time}</div>
            <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: s.grad }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c?.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{s.name}</div>
            </div>
            <StatusChip a={a} />
          </button> ); })}
      </div>

      {open && (() => { const c = clients.find((x) => x.id === open.clientId); const s = svc(open.service); return (
        <Sheet onClose={() => setOpen(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar name={c.name} />
            <div><div style={{ fontWeight: 800, fontSize: 18 }}>{c.name}</div><div style={{ color: "var(--muted)", fontSize: 13 }}>{open.dayLabel} · {open.time} · {s.name}</div></div>
          </div>
          <div className="bf-card" style={{ padding: 12, marginBottom: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
            <Row k="שירות" v={`${s.name} (${s.dur} דקות)`} />
            <Row k="מחיר" v={`₪${s.price}`} />
            <Row k="תשלום" v={open.paid ? "שולם בביט ✓" : "ישולם במקום"} />
            <Row k="אישור הגעה" v={open.arrival ? "אושר ✓" : "ממתין"} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <a className="bf-btn bf-btn-ghost" href={`tel:${c.phone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
            <button className="bf-btn bf-btn-soft" onClick={() => { ping("נשלחה ללקוחה בקשה להזזת התור"); setOpen(null); }}><Clock size={16} /> הזיזי תור</button>
          </div>
          <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { cancelAppt(open.id); ping("התור בוטל"); setOpen(null); }}><X size={16} /> ביטול התור</button>
        </Sheet> ); })()}
    </div>
  );
}

function MgrClients({ clients, setClients, appts, ping }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const filtered = clients.filter((c) => c.name.includes(q) || c.phone.includes(q));
  const block = (id) => setClients((p) => p.map((c) => c.id === id ? { ...c, blocked: !c.blocked } : c));
  const del = (id) => { setClients((p) => p.filter((c) => c.id !== id)); ping("הלקוחה נמחקה"); setOpen(null); };
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <Search size={17} style={{ position: "absolute", insetInlineStart: 13, top: 14, color: "var(--muted)" }} />
        <input className="bf-input" style={{ paddingInlineStart: 40 }} placeholder="חיפוש לקוחה לפי שם או טלפון" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {filtered.map((c) => (
          <button key={c.id} className="bf-card" onClick={() => setOpen(c)} style={{ padding: 11, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", opacity: c.blocked ? 0.55 : 1 }}>
            <Avatar name={c.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name} {c.blocked && <span className="bf-chip" style={{ background: "#F3E3E5", color: "#B23A48", marginInlineStart: 4 }}>חסומה</span>}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.visits} ביקורים · {c.last}</div>
            </div>
            <ChevronLeft size={18} color="var(--muted)" />
          </button>
        ))}
      </div>

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar name={open.name} />
            <div><div style={{ fontWeight: 800, fontSize: 18 }}>{open.name}</div><div style={{ color: "var(--muted)", fontSize: 13 }}>{open.phone} · {open.email}</div></div>
          </div>
          <div className="bf-card" style={{ padding: 12, marginBottom: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
            <Row k="סך ביקורים" v={open.visits} />
            <Row k="ביקור אחרון" v={open.last} />
            <Row k="הצהרת בריאות" v="נחתמה ✓" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <a className="bf-btn bf-btn-ghost" href={`tel:${open.phone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
            <button className="bf-btn bf-btn-soft" onClick={() => { ping("תזכורת נשלחה ב-WhatsApp"); }}><Bell size={16} /> שלחי תזכורת</button>
            <button className="bf-btn bf-btn-ghost" onClick={() => block(open.id)}><Ban size={16} /> {open.blocked ? "ביטול חסימה" : "חסימה"}</button>
            <button className="bf-btn bf-btn-ghost" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => del(open.id)}><Trash2 size={16} /> מחיקה</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function MgrGallery({ gallery, pending, approvePhoto, rejectPhoto, ping }) {
  const [seg, setSeg] = useState("mine");
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div className="bf-seg">
        <button className={seg === "mine" ? "active" : ""} onClick={() => setSeg("mine")}>הגלריה שלי ({gallery.length})</button>
        <button className={seg === "pend" ? "active" : ""} onClick={() => setSeg("pend")}>לאישור ({pending.length})</button>
      </div>

      {seg === "mine" && (<>
        <button className="bf-btn bf-btn-ghost" onClick={() => ping("נפתחת המצלמה להעלאת עבודה")}><Camera size={17} /> העלאת עבודה חדשה</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {gallery.map((g) => <GalleryTile key={g.id} item={g} onLike={() => {}} />)}
        </div>
      </>)}

      {seg === "pend" && (<>
        {pending.length === 0 && <Empty>אין תמונות שממתינות לאישור 🤍</Empty>}
        <div style={{ display: "grid", gap: 12 }}>
          {pending.map((p) => (
            <div key={p.id} className="bf-card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 66, height: 66, borderRadius: 14, background: p.grad, flex: "none", boxShadow: "inset 0 -14px 18px -14px rgba(0,0,0,.4)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.cap}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>הועלה ע״י {p.by}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button aria-label="אישור" className="bf-btn bf-btn-primary bf-btn-sm" onClick={() => { approvePhoto(p); ping("התמונה אושרה ונוספה לגלריה"); }}><Check size={16} /></button>
                <button aria-label="דחייה" className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => { rejectPhoto(p.id); ping("התמונה נדחתה"); }}><X size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}

function MgrSettings({ ping }) {
  const [s, setS] = useState({ dayStart: true, afterBreak: true, c24: true, c1: true });
  const tog = (k) => setS((p) => { const n = { ...p, [k]: !p[k] }; ping("ההגדרה נשמרה"); return n; });
  const Toggle = ({ on, set, title, sub }) => (
    <div className="bf-card" style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sub}</div></div>
      <button onClick={set} aria-pressed={on} style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: on ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: ".18s" }}>
        <span style={{ width: 21, height: 21, borderRadius: "50%", background: "#fff", display: "block" }} />
      </button>
    </div>
  );
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <SectionTitle icon={Bell}>תזכורות אוטומטיות אליי</SectionTitle>
      <Toggle on={s.dayStart} set={() => tog("dayStart")} title="סיכום בתחילת יום" sub="כל הבוקר — רשימת התורים של היום" />
      <Toggle on={s.afterBreak} set={() => tog("afterBreak")} title="תזכורת אחרי הפסקה" sub="התראה על התור הבא אחרי כל הפסקה" />
      <SectionTitle icon={Users}>תזכורות אוטומטיות ללקוחות</SectionTitle>
      <Toggle on={s.c24} set={() => tog("c24")} title="24 שעות לפני התור" sub="כולל בקשת אישור הגעה ב-WhatsApp" />
      <Toggle on={s.c1} set={() => tog("c1")} title="שעה לפני התור" sub="תזכורת אחרונה לפני ההגעה" />
      <SectionTitle icon={Sparkles}>פרטי הסטודיו</SectionTitle>
      <div className="bf-card" style={{ padding: 12, display: "grid", gap: 6, fontSize: 13.5 }}>
        <Row k="שם" v="הסטודיו של דנה" />
        <Row k="שירותים פעילים" v={`${SERVICES.length}`} />
        <Row k="ערכת צבע" v="ויין · בלאש" />
      </div>
    </div>
  );
}

/* ============================================================
   CLIENT
   ============================================================ */
function ClientApp(props) {
  const { appts, ME, clients, registered, setRegistered, studioName } = props;
  const [tab, setTab] = useState("book");
  const me = clients.find((c) => c.id === ME);

  if (!registered) return <Register onDone={props.handleRegister} />;

  const titles = { book: ["קביעת תור", studioName], mine: ["התורים שלי", me?.name], gallery: ["הגלריה", "עבודות הסטודיו"], profile: ["הפרופיל שלי", me?.name] };
  const t = titles[tab];
  return (
    <>
      <div className="bf-appbar"><h1 className="bf-display">{t[0]}</h1><div className="sub">{t[1]}</div></div>
      <div className="bf-screen">
        {tab === "book" && <CliBook {...props} />}
        {tab === "mine" && <CliMine {...props} />}
        {tab === "gallery" && <CliGallery {...props} />}
        {tab === "profile" && <CliProfile me={me} ping={props.ping} />}
      </div>
      <NavBar tab={tab} setTab={setTab} items={[
        ["book", Plus, "תור חדש"], ["mine", CalendarDays, "התורים שלי"], ["gallery", ImageIcon, "גלריה"], ["profile", User, "פרופיל"],
      ]} />
    </>
  );
}

function Register({ onDone }) {
  const [f, setF] = useState({ name: "", phone: "", email: "" });
  const [agree, setAgree] = useState(false);
  const [terms, setTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const ok = f.name && f.phone.length >= 9 && f.email.includes("@") && agree;

  const handleSubmit = async () => {
    setSaving(true);
    await onDone({ name: f.name, phone: f.phone, email: f.email });
    setSaving(false);
  };
  return (
    <>
      <div className="bf-appbar" style={{ textAlign: "center" }}>
        <span className="bf-mark" style={{ margin: "0 auto 8px" }} />
        <h1 className="bf-display" style={{ textAlign: "center" }}>הצטרפי לסטודיו</h1>
        <div className="sub" style={{ textAlign: "center" }}>הרשמה מהירה — וכבר אפשר לקבוע תור</div>
      </div>
      <div className="bf-screen bf-pad" style={{ display: "grid", gap: 14 }}>
        <div><label className="bf-label">שם מלא</label><input className="bf-input" placeholder="לדוגמה: נועה כהן" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="bf-label">טלפון נייד</label><input className="bf-input" inputMode="tel" placeholder="050-0000000" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="bf-label">אימייל</label><input className="bf-input" inputMode="email" placeholder="name@mail.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>

        <button onClick={() => setAgree(!agree)} className="bf-card" style={{ padding: 13, display: "flex", gap: 11, alignItems: "flex-start", textAlign: "right", cursor: "pointer", border: agree ? "1px solid var(--rose)" : "1px solid var(--sand)" }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: agree ? "linear-gradient(135deg,var(--plum),var(--rose))" : "#fff", border: agree ? "none" : "1px solid var(--sand)" }}>{agree && <Check size={15} color="#fff" />}</span>
          <span style={{ fontSize: 13, lineHeight: 1.5 }}>קראתי ואני מאשרת את <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setTerms(true); }} onKeyDown={(e) => e.key === "Enter" && setTerms(true)} style={{ color: "var(--plum)", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>תנאי השירות והצהרת הבריאות</span></span>
        </button>

        <button className="bf-btn bf-btn-primary" disabled={!ok || saving} onClick={handleSubmit}>
          <ShieldCheck size={17} /> {saving ? "שומרת…" : "סיום הרשמה"}
        </button>
      </div>

      {terms && (
        <Sheet onClose={() => setTerms(false)}>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>תנאי שירות והצהרת בריאות</h3>
          <span className="bf-chip bf-chip-wait" style={{ marginBottom: 12 }}>טיוטה — לאישור עו״ד</span>
          <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "#5b4a52", display: "grid", gap: 8 }}>
            <p>אני מאשרת קבלת טיפולי קוסמטיקה בסטודיו ומצהירה כי איני סובלת ממצב רפואי, אלרגיה או רגישות העלולים להשפיע על הטיפול, ואם קיים — עדכנתי על כך מראש.</p>
            <p>ידוע לי כי ביטול תור ייעשה עד 24 שעות מראש, וכי באי-הגעה ללא הודעה הסטודיו רשאי לגבות דמי ביטול בהתאם למדיניות.</p>
            <p>אני מאשרת שמירת פרטי ההתקשרות והיסטוריית הטיפולים שלי לצורך מתן השירות, בהתאם למדיניות הפרטיות.</p>
            <p>שיתוף תמונות בגלריה ייעשה רק באישורי המפורש ובאישור הסטודיו.</p>
          </div>
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} onClick={() => { setAgree(true); setTerms(false); }}>קראתי ואני מאשרת</button>
        </Sheet>
      )}
    </>
  );
}

function CliBook(props) {
  const { book, ping } = props;
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [offset, setOffset] = useState(null);
  const [time, setTime] = useState(null);
  const [pay, setPay] = useState(false);
  const days = next7();
  const s = svc(service);

  const finish = (paid) => {
    book(service, offset, time, paid);
    ping(paid ? "התור נקבע ושולם בביט ✓" : "התור נקבע ✓ נתראה!");
    setPay(false); setStep(1); setService(null); setOffset(null); setTime(null);
  };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <Steps step={step} />
      {step === 1 && (<>
        <SectionTitle icon={Sparkles}>בחרי טיפול</SectionTitle>
        <div style={{ display: "grid", gap: 9 }}>
          {props.services.map((sv) => (
            <button key={sv.id} className="bf-card" onClick={() => { setService(sv.id); setStep(2); }} style={{ padding: 12, display: "flex", alignItems: "center", gap: 12, textAlign: "right", cursor: "pointer" }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: sv.grad, flex: "none" }} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{sv.name}</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sv.dur} דקות</div></div>
              <div className="bf-display" style={{ fontWeight: 800, color: "var(--plum)" }}>₪{sv.price}</div>
            </button>
          ))}
        </div>
      </>)}

      {step === 2 && (<>
        <Back onClick={() => setStep(1)} label={s.name} />
        <SectionTitle icon={CalendarDays}>בחרי יום</SectionTitle>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {days.map((d) => <div key={d.offset} className={"bf-day" + (offset === d.offset ? " active" : "")} onClick={() => setOffset(d.offset)}><div className="dn">{d.dn}</div><div className="dl">{d.dl}</div></div>)}
        </div>
        {offset != null && (<>
          <SectionTitle icon={Clock}>בחרי שעה</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
            {TIMES.map((tm, i) => <button key={tm} className={"bf-slot" + (time === tm ? " active" : "")} disabled={i === 3} onClick={() => setTime(tm)}>{tm}</button>)}
          </div>
        </>)}
        <button className="bf-btn bf-btn-primary" disabled={offset == null || !time} onClick={() => setStep(3)}>המשך לאישור</button>
      </>)}

      {step === 3 && (<>
        <Back onClick={() => setStep(2)} label="פרטי התור" />
        <div className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ height: 84, background: s.grad, position: "relative" }}><span style={{ position: "absolute", inset: "0 0 55% 0", background: "linear-gradient(180deg,rgba(255,255,255,.3),transparent)" }} /></div>
          <div style={{ padding: 14, display: "grid", gap: 7, fontSize: 14 }}>
            <Row k="טיפול" v={s.name} />
            <Row k="מתי" v={`${days[offset].dl} · ${time}`} />
            <Row k="משך" v={`${s.dur} דקות`} />
            <Row k="מחיר" v={<span className="bf-display" style={{ fontWeight: 800, color: "var(--plum)", fontSize: 17 }}>₪{s.price}</span>} />
          </div>
        </div>
        <button className="bf-btn bf-btn-primary" onClick={() => setPay(true)}><Wallet size={17} /> תשלום בביט וקביעת התור</button>
        <button className="bf-btn bf-btn-ghost" onClick={() => finish(false)}>אשלם במקום — קבעי תור</button>
      </>)}

      {pay && <BitSheet amount={s.price} onClose={() => setPay(false)} onPaid={() => finish(true)} />}
    </div>
  );
}

function CliMine(props) {
  const { appts, ME, confirmArrival, cancelAppt, ping } = props;
  const mine = appts.filter((a) => a.clientId === ME).sort((x, y) => x.day - y.day || x.time.localeCompare(y.time));
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <SectionTitle icon={CalendarDays}>תורים קרובים</SectionTitle>
      {mine.length === 0 && <Empty>אין לך תורים קרובים — קבעי תור חדש 🤍</Empty>}
      <div style={{ display: "grid", gap: 11 }}>
        {mine.map((a) => { const s = svc(a.service); return (
          <div key={a.id} className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 13 }}>
              <div style={{ textAlign: "center", minWidth: 50 }}><div className="bf-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--plum)" }}>{a.time}</div><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{a.dayLabel}</div></div>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: s.grad, minHeight: 38 }} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div><div style={{ fontSize: 12.5, color: "var(--muted)" }}>הסטודיו של דנה · ₪{s.price}</div></div>
            </div>
            <div style={{ display: "flex", gap: 8, padding: "0 13px 13px" }}>
              {a.arrival
                ? <button className="bf-btn bf-btn-soft bf-btn-sm" disabled style={{ flex: 1, opacity: 1 }}><CheckCircle2 size={15} /> הגעה אושרה</button>
                : <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => { confirmArrival(a.id); ping("אישרת הגעה — נתראה!"); }}><Check size={15} /> אישור הגעה</button>}
              <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => { cancelAppt(a.id); ping("התור בוטל"); }}><X size={15} /> ביטול</button>
            </div>
          </div> ); })}
      </div>

      <SectionTitle icon={Clock}>היסטוריה</SectionTitle>
      <div style={{ display: "grid", gap: 9 }}>
        {PAST0.map((a) => { const s = svc(a.service); return (
          <div key={a.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11, opacity: 0.8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: s.grad, flex: "none" }} />
            <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{a.dateLabel}</div></div>
            <span className="bf-chip bf-chip-ok"><Check size={12} /> הושלם</span>
          </div> ); })}
      </div>
    </div>
  );
}

function CliGallery(props) {
  const { gallery, addPending, likePhoto, ping, clients, ME } = props;
  const me = clients.find((c) => c.id === ME);
  const [add, setAdd] = useState(false);
  const [cap, setCap] = useState("");
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div className="bf-card" style={{ padding: 13, display: "flex", gap: 11, alignItems: "center", background: "linear-gradient(135deg,#fff,#FDF3F6)" }}>
        <Camera size={20} color="var(--plum)" />
        <div style={{ flex: 1, fontSize: 13.5 }}><b>אהבת את התוצאה?</b> שתפי תמונה — תופיע בגלריה אחרי אישור הסטודיו.</div>
        <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => setAdd(true)}>שיתוף</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {gallery.map((g) => <GalleryTile key={g.id} item={g} onLike={() => likePhoto(g.id)} />)}
      </div>

      {add && (
        <Sheet onClose={() => setAdd(false)}>
          <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>שיתוף תמונה</h3>
          <div style={{ height: 150, borderRadius: 16, background: "linear-gradient(135deg,#F4C9D4,#D9738F)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: "#fff" }}><Camera size={34} /></div>
          <label className="bf-label">תיאור קצר</label>
          <input className="bf-input" placeholder="לדוגמה: אומברה ורוד" value={cap} onChange={(e) => setCap(e.target.value)} />
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} onClick={() => { addPending(cap || "העבודה שלי", me.name); ping("נשלח לאישור הסטודיו 🤍"); setAdd(false); setCap(""); }}>שליחה לאישור</button>
        </Sheet>
      )}
    </div>
  );
}

function CliProfile({ me, ping }) {
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div className="bf-avatar" style={{ width: 60, height: 60, fontSize: 21 }}>{initials(me.name)}</div>
        <div><div className="bf-display" style={{ fontSize: 21, fontWeight: 800 }}>{me.name}</div><div style={{ color: "var(--muted)", fontSize: 13 }}>{me.visits} ביקורים בסטודיו</div></div>
      </div>
      <div className="bf-card" style={{ padding: 13, display: "grid", gap: 7, fontSize: 13.5 }}>
        <Row k="טלפון" v={me.phone} /><Row k="אימייל" v={me.email} /><Row k="הצהרת בריאות" v="נחתמה ✓" />
      </div>
      <SectionTitle icon={Wallet}>אמצעי תשלום</SectionTitle>
      <div className="bf-card" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "#0099FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>bit</div>
        <div style={{ flex: 1, fontSize: 14 }}><b>תשלום מהיר בביט</b><div style={{ fontSize: 12, color: "var(--muted)" }}>מקושר למספר {me.phone}</div></div>
        <span className="bf-chip bf-chip-ok"><Check size={12} /> פעיל</span>
      </div>
      <button className="bf-btn bf-btn-ghost" onClick={() => ping("התנתקת מהדמו")}><LogOut size={16} /> התנתקות</button>
    </div>
  );
}

/* ----------------------------- shared sub-components ----------------------------- */
function NavBar({ tab, setTab, items }) {
  return (
    <div className="bf-nav">
      {items.map(([key, Icon, label]) => (
        <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
          <Icon size={21} strokeWidth={tab === key ? 2.4 : 1.9} />
          {label}
          {tab === key ? <span className="ndot" /> : <span style={{ height: 5 }} />}
        </button>
      ))}
    </div>
  );
}
function SectionTitle({ icon: Icon, children }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}><Icon size={16} color="var(--plum)" /><h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800 }}>{children}</h2></div>;
}
function Row({ k, v }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ color: "var(--muted)" }}>{k}</span><span style={{ fontWeight: 700, textAlign: "left" }}>{v}</span></div>;
}
function Empty({ children }) {
  return <div className="bf-card" style={{ padding: 22, textAlign: "center", color: "var(--muted)", fontSize: 13.5, borderStyle: "dashed" }}>{children}</div>;
}
function Back({ onClick, label }) {
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--plum)", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, font: "inherit" }}><ChevronRight size={18} /> {label}</button>;
}
function Steps({ step }) {
  const labels = ["טיפול", "מועד", "אישור"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", background: step >= i + 1 ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)" }}>{i + 1}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: step >= i + 1 ? "var(--ink)" : "var(--muted)" }}>{l}</span>
          </div>
          {i < 2 && <span style={{ flex: 1, height: 2, background: step > i + 1 ? "var(--rose)" : "var(--sand)", borderRadius: 2 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}
function Sheet({ children, onClose }) {
  return (
    <div className="bf-modalwrap" onClick={onClose}>
      <div className="bf-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--sand)", margin: "0 auto 14px" }} />
        {children}
      </div>
    </div>
  );
}
function BitSheet({ amount, onClose, onPaid }) {
  const [state, setState] = useState("ready"); // ready | processing | done
  const go = () => { setState("processing"); setTimeout(() => setState("done"), 1100); setTimeout(onPaid, 1900); };
  return (
    <Sheet onClose={state === "processing" ? () => {} : onClose}>
      <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: "#0099FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, margin: "0 auto 12px" }}>bit</div>
        {state === "ready" && (<>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 22 }}>תשלום מאובטח</h3>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 6px" }}>תועברי לאפליקציית ביט לאישור התשלום</p>
          <div className="bf-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--plum)", margin: "8px 0 16px" }}>₪{amount}</div>
          <button className="bf-btn bf-btn-primary" onClick={go}><ShieldCheck size={17} /> שלמי ₪{amount} בביט</button>
        </>)}
        {state === "processing" && (<>
          <h3 className="bf-display" style={{ margin: "12px 0", fontSize: 20 }}>מעבד תשלום…</h3>
          <div style={{ width: 34, height: 34, border: "3px solid var(--sand)", borderTopColor: "var(--plum)", borderRadius: "50%", margin: "8px auto 16px", animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </>)}
        {state === "done" && (<>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E7F3EC", display: "flex", alignItems: "center", justifyContent: "center", margin: "8px auto 12px" }}><Check size={30} color="#2E7D52" /></div>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 22 }}>שולם בהצלחה</h3>
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>קובעת את התור…</p>
        </>)}
      </div>
    </Sheet>
  );
}
