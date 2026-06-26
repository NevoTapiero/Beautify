import React, { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Sheet } from "../ui";

// Profile shown in employee-app mode (Phase 3): client-style, no logout.
// The only way back to the manager view is the manager's password.
export default function EmployeeProfile({ mgr }) {
  const emp = mgr.lockedEmployee;
  const [gate, setGate] = useState(false);
  const initial = (emp?.name || "?").charAt(0);

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: emp?.color || "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22 }}>{initial}</div>
        <div>
          <div className="bf-display" style={{ fontSize: 21, fontWeight: 800 }}>{emp?.name || "עובדת"}</div>
          {emp?.title && <div style={{ color: "var(--muted)", fontSize: 13 }}>{emp.title}</div>}
        </div>
      </div>

      <div className="bf-card" style={{ padding: 13, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6 }}>
        זוהי תצוגת העובדת — היומן והעבודות שלך. ניהול הסטודיו זמין למנהלת בלבד.
      </div>

      <button className="bf-btn bf-btn-ghost" onClick={() => setGate(true)}>
        <Lock size={16} /> גישת מנהלת
      </button>

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
