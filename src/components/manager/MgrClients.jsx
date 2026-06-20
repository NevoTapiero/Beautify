import React, { useState } from "react";
import { Search, ChevronLeft, Phone, Ban, Trash2 } from "lucide-react";
import { Avatar, Sheet, Row, Empty } from "../ui";

export default function MgrClients({ mgr }) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("active");
  const [open, setOpen] = useState(null);

  const all = mgr.clients.filter((c) => (c.name || "").includes(q) || (c.phone || "").includes(q));
  const list = all.filter((c) => seg === "blocked" ? c.blocked : !c.blocked);
  const blockedCount = mgr.clients.filter((c) => c.blocked).length;

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <Search size={17} style={{ position: "absolute", insetInlineStart: 13, top: 14, color: "var(--muted)" }} />
        <input className="bf-input" style={{ paddingInlineStart: 40 }} placeholder="חיפוש לקוחה לפי שם או טלפון" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="bf-seg">
        <button className={seg === "active" ? "active" : ""} onClick={() => setSeg("active")}>פעילות ({mgr.clients.length - blockedCount})</button>
        <button className={seg === "blocked" ? "active" : ""} onClick={() => setSeg("blocked")}>חסומות ({blockedCount})</button>
      </div>

      {list.length === 0 && <Empty>{seg === "blocked" ? "אין לקוחות חסומות" : "אין עדיין לקוחות רשומות"}</Empty>}

      <div style={{ display: "grid", gap: 9 }}>
        {list.map((c) => (
          <button key={c.id} className="bf-card" onClick={() => setOpen(c)} style={{ padding: 11, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", opacity: c.blocked ? 0.6 : 1 }}>
            <Avatar name={c.name} src={c.avatar} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {c.name} {c.blocked && <span className="bf-chip" style={{ background: "#F3E3E5", color: "#B23A48", marginInlineStart: 4 }}>חסומה</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.phone}</div>
            </div>
            <ChevronLeft size={18} color="var(--muted)" />
          </button>
        ))}
      </div>

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar name={open.name} src={open.avatar} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{open.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{open.phone}{open.email ? ` · ${open.email}` : ""}</div>
            </div>
          </div>
          <div className="bf-card" style={{ padding: 12, marginBottom: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
            <Row k="טלפון" v={open.phone} />
            <Row k="אימייל" v={open.email || "—"} />
            <Row k="הצהרת בריאות" v="נחתמה ✓" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <a className="bf-btn bf-btn-ghost" href={`tel:${open.phone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
            <button className="bf-btn bf-btn-ghost" onClick={() => { mgr.blockClient(open); setOpen(null); }}><Ban size={16} /> {open.blocked ? "ביטול חסימה" : "חסימה"}</button>
          </div>
          <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10, color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { mgr.deleteClient(open.id); setOpen(null); }}>
            <Trash2 size={16} /> מחיקת לקוחה
          </button>
        </Sheet>
      )}
    </div>
  );
}
