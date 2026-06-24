import React, { useState } from "react";
import { Camera, Check, X, Pencil, RefreshCw } from "lucide-react";
import { GalleryTile, Lightbox, PhotoPicker, Empty, Sheet, GallerySort, sortGallery, cosmeticians } from "../ui";

export default function MgrGallery({ mgr }) {
  const [seg, setSeg] = useState("mine");
  const [sort, setSort] = useState("new");
  const [view, setView] = useState(null);       // lightbox item
  const [editing, setEditing] = useState(null);  // photo whose caption is being edited
  const [pickedFile, setPickedFile] = useState(null);
  const [cap, setCap] = useState("");
  const [pickedEmp, setPickedEmp] = useState(null);
  const [cosm, setCosm] = useState("all");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const cosmList = cosmeticians(mgr.studioName, mgr.employees);
  const showCosm = mgr.business && cosmList.length > 1;
  const shown = (list) => cosm === "all" ? list : list.filter((g) => (g.employeeId || "owner") === cosm);

  const doUpload = async () => {
    setBusy(true);
    await mgr.uploadPhoto(pickedFile, cap, pickedEmp === "owner" ? null : pickedEmp);
    setBusy(false); setPickedFile(null); setCap(""); setPickedEmp(null);
  };
  const doRefresh = async () => { setRefreshing(true); await mgr.refresh(); setRefreshing(false); };

  return (
    <div className="bf-pad" style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div className="bf-seg" style={{ flex: 1 }}>
          <button className={seg === "mine" ? "active" : ""} onClick={() => setSeg("mine")}>הגלריה שלי ({mgr.gallery.length})</button>
          <button className={seg === "pend" ? "active" : ""} onClick={() => setSeg("pend")}>לאישור ({mgr.pending.length})</button>
        </div>
        <button onClick={doRefresh} disabled={refreshing} aria-label="רענון" style={{ background: "none", border: "1px solid var(--sand)", borderRadius: 12, padding: 9, cursor: "pointer", color: "var(--plum)" }}>
          <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
      </div>

      {seg === "mine" && (<>
        <PhotoPicker accept="image/*,video/*" onPick={(f) => { setPickedFile(f); setCap(""); }}
          onTooBig={(mb) => mgr.ping(`הקובץ גדול מדי (${mb}MB). המקסימום 50MB — נסי סרטון קצר יותר.`)}>
          <button className="bf-btn bf-btn-ghost"><Camera size={17} /> העלאת תמונה או סרטון</button>
        </PhotoPicker>
        {mgr.gallery.length === 0 && <Empty>עדיין אין תמונות בגלריה — העלי את העבודה הראשונה 🤍</Empty>}
        {mgr.gallery.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
            <span style={{ fontSize: 12.5, color: "var(--muted)" }}>סינון:</span>
            <GallerySort value={sort} onChange={setSort} />
          </div>
        )}
        {showCosm && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => setCosm("all")} className={"bf-chip " + (cosm === "all" ? "bf-chip-rose" : "bf-chip-wait")} style={{ cursor: "pointer", border: "none" }}>הכל</button>
            {cosmList.map((c) => (
              <button key={c.id} onClick={() => setCosm(c.id)} className={"bf-chip " + (cosm === c.id ? "bf-chip-rose" : "bf-chip-wait")} style={{ cursor: "pointer", border: "none" }}>{c.name}</button>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {sortGallery(shown(mgr.gallery), sort).map((g) => (
            <div key={g.id} style={{ position: "relative" }}>
              <GalleryTile item={g} onOpen={setView} />
              <button aria-label="עריכת תיאור" onClick={(e) => { e.stopPropagation(); setEditing(g); }}
                style={{ position: "absolute", insetInlineStart: 7, top: 7, width: 28, height: 28, borderRadius: 9, border: "none", cursor: "pointer", background: "rgba(255,255,255,.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Pencil size={14} color="var(--plum)" />
              </button>
            </div>
          ))}
        </div>
      </>)}

      {seg === "pend" && (<>
        {mgr.pending.length === 0 && <Empty>אין תמונות שממתינות לאישור 🤍</Empty>}
        <div style={{ display: "grid", gap: 12 }}>
          {mgr.pending.map((p) => (
            <div key={p.id} className="bf-card" style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
              <div onClick={() => setView(p)} style={{ width: 66, height: 66, borderRadius: 14, background: p.img ? `url(${p.img}) center/cover` : "var(--rose-soft)", flex: "none", cursor: "pointer" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{p.cap}</span>
                  <button aria-label="עריכת תיאור" onClick={() => setEditing(p)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 0 }}><Pencil size={13} /></button>
                </div>
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

      {view && <Lightbox item={view} onClose={() => setView(null)} onEdit={(it) => { setView(null); setEditing(it); }} onDelete={(it) => mgr.deletePhoto(it.id)} />}

      {editing && <CaptionEditor photo={editing} mgr={mgr} onClose={() => setEditing(null)} />}

      {pickedFile && (
        <Sheet onClose={() => setPickedFile(null)}>
          <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>העלאת עבודה</h3>
          {pickedFile.type?.startsWith("video")
            ? <video src={URL.createObjectURL(pickedFile)} controls playsInline style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 16, marginBottom: 14, background: "#000" }} />
            : <div style={{ height: 170, borderRadius: 16, background: `url(${URL.createObjectURL(pickedFile)}) center/cover`, marginBottom: 14 }} />}
          <label className="bf-label">תיאור קצר</label>
          <input className="bf-input" placeholder="לדוגמה: פרנץ' ורוד" value={cap} onChange={(e) => setCap(e.target.value)} />
          {showCosm && (<>
            <label className="bf-label" style={{ marginTop: 12 }}>מי ביצעה את הטיפול?</label>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {cosmList.map((c) => (
                <button key={c.id} onClick={() => setPickedEmp(c.id)} className={"bf-slot" + (pickedEmp === c.id ? " active" : "")} style={{ flex: "1 0 30%" }}>{c.name}</button>
              ))}
            </div>
          </>)}
          <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={busy || (showCosm && !pickedEmp)} onClick={doUpload}>
            {busy ? "מעלה…" : "הוספה לגלריה"}
          </button>
        </Sheet>
      )}
    </div>
  );
}

function CaptionEditor({ photo, mgr, onClose }) {
  const [text, setText] = useState(photo.cap || "");
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await mgr.updateCaption(photo.id, text); setBusy(false); onClose(); };
  return (
    <Sheet onClose={onClose}>
      <h3 className="bf-display" style={{ margin: "0 0 12px", fontSize: 20 }}>עריכת תיאור</h3>
      <div style={{ height: 120, borderRadius: 14, background: photo.img ? `url(${photo.img}) center/cover` : "var(--rose-soft)", marginBottom: 14 }} />
      <label className="bf-label">תיאור</label>
      <input className="bf-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="תיאור התמונה" />
      <button className="bf-btn bf-btn-primary" style={{ marginTop: 14 }} disabled={busy} onClick={save}>{busy ? "שומרת…" : "שמירה"}</button>
    </Sheet>
  );
}
