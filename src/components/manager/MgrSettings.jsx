import React, { useState } from "react";
import { Bell, Users, Sparkles, LogOut, Plus, Pencil, Trash2, Repeat, Check, X, ChevronDown } from "lucide-react";
import { SectionTitle, Row, Sheet } from "../ui";
import { DOW_FULL } from "../../data/mock";

const KEYS = {
  notify_day_start:   { title: "סיכום בתחילת יום", sub: "כל הבוקר — רשימת התורים של היום" },
  notify_after_break: { title: "תזכורת אחרי הפסקה", sub: "התראה על התור הבא אחרי כל הפסקה" },
  notify_client_24h:  { title: "24 שעות לפני התור", sub: "תזכורת SMS ללקוחה + בקשת אישור הגעה" },
  notify_client_1h:   { title: "שעה לפני התור", sub: "תזכורת SMS אחרונה לפני ההגעה" },
};

const GRADS = [
  "linear-gradient(135deg,#D9738F,#F4C9D4)", "linear-gradient(135deg,#7C2A53,#D9738F)",
  "linear-gradient(135deg,#5E1F40,#9A4E72)", "linear-gradient(135deg,#C98AA6,#F0D7DF)",
  "linear-gradient(135deg,#9A4E72,#E0AFC0)", "linear-gradient(135deg,#B4893E,#F4C9D4)",
];

export default function MgrSettings({ mgr }) {
  const s = mgr.studio || {};
  const [state, setState] = useState({
    notify_day_start:   s.notify_day_start ?? true,
    notify_after_break: s.notify_after_break ?? true,
    notify_client_24h:  s.notify_client_24h ?? true,
    notify_client_1h:   s.notify_client_1h ?? true,
  });
  const [editSvc, setEditSvc] = useState(null);   // service being added/edited
  const [openStanding, setOpenStanding] = useState(false);   // standing list dropdown (note 48)

  const tog = (k) => {
    const next = !state[k];
    setState((p) => ({ ...p, [k]: next }));
    mgr.saveSettings({ [k]: next });
  };

  const Toggle = ({ k }) => (
    <div className="bf-card" style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{KEYS[k].title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{KEYS[k].sub}</div>
      </div>
      <button onClick={() => tog(k)} aria-pressed={state[k]} style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: state[k] ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: state[k] ? "flex-end" : "flex-start", transition: ".18s" }}>
        <span style={{ width: 21, height: 21, borderRadius: "50%", background: "#fff", display: "block" }} />
      </button>
    </div>
  );

  const services = mgr.services || [];

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      {/* Services management (notes 20, 25) */}
      <SectionTitle icon={Sparkles} action={
        <button className="bf-btn bf-btn-soft bf-btn-sm" onClick={() => setEditSvc({ name: "", dur: 60, price: 100, grad: GRADS[services.length % GRADS.length] })}>
          <Plus size={14} /> שירות
        </button>
      }>השירותים שלך</SectionTitle>
      {services.length === 0 && (
        <div className="bf-card" style={{ padding: 16, textAlign: "center", color: "var(--muted)", fontSize: 13, borderStyle: "dashed" }}>
          עדיין לא הוספת שירותים — הוסיפי כדי שלקוחות יוכלו לקבוע תור
        </div>
      )}
      <div style={{ display: "grid", gap: 9 }}>
        {services.map((sv) => (
          <div key={sv.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: sv.grad, flex: "none" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{sv.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sv.dur} דק׳ · ₪{sv.price}</div>
            </div>
            <button onClick={() => setEditSvc(sv)} aria-label="עריכה" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}><Pencil size={16} /></button>
            <button onClick={() => mgr.deleteService(sv.id)} aria-label="מחיקה" style={{ background: "none", border: "none", cursor: "pointer", color: "#B23A48", padding: 4 }}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      {/* Standing weekly appointments — collapsible dropdown (note 48) */}
      {(() => {
        const pending = (mgr.standing || []).filter((s) => s.status === "pending").length;
        return (
          <button onClick={() => setOpenStanding((v) => !v)} className="bf-card" style={{ padding: "12px 13px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "right", width: "100%" }}>
            <Repeat size={16} color="var(--plum)" />
            <span style={{ flex: 1, fontWeight: 800, fontSize: 15.5 }}>תורים קבועים שבועיים</span>
            {pending > 0 && <span className="bf-chip bf-chip-rose">{pending} ממתינות</span>}
            <ChevronDown size={18} color="var(--muted)" style={{ transform: openStanding ? "rotate(180deg)" : "none", transition: ".18s" }} />
          </button>
        );
      })()}
      {openStanding && ((mgr.standing || []).length === 0 ? (
        <div className="bf-card" style={{ padding: 14, textAlign: "center", color: "var(--muted)", fontSize: 12.5, borderStyle: "dashed" }}>
          אין בקשות לתורים קבועים. כשלקוחה תבקש יום ושעה קבועים, הבקשה תופיע כאן לאישורך.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 9 }}>
          {mgr.standing.map((st) => (
            <div key={st.id} className="bf-card" style={{ padding: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Repeat size={17} color="var(--plum)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{st.client_name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{st.service_name} · כל {DOW_FULL[st.weekday]} בשעה {st.time}</div>
                </div>
                {st.status === "approved" && <span className="bf-chip bf-chip-ok"><Check size={12} /> מאושר</span>}
              </div>
              {st.status === "pending" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => mgr.approveStanding(st)}><Check size={15} /> אישור</button>
                  <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => mgr.declineStanding(st)}><X size={15} /> דחייה</button>
                </div>
              ) : (
                <button className="bf-btn bf-btn-ghost bf-btn-sm" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => mgr.cancelStanding(st)}><X size={15} /> ביטול התור הקבוע</button>
              )}
            </div>
          ))}
        </div>
      ))}

      <SectionTitle icon={Bell}>תזכורות אוטומטיות אליי</SectionTitle>
      <Toggle k="notify_day_start" />
      <Toggle k="notify_after_break" />
      <SectionTitle icon={Users}>תזכורות אוטומטיות ללקוחות</SectionTitle>
      <Toggle k="notify_client_24h" />
      <Toggle k="notify_client_1h" />
      <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6, padding: "0 2px" }}>
        ההתראות נשמרות אוטומטית. שליחת SMS בפועל תופעל לאחר חיבור ספק SMS.
      </div>

      <SectionTitle icon={Sparkles}>פרטי הסטודיו</SectionTitle>
      <div className="bf-card" style={{ padding: 12, display: "grid", gap: 6, fontSize: 13.5 }}>
        <Row k="שם" v={mgr.studioName} />
        <Row k="שירותים פעילים" v={`${services.length || "—"}`} />
        <Row k="ערכת צבע" v="ויין · בלאש" />
      </div>

      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 6, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={mgr.logout}>
        <LogOut size={16} /> התנתקות
      </button>

      {editSvc && <ServiceEditor svc={editSvc} mgr={mgr} grads={GRADS} onClose={() => setEditSvc(null)} />}
    </div>
  );
}

