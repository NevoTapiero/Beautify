import React, { useState } from "react";
import { ShieldCheck } from "lucide-react";
import * as api from "../lib/api";

// Shown when a password-reset email link brings her back to the app —
// replaces the normal manager/client screen until she's set a new password.
export default function ResetPasswordScreen({ studio, role, onDone, ping }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const ok = pw.length >= 6 && pw === pw2;

  const submit = async () => {
    if (!ok) return;
    setErr(null); setBusy(true);
    const r = await api.completePasswordReset(role, pw);
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    setDone(true);
    ping?.("הסיסמה עודכנה בהצלחה");
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
        <h1 className="bf-display" style={{ textAlign: "center" }}>קביעת סיסמה חדשה</h1>
        <div className="sub" style={{ textAlign: "center" }}>{role === "manager" ? "כניסת מנהלת" : studio?.name || "הסטודיו שלך"}</div>
      </div>
      <div className="bf-screen bf-pad" style={{ display: "grid", gap: 14 }}>
        {done ? (
          <div className="bf-card" style={{ padding: 18, textAlign: "center", display: "grid", gap: 10 }}>
            <ShieldCheck size={28} color="var(--plum)" style={{ justifySelf: "center" }} />
            <div style={{ fontWeight: 700 }}>הסיסמה עודכנה, ואת מחוברת עכשיו.</div>
            <button className="bf-btn bf-btn-primary" onClick={onDone}>המשך לאפליקציה</button>
          </div>
        ) : (
          <>
            <div style={{ color: "var(--muted)", fontSize: 13.5 }}>בחרי סיסמה חדשה לחשבון שלך.</div>
            <div><label className="bf-label">סיסמה חדשה (6 תווים לפחות)</label><input className="bf-input" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <div><label className="bf-label">אימות סיסמה</label><input className="bf-input" type="password" placeholder="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ok && submit()} /></div>
            {pw2 && pw !== pw2 && <div style={{ color: "#B23A48", fontSize: 12.5 }}>הסיסמאות אינן תואמות</div>}
            {err && <div style={{ background: "#FEE8E8", color: "#B23A48", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>{err}</div>}
            <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={submit}>
              <ShieldCheck size={17} /> {busy ? "שומרת…" : "שמירת הסיסמה"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
