import React from "react";
import { Phone, Clock, X, Check, XCircle } from "lucide-react";
import { Avatar, Sheet, Row, resolveAppt } from "../ui";

// Manager's appointment detail card — shared by Home and Calendar.
export default function ApptSheet({ appt, mgr, onClose }) {
  const r = resolveAppt(appt);
  const done = appt.status === "completed" || appt.status === "no_show";
  // Can only mark done / no-show once the appointment time has passed (note 21).
  const passed = appt.starts_at ? new Date(appt.starts_at) <= new Date() : false;

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <Avatar name={r.clientName} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{r.clientName}</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{appt.dayLabel} · {appt.time} · {r.svcName}</div>
        </div>
      </div>

      <div className="bf-card" style={{ padding: 12, marginBottom: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
        <Row k="שירות" v={`${r.svcName} (${r.svcDur} דקות)`} />
        <Row k="מחיר" v={`₪${r.svcPrice}`} />
        <Row k="תשלום" v={appt.paid ? "שולם בביט ✓" : "ישולם במקום"} />
        <Row k="אישור הגעה" v={appt.arrival ? "אושר ✓" : "ממתין"} />
        {done && <Row k="סטטוס" v={appt.status === "completed" ? "בוצע ✓" : "לא הגיעה"} />}
      </div>

      {/* Mark completed / no-show — only after the appointment time passed (notes 38, 21) */}
      {!done && (passed ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <button className="bf-btn bf-btn-soft" onClick={() => { mgr.setStatus(appt.id, "completed"); onClose(); }}><Check size={16} /> בוצע</button>
          <button className="bf-btn bf-btn-ghost" onClick={() => { mgr.setStatus(appt.id, "no_show"); onClose(); }}><XCircle size={16} /> לא הגיעה</button>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", marginBottom: 10, padding: "8px 0" }}>
          ניתן לסמן "בוצע" או "לא הגיעה" רק לאחר מועד התור
        </div>
      ))}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <a className="bf-btn bf-btn-ghost" href={`tel:${r.clientPhone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
        <button className="bf-btn bf-btn-soft" onClick={() => { mgr.requestReschedule(appt); onClose(); }}><Clock size={16} /> הזיזי תור</button>
      </div>

      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} onClick={() => { mgr.sendReminder(appt); onClose(); }}>
        שליחת תזכורת ללקוחה
      </button>
      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { mgr.cancelAppt(appt); onClose(); }}>
        <X size={16} /> ביטול התור
      </button>
    </Sheet>
  );
}
