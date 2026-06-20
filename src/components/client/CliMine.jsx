import React from "react";
import { CalendarDays, Clock, Check, X, CheckCircle2 } from "lucide-react";
import { SectionTitle, Empty } from "../ui";
import { svc } from "../../lib/services";
import { PAST0 } from "../../data/mock";

export default function CliMine({ appts, ME, confirmArrival, cancelAppt, ping }) {
  const mine = appts.filter((a) => a.clientId === ME).sort((x, y) => x.day - y.day || x.time.localeCompare(y.time));

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <SectionTitle icon={CalendarDays}>תורים קרובים</SectionTitle>
      {mine.length === 0 && <Empty>אין לך תורים קרובים — קבעי תור חדש 🤍</Empty>}
      <div style={{ display: "grid", gap: 11 }}>
        {mine.map((a) => {
          const s = svc(a.service);
          return (
            <div key={a.id} className="bf-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 13 }}>
                <div style={{ textAlign: "center", minWidth: 50 }}>
                  <div className="bf-display" style={{ fontSize: 18, fontWeight: 800, color: "var(--plum)" }}>{a.time}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>{a.dayLabel}</div>
                </div>
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: s?.grad, minHeight: 38 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s?.name}</div>
                  <div style={{ fontSize: 12.5, color: "var(--muted)" }}>הסטודיו של דנה · ₪{s?.price}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, padding: "0 13px 13px" }}>
                {a.arrival
                  ? <button className="bf-btn bf-btn-soft bf-btn-sm" disabled style={{ flex: 1, opacity: 1 }}><CheckCircle2 size={15} /> הגעה אושרה</button>
                  : <button className="bf-btn bf-btn-primary bf-btn-sm" style={{ flex: 1 }} onClick={() => { confirmArrival(a.id); ping("אישרת הגעה — נתראה!"); }}><Check size={15} /> אישור הגעה</button>}
                <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => { cancelAppt(a.id); ping("התור בוטל"); }}><X size={15} /> ביטול</button>
              </div>
            </div>
          );
        })}
      </div>

      <SectionTitle icon={Clock}>היסטוריה</SectionTitle>
      <div style={{ display: "grid", gap: 9 }}>
        {PAST0.map((a) => {
          const s = svc(a.service);
          return (
            <div key={a.id} className="bf-card" style={{ padding: 11, display: "flex", alignItems: "center", gap: 11, opacity: 0.8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: s?.grad, flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s?.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.dateLabel}</div>
              </div>
              <span className="bf-chip bf-chip-ok"><Check size={12} /> הושלם</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
