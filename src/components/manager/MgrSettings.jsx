import React, { useState } from "react";
import { Bell, Users, Sparkles, LogOut } from "lucide-react";
import { SectionTitle, Row } from "../ui";
import { SERVICES } from "../../data/mock";

export default function MgrSettings({ ping, onLogout }) {
  const [s, setS] = useState({ dayStart: true, afterBreak: true, c24: true, c1: true });
  const tog = (k) => setS((p) => { const n = { ...p, [k]: !p[k] }; ping("ההגדרה נשמרה"); return n; });

  const Toggle = ({ on, set, title, sub }) => (
    <div className="bf-card" style={{ padding: "13px 14px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{sub}</div>
      </div>
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
      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 6, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={onLogout}>
        <LogOut size={16} /> התנתקות
      </button>
    </div>
  );
}
