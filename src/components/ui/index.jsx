import React, { useState, useRef } from "react";
import { Heart, Clock, CheckCircle2, Bell, ChevronRight, Check, X, ShieldCheck, XCircle } from "lucide-react";
import { svc } from "../../lib/services";

export const initials = (n) => (n || "").split(" ").map((w) => w[0]).slice(0, 2).join("");

export function Avatar({ name, src }) {
  if (src) return <img className="bf-avatar" src={src} alt={name} style={{ objectFit: "cover" }} />;
  return <div className="bf-avatar">{initials(name)}</div>;
}

// Status of an appointment from the manager's view (note 32 — no "awaiting approval").
export function StatusChip({ a }) {
  if (a.status === "completed") return <span className="bf-chip bf-chip-ok"><Check size={12} /> בוצע</span>;
  if (a.status === "no_show")   return <span className="bf-chip" style={{ background: "#F3E3E5", color: "#B23A48" }}><XCircle size={12} /> לא הגיעה</span>;
  if (a.arrival)                return <span className="bf-chip bf-chip-ok"><CheckCircle2 size={12} /> אישרה הגעה</span>;
  return <span className="bf-chip bf-chip-rose"><Bell size={12} /> טרם אישרה</span>;
}

export function PaidChip({ paid }) {
  return paid
    ? <span className="bf-chip bf-chip-ok"><Check size={12} /> שולם</span>
    : <span className="bf-chip bf-chip-wait"><Clock size={12} /> לא שולם</span>;
}

export function GalleryTile({ item, onLike, onOpen }) {
  return (
    <div className="bf-tile" style={{ background: item.img ? `url(${item.img}) center/cover` : item.grad }} onClick={() => onOpen?.(item)}>
      <span className="glow" />
      <span className="cap">
        <span>{item.cap}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onLike?.(item); }}
          aria-label="לייק"
          style={{ background: "none", border: "none", cursor: onLike ? "pointer" : "default", color: "#fff", display: "inline-flex", alignItems: "center", gap: 3, padding: 2, font: "inherit" }}
        >
          <Heart size={13} fill={item.likedByMe ? "#fff" : "none"} /> {item.likes ?? 0}
        </button>
      </span>
    </div>
  );
}

