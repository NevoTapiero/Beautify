import React, { useState } from "react";
import { Bell, Users, Sparkles, LogOut } from "lucide-react";
import { SectionTitle, Row } from "../ui";

const KEYS = {
  notify_day_start:   { title: "סיכום בתחילת יום", sub: "כל הבוקר — רשימת התורים של היום" },
  notify_after_break: { title: "תזכורת אחרי הפסקה", sub: "התראה על התור הבא אחרי כל הפסקה" },
  notify_client_24h:  { title: "24 שעות לפני התור", sub: "תזכורת SMS ללקוחה + בקשת אישור הגעה" },
  notify_client_1h:   { title: "שעה לפני התור", sub: "תזכורת SMS אחרונה לפני ההגעה" },
};

export default function MgrSettings({ mgr }) {
  const s = mgr.studio || {};
  // Local mirror so the toggle moves instantly; persisted to DB on change.
  const [state, setState] = useState({
    notify_day_start:   s.notify_day_start ?? true,
    notify_after_break: s.notify_after_break ?? true,
    notify_client_24h:  s.notify_client_24h ?? true,
    notify_client_1h:   s.notify_client_1h ?? true,
  });

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

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
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
        <Row k="שירותים פעילים" v={`${(mgr.services || []).length || "—"}`} />
        <Row k="ערכת צבע" v="ויין · בלאש" />
      </div>

      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 6, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={mgr.logout}>
        <LogOut size={16} /> התנתקות
      </button>
    </div>
  );
}