function ServiceEditor({ svc, mgr, grads, onClose }) {
  const editing = !!svc.id;
  const [name, setName] = useState(svc.name || "");
  const [dur, setDur] = useState(svc.dur || 60);
  const [price, setPrice] = useState(svc.price || 100);
  const [grad, setGrad] = useState(svc.grad || grads[0]);
  const [busy, setBusy] = useState(false);
  const ok = name.trim() && dur > 0 && price >= 0;

  const save = async () => {
    if (!ok) return;
    setBusy(true);
    if (editing) await mgr.updateService(svc.id, { name, duration: dur, price, gradient: grad });
    else await mgr.addService({ name, duration: dur, price, gradient: grad });
    setBusy(false); onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 14px", fontSize: 20 }}>{editing ? "עריכת שירות" : "שירות חדש"}</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label className="bf-label">שם השירות</label><input className="bf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: לק ג'ל" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label className="bf-label">משך (דקות)</label><input className="bf-input" type="number" inputMode="numeric" value={dur} onChange={(e) => setDur(+e.target.value)} /></div>
          <div><label className="bf-label">מחיר (₪)</label><input className="bf-input" type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
        </div>
        <div>
          <label className="bf-label">צבע</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {grads.map((g) => (
              <button key={g} onClick={() => setGrad(g)} aria-label="צבע" style={{ width: 40, height: 40, borderRadius: 11, background: g, border: grad === g ? "3px solid var(--plum)" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        </div>
        <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={save}>{busy ? "שומרת…" : (editing ? "שמירה" : "הוספת שירות")}</button>
      </div>
    </Sheet>
  );
}
