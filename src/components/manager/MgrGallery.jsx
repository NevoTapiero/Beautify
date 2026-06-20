import React, { useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { GalleryTile, Empty } from "../ui";

export default function MgrGallery({ gallery, pending, approvePhoto, rejectPhoto, ping }) {
  const [seg, setSeg] = useState("mine");

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div className="bf-seg">
        <button className={seg === "mine" ? "active" : ""} onClick={() => setSeg("mine")}>הגלריה שלי ({gallery.length})</button>
        <button className={seg === "pend" ? "active" : ""} onClick={() => setSeg("pend")}>לאישור ({pending.length})</button>
      </div>

      {seg === "mine" && (<>
        <button className="bf-btn bf-btn-ghost" onClick={() => ping("נפתחת המצלמה להעלאת עבודה")}><Camera size={17} /> העלאת עבודה חדשה</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {gallery.map((g) => <GalleryTile key={g.id} item={g} onLike={() => {}} />)}
        </div>
      </>)}

      {seg === "pend" && (<>
        {pending.length === 0 && <Empty>אין תמונות שממתינות לאישור 🤍</Empty>}
        <div style={{ display: "grid", gap: 12 }}>
          {pending.map((p) => (
            <div key={p.id} className="bf-card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 66, height: 66, borderRadius: 14, background: p.grad, flex: "none", boxShadow: "inset 0 -14px 18px -14px rgba(0,0,0,.4)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.cap}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>הועלה ע״י {p.by}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button aria-label="אישור" className="bf-btn bf-btn-primary bf-btn-sm" onClick={() => { approvePhoto(p); ping("התמונה אושרה ונוספה לגלריה"); }}><Check size={16} /></button>
                <button aria-label="דחייה" className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => { rejectPhoto(p.id); ping("התמונה נדחתה"); }}><X size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </>)}
    </div>
  );
}
