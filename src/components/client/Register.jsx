import React, { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Sheet } from "../ui";

export default function Register({ onDone }) {
  const [f, setF] = useState({ name: "", phone: "", email: "" });
  const [agree, setAgree] = useState(false);
  const [terms, setTerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const ok = f.name && f.phone.length >= 9 && f.email.includes("@") && agree;

  const handleSubmit = async () => {
    setSaving(true);
    await onDone({ name: f.name, phone: f.phone, email: f.email });
    setSaving(false);
  };

  return (
    <>
      <div className="bf-appbar" style={{ textAlign: "center" }}>
        <span className="bf-mark" style={{ margin: "0 auto 8px" }} />
        <h1 className="bf-display" style={{ textAlign: "center" }}>הצטרפי לסטודיו</h1>
        <div className="sub" style={{ textAlign: "center" }}>הרשמה מהירה — וכבר אפשר לקבוע תור</div>
      </div>
      <div className="bf-screen bf-pad" style={{ display: "grid", gap: 14 }}>
        <div><label className="bf-label">שם מלא</label><input className="bf-input" placeholder="לדוגמה: נועה כהן" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="bf-label">טלפון נייד</label><input className="bf-input" inputMode="tel" placeholder="050-0000000" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="bf-label">אימייל</label><input className="bf-input" inputMode="email" placeholder="name@mail.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>

        <button onClick={() => setAgree(!agree)} className="bf-card" style={{ padding: 13, display: "flex", gap: 11, alignItems: "flex-start", textAlign: "right", cursor: "pointer", border: agree ? "1px solid var(--rose)" : "1px solid var(--sand)" }}>
          <span style={{ width: 22, height: 22, borderRadius: 7, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: agree ? "linear-gradient(135deg,var(--plum),var(--rose))" : "#fff", border: agree ? "none" : "1px solid var(--sand)" }}>
            {agree && <Check size={15} color="#fff" />}
          </span>
          <span style={{ fontSize: 13, lineHeight: 1.5 }}>
            קראתי ואני מאשרת את{" "}
            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); setTerms(true); }} onKeyDown={(e) => e.key === "Enter" && setTerms(true)} style={{ color: "var(--plum)", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
              תנאי השירות והצהרת הבריאות
            </span>
          </span>
        </button>

        <button className="bf-btn bf-btn-primary" disabled={!ok || saving} onClick={handleSubmit}>
          <ShieldCheck size={17} /> {saving ? "שומרת…" : "סיום הרשמה"}
        </button>
      </div>

      {terms && (
        <Sheet onClose={() => setTerms(false)}>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>תנאי שירות והצהרת בריאות</h3>
          <span className="bf-chip bf-chip-wait" style={{ marginBottom: 12 }}>טיוטה — לאישור עו״ד</span>
          <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "#5b4a52", display: "grid", gap: 8 }}>
            <p>אני מאשרת קבלת טיפולי קוסמטיקה בסטודיו ומצהירה כי איני סובלת ממצב רפואי, אלרגיה או רגישות העלולים להשפיע על הטיפול, ואם קיים — עדכנתי על כך מראש.</p>
            <p>ידוע לי כי ביטול תור ייעשה עד 24 שעות מראש, וכי באי-הגעה ללא הודעה הסטודיו רשאי לגבות דמי ביטול בהתאם למדיניות.</p>
            <p>אני מאשרת שמירת פרטי ההתקשרות והיסטוריית הטיפולים שלי לצורך מתן השירות, בהתאם למדיניות הפרטיות.</p>
            <p>שיתוף תמונות בגלריה ייעשה רק באישורי המפורש ובאישור הסטודיו.</p>
          </div>
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} onClick={() => { setAgree(true); setTerms(false); }}>קראתי ואני מאשרת</button>
        </Sheet>
      )}
    </>
  );
}
