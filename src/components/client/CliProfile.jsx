import React, { useState } from "react";
import { Wallet, LogOut, Pencil, Camera } from "lucide-react";
import { SectionTitle, Row, Sheet, Avatar, PhotoPicker } from "../ui";

export default function CliProfile({ cli }) {
  const me = cli.client;
  const [edit, setEdit] = useState(false);

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <PhotoPicker onPick={(f) => cli.uploadAvatar(f)}>
          <button style={{ position: "relative", border: "none", background: "none", padding: 0, cursor: "pointer", borderRadius: "50%" }}>
            <Avatar name={me.name} src={me.avatar_url} />
            <span style={{ position: "absolute", insetInlineEnd: -2, bottom: -2, width: 22, height: 22, borderRadius: "50%", background: "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
              <Camera size={11} color="#fff" />
            </span>
          </button>
        </PhotoPicker>
        <div style={{ flex: 1 }}>
          <div className="bf-display" style={{ fontSize: 21, fontWeight: 800 }}>{me.name}</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>{me.phone}</div>
        </div>
        <button className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => setEdit(true)}><Pencil size={14} /> עריכה</button>
      </div>

      <div className="bf-card" style={{ padding: 13, display: "grid", gap: 7, fontSize: 13.5 }}>
        <Row k="טלפון" v={me.phone} />
        <Row k="אימייל" v={me.email || "—"} />
        <Row k="הצהרת בריאות" v="נחתמה ✓" />
      </div>

      <SectionTitle icon={Wallet}>אמצעי תשלום</SectionTitle>
      <div className="bf-card" style={{ padding: 13, display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: "#0099FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>bit</div>
        <div style={{ flex: 1, fontSize: 14 }}>
          <b>תשלום מהיר בביט</b>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>חיבור אמיתי לביט יתווסף בקרוב</div>
        </div>
        <span className="bf-chip bf-chip-wait">בקרוב</span>
      </div>

      <button className="bf-btn bf-btn-ghost" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={cli.logout}>
        <LogOut size={16} /> התנתקות
      </button>

      {edit && <EditSheet cli={cli} me={me} onClose={() => setEdit(false)} />}
    </div>
  );
}

function EditSheet({ cli, me, onClose }) {
  const [f, setF] = useState({ name: me.name, phone: me.phone, email: me.email || "" });
  const [busy, setBusy] = useState(false);
  const ok = f.name && f.phone.length >= 9;

  const save = async () => {
    setBusy(true);
    await cli.updateProfile({ name: f.name, phone: f.phone, email: f.email });
    setBusy(false); onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 14px", fontSize: 20 }}>עריכת פרטים</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label className="bf-label">שם מלא</label><input className="bf-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="bf-label">טלפון נייד</label><input className="bf-input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div><label className="bf-label">אימייל</label><input className="bf-input" inputMode="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <button className="bf-btn bf-btn-primary" disabled={!ok || busy} onClick={save}>{busy ? "שומרת…" : "שמירה"}</button>
      </div>
    </Sheet>
  );
}
