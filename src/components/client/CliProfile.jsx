import React from "react";
import { Wallet, LogOut, Check } from "lucide-react";
import { SectionTitle, Row } from "../ui";
import { initials } from "../ui";

export default function CliProfile({ me, ping }) {
  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <div className="bf-avatar" style={{ width: 60, height: 60, fontSize: 21 }}>{initials(me.name)}</div>
        <div>
          <div className="bf-display" style={{ fontSize: 21, fontWeight: 800 }}>{me.name}</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{me.visits} ביקורים בסטודיו</div>
        </div>
      </div>
      <div className="bf-card" style={{ padding: 13, display: "grid", gap: 7, fontSize: 13.5 }}>
        <Row k="טלפון" v={me.phone} />
        <Row k="אימייל" v={me.email} />
        <Row k="הצהרת בריאות" v="נחתמה ✓" />
      </div>
      <SectionTitle icon={Wallet}>אמצעי תשלום</SectionTitle>
      <div className="bf-card" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "#0099FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>bit</div>
        <div style={{ flex: 1, fontSize: 14 }}>
          <b>תשלום מהיר בביט</b>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>מקושר למספר {me.phone}</div>
        </div>
        <span className="bf-chip bf-chip-ok"><Check size={12} /> פעיל</span>
      </div>
      <button className="bf-btn bf-btn-ghost" onClick={() => ping("התנתקת מהדמו")}><LogOut size={16} /> התנתקות</button>
    </div>
  );
}
