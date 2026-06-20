import React, { useState } from "react";
import { Phone, Clock, X } from "lucide-react";
import { Avatar, Sheet, Row, Empty, StatusChip, resolveAppt } from "../ui";
import { next7 } from "../../data/mock";

export default function MgrCalendar({ appts, clients, cancelAppt, ping }) {
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
        {list.map((a) => {
          const r = resolveAppt(a, clients);
          return (
            <button key={a.id} className="bf-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", border: "1px solid var(--sand)" }} onClick={() => setOpen(a)}>
              <div className="bf-display" style={{ fontSize: 17, fontWeight: 800, color: "var(--plum)", minWidth: 46, textAlign: "center" }}>{a.time}</div>
              <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.svcGrad }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.clientName}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{r.svcName}</div>
              </div>
              <StatusChip a={a} />
            </button>
          );
        })}
      </div>

      {open && (() => {
        const r = resolveAppt(open, clients);
        return (
          <Sheet onClose={() => setOpen(null)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Avatar name={r.clientName} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{r.clientName}</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>{open.dayLabel} · {open.time} · {r.svcName}</div>
              </div>
            </div>
            <div className="bf-card" style={{ padding: 12, marginBottom: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
              <Row k="שירות" v={`${r.svcName} (${r.svcDur} דקות)`} />
              <Row k="מחיר" v={`₪${r.svcPrice}`} />
              <Row k="תשלום" v={open.paid ? "שולם בביט ✓" : "ישולם במקום"} />
              <Row k="אישור הגעה" v={open.arrival ? "אושר ✓" : "ממתין"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <a className="bf-btn bf-btn-ghost" href={`tel:${r.clientPhone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
              <button className="bf-btn bf-btn-soft" onClick={() => { ping("נשלחה ללקוחה בקשה להזזת התור"); setOpen(null); }}><Clock size={16} /> הזיזי תור</button>
            </div>
            <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { cancelAppt(open.id); ping("התור בוטל"); setOpen(null); }}>
              <X size={16} /> ביטול התור
            </button>
          </Sheet>
        );
      })()}
    </div>
  );
}
