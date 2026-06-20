import React, { useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { GalleryTile, Lightbox, PhotoPicker, Empty, Sheet } from "../ui";

export default function MgrGallery({ mgr }) {
  const [seg, setSeg] = useState("mine");
  const [view, setView] = useState(null);     // lightbox item
  const [pickedFile, setPickedFile] = useState(null);
  const [cap, setCap] = useState("");
  const [busy, setBusy] = useState(false);

  const doUpload = async () => {
    setBusy(true);
    await mgr.uploadPhoto(pickedFile, cap);
    setBusy(false); setPickedFile(null); setCap("");
  };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div className="bf-seg">
        <button className={seg === "mine" ? "active" : ""} onClick={() => setSeg("mine")}>הגלריה שלי ({mgr.gallery.length})</button>
        <button className={seg === "pend" ? "active" : ""} onClick={() => setSeg("pend")}>לאישור ({mgr.pending.length})</button>
      </div>

      {seg === "mine" && (<>
        <PhotoPicker onPick={(f) => { setPickedFile(f); setCap(""); }}>
          <button className="bf-btn bf-btn-ghost"><Camera size={17} /> העלאת עבודה חדשה</button>
        </PhotoPicker>
        {mgr.gallery.length === 0 && <Empty>עדיין אין תמונות בגלריה — העלי את העבודה הראשונה 🤍</Empty>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {mgr.gallery.map((g) => <GalleryTile key={g.id} item={g} onOpen={setView} />)}
        </div>
      </>)}

      {seg === "pend" && (<>
        {mgr.pending.length === 0 && <Empty>אין תמונות שממתינות לאישור 🤍</Empty>}
        <div style={{ display: "grid", gap: 12 }}>
          {mgr.pending.map((p) => (
            <div key={p.id} className="bf-card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <div onClick={() => setView(p)} style={{ width: 66, height: 66, borderRadius: 14, background: p.img ? `url(${p.img}) center/cover` : "var(--rose-soft)", flex: "none", cursor: "pointer" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.cap}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>הועלה ע״י {p.by}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button aria-label="אישור" className="bf-btn bf-btn-primary bf-btn-sm" onClick={() => mgr.approvePhoto(p.id)}><Check size={16} /></button>
                <button aria-label="דחייה" className="bf-btn bf-btn-ghost bf-btn-sm" onClick={() => mgr.rejectPhoto(p.id)}><X size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {view && <Lightbox item={view} onClose={() => setView(null)} onDelete={(it) => mgr.deletePhoto(it.id)} />}

      {pickedFile && (
        <Sheet onClose={() => setPickedFile(null)}>
          <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>העלאת עבודה</h3>
          <div style={{ height: 170, borderRadius: 16, background: `url(${URL.createObjectURL(pickedFile)}) center/cover`, marginBottom: 14 }} />
          <label className="bf-label">תיאור קצר</label>
          <input className="bf-input" placeholder="לדוגמה: פרנץ' ורוד" value={cap} onChange={(e) => setCap(e.target.value)} />
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={busy} onClick={doUpload}>
            {busy ? "מעלה…" : "הוספה לגלריה"}
          </button>
        </Sheet>
      )}
    </div>
  );
}
