import React, { useState } from "react";
import { Phone, Clock, X, Check, XCircle, FileText } from "lucide-react";
import { Avatar, Sheet, Row, Confirm, resolveAppt } from "../ui";

// Manager's appointment detail card — shared by Home and Calendar.
export default function ApptSheet({ appt, mgr, onClose }) {
  const r = resolveAppt(appt);
  const done = appt.status === "completed" || appt.status === "no_show";
  // Can only mark done / no-show once the appointment time has passed (note 21).
  const passed = appt.starts_at ? new Date(appt.starts_at) <= new Date() : false;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const doInvoice = async () => { const inv = await mgr.issueInvoice(appt); if (inv) setInvoice(inv); };
  const InvoiceBtn = () => mgr.business ? (
    <button className="bf-btn bf-btn-soft" style={{ marginTop: 10 }} onClick={doInvoice}><FileText size={16} /> הפקת חשבונית</button>
  ) : null;

  // After an appointment is completed / marked no-show, it's read-only —
  // details + call only, no reschedule/cancel/reminder (V6 note 38).
  if (done) return (
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
        <Row k="תשלום" v={appt.paid ? "שולם ✓" : "ישולם במקום"} />
        {appt.employeeName && <Row k="קוסמטיקאית" v={appt.employeeName} />}
        <Row k="סטטוס" v={appt.status === "completed" ? "בוצע ✓" : "לא הגיעה"} />
      </div>
      <a className="bf-btn bf-btn-ghost" href={`tel:${r.clientPhone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
      <InvoiceBtn />
      {invoice && <InvoiceSheet invoice={invoice} studioName={mgr.studioName} onClose={() => setInvoice(null)} />}
    </Sheet>
  );

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
        <Row k="תשלום" v={appt.paid ? "שולם ✓" : "ישולם במקום"} />
        <Row k="אישור הגעה" v={appt.arrival ? "אושר ✓" : "ממתין"} />
        {appt.employeeName && <Row k="קוסמטיקאית" v={appt.employeeName} />}
      </div>

      {/* Mark completed / no-show — only after the appointment time passed (notes 38, 21) */}
      {passed ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <button className="bf-btn bf-btn-soft" onClick={() => { mgr.setStatus(appt.id, "completed"); onClose(); }}><Check size={16} /> בוצע</button>
          <button className="bf-btn bf-btn-ghost" onClick={() => { mgr.setStatus(appt.id, "no_show"); onClose(); }}><XCircle size={16} /> לא הגיעה</button>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--muted)", textAlign: "center", marginBottom: 10, padding: "8px 0" }}>
          ניתן לסמן "בוצע" או "לא הגיעה" רק לאחר מועד התור
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <a className="bf-btn bf-btn-ghost" href={`tel:${r.clientPhone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
        <button className="bf-btn bf-btn-soft" onClick={() => { mgr.requestReschedule(appt); onClose(); }}><Clock size={16} /> הזיזי תור</button>
      </div>

      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} onClick={() => { mgr.sendReminder(appt); onClose(); }}>
        שליחת תזכורת ללקוחה
      </button>
      <InvoiceBtn />

      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => setConfirmCancel(true)}>
        <X size={16} /> ביטול התור
      </button>

      {invoice && <InvoiceSheet invoice={invoice} studioName={mgr.studioName} onClose={() => setInvoice(null)} />}
      {confirmCancel && (
        <Confirm
          title="לבטל את התור?"
          body={`התור של ${r.clientName} ל${appt.dayLabel} בשעה ${appt.time} יבוטל ותישלח ללקוחה הודעה.`}
          confirmLabel="כן, בטלי את התור" danger
          onConfirm={() => { mgr.cancelAppt(appt); onClose(); }}
          onClose={() => setConfirmCancel(false)}
        />
      )}
    </Sheet>
  );
}

// A simple generated invoice (business edition). Real tax invoices come from a
// provider later; this is a numbered, printable record.
function InvoiceSheet({ invoice, studioName, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
        <FileText size={20} color="var(--plum)" />
        <h3 className="bf-display" style={{ margin: 0, fontSize: 20 }}>חשבונית #{invoice.number}</h3>
      </div>
      <div className="bf-card" style={{ padding: 14, display: "grid", gap: 8, fontSize: 13.5 }}>
        <Row k="עסק" v={studioName} />
        <Row k="לקוחה" v={invoice.client_name || "—"} />
        <Row k="שירות" v={invoice.service_name || "—"} />
        <Row k="תאריך" v={new Date(invoice.issued_at).toLocaleDateString("he-IL")} />
        <div style={{ borderTop: "1px solid var(--sand)", marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700 }}>סה״כ לתשלום</span>
          <span className="bf-display" style={{ fontSize: 22, fontWeight: 800, color: "var(--plum)" }}>₪{invoice.amount}</span>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "10px 2px", lineHeight: 1.6 }}>
        מסמך זה הוא אסמכתה פנימית. חשבונית מס רשמית תופק דרך ספק חשבוניות לאחר חיבור החשבון.
      </div>
      <button className="bf-btn bf-btn-soft" onClick={() => window.print()}>הדפסה / שמירה כ-PDF</button>
      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} onClick={onClose}>סגירה</button>
    </Sheet>
  );
}