// Full-screen image viewer (notes 18, 46). Optional delete action.
export function Lightbox({ item, onClose, onDelete }) {
  if (!item) return null;
  return (
    <div className="bf-modalwrap" style={{ alignItems: "center", background: "rgba(20,12,22,.86)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "88%", maxWidth: 340, display: "grid", gap: 12 }}>
        <div style={{ aspectRatio: "1", borderRadius: 20, background: item.img ? `url(${item.img}) center/cover` : item.grad, boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }} />
        {item.cap && <div style={{ color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 15 }}>{item.cap}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="bf-btn bf-btn-ghost" onClick={onClose}><X size={16} /> סגירה</button>
          {onDelete && <button className="bf-btn bf-btn-ghost" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { onDelete(item); onClose(); }}>מחיקה</button>}
        </div>
      </div>
    </div>
  );
}

export function NavBar({ tab, setTab, items }) {
  return (
    <div className="bf-nav">
      {items.map(([key, Icon, label]) => (
        <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
          <Icon size={21} strokeWidth={tab === key ? 2.4 : 1.9} />
          {label}
          {tab === key ? <span className="ndot" /> : <span style={{ height: 5 }} />}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
      <Icon size={16} color="var(--plum)" />
      <h2 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, flex: 1 }}>{children}</h2>
      {action}
    </div>
  );
}

export function Row({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
      <span style={{ color: "var(--muted)" }}>{k}</span>
      <span style={{ fontWeight: 700, textAlign: "left" }}>{v}</span>
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="bf-card" style={{ padding: 22, textAlign: "center", color: "var(--muted)", fontSize: 13.5, borderStyle: "dashed" }}>
      {children}
    </div>
  );
}

export function Back({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--plum)", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0, font: "inherit" }}>
      <ChevronRight size={18} /> {label}
    </button>
  );
}

export function Steps({ step }) {
  const labels = ["טיפול", "מועד", "אישור"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff", background: step >= i + 1 ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)" }}>{i + 1}</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: step >= i + 1 ? "var(--ink)" : "var(--muted)" }}>{l}</span>
          </div>
          {i < 2 && <span style={{ flex: 1, height: 2, background: step > i + 1 ? "var(--rose)" : "var(--sand)", borderRadius: 2 }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// Bottom sheet with swipe-down-to-close (note 14).
export function Sheet({ children, onClose }) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef(null);

  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 90) onClose();
    setDragY(0); startY.current = null;
  };

  return (
    <div className="bf-modalwrap" onClick={onClose}>
      <div
        className="bf-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ transform: dragY ? `translateY(${dragY}px)` : undefined, transition: dragY ? "none" : undefined }}
      >
        <div
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
          style={{ padding: "2px 0 10px", margin: "-6px 0 6px", cursor: "grab", touchAction: "none" }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "var(--sand)", margin: "0 auto" }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// Picks a file from the device — the OS lets the user choose camera OR
// gallery OR files (no `capture`, so it isn't forced to the camera) (note 15, 47).
export function PhotoPicker({ onPick, children, accept = "image/*" }) {
  const ref = useRef(null);
  return (
    <>
      <input ref={ref} type="file" accept={accept} hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      {React.cloneElement(children, { onClick: () => ref.current?.click() })}
    </>
  );
}

export function BitSheet({ amount, onClose, onPaid }) {
  const [state, setS] = useState("ready");
  const go = () => { setS("processing"); setTimeout(() => setS("done"), 1100); setTimeout(onPaid, 1900); };
  return (
    <Sheet onClose={state === "processing" ? () => {} : onClose}>
      <div style={{ textAlign: "center", padding: "6px 0 4px" }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: "#0099FF", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18, margin: "0 auto 12px" }}>bit</div>
        {state === "ready" && (<>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 22 }}>תשלום מאובטח</h3>
          <p style={{ color: "var(--muted)", fontSize: 13.5, margin: "0 0 6px" }}>הדגמה — חיבור אמיתי לביט יתווסף בהמשך</p>
          <div className="bf-display" style={{ fontSize: 34, fontWeight: 800, color: "var(--plum)", margin: "8px 0 16px" }}>₪{amount}</div>
          <button className="bf-btn bf-btn-primary" onClick={go}><ShieldCheck size={17} /> שלמי ₪{amount} בביט</button>
        </>)}
        {state === "processing" && (<>
          <h3 className="bf-display" style={{ margin: "12px 0", fontSize: 20 }}>מעבד תשלום…</h3>
          <div style={{ width: 34, height: 34, border: "3px solid var(--sand)", borderTopColor: "var(--plum)", borderRadius: "50%", margin: "8px auto 16px", animation: "spin 1s linear infinite" }} />
        </>)}
        {state === "done" && (<>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E7F3EC", display: "flex", alignItems: "center", justifyContent: "center", margin: "8px auto 12px" }}><Check size={30} color="#2E7D52" /></div>
          <h3 className="bf-display" style={{ margin: "0 0 4px", fontSize: 22 }}>שולם בהצלחה</h3>
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>מעדכן את התור…</p>
        </>)}
      </div>
    </Sheet>
  );
}

// Resolves display data for an appointment (all live now, but keeps the
// demo-fallback path harmless).
export function resolveAppt(a, clients) {
  if (a._live) {
    return { clientName: a.clientName, clientPhone: a.clientPhone, svcName: a.serviceName, svcDur: a.serviceDur, svcPrice: a.servicePrice, svcGrad: a.serviceGrad };
  }
  const c = (clients || []).find((x) => x.id === a.clientId);
  const s = svc(a.service);
  return { clientName: c?.name, clientPhone: c?.phone, svcName: s?.name, svcDur: s?.dur, svcPrice: s?.price, svcGrad: s?.grad };
}
