import React, { useState } from "react";
import { Check, ShieldCheck, LogIn } from "lucide-react";
import { Sheet, HealthDeclarationText } from "../ui";

export default function ClientAuth({ cli, onManagerEntry }) {
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginBottom: 8 }}>
          <span className="bf-mark-badge">
            {cli.studio?.logo_url
              ? <img src={cli.studio.logo_url} alt="" style={{ width: "100%", height: "100%", borderRadius: 14, objectFit: "cover" }} />
              : <img src="/icon-mark.png" alt="" className="bf-mark" />}
          </span>
          <span className="bf-display bf-wordmark">{cli.studio?.brand_name || "Beautify"}</span>
        </div>
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

        {onManagerEntry && (
          <button onClick={onManagerEntry} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, textDecoration: "underline", justifySelf: "center", padding: "6px 0" }}>
            בעלת הסטודיו? כניסה לניהול
          </button>
        )}
      </div>
    </>
  );
}

function LoginForm({ cli, busy, run }) {
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [forgot, setForgot] = useState(false);
  const ok = phone.length >= 9 && pw.length >= 6;
  return (
    <>
      <div><label className="bf-label">טלפון נייד</label><input className="bf-input" inputMode="tel" placeholder="050-0000000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div><label className="bf-label">סיסמה</label><input className="bf-input" type="password" placeholder="••••••••" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ok && run(() => cli.login(phone, pw))} /></div>
      <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={() => run(() => cli.login(phone, pw))}>
        <LogIn size={17} /> {busy ? "מתחברת…" : "כניסה"}
      </button>
      <button onClick={() => setForgot(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12.5, textDecoration: "underline", justifySelf: "center", padding: "2px 0" }}>
        שכחת סיסמה?
      </button>
      {forgot && <ForgotPasswordSheet cli={cli} initialPhone={phone} onClose={() => setForgot(false)} />}
    </>
  );
}

function ForgotPasswordSheet({ cli, initialPhone, onClose }) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);   // { ok, needsMigrationHint } | { error }

  const send = async () => {
    setBusy(true);
    const r = await cli.requestPasswordReset(phone);
    setBusy(false);
    setResult(r);
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 20 }}>איפוס סיסמה</h3>
      {!result?.ok ? (
        <>
          <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>נשלח לינק לאיפוס סיסמה לכתובת האימייל שרשמת בהרשמה.</div>
          <label className="bf-label">טלפון נייד</label>
          <input className="bf-input" inputMode="tel" placeholder="050-0000000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {result?.error && <div style={{ color: "#B23A48", fontSize: 12.5, marginTop: 8 }}>{result.error}</div>}
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 16 }} disabled={phone.length < 9 || busy} onClick={send}>
            {busy ? "שולחת…" : "שליחת לינק לאיפוס"}
          </button>
        </>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          <div className="bf-card" style={{ padding: 14, fontSize: 13.5 }}>נשלח אימייל עם לינק לאיפוס הסיסמה, אם קיים חשבון עם מספר טלפון זה.</div>
          {result.needsMigrationHint && (
            <div className="bf-card" style={{ padding: 14, fontSize: 12.5, color: "var(--muted)", background: "#FBF4EE", borderStyle: "dashed" }}>
              אם זהו חשבון ותיק ולא קיבלת מייל — התחברי פעם אחת עם הסיסמה הישנה שלך, ולאחר מכן איפוס הסיסמה יעבוד. אפשר גם לפנות לסטודיו.
            </div>
          )}
          <button className="bf-btn bf-btn-ghost" onClick={onClose}>סגירה</button>
        </div>
      )}
    </Sheet>
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
          {agree && <Check size={15} color="var(--btn-ink)" />}
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
