import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, Phone, Ban, Trash2, Check, Users } from "lucide-react";
import { Avatar, Sheet, Row, Empty, Confirm } from "../ui";
import { loadClientHistory } from "../../lib/api";
import { getSeen, setSeen } from "../../lib/seen";

export default function MgrClients({ mgr }) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("active");
  const [open, setOpen] = useState(null);
  const [history, setHistory] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  // How many clients are new since the last visit to this screen (note 42).
  // Captured once on entry, then marked as seen so the banner — and the nav
  // badge that shares this key — disappear next time.
  const sid = mgr.studio?.id;
  const [newOnEntry] = useState(() => Math.max(0, mgr.clients.length - getSeen(sid, "mgr-clients")));
  useEffect(() => { setSeen(sid, "mgr-clients", mgr.clients.length); }, [sid, mgr.clients.length]);

  // Load the selected client's visit history (note 33).
  useEffect(() => {
    setConfirmDelete(false);
    setBusy(false);
    if (!open) { setHistory(null); return; }
    let active = true;
    loadClientHistory(open.id).then((h) => { if (active) setHistory(h); });
    return () => { active = false; };
  }, [open]);

  const visits = (history || []).filter((a) => a.past).length;

  const all = mgr.clients.filter((c) => (c.name || "").includes(q) || (c.phone || "").includes(q));
  const list = all.filter((c) => seg === "blocked" ? c.blocked : !c.blocked);
  const blockedCount = mgr.clients.filter((c) => c.blocked).length;

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 12 }}>
      {/* New-signups alert — only when there are new ones, and it clears after
          this visit (note 42). The total count lives in the header subtitle. */}
      {newOnEntry > 0 && (
        <div className="bf-card" style={{ padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#FDF3F6,#fff)", border: "1px solid var(--rose-soft)" }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,var(--plum),var(--rose))", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Users size={17} color="var(--btn-ink)" />
          </span>
          <div style={{ fontSize: 13.5 }}>
            <b>{newOnEntry}</b> {newOnEntry === 1 ? "לקוחה חדשה נרשמה" : "לקוחות חדשות נרשמו"} מאז הביקור האחרון
          </div>
        </div>
      )}

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
            <Row k="סך ביקורים" v={history === null ? "…" : visits} />
          </div>

          {/* Upcoming appointments (note 43) — not the past history. */}
          {history !== null && (() => {
            const upcoming = history.filter((a) => !a.past && a.status !== "completed" && a.status !== "no_show")
              .sort((x, y) => (x.when + x.time).localeCompare(y.when + y.time));
            return (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 7 }}>תורים עתידיים</div>
                {upcoming.length === 0
                  ? <div className="bf-card" style={{ padding: 12, textAlign: "center", color: "var(--muted)", fontSize: 12.5, borderStyle: "dashed" }}>אין תורים עתידיים</div>
                  : (
                    <div style={{ display: "grid", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                      {upcoming.map((a) => (
                        <div key={a.id} className="bf-card" style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700 }}>{a.service || "תור"}</div>
                            <div style={{ color: "var(--muted)", fontSize: 12 }}>{a.when} · {a.time}{a.price ? ` · ₪${a.price}` : ""}</div>
                          </div>
                          <span className="bf-chip bf-chip-rose">קרוב</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            );
          })()}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <a className="bf-btn bf-btn-ghost" href={`tel:${open.phone}`} style={{ textDecoration: "none" }}><Phone size={16} /> התקשרי</a>
            <button className="bf-btn bf-btn-ghost" disabled={busy} onClick={() => { if (busy) return; setBusy(true); mgr.blockClient(open); setOpen(null); }}><Ban size={16} /> {open.blocked ? "ביטול חסימה" : "חסימה"}</button>
          </div>
          <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10, color: "#B23A48", borderColor: "#F0CBD0" }} disabled={busy} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} /> מחיקת לקוחה
          </button>
          {confirmDelete && (
            <Confirm
              title="למחוק את הלקוחה?"
              body={`הפעולה תמחק לצמיתות את ${open.name} כולל חשבון ההתחברות שלה. לא ניתן לבטל.`}
              confirmLabel="כן, מחקי לצמיתות" danger
              onConfirm={() => { if (busy) return; setBusy(true); mgr.deleteClient(open.id); setOpen(null); }}
              onClose={() => setConfirmDelete(false)}
            />
          )}
        </Sheet>
      )}
    </div>
  );
}
