import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Sheet } from "../ui";

export default function ManagerLogin({ onLogin, onRequestReset, studio }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);

  const submit = async () => {
    setErr(null); setLoading(true);
    const error = await onLogin(email, pw);
    setLoading(false);
    if (error) setErr(error);
  };

  return (
    <>
      <div className="bf-appbar" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 8 }}>
          <span className="bf-mark-badge">
            {studio?.logo_url
              ? <img src={studio.logo_url} alt="" style={{ width: "100%", height: "100%", borderRadius: 14, objectFit: "cover" }} />
              : <img src="/icon-mark.png" alt="" className="bf-mark" />}
          </span>
          <span className="bf-display bf-wordmark">{studio?.brand_name || "Beautify"}</span>
        </div>
        <h1 className="bf-display" style={{ textAlign: "center" }}>כניסת מנהלת</h1>
        <div className="sub" style={{ textAlign: "center" }}>{studio?.name || "הסטודיו שלך מחכה לך"}</div>
      </div>
      <div className="bf-screen bf-pad" style={{ display: "grid", gap: 14 }}>
        <div>
          <label className="bf-label">אימייל</label>
          <input className="bf-input" inputMode="email" placeholder="dana@studio.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="bf-label">סיסמה</label>
          <input className="bf-input" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !loading && email && pw) submit(); }} />
        </div>
        {err && (
          <div style={{ background: "#FEE8E8", color: "#B23A48", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>
            {err}
          </div>
        )}
        <button className="bf-btn bf-btn-primary" disabled={!email || !pw || loading} onClick={submit}>
          <ShieldCheck size={17} /> {loading ? "נכנסת…" : "כניסה"}
        </button>
        <button onClick={() => setForgot(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12.5, textDecoration: "underline", justifySelf: "center", padding: "2px 0" }}>
          שכחת סיסמה?
        </button>
      </div>
      {forgot && <ForgotPasswordSheet onRequestReset={onRequestReset} initialEmail={email} onClose={() => setForgot(false)} />}
    </>
  );
}

function ForgotPasswordSheet({ onRequestReset, initialEmail, onClose }) {
  const [email, setEmail] = useState(initialEmail || "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);

  const send = async () => {
    setBusy(true); setErr(null);
    const r = await onRequestReset(email);
    setBusy(false);
    if (r?.error) setErr(r.error); else setSent(true);
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>איפוס סיסמה</h3>
      {!sent ? (
        <>
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>נשלח לינק לאיפוס סיסמה לכתובת האימייל שלך.</div>
          <label className="bf-label">אימייל</label>
          <input className="bf-input" inputMode="email" placeholder="dana@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {err && <div style={{ color: "#B23A48", fontSize: 12.5, marginTop: 8 }}>{err}</div>}
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={!email.includes("@") || busy} onClick={send}>
            {busy ? "שולחת…" : "שליחת לינק לאיפוס"}
          </button>
        </>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="bf-card" style={{ padding: 14, fontSize: 13.5 }}>נשלח אימייל עם לינק לאיפוס הסיסמה, אם קיים חשבון עם כתובת זו.</div>
          <button className="bf-btn bf-btn-ghost" onClick={onClose}>סגירה</button>
        </div>
      )}
    </Sheet>
  );
}
