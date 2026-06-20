import React, { useState } from "react";
import { Search, ChevronLeft, Phone, Bell, Ban, Trash2 } from "lucide-react";
import { Avatar, Sheet, Row } from "../ui";

export default function MgrClients({ clients, setClients, ping }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const filtered = clients.filter((c) => c.name.includes(q) || c.phone.includes(q));
  const block = (id) => setClients((p) => p.map((c) => c.id === id ? { ...c, blocked: !c.blocked } : c));
  const del = (id) => { setClients((p) => p.filter((c) => c.id !== id)); ping("הלקוחה נמחקה"); setOpen(null); };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 12 }}>
      <div style={{ position: "relative" }}>
        <Search size={17} style={{ position: "absolute", insetInlineStart: 13, top: 14, color: "var(--muted)" }} />
        <input className="bf-input" style={{ paddingInlineStart: 40 }} placeholder="חיפוש לקוחה לפי שם או טלפון" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {filtered.map((c) => (
          <button key={c.id} className="bf-card" onClick={() => setOpen(c)} style={{ padding: 11, display: "flex", alignItems: "center", gap: 11, textAlign: "right", cursor: "pointer", opacity: c.blocked ? 0.55 : 1 }}>
            <Avatar name={c.name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {c.name} {c.blocked && <span className="bf-chip" style={{ background: "#F3E3E5", color: "#B23A48", marginInlineStart: 4 }}>חסומה</span>}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{c.visits} ביקורים · {c.last}</div>
            </div>
            <ChevronLeft size={18} color="var(--muted)" />
          </button>
        ))}
      </div>

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <Avatar name={open.name} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{open.name}</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{open.phone} · {open.email}</div>
            </div>
          </div>
          <div className="bf-card" style={{ padding: 12, marginBottom: 14, display: "grid", gap: 6, fontSize: 13.5 }}>
            <Row k="סך ביקורים" v={open.visits} />
            <Row k="ביקור אחרון" v={open.last} />
            <Row k="הצהרת בריאות" v="נחתמה ✓" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <a className="bf-btn bf-btn-ghost" href={`tel:${open.phone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
            <button className="bf-btn bf-btn-soft" onClick={() => ping("תזכורת נשלחה ב-WhatsApp")}><Bell size={16} /> שלחי תזכורת</button>
            <button className="bf-btn bf-btn-ghost" onClick={() => block(open.id)}><Ban size={16} /> {open.blocked ? "ביטול חסימה" : "חסימה"}</button>
            <button className="bf-btn bf-btn-ghost" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => del(open.id)}><Trash2 size={16} /> מחיקה</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
