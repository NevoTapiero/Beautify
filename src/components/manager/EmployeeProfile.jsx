import React, { useState } from "react";
import { Lock, ShieldCheck, Camera, Bell, CalendarCheck } from "lucide-react";
import { Sheet, PhotoEnlarge } from "../ui";

function NotifToggle({ label, sub, on, onToggle }) {
  return (
    <div className="bf-card" style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sub}</div>
      </div>
      <button onClick={() => onToggle(!on)} aria-pressed={on} style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: on ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)", display: "flex", justifyContent: on ? "flex-end" : "flex-start", transition: ".18s" }}>
        <span style={{ width: 21, height: 21, borderRadius: "50%", background: "#fff", display: "block" }} />
      </button>
    </div>
  );
}

// Profile shown in employee-app mode (Phase 3): client-style, no logout.
// The only way back to the manager view is the manager's password.
export default function EmployeeProfile({ mgr }) {
  const emp = mgr.lockedEmployee;
  const [gate, setGate] = useState(false);
  const [aboutDraft, setAboutDraft] = useState(emp?.about || "");
  const [enlarge, setEnlarge] = useState(false);
  const initial = (emp?.name || "?").charAt(0);

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <button onClick={() => setEnlarge(true)} style={{ position: "relative", border: "none", background: "none", padding: 0, cursor: "pointer", borderRadius: "50%" }}>
          {emp?.avatar
            ? <img src={emp.avatar} alt={emp.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 56, height: 56, borderRadius: "50%", background: emp?.color || "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22 }}>{initial}</div>}
          <span style={{ position: "absolute", insetInlineEnd: -2, bottom: -2, width: 22, height: 22, borderRadius: "50%", background: "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
            <Camera size={11} color="var(--btn-ink)" />
          </span>
        </button>
        <div>
          <div className="bf-display" style={{ fontSize: 21, fontWeight: 800 }}>{emp?.name || "עובדת"}</div>
          {emp?.title && <div style={{ color: "var(--muted)", fontSize: 13 }}>{emp.title}</div>}
        </div>
      </div>

      <div className="bf-card" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
        <CalendarCheck size={20} color="var(--plum)" />
        <div style={{ fontSize: 13.5 }}><b>{mgr.myVisits || 0}</b> תורים ביצעת עד היום</div>
      </div>

      {/* Notification preferences (note 60) */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
        <Bell size={16} color="var(--plum)" />
        <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800 }}>התראות</h2>
      </div>
      <NotifToggle label="סיכום יומי" sub="רשימת התורים שלך בתחילת היום" on={emp?.notify_day_start !== false} onToggle={(v) => mgr.updateMyNotifPref({ notify_day_start: v })} />
      <NotifToggle label="תור חדש" sub="התראה כשנקבע לך תור חדש" on={emp?.notify_appt !== false} onToggle={(v) => mgr.updateMyNotifPref({ notify_appt: v })} />

      {/* About me (note 62) — shown to clients under "עלינו" */}
      <div className="bf-card" style={{ padding: 13, display: "grid", gap: 9 }}>
        <label className="bf-label">על עצמי</label>
        <textarea className="bf-input" rows={3} value={aboutDraft} onChange={(e) => setAboutDraft(e.target.value)} placeholder="כמה מילים על עצמך שהלקוחות יראו…" style={{ resize: "vertical", fontFamily: "inherit" }} />
        <button className="bf-btn bf-btn-soft bf-btn-sm" style={{ justifySelf: "start" }} disabled={aboutDraft === (emp?.about || "")} onClick={() => mgr.updateMyAbout(aboutDraft)}>שמירה</button>
      </div>

      <div className="bf-card" style={{ padding: 13, fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
        זוהי תצוגת העובדת — היומן והעבודות שלך. ניהול הסטודיו זמין למנהלת בלבד.
      </div>

      <button className="bf-btn bf-btn-ghost" onClick={() => setGate(true)}>
        <Lock size={16} /> גישת מנהלת
      </button>

      {enlarge && (
        <PhotoEnlarge
          src={emp?.avatar} name={emp?.name} onClose={() => setEnlarge(false)}
          onUpload={(f) => mgr.uploadMyAvatar(f)}
          onTooBig={(mb) => mgr.ping(`הקובץ גדול מדי (${mb}MB)`)}
        />
      )}
      {gate && <ManagerGate mgr={mgr} onClose={() => setGate(false)} />}
    </div>
  );
}

function ManagerGate({ mgr, onClose }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setErr(false);
    const ok = await mgr.unlockManager(pw);
    setBusy(false);
    if (!ok) setErr(true);   // on success the view switches automatically
  };
  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>גישת מנהלת</h3>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>הזיני את סיסמת המנהלת כדי לחזור לתצוגת הניהול.</div>
      <input className="bf-input" type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(false); }} placeholder="סיסמת מנהלת" onKeyDown={(e) => e.key === "Enter" && pw && submit()} />
      {err && <div style={{ color: "#B23A48", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>סיסמה שגויה</div>}
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={!pw || busy} onClick={submit}>
        <ShieldCheck size={16} /> {busy ? "בודקת…" : "כניסה לניהול"}
      </button>
    </Sheet>
  );
}
