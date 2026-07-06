import React, { useState, useRef } from "react";
import { Heart, Clock, CheckCircle2, Bell, ChevronRight, Check, X, XCircle, Play, Camera } from "lucide-react";

export const initials = (n) => (n || "").split(" ").map((w) => w[0]).slice(0, 2).join("");

// True if a stored URL points to a video clip.
export const isVideoUrl = (u) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(u || "");

export function Avatar({ name, src }) {
  if (src) return <img className="bf-avatar" src={src} alt={name} style={{ objectFit: "cover" }} />;
  return <div className="bf-avatar">{initials(name)}</div>;
}

// Status of an appointment from the manager's view (note 32 — no "awaiting approval").
export function StatusChip({ a }) {
  if (a.status === "completed") return <span className="bf-chip bf-chip-ok"><Check size={12} /> בוצע</span>;
  if (a.status === "no_show")   return <span className="bf-chip" style={{ background: "#F3E3E5", color: "#B23A48" }}><XCircle size={12} /> לא הגיעה</span>;
  if (a.status === "reschedule_requested") return <span className="bf-chip" style={{ background: "#EDE6F0", color: "#6B4E7A" }}><Clock size={12} /> ממתינה להזזה</span>;
  if (a.arrival)                return <span className="bf-chip bf-chip-ok"><CheckCircle2 size={12} /> אישרה הגעה</span>;
  return <span className="bf-chip bf-chip-rose"><Bell size={12} /> טרם אישרה</span>;
}

export function PaidChip({ paid }) {
  return paid
    ? <span className="bf-chip bf-chip-ok"><Check size={12} /> שולם</span>
    : <span className="bf-chip bf-chip-wait"><Clock size={12} /> לא שולם</span>;
}

