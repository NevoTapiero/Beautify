import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function ManagerLogin({ onLogin, studio }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null); setLoading(true);
    const error = await onLogin(email, pw);
    setLoading(false);
    if (error) setErr(error);
  };

  return (
    <>
      <div className="bf-appbar" style={{ textAlign: "center" }}>
        <span className="bf-mark-badge" style={{ margin: "0 auto 8px" }}>
          {studio?.logo_url
            ? <img src={studio.logo_url} alt="" style={{ width: "100%", height: "100%", borderRadius: 14, objectFit: "cover" }} />
            : <img src="/icon-mark.png" alt="" className="bf-mark" />}
        </span>
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
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        {err && (
          <div style={{ background: "#FEE8E8", color: "#B23A48", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>
            {err}
          </div>
        )}
        <button className="bf-btn bf-btn-primary" disabled={!email || !pw || loading} onClick={submit}>
          <ShieldCheck size={17} /> {loading ? "נכנסת…" : "כניסה"}
        </button>
      </div>
    </>
  );
}
