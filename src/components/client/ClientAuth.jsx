import React, { useState } from "react";
import { Check, ShieldCheck, LogIn } from "lucide-react";
import { Sheet, HealthDeclarationText } from "../ui";

export default function ClientAuth({ cli }) {
  const [mode, setMode] = useState("register");   // register | login
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setErr(null); setBusy(true);
    const error = await fn();
    setBusy(false);
    if (error) setErr(error);
  };

  return (
    <>
      <div className="bf-appbar" style={{ textAlign: "center" }}>
        <span className="bf-mark-badge" style={{ margin: "0 auto 8px" }}><img src="/icon-mark.png" alt="" className="bf-mark" /></span>
        <h1 className="bf-display" style={{ textAlign: "center" }}>{mode === "register" ? "הצטרפי לסטודיו" : "כניסה לחשבון"}</h1>
        <div className="sub" style={{ textAlign: "center" }}>{cli.studioName}</div>
      </div>

      <div className="bf-screen bf-pad" style={{ display: "grid", gap: 14 }}>
        <div className="bf-seg">
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setErr(null); }}>הרשמה</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setErr(null); }}>התחברות</button>
        </div>

        {err && <div style={{ background: "#FEE8E8", color: "#B23A48", borderRadius: 12, padding: "10px 14px", fontSize: 13.5, fontWeight: 600 }}>{err}</div>}

        {mode === "register"
          ? <RegisterForm cli={cli} busy={busy} run={run} />
          : <LoginForm cli={cli} busy={busy} run={run} />}
      </div>
    </>
  );
}

function LoginForm({ cli, busy, run }) {
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const ok = phone.length >= 9 && pw.length >= 6;
  return (
    <>
      <div><label className="bf-label">טלפון נייד</label><input className="bf-input" inputMode="tel" placeholder="050-0000000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div><label className="bf-label">סיסמה</label><input className="bf-input" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ok && run(() => cli.login(phone, pw))} /></div>
      <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={() => run(() => cli.login(phone, pw))}>
        <LogIn size={17} /> {busy ? "מתחברת…" : "כניסה"}
      </button>
    </>
  );
}

function RegisterForm({ cli, busy, run }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", password: "" });
  const [agree, setAgree] = useState(false);
  const [terms, setTerms] = useState(false);
  const fullName = f.name.trim().split(/\s+/).filter(Boolean).length >= 2;
  const ok = fullName && f.phone.length >= 9 && f.email.includes("@") && f.password.length >= 6 && agree;

  return (
    <>
      <div>
        <label className="bf-label">שם מלא</label>
        <input className="bf-input" placeholder="לדוגמה: נועה כהן" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {f.name.trim() && !fullName && <div style={{ fontSize: 12, color: "#B23A48", marginTop: 5, fontWeight: 600 }}>יש להזין שם פרטי ושם משפחה</div>}
      </div>
      <div><label className="bf-label">טלפון נייד</label><input className="bf-input" inputMode="tel" placeholder="050-0000000" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div><label className="bf-label">אימייל</label><input className="bf-input" inputMode="email" placeholder="name@mail.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><label className="bf-label">סיסמה (6 תווים לפחות)</label><input className="bf-input" type="password" placeholder="••••••••" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>

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

      <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={() => run(() => cli.register(f))}>
        <ShieldCheck size={17} /> {busy ? "שומרת…" : "סיום הרשמה"}
      </button>

      {terms && (
        <Sheet onClose={() => setTerms(false)}>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>תנאי שירות והצהרת בריאות</h3>
          <span className="bf-chip bf-chip-wait" style={{ marginBottom: 12 }}>טיוטה — לאישור עו״ד</span>
          <HealthDeclarationText />
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} onClick={() => { setAgree(true); setTerms(false); }}>קראתי ואני מאשרת</button>
        </Sheet>
      )}
    </>
  );
}