export function GalleryTile({ item, onLike, onOpen }) {
  const video = isVideoUrl(item.img);
  return (
    <div className="bf-tile" style={{ background: video ? "#000" : (item.img ? `url(${item.img}) center/cover` : item.grad) }} onClick={() => onOpen?.(item)}>
      {video && <video src={item.img} muted playsInline preload="metadata" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
      {video && (
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={18} color="#fff" fill="#fff" />
          </span>
        </span>
      )}
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

// Full-screen image viewer (notes 18, 46). Optional edit/delete actions.
export function Lightbox({ item, onClose, onEdit, onDelete }) {
  if (!item) return null;
  const video = isVideoUrl(item.img);
  return (
    <div className="bf-modalwrap" style={{ alignItems: "center", background: "rgba(20,12,22,.86)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "88%", maxWidth: 340, display: "grid", gap: 12 }}>
        <div style={{ position: "relative" }}>
          {video
            ? <video src={item.img} controls autoPlay playsInline style={{ width: "100%", borderRadius: 20, maxHeight: "60vh", background: "#000", boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }} />
            : <div style={{ aspectRatio: "1", borderRadius: 20, background: item.img ? `url(${item.img}) center/cover` : item.grad, boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }} />}
          <button className="bf-photo-x" aria-label="סגירה" onClick={onClose}><X size={17} /></button>
        </div>
        {item.cap && <div style={{ color: "#fff", textAlign: "center", fontWeight: 700, fontSize: 15 }}>{item.cap}</div>}
        {(onEdit || onDelete) && (
          <div style={{ display: "flex", gap: 10 }}>
            {onEdit && <button className="bf-btn bf-btn-ghost" onClick={() => onEdit(item)}>עריכת תיאור</button>}
            {onDelete && <button className="bf-btn bf-btn-ghost" style={{ color: "#B23A48", borderColor: "#F0CBD0" }} onClick={() => { onDelete(item); onClose(); }}>מחיקה</button>}
          </div>
        )}
      </div>
    </div>
  );
}

// Tap-to-enlarge a profile photo (own, an employee's, a client's…). If
// `onUpload` is given, an "עריכת תמונה" action appears that reuses PhotoPicker
// — enlarge is always the first tap, editing is a deliberate second step.
export function PhotoEnlarge({ src, name, onClose, onUpload, onTooBig }) {
  return (
    <div className="bf-modalwrap" style={{ alignItems: "center", background: "rgba(20,12,22,.86)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "88%", maxWidth: 340, display: "grid", gap: 12 }}>
        <div style={{ position: "relative" }}>
          {src
            ? <div style={{ aspectRatio: "1", borderRadius: 20, background: `url(${src}) center/cover`, boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }} />
            : <div style={{ aspectRatio: "1", borderRadius: 20, background: "var(--plum)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 64, boxShadow: "0 30px 60px -20px rgba(0,0,0,.7)" }}>{initials(name)}</div>}
          <button className="bf-photo-x" aria-label="סגירה" onClick={onClose}><X size={17} /></button>
        </div>
        {onUpload && (
          <PhotoPicker onPick={(f) => { onUpload(f); onClose(); }} onTooBig={onTooBig}>
            <button className="bf-btn bf-btn-primary"><Camera size={16} /> עריכת תמונה</button>
          </PhotoPicker>
        )}
      </div>
    </div>
  );
}

export function NavBar({ tab, setTab, items }) {
  // Pure CSS-logical positioning — no measurement needed. `insetInlineStart`
  // counts from the inline-start edge, i.e. the same edge flex-row items
  // start filling from, in *either* direction. So item index i always sits
  // at i * (100/n)% regardless of LTR/RTL — no manual left/right math, no
  // getBoundingClientRect/offsetLeft, no re-measure-on-font-load fragility.
  const n = items.length;
  const idx = items.findIndex(([key]) => key === tab);

  return (
    <div className="bf-nav">
      {idx >= 0 && (
        <span className="bf-nav-indicator" style={{ width: `${100 / n}%`, insetInlineStart: `${(100 / n) * idx}%` }} />
      )}
      {items.map(([key, Icon, label, badge]) => (
        <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
          <span style={{ position: "relative", display: "inline-flex" }}>
            <Icon size={21} strokeWidth={tab === key ? 2.4 : 1.9} />
            {(badge === "!" || badge > 0) && (
              <span style={{ position: "absolute", top: -6, insetInlineEnd: -10, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--rose)", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--surface)" }}>
                {badge === "!" ? "!" : badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          {label}
          {tab === key ? <span className="ndot" /> : <span style={{ height: 5 }} />}
        </button>
      ))}
    </div>
  );
}

// Wraps tab content so switching tabs slides/fades the new pane in — direction
// tracks whether the new tab sits after or before the previous one in `order`.
export function TabPane({ tab, order, children }) {
  const prevIndex = useRef(order.indexOf(tab));
  const dir = useRef("fwd");
  const idx = order.indexOf(tab);
  if (idx !== prevIndex.current) {
    dir.current = idx > prevIndex.current ? "fwd" : "back";
    prevIndex.current = idx;
  }
  return <div key={tab} className={"bf-tabpane" + (dir.current === "back" ? " back" : "")}>{children}</div>;
}

// Confirmation popup so destructive taps (cancel an appointment, etc.) can't
// happen by accident (V6 notes 23, 34).
export function Confirm({ title, body, confirmLabel = "אישור", cancelLabel = "חזרה", danger, onConfirm, onClose }) {
  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 6px", fontSize: 20 }}>{title}</h3>
      {body && <div style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 16, lineHeight: 1.6 }}>{body}</div>}
      <button
        className={"bf-btn " + (danger ? "bf-btn-ghost" : "bf-btn-primary")}
        style={danger ? { color: "#B23A48", borderColor: "#F0CBD0" } : undefined}
        onClick={() => { onConfirm(); onClose(); }}
      >{confirmLabel}</button>
      <button className="bf-btn bf-btn-ghost" style={{ marginTop: 10 }} onClick={onClose}>{cancelLabel}</button>
    </Sheet>
  );
}

// The health declaration / terms text (single source — pending lawyer review).
export function HealthDeclarationText() {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.7, color: "#5b4a52", display: "grid", gap: 8 }}>
      <p>אני מאשרת קבלת טיפולי קוסמטיקה בסטודיו ומצהירה כי איני סובלת ממצב רפואי, אלרגיה או רגישות העלולים להשפיע על הטיפול, ואם קיים — עדכנתי על כך מראש.</p>
      <p>ידוע לי כי ביטול תור ייעשה עד 24 שעות מראש, וכי באי-הגעה ללא הודעה הסטודיו רשאי לגבות דמי ביטול בהתאם למדיניות.</p>
      <p>אני מאשרת שמירת פרטי ההתקשרות והיסטוריית הטיפולים שלי לצורך מתן השירות, בהתאם למדיניות הפרטיות.</p>
      <p>שיתוף תמונות בגלריה ייעשה רק באישורי המפורש ובאישור הסטודיו.</p>
    </div>
  );
}

// The selectable cosmetician list = the owner (studio) + her employees.
// The owner is represented with id "owner"; an employee_id of null means the owner.
export const cosmeticians = (studioName, employees, ownerAvatar) =>
  [{ id: "owner", name: studioName, color: "#7C2A53", avatar: ownerAvatar, owner: true }, ...(employees || [])];

// Resolve a cosmetician's display name from an appointment/photo employee_id
// (null = the owner).
export const cosmeticianName = (id, employees, studioName) =>
  id ? ((employees || []).find((e) => e.id === id) || {}).name || "—" : studioName;

// Background for a service swatch — her chosen image, else the gradient (note 43).
export const serviceBg = (sv) => (sv && sv.img) ? `url(${sv.img}) center/cover` : (sv ? sv.grad : "var(--sand)");

// Sort a gallery list by newest / oldest / most-liked (V6.1 notes 20, 40).
export function sortGallery(items, sort) {
  const a = [...(items || [])];
  if (sort === "likes") a.sort((x, y) => (y.likes || 0) - (x.likes || 0));
  else if (sort === "old") a.sort((x, y) => new Date(x.created || 0) - new Date(y.created || 0));
  else a.sort((x, y) => new Date(y.created || 0) - new Date(x.created || 0));
  return a;
}

// Small dropdown to choose the gallery sort order.
export function GallerySort({ value, onChange }) {
  return (
    <select className="bf-input" value={value} onChange={(e) => onChange(e.target.value)}
      style={{ padding: "8px 10px", fontSize: 13, width: "auto" }}>
      <option value="new">החדשות ביותר</option>
      <option value="old">הישנות ביותר</option>
      <option value="likes">הכי אהובות</option>
    </select>
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
            <span style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: step >= i + 1 ? "var(--btn-ink)" : "var(--muted)", background: step >= i + 1 ? "linear-gradient(135deg,var(--plum),var(--rose))" : "var(--sand)" }}>{i + 1}</span>
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

// Largest file we accept for upload (Supabase free-tier cap). Keeps a huge
// video from hanging the browser (note 16).
export const MAX_UPLOAD_MB = 50;

// Picks a file from the device — the OS lets the user choose camera OR
// gallery OR files (no `capture`, so it isn't forced to the camera) (note 15, 47).
// Rejects oversized files with a message via onTooBig.
export function PhotoPicker({ onPick, onTooBig, children, accept = "image/*" }) {
  const ref = useRef(null);
  const handle = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      onTooBig?.(Math.round(f.size / (1024 * 1024)));
      return;
    }
    onPick(f);
  };
  return (
    <>
      <input ref={ref} type="file" accept={accept} hidden onChange={handle} />
      {React.cloneElement(children, { onClick: () => ref.current?.click() })}
    </>
  );
}

// Pulls display fields off a (live) appointment row.
export function resolveAppt(a) {
  return {
    clientName: a.clientName, clientPhone: a.clientPhone,
    svcName: a.serviceName, svcDur: a.serviceDur, svcPrice: a.servicePrice, svcGrad: a.serviceGrad,
  };
}
