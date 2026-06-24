import React, { useState, useEffect } from "react";
import { Coffee, Trash2 } from "lucide-react";
import { Empty, StatusChip, resolveAppt } from "../ui";

const hhmm = (t) => (t || "").slice(0, 5);
const toMin = (t) => { const [h, m] = hhmm(t).split(":").map(Number); return h * 60 + m; };

// Renders a single day as a full timeline of 30-minute slots — each slot is an
// appointment, a break, or free — and highlights the nearest upcoming
// appointment with a live countdown (V6 notes 35-37, reused on Home note 30).
export default function DaySchedule({ effective, dayAppts, dayBreaks, allAppts, onOpenAppt, onDeleteBreak }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const nextAppt = (allAppts || [])
    .filter((a) => a.status === "confirmed" && a.starts_at && new Date(a.starts_at) > now)
    .sort((x, y) => new Date(x.starts_at) - new Date(y.starts_at))[0] || null;
  const untilText = (startsAt) => {
    const mins = Math.round((new Date(startsAt) - now) / 60000);
    if (mins < 60) return `בעוד ${mins} דק׳`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return `בעוד ${h} שע׳${m ? ` ${m} דק׳` : ""}`;
  };

  const dayOpen = effective && effective.is_open;
  if (!dayOpen) return <Empty>הסטודיו סגור ביום זה</Empty>;

  const slots = [];
  const o = toMin(effective.start_time), c = toMin(effective.end_time);
  for (let m = o; m < c; m += 30) {
    const appt = dayAppts.find((a) => toMin(a.time) >= m && toMin(a.time) < m + 30);
    const cover = dayAppts.find((a) => toMin(a.time) < m && toMin(a.time) + a.serviceDur > m);
    const brk = dayBreaks.find((b) => toMin(b.time) < m + 30 && toMin(b.endTime) > m);
    slots.push({ min: m, label: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, appt, cover, brk });
  }

  const timeCell = (label, color = "var(--muted)") => (
    <div className="bf-display" style={{ fontSize: 14, fontWeight: 800, color, minWidth: 44, textAlign: "center" }}>{label}</div>
  );

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {slots.map((sl) => {
        if (sl.brk && !sl.appt) return (
          <div key={sl.min} className="bf-card" style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 10, background: "#FBF4EE", borderStyle: "dashed" }}>
            {timeCell(sl.label)}
            <Coffee size={15} color="var(--gold)" />
            <div style={{ flex: 1, fontWeight: 700, fontSize: 13.5, color: "#8A6D3B" }}>{sl.brk.title} · עד {sl.brk.endTime}</div>
            {onDeleteBreak && toMin(sl.brk.time) >= sl.min && (
              <button onClick={() => onDeleteBreak(sl.brk.id)} aria-label="מחק הפסקה" style={{ background: "none", border: "none", cursor: "pointer", color: "#B6896A" }}><Trash2 size={15} /></button>
            )}
          </div>
        );

        if (sl.appt) {
          const a = sl.appt, r = resolveAppt(a);
          const ghost = a.status === "reschedule_requested";
          const isNext = nextAppt && a.id === nextAppt.id;
          return (
            <button key={sl.min} className="bf-card" onClick={() => onOpenAppt(a)}
              style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 10, textAlign: "right", cursor: "pointer", opacity: ghost ? 0.55 : 1,
                border: isNext ? "1.5px solid var(--plum)" : "1px solid var(--sand)", background: isNext ? "linear-gradient(135deg,#FDF3F6,#fff)" : undefined }}>
              {timeCell(a.time, "var(--plum)")}
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.svcGrad, minHeight: 30 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.clientName}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.svcName} · {a.serviceDur} דק׳</div>
                {isNext && <div style={{ fontSize: 11.5, color: "var(--plum)", fontWeight: 800, marginTop: 2 }}>⏱ התור הקרוב · {untilText(a.starts_at)}</div>}
              </div>
              <StatusChip a={a} />
            </button>
          );
        }

        if (sl.cover) return (
          <div key={sl.min} className="bf-card" style={{ padding: "7px 11px", display: "flex", alignItems: "center", gap: 10, opacity: 0.5 }}>
            {timeCell(sl.label)}
            <div style={{ flex: 1, fontSize: 12.5, color: "var(--muted)" }}>תפוס</div>
          </div>
        );

        return (
          <div key={sl.min} style={{ padding: "7px 11px", display: "flex", alignItems: "center", gap: 10, border: "1px dashed var(--sand)", borderRadius: 12 }}>
            {timeCell(sl.label)}
            <div style={{ flex: 1, fontSize: 12.5, color: "var(--muted)" }}>פנוי</div>
          </div>
        );
      })}
    </div>
  );
}
